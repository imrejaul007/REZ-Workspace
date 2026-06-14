import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { accountRegistry, ACCOUNT_TYPES, TRANSACTION_TYPES } from '../index.js';

const router = express.Router();

/**
 * GET /api/ledger
 * Get ledger overview
 */
router.get('/', async (req, res) => {
  try {
    const accounts = Array.from(accountRegistry.values());

    const balance = {
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
      totalRevenue: 0,
      totalExpenses: 0
    };

    for (const account of accounts) {
      switch (account.type) {
        case ACCOUNT_TYPES.ASSET:
          balance.totalAssets += account.balance || 0;
          break;
        case ACCOUNT_TYPES.LIABILITY:
          balance.totalLiabilities += account.balance || 0;
          break;
        case ACCOUNT_TYPES.EQUITY:
          balance.totalEquity += account.balance || 0;
          break;
        case ACCOUNT_TYPES.REVENUE:
          balance.totalRevenue += account.balance || 0;
          break;
        case ACCOUNT_TYPES.EXPENSE:
          balance.totalExpenses += account.balance || 0;
          break;
      }
    }

    balance.netWorth = balance.totalAssets - balance.totalLiabilities;
    balance.netIncome = balance.totalRevenue - balance.totalExpenses;

    res.json({
      success: true,
      accounts: accounts.length,
      balance
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ledger/accounts
 * List all accounts
 */
router.get('/accounts', async (req, res) => {
  try {
    const { type, industry } = req.query;

    let accounts = Array.from(accountRegistry.values());

    if (type) accounts = accounts.filter(a => a.type === type);
    if (industry) accounts = accounts.filter(a => a.industry === industry);

    res.json({
      success: true,
      count: accounts.length,
      accounts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ledger/account
 * Create an account
 */
router.post('/account', async (req, res) => {
  try {
    const {
      name,
      type = ACCOUNT_TYPES.ASSET,
      industry,
      initialBalance = 0
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Account name is required'
      });
    }

    const accountId = `account_${uuidv4()}`;
    const account = {
      id: accountId,
      name,
      type,
      industry: industry || 'universal',
      balance: initialBalance,
      entries: [],
      createdAt: new Date().toISOString()
    };

    accountRegistry.set(accountId, account);

    res.status(201).json({
      success: true,
      account
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ledger/entry
 * Create a ledger entry
 */
router.post('/entry', async (req, res) => {
  try {
    const {
      accountId,
      type = TRANSACTION_TYPES.CREDIT,
      amount,
      description,
      industry
    } = req.body;

    if (!accountId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Account ID and amount are required'
      });
    }

    const account = accountRegistry.get(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    const entry = {
      id: `entry_${uuidv4()}`,
      type,
      amount,
      description,
      industry,
      createdAt: new Date().toISOString()
    };

    // Update balance based on account type and transaction type
    if (account.type === ACCOUNT_TYPES.ASSET || account.type === ACCOUNT_TYPES.EXPENSE) {
      account.balance += type === TRANSACTION_TYPES.DEBIT ? amount : -amount;
    } else {
      account.balance += type === TRANSACTION_TYPES.CREDIT ? amount : -amount;
    }

    account.entries.push(entry);
    accountRegistry.set(accountId, account);

    res.status(201).json({
      success: true,
      entry,
      account
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ledger/account/:id
 * Get account details
 */
router.get('/account/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const account = accountRegistry.get(id);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      account
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
