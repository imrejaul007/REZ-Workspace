/**
 * TDS/TCS Management Service
 *
 * Handles Tax Deducted at Source and Tax Collected at Source:
 * - TDS on payments to suppliers
 * - TCS on sales to customers
 * - Certificate generation
 * - Quarterly returns preparation
 */

import { Types } from 'mongoose';
import { Supplier, ISupplier } from '../models/Supplier';
import { Customer } from '../models/Customer';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { SupplierLedger } from '../models/SupplierLedger';
import { logger } from '../config/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TDSRateType = '193J' | '194' | '194A' | '194C' | '194D' | '194H' | '194I' | '194J' | '194Q' | 'other';
export type TDSStatus = 'pending' | 'deducted' | 'deposited' | 'filed' | 'cancelled';
export type TCSRateType = '206C' | '206C1' | '206C1F' | '206C1H' | 'other';

export interface TDSRecord {
  _id: Types.ObjectId;
  merchantId: Types.ObjectId;

  // Reference
  referenceType: 'po' | 'payment' | 'invoice';
  referenceId: Types.ObjectId;
  referenceNumber: string;

  // Deductee details
  deducteeType: 'individual' | 'company' | 'firm' | 'huf' | 'other';
  deducteeName: string;
  deducteePan?: string;
  deducteeTan?: string;
  deducteeAddress: string;
  deducteeState: string;

  // Section & rate
  section: TDSRateType;
  tdsRate: number;
  tdsThreshold?: number;

  // Amount details
  paymentAmount: number;
  taxableAmount: number;
  tdsAmount: number;
  tdsPercentage: number;

  // Dates
  paymentDate: Date;
  dueDate: Date;
  challanNumber?: string;
  bsrCode?: string;

  // Status
  status: TDSStatus;
  depositedAt?: Date;
  depositedChallanNo?: string;

  // Certificate
  certificateNumber?: string;
  certificateDate?: Date;
  certificatePdf?: string;

  // Quarterly return
  quarter?: string; // Format: 2024-25Q1
  filedAt?: Date;
  filedBy?: string;

  // Book entry
  journalVoucherNo?: string;

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TDSCertificate {
  certificateNumber: string;
  date: Date;

  // Deductee
  deducteeName: string;
  deducteeAddress: string;
  deducteePan: string;

  // Deducter
  deducterName: string;
  deducterTan: string;
  deducterAddress: string;

  // Details
  section: string;
  amountPaid: number;
  tdsAmount: number;
  tdsPercentage: number;
  remarks?: string;
}

export interface TDSQuarterlySummary {
  quarter: string;
  year: string;

  // Totals
  totalPayments: number;
  totalTdsDeducted: number;
  totalTdsDeposited: number;
  totalTdsPending: number;

  // By section
  bySection: Record<string, {
    count: number;
    amount: number;
    tds: number;
  }>;

  // Challans
  challanCount: number;
  challanDetails: Array<{
    challanNumber: string;
    bsrCode: string;
    amount: number;
    depositDate: Date;
  }>;

  // Certificate count
  certificatesIssued: number;
  certificatesPending: number;
}

// In-memory store for demo
const tdsRecords: Map<string, unknown> = new Map();
const tcsRecords: Map<string, unknown> = new Map();

// ── TDS Rates Configuration ────────────────────────────────────────────────────

const TDS_RATES: Record<TDSRateType, { rate: number; threshold: number; description: string }> = {
  '193J': { rate: 0.1, threshold: 5000, description: 'Interest on securities' },
  '194': { rate: 0.1, threshold: 10000, description: 'Dividends' },
  '194A': { rate: 0.1, threshold: 40000, description: 'Interest (other than securities)' },
  '194C': { rate: 0.02, threshold: 30000, description: 'Contractor/HC payments' },
  '194D': { rate: 0.05, threshold: 15000, description: 'Insurance commission' },
  '194H': { rate: 0.05, threshold: 15000, description: 'Commission/Brokerage' },
  '194I': { rate: 0.02, threshold: 180000, description: 'Rent (machinery/equipment)' },
  '194J': { rate: 0.1, threshold: 30000, description: 'Professional fees/Royalties' },
  '194Q': { rate: 0.1, threshold: 500000, description: 'Purchase of goods' },
  'other': { rate: 0.1, threshold: 0, description: 'Other payments' },
};

// ── TDS Deduction ─────────────────────────────────────────────────────────────

/**
 * Calculate TDS on a payment
 */
export function calculateTDS(
  amount: number,
  section: TDSRateType,
  deducteeType?: 'individual' | 'company'
): {
  taxableAmount: number;
  tdsAmount: number;
  tdsRate: number;
  isTdsApplicable: boolean;
} {
  const config = TDS_RATES[section];
  const rate = config.rate;

  // For companies, no threshold
  const threshold = deducteeType === 'company' ? 0 : config.threshold;

  const isTdsApplicable = amount > threshold;
  const taxableAmount = isTdsApplicable ? amount : 0;
  const tdsAmount = Math.round(taxableAmount * rate * 100) / 100;

  return {
    taxableAmount,
    tdsAmount,
    tdsRate: rate * 100,
    isTdsApplicable,
  };
}

/**
 * Create TDS record for a payment
 */
export async function createTDSRecord(
  merchantId: string,
  input: {
    referenceType: 'po' | 'payment' | 'invoice';
    referenceId: string;
    referenceNumber: string;
    deducteeType: 'individual' | 'company' | 'firm' | 'huf' | 'other';
    deducteeName: string;
    deducteePan?: string;
    deducteeAddress?: string;
    deducteeState?: string;
    section: TDSRateType;
    paymentAmount: number;
    paymentDate?: Date;
  }
): Promise<TDSRecord | null> {
  try {
    const tdsCalculation = calculateTDS(
      input.paymentAmount,
      input.section,
      input.deducteeType
    );

    if (!tdsCalculation.isTdsApplicable) {
      logger.info('[TDS] Not applicable', { amount: input.paymentAmount, section: input.section });
      return null;
    }

    const paymentDate = input.paymentDate || new Date();
    const dueDate = new Date(paymentDate);
    dueDate.setDate(dueDate.getDate() + 7); // TDS deposit due within 7 days

    const record = {
      _id: new Types.ObjectId(),
      merchantId: new Types.ObjectId(merchantId),
      referenceType: input.referenceType,
      referenceId: new Types.ObjectId(input.referenceId),
      referenceNumber: input.referenceNumber,
      deducteeType: input.deducteeType,
      deducteeName: input.deducteeName,
      deducteePan: input.deducteePan,
      deducteeAddress: input.deducteeAddress || '',
      deducteeState: input.deducteeState || '',
      section: input.section,
      tdsRate: tdsCalculation.tdsRate,
      tdsThreshold: TDS_RATES[input.section].threshold,
      paymentAmount: input.paymentAmount,
      taxableAmount: tdsCalculation.taxableAmount,
      tdsAmount: tdsCalculation.tdsAmount,
      tdsPercentage: tdsCalculation.tdsRate,
      paymentDate,
      dueDate,
      status: 'deducted' as TDSStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    tdsRecords.set(record._id.toString(), record);

    logger.info('[TDS] Record created', {
      recordId: record._id,
      tdsAmount: record.tdsAmount,
    });

    return record;
  } catch (err) {
    logger.error('[TDS] Record creation failed', { error: err });
    return null;
  }
}

/**
 * Deposit TDS (generate challan)
 */
export async function depositTDS(
  merchantId: string,
  recordIds: string[],
  challanDetails: {
    challanNumber: string;
    bsrCode: string;
    depositDate: Date;
    amount: number;
  }
): Promise<{ success: boolean; message: string; depositedRecords: number }> {
  try {
    let depositedCount = 0;

    for (const id of recordIds) {
      const record = tdsRecords.get(id);
      if (!record || record.merchantId.toString() !== merchantId) continue;

      record.status = 'deposited';
      record.depositedAt = challanDetails.depositDate;
      record.challanNumber = challanDetails.challanNumber;
      record.bsrCode = challanDetails.bsrCode;
      record.depositedChallanNo = challanDetails.challanNumber;
      record.updatedAt = new Date();

      tdsRecords.set(id, record);
      depositedCount++;
    }

    logger.info('[TDS] Deposited', {
      count: depositedCount,
      challan: challanDetails.challanNumber,
    });

    return {
      success: true,
      message: `TDS deposited successfully. Challan: ${challanDetails.challanNumber}`,
      depositedRecords: depositedCount,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Deposit failed',
      depositedRecords: 0,
    };
  }
}

/**
 * Generate TDS certificate (Form 16A)
 */
export async function generateTDSCertificate(
  merchantId: string,
  recordId: string
): Promise<{
  success: boolean;
  certificate?: TDSCertificate;
  error?: string;
}> {
  try {
    const record = tdsRecords.get(recordId);
    if (!record || record.merchantId.toString() !== merchantId) {
      return { success: false, error: 'Record not found' };
    }

    if (record.status !== 'deposited') {
      return { success: false, error: 'TDS must be deposited before generating certificate' };
    }

    const certificateNumber = generateCertificateNumber();

    const certificate: TDSCertificate = {
      certificateNumber,
      date: new Date(),

      deducteeName: record.deducteeName,
      deducteeAddress: record.deducteeAddress,
      deducteePan: record.deducteePan || 'NOTPROVIDED',

      deducterName: 'Merchant Business', // Would come from merchant profile
      deducterTan: 'MUMH12345A', // Would come from merchant profile
      deducterAddress: record.deducteeState,

      section: record.section,
      amountPaid: record.paymentAmount - record.tdsAmount,
      tdsAmount: record.tdsAmount,
      tdsPercentage: record.tdsPercentage,
    };

    // Update record
    record.certificateNumber = certificateNumber;
    record.certificateDate = certificate.date;
    tdsRecords.set(recordId, record);

    return { success: true, certificate };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Certificate generation failed',
    };
  }
}

/**
 * Get quarterly TDS summary
 */
export async function getTDSQuarterlySummary(
  merchantId: string,
  quarter: string // Format: 2024-25Q1
): Promise<TDSQuarterlySummary> {
  const records = Array.from(tdsRecords.values()).filter(
    (r) => r.merchantId.toString() === merchantId && r.quarter === quarter
  );

  const summary: TDSQuarterlySummary = {
    quarter,
    year: quarter.substring(0, 4),
    totalPayments: records.reduce((sum, r) => sum + r.paymentAmount, 0),
    totalTdsDeducted: records.reduce((sum, r) => sum + r.tdsAmount, 0),
    totalTdsDeposited: records
      .filter((r) => r.status === 'deposited')
      .reduce((sum, r) => sum + r.tdsAmount, 0),
    totalTdsPending: records
      .filter((r) => r.status !== 'deposited' && r.status !== 'filed')
      .reduce((sum, r) => sum + r.tdsAmount, 0),
    bySection: {},
    challanCount: 0,
    challanDetails: [],
    certificatesIssued: records.filter((r) => r.certificateNumber).length,
    certificatesPending: records.filter((r) => !r.certificateNumber && r.status === 'deposited').length,
  };

  // Group by section
  for (const record of records) {
    const section = record.section;
    if (!summary.bySection[section]) {
      summary.bySection[section] = { count: 0, amount: 0, tds: 0 };
    }
    summary.bySection[section].count++;
    summary.bySection[section].amount += record.paymentAmount;
    summary.bySection[section].tds += record.tdsAmount;
  }

  // Collect challan details
  const challans = new Map<string, unknown>();
  for (const record of records) {
    if (record.challanNumber && !challans.has(record.challanNumber)) {
      summary.challanDetails.push({
        challanNumber: record.challanNumber,
        bsrCode: record.bsrCode || '',
        amount: record.tdsAmount,
        depositDate: record.depositedAt || new Date(),
      });
      summary.challanCount++;
    }
  }

  return summary;
}

/**
 * List TDS records
 */
export async function listTDSRecords(
  merchantId: string,
  filters?: {
    status?: TDSStatus;
    section?: TDSRateType;
    fromDate?: Date;
    toDate?: Date;
    deducteePan?: string;
  }
): Promise<TDSRecord[]> {
  const results: TDSRecord[] = [];

  for (const record of tdsRecords.values()) {
    if (record.merchantId.toString() !== merchantId) continue;

    if (filters) {
      if (filters.status && record.status !== filters.status) continue;
      if (filters.section && record.section !== filters.section) continue;
      if (filters.deducteePan && record.deducteePan !== filters.deducteePan) continue;
      if (filters.fromDate && record.paymentDate < filters.fromDate) continue;
      if (filters.toDate && record.paymentDate > filters.toDate) continue;
    }

    results.push(record);
  }

  return results.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
}

// ── TCS (Tax Collected at Source) ────────────────────────────────────────────

const TCS_RATES: Record<TCSRateType, { rate: number; threshold: number; description: string }> = {
  '206C': { rate: 0.01, threshold: 5000000, description: 'Alcoholic liquor for human consumption' },
  '206C1F': { rate: 0.001, threshold: 5000000, description: 'Tendu leaves' },
  '206C1H': { rate: 0.0005, threshold: 5000000, description: 'Other goods ( TCS on e-commerce)' },
  'other': { rate: 0.01, threshold: 0, description: 'Other goods' },
};

/**
 * Calculate TCS on sale
 */
export function calculateTCS(
  amount: number,
  section: TCSRateType
): {
  taxableAmount: number;
  tcsAmount: number;
  tcsRate: number;
  isTcsApplicable: boolean;
} {
  const config = TCS_RATES[section];
  const rate = config.rate;
  const threshold = config.threshold;

  const isTcsApplicable = threshold === 0 || amount > threshold;
  const taxableAmount = isTcsApplicable ? amount : 0;
  const tcsAmount = Math.round(taxableAmount * rate * 100) / 100;

  return {
    taxableAmount,
    tcsAmount,
    tcsRate: rate * 100,
    isTcsApplicable,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * FIX (security): Generate secure certificate number using crypto
 */
function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  // FIX (security): Replaced Math.random() with crypto
  let random: string;
  try {
    const { randomUUID } = require('crypto');
    random = randomUUID().replace(/-/g, '').substring(0, 4).toUpperCase();
  } catch {
    random = Math.random().toString(36).substring(2, 6).toUpperCase();
  }
  return `CERT${timestamp}${random}`.substring(0, 16);
}

function getQuarter(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return `${year}-${(year + 1).toString().slice(-2)}Q${quarter}`;
}
