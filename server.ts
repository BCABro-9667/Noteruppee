import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parser
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Setup data directory and persistence file
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

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

interface DatabaseSchema {
  users: StoredUser[];
  sessions: { token: string; userId: string; createdAt: string }[];
  expenses: StoredExpense[];
  transactions: StoredTransaction[];
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function initDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading db.json, creating fresh store', e);
    }
  }

  // Seed default demo user and rich expense data for instant first-run experience
  const demoSalt = crypto.randomBytes(16).toString('hex');
  const demoUser: StoredUser = {
    id: 'user-demo-1',
    name: 'Avdesh Rajput',
    email: 'demo@rupeetrack.in',
    phone: '+91 98765 43210',
    location: 'Bengaluru, India',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    passwordHash: hashPassword('password123', demoSalt),
    salt: demoSalt,
    settings: {
      debitLabel: 'Debit',
      creditLabel: 'Credit',
      currencySymbol: '₹',
    },
    createdAt: new Date().toISOString(),
  };

  const initialExpenses: StoredExpense[] = [
    {
      id: 'exp-1',
      userId: demoUser.id,
      name: 'Monthly Groceries & Kitchen',
      initialAmount: 18000,
      category: 'Food & Supplies',
      color: '#2563EB',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'exp-2',
      userId: demoUser.id,
      name: 'Goa Weekend Trip',
      initialAmount: 35000,
      category: 'Travel & Vacation',
      color: '#0D9488',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'exp-3',
      userId: demoUser.id,
      name: 'Office Project Budget',
      initialAmount: 50000,
      category: 'Business & Freelance',
      color: '#7C3AED',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'exp-4',
      userId: demoUser.id,
      name: 'Home Renovation',
      initialAmount: 25000,
      category: 'Household',
      color: '#EA580C',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const initialTransactions: StoredTransaction[] = [
    {
      id: 'tx-1',
      expenseId: 'exp-1',
      userId: demoUser.id,
      title: 'Organic Vegetables & Dairy',
      amount: 1450,
      type: 'DEBIT',
      date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      time: '10:30',
      notes: 'Weekly fresh fruits and organic farm milk',
      paymentMethod: 'UPI',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'tx-2',
      expenseId: 'exp-1',
      userId: demoUser.id,
      title: 'Monthly Supermarket Supplies',
      amount: 4200,
      type: 'DEBIT',
      date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      time: '18:15',
      notes: 'Rice, oil, pulses and cleaning products',
      paymentMethod: 'Card',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'tx-3',
      expenseId: 'exp-1',
      userId: demoUser.id,
      title: 'Cashback Refund from Store',
      amount: 350,
      type: 'CREDIT',
      date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
      time: '14:00',
      notes: 'Promo discount refunded to wallet',
      paymentMethod: 'UPI',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 'tx-4',
      expenseId: 'exp-2',
      userId: demoUser.id,
      title: 'Flight Tickets Bangalore to Goa',
      amount: 11200,
      type: 'DEBIT',
      date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
      time: '11:45',
      notes: 'Indigo return flights for 2',
      paymentMethod: 'Card',
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      id: 'tx-5',
      expenseId: 'exp-2',
      userId: demoUser.id,
      title: 'Beach Resort Advance',
      amount: 8500,
      type: 'DEBIT',
      date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      time: '15:20',
      notes: 'Sea view room booking confirmation',
      paymentMethod: 'Net Banking',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'tx-6',
      expenseId: 'exp-2',
      userId: demoUser.id,
      title: 'Friend Split Share Received',
      amount: 6000,
      type: 'CREDIT',
      date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      time: '19:10',
      notes: 'Rohan paid his flight share via GPay',
      paymentMethod: 'UPI',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'tx-7',
      expenseId: 'exp-3',
      userId: demoUser.id,
      title: 'Client Advance Milestone 1',
      amount: 25000,
      type: 'CREDIT',
      date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      time: '11:00',
      notes: 'Wire transfer for branding and frontend phase',
      paymentMethod: 'Net Banking',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'tx-8',
      expenseId: 'exp-3',
      userId: demoUser.id,
      title: 'Figma and Cloud Server Subscriptions',
      amount: 3200,
      type: 'DEBIT',
      date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
      time: '16:40',
      notes: 'Annual design tools renewal',
      paymentMethod: 'Card',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  const db: DatabaseSchema = {
    users: [demoUser],
    sessions: [],
    expenses: initialExpenses,
    transactions: initialTransactions,
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  return db;
}

let db = initDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Failed to persist db.json:', err);
  }
}

// Authentication Middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const session = db.sessions.find((s) => s.token === token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  (req as any).user = user;
  next();
}

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password, phone, location, currencySymbol } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' });
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

  db.users.push(newUser);

  // Generate session token
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions.push({ token, userId: newUser.id, createdAt: new Date().toISOString() });
  saveDatabase();

  const { passwordHash: _, salt: __, ...userProfile } = newUser;
  res.status(201).json({ token, user: userProfile });
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  saveDatabase();

  const { passwordHash: _, salt: __, ...userProfile } = user;
  res.json({ token, user: userProfile });
});

// Demo Login (One-click Instant Access)
app.post('/api/auth/demo', (_req: Request, res: Response) => {
  let demoUser = db.users.find((u) => u.id === 'user-demo-1');
  if (!demoUser) {
    demoUser = db.users[0];
  }
  if (!demoUser) {
    return res.status(500).json({ error: 'No demo user available' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  db.sessions.push({ token, userId: demoUser.id, createdAt: new Date().toISOString() });
  saveDatabase();

  const { passwordHash: _, salt: __, ...userProfile } = demoUser;
  res.json({ token, user: userProfile });
});

// Current user profile
app.get('/api/auth/me', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { passwordHash: _, salt: __, ...userProfile } = user;
  res.json({ user: userProfile });
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    db.sessions = db.sessions.filter((s) => s.token !== token);
    saveDatabase();
  }
  res.json({ success: true });
});

// Update Profile & Settings
app.put('/api/auth/profile', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { name, phone, location, avatarUrl, settings } = req.body;

  if (name && name.trim()) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (location !== undefined) user.location = location.trim();
  if (avatarUrl) user.avatarUrl = avatarUrl;

  if (settings) {
    if (['Debit', 'Take', 'Liya'].includes(settings.debitLabel)) {
      user.settings.debitLabel = settings.debitLabel;
    }
    if (['Credit', 'Give', 'Diya'].includes(settings.creditLabel)) {
      user.settings.creditLabel = settings.creditLabel;
    }
    if (settings.currencySymbol) {
      user.settings.currencySymbol = settings.currencySymbol;
    }
  }

  saveDatabase();
  const { passwordHash: _, salt: __, ...userProfile } = user;
  res.json({ user: userProfile });
});

// Change Password
app.post('/api/auth/change-password', authenticateToken, (req: Request, res: Response) => {
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

  user.passwordHash = hashPassword(newPassword, user.salt);
  saveDatabase();

  res.json({ success: true, message: 'Password updated successfully' });
});

// ==================== EXPENSES CRUD ====================

// Get all expenses for current user
app.get('/api/expenses', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const userExpenses = db.expenses.filter((e) => e.userId === user.id);
  res.json({ expenses: userExpenses });
});

// Create new expense
app.post('/api/expenses', authenticateToken, (req: Request, res: Response) => {
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

  db.expenses.unshift(newExpense);
  saveDatabase();

  res.status(201).json({ expense: newExpense });
});

// Update expense
app.put('/api/expenses/:id', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { id } = req.params;
  const { name, initialAmount, category, color } = req.body;

  const expense = db.expenses.find((e) => e.id === id && e.userId === user.id);
  if (!expense) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  if (name !== undefined && name.trim()) expense.name = name.trim();
  if (initialAmount !== undefined) expense.initialAmount = Math.max(0, Number(initialAmount) || 0);
  if (category !== undefined) expense.category = category;
  if (color !== undefined) expense.color = color;
  expense.updatedAt = new Date().toISOString();

  saveDatabase();
  res.json({ expense });
});

// Delete expense and all its associated transactions
app.delete('/api/expenses/:id', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { id } = req.params;

  const index = db.expenses.findIndex((e) => e.id === id && e.userId === user.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  db.expenses.splice(index, 1);
  // delete associated transactions
  db.transactions = db.transactions.filter((t) => t.expenseId !== id);
  saveDatabase();

  res.json({ success: true, message: 'Expense and associated transactions deleted' });
});

// ==================== TRANSACTIONS CRUD ====================

// Get all transactions for current user (optionally filtered by expenseId)
app.get('/api/transactions', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { expenseId } = req.query;

  let userTransactions = db.transactions.filter((t) => t.userId === user.id);
  if (expenseId && typeof expenseId === 'string' && expenseId !== 'ALL') {
    userTransactions = userTransactions.filter((t) => t.expenseId === expenseId);
  }

  res.json({ transactions: userTransactions });
});

// Create new transaction
app.post('/api/transactions', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { expenseId, title, amount, type, date, time, notes, receiptUrl, paymentMethod } = req.body;

  if (!expenseId || !title || amount === undefined || !type) {
    return res.status(400).json({ error: 'Expense ID, title, amount, and type are required' });
  }

  const expense = db.expenses.find((e) => e.id === expenseId && e.userId === user.id);
  if (!expense) {
    return res.status(404).json({ error: 'Associated expense not found' });
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

  db.transactions.unshift(newTransaction);
  expense.updatedAt = new Date().toISOString();
  saveDatabase();

  res.status(201).json({ transaction: newTransaction });
});

// Update transaction
app.put('/api/transactions/:id', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { id } = req.params;
  const { title, amount, type, date, time, notes, receiptUrl, paymentMethod, expenseId } = req.body;

  const transaction = db.transactions.find((t) => t.id === id && t.userId === user.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  if (title !== undefined && title.trim()) transaction.title = title.trim();
  if (amount !== undefined) {
    const num = Math.max(0, Number(amount) || 0);
    if (num > 0) transaction.amount = num;
  }
  if (type === 'CREDIT' || type === 'DEBIT') transaction.type = type;
  if (date) transaction.date = date;
  if (time) transaction.time = time;
  if (notes !== undefined) transaction.notes = notes.trim();
  if (receiptUrl !== undefined) transaction.receiptUrl = receiptUrl;
  if (paymentMethod !== undefined) transaction.paymentMethod = paymentMethod;
  if (expenseId) {
    const exp = db.expenses.find((e) => e.id === expenseId && e.userId === user.id);
    if (exp) transaction.expenseId = expenseId;
  }

  saveDatabase();
  res.json({ transaction });
});

// Delete transaction
app.delete('/api/transactions/:id', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { id } = req.params;

  const index = db.transactions.findIndex((t) => t.id === id && t.userId === user.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  db.transactions.splice(index, 1);
  saveDatabase();

  res.json({ success: true, message: 'Transaction deleted' });
});

// ==================== MEDIA / CLOUDINARY UPLOAD ====================

app.post('/api/upload', authenticateToken, async (req: Request, res: Response) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  // Check if Cloudinary environment variables are available
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudinaryUrl || (cloudName && apiKey && apiSecret)) {
    try {
      // Direct Cloudinary HTTP upload
      const effectiveCloud = cloudName || (cloudinaryUrl ? cloudinaryUrl.split('@')[1] : '');
      const formData = new URLSearchParams();
      formData.append('file', imageBase64);
      formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset');

      const cRes = await fetch(`https://api.cloudinary.com/v1_1/${effectiveCloud}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (cRes.ok) {
        const cData = await cRes.json() as { secure_url?: string };
        if (cData.secure_url) {
          return res.json({ url: cData.secure_url, provider: 'cloudinary' });
        }
      }
    } catch (err) {
      console.warn('Cloudinary upload attempt encountered an issue, falling back to secure store', err);
    }
  }

  // High performance local data store fallback
  res.json({ url: imageBase64, provider: 'local' });
});

// ==================== VITE / STATIC MOUNTING ====================

async function startServer() {
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
    console.log(`RupeeTrack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
