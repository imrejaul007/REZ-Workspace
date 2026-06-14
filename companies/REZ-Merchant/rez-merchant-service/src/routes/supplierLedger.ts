/**
 * Supplier Ledger routes.
 * Handles ledger entries, balance queries, aging reports, and exports.
 */

import { Router, Request, Response } from 'express';
import { SupplierLedger } from '../models/SupplierLedger';
import { CreditLine } from '../models/CreditLine';
import { creditLineService } from '../services/creditLineService';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

/**
 * GET /supplier-ledger
 * List ledger entries with filters.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { supplierId, startDate, endDate, type, overdue, page, limit } = req.query;

    const pageNum = page ? Math.max(1, parseInt(page as string)) : 1;
    const limitNum = Math.min(100, Math.max(1, limit ? parseInt(limit as string) : 20));
    const skip = (pageNum - 1) * limitNum;

    const query: unknown = {
      merchantId: new mongoose.Types.ObjectId(req.merchantId),
    };

    if (supplierId) {
      if (!mongoose.Types.ObjectId.isValid(supplierId as string)) {
        res.status(400).json({ success: false, message: 'Invalid supplierId format' });
        return;
      }
      query.supplierId = new mongoose.Types.ObjectId(supplierId as string);
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    if (type && ['debit', 'credit'].includes(type as string)) {
      query.entryType = type;
    }

    if (overdue === 'true') {
      query.isOverdue = true;
    } else if (overdue === 'false') {
      query.isOverdue = false;
    }

    const [items, total] = await Promise.all([
      SupplierLedger.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      SupplierLedger.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /supplier-ledger/:supplierId/balance
 * Get current balance for a supplier.
 */
router.get('/:supplierId/balance', async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      res.status(400).json({ success: false, message: 'Invalid supplierId format' });
      return;
    }

    // Verify supplier has a credit line for this merchant
    const creditLine = await CreditLine.findOne({
      merchantId: new mongoose.Types.ObjectId(req.merchantId),
      supplierId: new mongoose.Types.ObjectId(supplierId),
    }).lean();

    if (!creditLine) {
      res.status(404).json({ success: false, message: 'No credit line found for this supplier' });
      return;
    }

    const balance = await SupplierLedger.getCurrentBalance(req.merchantId!, supplierId);
    const aging = await SupplierLedger.getAgingReport(req.merchantId!, supplierId);

    // Get last entry for reference
    const lastEntry = await SupplierLedger.findOne({
      merchantId: new mongoose.Types.ObjectId(req.merchantId),
      supplierId: new mongoose.Types.ObjectId(supplierId),
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        supplierId,
        balance,
        creditLine: {
          creditLimit: creditLine.creditLimit,
          usedAmount: creditLine.usedAmount,
          availableCredit: creditLine.availableCredit,
          status: creditLine.status,
        },
        aging,
        lastTransaction: lastEntry
          ? {
              date: lastEntry.createdAt,
              type: lastEntry.entryType,
              reference: lastEntry.referenceNumber,
              description: lastEntry.description,
            }
          : null,
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /supplier-ledger/:supplierId/aging
 * Get aging report for a supplier.
 */
router.get('/:supplierId/aging', async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      res.status(400).json({ success: false, message: 'Invalid supplierId format' });
      return;
    }

    const aging = await SupplierLedger.getAgingReport(req.merchantId!, supplierId);

    // Get supplier info
    const creditLine = await CreditLine.findOne({
      merchantId: new mongoose.Types.ObjectId(req.merchantId),
      supplierId: new mongoose.Types.ObjectId(supplierId),
    })
      .populate('supplierId', 'name email phone')
      .lean();

    res.json({
      success: true,
      data: {
        supplierId,
        supplierName: creditLine ? (creditLine.supplierId as unknown).name : 'Unknown',
        ...aging,
        generatedAt: new Date(),
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /supplier-ledger/:supplierId/export
 * Export ledger as CSV.
 */
router.get('/:supplierId/export', async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const { startDate, endDate, format } = req.query;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      res.status(400).json({ success: false, message: 'Invalid supplierId format' });
      return;
    }

    // Parse dates
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    // Verify supplier has a credit line for this merchant
    const creditLine = await CreditLine.findOne({
      merchantId: new mongoose.Types.ObjectId(req.merchantId),
      supplierId: new mongoose.Types.ObjectId(supplierId),
    }).lean();

    if (!creditLine) {
      res.status(404).json({ success: false, message: 'No credit line found for this supplier' });
      return;
    }

    if (format === 'json') {
      // Return JSON export
      const query: unknown = {
        merchantId: new mongoose.Types.ObjectId(req.merchantId),
        supplierId: new mongoose.Types.ObjectId(supplierId),
      };

      if (start || end) {
        query.createdAt = {};
        if (start) query.createdAt.$gte = start;
        if (end) query.createdAt.$lte = end;
      }

      const entries = await SupplierLedger.find(query)
        .sort({ createdAt: 1 })
        .lean();

      const balance = await SupplierLedger.getCurrentBalance(req.merchantId!, supplierId);

      res.json({
        success: true,
        data: {
          supplierId,
          supplierName: (creditLine.supplierId as unknown)?.name || 'Unknown',
          exportDate: new Date(),
          period: { start, end },
          currentBalance: balance,
          entries,
        },
      });
    } else {
      // Return CSV export
      const csv = await creditLineService.exportLedgerAsCSV(
        req.merchantId!,
        supplierId,
        start,
        end
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ledger-${supplierId}-${new Date().toISOString().split('T')[0]}.csv"`
      );
      res.send(csv);
    }
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /supplier-ledger
 * Create a manual ledger entry (adjustments).
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      supplierId,
      entryType,
      amount,
      reference,
      referenceNumber,
      description,
      dueDate,
    } = req.body;

    // Validate required fields
    if (!supplierId || !mongoose.Types.ObjectId.isValid(supplierId)) {
      res.status(400).json({ success: false, message: 'Valid supplierId is required' });
      return;
    }
    if (!entryType || !['debit', 'credit'].includes(entryType)) {
      res.status(400).json({ success: false, message: 'entryType must be "debit" or "credit"' });
      return;
    }
    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, message: 'amount must be a positive number' });
      return;
    }
    if (!description || typeof description !== 'string') {
      res.status(400).json({ success: false, message: 'description is required' });
      return;
    }

    // Verify credit line exists
    const creditLine = await CreditLine.findOne({
      merchantId: new mongoose.Types.ObjectId(req.merchantId),
      supplierId: new mongoose.Types.ObjectId(supplierId),
    });

    if (!creditLine) {
      res.status(404).json({ success: false, message: 'No credit line found for this supplier' });
      return;
    }

    // Get current balance
    const currentBalance = await SupplierLedger.getCurrentBalance(req.merchantId!, supplierId);
    const newBalance = entryType === 'debit' ? currentBalance + amount : Math.max(0, currentBalance - amount);

    // Create ledger entry
    const entry = await SupplierLedger.create({
      merchantId: new mongoose.Types.ObjectId(req.merchantId),
      supplierId: new mongoose.Types.ObjectId(supplierId),
      entryType,
      amount,
      balance: newBalance,
      reference: reference || 'adjustment',
      referenceNumber: referenceNumber || `ADJ-${Date.now()}`,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      isOverdue: false,
      daysOverdue: 0,
      unallocatedAmount: entryType === 'debit' ? amount : 0,
      allocatedAmount: entryType === 'debit' ? 0 : amount,
      metadata: {
        isManualEntry: true,
        createdBy: req.merchantUserId,
      },
    });

    // Update credit line used amount if debit
    if (entryType === 'debit') {
      creditLine.usedAmount += amount;
      creditLine.availableCredit = Math.max(0, creditLine.creditLimit - creditLine.usedAmount);
      await creditLine.save();
    }

    res.status(201).json({
      success: true,
      message: 'Ledger entry created',
      data: entry,
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /supplier-ledger/:supplierId/transactions
 * Get transactions for a supplier within a date range.
 */
router.get('/:supplierId/transactions', async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const { startDate, endDate, page, limit } = req.query;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      res.status(400).json({ success: false, message: 'Invalid supplierId format' });
      return;
    }

    const pageNum = page ? Math.max(1, parseInt(page as string)) : 1;
    const limitNum = Math.min(100, Math.max(1, limit ? parseInt(limit as string) : 20));
    const skip = (pageNum - 1) * limitNum;

    const query: unknown = {
      merchantId: new mongoose.Types.ObjectId(req.merchantId),
      supplierId: new mongoose.Types.ObjectId(supplierId),
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const [items, total] = await Promise.all([
      SupplierLedger.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      SupplierLedger.countDocuments(query),
    ]);

    // Get summary stats
    const stats = await SupplierLedger.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$entryType',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = {
      totalDebits: 0,
      totalCredits: 0,
      debitCount: 0,
      creditCount: 0,
    };

    for (const stat of stats) {
      if (stat._id === 'debit') {
        summary.totalDebits = stat.totalAmount;
        summary.debitCount = stat.count;
      } else {
        summary.totalCredits = stat.totalAmount;
        summary.creditCount = stat.count;
      }
    }

    res.json({
      success: true,
      data: {
        items,
        summary,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /supplier-ledger/:supplierId/unallocated
 * Get unallocated debit entries for a supplier.
 */
router.get('/:supplierId/unallocated', async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      res.status(400).json({ success: false, message: 'Invalid supplierId format' });
      return;
    }

    const entries = await SupplierLedger.getUnallocatedEntries(req.merchantId!, supplierId);
    const totalUnallocated = entries.reduce((sum, e) => sum + e.unallocatedAmount, 0);

    res.json({
      success: true,
      data: {
        entries,
        count: entries.length,
        totalUnallocated,
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /supplier-ledger/:supplierId/verify
 * Verify ledger balance integrity for a supplier.
 */
router.get('/:supplierId/verify', async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      res.status(400).json({ success: false, message: 'Invalid supplierId format' });
      return;
    }

    const result = await creditLineService.verifyLedgerIntegrity(req.merchantId!, supplierId);

    res.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /supplier-ledger/aging/summary
 * Get aging summary for all suppliers.
 */
router.get('/aging/summary', async (req: Request, res: Response) => {
  try {
    const agingReport = await creditLineService.getAgingReport(req.merchantId!);

    res.json({
      success: true,
      data: agingReport,
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
