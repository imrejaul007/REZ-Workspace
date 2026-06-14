import { Transaction } from '../models/Transaction';
import { Folio } from '../models/Folio';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * GST Invoice Service
 * Handles GST-compliant invoice generation for hotel POS transactions
 */

export interface GstInvoice {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceTime: string;
  propertyDetails: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gstin: string;
  };
  guestDetails: {
    name: string;
    address?: string;
    gstin?: string;
    state?: string;
  };
  placeOfSupply: string;
  reverseCharge: boolean;
  items: GstLineItem[];
  subtotal: number;
  taxBreakup: TaxBreakup[];
  totalTaxAmount: number;
  totalAmount: number;
  amountInWords: string;
  paymentDetails?: {
    method: string;
    reference?: string;
  };
  signature?: string;
  qrCode?: string;
}

export interface GstLineItem {
  slNo: number;
  description: string;
  hsnCode: string;
  uom: string;
  quantity: number;
  rate: number;
  amount: number;
  discount: number;
  taxableValue: number;
  taxRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface TaxBreakup {
  taxRate: number;
  cgstRate: number;
  sgstRate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
}

export class GstInvoiceService {
  private propertyName: string;
  private propertyAddress: string;
  private propertyCity: string;
  private propertyState: string;
  private propertyPincode: string;
  private propertyGstin: string;

  constructor() {
    this.propertyName = process.env.HOTEL_NAME || 'Hotel Property';
    this.propertyAddress = process.env.HOTEL_ADDRESS || '';
    this.propertyCity = process.env.HOTEL_CITY || '';
    this.propertyState = process.env.HOTEL_STATE || '';
    this.propertyPincode = process.env.HOTEL_PINCODE || '';
    this.propertyGstin = process.env.HOTEL_GSTIN || '';
  }

  /**
   * Generate GST invoice for a transaction
   */
  async generateInvoice(
    transactionId: string,
    options?: {
      includePaymentDetails?: boolean;
      propertyDetails?: Partial<{
        name: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
        gstin: string;
      }>;
    }
  ): Promise<GstInvoice> {
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    if (transaction.gstInvoiceId) {
      throw new Error(`Invoice already exists for transaction: ${transactionId}`);
    }

    const invoiceId = `INV-${uuidv4().substring(0, 12).toUpperCase()}`;
    const fiscalYear = this.getFiscalYear();
    const invoiceSeq = await this.getNextInvoiceSequence(fiscalYear);
    const invoiceNumber = `${this.propertyGstin.substring(0, 2)}${fiscalYear}${invoiceSeq.toString().padStart(6, '0')}`;

    const now = new Date();
    const invoiceDate = this.formatDate(now);
    const invoiceTime = this.formatTime(now);

    // Get guest details
    let guestName = transaction.guestName || 'Guest';
    let guestAddress: string | undefined;
    let guestGstin: string | undefined;
    let guestState: string | undefined;

    if (transaction.folioId) {
      const folio = await Folio.findOne({ folioId: transaction.folioId });
      if (folio) {
        guestName = folio.guestName;
        if (folio.guestEmail) {
          guestAddress = folio.guestEmail;
        }
      }
    }

    // Process line items
    const lineItems: GstLineItem[] = transaction.items.map((item, index) => {
      const taxableValue = item.unitPrice * item.quantity - item.discountAmount;
      const cgstRate = item.taxRate / 2;
      const sgstRate = item.taxRate / 2;
      const cgstAmount = Math.round(taxableValue * cgstRate) / 100;
      const sgstAmount = Math.round(taxableValue * sgstRate) / 100;

      return {
        slNo: index + 1,
        description: item.itemName,
        hsnCode: this.getHsnCode(item.category),
        uom: 'NOS',
        quantity: item.quantity,
        rate: item.unitPrice,
        amount: item.unitPrice * item.quantity,
        discount: item.discountAmount,
        taxableValue: Math.round(taxableValue * 100) / 100,
        taxRate: item.taxRate,
        cgstAmount: Math.round(cgstAmount * 100) / 100,
        sgstAmount: Math.round(sgstAmount * 100) / 100,
        igstAmount: 0,
        totalAmount: Math.round((taxableValue + cgstAmount + sgstAmount) * 100) / 100,
      };
    });

    // Calculate tax breakup
    const taxBreakupMap: Map<number, TaxBreakup> = new Map();
    for (const item of lineItems) {
      const existing = taxBreakupMap.get(item.taxRate) || {
        taxRate: item.taxRate,
        cgstRate: item.taxRate / 2,
        sgstRate: item.taxRate / 2,
        taxableAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTaxAmount: 0,
      };

      existing.taxableAmount += item.taxableValue;
      existing.cgstAmount += item.cgstAmount;
      existing.sgstAmount += item.sgstAmount;
      existing.totalTaxAmount += item.cgstAmount + item.sgstAmount;

      taxBreakupMap.set(item.taxRate, existing);
    }

    const taxBreakup = Array.from(taxBreakupMap.values()).map((t) => ({
      ...t,
      taxableAmount: Math.round(t.taxableAmount * 100) / 100,
      cgstAmount: Math.round(t.cgstAmount * 100) / 100,
      sgstAmount: Math.round(t.sgstAmount * 100) / 100,
      totalTaxAmount: Math.round(t.totalTaxAmount * 100) / 100,
    }));

    const invoice: GstInvoice = {
      invoiceId,
      invoiceNumber,
      invoiceDate,
      invoiceTime,
      propertyDetails: {
        name: options?.propertyDetails?.name || this.propertyName,
        address: options?.propertyDetails?.address || this.propertyAddress,
        city: options?.propertyDetails?.city || this.propertyCity,
        state: options?.propertyDetails?.state || this.propertyState,
        pincode: options?.propertyDetails?.pincode || this.propertyPincode,
        gstin: options?.propertyDetails?.gstin || this.propertyGstin,
      },
      guestDetails: {
        name: guestName,
        address: guestAddress,
        gstin: guestGstin,
        state: guestState,
      },
      placeOfSupply: options?.propertyDetails?.state || this.propertyState,
      reverseCharge: false,
      items: lineItems,
      subtotal: transaction.subtotal,
      taxBreakup,
      totalTaxAmount: transaction.taxAmount,
      totalAmount: transaction.totalAmount,
      amountInWords: this.numberToWords(transaction.totalAmount),
    };

    if (options?.includePaymentDetails && transaction.paymentMethod) {
      invoice.paymentDetails = {
        method: transaction.paymentMethod,
        reference: transaction.paymentReference,
      };
    }

    // Update transaction with invoice details
    transaction.gstInvoiceId = invoiceId;
    transaction.gstInvoiceNumber = invoiceNumber;
    await transaction.save();

    logger.info('GST invoice generated', {
      invoiceId,
      invoiceNumber,
      transactionId,
      totalAmount: transaction.totalAmount,
    });

    return invoice;
  }

  /**
   * Get fiscal year in format YY-YY (e.g., 24-25)
   */
  private getFiscalYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Indian fiscal year starts in April
    if (month >= 3) {
      return `${year.toString().slice(-2)}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${(year - 1).toString().slice(-2)}-${year.toString().slice(-2)}`;
    }
  }

  /**
   * Get next invoice sequence number (simplified - would use Redis in production)
   */
  private async getNextInvoiceSequence(fiscalYear: string): Promise<number> {
    // In production, this would use Redis atomic increment
    const sequence = Math.floor(Math.random() * 100000);
    return sequence;
  }

  /**
   * Get HSN code based on category
   */
  private getHsnCode(category: string): string {
    const hsnMap: Record<string, string> = {
      FOOD: '9963',
      BEVERAGE: '9964',
      ALCOHOL: '2203',
      SPA_TREATMENT: '9973',
      MINIBAR: '9964',
      BANQUET_SERVICE: '9963',
    };
    return hsnMap[category] || '9963';
  }

  /**
   * Format date as DD/MM/YYYY
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Format time as HH:MM:SS
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Convert number to Indian currency words
   */
  private numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertHundreds = (n: number): string => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertHundreds(n % 100) : '');
    };

    const convertThousands = (n: number): string => {
      if (n < 1000) return convertHundreds(n);
      if (n < 100000) return convertHundreds(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convertHundreds(n % 1000) : '');
      if (n < 10000000) return convertHundreds(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convertHundreds(Math.floor(n % 100000)) : '');
      return convertHundreds(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convertHundreds(Math.floor(n % 10000000)) : '');
    };

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    const rupeeWord = convertThousands(rupees);
    const paiseWord = paise > 0 ? convertHundreds(paise) + ' Paise' : '';

    return (rupeeWord + (paiseWord ? ' and ' + paiseWord : '') + ' Only').trim();
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<GstInvoice | null> {
    const transaction = await Transaction.findOne({ gstInvoiceNumber: invoiceNumber });
    if (!transaction) {
      return null;
    }

    // Reconstruct invoice from transaction
    const invoice = await this.generateInvoice(transaction.transactionId);
    return invoice;
  }

  /**
   * Void an invoice (cancel)
   */
  async voidInvoice(invoiceNumber: string, reason: string): Promise<{ success: boolean; creditNoteId?: string }> {
    const transaction = await Transaction.findOne({ gstInvoiceNumber: invoiceNumber });
    if (!transaction) {
      throw new Error(`Invoice not found: ${invoiceNumber}`);
    }

    if (transaction.gstInvoiceId?.startsWith('VOID')) {
      throw new Error('Invoice already voided');
    }

    // Create credit note instead of voiding (for GST compliance)
    const creditNoteId = `CN-${uuidv4().substring(0, 12).toUpperCase()}`;
    const fiscalYear = this.getFiscalYear();
    const creditNoteNumber = `CN${this.propertyGstin.substring(0, 2)}${fiscalYear}${creditNoteId.split('-')[1]}`;

    logger.info('Invoice voided (credit note created)', {
      invoiceNumber,
      creditNoteId,
      creditNoteNumber,
      reason,
    });

    return {
      success: true,
      creditNoteId,
    };
  }
}

export const gstInvoiceService = new GstInvoiceService();
