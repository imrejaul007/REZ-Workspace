import { Router, Request, Response } from 'express';
import { requireMerchantAuth } from '../middleware/auth';
import * as merchantWalletService from '../services/merchantWalletService';
import { MerchantWallet } from '../models/MerchantWallet';
import { success, err, ErrorCodes } from '../utils/response';

const router = Router();

// All merchant wallet routes require merchant JWT (C5-FIX: separate from user requireAuth)
router.use(requireMerchantAuth);

// ── GET wallet summary ──
const getWalletHandler = async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId || req.userId;
    if (!merchantId) { res.status(400).json(err('SRV_INTERNAL_ERROR', 'Merchant ID required')); return; }

    const balance = await merchantWalletService.getBalance(merchantId);
    if (!balance) {
      res.status(404).json(err('RES_NOT_FOUND'));
      return;
    }
    const wallet = await MerchantWallet.findOne(
      { merchant: merchantId },
      { bankDetails: 1 },
    ).lean();
    res.json(success({
      ...balance,
      bankDetails: wallet?.bankDetails || null,
    }));
  } catch (err) {
    res.status(500).json(err('SRV_INTERNAL_ERROR'));
  }
};
router.get('/', getWalletHandler);
router.get('/api/merchant/wallet', getWalletHandler);

// ── GET transactions ──
const getTransactionsHandler = async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId || req.userId;
    if (!merchantId) { res.status(400).json(err('SRV_INTERNAL_ERROR', 'Merchant ID required')); return; }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await merchantWalletService.getTransactions(merchantId, page, limit);
    res.json(success({
      transactions: result.transactions,
      pagination: { total: result.total, page: result.page, hasMore: result.hasMore },
    }));
  } catch (err) {
    res.status(500).json(err('SRV_INTERNAL_ERROR'));
  }
};
router.get('/transactions', getTransactionsHandler);
router.get('/api/merchant/wallet/transactions', getTransactionsHandler);

// ── POST withdraw ──
const withdrawHandler = async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId || req.userId;
    if (!merchantId) { res.status(400).json(err('SRV_INTERNAL_ERROR', 'Merchant ID required')); return; }

    const parsedAmount = Number(req.body.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'Valid withdrawal amount is required'));
      return;
    }
    const result = await merchantWalletService.requestWithdrawal(merchantId, parsedAmount);
    res.json(success({ message: `Withdrawal request of ${parsedAmount} submitted`, ...result }));
  } catch (err) {
    res.status(400).json(err('SRV_INTERNAL_ERROR'));
  }
};
router.post('/withdraw', withdrawHandler);
router.post('/api/merchant/wallet/withdraw', withdrawHandler);

// ── GET withdrawal requests with status tracking ──
const withdrawalsHandler = async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId || req.userId;
    if (!merchantId) { res.status(400).json(err('SRV_INTERNAL_ERROR', 'Merchant ID required')); return; }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string;

    const result = await merchantWalletService.getWithdrawals(merchantId, page, limit, status);
    res.json(success({
      items: result.transactions,
      pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit), hasNext: page * limit < result.total, hasPrev: page > 1 },
    }));
  } catch (err) {
    res.status(500).json(err('SRV_INTERNAL_ERROR'));
  }
};
router.get('/withdrawals', withdrawalsHandler);
router.get('/api/merchant/wallet/withdrawals', withdrawalsHandler);

// ── PUT bank-details ──
const bankDetailsHandler = async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId || req.userId;
    if (!merchantId) { res.status(400).json(err('SRV_INTERNAL_ERROR', 'Merchant ID required')); return; }

    const { accountNumber, ifscCode, accountHolderName, bankName, upiId } = req.body;
    if (!ifscCode || !accountHolderName || !bankName) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'ifscCode, accountHolderName, bankName required'));
      return;
    }
    // FIX REZ-WALLET-003: Validate account number format (Indian bank accounts: 9-18 digits)
    if (!accountNumber || typeof accountNumber !== 'string') {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'accountNumber is required'));
      return;
    }
    const accountNumClean = accountNumber.replace(/\s/g, '');
    if (!/^\d{9,18}$/.test(accountNumClean)) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'Invalid account number format (must be 9-18 digits)'));
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
      res.status(400).json(err('SRV_INTERNAL_ERROR', 'Invalid IFSC code format'));
      return;
    }
    const result = await merchantWalletService.updateBankDetails(merchantId, {
      accountNumber: accountNumClean, ifscCode: ifscCode.toUpperCase(), accountHolderName, bankName, upiId,
    });
    res.json(success({ message: 'Bank details updated. Verification pending.', ...result }));
  } catch (err) {
    res.status(500).json(err('SRV_INTERNAL_ERROR'));
  }
};
router.put('/bank-details', bankDetailsHandler);
router.put('/api/merchant/wallet/bank-details', bankDetailsHandler);

// ── GET stats ──
const statsHandler = async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId || req.userId;
    if (!merchantId) { res.status(400).json(err('SRV_INTERNAL_ERROR', 'Merchant ID required')); return; }

    const stats = await merchantWalletService.getStats(merchantId);
    if (!stats) { res.status(404).json(err('RES_NOT_FOUND')); return; }
    res.json(success(stats));
  } catch (err) {
    res.status(500).json(err('SRV_INTERNAL_ERROR'));
  }
};
router.get('/stats', statsHandler);
router.get('/api/merchant/wallet/stats', statsHandler);

export default router;
