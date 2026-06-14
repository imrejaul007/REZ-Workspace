import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LedgerEntry } from '../models/index.js';
import { CreateLedgerEntrySchema, createResponse } from '../types/index.js';
import { asyncHandler, validate, authMiddleware, AuthenticatedRequest } from '../middleware/index.js';

const router = Router();

// Create ledger entry
router.post('/',
  authMiddleware,
  validate(CreateLedgerEntrySchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { tenantId, ledger, debit, credit, narration, reference, date, invoiceId } = req.body;

    // Validate that either debit or credit is provided
    if ((!debit || debit === 0) && (!credit || credit === 0)) {
      res.status(400).json(createResponse(false, undefined, {
        code: 'INVALID_ENTRY',
        message: 'Either debit or credit amount is required'
      }));
      return;
    }

    const entry = new LedgerEntry({
      entryId: `LED-${uuidv4().substring(0, 8).toUpperCase()}`,
      tenantId,
      ledger,
      debit: debit || 0,
      credit: credit || 0,
      narration,
      reference,
      date: date ? new Date(date) : new Date(),
      invoiceId
    });

    await entry.save();

    res.status(201).json(createResponse(true, {
      entryId: entry.entryId,
      ledger: entry.ledger,
      debit: entry.debit,
      credit: entry.credit
    }));
  })
);

// Get ledger entries
router.get('/:tenantId/:ledger',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { tenantId, ledger } = req.params;
    const { fromDate, toDate } = req.query;

    const query: Record<string, unknown> = { tenantId, ledger };

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) (query.date as Record<string, Date>).$gte = new Date(fromDate as string);
      if (toDate) (query.date as Record<string, Date>).$lte = new Date(toDate as string);
    }

    const entries = await LedgerEntry.find(query)
      .sort({ date: -1 })
      .limit(500);

    // Calculate totals
    const totals = entries.reduce(
      (acc, entry) => ({
        totalDebit: acc.totalDebit + entry.debit,
        totalCredit: acc.totalCredit + entry.credit,
        balance: acc.balance + entry.credit - entry.debit
      }),
      { totalDebit: 0, totalCredit: 0, balance: 0 }
    );

    res.json(createResponse(true, {
      entries,
      totals: {
        debit: Math.round(totals.totalDebit * 100) / 100,
        credit: Math.round(totals.totalCredit * 100) / 100,
        balance: Math.round(totals.balance * 100) / 100
      }
    }));
  })
);

// Get ledger summary
router.get('/:tenantId/:ledger/summary',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { tenantId, ledger } = req.params;

    const entries = await LedgerEntry.find({ tenantId, ledger });

    const summary = entries.reduce(
      (acc, entry) => ({
        totalDebit: acc.totalDebit + entry.debit,
        totalCredit: acc.totalCredit + entry.credit,
        entryCount: acc.entryCount + 1
      }),
      { totalDebit: 0, totalCredit: 0, entryCount: 0 }
    );

    res.json(createResponse(true, {
      ledger,
      ...summary,
      balance: summary.totalCredit - summary.totalDebit
    }));
  })
);

export default router;
