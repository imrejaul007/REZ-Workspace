/**
 * Tally Export API Routes
 * Provides endpoints for exporting accounting data in Tally-compatible formats
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { merchantAuth } from '../middleware/auth';
import { TallyExportService } from '../services/tallyExport';

const router = Router();
router.use(merchantAuth);

/**
 * GET /merchant/export/tally
 * Generate Tally XML export for a date range
 */
router.get('/tally', async (req: Request, res: Response) => {
  try {
    const { storeId, fromMonth, toMonth, type = 'sales' } = req.query;
    const merchantId = (req as unknown).merchantId;

    if (!merchantId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId is required' });
      return;
    }

    if (!fromMonth || !toMonth) {
      res.status(400).json({ success: false, message: 'fromMonth and toMonth are required (format: YYYY-MM)' });
      return;
    }

    // Parse months to get date range
    const [fromYear, fromMonthNum] = (fromMonth as string).split('-').map(Number);
    const [toYear, toMonthNum] = (toMonth as string).split('-').map(Number);

    const startDate = new Date(fromYear, fromMonthNum - 1, 1);
    const endDate = new Date(toYear, toMonthNum, 1);

    let xmlContent: string;
    const contentType = (type as string) || 'sales';

    switch (contentType) {
      case 'sales':
        xmlContent = await TallyExportService.generateSalesXML(
          merchantId,
          new mongoose.Types.ObjectId(storeId as string),
          startDate,
          endDate
        );
        break;
      case 'purchase':
        xmlContent = await TallyExportService.generatePurchaseXML(
          merchantId,
          new mongoose.Types.ObjectId(storeId as string),
          startDate,
          endDate
        );
        break;
      case 'expense':
        xmlContent = await TallyExportService.generateExpenseXML(
          merchantId,
          new mongoose.Types.ObjectId(storeId as string),
          startDate,
          endDate
        );
        break;
      default:
        res.status(400).json({ success: false, message: 'Invalid export type. Use: sales, purchase, or expense' });
        return;
    }

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="Tally_${contentType}_${fromMonth}_${toMonth}.xml"`);
    res.send(xmlContent);
  } catch (e) {
    console.error('Tally export error:', e);
    const message = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /merchant/export/csv
 * Generate CSV export for accounting software
 */
router.get('/csv', async (req: Request, res: Response) => {
  try {
    const { storeId, fromMonth, toMonth } = req.query;

    if (!storeId || !fromMonth || !toMonth) {
      res.status(400).json({ success: false, message: 'storeId, fromMonth, and toMonth are required' });
      return;
    }

    const [fromYear, fromMonthNum] = (fromMonth as string).split('-').map(Number);
    const [toYear, toMonthNum] = (toMonth as string).split('-').map(Number);

    const startDate = new Date(fromYear, fromMonthNum - 1, 1);
    const endDate = new Date(toYear, toMonthNum, 1);

    const csvContent = await TallyExportService.generateSalesCSV(
      (req as unknown).merchantId,
      new mongoose.Types.ObjectId(storeId as string),
      startDate,
      endDate
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Transactions_${fromMonth}_${toMonth}.csv"`);
    res.send(csvContent);
  } catch (e) {
    console.error('CSV export error:', e);
    const message = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /merchant/export/gstr1
 * Generate GSTR-1 data for a period
 */
router.get('/gstr1', async (req: Request, res: Response) => {
  try {
    const { storeId, month } = req.query;

    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId is required' });
      return;
    }

    if (!month) {
      res.status(400).json({ success: false, message: 'month is required (format: YYYY-MM)' });
      return;
    }

    const [year, monthNum] = (month as string).split('-').map(Number);

    const result = await TallyExportService.generateGSTR1(
      (req as unknown).merchantId,
      new mongoose.Types.ObjectId(storeId as string),
      monthNum,
      year
    );

    res.json({
      success: true,
      data: result.data,
      summary: result.summary,
      period: month,
    });
  } catch (e) {
    console.error('GSTR1 export error:', e);
    const message = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /merchant/export/gstr3b
 * Generate GSTR-3B data for a period
 */
router.get('/gstr3b', async (req: Request, res: Response) => {
  try {
    const { storeId, month } = req.query;

    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId is required' });
      return;
    }

    if (!month) {
      res.status(400).json({ success: false, message: 'month is required (format: YYYY-MM)' });
      return;
    }

    const [year, monthNum] = (month as string).split('-').map(Number);

    const result = await TallyExportService.generateGSTR3B(
      (req as unknown).merchantId,
      new mongoose.Types.ObjectId(storeId as string),
      monthNum,
      year
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (e) {
    console.error('GSTR3B export error:', e);
    const message = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /merchant/export/report
 * Generate comprehensive sales report for accounting
 */
router.get('/report', async (req: Request, res: Response) => {
  try {
    const { storeId, fromMonth, toMonth } = req.query;

    if (!storeId || !fromMonth || !toMonth) {
      res.status(400).json({ success: false, message: 'storeId, fromMonth, and toMonth are required' });
      return;
    }

    const [fromYear, fromMonthNum] = (fromMonth as string).split('-').map(Number);
    const [toYear, toMonthNum] = (toMonth as string).split('-').map(Number);

    const startDate = new Date(fromYear, fromMonthNum - 1, 1);
    const endDate = new Date(toYear, toMonthNum, 1);

    const report = await TallyExportService.generateSalesReport(
      (req as unknown).merchantId,
      new mongoose.Types.ObjectId(storeId as string),
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (e) {
    console.error('Report export error:', e);
    const message = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message });
  }
});

export default router;
