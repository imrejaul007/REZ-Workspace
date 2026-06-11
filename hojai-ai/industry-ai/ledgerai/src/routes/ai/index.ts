/**
 * LEDGERAI - AI Routes
 * AI Agent endpoints for accountant, CFO, and invoice operations
 */

import { Router, Request, Response } from 'express';
import aiAccountant from '../../services/aiAccountant';
import aiCFO from '../../services/aiCFO';
import aiInvoice from '../../services/aiInvoice';
import expenseAnalyst from '../../services/expenseAnalyst';
import budgetAdvisor from '../../services/budgetAdvisor';
import aiBrain from '../../services/aiBrain';
import { authenticate, authorize } from '../../middleware/auth';
import { validate, categorizeSchema, reconcileSchema, validateObjectId } from '../../middleware/validation';
import { aiLimiter } from '../../middleware/rateLimiter';
import logger from '../../middleware/logger';

const router = Router();

// ============================================
// GET /ai/status - Get all AI agents status
// ============================================
router.get('/status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const accountantStatus = aiAccountant.getStatus();
    const cfoStatus = aiCFO.getStatus();
    const invoiceStatus = aiInvoice.getStatus();
    const expenseStatus = expenseAnalyst.getStatus();
    const budgetStatus = budgetAdvisor.getStatus();
    const brainStatus = aiBrain.getStatus();

    // Calculate system health
    const agents = [accountantStatus, cfoStatus, invoiceStatus, expenseStatus, budgetStatus, brainStatus];
    const activeAgents = agents.filter(a => a.status === 'idle' || a.status === 'working').length;
    const healthScore = Math.round((activeAgents / agents.length) * 100);

    res.json({
      success: true,
      data: {
        agents: {
          accountant: accountantStatus,
          cfo: cfoStatus,
          invoice: invoiceStatus,
          expenseAnalyst: expenseStatus,
          budgetAdvisor: budgetStatus,
          aiBrain: brainStatus
        },
        system: {
          health: healthScore,
          allAgentsActive: activeAgents === agents.length,
          timestamp: new Date()
        }
      }
    });
  } catch (error) {
    logger.error('AI status error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get AI status',
      code: 'AI_STATUS_ERROR'
    });
  }
});

// ============================================
// POST /api/ai/accountant/categorize - Categorize transaction
// ============================================
router.post('/accountant/categorize', authenticate, aiLimiter, validate(categorizeSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { description, amount, date } = req.body;

    const result = await aiAccountant.categorizeTransaction(description, amount);

    res.json({
      success: true,
      data: {
        originalDescription: description,
        suggestedCategory: result.category,
        confidence: result.confidence,
        reasoning: result.reasoning,
        suggestedAccounts: result.suggestedAccounts
      }
    });

    logger.info('Transaction categorized by AI', {
      userId: req.user?.userId,
      description: description.substring(0, 50),
      category: result.category,
      confidence: result.confidence
    });
  } catch (error) {
    logger.error('AI categorize error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to categorize transaction',
      code: 'AI_CATEGORIZE_ERROR'
    });
  }
});

// ============================================
// POST /api/ai/accountant/reconcile - Reconcile transactions
// ============================================
router.post('/accountant/reconcile', authenticate, authorize('admin', 'accountant'), aiLimiter, validate(reconcileSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionIds } = req.body;

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Transaction IDs array is required',
        code: 'INVALID_INPUT'
      });
      return;
    }

    const results = await aiAccountant.reconcileTransactions(transactionIds);

    // Summary
    const summary = {
      total: results.length,
      matched: results.filter(r => r.status === 'matched').length,
      unmatched: results.filter(r => r.status === 'unmatched').length,
      discrepancies: results.filter(r => r.status === 'discrepancy').length
    };

    res.json({
      success: true,
      data: {
        results,
        summary
      },
      message: `Reconciliation complete: ${summary.matched} matched, ${summary.unmatched} unmatched, ${summary.discrepancies} discrepancies`
    });

    logger.info('Transactions reconciled by AI', {
      userId: req.user?.userId,
      totalTransactions: transactionIds.length,
      matched: summary.matched,
      unmatched: summary.unmatched
    });
  } catch (error) {
    logger.error('AI reconcile error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to reconcile transactions',
      code: 'AI_RECONCILE_ERROR'
    });
  }
});

// ============================================
// POST /api/ai/accountant/bulk-categorize - Bulk categorize transactions
// ============================================
router.post('/accountant/bulk-categorize', authenticate, authorize('admin', 'accountant'), aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Transactions array is required',
        code: 'INVALID_INPUT'
      });
      return;
    }

    const results = await aiAccountant.bulkCategorize(transactions);

    const highConfidence = results.filter(r => r.confidence > 0.6).length;
    const lowConfidence = results.filter(r => r.confidence <= 0.6).length;

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          highConfidence,
          lowConfidence
        }
      }
    });

    logger.info('Bulk categorization by AI', {
      userId: req.user?.userId,
      totalTransactions: transactions.length,
      highConfidence
    });
  } catch (error) {
    logger.error('AI bulk categorize error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to bulk categorize transactions',
      code: 'AI_BULK_CATEGORIZE_ERROR'
    });
  }
});

// ============================================
// GET /api/ai/cfo/analyze - Financial analysis
// ============================================
router.get('/cfo/analyze', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const analysis = await aiCFO.analyze(start, end);

    res.json({
      success: true,
      data: analysis
    });

    logger.info('Financial analysis by CFO Agent', {
      userId: req.user?.userId,
      period: `${start?.toISOString().split('T')[0] || 'default'} to ${end?.toISOString().split('T')[0] || 'default'}`
    });
  } catch (error) {
    logger.error('AI analyze error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to analyze financials',
      code: 'AI_ANALYZE_ERROR'
    });
  }
});

// ============================================
// GET /api/ai/cfo/forecast - Financial forecast
// ============================================
router.get('/cfo/forecast', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { months = '3' } = req.query;
    const numMonths = Math.min(Math.max(parseInt(months as string, 10), 1), 12);

    const forecasts = await aiCFO.forecast(numMonths);

    res.json({
      success: true,
      data: {
        forecasts,
        summary: {
          period: 'next ' + numMonths + ' month(s)',
          predictedTotalRevenue: forecasts.reduce((sum, f) => sum + f.predictedRevenue, 0),
          predictedTotalExpenses: forecasts.reduce((sum, f) => sum + f.predictedExpenses, 0),
          predictedNetIncome: forecasts.reduce((sum, f) => sum + f.predictedNetIncome, 0),
          avgConfidence: Math.round(forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length * 100) / 100
        }
      }
    });

    logger.info('Financial forecast by CFO Agent', {
      userId: req.user?.userId,
      months: numMonths
    });
  } catch (error) {
    logger.error('AI forecast error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate forecast',
      code: 'AI_FORECAST_ERROR'
    });
  }
});

// ============================================
// GET /api/ai/cfo/budget-analysis - Budget analysis
// ============================================
router.get('/cfo/budget-analysis', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { period } = req.query;

    const analyses = await aiCFO.analyzeBudgets(period as string | undefined);

    const summary = {
      totalBudgets: analyses.length,
      onTrack: analyses.filter(a => a.status === 'on_track').length,
      overBudget: analyses.filter(a => a.status === 'over_budget').length,
      underBudget: analyses.filter(a => a.status === 'under_budget').length,
      totalBudgeted: analyses.reduce((sum, a) => sum + a.budgeted, 0),
      totalActual: analyses.reduce((sum, a) => sum + a.actual, 0),
      totalVariance: analyses.reduce((sum, a) => sum + a.variance, 0)
    };

    res.json({
      success: true,
      data: {
        analyses,
        summary
      }
    });

    logger.info('Budget analysis by CFO Agent', {
      userId: req.user?.userId,
      budgetsAnalyzed: analyses.length
    });
  } catch (error) {
    logger.error('AI budget analysis error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to analyze budgets',
      code: 'AI_BUDGET_ANALYSIS_ERROR'
    });
  }
});

// ============================================
// POST /api/ai/invoice/create - Create invoice with AI assistance
// ============================================
router.post('/invoice/create', authenticate, authorize('admin', 'accountant'), aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const invoiceData = req.body;

    // Validate required fields
    if (!invoiceData.customerId || !invoiceData.customerName || !invoiceData.items || !invoiceData.dueDate) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: customerId, customerName, items, dueDate',
        code: 'MISSING_FIELDS'
      });
      return;
    }

    // Validate items
    if (!Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Items array is required and must not be empty',
        code: 'INVALID_ITEMS'
      });
      return;
    }

    const invoice = await aiInvoice.createInvoice(invoiceData);

    res.status(201).json({
      success: true,
      data: { invoice },
      message: 'Invoice created successfully'
    });

    logger.info('Invoice created by AI', {
      userId: req.user?.userId,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      total: invoice.total
    });
  } catch (error) {
    logger.error('AI create invoice error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice',
      code: 'AI_CREATE_INVOICE_ERROR'
    });
  }
});

// ============================================
// GET /api/ai/invoice/reminders - Get payment reminders
// ============================================
router.get('/invoice/reminders', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const reminders = await aiInvoice.getReminders();

    // Group by urgency
    const byUrgency = {
      critical: reminders.filter(r => r.urgency === 'critical'),
      high: reminders.filter(r => r.urgency === 'high'),
      medium: reminders.filter(r => r.urgency === 'medium'),
      low: reminders.filter(r => r.urgency === 'low')
    };

    const totalAmount = reminders.reduce((sum, r) => sum + r.amount, 0);

    res.json({
      success: true,
      data: {
        reminders,
        byUrgency: {
          critical: byUrgency.critical.length,
          high: byUrgency.high.length,
          medium: byUrgency.medium.length,
          low: byUrgency.low.length
        },
        summary: {
          totalReminders: reminders.length,
          totalOutstandingAmount: Math.round(totalAmount * 100) / 100
        }
      }
    });

    logger.info('Payment reminders generated by AI', {
      userId: req.user?.userId,
      totalReminders: reminders.length,
      criticalCount: byUrgency.critical.length
    });
  } catch (error) {
    logger.error('AI reminders error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate reminders',
      code: 'AI_REMINDERS_ERROR'
    });
  }
});

// ============================================
// GET /api/ai/invoice/collection-actions - Get collection recommendations
// ============================================
router.get('/invoice/collection-actions', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const actions = await aiInvoice.getCollectionActions();

    // Group by action type
    const byAction = actions.reduce((acc, action) => {
      if (!acc[action.recommendedAction]) {
        acc[action.recommendedAction] = [];
      }
      acc[action.recommendedAction].push(action);
      return acc;
    }, {} as Record<string, typeof actions>);

    const totalAtRisk = actions.reduce((sum, a) => sum + a.amount, 0);

    res.json({
      success: true,
      data: {
        actions,
        byAction,
        summary: {
          totalActions: actions.length,
          totalAtRiskAmount: Math.round(totalAtRisk * 100) / 100,
          priorityBreakdown: {
            email: actions.filter(a => a.recommendedAction === 'email_reminder').length,
            phone: actions.filter(a => a.recommendedAction === 'phone_call').length,
            finalNotice: actions.filter(a => a.recommendedAction === 'final_notice').length,
            escalate: actions.filter(a => a.recommendedAction === 'escalate').length,
            writeOff: actions.filter(a => a.recommendedAction === 'write_off').length
          }
        }
      }
    });

    logger.info('Collection actions generated by AI', {
      userId: req.user?.userId,
      totalActions: actions.length
    });
  } catch (error) {
    logger.error('AI collection actions error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate collection actions',
      code: 'AI_COLLECTION_ERROR'
    });
  }
});

// ============================================
// GET /api/ai/invoice/performance - Invoice performance analysis
// ============================================
router.get('/invoice/performance', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const analysis = await aiInvoice.analyzePerformance(start, end);

    res.json({
      success: true,
      data: {
        analysis,
        insights: {
          collectionHealth: analysis.collectionRate >= 80 ? 'excellent' :
                           analysis.collectionRate >= 60 ? 'good' :
                           analysis.collectionRate >= 40 ? 'fair' : 'poor',
          paymentSpeed: analysis.averageDaysToPay <= 15 ? 'fast' :
                       analysis.averageDaysToPay <= 30 ? 'normal' : 'slow',
          riskLevel: analysis.atRiskAmount > analysis.totalOutstanding * 0.2 ? 'high' :
                    analysis.atRiskAmount > analysis.totalOutstanding * 0.1 ? 'medium' : 'low'
        }
      }
    });

    logger.info('Invoice performance analyzed by AI', {
      userId: req.user?.userId,
      collectionRate: analysis.collectionRate
    });
  } catch (error) {
    logger.error('AI invoice performance error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to analyze invoice performance',
      code: 'AI_PERFORMANCE_ERROR'
    });
  }
});

// ============================================
// POST /api/ai/invoice/update-overdue - Update overdue status
// ============================================
router.post('/invoice/update-overdue', authenticate, authorize('admin', 'accountant'), aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await aiInvoice.updateOverdueStatus();

    res.json({
      success: true,
      data: { updated: result.updated },
      message: `Updated ${result.updated} invoices to overdue status`
    });

    logger.info('Overdue status updated by AI', {
      userId: req.user?.userId,
      updated: result.updated
    });
  } catch (error) {
    logger.error('AI update overdue error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update overdue status',
      code: 'AI_UPDATE_OVERDUE_ERROR'
    });
  }
});

// ============================================
// GET /api/ai/expense/analyze - Analyze expenses
// ============================================
router.get('/expense/analyze', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const analysis = await expenseAnalyst.analyzeExpenses(start, end);

    res.json({
      success: true,
      data: {
        analysis,
        insights: {
          totalExpenseCategories: analysis.categoryBreakdown.length,
          topCategory: analysis.categoryBreakdown[0]?.category || 'None',
          anomalyCount: analysis.anomalies.length,
          savingsPotential: analysis.savingsOpportunities.reduce((sum, o) => sum + o.potentialSavings, 0),
          periodChange: analysis.periodComparison.changePercentage
        }
      }
    });

    logger.info('Expense analysis by AI', {
      userId: req.user?.userId,
      totalExpenses: analysis.totalExpenses,
      categories: analysis.categoryBreakdown.length
    });
  } catch (error) {
    logger.error('AI expense analysis error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to analyze expenses',
      code: 'AI_EXPENSE_ANALYSIS_ERROR'
    });
  }
});

// ============================================
// GET /api/ai/expense/budget-comparison - Compare expenses to budget
// ============================================
router.get('/expense/budget-comparison', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { period } = req.query;

    const comparisons = await expenseAnalyst.compareToBudget(period as string | undefined);

    const summary = {
      totalCategories: comparisons.length,
      onTrack: comparisons.filter(c => c.status === 'on_track').length,
      overBudget: comparisons.filter(c => c.status === 'over_budget').length,
      underBudget: comparisons.filter(c => c.status === 'under_budget').length,
      totalBudgeted: comparisons.reduce((sum, c) => sum + c.budgeted, 0),
      totalActual: comparisons.reduce((sum, c) => sum + c.actual, 0),
      totalVariance: comparisons.reduce((sum, c) => sum + c.variance, 0)
    };

    res.json({
      success: true,
      data: {
        comparisons,
        summary
      }
    });

    logger.info('Expense budget comparison by AI', {
      userId: req.user?.userId,
      categories: comparisons.length
    });
  } catch (error) {
    logger.error('AI budget comparison error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to compare to budget',
      code: 'AI_BUDGET_COMPARISON_ERROR'
    });
  }
});

// ============================================
// GET /api/ai/expense/recurring - Get recurring expenses
// ============================================
router.get('/expense/recurring', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const recurring = await expenseAnalyst.getRecurringExpenses();

    const summary = {
      totalRecurring: recurring.length,
      highStability: recurring.filter(r => r.stability === 'high').length,
      totalMonthlyValue: recurring
        .filter(r => r.frequency === 'Monthly')
        .reduce((sum, r) => sum + r.averageAmount, 0),
      upcomingThisMonth: recurring.filter(r => {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return r.nextExpected >= now && r.nextExpected <= nextMonth;
      }).length
    };

    res.json({
      success: true,
      data: {
        recurring,
        summary
      }
    });

    logger.info('Recurring expenses by AI', {
      userId: req.user?.userId,
      recurringCount: recurring.length
    });
  } catch (error) {
    logger.error('AI recurring expenses error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get recurring expenses',
      code: 'AI_RECURRING_ERROR'
    });
  }
});

// ============================================
// GET /api/ai/budget/recommendations - Generate budget recommendations
// ============================================
router.get('/budget/recommendations', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = 'monthly' } = req.query;

    const plan = await budgetAdvisor.generateRecommendations(period as 'monthly' | 'quarterly' | 'yearly');

    res.json({
      success: true,
      data: {
        plan,
        insights: {
          totalBudgeted: plan.totalBudgeted,
          highPriorityChanges: plan.summary.highPriorityChanges,
          netChange: plan.summary.netChange,
          categoriesToIncrease: plan.categories.filter(c => c.change > 0).length,
          categoriesToDecrease: plan.categories.filter(c => c.change < 0).length
        }
      }
    });

    logger.info('Budget recommendations by AI', {
      userId: req.user?.userId,
      period,
      categories: plan.categories.length
    });
  } catch (error) {
    logger.error('AI budget recommendations error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate budget recommendations',
      code: 'AI_BUDGET_RECOMMENDATIONS_ERROR'
    });
  }
});

// ============================================
// GET /api/ai/budget/forecast - Forecast budgets
// ============================================
router.get('/budget/forecast', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { months = '3' } = req.query;
    const numMonths = Math.min(Math.max(parseInt(months as string, 10), 1), 12);

    const forecasts = await budgetAdvisor.forecastBudget(numMonths);

    const summary = {
      totalForecasts: forecasts.length,
      categories: [...new Set(forecasts.map(f => f.category))].length,
      totalRecommendedBudget: forecasts
        .filter(f => f.period === forecasts[0]?.period)
        .reduce((sum, f) => sum + f.recommendedBudget, 0),
      avgConfidence: forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length
    };

    res.json({
      success: true,
      data: {
        forecasts,
        summary
      }
    });

    logger.info('Budget forecast by AI', {
      userId: req.user?.userId,
      months: numMonths,
      forecasts: forecasts.length
    });
  } catch (error) {
    logger.error('AI budget forecast error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to forecast budgets',
      code: 'AI_BUDGET_FORECAST_ERROR'
    });
  }
});

// ============================================
// GET /api/ai/budget/performance - Analyze budget performance
// ============================================
router.get('/budget/performance', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const performance = await budgetAdvisor.analyzePerformance();

    res.json({
      success: true,
      data: {
        performance,
        insights: {
          overallHealth: performance.overallHealth,
          score: performance.score,
          categoriesOnTrack: performance.categoryAnalysis.filter(c => c.health === 'on_track').length,
          categoriesOverBudget: performance.categoryAnalysis.filter(c => c.health === 'over_budget').length,
          recommendationsCount: performance.recommendations.length
        }
      }
    });

    logger.info('Budget performance by AI', {
      userId: req.user?.userId,
      health: performance.overallHealth,
      score: performance.score
    });
  } catch (error) {
    logger.error('AI budget performance error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to analyze budget performance',
      code: 'AI_BUDGET_PERFORMANCE_ERROR'
    });
  }
});

// ============================================
// POST /api/ai/invoice/parse - Parse invoice with AI
// ============================================
router.post('/invoice/parse', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { invoiceText } = req.body;

    if (!invoiceText || typeof invoiceText !== 'string') {
      res.status(400).json({
        success: false,
        error: 'invoiceText is required',
        code: 'INVALID_INPUT'
      });
      return;
    }

    const result = await aiBrain.parseInvoice({ invoiceText });

    res.json({
      success: true,
      data: result
    });

    logger.info('Invoice parsed by AI Brain', {
      userId: req.user?.userId,
      vendor: result.vendor,
      confidence: result.confidence
    });
  } catch (error) {
    logger.error('AI invoice parse error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to parse invoice',
      code: 'AI_INVOICE_PARSE_ERROR'
    });
  }
});

// ============================================
// POST /api/ai/expense/categorize - Categorize expense with AI
// ============================================
router.post('/expense/categorize', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { description, amount, date, merchant } = req.body;

    if (!description || typeof description !== 'string') {
      res.status(400).json({
        success: false,
        error: 'description is required',
        code: 'INVALID_INPUT'
      });
      return;
    }

    const result = await aiBrain.categorizeExpense({ description, amount, date, merchant });

    res.json({
      success: true,
      data: {
        originalDescription: description,
        ...result
      }
    });

    logger.info('Expense categorized by AI Brain', {
      userId: req.user?.userId,
      description: description.substring(0, 50),
      category: result.category,
      confidence: result.confidence
    });
  } catch (error) {
    logger.error('AI expense categorize error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to categorize expense',
      code: 'AI_EXPENSE_CATEGORIZE_ERROR'
    });
  }
});

// ============================================
// POST /api/ai/reports/generate - Generate financial report
// ============================================
router.post('/reports/generate', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, period, business, sections } = req.body;

    if (!type || !period) {
      res.status(400).json({
        success: false,
        error: 'type and period are required',
        code: 'INVALID_INPUT'
      });
      return;
    }

    const validTypes = ['monthly', 'quarterly', 'yearly', 'custom'];
    const validBusinesses = ['restaurant', 'retail', 'service', 'manufacturing', 'general'];

    if (!validTypes.includes(type)) {
      res.status(400).json({
        success: false,
        error: `type must be one of: ${validTypes.join(', ')}`,
        code: 'INVALID_TYPE'
      });
      return;
    }

    const result = await aiBrain.generateReport({
      type,
      period,
      business: validBusinesses.includes(business) ? business : 'general',
      sections
    });

    res.json({
      success: true,
      data: result
    });

    logger.info('Report generated by AI Brain', {
      userId: req.user?.userId,
      reportType: type,
      period,
      sectionsCount: result.sections?.length || 0
    });
  } catch (error) {
    logger.error('AI report generation error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      code: 'AI_REPORT_GENERATE_ERROR'
    });
  }
});

// ============================================
// POST /api/ai/tax/compliance - Check tax compliance
// ============================================
router.post('/tax/compliance', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactions, jurisdiction, taxType, period } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      res.status(400).json({
        success: false,
        error: 'transactions array is required',
        code: 'INVALID_INPUT'
      });
      return;
    }

    const validJurisdictions = ['India', 'USA', 'UK', 'EU'];
    const validTaxTypes = ['GST', 'TDS', 'VAT', 'IncomeTax', 'SalesTax'];

    const result = await aiBrain.checkTaxCompliance({
      transactions,
      jurisdiction: validJurisdictions.includes(jurisdiction) ? jurisdiction : 'India',
      taxType: validTaxTypes.includes(taxType) ? taxType : 'GST',
      period: period || new Date().toISOString().slice(0, 7)
    });

    res.json({
      success: true,
      data: {
        ...result,
        summary: {
          compliant: result.compliant,
          score: result.score,
          riskCount: result.risks.length,
          suggestionCount: result.suggestions.length
        }
      }
    });

    logger.info('Tax compliance checked by AI Brain', {
      userId: req.user?.userId,
      jurisdiction,
      taxType,
      compliant: result.compliant,
      score: result.score
    });
  } catch (error) {
    logger.error('AI tax compliance error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to check tax compliance',
      code: 'AI_TAX_COMPLIANCE_ERROR'
    });
  }
});

// ============================================
// POST /api/ai/anomaly/detect - Detect transaction anomalies
// ============================================
router.post('/anomaly/detect', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactions, normalRange, sensitivity } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      res.status(400).json({
        success: false,
        error: 'transactions array is required',
        code: 'INVALID_INPUT'
      });
      return;
    }

    const result = await aiBrain.detectAnomalies({
      transactions,
      normalRange,
      sensitivity: sensitivity || 0.7
    });

    res.json({
      success: true,
      data: {
        ...result,
        insights: {
          totalAnomalies: result.total,
          highSeverity: result.highSeverity,
          mediumSeverity: result.mediumSeverity,
          lowSeverity: result.lowSeverity,
          requiresAttention: result.highSeverity > 0
        }
      }
    });

    logger.info('Anomalies detected by AI Brain', {
      userId: req.user?.userId,
      totalTransactions: transactions.length,
      anomaliesFound: result.total,
      highSeverity: result.highSeverity
    });
  } catch (error) {
    logger.error('AI anomaly detection error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to detect anomalies',
      code: 'AI_ANOMALY_DETECT_ERROR'
    });
  }
});

// ============================================
// POST /api/ai/cashflow/forecast - Forecast cash flow
// ============================================
router.post('/cashflow/forecast', authenticate, aiLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { historicalTransactions, months, includeSeasonality, confidenceLevel } = req.body;

    if (!historicalTransactions || !Array.isArray(historicalTransactions) || historicalTransactions.length === 0) {
      res.status(400).json({
        success: false,
        error: 'historicalTransactions array is required',
        code: 'INVALID_INPUT'
      });
      return;
    }

    const result = await aiBrain.forecastCashFlow({
      historicalTransactions,
      months: Math.min(Math.max(months || 3, 1), 12),
      includeSeasonality: includeSeasonality !== false,
      confidenceLevel: confidenceLevel || 0.8
    });

    res.json({
      success: true,
      data: {
        ...result,
        insights: {
          runway: result.runway,
          riskLevel: result.riskAssessment.level,
          forecastMonths: result.forecasts.length,
          totalPredictedIncome: result.forecasts.reduce((sum, f) => sum + f.predictedIncome, 0),
          totalPredictedExpenses: result.forecasts.reduce((sum, f) => sum + f.predictedExpenses, 0),
          totalPredictedNetCashFlow: result.forecasts.reduce((sum, f) => sum + f.predictedNetCashFlow, 0)
        }
      }
    });

    logger.info('Cash flow forecast by AI Brain', {
      userId: req.user?.userId,
      historicalTransactions: historicalTransactions.length,
      forecastMonths: result.forecasts.length,
      runway: result.runway
    });
  } catch (error) {
    logger.error('AI cash flow forecast error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to forecast cash flow',
      code: 'AI_CASHFLOW_FORECAST_ERROR'
    });
  }
});

export default router;