import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { MongoClient, Db, Collection } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parser
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dsugarjot',
  api_key: process.env.CLOUDINARY_API_KEY || '699116238718778',
  api_secret: process.env.CLOUDINARY_API_SECRET || '-9ieAMucNmKIzgK-11c_6tVhqgY',
  secure: true,
});

// Database Interfaces
interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  passwordHash: string;
  salt: string;
  settings: {
    debitLabel: 'Debit' | 'Take' | 'Liya';
    creditLabel: 'Credit' | 'Give' | 'Diya';
    currencySymbol: string;
  };
  createdAt: string;
}

interface StoredExpense {
  id: string;
  userId: string;
  name: string;
  initialAmount: number;
  category?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

interface StoredTransaction {
  id: string;
  expenseId: string;
  userId: string;
  title: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  date: string;
  time: string;
  notes?: string;
  receiptUrl?: string;
  paymentMethod?: 'Cash' | 'UPI' | 'Card' | 'Net Banking' | 'Other';
  createdAt: string;
}

interface StoredSession {
  token: string;
  userId: string;
  createdAt: string;
}

// MongoDB Setup
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://Avdhesh1:ya4XYnQUEtYhv5kr@cluster0.0uojesi.mongodb.net/Noteruppee';

const mongoClient = new MongoClient(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 20,
});

let db: Db | null = null;
let usersCol: Collection<StoredUser>;
let sessionsCol: Collection<StoredSession>;
let expensesCol: Collection<StoredExpense>;
let transactionsCol: Collection<StoredTransaction>;

// In-memory fallback if MongoDB connection drops temporarily
const fallbackDb = {
  users: [] as StoredUser[],
  sessions: [] as StoredSession[],
  expenses: [] as StoredExpense[],
  transactions: [] as StoredTransaction[],
};

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

async function initMongoConnection() {
  try {
    await mongoClient.connect();
    db = mongoClient.db();
    usersCol = db.collection<StoredUser>('users');
    sessionsCol = db.collection<StoredSession>('sessions');
    expensesCol = db.collection<StoredExpense>('expenses');
    transactionsCol = db.collection<StoredTransaction>('transactions');

    // Create unique and indexing constraints
    try {
      await usersCol.createIndex({ email: 1 }, { unique: true });
      await sessionsCol.createIndex({ token: 1 }, { unique: true });
      await expensesCol.createIndex({ userId: 1 });
      await transactionsCol.createIndex({ userId: 1 });
      await transactionsCol.createIndex({ expenseId: 1 });
    } catch (idxErr) {
      console.warn('Index verification info:', idxErr);
    }

    console.log('✅ Successfully connected to MongoDB database "Noteruppee"!');
  } catch (err: any) {
    console.error('⚠️ Could not connect to MongoDB cluster, will retry on request:', err.message);
  }
}

// Helper to check MongoDB readiness or attempt reconnection
async function getCollections() {
  if (db && usersCol && sessionsCol && expensesCol && transactionsCol) {
    return { usersCol, sessionsCol, expensesCol, transactionsCol, isMongo: true };
  }

  try {
    await mongoClient.connect();
    db = mongoClient.db();
    usersCol = db.collection<StoredUser>('users');
    sessionsCol = db.collection<StoredSession>('sessions');
    expensesCol = db.collection<StoredExpense>('expenses');
    transactionsCol = db.collection<StoredTransaction>('transactions');
    return { usersCol, sessionsCol, expensesCol, transactionsCol, isMongo: true };
  } catch {
    return {
      usersCol: null as any,
      sessionsCol: null as any,
      expensesCol: null as any,
      transactionsCol: null as any,
      isMongo: false,
    };
  }
}

// Authentication Middleware
async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const { sessionsCol: sCol, usersCol: uCol, isMongo } = await getCollections();

    let userId: string | null = null;
    if (isMongo) {
      const session = await sCol.findOne({ token });
      if (session) userId = session.userId;
    } else {
      const session = fallbackDb.sessions.find((s) => s.token === token);
      if (session) userId = session.userId;
    }

    if (!userId) {
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    }

    let user: StoredUser | null = null;
    if (isMongo) {
      user = await uCol.findOne({ id: userId });
    } else {
      user = fallbackDb.users.find((u) => u.id === userId) || null;
    }

    if (!user) {
      return res.status(401).json({ error: 'User account not found' });
    }

    (req as any).user = user;
    next();
  } catch (err: any) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal authentication error' });
  }
}

// ==================== AUTH ROUTES ====================

// Register a real account in MongoDB
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { name, email, password, phone, location, currencySymbol } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const { usersCol: uCol, sessionsCol: sCol, isMongo } = await getCollections();

    // Check if email already exists
    let existingUser: StoredUser | null = null;
    if (isMongo) {
      existingUser = await uCol.findOne({ email: normalizedEmail });
    } else {
      existingUser = fallbackDb.users.find((u) => u.email.toLowerCase() === normalizedEmail) || null;
    }

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const newUser: StoredUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || '',
      location: location?.trim() || '',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=2563eb,1d4ed8`,
      passwordHash,
      salt,
      settings: {
        debitLabel: 'Debit',
        creditLabel: 'Credit',
        currencySymbol: currencySymbol || '₹',
      },
      createdAt: new Date().toISOString(),
    };

    const token = crypto.randomBytes(32).toString('hex');
    const sessionDoc: StoredSession = {
      token,
      userId: newUser.id,
      createdAt: new Date().toISOString(),
    };

    if (isMongo) {
      await uCol.insertOne(newUser as any);
      await sCol.insertOne(sessionDoc as any);
    } else {
      fallbackDb.users.push(newUser);
      fallbackDb.sessions.push(sessionDoc);
    }

    const { passwordHash: _, salt: __, ...userProfile } = newUser;
    res.status(201).json({ token, user: userProfile });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// Login real account from MongoDB
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const { usersCol: uCol, sessionsCol: sCol, isMongo } = await getCollections();

    let user: StoredUser | null = null;
    if (isMongo) {
      user = await uCol.findOne({ email: normalizedEmail });
    } else {
      user = fallbackDb.users.find((u) => u.email.toLowerCase() === normalizedEmail) || null;
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const hash = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const sessionDoc: StoredSession = {
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };

    if (isMongo) {
      await sCol.insertOne(sessionDoc as any);
    } else {
      fallbackDb.sessions.push(sessionDoc);
    }

    const { passwordHash: _, salt: __, ...userProfile } = user;
    res.json({ token, user: userProfile });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login service encountered an issue' });
  }
});

// Demo Login endpoint - Disabled per user request
app.all('/api/auth/demo', (_req: Request, res: Response) => {
  res.status(400).json({
    error: 'Demo login has been removed. Please create an account or sign in with your email and password.',
  });
});

// Current user profile
app.get('/api/auth/me', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { passwordHash: _, salt: __, ...userProfile } = user;
  res.json({ user: userProfile });
});

// Logout
app.post('/api/auth/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      const { sessionsCol: sCol, isMongo } = await getCollections();
      if (isMongo) {
        await sCol.deleteOne({ token });
      } else {
        fallbackDb.sessions = fallbackDb.sessions.filter((s) => s.token !== token);
      }
    } catch (err) {
      console.warn('Logout cleanup warning:', err);
    }
  }
  res.json({ success: true });
});

// Update Profile & Settings in MongoDB
app.put('/api/auth/profile', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { name, phone, location, avatarUrl, settings } = req.body;

  const updates: Partial<StoredUser> = {};
  if (name && name.trim()) updates.name = name.trim();
  if (phone !== undefined) updates.phone = phone.trim();
  if (location !== undefined) updates.location = location.trim();
  if (avatarUrl) updates.avatarUrl = avatarUrl;

  const newSettings = { ...user.settings };
  if (settings) {
    if (['Debit', 'Take', 'Liya'].includes(settings.debitLabel)) {
      newSettings.debitLabel = settings.debitLabel;
    }
    if (['Credit', 'Give', 'Diya'].includes(settings.creditLabel)) {
      newSettings.creditLabel = settings.creditLabel;
    }
    if (settings.currencySymbol) {
      newSettings.currencySymbol = settings.currencySymbol;
    }
    updates.settings = newSettings;
  }

  try {
    const { usersCol: uCol, isMongo } = await getCollections();
    if (isMongo) {
      await uCol.updateOne({ id: user.id }, { $set: updates });
    } else {
      Object.assign(user, updates);
    }

    const updatedUser = { ...user, ...updates };
    const { passwordHash: _, salt: __, ...userProfile } = updatedUser;
    res.json({ user: userProfile });
  } catch (err: any) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change Password in MongoDB
app.post('/api/auth/change-password', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'All password fields are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New password and confirmation do not match' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const oldHash = hashPassword(oldPassword, user.salt);
  if (oldHash !== user.passwordHash) {
    return res.status(400).json({ error: 'Incorrect old password' });
  }

  const newHash = hashPassword(newPassword, user.salt);

  try {
    const { usersCol: uCol, isMongo } = await getCollections();
    if (isMongo) {
      await uCol.updateOne({ id: user.id }, { $set: { passwordHash: newHash } });
    } else {
      user.passwordHash = newHash;
    }
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// ==================== EXPENSES CRUD (MongoDB) ====================

// Get all expenses for current user
app.get('/api/expenses', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;

  try {
    const { expensesCol: eCol, isMongo } = await getCollections();
    let userExpenses: StoredExpense[] = [];
    if (isMongo) {
      userExpenses = await eCol.find({ userId: user.id }).sort({ createdAt: -1 }).toArray();
    } else {
      userExpenses = fallbackDb.expenses.filter((e) => e.userId === user.id);
    }
    res.json({ expenses: userExpenses });
  } catch (err: any) {
    console.error('Get expenses error:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Create new expense in MongoDB
app.post('/api/expenses', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { name, initialAmount, category, color } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Expense name is required' });
  }

  const parsedAmount = Math.max(0, Number(initialAmount) || 0);

  const newExpense: StoredExpense = {
    id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    name: name.trim(),
    initialAmount: parsedAmount,
    category: category || 'General',
    color: color || '#2563EB',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const { expensesCol: eCol, isMongo } = await getCollections();
    if (isMongo) {
      await eCol.insertOne(newExpense as any);
    } else {
      fallbackDb.expenses.unshift(newExpense);
    }
    res.status(201).json({ expense: newExpense });
  } catch (err: any) {
    console.error('Create expense error:', err);
    res.status(500).json({ error: 'Failed to save expense account' });
  }
});

// Update expense in MongoDB
app.put('/api/expenses/:id', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { id } = req.params;
  const { name, initialAmount, category, color } = req.body;

  const updates: Partial<StoredExpense> = {
    updatedAt: new Date().toISOString(),
  };

  if (name !== undefined && name.trim()) updates.name = name.trim();
  if (initialAmount !== undefined) updates.initialAmount = Math.max(0, Number(initialAmount) || 0);
  if (category !== undefined) updates.category = category;
  if (color !== undefined) updates.color = color;

  try {
    const { expensesCol: eCol, isMongo } = await getCollections();
    if (isMongo) {
      const result = await eCol.findOneAndUpdate(
        { id, userId: user.id },
        { $set: updates },
        { returnDocument: 'after' }
      );
      if (!result) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      res.json({ expense: result });
    } else {
      const expense = fallbackDb.expenses.find((e) => e.id === id && e.userId === user.id);
      if (!expense) return res.status(404).json({ error: 'Expense not found' });
      Object.assign(expense, updates);
      res.json({ expense });
    }
  } catch (err: any) {
    console.error('Update expense error:', err);
    res.status(500).json({ error: 'Failed to update expense account' });
  }
});

// Delete expense and all associated transactions from MongoDB
app.delete('/api/expenses/:id', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { id } = req.params;

  try {
    const { expensesCol: eCol, transactionsCol: tCol, isMongo } = await getCollections();
    if (isMongo) {
      await eCol.deleteOne({ id, userId: user.id });
      await tCol.deleteMany({ expenseId: id, userId: user.id });
    } else {
      fallbackDb.expenses = fallbackDb.expenses.filter((e) => !(e.id === id && e.userId === user.id));
      fallbackDb.transactions = fallbackDb.transactions.filter((t) => t.expenseId !== id);
    }
    res.json({ success: true, message: 'Expense and associated transactions deleted' });
  } catch (err: any) {
    console.error('Delete expense error:', err);
    res.status(500).json({ error: 'Failed to delete expense account' });
  }
});

// ==================== TRANSACTIONS CRUD (MongoDB) ====================

// Get all transactions for current user
app.get('/api/transactions', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { expenseId } = req.query;

  try {
    const { transactionsCol: tCol, isMongo } = await getCollections();
    const query: any = { userId: user.id };
    if (expenseId && typeof expenseId === 'string' && expenseId !== 'ALL') {
      query.expenseId = expenseId;
    }

    let userTransactions: StoredTransaction[] = [];
    if (isMongo) {
      userTransactions = await tCol.find(query).sort({ date: -1, createdAt: -1 }).toArray();
    } else {
      userTransactions = fallbackDb.transactions.filter((t) => {
        if (t.userId !== user.id) return false;
        if (expenseId && expenseId !== 'ALL' && t.expenseId !== expenseId) return false;
        return true;
      });
    }

    res.json({ transactions: userTransactions });
  } catch (err: any) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create new transaction in MongoDB
app.post('/api/transactions', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { expenseId, title, amount, type, date, time, notes, receiptUrl, paymentMethod } = req.body;

  if (!expenseId || !title || amount === undefined || !type) {
    return res.status(400).json({ error: 'Expense ID, title, amount, and type are required' });
  }

  const numAmount = Math.max(0, Number(amount) || 0);
  if (numAmount <= 0) {
    return res.status(400).json({ error: 'Transaction amount must be greater than 0' });
  }

  const now = new Date();
  const txDate = date || now.toISOString().split('T')[0];
  const txTime = time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newTransaction: StoredTransaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    expenseId,
    userId: user.id,
    title: title.trim(),
    amount: numAmount,
    type: type === 'CREDIT' ? 'CREDIT' : 'DEBIT',
    date: txDate,
    time: txTime,
    notes: notes?.trim() || '',
    receiptUrl: receiptUrl || '',
    paymentMethod: paymentMethod || 'UPI',
    createdAt: new Date().toISOString(),
  };

  try {
    const { transactionsCol: tCol, expensesCol: eCol, isMongo } = await getCollections();
    if (isMongo) {
      await tCol.insertOne(newTransaction as any);
      await eCol.updateOne({ id: expenseId, userId: user.id }, { $set: { updatedAt: new Date().toISOString() } });
    } else {
      fallbackDb.transactions.unshift(newTransaction);
      const exp = fallbackDb.expenses.find((e) => e.id === expenseId && e.userId === user.id);
      if (exp) exp.updatedAt = new Date().toISOString();
    }
    res.status(201).json({ transaction: newTransaction });
  } catch (err: any) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Failed to record transaction' });
  }
});

// Update transaction in MongoDB
app.put('/api/transactions/:id', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { id } = req.params;
  const { title, amount, type, date, time, notes, receiptUrl, paymentMethod, expenseId } = req.body;

  const updates: Partial<StoredTransaction> = {};
  if (title !== undefined && title.trim()) updates.title = title.trim();
  if (amount !== undefined) {
    const num = Math.max(0, Number(amount) || 0);
    if (num > 0) updates.amount = num;
  }
  if (type === 'CREDIT' || type === 'DEBIT') updates.type = type;
  if (date) updates.date = date;
  if (time) updates.time = time;
  if (notes !== undefined) updates.notes = notes.trim();
  if (receiptUrl !== undefined) updates.receiptUrl = receiptUrl;
  if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
  if (expenseId) updates.expenseId = expenseId;

  try {
    const { transactionsCol: tCol, isMongo } = await getCollections();
    if (isMongo) {
      const result = await tCol.findOneAndUpdate(
        { id, userId: user.id },
        { $set: updates },
        { returnDocument: 'after' }
      );
      if (!result) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json({ transaction: result });
    } else {
      const transaction = fallbackDb.transactions.find((t) => t.id === id && t.userId === user.id);
      if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
      Object.assign(transaction, updates);
      res.json({ transaction });
    }
  } catch (err: any) {
    console.error('Update transaction error:', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete transaction from MongoDB
app.delete('/api/transactions/:id', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { id } = req.params;

  try {
    const { transactionsCol: tCol, isMongo } = await getCollections();
    if (isMongo) {
      await tCol.deleteOne({ id, userId: user.id });
    } else {
      fallbackDb.transactions = fallbackDb.transactions.filter((t) => !(t.id === id && t.userId === user.id));
    }
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err: any) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// ==================== CLOUDINARY UPLOAD ROUTE ====================

app.post('/api/upload', authenticateToken, async (req: Request, res: Response) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 image data is required' });
  }

  try {
    // Direct authenticated upload to Cloudinary using user's credentials
    const uploadResult = await cloudinary.uploader.upload(imageBase64, {
      folder: 'rupeetrack',
      resource_type: 'image',
    });

    console.log('✅ Cloudinary upload succeeded:', uploadResult.secure_url);
    return res.json({
      url: uploadResult.secure_url,
      provider: 'cloudinary',
      public_id: uploadResult.public_id,
    });
  } catch (err: any) {
    console.error('Cloudinary upload warning:', err.message);
    // If Cloudinary encounter issues, fallback safely
    return res.json({ url: imageBase64, provider: 'fallback' });
  }
});

// Database health and status check
app.get('/api/health', async (_req: Request, res: Response) => {
  const { isMongo } = await getCollections();
  res.json({
    status: 'ok',
    database: isMongo ? 'MongoDB (Noteruppee)' : 'Fallback Local',
    mediaStorage: 'Cloudinary (dsugarjot)',
    timestamp: new Date().toISOString(),
  });
});

// ==================== VITE / STATIC MOUNTING ====================

async function startServer() {
  // Connect to MongoDB on boot
  await initMongoConnection();

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 RupeeTrack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
