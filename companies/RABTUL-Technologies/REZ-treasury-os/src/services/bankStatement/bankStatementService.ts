/**
 * TreasuryOS - Bank Statement Import Service
 * Parse PDF/CSV bank statements and import transactions
 */

import { v4 as uuidv4 } from 'uuid';
import { CashTransaction, TreasuryAccount } from '../models';

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category?: string;
  reference?: string;
  balance?: number;
}

export interface BankStatementResult {
  accountId: string;
  fileName: string;
  fileType: 'pdf' | 'csv';
  period: { start: Date; end: Date };
  transactions: ParsedTransaction[];
  summary: {
    totalCredits: number;
    totalDebits: number;
    netFlow: number;
    openingBalance: number;
    closingBalance: number;
    transactionCount: number;
  };
  imported: number;
  duplicates: number;
  errors: string[];
}

export interface BankStatementConfig {
  bankName: string;
  accountNumber: string;
  dateFormat: string;
  amountFormat: {
    decimalSeparator: '.' | ',';
    thousandsSeparator: ',' | '.' | ' ';
  };
  columns: {
    date: number;
    description: number;
    amount: number;
    balance?: number;
    reference?: number;
    debitColumn?: number;
    creditColumn?: number;
  };
  skipRows?: number;
  dateRegex?: RegExp;
  amountRegex?: RegExp;
}

/**
 * Supported bank formats
 */
const BANK_FORMATS: Record<string, BankStatementConfig> = {
  'hdfc': {
    bankName: 'HDFC Bank',
    accountNumber: '',
    dateFormat: 'DD/MM/YYYY',
    amountFormat: { decimalSeparator: '.', thousandsSeparator: ',' },
    columns: { date: 0, description: 1, debit: 2, credit: 3, balance: 4 },
    skipRows: 1,
  },
  'icici': {
    bankName: 'ICICI Bank',
    accountNumber: '',
    dateFormat: 'DD-MM-YYYY',
    amountFormat: { decimalSeparator: '.', thousandsSeparator: ',', debitColumn: 2, creditColumn: 3, date: 0, description: 1, balance: 4 },
    skipRows: 1,
  },
  'sbi': {
    bankName: 'State Bank of India',
    accountNumber: '',
    dateFormat: 'DD/MM/YYYY',
    amountFormat: { decimalSeparator: '.', thousandsSeparator: ',', date: 0, description: 2, amount: 3, balance: 4 },
    skipRows: 2,
  },
  'axis': {
    bankName: 'Axis Bank',
    accountNumber: '',
    dateFormat: 'DD/MM/YYYY',
    amountFormat: { decimalSeparator: '.', thousandsSeparator: ',', date: 0, description: 1, debitColumn: 2, creditColumn: 3, balance: 4 },
    skipRows: 1,
  },
  'yesbank': {
    bankName: 'Yes Bank',
    accountNumber: '',
    dateFormat: 'DD/MM/YYYY',
    amountFormat: { decimalSeparator: '.', thousandsSeparator: ',', date: 0, description: 1, amount: 2, balance: 3 },
    skipRows: 1,
  },
  'generic': {
    bankName: 'Generic',
    accountNumber: '',
    dateFormat: 'YYYY-MM-DD',
    amountFormat: { decimalSeparator: '.', thousandsSeparator: ',' },
    columns: { date: 0, description: 1, amount: 2 },
    skipRows: 0,
  },
};

/**
 * Category keywords for auto-categorization
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  salary: ['salary', 'sal', 'wages', 'payroll', 'honorarium'],
  transfer: ['transfer', 'neft', 'rtgs', 'imps', 'upi', 'bank transfer'],
  payment: ['payment', 'pay', 'bill', 'invoice'],
  purchase: ['purchase', 'buy', 'shopping', 'amazon', 'flipkart', 'swiggy', 'zomato'],
  subscription: ['subscription', 'netflix', 'spotify', 'subscription', 'membership'],
  utility: ['electricity', 'water', 'gas', 'phone', 'internet', 'broadband'],
  rent: ['rent', 'lease', 'premises'],
  interest: ['interest', 'fd', 'deposit', 'maturity'],
  refund: ['refund', 'reversal', 'return'],
  fee: ['fee', 'charge', 'bank charge', 'processing fee'],
  dividend: ['dividend', 'bonus', 'profit'],
};

export class BankStatementService {
  /**
   * Parse CSV bank statement
   */
  parseCSV(content: string, bankType: string = 'generic'): ParsedTransaction[] {
    const config = BANK_FORMATS[bankType] || BANK_FORMATS['generic'];
    const lines = content.split('\n').filter(line => line.trim());
    const transactions: ParsedTransaction[] = [];

    const skipRows = config.skipRows || 0;
    const dataLines = lines.slice(skipRows);

    for (const line of dataLines) {
      try {
        const transaction = this.parseCSVLine(line, config);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        // Skip invalid lines
        console.error('Failed to parse line:', error);
      }
    }

    return transactions;
  }

  /**
   * Parse a single CSV line
   */
  private parseCSVLine(line: string, config: BankStatementConfig): ParsedTransaction | null {
    // Handle quoted fields with commas
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());

    // Extract date
    const dateStr = fields[config.columns.date];
    const date = this.parseDate(dateStr);
    if (!date) return null;

    // Extract description
    const description = fields[config.columns.description] || '';

    // Extract amount (either single column or separate debit/credit)
    let amount = 0;
    let type: 'credit' | 'debit' = 'credit';

    if (config.columns.creditColumn !== undefined) {
      // Separate debit and credit columns
      const creditStr = fields[config.columns.creditColumn] || '';
      const debitStr = fields[config.columns.debitColumn!] || '';

      const creditAmount = this.parseAmount(creditStr, config.amountFormat);
      const debitAmount = this.parseAmount(debitStr, config.amountFormat);

      if (creditAmount > 0) {
        amount = creditAmount;
        type = 'credit';
      } else if (debitAmount > 0) {
        amount = debitAmount;
        type = 'debit';
      } else {
        return null; // No transaction
      }
    } else {
      // Single amount column
      const amountStr = fields[config.columns.amount];
      amount = this.parseAmount(amountStr, config.amountFormat);
      if (amount === 0) return null;
      type = amount > 0 ? 'credit' : 'debit';
      amount = Math.abs(amount);
    }

    // Extract optional fields
    const balance = config.columns.balance !== undefined
      ? this.parseAmount(fields[config.columns.balance], config.amountFormat)
      : undefined;

    const reference = config.columns.reference !== undefined
      ? fields[config.columns.reference]
      : undefined;

    // Auto-categorize
    const category = this.categorize(description);

    return {
      date,
      description,
      amount,
      type,
      category,
      reference,
      balance,
    };
  }

  /**
   * Parse date string to Date object
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Clean the string
    const cleaned = dateStr.trim().replace(/"/g, '');

    // Try various formats
    const formats = [
      // DD/MM/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // DD-MM-YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      // YYYY-MM-DD (ISO)
      /^(\d{4})-(\d{2})-(\d{2})$/,
      // MM/DD/YYYY (US format)
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    ];

    // Try ISO format first
    const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const date = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
      if (!isNaN(date.getTime())) return date;
    }

    // Try DD/MM/YYYY
    const dmMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmMatch) {
      const day = parseInt(dmMatch[1]);
      const month = parseInt(dmMatch[2]) - 1;
      const year = parseInt(dmMatch[3]);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }

    // Fallback: try native parsing
    const fallback = new Date(cleaned);
    if (!isNaN(fallback.getTime())) return fallback;

    return null;
  }

  /**
   * Parse amount string to number
   */
  private parseAmount(amountStr: string, format: BankStatementConfig['amountFormat']): number {
    if (!amountStr) return 0;

    // Clean the string
    let cleaned = amountStr.trim()
      .replace(/[₹$€£]/g, '')
      .replace(/[()]/g, '-')
      .replace(/"/g, '')
      .trim();

    if (!cleaned || cleaned === '-' || cleaned === '') return 0;

    // Handle CR/DR indicators
    const isNegative = cleaned.startsWith('-') || cleaned.startsWith('DR');
    if (cleaned.startsWith('DR') || cleaned.startsWith('CR')) {
      cleaned = cleaned.substring(2).trim();
    }

    // Remove thousands separator and handle decimal
    const { decimalSeparator, thousandsSeparator } = format;
    cleaned = cleaned.split(thousandsSeparator).join('');
    cleaned = cleaned.replace(decimalSeparator, '.');

    const amount = parseFloat(cleaned);
    if (isNaN(amount)) return 0;

    return isNegative ? -Math.abs(amount) : Math.abs(amount);
  }

  /**
   * Auto-categorize transaction based on description
   */
  private categorize(description: string): string {
    const lowerDesc = description.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerDesc.includes(keyword)) {
          return category;
        }
      }
    }

    return 'other';
  }

  /**
   * Import transactions from bank statement
   */
  async importTransactions(
    accountId: string,
    transactions: ParsedTransaction[]
  ): Promise<{ imported: number; duplicates: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;
    let duplicates = 0;

    for (const txn of transactions) {
      try {
        // Check for duplicate (same date, amount, description)
        const existing = await CashTransaction.findOne({
          accountId,
          createdAt: {
            $gte: new Date(txn.date.getTime() - 24 * 60 * 60 * 1000),
            $lte: new Date(txn.date.getTime() + 24 * 60 * 60 * 1000),
          },
          amount: txn.amount,
          description: txn.description,
        });

        if (existing) {
          duplicates++;
          continue;
        }

        // Create transaction
        const transaction = new CashTransaction({
          transactionId: `bs_${uuidv4()}`,
          accountId,
          businessId: (await TreasuryAccount.findOne({ accountId }))?.businessId || '',
          type: txn.type === 'credit' ? 'deposit' : 'withdrawal',
          category: txn.type === 'credit' ? 'inflow' : 'outflow',
          amount: txn.amount,
          currency: 'INR',
          balanceBefore: txn.balance || 0,
          balanceAfter: txn.balance || txn.amount,
          reference: txn.reference,
          referenceType: 'bank_statement',
          description: `[Bank Statement] ${txn.description}${txn.category ? ` (${txn.category})` : ''}`,
          metadata: {
            importDate: new Date(),
            originalCategory: txn.category,
          },
          createdAt: txn.date,
        });

        await transaction.save();
        imported++;
      } catch (error) {
        errors.push(`Failed to import transaction: ${txn.description} - ${(error as Error).message}`);
      }
    }

    return { imported, duplicates, errors };
  }

  /**
   * Process bank statement file
   */
  async processBankStatement(
    accountId: string,
    fileContent: string,
    fileName: string,
    bankType: string = 'generic'
  ): Promise<BankStatementResult> {
    const fileType = fileName.toLowerCase().endsWith('.csv') ? 'csv' as const : 'pdf' as const;

    // Parse transactions
    const transactions = this.parseCSV(fileContent, bankType);

    if (transactions.length === 0) {
      return {
        accountId,
        fileName,
        fileType,
        period: { start: new Date(), end: new Date() },
        transactions: [],
        summary: {
          totalCredits: 0,
          totalDebits: 0,
          netFlow: 0,
          openingBalance: 0,
          closingBalance: 0,
          transactionCount: 0,
        },
        imported: 0,
        duplicates: 0,
        errors: ['No valid transactions found in file'],
      };
    }

    // Calculate summary
    const totalCredits = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDebits = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const firstTxn = transactions[0];
    const lastTxn = transactions[transactions.length - 1];

    // Import transactions
    const importResult = await this.importTransactions(accountId, transactions);

    return {
      accountId,
      fileName,
      fileType,
      period: {
        start: firstTxn.date,
        end: lastTxn.date,
      },
      transactions,
      summary: {
        totalCredits,
        totalDebits,
        netFlow: totalCredits - totalDebits,
        openingBalance: firstTxn.balance || 0,
        closingBalance: lastTxn.balance || 0,
        transactionCount: transactions.length,
      },
      ...importResult,
    };
  }

  /**
   * Get supported bank formats
   */
  getSupportedBanks(): Array<{ code: string; name: string }> {
    return Object.entries(BANK_FORMATS).map(([code, config]) => ({
      code,
      name: config.bankName,
    }));
  }
}

export const bankStatementService = new BankStatementService();
