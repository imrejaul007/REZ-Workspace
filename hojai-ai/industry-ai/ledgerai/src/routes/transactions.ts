/**
 * LEDGERAI - Transaction Routes
 * Double-entry bookkeeping transactions
 */

import { Router, Request, Response } from 'express';
import { Transaction, Account } from '../models';
import { Types } from 'mongoose';
import { authenticate, authorize } from '../middleware/auth';
import { validate, createTransactionSchema, validateObjectId } from '../middleware/validation';
import { writeLimiter } from '../middleware/rateLimiter';
import logger from '../middleware/logger';
import { triggerWebhook, syncToHOJAI } from '../utils/webhook';

const router = Router();

// ============================================
// GET /api/transactions - List transactions
// ============================================
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      reconciled,
      startDate,
      endDate,
      search,
      minAmount,
      maxAmount,
      page = '1',
      limit = '50',
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const filter: any = {};

    if (category) filter.category = category;
    if (reconciled !== undefined) filter.reconciled = reconciled === 'true';
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }
    if (search) {
      filter.$text = { $search: search as string };
    }
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount as string);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount as string);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('accounts.accountId', 'code name type')
        .populate('reconciledBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(filter)
    ]);

    // Calculate summary
    const summary = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          totalDebit: { $sum: { $sum: '$accounts.debit' } },
          totalCredit: { $sum: { $sum: '$accounts.credit' } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        summary: summary[0] || { totalAmount: 0, count: 0 }
      }
    });
  } catch (error) {
    logger.error('Get transactions error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve transactions',
      code: 'GET_TRANSACTIONS_ERROR'
    });
  }
});

// ============================================
// GET /api/transactions/:id - Get single transaction
// ============================================
router.get('/:id', authenticate, validateObjectId('id'), async (req: Request, res: Response): Promise<void> => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('accounts.accountId', 'code name type category balance')
      .populate('reconciledBy', 'name email');

    if (!transaction) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND'
      });
      return;
    }

    res.json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    logger.error('Get transaction error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve transaction',
      code: 'GET_TRANSACTION_ERROR'
    });
  }
});

// ============================================
// POST /api/transactions - Create transaction
// ============================================
router.post('/', authenticate, authorize('admin', 'accountant'), writeLimiter, validate(createTransactionSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, description, accounts, amount, category, subcategory, reference, notes } = req.body;

    // Validate that debits equal credits
    const totalDebits = accounts.reduce((sum: number, acc: any) => sum + (acc.debit || 0), 0);
    const totalCredits = accounts.reduce((sum: number, acc: any) => sum + (acc.credit || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      res.status(400).json({
        success: false,
        error: 'Debits must equal credits',
        code: 'IMBALANCED_ENTRY',
        details: { totalDebits, totalCredits, difference: totalDebits - totalCredits }
      });
      return;
    }

    // Validate and populate account information
    const populatedAccounts = [];
    for (const acc of accounts) {
      const account = await Account.findById(acc.accountId);
      if (!account) {
        res.status(400).json({
          success: false,
          error: `Account not found: ${acc.accountId}`,
          code: 'INVALID_ACCOUNT'
        });
        return;
      }

      populatedAccounts.push({
        accountId: account._id,
        accountCode: account.code,
        accountName: account.name,
        debit: acc.debit || 0,
        credit: acc.credit || 0
      });

      // Update account balances
      if (account.type === 'asset' || account.type === 'expense') {
        account.balance += (acc.debit || 0) - (acc.credit || 0);
      } else {
        account.balance += (acc.credit || 0) - (acc.debit || 0);
      }
      await account.save();
    }

    const transaction = new Transaction({
      date,
      description,
      accounts: populatedAccounts,
      amount: totalDebits,
      category,
      subcategory,
      reference,
      notes,
      reconciled: false
    });

    await transaction.save();

    logger.info('Transaction created', {
      transactionId: transaction._id,
      amount: transaction.amount,
      category: transaction.category,
      createdBy: req.user?.userId
    });

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('ledgerai.transaction.recorded', { transactionId: transaction._id.toString(), amount: transaction.amount, category: transaction.category, description });
    await syncToHOJAI('transaction', 'recorded', { transactionId: transaction._id.toString(), amount: transaction.amount, category: transaction.category, description });

    res.status(201).json({
      success: true,
      data: { transaction },
      message: 'Transaction created successfully'
    });
  } catch (error) {
    logger.error('Create transaction error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create transaction',
      code: 'CREATE_TRANSACTION_ERROR'
    });
  }
});

// ============================================
// PATCH /api/transactions/:id - Update transaction
// ============================================
router.patch('/:id', authenticate, authorize('admin', 'accountant'), writeLimiter, validateObjectId('id'), async (req: Request, res: Response): Promise<void> => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND'
      });
      return;
    }

    if (transaction.reconciled) {
      res.status(400).json({
        success: false,
        error: 'Cannot modify reconciled transaction',
        code: 'RECONCILED'
      });
      return;
    }

    const { description, category, subcategory, reference, notes } = req.body;

    if (description) transaction.description = description;
    if (category) transaction.category = category;
    if (subcategory !== undefined) transaction.subcategory = subcategory;
    if (reference !== undefined) transaction.reference = reference;
    if (notes !== undefined) transaction.notes = notes;

    await transaction.save();

    logger.info('Transaction updated', {
      transactionId: transaction._id,
      updatedBy: req.user?.userId
    });

    res.json({
      success: true,
      data: { transaction },
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    logger.error('Update transaction error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update transaction',
      code: 'UPDATE_TRANSACTION_ERROR'
    });
  }
});

// ============================================
// POST /api/transactions/:id/reconcile - Reconcile transaction
// ============================================
router.post('/:id/reconcile', authenticate, authorize('admin', 'accountant'), writeLimiter, validateObjectId('id'), async (req: Request, res: Response): Promise<void> => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND'
      });
      return;
    }

    if (transaction.reconciled) {
      res.status(400).json({
        success: false,
        error: 'Transaction already reconciled',
        code: 'ALREADY_RECONCILED'
      });
      return;
    }

    transaction.reconciled = true;
    transaction.reconciledAt = new Date();
    transaction.reconciledBy = req.user?.userId ? new Types.ObjectId(req.user.userId) : undefined;

    await transaction.save();

    logger.info('Transaction reconciled', {
      transactionId: transaction._id,
      reconciledBy: req.user?.userId
    });

    res.json({
      success: true,
      data: { transaction },
      message: 'Transaction reconciled successfully'
    });
  } catch (error) {
    logger.error('Reconcile transaction error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to reconcile transaction',
      code: 'RECONCILE_ERROR'
    });
  }
});

// ============================================
// POST /api/transactions/:id/unreconcile - Unreconcile transaction
// ============================================
router.post('/:id/unreconcile', authenticate, authorize('admin', 'accountant'), writeLimiter, validateObjectId('id'), async (req: Request, res: Response): Promise<void> => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND'
      });
      return;
    }

    if (!transaction.reconciled) {
      res.status(400).json({
        success: false,
        error: 'Transaction is not reconciled',
        code: 'NOT_RECONCILED'
      });
      return;
    }

    transaction.reconciled = false;
    transaction.reconciledAt = undefined;
    transaction.reconciledBy = undefined;

    await transaction.save();

    logger.info('Transaction unreconciled', {
      transactionId: transaction._id,
      unreconciledBy: req.user?.userId
    });

    res.json({
      success: true,
      data: { transaction },
      message: 'Transaction unreconciled successfully'
    });
  } catch (error) {
    logger.error('Unreconcile transaction error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to unreconcile transaction',
      code: 'UNRECONCILE_ERROR'
    });
  }
});

// ============================================
// DELETE /api/transactions/:id - Delete transaction
// ============================================
router.delete('/:id', authenticate, authorize('admin'), writeLimiter, validateObjectId('id'), async (req: Request, res: Response): Promise<void> => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND'
      });
      return;
    }

    if (transaction.reconciled) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete reconciled transaction',
        code: 'RECONCILED'
      });
      return;
    }

    // Reverse account balances
    for (const acc of transaction.accounts) {
      const account = await Account.findById(acc.accountId);
      if (account) {
        if (account.type === 'asset' || account.type === 'expense') {
          account.balance -= (acc as any).debit - (acc as any).credit;
        } else {
          account.balance -= (acc as any).credit - (acc as any).debit;
        }
        await account.save();
      }
    }

    await Transaction.findByIdAndDelete(req.params.id);

    logger.info('Transaction deleted', {
      transactionId: req.params.id,
      deletedBy: req.user?.userId
    });

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    logger.error('Delete transaction error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete transaction',
      code: 'DELETE_TRANSACTION_ERROR'
    });
  }
});

// ============================================
// GET /api/transactions/categories/list - Get unique categories
// ============================================
router.get('/categories/list', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Transaction.distinct('category');

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    logger.error('Get categories error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve categories',
      code: 'GET_CATEGORIES_ERROR'
    });
  }
});

// ============================================
// POST /api/transactions/bulk - Bulk create transactions
// ============================================
router.post('/bulk', authenticate, authorize('admin', 'accountant'), writeLimiter, async (req: Request, res: Response): Promise<void> => {
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

    const results = [];
    const errors = [];

    for (let i = 0; i < transactions.length; i++) {
      const txData = transactions[i];

      try {
        // Validate accounts
        for (const acc of txData.accounts || []) {
          const account = await Account.findById(acc.accountId);
          if (!account) {
            errors.push({ index: i, error: `Account not found: ${acc.accountId}` });
            continue;
          }
        }

        // Create transaction
        const populatedAccounts = [];
        for (const acc of txData.accounts || []) {
          const account = await Account.findById(acc.accountId);
          populatedAccounts.push({
            accountId: account!._id,
            accountCode: account!.code,
            accountName: account!.name,
            debit: acc.debit || 0,
            credit: acc.credit || 0
          });
        }

        const totalDebits = populatedAccounts.reduce((sum, acc) => sum + acc.debit, 0);

        const transaction = new Transaction({
          date: txData.date || new Date(),
          description: txData.description,
          accounts: populatedAccounts,
          amount: totalDebits,
          category: txData.category || 'General',
          subcategory: txData.subcategory,
          reference: txData.reference,
          reconciled: false
        });

        await transaction.save();
        results.push(transaction);
      } catch (err) {
        errors.push({ index: i, error: (err as Error).message });
      }
    }

    logger.info('Bulk transactions created', {
      created: results.length,
      errors: errors.length,
      createdBy: req.user?.userId
    });

    res.status(201).json({
      success: true,
      data: {
        created: results.length,
        transactions: results,
        errors
      }
    });
  } catch (error) {
    logger.error('Bulk create transactions error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create transactions',
      code: 'BULK_CREATE_ERROR'
    });
  }
});

export default router;