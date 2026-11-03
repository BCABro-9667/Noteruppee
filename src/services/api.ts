import { Expense, Transaction, User, UserSettings } from '../types/index.ts';

const TOKEN_KEY = 'rupeetrack_auth_token';
const CACHED_USER_KEY = 'rupeetrack_cached_user';
const CACHED_EXPENSES_KEY = 'rupeetrack_cached_expenses';
const CACHED_TRANSACTIONS_KEY = 'rupeetrack_cached_transactions';

class ApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(CACHED_USER_KEY);
      }
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    const token = this.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Request failed`);
      }

      return data as T;
    } catch (error: any) {
      // Check if network error and fallback to cached data for GET requests
      if (options.method === undefined || options.method === 'GET') {
        if (endpoint === '/api/auth/me') {
          const cached = localStorage.getItem(CACHED_USER_KEY);
          if (cached) return { user: JSON.parse(cached) } as unknown as T;
        } else if (endpoint === '/api/expenses') {
          const cached = localStorage.getItem(CACHED_EXPENSES_KEY);
          if (cached) return { expenses: JSON.parse(cached) } as unknown as T;
        } else if (endpoint.startsWith('/api/transactions')) {
          const cached = localStorage.getItem(CACHED_TRANSACTIONS_KEY);
          if (cached) return { transactions: JSON.parse(cached) } as unknown as T;
        }
      }
      throw error;
    }
  }

  // ================= Auth =================
  async register(payload: { name: string; email: string; password: string; phone?: string; location?: string; currencySymbol?: string }) {
    const res = await this.request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.token);
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(res.user));
    return res;
  }

  async login(payload: { email: string; password: string }) {
    const res = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.token);
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(res.user));
    return res;
  }

  async getMe() {
    const res = await this.request<{ user: User }>('/api/auth/me');
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(res.user));
    return res.user;
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch (_) {}
    this.setToken(null);
  }

  async updateProfile(payload: { name?: string; phone?: string; location?: string; avatarUrl?: string; settings?: Partial<UserSettings> }) {
    const res = await this.request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(res.user));
    return res.user;
  }

  async changePassword(payload: { oldPassword: string; newPassword: string; confirmPassword: string }) {
    return await this.request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ================= Expenses =================
  async getExpenses() {
    const res = await this.request<{ expenses: Expense[] }>('/api/expenses');
    localStorage.setItem(CACHED_EXPENSES_KEY, JSON.stringify(res.expenses));
    return res.expenses;
  }

  async createExpense(payload: { name: string; initialAmount: number; category?: string; color?: string }) {
    const res = await this.request<{ expense: Expense }>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.expense;
  }

  async updateExpense(id: string, payload: Partial<Expense>) {
    const res = await this.request<{ expense: Expense }>(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.expense;
  }

  async deleteExpense(id: string) {
    return await this.request<{ success: boolean }>(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // ================= Transactions =================
  async getTransactions(expenseId?: string) {
    const q = expenseId ? `?expenseId=${encodeURIComponent(expenseId)}` : '';
    const res = await this.request<{ transactions: Transaction[] }>(`/api/transactions${q}`);
    if (!expenseId) {
      localStorage.setItem(CACHED_TRANSACTIONS_KEY, JSON.stringify(res.transactions));
    }
    return res.transactions;
  }

  async createTransaction(payload: {
    expenseId: string;
    title: string;
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    date?: string;
    time?: string;
    notes?: string;
    receiptUrl?: string;
    paymentMethod?: string;
  }) {
    const res = await this.request<{ transaction: Transaction }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.transaction;
  }

  async updateTransaction(id: string, payload: Partial<Transaction>) {
    const res = await this.request<{ transaction: Transaction }>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.transaction;
  }

  async deleteTransaction(id: string) {
    return await this.request<{ success: boolean }>(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // ================= Media / Upload =================
  async uploadImage(imageBase64: string): Promise<string> {
    const res = await this.request<{ url: string; provider: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ imageBase64 }),
    });
    return res.url;
  }
}

export const api = new ApiService();
