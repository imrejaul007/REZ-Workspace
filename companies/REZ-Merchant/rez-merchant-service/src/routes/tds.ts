/**
 * TDS/TCS Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import {
  calculateTDS,
  createTDSRecord,
  depositTDS,
  generateTDSCertificate,
  getTDSQuarterlySummary,
  listTDSRecords,
  calculateTCS,
} from '../services/tdsTcsService';
import { merchantAuth } from '../middleware/auth';
import { errorResponse, errors } from '../utils/response';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: 'Invalid ObjectId' }
);

// ── TDS Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /tds/calculate
 * Calculate TDS on a given amount
 */
router.get('/calculate', async (req: Request, res: Response) => {
  try {
    const { amount, section, deducteeType } = req.query;

    if (!amount || !section) {
      errorResponse(res, errors.badRequest('Amount and section are required'));
      return;
    }

    const result = calculateTDS(
      parseFloat(amount as string),
      section as unknown,
      deducteeType as unknown
    );

    res.json({ success: true, data: result });
  } catch (err) {
    errorResponse(res, errors.internal('Calculation failed'));
  }
});

/**
 * POST /tds/records
 * Create TDS record
 */
router.post('/records', async (req: Request, res: Response) => {
  try {
    const record = await createTDSRecord(req.merchantId, {
      referenceType: req.body.referenceType || 'po',
      referenceId: req.body.referenceId,
      referenceNumber: req.body.referenceNumber,
      deducteeType: req.body.deducteeType,
      deducteeName: req.body.deducteeName,
      deducteePan: req.body.deducteePan,
      deducteeAddress: req.body.deducteeAddress,
      deducteeState: req.body.deducteeState,
      section: req.body.section,
      paymentAmount: req.body.paymentAmount,
      paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : undefined,
    });

    if (!record) {
      res.status(200).json({
        success: true,
        data: null,
        message: 'TDS not applicable for this amount',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: record,
      message: 'TDS record created',
    });
  } catch (err) {
    logger.error('[TDS] Create failed', { error: err });
    errorResponse(res, errors.internal('Failed to create TDS record'));
  }
});

/**
 * GET /tds/records
 * List TDS records
 */
router.get('/records', async (req: Request, res: Response) => {
  try {
    const { status, section, fromDate, toDate, deducteePan } = req.query;

    const filters: unknown = {};
    if (status) filters.status = status;
    if (section) filters.section = section;
    if (deducteePan) filters.deducteePan = deducteePan;
    if (fromDate) filters.fromDate = new Date(fromDate as string);
    if (toDate) filters.toDate = new Date(toDate as string);

    const records = await listTDSRecords(req.merchantId, filters);

    res.json({
      success: true,
      data: {
        items: records,
        total: records.length,
        totalTds: records.reduce((sum, r) => sum + r.tdsAmount, 0),
      },
    });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to list TDS records'));
  }
});

/**
 * POST /tds/deposit
 * Deposit TDS (create challan)
 */
router.post('/deposit', async (req: Request, res: Response) => {
  try {
    const { recordIds, challanNumber, bsrCode, depositDate, amount } = req.body;

    if (!recordIds || !challanNumber || !bsrCode || !depositDate || !amount) {
      errorResponse(res, errors.badRequest('Missing required fields'));
      return;
    }

    const result = await depositTDS(req.merchantId, recordIds, {
      challanNumber,
      bsrCode,
      depositDate: new Date(depositDate),
      amount,
    });

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.json({ success: true, message: result.message });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to deposit TDS'));
  }
});

/**
 * POST /tds/certificate
 * Generate TDS certificate
 */
router.post('/certificate', async (req: Request, res: Response) => {
  try {
    const { recordId } = req.body;

    if (!recordId) {
      errorResponse(res, errors.badRequest('Record ID required'));
      return;
    }

    const result = await generateTDSCertificate(req.merchantId, recordId);

    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    res.json({ success: true, data: result.certificate });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to generate certificate'));
  }
});

/**
 * GET /tds/quarterly/:quarter
 * Get quarterly summary
 */
router.get('/quarterly/:quarter', async (req: Request, res: Response) => {
  try {
    const summary = await getTDSQuarterlySummary(req.merchantId, req.params.quarter);
    res.json({ success: true, data: summary });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to get quarterly summary'));
  }
});

/**
 * GET /tds/sections
 * Get available TDS sections with rates
 */
router.get('/sections', async (req: Request, res: Response) => {
  const sections = {
    '193J': { rate: 10, threshold: 5000, description: 'Interest on securities' },
    '194': { rate: 10, threshold: 10000, description: 'Dividends' },
    '194A': { rate: 10, threshold: 40000, description: 'Interest (other than securities)' },
    '194C': { rate: 2, threshold: 30000, description: 'Contractor/HC payments' },
    '194D': { rate: 5, threshold: 15000, description: 'Insurance commission' },
    '194H': { rate: 5, threshold: 15000, description: 'Commission/Brokerage' },
    '194I': { rate: 2, threshold: 180000, description: 'Rent (machinery/equipment)' },
    '194J': { rate: 10, threshold: 30000, description: 'Professional fees/Royalties' },
    '194Q': { rate: 0.1, threshold: 500000, description: 'Purchase of goods' },
  };

  res.json({ success: true, data: sections });
});

// ── TCS Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /tcs/calculate
 * Calculate TCS on a given amount
 */
router.get('/tcs/calculate', async (req: Request, res: Response) => {
  try {
    const { amount, section } = req.query;

    if (!amount || !section) {
      errorResponse(res, errors.badRequest('Amount and section are required'));
      return;
    }

    const result = calculateTCS(parseFloat(amount as string), section as unknown);

    res.json({ success: true, data: result });
  } catch (err) {
    errorResponse(res, errors.internal('Calculation failed'));
  }
});

/**
 * GET /tcs/sections
 * Get available TCS sections with rates
 */
router.get('/tcs/sections', async (req: Request, res: Response) => {
  const sections = {
    '206C': { rate: 1, threshold: 5000000, description: 'Alcoholic liquor' },
    '206C1F': { rate: 0.1, threshold: 5000000, description: 'Tendu leaves' },
    '206C1H': { rate: 0.05, threshold: 5000000, description: 'Other goods (E-commerce)' },
  };

  res.json({ success: true, data: sections });
});

export default router;
