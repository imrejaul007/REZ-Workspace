/**
 * REZ Smart Expense - Enhanced Receipt Scanner Service
 * AI Categorization, Policy Enforcement, Spend Insights, Smart Receipt Matching
 * Connects to: REZ-Analytics, REZ-Merchant, REZ-Intelligence, HOJAI-Finance-AI
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

// Import routes and services
import expenseRoutes from './routes/expense.routes';
import {
  validateExpensePolicy,
  checkApprovalRequired,
  logViolations,
  attachExpense,
  validateBudgetLimits,
  extractUserContext,
  requireTenantContext,
} from './middleware/policy.middleware';
import { authenticate, optionalAuth } from './middleware/auth.middleware';
import {
  ExpenseBase,
  PolicyValidationResult,
  APIResponse,
} from './types';

dotenv.config();

const app = express();
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

const PORT = parseInt(process.env.PORT || '3013', 10);

// External service URLs
const ANALYTICS_API = process.env.ANALYTICS_API || 'https://rez-analytics.onrender.com';
const MERCHANT_API = process.env.MERCHANT_API || 'https://rez-merchant.onrender.com';
const INTELLIGENCE_API = process.env.INTELLIGENCE_API || 'https://rez-intelligence.onrender.com';
const HOJAIFINANCE_AI_URL = process.env.HOJAIFINANCE_AI_URL || 'http://localhost:4830';
const RABTUL_AUTH_URL = process.env.RABTUL_AUTH_URL || 'https://rez-auth.rezapp.com';

// ============================================================================
// Database Models
// ============================================================================

// Expense Schema
const ExpenseSchema = new mongoose.Schema({
  expense_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  merchant_name: { type: String, required: true },
  category: { type: String, required: true, enum: ['food', 'travel', 'shopping', 'entertainment', 'utilities', 'healthcare', 'education', 'other'] },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  date: { type: Date, required: true, index: true },
  receipt_url: String,
  location: {
    city: String,
    lat: Number,
    lng: Number
  },
  extracted_data: mongoose.Schema.Types.Mixed,
  // AI fields
  ai_categorization: {
    suggested_category: String,
    confidence: Number,
    reasoning: String,
    requires_review: Boolean,
    confirmed_at: Date
  },
  // Policy fields
  policy_validation: {
    is_valid: Boolean,
    violations_count: Number,
    requires_approval: Boolean,
    validated_at: Date
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Create compound indexes for common queries
ExpenseSchema.index({ user_id: 1, date: -1 });
ExpenseSchema.index({ user_id: 1, category: 1 });

const Expense = mongoose.model('Expense', ExpenseSchema);

// Category History Schema (for learning)
const CategoryHistorySchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  expense_id: { type: String, required: true },
  merchant_name: { type: String, required: true },
  original_category: String,
  final_category: { type: String, required: true },
  changed_by: { type: String, enum: ['ai', 'user'], default: 'ai' },
  confidence: Number,
  timestamp: { type: Date, default: Date.now }
});

const CategoryHistory = mongoose.model('CategoryHistory', CategoryHistorySchema);

// Receipt Schema
const ReceiptSchema = new mongoose.Schema({
  receipt_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  merchant_name: String,
  amount: Number,
  date: Date,
  image_url: { type: String, required: true },
  ocr_data: {
    merchant_name: String,
    amount: Number,
    date: Date,
    items: Array,
    tax: Number,
    tip: Number,
    confidence: Number
  },
  matched_expense_id: String,
  match_confidence: Number,
  match_status: { type: String, enum: ['unmatched', 'pending', 'matched', 'flagged', 'rejected'], default: 'unmatched' },
  uploaded_at: { type: Date, default: Date.now },
  processed_at: Date
});

const Receipt = mongoose.model('Receipt', ReceiptSchema);

// Policy Violation Schema
const PolicyViolationSchema = new mongoose.Schema({
  violation_id: { type: String, required: true, unique: true },
  expense_id: { type: String, required: true, index: true },
  policy_id: { type: String, required: true },
  tenant_id: { type: String, required: true, index: true },
  user_id: { type: String, required: true },
  rule_id: String,
  rule_name: { type: String, required: true },
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'], required: true },
  description: String,
  actual_value: mongoose.Schema.Types.Mixed,
  allowed_value: mongoose.Schema.Types.Mixed,
  resolution: { type: String, enum: ['pending', 'approved', 'rejected', 'escalated', 'waived'], default: 'pending' },
  resolved_by: String,
  resolved_at: Date,
  suggested_approver: String,
  created_at: { type: Date, default: Date.now }
});

const PolicyViolation = mongoose.model('PolicyViolation', PolicyViolationSchema);

// Categories
const CATEGORIES = ['food', 'travel', 'shopping', 'entertainment', 'utilities', 'healthcare', 'education', 'other'];

// ============================================================================
// Request/Response Types
// ============================================================================

interface AddExpenseRequest {
  user_id: string;
  merchant_name: string;
  category?: string;
  amount: number;
  date?: string;
  receipt_url?: string;
  location?: {
    city: string;
    lat: number;
    lng: number;
  };
  tenant_id?: string;
  auto_categorize?: boolean;
}

interface PolicyValidationRequest {
  tenant_id?: string;
}

// ============================================================================
// Middleware
// ============================================================================

// Attach expense to request for policy validation
const attachExpenseMiddleware = async (req: Request, res: Response, next: Function) => {
  if (req.body.expense_id) {
    try {
      const expense = await Expense.findOne({ expense_id: req.body.expense_id });
      if (expense) {
        (req as any).expense = expense;
      }
    } catch (error) {
      console.error('Error fetching expense for middleware:', error);
    }
  }
  next();
};

// ============================================================================
// Original Expense Endpoints (Enhanced)
// ============================================================================

// POST /api/expense/add - Add new expense with AI categorization and policy validation
app.post('/api/expense/add', attachExpenseMiddleware, validateBudgetLimits, async (req: Request, res: Response) => {
  const body = req.body as AddExpenseRequest;
  const {
    user_id,
    merchant_name,
    category,
    amount,
    date,
    receipt_url,
    location,
    tenant_id,
    auto_categorize = true
  } = body;

  // Generate expense ID
  const expense_id = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  let finalCategory = CATEGORIES.includes(category) ? category : 'other';
  let aiCategorization = undefined;

  // AI Auto-categorization
  if (auto_categorize && !CATEGORIES.includes(category)) {
    try {
      const categorizeResponse = await axios.post(`${HOJAIFINANCE_AI_URL}/api/categorize`, {
        merchant_name,
        amount,
        date: date || new Date(),
        available_categories: CATEGORIES
      }, { timeout: 10000 });

      if (categorizeResponse.data) {
        const { category: suggested, confidence, reasoning } = categorizeResponse.data;
        finalCategory = suggested || finalCategory;
        aiCategorization = {
          suggested_category: suggested,
          confidence: confidence || 0.5,
          reasoning: reasoning || 'AI categorized based on merchant and amount',
          requires_review: confidence < 0.8,
          confirmed_at: null
        };

        console.log(`AI categorization for ${merchant_name}: ${suggested} (${confidence})`);
      }
    } catch (error) {
      // Fallback to local categorization
      console.log('HOJAI Finance AI unavailable, using local categorization');
      const localCategory = localCategorize(merchant_name, amount);
      finalCategory = localCategory;
    }
  }

  // Create expense object for policy validation
  const expenseObj: any = {
    expense_id,
    user_id,
    merchant_name,
    category: finalCategory,
    amount,
    currency: 'INR',
    date: new Date(date || Date.now()),
    receipt_url,
    location,
    created_at: new Date()
  };

  // Policy validation
  let policyValidation = {
    is_valid: true,
    violations_count: 0,
    requires_approval: false,
    validated_at: new Date()
  };

  try {
    const policyResponse = await axios.post(`${HOJAIFINANCE_AI_URL}/api/policies/validate`, {
      expense: expenseObj,
      tenant_id: tenant_id || 'default'
    }, { timeout: 10000 });

    if (policyResponse.data) {
      const { is_valid, violations, requires_approval } = policyResponse.data;
      policyValidation = {
        is_valid: is_valid !== false,
        violations_count: violations?.length || 0,
        requires_approval: requires_approval || false,
        validated_at: new Date()
      };

      // Log violations if any
      if (violations && violations.length > 0) {
        for (const violation of violations) {
          await PolicyViolation.create({
            violation_id: `VIO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            expense_id,
            policy_id: violation.policy_id,
            tenant_id: tenant_id || 'default',
            user_id,
            rule_id: violation.rule_id,
            rule_name: violation.rule_name,
            severity: violation.severity,
            description: violation.description,
            actual_value: violation.actual_value,
            allowed_value: violation.allowed_value
          });
        }
      }
    }
  } catch (error) {
    // Continue without policy validation
    console.log('Policy validation unavailable, proceeding without');
  }

  // Create expense
  const expense = new Expense({
    expense_id,
    user_id,
    merchant_name,
    category: finalCategory,
    amount,
    currency: 'INR',
    date: new Date(date || Date.now()),
    receipt_url,
    location,
    ai_categorization: aiCategorization,
    policy_validation: policyValidation,
    created_at: new Date(),
    updated_at: new Date()
  });

  await expense.save();

  // Record category for learning
  if (aiCategorization) {
    await CategoryHistory.create({
      user_id,
      expense_id,
      merchant_name,
      original_category: category || 'other',
      final_category: finalCategory,
      changed_by: 'ai',
      confidence: aiCategorization.confidence
    });
  }

  // Send to Analytics
  try {
    await axios.post(`${ANALYTICS_API}/api/track`, {
      event: 'expense_added',
      user_id,
      data: { merchant_name, category: finalCategory, amount, ai_categorized: !!aiCategorization }
    });
  } catch (e) { }

  // Send to Intelligence
  try {
    await axios.post(`${INTELLIGENCE_API}/api/spend/track`, {
      user_id,
      merchant_name,
      category: finalCategory,
      amount,
      ai_categorized: true
    });
  } catch (e) { }

  // Build response
  const response: any = {
    success: true,
    expense,
    message: 'Expense added successfully'
  };

  // Add policy info if relevant
  if (policyValidation.violations_count > 0) {
    response.warnings = {
      policy_violations: policyValidation.violations_count,
      message: 'Expense added but has policy violations'
    };
  }

  if (policyValidation.requires_approval) {
    response.requires_approval = true;
    response.message = 'Expense added and requires approval';
  }

  res.json(response);
});

// Local categorization fallback
function localCategorize(merchantName: string, amount: number): string {
  const normalized = merchantName.toLowerCase();

  const patterns: Record<string, string> = {
    food: ['restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'food', 'dominos', 'starbucks', 'swiggy', 'zomato'],
    travel: ['uber', 'ola', 'taxi', 'airline', 'flight', 'train', 'bus', 'petrol', 'fuel'],
    shopping: ['amazon', 'flipkart', 'myntra', 'shop', 'store', 'mall'],
    entertainment: ['netflix', 'spotify', 'movie', 'cinema', 'prime', 'hotstar'],
    utilities: ['electricity', 'water', 'internet', 'phone', 'airtel', 'jio'],
    healthcare: ['pharmacy', 'hospital', 'doctor', 'medical', 'apollo', 'fortis'],
    education: ['school', 'course', 'book', 'byju', 'udemy']
  };

  for (const [category, keywords] of Object.entries(patterns)) {
    if (keywords.some(kw => normalized.includes(kw))) {
      return category;
    }
  }

  // Amount-based fallback
  if (amount < 200) return 'food';
  if (amount > 10000) return 'shopping';

  return 'other';
}

// GET /api/expense/history - Get expense history with filters
app.get('/api/expense/history/:userId', async (req: Request, res: Response) => {
  const { from, to, category, limit = 50 } = req.query;
  const query: any = { user_id: req.params.userId };

  if (category) query.category = category;
  if (from && to) {
    query.date = { $gte: new Date(from as string), $lte: new Date(to as string) };
  }

  const expenses = await Expense.find(query)
    .sort({ date: -1 })
    .limit(parseInt(limit as string));

  res.json({ expenses, count: expenses.length });
});

// GET /api/expense/summary - Get spending summary
app.get('/api/expense/summary/:userId', async (req: Request, res: Response) => {
  const { period = 'month' } = req.query;
  let startDate = new Date();

  if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (period === 'year') {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }

  const summary = await Expense.aggregate([
    { $match: { user_id: req.params.userId, date: { $gte: startDate } } },
    { $group: {
      _id: '$category',
      total: { $sum: '$amount' },
      count: { $sum: 1 },
      avg: { $avg: '$amount' }
    }},
    { $sort: { total: -1 } }
  ]);

  const totals = await Expense.aggregate([
    { $match: { user_id: req.params.userId, date: { $gte: startDate } } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);

  res.json({
    summary,
    total: totals[0]?.total || 0,
    count: totals[0]?.count || 0,
    period
  });
});

// GET /api/expense/:id - Get single expense
app.get('/api/expense/:id', async (req: Request, res: Response) => {
  const expense = await Expense.findOne({ expense_id: req.params.id });

  if (!expense) {
    return res.status(404).json({ success: false, error: 'Expense not found' });
  }

  res.json({ success: true, expense });
});

// PUT /api/expense/:id - Update expense
app.put('/api/expense/:id', async (req: Request, res: Response) => {
  const { category, amount, receipt_url } = req.body;
  const update: any = { updated_at: new Date() };

  if (category) {
    update.category = category;
    update['ai_categorization.confirmed_at'] = new Date();
  }
  if (amount !== undefined) update.amount = amount;
  if (receipt_url !== undefined) update.receipt_url = receipt_url;

  const expense = await Expense.findOneAndUpdate(
    { expense_id: req.params.id },
    update,
    { new: true }
  );

  if (!expense) {
    return res.status(404).json({ success: false, error: 'Expense not found' });
  }

  res.json({ success: true, expense });
});

// DELETE /api/expense/:id - Delete expense
app.delete('/api/expense/:id', async (req: Request, res: Response) => {
  const expense = await Expense.findOneAndDelete({ expense_id: req.params.id });

  if (!expense) {
    return res.status(404).json({ success: false, error: 'Expense not found' });
  }

  res.json({ success: true, message: 'Expense deleted' });
});

// ============================================================================
// Budget Endpoints
// ============================================================================

// GET /api/expense/budget/:userId - Get budget status
app.get('/api/expense/budget/:userId', async (req: Request, res: Response) => {
  const budgets = {
    food: { limit: 30000, period: 'monthly' },
    travel: { limit: 25000, period: 'monthly' },
    shopping: { limit: 50000, period: 'monthly' },
    entertainment: { limit: 10000, period: 'monthly' },
    utilities: { limit: 15000, period: 'monthly' },
    healthcare: { limit: 10000, period: 'monthly' },
    education: { limit: 20000, period: 'monthly' },
    other: { limit: 20000, period: 'monthly' }
  };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const spending = await Expense.aggregate([
    { $match: { user_id: req.params.userId, date: { $gte: startOfMonth } } },
    { $group: { _id: '$category', spent: { $sum: '$amount' } } }
  ]);

  const spendingMap = new Map(spending.map(s => [s._id, s.spent]));

  const budgetStatus = Object.entries(budgets).map(([category, budget]) => {
    const spent = spendingMap.get(category) || 0;
    const percentage = (spent / budget.limit) * 100;

    return {
      category,
      budget: budget.limit,
      spent,
      remaining: Math.max(0, budget.limit - spent),
      percentage: Math.round(percentage),
      alert: percentage >= 100 ? 'red' : percentage >= 80 ? 'yellow' : 'green'
    };
  });

  res.json({ success: true, budgets: budgetStatus });
});

// ============================================================================
// Receipt Endpoints
// ============================================================================

// POST /api/receipt/add - Add receipt
app.post('/api/receipt/add', async (req: Request, res: Response) => {
  const { user_id, merchant_name, amount, date, image_url, ocr_data } = req.body;

  const receipt = new Receipt({
    receipt_id: `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_id,
    merchant_name,
    amount,
    date: new Date(date || Date.now()),
    image_url,
    ocr_data,
    match_status: 'unmatched'
  });

  await receipt.save();

  res.json({ success: true, receipt });
});

// GET /api/receipt/:id - Get receipt
app.get('/api/receipt/:id', async (req: Request, res: Response) => {
  const receipt = await Receipt.findOne({ receipt_id: req.params.id });

  if (!receipt) {
    return res.status(404).json({ success: false, error: 'Receipt not found' });
  }

  res.json({ success: true, receipt });
});

// POST /api/receipt/:id/match - Match receipt to expense
app.post('/api/receipt/:id/match', async (req: Request, res: Response) => {
  const receipt = await Receipt.findOne({ receipt_id: req.params.id });

  if (!receipt) {
    return res.status(404).json({ success: false, error: 'Receipt not found' });
  }

  // Find matching expense
  const query: any = { user_id: receipt.user_id };

  if (receipt.merchant_name) {
    query.merchant_name = { $regex: receipt.merchant_name, $options: 'i' };
  }
  if (receipt.amount) {
    query.amount = { $gte: receipt.amount * 0.9, $lte: receipt.amount * 1.1 };
  }

  const expense = await Expense.findOne(query).sort({ date: -1 });

  if (expense) {
    receipt.matched_expense_id = expense.expense_id;
    receipt.match_confidence = 0.85;
    receipt.match_status = 'matched';
    receipt.processed_at = new Date();
    await receipt.save();

    return res.json({
      success: true,
      receipt,
      matched_expense: expense,
      message: 'Receipt matched to expense'
    });
  }

  receipt.match_status = 'unmatched';
  await receipt.save();

  res.json({ success: true, receipt, message: 'No matching expense found' });
});

// ============================================================================
// Policy Endpoints
// ============================================================================

// POST /api/policies/validate/:expenseId - Validate expense against policy
app.post('/api/policies/validate/:expenseId', requireTenantContext, async (req: Request, res: Response) => {
  const expense = await Expense.findOne({ expense_id: req.params.expenseId });

  if (!expense) {
    return res.status(404).json({ success: false, error: 'Expense not found' });
  }

  try {
    const response = await axios.post(`${HOJAIFINANCE_AI_URL}/api/policies/validate`, {
      expense: expense.toObject(),
      tenant_id: (req as any).tenantId || 'default'
    }, { timeout: 10000 });

    res.json({ success: true, validation: response.data });
  } catch (error) {
    // Fallback local validation
    const validation = {
      is_valid: true,
      violations: [],
      requires_approval: expense.amount > 50000,
      suggested_approvers: expense.amount > 50000 ? ['manager'] : []
    };

    res.json({ success: true, validation });
  }
});

// GET /api/policies/violations/:tenantId - Get violations for tenant
app.get('/api/policies/violations/:tenantId', async (req: Request, res: Response) => {
  const { status = 'pending' } = req.query;

  const violations = await PolicyViolation.find({
    tenant_id: req.params.tenantId,
    resolution: status
  }).sort({ created_at: -1 }).limit(100);

  res.json({ success: true, violations, count: violations.length });
});

// ============================================================================
// Insights Endpoints
// ============================================================================

// GET /api/insights/:userId/weekly - Weekly insights
app.get('/api/insights/:userId/weekly', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Previous week
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  // Aggregate current week
  const currentWeek = await Expense.aggregate([
    { $match: { user_id: userId, date: { $gte: weekStart, $lte: weekEnd } } },
    { $group: {
      _id: '$category',
      total: { $sum: '$amount' },
      count: { $sum: 1 }
    }}
  ]);

  const currentTotal = currentWeek.reduce((sum, c) => sum + c.total, 0);

  // Aggregate previous week
  const prevWeek = await Expense.aggregate([
    { $match: { user_id: userId, date: { $gte: prevWeekStart, $lt: weekStart } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const prevTotal = prevWeek[0]?.total || 0;
  const comparison = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;

  // Top merchants
  const topMerchants = await Expense.aggregate([
    { $match: { user_id: userId, date: { $gte: weekStart, $lte: weekEnd } } },
    { $group: { _id: '$merchant_name', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: 5 }
  ]);

  res.json({
    success: true,
    insights: {
      week_start: weekStart,
      week_end: weekEnd,
      total_spent: currentTotal,
      category_breakdown: currentWeek,
      top_merchants: topMerchants,
      comparison_to_previous_week: comparison,
      trend: comparison > 0 ? 'up' : comparison < 0 ? 'down' : 'stable'
    }
  });
});

// GET /api/insights/:userId/monthly - Monthly insights
app.get('/api/insights/:userId/monthly', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Previous month
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // Current month aggregates
  const currentMonth = await Expense.aggregate([
    { $match: { user_id: userId, date: { $gte: monthStart, $lte: monthEnd } } },
    { $group: {
      _id: '$category',
      total: { $sum: '$amount' },
      count: { $sum: 1 },
      avg: { $avg: '$amount' }
    }}
  ]);

  const currentTotal = currentMonth.reduce((sum, c) => sum + c.total, 0);

  // Previous month total
  const prevMonth = await Expense.aggregate([
    { $match: { user_id: userId, date: { $gte: prevMonthStart, $lte: prevMonthEnd } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const prevTotal = prevMonth[0]?.total || 0;
  const comparison = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;

  // Top merchants
  const topMerchants = await Expense.aggregate([
    { $match: { user_id: userId, date: { $gte: monthStart, $lte: monthEnd } } },
    { $group: { _id: '$merchant_name', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: 10 }
  ]);

  // Daily spending for trend
  const dailySpending = await Expense.aggregate([
    { $match: { user_id: userId, date: { $gte: monthStart, $lte: monthEnd } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
      total: { $sum: '$amount' }
    }},
    { $sort: { _id: 1 } }
  ]);

  res.json({
    success: true,
    insights: {
      month: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
      total_spent: currentTotal,
      category_breakdown: currentMonth,
      top_merchants: topMerchants,
      comparison_to_previous_month: comparison,
      daily_spending: dailySpending,
      expense_count: await Expense.countDocuments({ user_id: userId, date: { $gte: monthStart, $lte: monthEnd } })
    }
  });
});

// GET /api/insights/:userId/anomalies - Spending anomalies
app.get('/api/insights/:userId/anomalies', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const { days = 30 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days as string));

  const expenses = await Expense.find({
    user_id: userId,
    date: { $gte: startDate }
  }).sort({ amount: -1 });

  if (expenses.length < 5) {
    return res.json({ success: true, anomalies: [], message: 'Not enough data for anomaly detection' });
  }

  // Calculate mean and standard deviation
  const amounts = expenses.map(e => e.amount);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  // Find anomalies (>2.5 std dev)
  const anomalies = expenses
    .filter(e => Math.abs(e.amount - mean) > 2.5 * stdDev)
    .slice(0, 10)
    .map(e => ({
      expense_id: e.expense_id,
      merchant_name: e.merchant_name,
      amount: e.amount,
      category: e.category,
      date: e.date,
      deviation: ((e.amount - mean) / mean * 100).toFixed(1),
      severity: Math.abs(e.amount - mean) > 3 * stdDev ? 'high' : 'medium'
    }));

  res.json({
    success: true,
    anomalies,
    stats: {
      mean: mean.toFixed(2),
      stdDev: stdDev.toFixed(2),
      threshold: (2.5 * stdDev).toFixed(2)
    }
  });
});

// ============================================================================
// Category Learning Endpoints
// ============================================================================

// GET /api/categories/history/:userId - Get user's category history
app.get('/api/categories/history/:userId', async (req: Request, res: Response) => {
  const { merchant } = req.query;

  const query: any = { user_id: req.params.userId };
  if (merchant) {
    query.merchant_name = { $regex: merchant, $options: 'i' };
  }

  const history = await CategoryHistory.find(query)
    .sort({ timestamp: -1 })
    .limit(100);

  // Group by merchant for quick lookup
  const merchantPatterns: Record<string, { category: string; count: number; confidence: number }> = {};

  for (const entry of history) {
    const key = entry.merchant_name.toLowerCase();
    if (!merchantPatterns[key]) {
      merchantPatterns[key] = { category: entry.final_category, count: 0, confidence: 0 };
    }
    merchantPatterns[key].count++;
    merchantPatterns[key].confidence = (merchantPatterns[key].confidence + (entry.confidence || 0.5)) / 2;
  }

  res.json({ success: true, history, patterns: merchantPatterns });
});

// POST /api/categories/learn - Record category learning
app.post('/api/categories/learn', async (req: Request, res: Response) => {
  const { expense_id, merchant_name, final_category, confidence, changed_by = 'user' } = req.body;

  await CategoryHistory.create({
    user_id: req.body.user_id,
    expense_id,
    merchant_name,
    final_category,
    confidence,
    changed_by
  });

  res.json({ success: true, message: 'Learning recorded' });
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rez-expense',
    version: '2.0.0',
    features: [
      'ai-categorization',
      'policy-enforcement',
      'spend-insights',
      'smart-receipt-matching'
    ],
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (req, res) => {
  const checks = {
    mongodb: mongoose.connection.readyState === 1
  };

  const allReady = Object.values(checks).every(v => v);

  res.status(allReady ? 200 : 503).json({
    ready: allReady,
    checks,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// Mount Enhanced Routes (with RABTUL Auth)
// ============================================================================

// Apply authentication middleware to all expense routes
app.use('/api', authenticate, expenseRoutes);

// ============================================================================
// Start Server
// ============================================================================

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-expense';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('REZ Expense connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`REZ Expense enhanced service started on port ${PORT}`);
      console.log('Features enabled:');
      console.log('  - AI Auto-Categorization');
      console.log('  - Policy Enforcement');
      console.log('  - Spend Insights');
      console.log('  - Smart Receipt Matching');
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    // Start anyway for development without MongoDB
    app.listen(PORT, () => {
      console.log(`REZ Expense started on port ${PORT} (without MongoDB)`);
    });
  });

export default app;
