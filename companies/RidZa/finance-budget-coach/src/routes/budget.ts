/**
 * Budget Routes
 * API endpoints for budget management and analysis
 */

import { Router, Request, Response } from 'express';
import { Budget, IBudget, BudgetCategory, CATEGORY_LABELS } from '../models/Budget';
import { analyzeBudget, simulateScenario, IScenarioInput } from '../services/budgetAnalysis';
import { authenticate, validateTenantAccess, AuthRequest } from '../middleware/auth';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication and tenant access
router.use(authenticate);
router.use(validateTenantAccess);

/**
 * GET /budgets/:tenantId
 * Get all budgets for a tenant
 */
router.get('/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId!;
    const { fiscalYear, limit = '50' } = req.query;
    
    const query: Record<string, unknown> = { tenantId };
    if (fiscalYear) {
      query.fiscalYear = parseInt(fiscalYear as string, 10);
    }
    
    const budgets = await Budget.find(query)
      .sort({ fiscalYear: -1, fiscalQuarter: -1 })
      .limit(parseInt(limit as string, 10));
    
    res.json({
      data: budgets,
      count: budgets.length,
    });
  })
);

/**
 * GET /budgets/:tenantId/:budgetId
 * Get a specific budget
 */
router.get('/:budgetId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { budgetId } = req.params;
    
    const budget = await Budget.findById(budgetId);
    if (!budget) {
      throw new NotFoundError('Budget');
    }
    
    // Verify tenant access
    if (budget.tenantId !== req.tenantId) {
      throw new NotFoundError('Budget');
    }
    
    res.json({ data: budget });
  })
);

/**
 * POST /budgets/:tenantId
 * Create a new budget
 */
router.post('/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId!;
    const { name, fiscalYear, fiscalQuarter, items, spending } = req.body;
    
    // Validate required fields
    const errors: Record<string, string> = {};
    if (!name) errors.name = 'Budget name is required';
    if (!fiscalYear) errors.fiscalYear = 'Fiscal year is required';
    if (!items || !Array.isArray(items)) errors.items = 'Budget items array is required';
    
    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
    
    const budget = new Budget({
      tenantId,
      name,
      fiscalYear: parseInt(fiscalYear, 10),
      fiscalQuarter: fiscalQuarter ? parseInt(fiscalQuarter, 10) : undefined,
      items: items || [],
      spending: spending || [],
    });
    
    await budget.save();
    
    res.status(201).json({
      data: budget,
      message: 'Budget created successfully',
    });
  })
);

/**
 * PUT /budgets/:tenantId/:budgetId
 * Update a budget
 */
router.put('/:budgetId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { budgetId } = req.params;
    const { name, fiscalYear, fiscalQuarter, items, spending } = req.body;
    
    const budget = await Budget.findById(budgetId);
    if (!budget) {
      throw new NotFoundError('Budget');
    }
    
    // Verify tenant access
    if (budget.tenantId !== req.tenantId) {
      throw new NotFoundError('Budget');
    }
    
    // Update fields
    if (name) budget.name = name;
    if (fiscalYear) budget.fiscalYear = parseInt(fiscalYear, 10);
    if (fiscalQuarter !== undefined) budget.fiscalQuarter = parseInt(fiscalQuarter, 10);
    if (items) budget.items = items;
    if (spending) budget.spending = spending;
    
    await budget.save();
    
    res.json({
      data: budget,
      message: 'Budget updated successfully',
    });
  })
);

/**
 * DELETE /budgets/:tenantId/:budgetId
 * Delete a budget
 */
router.delete('/:budgetId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { budgetId } = req.params;
    
    const budget = await Budget.findByIdAndDelete(budgetId);
    if (!budget) {
      throw new NotFoundError('Budget');
    }
    
    // Verify tenant access
    if (budget.tenantId !== req.tenantId) {
      throw new NotFoundError('Budget');
    }
    
    res.json({ message: 'Budget deleted successfully' });
  })
);

/**
 * POST /budgets/:tenantId/:budgetId/spending
 * Add spending record to a budget
 */
router.post('/:budgetId/spending',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { budgetId } = req.params;
    const { category, subcategory, description, amount, date, type } = req.body;
    
    // Validate
    const errors: Record<string, string> = {};
    if (!category) errors.category = 'Category is required';
    if (!description) errors.description = 'Description is required';
    if (amount === undefined || amount < 0) errors.amount = 'Valid amount is required';
    if (!type || !['income', 'expense'].includes(type)) errors.type = 'Type must be income or expense';
    
    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
    
    const budget = await Budget.findById(budgetId);
    if (!budget) {
      throw new NotFoundError('Budget');
    }
    
    if (budget.tenantId !== req.tenantId) {
      throw new NotFoundError('Budget');
    }
    
    budget.spending.push({
      category: category as BudgetCategory,
      subcategory,
      description,
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      type,
    });
    
    await budget.save();
    
    res.status(201).json({
      data: budget,
      message: 'Spending record added',
    });
  })
);

/**
 * GET /advice/:tenantId
 * Get budget advice and recommendations
 */
router.get('/advice',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId!;
    const { fiscalYear } = req.query;
    
    const analysis = await analyzeBudget(
      tenantId,
      fiscalYear ? parseInt(fiscalYear as string, 10) : undefined
    );
    
    res.json({
      data: {
        overallHealth: analysis.overallHealth,
        totalBudgeted: analysis.totalBudgeted,
        totalSpent: analysis.totalSpent,
        variance: analysis.totalVariance,
        variancePercent: analysis.variancePercent,
        recommendations: analysis.recommendations,
        insights: analysis.insights,
      },
      generatedAt: analysis.generatedAt,
    });
  })
);

/**
 * POST /simulate/:tenantId
 * Simulate budget scenarios
 */
router.post('/simulate',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId!;
    const { scenarios } = req.body;
    
    if (!scenarios || !Array.isArray(scenarios)) {
      throw new ValidationError('Validation failed', { scenarios: 'Scenarios array is required' });
    }
    
    // Validate scenarios
    const validCategories = Object.keys(CATEGORY_LABELS);
    for (let i = 0; i < scenarios.length; i++) {
      const s = scenarios[i];
      if (!validCategories.includes(s.category)) {
        throw new ValidationError('Validation failed', {
          [`scenarios[${i}].category`]: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        });
      }
      if (!['increase', 'decrease', 'set'].includes(s.changeType)) {
        throw new ValidationError('Validation failed', {
          [`scenarios[${i}].changeType`]: 'Must be increase, decrease, or set',
        });
      }
    }
    
    const result = await simulateScenario(tenantId, scenarios as IScenarioInput[]);
    
    res.json({ data: result });
  })
);

/**
 * GET /categories
 * Get available budget categories
 */
router.get('/categories',
  asyncHandler(async (_req: Request, res: Response) => {
    const categories = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
      id: key,
      label,
    }));
    
    res.json({ data: categories });
  })
);

export default router;
