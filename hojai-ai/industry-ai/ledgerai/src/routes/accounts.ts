/**
 * LEDGERAI - Account Routes
 * CRUD operations for chart of accounts
 */

import { Router, Request, Response } from 'express';
import { Account } from '../models';
import { authenticate, authorize } from '../middleware/auth';
import { validate, createAccountSchema, updateAccountSchema, validateObjectId } from '../middleware/validation';
import { writeLimiter } from '../middleware/rateLimiter';
import logger from '../middleware/logger';

const router = Router();

// ============================================
// GET /api/accounts - List all accounts
// ============================================
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      type,
      category,
      isActive,
      search,
      page = '1',
      limit = '50'
    } = req.query;

    const filter: any = {};

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [accounts, total] = await Promise.all([
      Account.find(filter)
        .sort({ type: 1, code: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Account.countDocuments(filter)
    ]);

    // Calculate totals by type
    const typeTotals = await Account.aggregate([
      { $match: filter },
      { $group: { _id: '$type', totalBalance: { $sum: '$balance' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        accounts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        typeTotals: typeTotals.reduce((acc, t) => {
          acc[t._id] = { balance: t.totalBalance, count: t.count };
          return acc;
        }, {} as Record<string, { balance: number; count: number }>)
      }
    });
  } catch (error) {
    logger.error('Get accounts error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve accounts',
      code: 'GET_ACCOUNTS_ERROR'
    });
  }
});

// ============================================
// GET /api/accounts/:id - Get single account
// ============================================
router.get('/:id', authenticate, validateObjectId('id'), async (req: Request, res: Response): Promise<void> => {
  try {
    const account = await Account.findById(req.params.id).populate('parentId', 'code name');

    if (!account) {
      res.status(404).json({
        success: false,
        error: 'Account not found',
        code: 'ACCOUNT_NOT_FOUND'
      });
      return;
    }

    // Get child accounts
    const children = await Account.find({ parentId: account._id }).select('code name type balance');

    res.json({
      success: true,
      data: {
        account,
        children
      }
    });
  } catch (error) {
    logger.error('Get account error', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve account',
      code: 'GET_ACCOUNT_ERROR'
    });
  }
});

// ============================================
// POST /api/accounts - Create account
// ============================================
router.post('/', authenticate, authorize('admin', 'accountant'), writeLimiter, validate(createAccountSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, type, category, balance, description, parentId } = req.body;

    // Check if code already exists
    const existingAccount = await Account.findOne({ code: code.toUpperCase() });
    if (existingAccount) {
      res.status(400).json({
        success: false,
        error: 'Account code already exists',
        code: 'CODE_EXISTS'
      });
      return;
    }

    // Validate parent if provided
    if (parentId) {
      const parentAccount = await Account.findById(parentId);
      if (!parentAccount) {
        res.status(400).json({
          success: false,
          error: 'Parent account not found',
          code: 'INVALID_PARENT'
        });
        return;
      }

      // Ensure type matches parent
      if (parentAccount.type !== type) {
        res.status(400).json({
          success: false,
          error: 'Account type must match parent account type',
          code: 'TYPE_MISMATCH'
        });
        return;
      }
    }

    const account = new Account({
      name,
      code: code.toUpperCase(),
      type,
      category,
      balance: balance || 0,
      description,
      parentId,
      isActive: true,
      userId: req.user?.userId ? undefined : undefined
    });

    await account.save();

    logger.info('Account created', {
      accountId: account._id,
      code: account.code,
      name: account.name,
      createdBy: req.user?.userId
    });

    res.status(201).json({
      success: true,
      data: { account },
      message: 'Account created successfully'
    });
  } catch (error) {
    logger.error('Create account error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create account',
      code: 'CREATE_ACCOUNT_ERROR'
    });
  }
});

// ============================================
// PATCH /api/accounts/:id - Update account
// ============================================
router.patch('/:id', authenticate, authorize('admin', 'accountant'), writeLimiter, validateObjectId('id'), validate(updateAccountSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      res.status(404).json({
        success: false,
        error: 'Account not found',
        code: 'ACCOUNT_NOT_FOUND'
      });
      return;
    }

    const { name, code, type, category, balance, description, parentId, isActive } = req.body;

    // Check if new code conflicts with existing
    if (code && code.toUpperCase() !== account.code) {
      const existingAccount = await Account.findOne({ code: code.toUpperCase() });
      if (existingAccount) {
        res.status(400).json({
          success: false,
          error: 'Account code already exists',
          code: 'CODE_EXISTS'
        });
        return;
      }
    }

    // Update fields
    if (name !== undefined) account.name = name;
    if (code !== undefined) account.code = code.toUpperCase();
    if (type !== undefined) account.type = type;
    if (category !== undefined) account.category = category;
    if (balance !== undefined) account.balance = balance;
    if (description !== undefined) account.description = description;
    if (isActive !== undefined) account.isActive = isActive;

    if (parentId !== undefined) {
      if (parentId === req.params.id) {
        res.status(400).json({
          success: false,
          error: 'Account cannot be its own parent',
          code: 'INVALID_PARENT'
        });
        return;
      }
      account.parentId = parentId || undefined;
    }

    await account.save();

    logger.info('Account updated', {
      accountId: account._id,
      code: account.code,
      updatedBy: req.user?.userId
    });

    res.json({
      success: true,
      data: { account },
      message: 'Account updated successfully'
    });
  } catch (error) {
    logger.error('Update account error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update account',
      code: 'UPDATE_ACCOUNT_ERROR'
    });
  }
});

// ============================================
// DELETE /api/accounts/:id - Delete account
// ============================================
router.delete('/:id', authenticate, authorize('admin'), writeLimiter, validateObjectId('id'), async (req: Request, res: Response): Promise<void> => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      res.status(404).json({
        success: false,
        error: 'Account not found',
        code: 'ACCOUNT_NOT_FOUND'
      });
      return;
    }

    // Check for child accounts
    const childCount = await Account.countDocuments({ parentId: account._id });
    if (childCount > 0) {
      res.status(400).json({
        success: false,
        error: `Cannot delete account with ${childCount} child accounts. Delete children first.`,
        code: 'HAS_CHILDREN'
      });
      return;
    }

    await Account.findByIdAndDelete(req.params.id);

    logger.info('Account deleted', {
      accountId: req.params.id,
      code: account.code,
      deletedBy: req.user?.userId
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error('Delete account error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete account',
      code: 'DELETE_ACCOUNT_ERROR'
    });
  }
});

// ============================================
// GET /api/accounts/type/:type - Get accounts by type
// ============================================
router.get('/type/:type', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.params;
    const validTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];

    if (!validTypes.includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Invalid account type',
        code: 'INVALID_TYPE',
        validTypes
      });
      return;
    }

    const accounts = await Account.find({ type, isActive: true })
      .sort({ code: 1 })
      .select('code name balance category');

    const total = accounts.reduce((sum, a) => sum + a.balance, 0);

    res.json({
      success: true,
      data: {
        accounts,
        summary: {
          count: accounts.length,
          totalBalance: total
        }
      }
    });
  } catch (error) {
    logger.error('Get accounts by type error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve accounts',
      code: 'GET_ACCOUNTS_ERROR'
    });
  }
});

// ============================================
// POST /api/accounts/seed - Seed default accounts
// ============================================
router.post('/seed', authenticate, authorize('admin'), writeLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if accounts already exist
    const existingCount = await Account.countDocuments();
    if (existingCount > 0) {
      res.status(400).json({
        success: false,
        error: 'Accounts already exist. Clear database first.',
        code: 'ACCOUNTS_EXIST'
      });
      return;
    }

    const defaultAccounts = [
      // Assets
      { code: '1000', name: 'Cash', type: 'asset', category: 'cash', balance: 0 },
      { code: '1010', name: 'Checking Account', type: 'asset', category: 'bank', balance: 0 },
      { code: '1020', name: 'Savings Account', type: 'asset', category: 'bank', balance: 0 },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', category: 'accounts_receivable', balance: 0 },
      { code: '1200', name: 'Inventory', type: 'asset', category: 'inventory', balance: 0 },
      { code: '1500', name: 'Equipment', type: 'asset', category: 'equipment', balance: 0 },
      { code: '1600', name: 'Accumulated Depreciation', type: 'asset', category: 'equipment', balance: 0 },

      // Liabilities
      { code: '2000', name: 'Accounts Payable', type: 'liability', category: 'accounts_payable', balance: 0 },
      { code: '2100', name: 'Credit Card', type: 'liability', category: 'credit_card', balance: 0 },
      { code: '2200', name: 'Sales Tax Payable', type: 'liability', category: 'taxes', balance: 0 },
      { code: '2500', name: 'Notes Payable', type: 'liability', category: 'loan', balance: 0 },

      // Equity
      { code: '3000', name: 'Owner Equity', type: 'equity', category: 'equity', balance: 0 },
      { code: '3100', name: 'Retained Earnings', type: 'equity', category: 'equity', balance: 0 },

      // Revenue
      { code: '4000', name: 'Sales Revenue', type: 'revenue', category: 'sales', balance: 0 },
      { code: '4100', name: 'Service Revenue', type: 'revenue', category: 'sales', balance: 0 },
      { code: '4200', name: 'Interest Income', type: 'revenue', category: 'other_income', balance: 0 },

      // Expenses
      { code: '5000', name: 'Cost of Goods Sold', type: 'expense', category: 'cost_of_sales', balance: 0 },
      { code: '5100', name: 'Advertising', type: 'expense', category: 'operating_expense', balance: 0 },
      { code: '5200', name: 'Bank Fees', type: 'expense', category: 'operating_expense', balance: 0 },
      { code: '5300', name: 'Insurance', type: 'expense', category: 'operating_expense', balance: 0 },
      { code: '5400', name: 'Rent', type: 'expense', category: 'operating_expense', balance: 0 },
      { code: '5500', name: 'Salaries & Wages', type: 'expense', category: 'operating_expense', balance: 0 },
      { code: '5600', name: 'Supplies', type: 'expense', category: 'operating_expense', balance: 0 },
      { code: '5700', name: 'Utilities', type: 'expense', category: 'operating_expense', balance: 0 },
      { code: '5800', name: 'Travel & Entertainment', type: 'expense', category: 'operating_expense', balance: 0 },
      { code: '5900', name: 'Professional Fees', type: 'expense', category: 'operating_expense', balance: 0 }
    ];

    await Account.insertMany(defaultAccounts);

    logger.info('Default accounts seeded', { count: defaultAccounts.length });

    res.status(201).json({
      success: true,
      data: { count: defaultAccounts.length },
      message: 'Default accounts created successfully'
    });
  } catch (error) {
    logger.error('Seed accounts error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to seed accounts',
      code: 'SEED_ERROR'
    });
  }
});

export default router;