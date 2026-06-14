/**
 * REZ Expense - Personal Expense Tracking
 * Track expenses, budgets, categories, reports
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import { v4 as uuidv4 } from 'uuid';

const logger = {
  info: (msg: string) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`),
};

const app = express();
const PORT = parseInt(process.env.PORT || '3011', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Production security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(cors({
  origin: isProduction
    ? ['https://rez.app', 'https://rez.money', 'https://admin.rez.money']
    : '*',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use('/api/', limiter);

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============================================
// STORES
// ============================================

const expenses = new Map();
const budgets = new Map();
const categories = new Map([
  ['food', { name: 'Food & Dining', icon: '🍔', color: '#FF6B6B' }],
  ['transport', { name: 'Transport', icon: '🚗', color: '#4ECDC4' }],
  ['shopping', { name: 'Shopping', icon: '🛍️', color: '#45B7D1' }],
  ['entertainment', { name: 'Entertainment', icon: '🎬', color: '#96CEB4' }],
  ['bills', { name: 'Bills & Utilities', icon: '📄', color: '#DDA0DD' }],
  ['health', { name: 'Health', icon: '💊', color: '#98D8C8' }],
  ['education', { name: 'Education', icon: '📚', color: '#F7DC6F' }],
  ['other', { name: 'Other', icon: '📦', color: '#BDC3C7' }]
]);

// ============================================
// HEALTH
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rez-expense',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    stats: { expenses: expenses.size, budgets: budgets.size }
  });
});

// ============================================
// EXPENSES
// ============================================

app.post('/api/expenses', (req, res) => {
  const { userId, amount, category, description, date, merchant, receipt } = req.body;

  if (!userId || !amount || !category) {
    return res.status(400).json({ success: false, error: 'userId, amount, category required' });
  }

  const expense = {
    id: uuidv4(),
    userId,
    amount: parseFloat(amount),
    category,
    description: description || '',
    date: date ? new Date(date) : new Date(),
    merchant: merchant || '',
    receipt,
    createdAt: new Date()
  };

  expenses.set(expense.id, expense);
  logger.info(`Expense: ${expense.id}`);

  res.json({ success: true, expense });
});

app.get('/api/expenses', (req, res) => {
  const { userId, category, startDate, endDate, limit = 100 } = req.query;

  let list = Array.from(expenses.values());

  if (userId) list = list.filter(e => e.userId === userId);
  if (category) list = list.filter(e => e.category === category);
  if (startDate) list = list.filter(e => new Date(e.date) >= new Date(startDate as string));
  if (endDate) list = list.filter(e => new Date(e.date) <= new Date(endDate as string));

  list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({ success: true, expenses: list.slice(0, Number(limit)), count: list.length });
});

app.get('/api/expenses/:id', (req, res) => {
  const expense = expenses.get(req.params.id);
  if (!expense) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, expense });
});

app.put('/api/expenses/:id', (req, res) => {
  const expense = expenses.get(req.params.id);
  if (!expense) return res.status(404).json({ success: false, error: 'Not found' });

  const updated = { ...expense, ...req.body, updatedAt: new Date() };
  expenses.set(req.params.id, updated);
  res.json({ success: true, expense: updated });
});

app.delete('/api/expenses/:id', (req, res) => {
  if (!expenses.has(req.params.id)) return res.status(404).json({ success: false, error: 'Not found' });
  expenses.delete(req.params.id);
  res.json({ success: true, message: 'Deleted' });
});

// ============================================
// BUDGETS
// ============================================

app.post('/api/budgets', (req, res) => {
  const { userId, category, amount, period } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ success: false, error: 'userId, amount required' });
  }

  const budget = {
    id: uuidv4(),
    userId,
    category: category || 'all',
    amount: parseFloat(amount),
    period: period || 'monthly',
    spent: 0,
    createdAt: new Date()
  };

  budgets.set(budget.id, budget);
  res.json({ success: true, budget });
});

app.get('/api/budgets', (req, res) => {
  const { userId } = req.query;
  let list = Array.from(budgets.values());
  if (userId) list = list.filter(b => b.userId === userId);
  res.json({ success: true, budgets: list });
});

app.get('/api/budgets/summary/:userId', (req, res) => {
  const userExpenses = Array.from(expenses.values()).filter(e => e.userId === req.params.userId);
  const userBudgets = Array.from(budgets.values()).filter(b => b.userId === req.params.userId);

  const totalSpent = userExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = userBudgets.reduce((sum, b) => sum + b.amount, 0);

  const byCategory: Record<string, number> = {};
  userExpenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  res.json({
    success: true,
    summary: {
      totalSpent,
      totalBudget,
      remaining: totalBudget - totalSpent,
      byCategory
    }
  });
});

// ============================================
// CATEGORIES
// ============================================

app.get('/api/categories', (req, res) => {
  res.json({ success: true, categories: Object.entries(categories).map(([key, val]) => ({ id: key, ...val })) });
});

// ============================================
// REPORTS
// ============================================

app.get('/api/reports/:userId', (req, res) => {
  const { startDate, endDate } = req.query;
  const userExpenses = Array.from(expenses.values()).filter(e => e.userId === req.params.userId);

  let filtered = userExpenses;
  if (startDate) filtered = filtered.filter(e => new Date(e.date) >= new Date(startDate as string));
  if (endDate) filtered = filtered.filter(e => new Date(e.date) <= new Date(endDate as string));

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);
  const byCategory: Record<string, number> = {};
  filtered.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });

  res.json({ success: true, report: { total, byCategory, count: filtered.length } });
});

app.listen(PORT, () => logger.info(`REZ Expense started on port ${PORT}`));

export default app;
