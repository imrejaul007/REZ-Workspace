/**
 * LEDGERAI - Analytics Routes
 * Dashboard and reporting endpoints
 */

import { Router, Request, Response } from 'express';
import { Account, Transaction, Invoice, Budget } from '../models';
import { authenticate } from '../middleware/auth';
import logger from '../middleware/logger';

const router = Router();

// ============================================
// GET /api/analytics/dashboard - Main dashboard
// ============================================
router.get('/dashboard', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = 'month' } = req.query;

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        previousStartDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }

    const previousEndDate = new Date(startDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);

    // Get account summary
    const accounts = await Account.find({ isActive: true });
    const assets = accounts.filter(a => a.type === 'asset');
    const liabilities = accounts.filter(a => a.type === 'liability');
    const equity = accounts.filter(a => a.type === 'equity');
    const revenues = accounts.filter(a => a.type === 'revenue');
    const expenses = accounts.filter(a => a.type === 'expense');

    const accountSummary = {
      totalAssets: assets.reduce((sum, a) => sum + a.balance, 0),
      totalLiabilities: liabilities.reduce((sum, a) => sum + a.balance, 0),
      totalEquity: equity.reduce((sum, a) => sum + a.balance, 0),
      totalRevenue: revenues.reduce((sum, a) => sum + a.balance, 0),
      totalExpenses: expenses.reduce((sum, a) => sum + a.balance, 0)
    };

    // Get transactions for current and previous period
    const [currentTransactions, previousTransactions] = await Promise.all([
      Transaction.find({ date: { $gte: startDate, $lte: now } }),
      Transaction.find({ date: { $gte: previousStartDate, $lte: previousEndDate } })
    ]);

    // Calculate transaction metrics
    const currentTotal = currentTransactions.reduce((sum, t) => sum + t.amount, 0);
    const previousTotal = previousTransactions.reduce((sum, t) => sum + t.amount, 0);
    const transactionGrowth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    // Category breakdown
    const categoryBreakdown = await Transaction.aggregate([
      { $match: { date: { $gte: startDate, $lte: now } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    // Get invoice summary
    const invoices = await Invoice.find({
      issueDate: { $gte: startDate, $lte: now }
    });

    const invoiceSummary = {
      totalInvoiced: invoices.reduce((sum, i) => sum + i.total, 0),
      totalPaid: invoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0),
      totalOutstanding: invoices.reduce((sum, i) => sum + (i.total - (i.amountPaid || 0)), 0),
      count: invoices.length,
      overdue: invoices.filter(i => i.status === 'overdue').length
    };

    // Get recent transactions
    const recentTransactions = await Transaction.find({})
      .sort({ date: -1 })
      .limit(10)
      .populate('accounts.accountId', 'code name')
      .lean();

    // Get upcoming invoices
    const upcomingInvoices = await Invoice.find({
      status: { $in: ['draft', 'sent'] },
      dueDate: { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }
    })
      .sort({ dueDate: 1 })
      .limit(5)
      .lean();

    // Overdue invoices
    const overdueInvoices = await Invoice.find({
      status: { $in: ['overdue', 'partial'] },
      dueDate: { $lt: now }
    })
      .sort({ dueDate: 1 })
      .limit(5)
      .lean();

    // Budget status
    const budgets = await Budget.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).lean();

    const budgetSummary = budgets.map(b => ({
      category: b.category,
      budgeted: b.budgeted,
      actual: b.actual,
      variance: b.variance,
      variancePercentage: b.variancePercentage
    }));

    // Cash position (sum of cash accounts)
    const cashAccounts = await Account.find({
      category: { $in: ['cash', 'bank'] },
      isActive: true
    });

    const cashBalance = cashAccounts.reduce((sum, a) => sum + a.balance, 0);

    res.json({
      success: true,
      data: {
        overview: {
          totalAssets: Math.round(accountSummary.totalAssets * 100) / 100,
          totalLiabilities: Math.round(accountSummary.totalLiabilities * 100) / 100,
          netAssets: Math.round((accountSummary.totalAssets - accountSummary.totalLiabilities) * 100) / 100,
          cashBalance: Math.round(cashBalance * 100) / 100,
          netIncome: Math.round((accountSummary.totalRevenue - accountSummary.totalExpenses) * 100) / 100
        },
        transactions: {
          currentPeriod: {
            total: Math.round(currentTotal * 100) / 100,
            count: currentTransactions.length,
            reconciled: currentTransactions.filter(t => t.reconciled).length
          },
          previousPeriod: {
            total: Math.round(previousTotal * 100) / 100,
            count: previousTransactions.length
          },
          growth: Math.round(transactionGrowth * 10) / 10,
          topCategories: categoryBreakdown
        },
        invoices: invoiceSummary,
        budgets: budgetSummary,
        recentTransactions,
        upcomingInvoices,
        overdueInvoices
      }
    });
  } catch (error) {
    logger.error('Dashboard analytics error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard data',
      code: 'DASHBOARD_ERROR'
    });
  }
});

// ============================================
// GET /api/analytics/cash-flow - Cash flow analysis
// ============================================
router.get('/cash-flow', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get all transactions
    const transactions = await Transaction.find({
      date: { $gte: start, $lte: end }
    }).populate('accounts.accountId', 'code name type category');

    // Categorize cash flows
    const operatingKeywords = ['revenue', 'expense', 'salary', 'utility', 'rent', 'supplies'];
    const investingKeywords = ['equipment', 'asset', 'investment', 'purchase', 'sale'];
    const financingKeywords = ['loan', 'borrow', 'repay', 'dividend', 'equity'];

    const cashFlows = transactions.map(tx => {
      const desc = tx.description.toLowerCase();
      let category: 'operating' | 'investing' | 'financing' = 'operating';

      if (investingKeywords.some(k => desc.includes(k))) category = 'investing';
      else if (financingKeywords.some(k => desc.includes(k))) category = 'financing';

      return {
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        category: tx.category,
        flowCategory: category
      };
    });

    // Group by period
    const groupedData: Record<string, {
      operating: number;
      investing: number;
      financing: number;
      total: number;
    }> = {};

    cashFlows.forEach(cf => {
      let key: string;
      const d = new Date(cf.date);

      switch (groupBy) {
        case 'week':
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = String(d.getFullYear());
          break;
        default:
          key = d.toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = { operating: 0, investing: 0, financing: 0, total: 0 };
      }

      const amount = cf.amount > 0 ? cf.amount : -cf.amount;
      groupedData[key][cf.flowCategory] += amount;
      groupedData[key].total += cf.amount;
    });

    // Calculate totals
    const totals = Object.values(groupedData).reduce(
      (acc, val) => ({
        operating: acc.operating + val.operating,
        investing: acc.investing + val.investing,
        financing: acc.financing + val.financing
      }),
      { operating: 0, investing: 0, financing: 0 }
    );

    res.json({
      success: true,
      data: {
        period: { start, end, groupBy },
        timeline: Object.entries(groupedData).map(([period, data]) => ({
          period,
          ...data
        })),
        summary: {
          ...totals,
          netCashFlow: totals.operating + totals.investing + totals.financing
        }
      }
    });
  } catch (error) {
    logger.error('Cash flow analytics error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to analyze cash flow',
      code: 'CASH_FLOW_ERROR'
    });
  }
});

// ============================================
// GET /api/analytics/revenue-expenses - Revenue vs Expenses
// ============================================
router.get('/revenue-expenses', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { months = '12' } = req.query;
    const numMonths = parseInt(months as string, 10);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - numMonths);

    // Get revenue and expense transactions
    const transactions = await Transaction.find({
      date: { $gte: startDate, $lte: endDate }
    }).lean();

    // Group by month
    const monthlyData: Record<string, {
      revenue: number;
      expenses: number;
      netIncome: number;
      transactionCount: number;
    }> = {};

    transactions.forEach(tx => {
      const monthKey = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0, netIncome: 0, transactionCount: 0 };
      }

      monthlyData[monthKey].transactionCount += 1;

      if (tx.amount > 0) {
        monthlyData[monthKey].revenue += tx.amount;
      } else {
        monthlyData[monthKey].expenses += Math.abs(tx.amount);
      }
    });

    // Calculate net income for each month
    Object.keys(monthlyData).forEach(month => {
      monthlyData[month].netIncome = monthlyData[month].revenue - monthlyData[month].expenses;
    });

    // Calculate totals and averages
    const totals = Object.values(monthlyData).reduce(
      (acc, m) => ({
        revenue: acc.revenue + m.revenue,
        expenses: acc.expenses + m.expenses,
        transactionCount: acc.transactionCount + m.transactionCount
      }),
      { revenue: 0, expenses: 0, transactionCount: 0 }
    );

    const avgRevenue = totals.revenue / Object.keys(monthlyData).length;
    const avgExpenses = totals.expenses / Object.keys(monthlyData).length;

    // Get top expense categories
    const expenseByCategory = await Transaction.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate }, amount: { $lt: 0 } } },
      { $group: { _id: '$category', total: { $sum: { $abs: '$amount' } }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    // Get top revenue categories
    const revenueByCategory = await Transaction.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate }, amount: { $gt: 0 } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        period: { start: startDate, end: endDate, months: numMonths },
        monthly: Object.entries(monthlyData)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([month, data]) => ({
            month,
            ...data
          })),
        totals: {
          revenue: Math.round(totals.revenue * 100) / 100,
          expenses: Math.round(totals.expenses * 100) / 100,
          netIncome: Math.round((totals.revenue - totals.expenses) * 100) / 100,
          profitMargin: totals.revenue > 0 ? Math.round(((totals.revenue - totals.expenses) / totals.revenue) * 1000) / 10 : 0,
          transactionCount: totals.transactionCount
        },
        averages: {
          monthlyRevenue: Math.round(avgRevenue * 100) / 100,
          monthlyExpenses: Math.round(avgExpenses * 100) / 100
        },
        topExpenseCategories: expenseByCategory.map(e => ({
          category: e._id,
          total: Math.round(e.total * 100) / 100,
          percentage: totals.expenses > 0 ? Math.round((e.total / totals.expenses) * 1000) / 10 : 0
        })),
        topRevenueCategories: revenueByCategory.map(r => ({
          category: r._id,
          total: Math.round(r.total * 100) / 100,
          percentage: totals.revenue > 0 ? Math.round((r.total / totals.revenue) * 1000) / 10 : 0
        }))
      }
    });
  } catch (error) {
    logger.error('Revenue/expenses analytics error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to analyze revenue and expenses',
      code: 'REVENUE_EXPENSES_ERROR'
    });
  }
});

// ============================================
// GET /api/analytics/invoice-summary - Invoice analytics
// ============================================
router.get('/invoice-summary', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { months = '12' } = req.query;
    const numMonths = parseInt(months as string, 10);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - numMonths);

    const invoices = await Invoice.find({
      issueDate: { $gte: startDate, $lte: endDate }
    });

    // Status breakdown
    const statusBreakdown: Record<string, { count: number; total: number }> = {};
    invoices.forEach(inv => {
      if (!statusBreakdown[inv.status]) {
        statusBreakdown[inv.status] = { count: 0, total: 0 };
      }
      statusBreakdown[inv.status].count += 1;
      statusBreakdown[inv.status].total += inv.total;
    });

    // Monthly trend
    const monthlyTrend: Record<string, {
      invoiced: number;
      paid: number;
      outstanding: number;
      count: number;
    }> = {};

    invoices.forEach(inv => {
      const monthKey = `${inv.issueDate.getFullYear()}-${String(inv.issueDate.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyTrend[monthKey]) {
        monthlyTrend[monthKey] = { invoiced: 0, paid: 0, outstanding: 0, count: 0 };
      }

      monthlyTrend[monthKey].invoiced += inv.total;
      monthlyTrend[monthKey].paid += inv.amountPaid || 0;
      monthlyTrend[monthKey].outstanding += (inv.total - (inv.amountPaid || 0));
      monthlyTrend[monthKey].count += 1;
    });

    // Calculate averages
    const paidInvoices = invoices.filter(i => i.paidDate);
    let totalDaysToPay = 0;

    paidInvoices.forEach(inv => {
      const days = Math.ceil(
        (inv.paidDate!.getTime() - inv.issueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      totalDaysToPay += days;
    });

    const avgDaysToPay = paidInvoices.length > 0 ? Math.round(totalDaysToPay / paidInvoices.length) : 0;

    // Collection rate
    const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0);
    const totalPaid = invoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0);
    const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 1000) / 10 : 0;

    res.json({
      success: true,
      data: {
        period: { start: startDate, end: endDate, months: numMonths },
        summary: {
          totalInvoiced: Math.round(totalInvoiced * 100) / 100,
          totalPaid: Math.round(totalPaid * 100) / 100,
          totalOutstanding: Math.round((totalInvoiced - totalPaid) * 100) / 100,
          collectionRate,
          avgDaysToPay,
          totalInvoices: invoices.length
        },
        statusBreakdown: Object.entries(statusBreakdown).map(([status, data]) => ({
          status,
          count: data.count,
          total: Math.round(data.total * 100) / 100,
          percentage: totalInvoiced > 0 ? Math.round((data.total / totalInvoiced) * 1000) / 10 : 0
        })),
        monthlyTrend: Object.entries(monthlyTrend)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([month, data]) => ({
            month,
            ...data,
            outstanding: Math.round(data.outstanding * 100) / 100
          }))
      }
    });
  } catch (error) {
    logger.error('Invoice analytics error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to analyze invoices',
      code: 'INVOICE_ANALYTICS_ERROR'
    });
  }
});

// ============================================
// GET /api/analytics/accounts-summary - Account balance summary
// ============================================
router.get('/accounts-summary', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const accounts = await Account.find({ isActive: true }).lean();

    // Group by type
    const byType: Record<string, {
      count: number;
      totalBalance: number;
      accounts: Array<{ code: string; name: string; balance: number }>;
    }> = {};

    accounts.forEach(acc => {
      if (!byType[acc.type]) {
        byType[acc.type] = { count: 0, totalBalance: 0, accounts: [] };
      }
      byType[acc.type].count += 1;
      byType[acc.type].totalBalance += acc.balance;
      byType[acc.type].accounts.push({ code: acc.code, name: acc.name, balance: acc.balance });
    });

    // Calculate accounting equation
    const totalAssets = byType['asset']?.totalBalance || 0;
    const totalLiabilities = byType['liability']?.totalBalance || 0;
    const totalEquity = byType['equity']?.totalBalance || 0;
    const totalRevenue = byType['revenue']?.totalBalance || 0;
    const totalExpenses = byType['expense']?.totalBalance || 0;

    // Check accounting equation
    const assetsEqualsLiabilitiesPlusEquity = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    // Net income (Revenue - Expenses)
    const netIncome = totalRevenue - totalExpenses;

    res.json({
      success: true,
      data: {
        byType: Object.entries(byType).map(([type, data]) => ({
          type,
          count: data.count,
          totalBalance: Math.round(data.totalBalance * 100) / 100,
          accounts: data.accounts.map(a => ({
            ...a,
            balance: Math.round(a.balance * 100) / 100
          }))
        })),
        accountingEquation: {
          totalAssets: Math.round(totalAssets * 100) / 100,
          totalLiabilities: Math.round(totalLiabilities * 100) / 100,
          totalEquity: Math.round(totalEquity * 100) / 100,
          balanced: assetsEqualsLiabilitiesPlusEquity,
          difference: Math.round(Math.abs(totalAssets - (totalLiabilities + totalEquity)) * 100) / 100
        },
        incomeStatement: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalExpenses: Math.round(totalExpenses * 100) / 100,
          netIncome: Math.round(netIncome * 100) / 100
        }
      }
    });
  } catch (error) {
    logger.error('Accounts summary error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get accounts summary',
      code: 'ACCOUNTS_SUMMARY_ERROR'
    });
  }
});

// ============================================
// GET /api/analytics/trends - Trend analysis
// ============================================
router.get('/trends', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { months = '12', category } = req.query;
    const numMonths = parseInt(months as string, 10);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - numMonths);

    const match: any = { date: { $gte: startDate, $lte: endDate } };
    if (category) match.category = category;

    const transactions = await Transaction.find(match).lean();

    // Group by week
    const weeklyData: Record<string, number> = {};
    transactions.forEach(tx => {
      const weekStart = new Date(tx.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + Math.abs(tx.amount);
    });

    // Calculate moving average (4 weeks)
    const weeks = Object.entries(weeklyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, total]) => ({ week, total }));

    const movingAverage = weeks.map((w, i) => {
      const slice = weeks.slice(Math.max(0, i - 3), i + 1);
      const avg = slice.reduce((sum, s) => sum + s.total, 0) / slice.length;
      return { week: w.week, total: Math.round(w.total * 100) / 100, movingAvg: Math.round(avg * 100) / 100 };
    });

    // Growth rate
    let avgGrowthRate = 0;
    if (weeks.length > 1) {
      const firstHalf = weeks.slice(0, Math.floor(weeks.length / 2));
      const secondHalf = weeks.slice(Math.floor(weeks.length / 2));

      const firstAvg = firstHalf.reduce((s, w) => s + w.total, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, w) => s + w.total, 0) / secondHalf.length;

      avgGrowthRate = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    }

    res.json({
      success: true,
      data: {
        period: { start: startDate, end: endDate, weeks: weeks.length },
        weekly: movingAverage,
        growthRate: Math.round(avgGrowthRate * 10) / 10,
        trend: avgGrowthRate > 5 ? 'increasing' : avgGrowthRate < -5 ? 'decreasing' : 'stable'
      }
    });
  } catch (error) {
    logger.error('Trends analytics error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to analyze trends',
      code: 'TRENDS_ERROR'
    });
  }
});

export default router;