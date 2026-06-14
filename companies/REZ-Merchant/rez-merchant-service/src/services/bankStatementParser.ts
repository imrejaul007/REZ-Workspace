/**
 * Bank Statement Parser Service
 *
 * Parses bank statements from various formats and imports transactions.
 * Supports: CSV, NEFT/RTGS/UPI transaction formats
 */

import { Types } from 'mongoose';
import { SupplierLedger, ILedgerEntry } from '../models/SupplierLedger';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { Supplier } from '../models/Supplier';
import { logger } from '../config/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParsedTransaction {
  date: Date;
  description: string;
  reference: string;
  debit?: number;
  credit?: number;
  balance?: number;
  transactionType: 'debit' | 'credit' | 'reverse_credit';
  category?: 'neft' | 'rtgs' | 'upi' | 'imps' | 'cash' | 'cheque' | 'other';
  counterpartName?: string;
  counterpartAccount?: string;
  utrNumber?: string;
  bankRef?: string;
}

export interface BankStatementParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  errors: string[];
  warnings: string[];
  bankName?: string;
  accountNumber?: string;
  statementPeriod?: { from: Date; to: Date };
}

export interface ReconciliationMatch {
  transaction: ParsedTransaction;
  ledgerEntry?: ILedgerEntry;
  purchaseOrder?;
  supplier?;
  matchConfidence: number; // 0-100
  matchReason: string;
}

// ── Bank-specific parsers ──────────────────────────────────────────────────────

/**
 * Parse HDFC Bank CSV format
 */
export function parseHDFCCSV(content: string): ParsedTransaction[] {
  const lines = content.split('\n').filter((l) => l.trim());
  const transactions: ParsedTransaction[] = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.replace(/"/g, '').trim());
    if (cols.length < 5) continue;

    const [dateStr, description, debit, credit, balance, ...rest] = cols;

    const transaction: ParsedTransaction = {
      date: parseDate(dateStr),
      description: description || '',
      reference: rest[0] || extractUTR(description) || '',
      transactionType: debit && parseFloat(debit) > 0 ? 'debit' : 'credit',
      debit: debit ? parseFloat(debit.replace(/,/g, '')) : undefined,
      credit: credit ? parseFloat(credit.replace(/,/g, '')) : undefined,
      balance: balance ? parseFloat(balance.replace(/,/g, '')) : undefined,
      category: detectCategory(description),
      utrNumber: extractUTR(description),
    };

    transactions.push(transaction);
  }

  return transactions;
}

/**
 * Parse ICICI Bank CSV format
 */
export function parseICICICSV(content: string): ParsedTransaction[] {
  const lines = content.split('\n').filter((l) => l.trim());
  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.replace(/"/g, '').trim());
    if (cols.length < 6) continue;

    const [dateStr, valueDate, description, debit, credit, balance] = cols;

    const transaction: ParsedTransaction = {
      date: parseDate(dateStr),
      description: description || '',
      reference: extractUTR(description) || '',
      transactionType: debit && parseFloat(debit) > 0 ? 'debit' : 'credit',
      debit: debit ? parseFloat(debit.replace(/,/g, '')) : undefined,
      credit: credit ? parseFloat(credit.replace(/,/g, '')) : undefined,
      balance: balance ? parseFloat(balance.replace(/,/g, '')) : undefined,
      category: detectCategory(description),
      utrNumber: extractUTR(description),
    };

    transactions.push(transaction);
  }

  return transactions;
}

/**
 * Parse SBI Bank CSV format
 */
export function parseSBICSV(content: string): ParsedTransaction[] {
  const lines = content.split('\n').filter((l) => l.trim());
  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.replace(/"/g, '').trim());
    if (cols.length < 7) continue;

    const [dateStr, txnDate, description, chequeNo, debit, credit, balance] = cols;

    const transaction: ParsedTransaction = {
      date: parseDate(dateStr),
      description: description || '',
      reference: chequeNo || extractUTR(description) || '',
      transactionType: debit && parseFloat(debit) > 0 ? 'debit' : 'credit',
      debit: debit ? parseFloat(debit.replace(/,/g, '')) : undefined,
      credit: credit ? parseFloat(credit.replace(/,/g, '')) : undefined,
      balance: balance ? parseFloat(balance.replace(/,/g, '')) : undefined,
      category: detectCategory(description),
      utrNumber: extractUTR(description),
      bankRef: chequeNo,
    };

    transactions.push(transaction);
  }

  return transactions;
}

/**
 * Generic CSV parser - auto-detect columns
 */
export function parseGenericCSV(content: string): ParsedTransaction[] {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const transactions: ParsedTransaction[] = [];

  // Detect column positions
  const dateIdx = header.includes('date') ? header.split(',').findIndex((c) => c.includes('date')) : 0;
  const descIdx = header.includes('description') ? header.split(',').findIndex((c) => c.includes('description')) : 1;
  const debitIdx = header.includes('debit') ? header.split(',').findIndex((c) => c.includes('debit')) : -1;
  const creditIdx = header.includes('credit') ? header.split(',').findIndex((c) => c.includes('credit')) : -1;
  const balanceIdx = header.includes('balance') ? header.split(',').findIndex((c) => c.includes('balance')) : -1;
  const refIdx = header.includes('ref') || header.includes('utr') ? header.split(',').findIndex((c) => c.includes('ref') || c.includes('utr')) : -1;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.replace(/"/g, '').trim());
    if (cols.length < 3) continue;

    const debitStr = debitIdx >= 0 ? cols[debitIdx] : '';
    const creditStr = creditIdx >= 0 ? cols[creditIdx] : '';

    const transaction: ParsedTransaction = {
      date: parseDate(cols[dateIdx] || ''),
      description: cols[descIdx] || '',
      reference: refIdx >= 0 ? cols[refIdx] : extractUTR(cols.join(' ')),
      transactionType: debitStr && parseFloat(debitStr) > 0 ? 'debit' : 'credit',
      debit: debitStr ? parseFloat(debitStr.replace(/,/g, '')) : undefined,
      credit: creditStr ? parseFloat(creditStr.replace(/,/g, '')) : undefined,
      balance: balanceIdx >= 0 ? parseFloat(cols[balanceIdx]?.replace(/,/g, '') || '0') : undefined,
      category: detectCategory(cols.join(' ')),
      utrNumber: extractUTR(cols.join(' ')),
    };

    if (transaction.date && (transaction.debit || transaction.credit)) {
      transactions.push(transaction);
    }
  }

  return transactions;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  // Try multiple formats
  const formats = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})(\d{2})(\d{4})$/, // DDMMYYYY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0] || format === formats[1]) {
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      } else if (format === formats[2]) {
        return new Date(match[1], parseInt(match[2]) - 1, match[3]);
      } else if (format === formats[3]) {
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      }
    }
  }

  // Fallback to native parsing
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function extractUTR(text: string): string | undefined {
  if (!text) return undefined;

  // Common UTR patterns
  const patterns = [
    /UTR\s*[:\-]?\s*(\d{16,22})/i,
    /Ref\s*[:\-]?\s*([A-Z0-9]{12,22})/i,
    /([0-9]{16,22})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return undefined;
}

export function detectCategory(description: string): ParsedTransaction['category'] {
  const desc = description.toLowerCase();

  if (desc.includes('neft')) return 'neft';
  if (desc.includes('rtgs')) return 'rtgs';
  if (desc.includes('upi') || desc.includes('@ybl') || desc.includes('@oksbi')) return 'upi';
  if (desc.includes('imps')) return 'imps';
  if (desc.includes('cash')) return 'cash';
  if (desc.includes('cheque') || desc.includes('chq')) return 'cheque';

  return 'other';
}

// ── Main Parse Function ────────────────────────────────────────────────────────

export async function parseBankStatement(
  content: string,
  bankName?: string,
  accountNumber?: string
): Promise<BankStatementParseResult> {
  const result: BankStatementParseResult = {
    success: false,
    transactions: [],
    errors: [],
    warnings: [],
  };

  try {
    if (!content || content.trim().length === 0) {
      result.errors.push('Empty file content');
      return result;
    }

    // Detect bank from content if not provided
    const detectedBank = bankName?.toUpperCase() || detectBank(content);
    result.bankName = detectedBank;

    // Parse based on bank
    switch (detectedBank) {
      case 'HDFC':
        result.transactions = parseHDFCCSV(content);
        break;
      case 'ICICI':
        result.transactions = parseICICICSV(content);
        break;
      case 'SBI':
        result.transactions = parseSBICSV(content);
        break;
      default:
        result.warnings.push(`Unknown bank format, using generic parser`);
        result.transactions = parseGenericCSV(content);
    }

    result.accountNumber = accountNumber;
    result.success = result.transactions.length > 0;

    if (result.transactions.length === 0) {
      result.errors.push('No transactions found in file');
    }

    logger.info('[BankParser] Parsed statement', {
      bank: result.bankName,
      transactions: result.transactions.length,
    });
  } catch (err) {
    result.errors.push(`Parse error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    logger.error('[BankParser] Parse failed', { error: err });
  }

  return result;
}

function detectBank(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes('hdfc')) return 'HDFC';
  if (lower.includes('icici')) return 'ICICI';
  if (lower.includes('sbi') || lower.includes('state bank')) return 'SBI';
  if (lower.includes('axis')) return 'AXIS';
  if (lower.includes('kotak')) return 'KOTAK';
  return 'GENERIC';
}

// ── Auto-matching with ledger ──────────────────────────────────────────────────

export async function autoMatchTransactions(
  merchantId: string,
  transactions: ParsedTransaction[]
): Promise<ReconciliationMatch[]> {
  const matches: ReconciliationMatch[] = [];

  for (const txn of transactions) {
    const match = await findBestMatch(merchantId, txn);
    matches.push(match);
  }

  return matches;
}

async function findBestMatch(
  merchantId: string,
  txn: ParsedTransaction
): Promise<ReconciliationMatch> {
  const match: ReconciliationMatch = {
    transaction: txn,
    matchConfidence: 0,
    matchReason: 'No match found',
  };

  // Only match credits (money coming in - payments from suppliers)
  if (txn.transactionType !== 'credit' || !txn.credit) {
    match.matchReason = 'Not a credit transaction';
    return match;
  }

  // Try matching by UTR number
  if (txn.utrNumber) {
    const ledgerByUTR = await SupplierLedger.findOne({
      merchantId: new Types.ObjectId(merchantId),
      reference: { $regex: txn.utrNumber, $options: 'i' },
    });

    if (ledgerByUTR) {
      match.ledgerEntry = ledgerByUTR;
      match.matchConfidence = 100;
      match.matchReason = 'UTR number match';
      return match;
    }
  }

  // Try matching by reference
  if (txn.reference) {
    const ledgerByRef = await SupplierLedger.findOne({
      merchantId: new Types.ObjectId(merchantId),
      $or: [
        { reference: { $regex: txn.reference, $options: 'i' } },
        { transactionId: { $regex: txn.reference, $options: 'i' } },
      ],
    });

    if (ledgerByRef) {
      match.ledgerEntry = ledgerByRef;
      match.matchConfidence = 90;
      match.matchReason = 'Reference number match';
      return match;
    }
  }

  // Try matching by amount and date range (within 3 days)
  const amount = txn.credit;
  const fromDate = new Date(txn.date);
  fromDate.setDate(fromDate.getDate() - 3);
  const toDate = new Date(txn.date);
  toDate.setDate(toDate.getDate() + 3);

  const ledgerByAmount = await SupplierLedger.findOne({
    merchantId: new Types.ObjectId(merchantId),
    amount,
    createdAt: { $gte: fromDate, $lte: toDate },
    type: 'credit',
  }).populate('supplierId', 'name');

  if (ledgerByAmount) {
    match.ledgerEntry = ledgerByAmount;
    match.matchConfidence = 70;
    match.matchReason = 'Amount and date match (within 3 days)';
    return match;
  }

  // Try matching by PO number in description
  const poMatch = txn.description.match(/(?:po|po-|order)\s*[:\-]?\s*(\w{4,20})/i);
  if (poMatch) {
    const poNumber = poMatch[1].toUpperCase();
    const po = await PurchaseOrder.findOne({
      merchantId: new Types.ObjectId(merchantId),
      poNumber: { $regex: poNumber, $options: 'i' },
    });

    if (po) {
      match.purchaseOrder = po;
      match.matchConfidence = 80;
      match.matchReason = `PO number ${poNumber} found in description`;
      return match;
    }
  }

  // Fuzzy match by supplier name in description
  const suppliers = await Supplier.find({
    merchantId: new Types.ObjectId(merchantId),
    isDeleted: false,
  }).select('name');

  for (const supplier of suppliers) {
    if (supplier.name && txn.description.toLowerCase().includes(supplier.name.toLowerCase())) {
      const ledgerBySupplier = await SupplierLedger.findOne({
        merchantId: new Types.ObjectId(merchantId),
        supplierId: supplier._id,
        type: 'credit',
        amount,
      }).sort({ createdAt: -1 });

      if (ledgerBySupplier) {
        match.ledgerEntry = ledgerBySupplier;
        match.supplier = supplier;
        match.matchConfidence = 60;
        match.matchReason = `Supplier name "${supplier.name}" in description`;
        return match;
      }
    }
  }

  return match;
}

// ── Import transactions ────────────────────────────────────────────────────────

export async function importMatchedTransactions(
  merchantId: string,
  matches: ReconciliationMatch[]
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const result = { imported: 0, skipped: 0, errors: [] as string[] };

  for (const match of matches) {
    try {
      if (match.matchConfidence < 50) {
        result.skipped++;
        continue;
      }

      // Mark ledger entry as reconciled
      if (match.ledgerEntry) {
        (match.ledgerEntry as unknown).reconciledAt = new Date();
        (match.ledgerEntry as unknown).bankTransactionRef = match.transaction.reference;
        await match.ledgerEntry.save();
        result.imported++;
      } else if (match.purchaseOrder && match.transaction.credit) {
        // Create new ledger entry for unmatched PO payment
        await SupplierLedger.create({
          merchantId: new Types.ObjectId(merchantId),
          supplierId: match.purchaseOrder.supplierId,
          type: 'credit',
          amount: match.transaction.credit,
          balance: 0,
          reference: match.transaction.reference || `BANK-${Date.now()}`,
          description: `Bank statement import: ${match.transaction.description}`,
          transactionId: match.transaction.utrNumber || `IMP-${Date.now()}`,
          reconciledAt: new Date(),
        });
        result.imported++;
      } else {
        result.skipped++;
      }
    } catch (err) {
      result.errors.push(`Failed to import: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }

  return result;
}
