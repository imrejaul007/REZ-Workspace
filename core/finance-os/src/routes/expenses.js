import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory expense storage
const expenses = new Map();

/**
 * GET /api/expenses
 * List expenses
 */
router.get('/', async (req, res) => {
  try {
    const { industry, category, startDate, endDate } = req.query;

    let list = Array.from(expenses.values());

    if (industry) list = list.filter(e => e.industry === industry);
    if (category) list = list.filter(e => e.category === category);

    res.json({
      success: true,
      count: list.length,
      expenses: list
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/expenses
 * Create expense
 */
router.post('/', async (req, res) => {
  try {
    const {
      amount,
      description,
      category,
      industry,
      vendor,
      date
    } = req.body;

    if (!amount || !description) {
      return res.status(400).json({
        success: false,
        error: 'Amount and description are required'
      });
    }

    const expenseId = `expense_${uuidv4()}`;
    const expense = {
      id: expenseId,
      amount,
      description,
      category,
      industry,
      vendor,
      date: date || new Date().toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    expenses.set(expenseId, expense);

    res.status(201).json({
      success: true,
      expense
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/expenses/:id
 * Get expense details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expense = expenses.get(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    res.json({
      success: true,
      expense
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
