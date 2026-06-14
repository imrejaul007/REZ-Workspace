/**
 * BIZORA Finance Service
 * Accounting, Expense Tracking & Financial Reporting
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// ============================================================================
// MongoDB Connection
// ============================================================================

interface MongoDBConnection {
  isConnected: boolean;
  error?: string;
}

const mongoState: MongoDBConnection = { isConnected: false };

async function connectToMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bizora_finance';

  try {
    await mongoose.connect(uri);
    mongoState.isConnected = true;
    logger.info(`[MongoDB] Connected to bizora_finance database`);
  } catch (error) {
    mongoState.error = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[MongoDB] Connection failed: ${mongoState.error}`);
    throw error;
  }
}

// ============================================================================
// Types
// ============================================================================

interface IAccount extends Document {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subtype: string;
  parentId?: string;
  balance: number;
  isActive: boolean;
  createdAt: Date;
}

interface ITransaction extends Document {
  businessId: string;
  date: Date;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  accountId: string;
  amount: number;
  description: string;
  reference?: string;
  paymentMethod?: 'cash' | 'bank' | 'upi' | 'card' | 'cheque';
  attachments?: string[];
  tags?: string[];
  createdAt: Date;
}

interface IExpense extends Document {
  businessId: string;
  date: Date;
  category: string;
  amount: number;
  description: string;
  vendor?: string;
  invoiceNumber?: string;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedBy?: string;
  approvedAt?: Date;
  receipt?: string;
  createdAt: Date;
}

interface IBudget extends Document {
  businessId: string;
  category: string;
  month: string;
  budgeted: number;
  spent: number;
  variance: number;
  status: 'on_track' | 'over' | 'under';
}

interface IReport extends Document {
  businessId: string;
  type: 'income_statement' | 'balance_sheet' | 'cash_flow' | 'expense_summary';
  period: { start: Date; end: Date };
  generatedAt: Date;
  data: Record<string, unknown>;
}

// ============================================================================
// Mongoose Schemas with Indexes
// ============================================================================

const accountSchema = new Schema<IAccount>({
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  type: { type: String, enum: ['asset', 'liability', 'equity', 'revenue', 'expense'], required: true, index: true },
  subtype: { type: String, required: true },
  parentId: { type: String },
  balance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

const transactionSchema = new Schema<ITransaction>({
  businessId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  type: { type: String, enum: ['income', 'expense', 'transfer'], required: true, index: true },
  category: { type: String, required: true, index: true },
  accountId: { type: String, required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, required: true },
  reference: { type: String },
  paymentMethod: { type: String, enum: ['cash', 'bank', 'upi', 'card', 'cheque'] },
  attachments: [{ type: String }],
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now, index: true },
});

const expenseSchema = new Schema<IExpense>({
  businessId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  category: { type: String, required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, required: true },
  vendor: { type: String },
  invoiceNumber: { type: String },
  paymentMethod: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending', index: true },
  approvedBy: { type: String },
  approvedAt: { type: Date },
  receipt: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const budgetSchema = new Schema<IBudget>({
  businessId: { type: String, required: true, index: true },
  category: { type: String, required: true },
  month: { type: String, required: true, index: true },
  budgeted: { type: Number, required: true, min: 0 },
  spent: { type: Number, default: 0 },
  variance: { type: Number, default: 0 },
  status: { type: String, enum: ['on_track', 'over', 'under'], default: 'on_track' },
});

const reportSchema = new Schema<IReport>({
  businessId: { type: String, required: true, index: true },
  type: { type: String, enum: ['income_statement', 'balance_sheet', 'cash_flow', 'expense_summary'], required: true },
  period: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
  generatedAt: { type: Date, default: Date.now },
  data: { type: Schema.Types.Mixed },
});

// ============================================================================
// Models
// ============================================================================

const Account = mongoose.model<IAccount>('Account', accountSchema);
const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
const Budget = mongoose.model<IBudget>('Budget', budgetSchema);
const Report = mongoose.model<IReport>('Report', reportSchema);

// ============================================================================
// Validation
// ============================================================================

const CreateTransactionSchema = z.object({
  businessId: z.string(),
  date: z.string(),
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.string(),
  accountId: z.string(),
  amount: z.number().min(0),
  description: z.string(),
  reference: z.string().optional(),
  paymentMethod: z.enum(['cash', 'bank', 'upi', 'card', 'cheque']).optional(),
  tags: z.array(z.string()).optional(),
});

const CreateExpenseSchema = z.object({
  businessId: z.string(),
  date: z.string(),
  category: z.string(),
  amount: z.number().min(0),
  description: z.string(),
  vendor: z.string().optional(),
  invoiceNumber: z.string().optional(),
  paymentMethod: z.string(),
});

// ============================================================================
// Sample Data Seeding
// ============================================================================

async function seedSampleData(): Promise<void> {
  const accountCount = await Account.countDocuments();
  if (accountCount > 0) {
    logger.info('[Seeding] Sample data already exists, skipping...');
    return;
  }

  logger.info('[Seeding] Creating sample data...');

  // Default chart of accounts
  const defaultAccounts = [
    // Assets
    { code: '1001', name: 'Cash', type: 'asset', subtype: 'current_asset' },
    { code: '1002', name: 'Bank Current Account', type: 'asset', subtype: 'bank' },
    { code: '1003', name: 'Accounts Receivable', type: 'asset', subtype: 'current_asset' },
    { code: '1004', name: 'Inventory', type: 'asset', subtype: 'current_asset' },
    { code: '1501', name: 'Furniture & Equipment', type: 'asset', subtype: 'fixed_asset' },
    // Liabilities
    { code: '2001', name: 'Accounts Payable', type: 'liability', subtype: 'current_liability' },
    { code: '2101', name: 'GST Payable', type: 'liability', subtype: 'tax_liability' },
    { code: '2201', name: 'TDS Payable', type: 'liability', subtype: 'tax_liability' },
    { code: '2301', name: 'Loans Payable', type: 'liability', subtype: 'long_term_liability' },
    // Equity
    { code: '3001', name: "Owner's Capital", type: 'equity', subtype: 'capital' },
    { code: '3101', name: 'Retained Earnings', type: 'equity', subtype: 'retained_earnings' },
    // Revenue
    { code: '4001', name: 'Sales Revenue', type: 'revenue', subtype: 'operating_revenue' },
    { code: '4101', name: 'Service Revenue', type: 'revenue', subtype: 'operating_revenue' },
    { code: '4201', name: 'Other Income', type: 'revenue', subtype: 'other_income' },
    // Expenses
    { code: '5001', name: 'Cost of Goods Sold', type: 'expense', subtype: 'cogs' },
    { code: '5101', name: 'Rent Expense', type: 'expense', subtype: 'operating_expense' },
    { code: '5201', name: 'Salaries & Wages', type: 'expense', subtype: 'operating_expense' },
    { code: '5301', name: 'Utilities', type: 'expense', subtype: 'operating_expense' },
    { code: '5401', name: 'Office Supplies', type: 'expense', subtype: 'operating_expense' },
    { code: '5501', name: 'Travel & Conveyance', type: 'expense', subtype: 'operating_expense' },
    { code: '5601', name: 'Marketing & Advertising', type: 'expense', subtype: 'marketing_expense' },
    { code: '5701', name: 'Professional Fees', type: 'expense', subtype: 'operating_expense' },
    { code: '5801', name: 'Insurance', type: 'expense', subtype: 'operating_expense' },
    { code: '5901', name: 'Bank Charges', type: 'expense', subtype: 'operating_expense' },
    { code: '6001', name: 'Depreciation', type: 'expense', subtype: 'non_cash' },
    { code: '6101', name: 'Interest Expense', type: 'expense', subtype: 'financial_expense' },
    { code: '6201', name: 'GST Expense', type: 'expense', subtype: 'tax_expense' },
  ];

  await Account.insertMany(
    defaultAccounts.map(acc => ({
      ...acc,
      balance: 0,
      isActive: true,
      createdAt: new Date(),
    }))
  );

  // Get first account for transactions
  const cashAccount = await Account.findOne({ code: '1001' });

  // Sample transactions
  const sampleTransactions = [
    { businessId: 'biz-001', date: '2026-05-01', type: 'income', category: 'Sales', amount: 15000, description: 'Sales Revenue - Order #123' },
    { businessId: 'biz-001', date: '2026-05-02', type: 'income', category: 'Sales', amount: 8500, description: 'Sales Revenue - Order #124' },
    { businessId: 'biz-001', date: '2026-05-03', type: 'expense', category: 'Rent', amount: 25000, description: 'Office Rent - May 2026' },
    { businessId: 'biz-001', date: '2026-05-05', type: 'expense', category: 'Utilities', amount: 3500, description: 'Electricity Bill' },
    { businessId: 'biz-001', date: '2026-05-10', type: 'income', category: 'Sales', amount: 22000, description: 'Sales Revenue - Order #125' },
    { businessId: 'biz-001', date: '2026-05-12', type: 'expense', category: 'Salaries', amount: 85000, description: 'Staff Salaries - May 2026' },
    { businessId: 'biz-001', date: '2026-05-15', type: 'income', category: 'Sales', amount: 12000, description: 'Sales Revenue - Order #126' },
    { businessId: 'biz-001', date: '2026-05-18', type: 'expense', category: 'Marketing', amount: 15000, description: 'Facebook Ads - May' },
    { businessId: 'biz-001', date: '2026-05-20', type: 'income', category: 'Sales', amount: 18000, description: 'Sales Revenue - Order #127' },
    { businessId: 'biz-001', date: '2026-05-22', type: 'expense', category: 'Office Supplies', amount: 4500, description: 'Stationery & Supplies' },
  ];

  await Transaction.insertMany(
    sampleTransactions.map(t => ({
      ...t,
      date: new Date(t.date),
      accountId: cashAccount?._id.toString() || '',
      paymentMethod: 'bank' as const,
      createdAt: new Date(),
    }))
  );

  logger.info('[Seeding] Sample data created successfully');
}

// ============================================================================
// Express App
// ============================================================================

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'finance',
    mongodb: mongoState.isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Account Routes
// ============================================================================

app.get('/api/accounts', async (req: Request, res: Response) => {
  try {
    const { type, active } = req.query;

    const query: Record<string, unknown> = {};
    if (type) query.type = type;
    if (active === 'true') query.isActive = true;

    const accounts = await Account.find(query).lean();
    res.json({ accounts });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/accounts/:id', async (req: Request, res: Response) => {
  try {
    const account = await Account.findById(req.params.id).lean();
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Transaction Routes
// ============================================================================

app.post('/api/transactions', async (req: Request, res: Response) => {
  try {
    const data = CreateTransactionSchema.parse(req.body);

    const transaction = new Transaction({
      ...data,
      date: new Date(data.date),
      createdAt: new Date(),
    });

    await transaction.save();

    // Update account balance
    const account = await Account.findById(data.accountId);
    if (account) {
      if (data.type === 'income') {
        account.balance += data.amount;
      } else if (data.type === 'expense') {
        account.balance -= data.amount;
      }
      await account.save();
    }

    res.status(201).json(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    logger.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/transactions', async (req: Request, res: Response) => {
  try {
    const { businessId, type, category, from, to } = req.query;

    const query: Record<string, unknown> = {};
    if (businessId) query.businessId = businessId;
    if (type) query.type = type;
    if (category) query.category = category;
    if (from || to) {
      query.date = {};
      if (from) (query.date as Record<string, Date>).$gte = new Date(from as string);
      if (to) (query.date as Record<string, Date>).$lte = new Date(to as string);
    }

    const transactions = await Transaction.find(query).sort({ date: -1 }).lean();
    res.json({ transactions, total: transactions.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/transactions/:id', async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id).lean();
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/transactions/:id', async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    // Reverse account balance
    const account = await Account.findById(transaction.accountId);
    if (account) {
      if (transaction.type === 'income') {
        account.balance -= transaction.amount;
      } else if (transaction.type === 'expense') {
        account.balance += transaction.amount;
      }
      await account.save();
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Expense Routes
// ============================================================================

app.post('/api/expenses', async (req: Request, res: Response) => {
  try {
    const data = CreateExpenseSchema.parse(req.body);

    const expense = new Expense({
      ...data,
      date: new Date(data.date),
      status: 'pending',
      createdAt: new Date(),
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/expenses', async (req: Request, res: Response) => {
  try {
    const { businessId, status, category } = req.query;

    const query: Record<string, unknown> = {};
    if (businessId) query.businessId = businessId;
    if (status) query.status = status;
    if (category) query.category = category;

    const expenses = await Expense.find(query).sort({ date: -1 }).lean();
    res.json({ expenses, total: expenses.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/expenses/:id', async (req: Request, res: Response) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    Object.assign(expense, req.body);
    if (req.body.status === 'approved') {
      expense.approvedAt = new Date();
    }
    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Reports Routes
// ============================================================================

app.get('/api/reports/income-statement', async (req: Request, res: Response) => {
  try {
    const { businessId, from, to } = req.query;

    const query: Record<string, unknown> = {};
    if (businessId) query.businessId = businessId;
    if (from || to) {
      query.date = {};
      if (from) (query.date as Record<string, Date>).$gte = new Date(from as string);
      if (to) (query.date as Record<string, Date>).$lte = new Date(to as string);
    }

    const txns = await Transaction.find(query).lean();

    const revenue = txns
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses_total = txns
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const byCategoryMap = new Map<string, { type: string; category: string; total: number }>();
    for (const t of txns) {
      const key = `${t.type}:${t.category}`;
      const existing = byCategoryMap.get(key) || { type: t.type, category: t.category, total: 0 };
      existing.total += t.amount;
      byCategoryMap.set(key, existing);
    }

    const report = {
      period: { from, to },
      revenue,
      expenses: expenses_total,
      netIncome: revenue - expenses_total,
      profitMargin: revenue > 0 ? `${((revenue - expenses_total) / revenue * 100).toFixed(2)}%` : '0%',
      byCategory: Array.from(byCategoryMap.values()),
      generatedAt: new Date(),
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/reports/expense-summary', async (req: Request, res: Response) => {
  try {
    const { businessId, from, to } = req.query;

    const query: Record<string, unknown> = { type: 'expense' };
    if (businessId) query.businessId = businessId;
    if (from || to) {
      query.date = {};
      if (from) (query.date as Record<string, Date>).$gte = new Date(from as string);
      if (to) (query.date as Record<string, Date>).$lte = new Date(to as string);
    }

    const txns = await Transaction.find(query).lean();

    const total = txns.reduce((sum, t) => sum + t.amount, 0);

    const byCategoryMap = new Map<string, { category: string; total: number; count: number }>();
    for (const t of txns) {
      const existing = byCategoryMap.get(t.category) || { category: t.category, total: 0, count: 0 };
      existing.total += t.amount;
      existing.count++;
      byCategoryMap.set(t.category, existing);
    }

    const byCategory = Array.from(byCategoryMap.values())
      .map(v => ({
        ...v,
        percentage: `${((v.total / total) * 100).toFixed(1)}%`,
      }))
      .sort((a, b) => b.total - a.total);

    res.json({ total, byCategory, generatedAt: new Date() });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/reports/cash-flow', async (req: Request, res: Response) => {
  try {
    const { businessId, from, to } = req.query;

    const query: Record<string, unknown> = {};
    if (businessId) query.businessId = businessId;
    if (from || to) {
      query.date = {};
      if (from) (query.date as Record<string, Date>).$gte = new Date(from as string);
      if (to) (query.date as Record<string, Date>).$lte = new Date(to as string);
    }

    const txns = await Transaction.find(query).lean();

    const openingBalance = 50000;

    const inflows = txns
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const outflows = txns
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const closingBalance = openingBalance + inflows - outflows;

    res.json({
      openingBalance,
      inflows,
      outflows,
      closingBalance,
      netCashFlow: inflows - outflows,
      generatedAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Dashboard Stats
// ============================================================================

app.get('/api/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.query;

    const query: Record<string, unknown> = {};
    if (businessId) query.businessId = businessId;

    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthQuery = { ...query, date: { $gte: thisMonth } };

    const [allTransactions, monthlyTxns, pendingExpenses] = await Promise.all([
      Transaction.find(query).lean(),
      Transaction.find(monthQuery).lean(),
      Expense.find({ ...query, status: 'pending' }).lean(),
    ]);

    const monthlyIncome = monthlyTxns
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthlyTxns
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Group expenses by category
    const expenseByCategoryMap = new Map<string, number>();
    for (const t of monthlyTxns.filter(t => t.type === 'expense')) {
      const existing = expenseByCategoryMap.get(t.category) || 0;
      expenseByCategoryMap.set(t.category, existing + t.amount);
    }

    const stats = {
      totalIncome: monthlyIncome,
      totalExpenses: monthlyExpenses,
      netIncome: monthlyIncome - monthlyExpenses,
      pendingExpenses: pendingExpenses.length,
      pendingExpenseAmount: pendingExpenses.reduce((sum, e) => sum + e.amount, 0),
      recentTransactions: allTransactions.slice(0, 5),
      expenseByCategory: Array.from(expenseByCategoryMap.entries()).map(([category, amount]) => ({ category, amount })),
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = process.env.PORT || 4022;

async function startServer() {
  try {
    await connectToMongoDB();
    await seedSampleData();

    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   BIZORA Finance Service                              ║
║   Accounting & Financial Reporting                     ║
║                                                           ║
║   Port: ${PORT}                                             ║
║   Database: bizora_finance                                ║
║   MongoDB: ${mongoState.isConnected ? 'Connected' : 'Disconnected'}                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
