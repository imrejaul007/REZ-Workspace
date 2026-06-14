
import { Router, Request, Response } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { CoinTransaction } from '../models/CoinTransaction';
import { Payout } from '../models/Payout';
import { merchantAuth } from '../middleware/auth';
import { bulkGetUsers } from '../lib/authServiceClient';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

// Helper: minimal CSV-safe field quoter (escapes double-quotes, wraps fields containing commas/newlines).
function csvCell(v): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(',');
}

// Helper: parse optional from/to dates into a createdAt range.
function buildDateRange(from?: string, to?: string): unknown {
  const range: unknown = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) range.$gte = d;
  }
  if (to) {
    // End-of-day for inclusive "to" filter.
    const d = new Date(to);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      range.$lte = d;
    }
  }
  return Object.keys(range).length ? range : undefined;
}

// Helper: verify the merchant owns the given store.
async function verifyStoreOwnership(storeId: string, merchantId: string) {
  if (!mongoose.Types.ObjectId.isValid(storeId)) return null;
  return Store.findOne({ _id: storeId, merchantId: merchantId }).select('_id').lean();
}

router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { storeId, startDate, endDate, format = 'json' } = req.query as unknown;
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId required' }); return; }
    const ownedStore = await Store.findOne({ _id: storeId, merchantId: req.merchantId }).select('_id').lean();
    if (!ownedStore) { res.status(403).json({ success: false, message: 'Access denied: store not found or not yours' }); return; }
    const query: unknown = { store: new mongoose.Types.ObjectId(storeId) };
    if (startDate || endDate) { query.createdAt = {}; if (startDate) query.createdAt.$gte = new Date(startDate); if (endDate) query.createdAt.$lte = new Date(endDate); }
    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(5000).lean();
    if (format === 'csv') {
      const header = 'orderId,total,status,createdAt\n';
      const rows = orders.map((o) => `${o._id},${o.total || 0},${o.status},${o.createdAt}`).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
      res.send(header + rows); return;
    }
    res.json({ success: true, data: orders, count: orders.length });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.get('/products', async (req: Request, res: Response) => {
  try {
    const { storeId, format = 'json' } = req.query as unknown;
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId required' }); return; }
    const ownedStore = await Store.findOne({ _id: storeId, merchantId: req.merchantId }).select('_id').lean();
    if (!ownedStore) { res.status(403).json({ success: false, message: 'Access denied: store not found or not yours' }); return; }
    const products = await Product.find({ store: new mongoose.Types.ObjectId(storeId) }).lean();
    if (format === 'csv') {
      const header = 'productId,name,price,stock,isActive\n';
      const rows = products.map((p) => `${p._id},${p.name},${p.price || 0},${p.stock || 0},${p.isActive}`).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
      res.send(header + rows); return;
    }
    res.json({ success: true, data: products, count: products.length });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Merchant report exports (transactions, customers, payouts) used by the
// merchant app's /reports/export screen. Always returns CSV.
// ────────────────────────────────────────────────────────────────────────────

// Transactions export — one row per coin transaction for the merchant's store.
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { storeId, from, to } = req.query as unknown;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId required' });
      return;
    }
    const owned = await verifyStoreOwnership(storeId, req.merchantId!);
    if (!owned) {
      res.status(403).json({ success: false, message: 'Access denied: store not found or not yours' });
      return;
    }
    const storeObjId = new mongoose.Types.ObjectId(storeId);
    const query: unknown = {
      merchantId: req.merchantId,
      $or: [{ storeId: storeObjId }, { store: storeObjId }, { 'metadata.storeId': storeObjId }],
    };
    const dateRange = buildDateRange(from, to);
    if (dateRange) query.createdAt = dateRange;
    const txns = await CoinTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();
    const header = csvRow(['Date', 'TransactionId', 'UserId', 'Amount', 'Type', 'Source', 'Status']) + '\n';
    const rows = txns
      .map((t) =>
        csvRow([
          t.createdAt ? new Date(t.createdAt).toISOString() : '',
          t._id,
          t.userId || t.user || '',
          t.amount ?? 0,
          t.type || '',
          t.source || (t.metadata && t.metadata.source) || '',
          t.status || '',
        ])
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions.csv`);
    res.send(header + rows);
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// Customers export — aggregated per-user spend across coin transactions.
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const { storeId, from, to } = req.query as unknown;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId required' });
      return;
    }
    const owned = await verifyStoreOwnership(storeId, req.merchantId!);
    if (!owned) {
      res.status(403).json({ success: false, message: 'Access denied: store not found or not yours' });
      return;
    }
    const storeObjId = new mongoose.Types.ObjectId(storeId);
    const match: unknown = {
      merchantId: req.merchantId,
      $or: [{ storeId: storeObjId }, { store: storeObjId }, { 'metadata.storeId': storeObjId }],
    };
    const dateRange = buildDateRange(from, to);
    if (dateRange) match.createdAt = dateRange;

    const agg = await CoinTransaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $ifNull: ['$userId', '$user'] },
          totalSpend: { $sum: { $ifNull: ['$amount', 0] } },
          visitCount: { $sum: 1 },
          lastVisit: { $max: '$createdAt' },
        },
      },
      { $sort: { totalSpend: -1 } },
      { $limit: 10000 },
    ]);

    const userIds = agg.map((a) => a._id).filter(Boolean);
    // P1-DATA-1 FIX: Replaced direct DB read of users collection (auth-service owned)
    // with internal HTTP call to rez-auth-service /internal/users/bulk.
    const userMap = userIds.length ? await bulkGetUsers(userIds) : new Map();

    const header = csvRow(['UserId', 'Name', 'Email', 'Phone', 'TotalSpend', 'VisitCount', 'LastVisit']) + '\n';
    const rows = agg
      .map((row) => {
        const u = userMap.get(String(row._id)) || {};
        return csvRow([
          row._id || '',
          u.name || '',
          u.email || '',
          u.phone || '',
          row.totalSpend ?? 0,
          row.visitCount ?? 0,
          row.lastVisit ? new Date(row.lastVisit).toISOString() : '',
        ]);
      })
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=customers.csv`);
    res.send(header + rows);
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// Payouts export — all payouts for the merchant, optionally date-filtered.
router.get('/payouts', async (req: Request, res: Response) => {
  try {
    const { storeId, from, to } = req.query as unknown;
    // Payouts are merchant-scoped; storeId is accepted for ownership verification parity
    // with the other export endpoints but is not strictly required for filtering.
    if (storeId) {
      const owned = await verifyStoreOwnership(storeId, req.merchantId!);
      if (!owned) {
        res.status(403).json({ success: false, message: 'Access denied: store not found or not yours' });
        return;
      }
    }
    const query: unknown = { merchantId: new mongoose.Types.ObjectId(req.merchantId!) };
    const dateRange = buildDateRange(from, to);
    if (dateRange) query.createdAt = dateRange;
    const payouts = await Payout.find(query).sort({ createdAt: -1 }).limit(10000).lean();
    const header = csvRow(['PayoutId', 'Date', 'Amount', 'Status', 'Method', 'Reference']) + '\n';
    const rows = payouts
      .map((p) =>
        csvRow([
          p._id,
          p.createdAt ? new Date(p.createdAt).toISOString() : '',
          p.amount ?? 0,
          p.status || '',
          p.method || p.paymentMethod || '',
          p.reference || p.transactionId || '',
        ])
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payouts.csv`);
    res.send(header + rows);
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Accounting export routes (Tally, Excel, CSV, GSTR-1)
// ────────────────────────────────────────────────────────────────────────────

import { exportService, ExportType, ExportFormat, ExportOptions } from '../services/exportService';

/**
 * GET /api/exports/tally
 * Export transactions to Tally XML format
 * Query params: from (ISO date), to (ISO date)
 */
router.get('/tally', async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    const merchantId = (req as unknown).merchantId;

    if (!merchantId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!from || !to) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: from and to (ISO date format)',
      });
      return;
    }

    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use ISO date format (YYYY-MM-DD)',
      });
      return;
    }

    const xml = await exportService.exportToTally(merchantId, fromDate, toDate);

    const filename = `Tally_Export_${fromDate.toISOString().split('T')[0]}_to_${toDate.toISOString().split('T')[0]}.xml`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(xml);
  } catch (error: unknown) {
    console.error('Tally export error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Export failed' : error.message,
    });
  }
});

/**
 * GET /api/exports/excel
 * Export data to Excel format
 * Query params: type (sales|inventory|ledger), from (optional), to (optional)
 */
router.get('/excel', async (req: Request, res: Response) => {
  try {
    const { type, from, to } = req.query;
    const merchantId = (req as unknown).merchantId;

    if (!merchantId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const exportType = (type as ExportType) || 'sales';

    if (!['sales', 'inventory', 'ledger'].includes(exportType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid type. Use: sales, inventory, or ledger',
      });
      return;
    }

    const buffer = await exportService.exportToExcel(merchantId, exportType);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${exportType}_Export_${timestamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error: unknown) {
    console.error('Excel export error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Export failed' : error.message,
    });
  }
});

/**
 * GET /api/exports/csv
 * Export data to CSV format
 * Query params: type (sales|inventory|ledger|...), from (optional), to (optional)
 */
router.get('/csv', async (req: Request, res: Response) => {
  try {
    const { type, from, to } = req.query;
    const merchantId = (req as unknown).merchantId;

    if (!merchantId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const exportType = (type as string) || 'sales';

    if (!['sales', 'inventory', 'ledger'].includes(exportType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid type. Use: sales, inventory, or ledger',
      });
      return;
    }

    const csv = await exportService.exportToCSV(merchantId, exportType as ExportType);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${exportType}_Export_${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error: unknown) {
    console.error('CSV export error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Export failed' : error.message,
    });
  }
});

/**
 * GET /api/exports/gstr1
 * Export GSTR-1 format data
 * Query params: period (YYYY-MM format, e.g., 2026-04)
 */
router.get('/gstr1', async (req: Request, res: Response) => {
  try {
    const { period } = req.query;
    const merchantId = (req as unknown).merchantId;

    if (!merchantId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!period) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameter: period (format: YYYY-MM)',
      });
      return;
    }

    // Validate period format
    const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!periodRegex.test(period as string)) {
      res.status(400).json({
        success: false,
        message: 'Invalid period format. Use: YYYY-MM (e.g., 2026-04)',
      });
      return;
    }

    const gstr1Data = await exportService.exportGSTR1(merchantId, period as string);

    res.json({
      success: true,
      period,
      data: gstr1Data,
    });
  } catch (error: unknown) {
    console.error('GSTR-1 export error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Export failed' : error.message,
    });
  }
});

/**
 * POST /api/exports/generate
 * Generate export with custom options
 * Body: { format, type, from, to, storeId }
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { format, type, from, to, storeId } = req.body;
    const merchantId = (req as unknown).merchantId;

    if (!merchantId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Validate required fields
    if (!format) {
      res.status(400).json({
        success: false,
        message: 'Missing required field: format (tally|excel|csv|json)',
      });
      return;
    }

    const validFormats: ExportFormat[] = ['tally', 'excel', 'csv', 'json'];
    if (!validFormats.includes(format)) {
      res.status(400).json({
        success: false,
        message: `Invalid format. Use: ${validFormats.join('|')}`,
      });
      return;
    }

    if (!from || !to) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: from and to (ISO date format)',
      });
      return;
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use ISO date format (YYYY-MM-DD)',
      });
      return;
    }

    const options: ExportOptions = {
      merchantId,
      storeId,
      from: fromDate,
      to: toDate,
      format,
      type: type || 'sales',
    };

    const result = await exportService.generateExport(options);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error,
      });
      return;
    }

    // For JSON format, return as JSON
    if (format === 'json') {
      res.json({
        success: true,
        ...result,
      });
      return;
    }

    // For file downloads, set appropriate headers
    res.setHeader('Content-Type', result.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  } catch (error: unknown) {
    console.error('Export generation error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Export failed' : error.message,
    });
  }
});

export default router;
