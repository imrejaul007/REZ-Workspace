/**
 * LEDGERAI - Budget Routes
 * Budget management and tracking
 */

import { Router, Request, Response } from 'express';
import { Budget, Transaction } from '../models';
import { authenticate, authorize } from '../middleware/auth';
import { validate, createBudgetSchema, updateBudgetSchema, validateObjectId } from '../middleware/validation';
import { writeLimiter } from '../middleware/rateLimiter';
import logger from '../middleware/logger';

const router = Router();

// ============================================
// GET /api/budgets - List budgets
// ============================================
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      period,
      isActive,
      startDate,
      endDate,
      page = '1',
      limit = '50'
    } = req.query;

    const filter: any = {};

    if (category) filter.category = { $regex: category, $options: 'i' };
    if (period) filter.period = period;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate as string);
      if (endDate) filter.startDate.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [budgets, total] = await Promise.all([
      Budget.find(filter)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Budget.countDocuments(filter)
    ]);

    // Get actual spending for each budget
    const budgetsWithActual = await Promise.all(budgets.map(async (budget) => {
      const actual = await calculateActualSpending(budget.category, budget.startDate, budget.endDate);
      const variance = actual - budget.budgeted;
      const variancePercentage = budget.budgeted > 0 ? (variance / budget.budgeted) * 100 : 0;

      return {
        ...budget,
        actual,
        variance,
        variancePercentage
      };
    }));

    // Summary by period
    const periodSummary = await Budget.aggregate([
      { $group: { _id: '$period', count: { $sum: 1 }, totalBudgeted: { $sum: '$budgeted' } } }
    ]);

    res.json({
      success: true,
      data: {
        budgets: budgetsWithActual,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        periodSummary
      }
    });
  } catch (error) {
    logger.error('Get budgets error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve budgets',
      code: 'GET_BUDGETS_ERROR'
    });
  }
});

// ============================================
// GET /api/budgets/:id - Get single budget
// ============================================
router.get('/:id', authenticate, validateObjectId('id'), async (req: Request, res: Response): Promise<void> => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      res.status(404).json({
        success: false,
        error: 'Budget not found',
        code: 'BUDGET_NOT_FOUND'
      });
      return;
    }

    // Get actual spending
    const actual = await calculateActualSpending(budget.category, budget.startDate, budget.endDate);
    const variance = actual - budget.budgeted;
    const variancePercentage = budget.budgeted > 0 ? (variance / budget.budgeted) * 100 : 0;

    // Get transactions for this budget period
    const transactions = await Transaction.find({
      category: { $regex: new RegExp(budget.category, 'i') },
      date: { $gte: budget.startDate, $lte: budget.endDate }
    })
      .sort({ date: -1 })
      .limit(50)
      .select('date description amount category reference')
      .lean();

    res.json({
      success: true,
      data: {
        budget: {
          ...budget.toObject(),
          actual,
          variance,
          variancePercentage
        },
        transactions,
        summary: {
          transactionCount: transactions.length,
          totalActual: actual
        }
      }
    });
  } catch (error) {
    logger.error('Get budget error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve budget',
      code: 'GET_BUDGET_ERROR'
    });
  }
});

// ============================================
// POST /api/budgets - Create budget
// ============================================
router.post('/', authenticate, authorize('admin', 'accountant'), writeLimiter, validate(createBudgetSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, subcategory, period, startDate, endDate, budgeted } = req.body;

    // Check for overlapping budgets
    const overlapping = await Budget.findOne({
      category: { $regex: new RegExp(`^${category}$`, 'i') },
      period,
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ],
      isActive: true
    });

    if (overlapping) {
      res.status(400).json({
        success: false,
        error: 'Budget already exists for this category and period',
        code: 'OVERLAPPING_BUDGET',
        existingBudget: {
          id: overlapping._id,
          startDate: overlapping.startDate,
          endDate: overlapping.endDate
        }
      });
      return;
    }

    // Calculate actual spending for the period
    const actual = await calculateActualSpending(category, startDate, endDate);
    const variance = actual - budgeted;
    const variancePercentage = budgeted > 0 ? (variance / budgeted) * 100 : 0;

    const budget = new Budget({
      category,
      subcategory,
      period,
      startDate,
      endDate,
      budgeted,
      actual,
      variance,
      variancePercentage,
      isActive: true
    });

    await budget.save();

    logger.info('Budget created', {
      budgetId: budget._id,
      category,
      period,
      budgeted
    });

    res.status(201).json({
      success: true,
      data: { budget },
      message: 'Budget created successfully'
    });
  } catch (error) {
    logger.error('Create budget error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create budget',
      code: 'CREATE_BUDGET_ERROR'
    });
  }
});

// ============================================
// PATCH /api/budgets/:id - Update budget
// ============================================
router.patch('/:id', authenticate, authorize('admin', 'accountant'), writeLimiter, validateObjectId('id'), validate(updateBudgetSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      res.status(404).json({
        success: false,
        error: 'Budget not found',
        code: 'BUDGET_NOT_FOUND'
      });
      return;
    }

    const { category, subcategory, period, startDate, endDate, budgeted, isActive } = req.body;

    if (category) budget.category = category;
    if (subcategory !== undefined) budget.subcategory = subcategory;
    if (period) budget.period = period;
    if (isActive !== undefined) budget.isActive = isActive;

    // Recalculate dates if provided
    let newStartDate = budget.startDate;
    let newEndDate = budget.endDate;
    let newBudgeted = budget.budgeted;

    if (startDate) {
      newStartDate = new Date(startDate);
      budget.startDate = newStartDate;
    }
    if (endDate) {
      newEndDate = new Date(endDate);
      budget.endDate = newEndDate;
    }
    if (budgeted !== undefined) {
      newBudgeted = budgeted;
      budget.budgeted = budgeted;
    }

    // Recalculate actual spending
    const actual = await calculateActualSpending(budget.category, newStartDate, newEndDate);
    budget.actual = actual;
    budget.variance = actual - newBudgeted;
    budget.variancePercentage = newBudgeted > 0 ? ((budget.variance) / newBudgeted) * 100 : 0;

    await budget.save();

    logger.info('Budget updated', {
      budgetId: budget._id,
      category: budget.category,
      updatedBy: req.user?.userId
    });

    res.json({
      success: true,
      data: { budget },
      message: 'Budget updated successfully'
    });
  } catch (error) {
    logger.error('Update budget error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update budget',
      code: 'UPDATE_BUDGET_ERROR'
    });
  }
});

// ============================================
// POST /api/budgets/:id/refresh - Recalculate actual spending
// ============================================
router.post('/:id/refresh', authenticate, authorize('admin', 'accountant'), writeLimiter, validateObjectId('id'), async (req: Request, res: Response): Promise<void> => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      res.status(404).json({
        success: false,
        error: 'Budget not found',
        code: 'BUDGET_NOT_FOUND'
      });
      return;
    }

    const actual = await calculateActualSpending(budget.category, budget.startDate, budget.endDate);
    budget.actual = actual;
    budget.variance = actual - budget.budgeted;
    budget.variancePercentage = budget.budgeted > 0 ? ((budget.variance) / budget.budgeted) * 100 : 0;

    await budget.save();

    logger.info('Budget refreshed', {
      budgetId: budget._id,
      actual,
      variance: budget.variance
    });

    res.json({
      success: true,
      data: { budget },
      message: 'Budget actual spending updated'
    });
  } catch (error) {
    logger.error('Refresh budget error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to refresh budget',
      code: 'REFRESH_BUDGET_ERROR'
    });
  }
});

// ============================================
// DELETE /api/budgets/:id - Delete budget
// ============================================
router.delete('/:id', authenticate, authorize('admin'), writeLimiter, validateObjectId('id'), async (req: Request, res: Response): Promise<void> => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      res.status(404).json({
        success: false,
        error: 'Budget not found',
        code: 'BUDGET_NOT_FOUND'
      });
      return;
    }

    await Budget.findByIdAndDelete(req.params.id);

    logger.info('Budget deleted', {
      budgetId: req.params.id,
      category: budget.category,
      deletedBy: req.user?.userId
    });

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    logger.error('Delete budget error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete budget',
      code: 'DELETE_BUDGET_ERROR'
    });
  }
});

// ============================================
// GET /api/budgets/summary/overview - Get budget overview
// ============================================
router.get('/summary/overview', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = 'monthly' } = req.query;

    // Get current period dates
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const budgets = await Budget.find({
      isActive: true,
      period: period as string,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    }).lean();

    // Calculate totals
    const budgetsWithSpending = await Promise.all(budgets.map(async (budget) => {
      const actual = await calculateActualSpending(budget.category, budget.startDate, budget.endDate);
      return {
        ...budget,
        actual,
        variance: actual - budget.budgeted
      };
    }));

    const totalBudgeted = budgetsWithSpending.reduce((sum, b) => sum + b.budgeted, 0);
    const totalActual = budgetsWithSpending.reduce((sum, b) => sum + b.actual, 0);
    const totalVariance = totalActual - totalBudgeted;

    // Count by status
    const onTrack = budgetsWithSpending.filter(b => Math.abs(b.variance) <= b.budgeted * 0.05).length;
    const overBudget = budgetsWithSpending.filter(b => b.variance > b.budgeted * 0.05).length;
    const underBudget = budgetsWithSpending.filter(b => b.variance < -b.budgeted * 0.05).length;

    res.json({
      success: true,
      data: {
        budgets: budgetsWithSpending,
        summary: {
          period,
          startDate,
          endDate,
          totalBudgeted,
          totalActual,
          totalVariance,
          utilizationRate: totalBudgeted > 0 ? Math.round((totalActual / totalBudgeted) * 1000) / 10 : 0,
          status: {
            onTrack,
            overBudget,
            underBudget
          }
        }
      }
    });
  } catch (error) {
    logger.error('Get budget overview error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get budget overview',
      code: 'OVERVIEW_ERROR'
    });
  }
});

// ============================================
// Helper function: Calculate actual spending
// ============================================
async function calculateActualSpending(category: string, startDate: Date, endDate: Date): Promise<number> {
  const transactions = await Transaction.find({
    date: { $gte: startDate, $lte: endDate },
    category: { $regex: new RegExp(category, 'i') }
  });

  return transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
}

export default router;