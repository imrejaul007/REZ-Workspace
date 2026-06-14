/**
 * B2B Export Service
 *
 * Handles B2B data export in multiple formats:
 * - CSV (aging reports, supplier lists, PO lists)
 * - JSON (detailed data)
 */

import { Types } from 'mongoose';
import { Supplier } from '../models/Supplier';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { SupplierLedger } from '../models/SupplierLedger';
import { logger } from '../config/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ExportFormat = 'csv' | 'json';

// ── CSV Utilities ─────────────────────────────────────────────────────────────

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const csvRows = rows.map((row) =>
    headers.map((h) => escapeCSV(row[h])).join(',')
  );
  return [headers.join(','), ...csvRows].join('\n');
}

// ── Supplier Export ───────────────────────────────────────────────────────────

export async function exportSuppliers(
  merchantId: string,
  options: ExportOptions = { format: 'csv' }
): Promise<string> {
  const suppliers = await Supplier.find({
    merchantId: new Types.ObjectId(merchantId),
    isDeleted: { $ne: true },
  })
    .select('-__v -merchantId')
    .lean();

  const rows = suppliers.map((s) => ({
    id: s._id.toString(),
    name: s.name,
    contactPerson: s.contactPerson || '',
    email: s.email || '',
    phone: s.phone || '',
    gstNumber: s.gstNumber || '',
    pan: s.pan || '',
    creditLimit: s.creditLimit || 0,
    creditUsed: s.creditUsed || 0,
    creditAvailable: (s.creditLimit || 0) - (s.creditUsed || 0),
    creditPeriodDays: s.creditPeriodDays || 30,
    status: s.status || 'pending',
    isActive: s.isActive ? 'Yes' : 'No',
    address: s.address?.street || '',
    city: s.address?.city || '',
    state: s.address?.state || '',
    createdAt: s.createdAt?.toISOString() || '',
  }));

  if (options.format === 'json') {
    return JSON.stringify(rows, null, 2);
  }

  return toCSV(rows);
}

// ── Purchase Order Export ────────────────────────────────────────────────────

export async function exportPurchaseOrders(
  merchantId: string,
  filters: {
    format: ExportFormat;
    status?: string;
    supplierId?: string;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<string> {
  const query: unknown = {
    merchantId: new Types.ObjectId(merchantId),
    isDeleted: { $ne: true },
  };

  if (filters.status) query.status = filters.status;
  if (filters.supplierId) query.supplierId = new Types.ObjectId(filters.supplierId);
  if (filters.fromDate || filters.toDate) {
    query.orderDate = {};
    if (filters.fromDate) query.orderDate.$gte = filters.fromDate;
    if (filters.toDate) query.orderDate.$lte = filters.toDate;
  }

  const pos = await PurchaseOrder.find(query)
    .populate('supplierId', 'name gstNumber')
    .lean();

  const rows = pos.map((po) => {
    const supplier = po.supplierId as unknown;
    return {
      poNumber: po.poNumber,
      supplierName: supplier?.name || po.supplierName || '',
      supplierGstin: supplier?.gstNumber || '',
      status: po.status,
      paymentStatus: po.paymentStatus,
      orderDate: po.orderDate?.toISOString() || '',
      dueDate: po.dueDate?.toISOString() || '',
      subtotal: po.subtotal || 0,
      taxAmount: po.taxAmount || 0,
      totalAmount: po.totalAmount || 0,
      paidAmount: po.paidAmount || 0,
      outstandingAmount: (po.totalAmount || 0) - (po.paidAmount || 0),
      items: po.items?.length || 0,
    };
  });

  if (filters.format === 'json') {
    return JSON.stringify(rows, null, 2);
  }

  return toCSV(rows);
}

// ── Aging Report Export ──────────────────────────────────────────────────────

export async function exportAgingReport(
  merchantId: string,
  options: ExportOptions = { format: 'csv' }
): Promise<string> {
  const now = new Date();

  const pos = await PurchaseOrder.find({
    merchantId: new Types.ObjectId(merchantId),
    paymentStatus: { $in: ['unpaid', 'partial', 'overdue'] },
    isDeleted: { $ne: true },
  })
    .populate('supplierId', 'name gstNumber')
    .lean();

  const supplierData: Record<string, unknown> = {};

  for (const po of pos) {
    const supplier = po.supplierId as unknown;
    const supplierId = supplier?._id?.toString() || 'unknown';
    const supplierName = supplier?.name || po.supplierName || 'Unknown';

    if (!supplierData[supplierId]) {
      supplierData[supplierId] = {
        supplierId,
        supplierName,
        gstNumber: supplier?.gstNumber || '',
        current: 0,
        days30to60: 0,
        days60to90: 0,
        days90plus: 0,
        totalOutstanding: 0,
        oldestInvoice: null,
      };
    }

    const dueDate = new Date(po.dueDate);
    const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
    const outstanding = (po.totalAmount || 0) - (po.paidAmount || 0);

    if (outstanding <= 0) continue;

    if (daysDiff <= 0) supplierData[supplierId].current += outstanding;
    else if (daysDiff <= 30) supplierData[supplierId].days30to60 += outstanding;
    else if (daysDiff <= 60) supplierData[supplierId].days60to90 += outstanding;
    else supplierData[supplierId].days90plus += outstanding;

    supplierData[supplierId].totalOutstanding += outstanding;

    if (!supplierData[supplierId].oldestInvoice || dueDate < supplierData[supplierId].oldestInvoice) {
      supplierData[supplierId].oldestInvoice = dueDate;
    }
  }

  const rows = Object.values(supplierData)
    .map((s) => ({
      supplierName: s.supplierName,
      gstNumber: s.gstNumber,
      current: s.current,
      days30to60: s.days30to60,
      days60to90: s.days60to90,
      days90plus: s.days90plus,
      totalOutstanding: s.totalOutstanding,
      oldestInvoice: s.oldestInvoice?.toISOString().split('T')[0] || '',
    }))
    .sort((a, b) => b.totalOutstanding - a.totalOutstanding);

  const totals = rows.reduce(
    (acc, r) => ({
      current: acc.current + r.current,
      days30to60: acc.days30to60 + r.days30to60,
      days60to90: acc.days60to90 + r.days60to90,
      days90plus: acc.days90plus + r.days90plus,
      totalOutstanding: acc.totalOutstanding + r.totalOutstanding,
    }),
    { current: 0, days30to60: 0, days60to90: 0, days90plus: 0, totalOutstanding: 0 }
  );

  if (options.format === 'json') {
    return JSON.stringify({ generated: now.toISOString(), totals, suppliers: rows }, null, 2);
  }

  const csv = toCSV(rows as Record<string, unknown>[]);
  const totalsRow = `TOTALS,,,,${totals.current},${totals.days30to60},${totals.days60to90},${totals.days90plus},${totals.totalOutstanding},`;

  return `${csv}\n${totalsRow}`;
}

// ── Ledger Export ────────────────────────────────────────────────────────────

export async function exportLedger(
  merchantId: string,
  filters: {
    format: ExportFormat;
    supplierId?: string;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<string> {
  const query: unknown = { merchantId: new Types.ObjectId(merchantId) };

  if (filters.supplierId) query.supplierId = new Types.ObjectId(filters.supplierId);
  if (filters.fromDate || filters.toDate) {
    query.createdAt = {};
    if (filters.fromDate) query.createdAt.$gte = filters.fromDate;
    if (filters.toDate) query.createdAt.$lte = filters.toDate;
  }

  const entries = await SupplierLedger.find(query)
    .populate('supplierId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const rows = entries.map((entry) => ({
    date: entry.createdAt?.toISOString() || '',
    supplierName: (entry.supplierId as unknown)?.name || 'Unknown',
    type: entry.entryType,
    description: entry.description || '',
    debit: entry.debitAmount || 0,
    credit: entry.creditAmount || 0,
    balance: entry.balanceAfter?.toFixed(2) || '0.00',
    reference: entry.reference || '',
    isOverdue: entry.isOverdue ? 'Yes' : 'No',
  }));

  if (filters.format === 'json') {
    return JSON.stringify(rows, null, 2);
  }

  return toCSV(rows);
}
