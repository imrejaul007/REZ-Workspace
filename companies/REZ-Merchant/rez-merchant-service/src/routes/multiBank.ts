/**
 * Multi-Bank Aggregation Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { merchantAuth } from '../middleware/auth';
import {
  addBankAccount,
  removeBankAccount,
  getMerchantAccounts,
  setPrimaryAccount,
  syncAllAccounts,
  syncAccount,
  getAggregatedBalance,
  getAggregatedTransactions,
  getAccountTransactions,
  getCashPoolBalance,
  allocateFunds,
  BANK_PROVIDERS,
} from '../services/multiBankAggregationService';
import { errorResponse, errors } from '../utils/response';

const router = Router();
router.use(merchantAuth);

// ── Account Management ──────────────────────────────────────────────────────────

/**
 * POST /multi-bank/accounts
 * Add a bank account
 */
router.post('/accounts', async (req: Request, res: Response) => {
  try {
    const { provider, accountNumber, accountType, accountHolderName, balance, isPrimary, metadata } = req.body;

    if (!provider || !accountNumber || !accountType) {
      errorResponse(res, errors.badRequest('Provider, account number, and account type required'));
      return;
    }

    const account = await addBankAccount(req.merchantId, {
      provider,
      accountNumber,
      accountType,
      accountHolderName,
      balance: balance || 0,
      currency: 'INR',
      isPrimary: isPrimary || false,
      metadata,
    });

    res.status(201).json({ success: true, data: account });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to add account'));
  }
});

/**
 * GET /multi-bank/accounts
 * Get all accounts
 */
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const { provider, accountType, isActive } = req.query;

    const accounts = await getMerchantAccounts(req.merchantId, {
      provider: provider as unknown,
      accountType: accountType as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    res.json({ success: true, data: accounts });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to get accounts'));
  }
});

/**
 * DELETE /multi-bank/accounts/:id
 * Remove account
 */
router.delete('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const result = await removeBankAccount(req.merchantId, req.params.id);

    if (!result) {
      errorResponse(res, errors.notFound('Account'));
      return;
    }

    res.json({ success: true, message: 'Account removed' });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to remove account'));
  }
});

/**
 * POST /multi-bank/accounts/:id/primary
 * Set as primary account
 */
router.post('/accounts/:id/primary', async (req: Request, res: Response) => {
  try {
    const result = await setPrimaryAccount(req.merchantId, req.params.id);

    if (!result) {
      errorResponse(res, errors.notFound('Account'));
      return;
    }

    res.json({ success: true, message: 'Primary account updated' });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to set primary account'));
  }
});

/**
 * POST /multi-bank/accounts/:id/sync
 * Sync single account
 */
router.post('/accounts/:id/sync', async (req: Request, res: Response) => {
  try {
    const result = await syncAccount(req.params.id);

    res.json({ success: true, data: result });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to sync account'));
  }
});

/**
 * POST /multi-bank/sync-all
 * Sync all accounts
 */
router.post('/sync-all', async (req: Request, res: Response) => {
  try {
    const result = await syncAllAccounts(req.merchantId);

    res.json({ success: true, data: result });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to sync accounts'));
  }
});

// ── Balance & Transactions ───────────────────────────────────────────────────────

/**
 * GET /multi-bank/balance
 * Get aggregated balance
 */
router.get('/balance', async (req: Request, res: Response) => {
  try {
    const balance = await getAggregatedBalance(req.merchantId);

    res.json({ success: true, data: balance });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to get balance'));
  }
});

/**
 * GET /multi-bank/transactions
 * Get aggregated transactions
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { accountId, fromDate, toDate, category, type, page, limit } = req.query;

    const result = await getAggregatedTransactions(req.merchantId, {
      accountId: accountId as string,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      category: category as string,
      type: type as 'credit' | 'debit' | 'all',
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to get transactions'));
  }
});

/**
 * GET /multi-bank/accounts/:id/transactions
 * Get account transactions
 */
router.get('/accounts/:id/transactions', async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate, limit } = req.query;

    const transactions = await getAccountTransactions(req.params.id, {
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({ success: true, data: transactions });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to get transactions'));
  }
});

// ── Cash Pooling ────────────────────────────────────────────────────────────────

/**
 * GET /multi-bank/cash-pool
 * Get cash pool balance
 */
router.get('/cash-pool', async (req: Request, res: Response) => {
  try {
    const pool = await getCashPoolBalance(req.merchantId);

    res.json({ success: true, data: pool });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to get cash pool'));
  }
});

/**
 * POST /multi-bank/allocate
 * Allocate funds between accounts
 */
router.post('/allocate', async (req: Request, res: Response) => {
  try {
    const { allocations } = req.body;

    if (!allocations || !Array.isArray(allocations)) {
      errorResponse(res, errors.badRequest('Allocations required'));
      return;
    }

    const result = await allocateFunds(req.merchantId, allocations);

    res.json({ success: true, data: result });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to allocate funds'));
  }
});

// ── Providers ──────────────────────────────────────────────────────────────────

/**
 * GET /multi-bank/providers
 * Get supported providers
 */
router.get('/providers', async (req: Request, res: Response) => {
  res.json({ success: true, data: BANK_PROVIDERS });
});

export default router;
