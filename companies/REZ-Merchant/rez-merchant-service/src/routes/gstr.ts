/**
 * GSTR Routes
 *
 * GST Returns preparation and filing
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  generateGSTR1,
  generateGSTR2,
  generateGSTR3B,
  exportGSTR1JSON,
} from '../services/gstrService';
import { merchantAuth } from '../middleware/auth';
import { errorResponse, errors } from '../utils/response';

const router = Router();
router.use(merchantAuth);

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * GET /gstr/gstr1
 * Generate GSTR-1 data
 */
router.get('/gstr1', async (req: Request, res: Response) => {
  try {
    const { year, month, filingType } = req.query;

    if (!year || !month) {
      errorResponse(res, errors.badRequest('Year and month are required'));
      return;
    }

    const result = await generateGSTR1(
      req.merchantId,
      parseInt(year as string),
      parseInt(month as string),
      (filingType as 'monthly' | 'quarterly') || 'monthly'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to generate GSTR-1'));
  }
});

/**
 * GET /gstr/gstr2
 * Generate GSTR-2 data
 */
router.get('/gstr2', async (req: Request, res: Response) => {
  try {
    const { year, month, filingType } = req.query;

    if (!year || !month) {
      errorResponse(res, errors.badRequest('Year and month are required'));
      return;
    }

    const result = await generateGSTR2(
      req.merchantId,
      parseInt(year as string),
      parseInt(month as string),
      (filingType as 'monthly' | 'quarterly') || 'monthly'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to generate GSTR-2'));
  }
});

/**
 * GET /gstr/gstr3b
 * Generate GSTR-3B summary
 */
router.get('/gstr3b', async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      errorResponse(res, errors.badRequest('Year and month are required'));
      return;
    }

    const result = await generateGSTR3B(
      req.merchantId,
      parseInt(year as string),
      parseInt(month as string)
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to generate GSTR-3B'));
  }
});

/**
 * GET /gstr/export/gstr1
 * Export GSTR-1 as JSON for portal upload
 */
router.get('/export/gstr1', async (req: Request, res: Response) => {
  try {
    const { year, month, gstin } = req.query;

    if (!year || !month || !gstin) {
      errorResponse(res, errors.badRequest('Year, month, and GSTIN are required'));
      return;
    }

    const json = await exportGSTR1JSON(
      req.merchantId,
      gstin as string,
      parseInt(year as string),
      parseInt(month as string)
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="GSTR1_${year}_${month}.json"`);
    res.send(json);
  } catch (err) {
    errorResponse(res, errors.internal('Failed to export GSTR-1'));
  }
});

/**
 * GET /gstr/summary
 * Get filing summary for all periods
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const currentYear = parseInt(year as string) || new Date().getFullYear();

    const summary = [];

    // Generate summary for each month
    for (let month = 1; month <= 12; month++) {
      const gstr1 = await generateGSTR1(req.merchantId, currentYear, month);
      const gstr2 = await generateGSTR2(req.merchantId, currentYear, month);

      summary.push({
        period: `${currentYear}-${month.toString().padStart(2, '0')}`,
        gstr1: {
          totalRecords: gstr1.records.length,
          taxableValue: gstr1.summary.totalTaxableValue,
        },
        gstr2: {
          totalRecords: gstr2.records.length,
          taxableValue: gstr2.summary.totalTaxableValue,
          itcAvailable: gstr2.summary.totalItcAvailable,
        },
      });
    }

    res.json({ success: true, data: summary });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to generate summary'));
  }
});

export default router;
