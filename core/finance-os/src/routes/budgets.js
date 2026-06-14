import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { budgetRegistry, BUDGET_STATUS } from '../index.js';

const router = express.Router();

/**
 * GET /api/budgets
 * List all budgets
 */
router.get('/', async (req, res) => {
  try {
    const { status, industry } = req.query;

    let budgets = Array.from(budgetRegistry.values());

    if (status) budgets = budgets.filter(b => b.status === status);
    if (industry) budgets = budgets.filter(b => b.industry === industry);

    res.json({
      success: true,
      count: budgets.length,
      budgets
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/budgets
 * Create a budget
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      amount,
      industry,
      period = 'monthly',
      categories = []
    } = req.body;

    if (!name || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Name and amount are required'
      });
    }

    const budgetId = `budget_${uuidv4()}`;
    const budget = {
      id: budgetId,
      name,
      amount,
      spent: 0,
      industry,
      period,
      categories,
      status: BUDGET_STATUS.DRAFT,
      createdAt: new Date().toISOString()
    };

    budgetRegistry.set(budgetId, budget);

    res.status(201).json({
      success: true,
      budget
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/budgets/:id
 * Get budget details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const budget = budgetRegistry.get(id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found'
      });
    }

    res.json({
      success: true,
      budget
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/budgets/:id/allocate
 * Allocate spending to budget
 */
router.patch('/:id/allocate', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category } = req.body;

    const budget = budgetRegistry.get(id);
    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }

    budget.spent += amount;
    budget.spending = budget.spending || [];
    budget.spending.push({
      amount,
      category,
      date: new Date().toISOString()
    });

    // Check if budget exceeded
    if (budget.spent > budget.amount) {
      budget.status = BUDGET_STATUS.EXCEEDED;
    }

    budgetRegistry.set(id, budget);

    res.json({
      success: true,
      budget
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
