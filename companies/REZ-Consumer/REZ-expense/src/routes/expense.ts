/**
 * REZ Expense - Expense Routes
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const expenseRouter = Router();

// Categories
const CATEGORIES = ['food', 'travel', 'shopping', 'entertainment', 'utilities', 'healthcare', 'education', 'other'];

// In-memory store
const expenses = new Map();

/**
 * POST /api/expense/add
 * Add expense
 */
expenseRouter.post('/add', async (req, res) => {
  try {
    const { userId, merchantName, category, amount, date, receiptUrl, location } = req.body;

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category' });
    }

    const expense = {
      expense_id: uuidv4(),
      user_id: userId,
      merchant_name: merchantName,
      category,
      amount: parseFloat(amount),
      currency: 'INR',
      date: date || new Date().toISOString(),
      receipt_url: receiptUrl || null,
      location: location || null,
      created_at: new Date(),
    };

    expenses.set(expense.expense_id, expense);

    res.json({ success: true, data: { expense } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add expense' });
  }
});

/**
 * GET /api/expense/history
 * Get expense history
 */
expenseRouter.get('/history', async (req, res) => {
  try {
    const { userId, category, startDate, endDate, limit = '50' } = req.query;

    let userExpenses = Array.from(expenses.values())
      .filter(e => e.user_id === userId);

    if (category) {
      userExpenses = userExpenses.filter(e => e.category === category);
    }

    if (startDate) {
      userExpenses = userExpenses.filter(e => new Date(e.date) >= new Date(startDate as string));
    }

    if (endDate) {
      userExpenses = userExpenses.filter(e => new Date(e.date) <= new Date(endDate as string));
    }

    // Sort by date descending
    userExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Limit
    userExpenses = userExpenses.slice(0, parseInt(limit as string, 10));

    res.json({
      success: true,
      data: {
        expenses: userExpenses,
        total: userExpenses.length,
        total_amount: userExpenses.reduce((sum, e) => sum + e.amount, 0),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get history' });
  }
});

/**
 * GET /api/expense/stats
 * Get expense statistics
 */
expenseRouter.get('/stats', async (req, res) => {
  try {
    const { userId, period = 'month' } = req.query;

    const userExpenses = Array.from(expenses.values())
      .filter(e => e.user_id === userId);

    // Group by category
    const byCategory = userExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate totals
    const total = userExpenses.reduce((sum, e) => sum + e.amount, 0);
    const count = userExpenses.length;
    const average = count > 0 ? total / count : 0;

    res.json({
      success: true,
      data: {
        total,
        count,
        average,
        by_category: byCategory,
        categories: CATEGORIES,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

/**
 * DELETE /api/expense/:id
 * Delete expense
 */
expenseRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    expenses.delete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete expense' });
  }
});

/**
 * GET /api/expense/categories
 * Get available categories
 */
expenseRouter.get('/categories/list', async (req, res) => {
  res.json({
    success: true,
    data: { categories: CATEGORIES },
  });
});
