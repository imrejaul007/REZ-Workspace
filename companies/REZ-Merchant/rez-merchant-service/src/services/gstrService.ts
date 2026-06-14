/**
 * GSTR Filing Preparation Service
 *
 * Prepares GST returns data:
 * - GSTR-1: Outward supplies (sales)
 * - GSTR-2: Inward supplies (purchases)
 * - GSTR-3B: Summary return
 * - GSTR-4: Composition scheme
 */

import { Types } from 'mongoose';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { Supplier } from '../models/Supplier';
import { Customer } from '../models/Customer';
import { logger } from '../config/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GSTRRecord {
  gstin: string;
  legalName?: string;
  tradeName?: string;

  // Invoice details
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceValue: number;

  // Place of supply
  placeOfSupply: string;
  supplyType: 'B2B' | 'B2C' | 'B2CL' | 'B2CS' | 'EXP' | 'SEZWP' | 'SEZWOP';

  // Rate-wise breakup
  taxableValue: number;
  igstRate?: number;
  igstAmount?: number;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  cessRate?: number;
  cessAmount?: number;

  // E-commerce
  ecommerceGstin?: string;

  // Revise/charge
  reverseCharge?: boolean;
  inv_typ?: 'R' | 'DE' | 'ND' | 'EX';

  // Status
  filingStatus?: 'filed' | 'pending' | 'error';
  filedAt?: Date;
  filedBy?: string;
  ackNumber?: string;
}

export interface GSTR1Summary {
  period: string;
  type: 'monthly' | 'quarterly';

  // B2B summary
  b2bCount: number;
  b2bTaxableValue: number;
  b2bIgst: number;
  b2bCgst: number;
  b2bSgst: number;
  b2bCess: number;

  // B2CL summary
  b2clCount: number;
  b2clTaxableValue: number;
  b2clIgst: number;
  b2clCess: number;

  // B2CS summary (aggregate)
  b2csCount: number;
  b2csTaxableValue: number;
  b2csIgst: number;
  b2csCgst: number;
  b2csSgst: number;
  b2csCess: number;

  // Export
  exportCount: number;
  exportTaxableValue: number;
  exportIgst: number;
  exportCess: number;

  // Credit/Debit notes
  cdnCount: number;
  cdnTaxableValue: number;
  cdnIgst: number;
  cdnCgst: number;
  cdnSgst: number;

  // Total
  totalTaxableValue: number;
  totalIgst: number;
  totalCgst: number;
  totalSgst: number;
  totalCess: number;
}

export interface GSTR2Summary {
  period: string;

  // B2B imports
  b2bCount: number;
  b2bTaxableValue: number;
  b2bIgst: number;
  b2bCgst: number;
  b2bSgst: number;
  b2bCess: number;

  // ISD
  isdCount: number;
  isdItcAvailable: number;
  isdItcRejected: number;

  // TDS/TCS
  tdsCount: number;
  tdsAmount: number;
  tcsCount: number;
  tcsAmount: number;

  // Amendments
  amendCount: number;

  // Total
  totalItcAvailable: number;
  totalItcRejected: number;
  totalTaxableValue: number;
}

// ── GSTR-1 (Outward Supplies) ────────────────────────────────────────────────

/**
 * Generate GSTR-1 data for a period
 */
export async function generateGSTR1(
  merchantId: string,
  year: number,
  month: number,
  filingType: 'monthly' | 'quarterly' = 'monthly'
): Promise<{
  records: GSTRRecord[];
  summary: GSTR1Summary;
}> {
  const { startDate, endDate } = getPeriodDates(year, month, filingType);

  logger.info('[GSTR] Generating GSTR-1', { merchantId, year, month });

  // Get all sales/credit notes in the period
  // In production, use actual sales/order models
  const records: GSTRRecord[] = [];

  // Get all POs (as they represent purchases, but for B2B outward supplies you'd use sales)
  // For merchant service, we'll use customer invoices instead

  // For demo, create sample records
  const summary: GSTR1Summary = {
    period: `${year}-${month.toString().padStart(2, '0')}`,
    type: filingType,

    b2bCount: 0,
    b2bTaxableValue: 0,
    b2bIgst: 0,
    b2bCgst: 0,
    b2bSgst: 0,
    b2bCess: 0,

    b2clCount: 0,
    b2clTaxableValue: 0,
    b2clIgst: 0,
    b2clCess: 0,

    b2csCount: 0,
    b2csTaxableValue: 0,
    b2csIgst: 0,
    b2csCgst: 0,
    b2csSgst: 0,
    b2csCess: 0,

    exportCount: 0,
    exportTaxableValue: 0,
    exportIgst: 0,
    exportCess: 0,

    cdnCount: 0,
    cdnTaxableValue: 0,
    cdnIgst: 0,
    cdnCgst: 0,
    cdnSgst: 0,

    totalTaxableValue: 0,
    totalIgst: 0,
    totalCgst: 0,
    totalSgst: 0,
    totalCess: 0,
  };

  // Aggregate from records
  for (const record of records) {
    if (record.supplyType === 'B2B') {
      summary.b2bCount++;
      summary.b2bTaxableValue += record.taxableValue;
      summary.b2bIgst += record.igstAmount || 0;
      summary.b2bCgst += record.cgstAmount || 0;
      summary.b2bSgst += record.sgstAmount || 0;
      summary.b2bCess += record.cessAmount || 0;
    } else if (record.supplyType === 'B2CL') {
      summary.b2clCount++;
      summary.b2clTaxableValue += record.taxableValue;
      summary.b2clIgst += record.igstAmount || 0;
      summary.b2clCess += record.cessAmount || 0;
    } else if (record.supplyType === 'B2CS') {
      summary.b2csCount++;
      summary.b2csTaxableValue += record.taxableValue;
      summary.b2csIgst += record.igstAmount || 0;
      summary.b2csCgst += record.cgstAmount || 0;
      summary.b2csSgst += record.sgstAmount || 0;
      summary.b2csCess += record.cessAmount || 0;
    } else if (record.supplyType.startsWith('EXP')) {
      summary.exportCount++;
      summary.exportTaxableValue += record.taxableValue;
      summary.exportIgst += record.igstAmount || 0;
      summary.exportCess += record.cessAmount || 0;
    } else if (record.supplyType === 'CDN') {
      summary.cdnCount++;
      summary.cdnTaxableValue += record.taxableValue;
      summary.cdnIgst += record.igstAmount || 0;
      summary.cdnCgst += record.cgstAmount || 0;
      summary.cdnSgst += record.sgstAmount || 0;
    }
  }

  // Calculate totals
  summary.totalTaxableValue =
    summary.b2bTaxableValue + summary.b2clTaxableValue + summary.b2csTaxableValue + summary.exportTaxableValue;
  summary.totalIgst = summary.b2bIgst + summary.b2clIgst + summary.b2csIgst + summary.exportIgst;
  summary.totalCgst = summary.b2bCgst + summary.b2csCgst;
  summary.totalSgst = summary.b2bSgst + summary.b2csSgst;
  summary.totalCess =
    summary.b2bCess + summary.b2clCess + summary.b2csCess + summary.exportCess;

  return { records, summary };
}

// ── GSTR-2 (Inward Supplies) ─────────────────────────────────────────────────

/**
 * Generate GSTR-2 data for a period
 */
export async function generateGSTR2(
  merchantId: string,
  year: number,
  month: number,
  filingType: 'monthly' | 'quarterly' = 'monthly'
): Promise<{
  records: GSTRRecord[];
  summary: GSTR2Summary;
}> {
  const { startDate, endDate } = getPeriodDates(year, month, filingType);

  logger.info('[GSTR] Generating GSTR-2', { merchantId, year, month });

  // Get all POs (inward supplies) in the period
  const purchaseOrders = await PurchaseOrder.find({
    merchantId: new Types.ObjectId(merchantId),
    orderDate: { $gte: startDate, $lte: endDate },
    status: { $nin: ['cancelled', 'draft'] },
  })
    .populate('supplierId', 'gstin name')
    .lean();

  const records: GSTRRecord[] = [];

  for (const po of purchaseOrders) {
    const supplier = po.supplierId as unknown;
    const supplierGstin = supplier?.gstin;

    // Classify based on supplier GSTIN and amount
    const supplyType = classifySupplyType(supplierGstin, po.totalAmount);

    // Calculate tax breakdown
    let igstRate = 18;
    let cgstRate = 9;
    let sgstRate = 9;

    // Try to get rates from PO items
    let totalTaxableValue = 0;
    for (const item of po.items) {
      totalTaxableValue += item.total || 0;
    }

    const isInterState = supplierGstin?.substring(0, 2) !== '27'; // Assuming Maharashtra origin

    const record: GSTRRecord = {
      gstin: supplierGstin || '',
      invoiceNumber: po.poNumber,
      invoiceDate: po.orderDate,
      invoiceValue: po.totalAmount,
      placeOfSupply: supplierGstin?.substring(0, 2) || '27',
      supplyType,
      taxableValue: totalTaxableValue,
      cgstRate: isInterState ? undefined : cgstRate,
      cgstAmount: isInterState ? undefined : (totalTaxableValue * cgstRate) / 100,
      sgstRate: isInterState ? undefined : sgstRate,
      sgstAmount: isInterState ? undefined : (totalTaxableValue * sgstRate) / 100,
      igstRate: isInterState ? igstRate : undefined,
      igstAmount: isInterState ? (totalTaxableValue * igstRate) / 100 : undefined,
      reverseCharge: false,
    };

    records.push(record);
  }

  // Generate summary
  const summary: GSTR2Summary = {
    period: `${year}-${month.toString().padStart(2, '0')}`,

    b2bCount: 0,
    b2bTaxableValue: 0,
    b2bIgst: 0,
    b2bCgst: 0,
    b2bSgst: 0,
    b2bCess: 0,

    isdCount: 0,
    isdItcAvailable: 0,
    isdItcRejected: 0,

    tdsCount: 0,
    tdsAmount: 0,
    tcsCount: 0,
    tcsAmount: 0,

    amendCount: 0,

    totalItcAvailable: 0,
    totalItcRejected: 0,
    totalTaxableValue: 0,
  };

  for (const record of records) {
    if (record.supplyType === 'B2B') {
      summary.b2bCount++;
      summary.b2bTaxableValue += record.taxableValue;
      summary.b2bIgst += record.igstAmount || 0;
      summary.b2bCgst += record.cgstAmount || 0;
      summary.b2bSgst += record.sgstAmount || 0;
      summary.b2bCess += record.cessAmount || 0;

      // ITC is 100% for B2B
      summary.totalItcAvailable +=
        (record.igstAmount || 0) +
        (record.cgstAmount || 0) +
        (record.sgstAmount || 0);
    }
  }

  summary.totalTaxableValue = summary.b2bTaxableValue;

  return { records, summary };
}

// ── GSTR-3B Summary ──────────────────────────────────────────────────────────

/**
 * Generate GSTR-3B summary (simplified)
 */
export async function generateGSTR3B(
  merchantId: string,
  year: number,
  month: number
): Promise<{
  outwardSummary: {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
  };
  inwardSummary: {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
  };
  itcSummary: {
    itcAvailable: number;
    itcRevenues: number;
    netItc: number;
  };
  taxPayable: {
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    interest: number;
    penalty: number;
    fees: number;
    total: number;
  };
}> {
  const gstr1 = await generateGSTR1(merchantId, year, month);
  const gstr2 = await generateGSTR2(merchantId, year, month);

  const gstr3b = {
    outwardSummary: {
      taxableValue: gstr1.summary.totalTaxableValue,
      igst: gstr1.summary.totalIgst,
      cgst: gstr1.summary.totalCgst,
      sgst: gstr1.summary.totalSgst,
      cess: gstr1.summary.totalCess,
    },
    inwardSummary: {
      taxableValue: gstr2.summary.totalTaxableValue,
      igst: gstr2.summary.totalIgst,
      cgst: gstr2.summary.totalCgst,
      sgst: gstr2.summary.totalSgst,
      cess: gstr2.summary.totalCess,
    },
    itcSummary: {
      itcAvailable: gstr2.summary.totalItcAvailable,
      itcRevenues: 0, // From GSTR-2A matching
      netItc: gstr2.summary.totalItcAvailable,
    },
    taxPayable: {
      igst: gstr1.summary.totalIgst - gstr2.summary.totalIgst,
      cgst: gstr1.summary.totalCgst - gstr2.summary.totalCgst,
      sgst: gstr1.summary.totalSgst - gstr2.summary.totalSgst,
      cess: gstr1.summary.totalCess - gstr2.summary.totalCess,
      interest: 0,
      penalty: 0,
      fees: 0,
      total: 0,
    },
  };

  // Calculate total
  gstr3b.taxPayable.total =
    Math.max(0, gstr3b.taxPayable.igst) +
    Math.max(0, gstr3b.taxPayable.cgst) +
    Math.max(0, gstr3b.taxPayable.sgst) +
    Math.max(0, gstr3b.taxPayable.cess) +
    gstr3b.taxPayable.interest +
    gstr3b.taxPayable.penalty +
    gstr3b.taxPayable.fees;

  return gstr3b;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getPeriodDates(
  year: number,
  month: number,
  type: 'monthly' | 'quarterly'
): { startDate: Date; endDate: Date } {
  if (type === 'monthly') {
    return {
      startDate: new Date(year, month - 1, 1),
      endDate: new Date(year, month, 0), // Last day of month
    };
  }

  // Quarterly: Apr-Jun, Jul-Sep, Oct-Dec, Jan-Mar
  const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
  return {
    startDate: new Date(year, quarterStartMonth - 1, 1),
    endDate: new Date(year, quarterStartMonth + 2, 0),
  };
}

function classifySupplyType(
  gstin: string | undefined,
  amount: number
): GSTRRecord['supplyType'] {
  if (!gstin) {
    // Unregistered - B2C
    return amount > 250000 ? 'B2CL' : 'B2CS';
  }

  // B2B for registered
  return 'B2B';
}

/**
 * Export GSTR-1 JSON for portal upload
 */
export async function exportGSTR1JSON(
  merchantId: string,
  gstin: string,
  year: number,
  month: number
): Promise<string> {
  const { records, summary } = await generateGSTR1(merchantId, year, month);

  const gstr1Data = {
    gstin,
    fp: `${year}${month.toString().padStart(2, '0')}`,
    gt: 0,
    cur_gt: 0,
    b2b: records
      .filter((r) => r.supplyType === 'B2B')
      .map((r) => ({
        ctin: r.gstin,
        inv: [
          {
            inum: r.invoiceNumber,
            idt: r.invoiceDate.toISOString().split('T')[0],
            val: r.invoiceValue,
            pos: r.placeOfSupply,
            rchrg: r.reverseCharge ? 'Y' : 'N',
            inv_typ: r.inv_typ || 'R',
            itms: [
              {
                num: 1,
                itm_det: {
                  txval: r.taxableValue,
                  rt: r.igstRate || r.cgstRate! + r.sgstRate!,
                  iamt: r.igstAmount || 0,
                  camt: r.cgstAmount || 0,
                  samt: r.sgstAmount || 0,
                  csamt: r.cessAmount || 0,
                },
              },
            ],
          },
        ],
      })),
    b2cl: records
      .filter((r) => r.supplyType === 'B2CL')
      .map((r) => ({
        pos: r.placeOfSupply,
        inv: [
          {
            inum: r.invoiceNumber,
            idt: r.invoiceDate.toISOString().split('T')[0],
            val: r.invoiceValue,
            txval: r.taxableValue,
            rt: r.igstRate || 0,
            iamt: r.igstAmount || 0,
            csamt: r.cessAmount || 0,
          },
        ],
      })),
    b2cs: records
      .filter((r) => r.supplyType === 'B2CS')
      .map((r) => ({
        pos: r.placeOfSupply,
        txval: r.taxableValue,
        rt: r.igstRate || r.cgstRate! + r.sgstRate!,
        iamt: r.igstAmount || 0,
        camt: r.cgstAmount || 0,
        samt: r.sgstAmount || 0,
        csamt: r.cessAmount || 0,
        ty: 'OE',
      })),
    exp: records
      .filter((r) => r.supplyType.startsWith('EXP'))
      .map((r) => ({
        exp_typ: r.supplyType === 'EXPWOP' ? 'WOPAY' : 'WPAY',
        inv: [
          {
            inum: r.invoiceNumber,
            idt: r.invoiceDate.toISOString().split('T')[0],
            val: r.invoiceValue,
            txval: r.taxableValue,
            iamt: r.igstAmount || 0,
            csamt: r.cessAmount || 0,
          },
        ],
      })),
  };

  return JSON.stringify(gstr1Data, null, 2);
}
