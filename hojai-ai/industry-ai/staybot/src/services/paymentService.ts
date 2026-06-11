/**
 * STAYBOT - Payment Service
 * Handles all payment-related operations including billing, invoices, and RABTUL integration
 */

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import logger from '../utils/logger';

// In-memory stores
const invoices: Map<string, any> = new Map();
const transactions: Map<string, any> = new Map();

// External service URLs
const RABTUL_WALLET_URL = process.env.RABTUL_WALLET_URL || 'http://localhost:4004';
const RABTUL_PAYMENT_URL = process.env.RABTUL_PAYMENT_URL || 'http://localhost:4003';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';

// Tax rates
const TAX_RATES = {
  gst: 0.18, // 18% GST
  tds: 0.10, // 10% TDS for certain payments
};

export interface Invoice {
  invoiceId: string;
  invoiceNumber: string;
  hotelId: string;
  guestId: string;
  guestName: string;
  bookingId?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxes: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: 'draft' | 'pending' | 'paid' | 'partial' | 'cancelled';
  paymentMethod?: 'upi' | 'card' | 'cash' | 'wallet' | 'corporate';
  dueDate: Date;
  createdAt: Date;
  paidAt?: Date;
}

export interface InvoiceItem {
  itemId: string;
  description: string;
  category: 'room' | 'food' | 'beverage' | 'spa' | 'parking' | 'laundry' | 'minibar' | 'other';
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Transaction {
  transactionId: string;
  invoiceId: string;
  amount: number;
  type: 'charge' | 'payment' | 'refund' | 'adjustment';
  method: 'upi' | 'card' | 'cash' | 'wallet' | 'corporate';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference?: string;
  gatewayTransactionId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class PaymentService {
  /**
   * Create an invoice for a guest
   */
  async createInvoice(data: {
    hotelId: string;
    guestId: string;
    guestName: string;
    bookingId?: string;
    items: Omit<InvoiceItem, 'itemId'>[];
    dueDate?: Date;
  }): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
    try {
      const invoiceId = `INV-${Date.now().toString(36).toUpperCase()}`;
      const invoiceNumber = `INV-${new Date().getFullYear()}-${invoiceId.slice(-8).toUpperCase()}`;

      // Add item IDs
      const items: InvoiceItem[] = data.items.map((item) => ({
        ...item,
        itemId: `ITEM-${uuidv4().slice(0, 8)}`,
      }));

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxes = subtotal * TAX_RATES.gst;
      const total = subtotal + taxes;

      const invoice: Invoice = {
        invoiceId,
        invoiceNumber,
        hotelId: data.hotelId,
        guestId: data.guestId,
        guestName: data.guestName,
        bookingId: data.bookingId,
        items,
        subtotal,
        taxes,
        total,
        amountPaid: 0,
        amountDue: total,
        status: 'pending',
        dueDate: data.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
      };

      invoices.set(invoiceId, invoice);

      logger.info(`Invoice created: ${invoiceId}`, {
        invoiceId,
        guestId: data.guestId,
        total,
      });

      return { success: true, invoice };
    } catch (error: any) {
      logger.error(`Invoice creation failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    return invoices.get(invoiceId) || null;
  }

  /**
   * Get invoices by guest
   */
  async getInvoicesByGuest(guestId: string): Promise<Invoice[]> {
    return Array.from(invoices.values())
      .filter((inv) => inv.guestId === guestId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Add item to invoice
   */
  async addInvoiceItem(
    invoiceId: string,
    item: Omit<InvoiceItem, 'itemId'>
  ): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
    const invoice = invoices.get(invoiceId);
    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    const newItem: InvoiceItem = {
      ...item,
      itemId: `ITEM-${uuidv4().slice(0, 8)}`,
    };

    invoice.items.push(newItem);

    // Recalculate totals
    invoice.subtotal = invoice.items.reduce((sum, i) => sum + i.total, 0);
    invoice.taxes = invoice.subtotal * TAX_RATES.gst;
    invoice.total = invoice.subtotal + invoice.taxes;
    invoice.amountDue = invoice.total - invoice.amountPaid;

    invoices.set(invoiceId, invoice);

    logger.info(`Item added to invoice: ${invoiceId}`, {
      invoiceId,
      itemId: newItem.itemId,
      itemTotal: newItem.total,
    });

    return { success: true, invoice };
  }

  /**
   * Process payment for an invoice
   */
  async processPayment(
    invoiceId: string,
    amount: number,
    method: Transaction['method'],
    reference?: string
  ): Promise<{ success: boolean; transaction?: Transaction; invoice?: Invoice; error?: string }> {
    try {
      const invoice = invoices.get(invoiceId);
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.status === 'paid') {
        return { success: false, error: 'Invoice already paid' };
      }

      // Create transaction
      const transactionId = `TXN-${Date.now().toString(36).toUpperCase()}`;
      const transaction: Transaction = {
        transactionId,
        invoiceId,
        amount,
        type: 'payment',
        method,
        status: 'pending',
        reference,
        createdAt: new Date(),
      };

      // Process via RABTUL
      if (method === 'upi' || method === 'card' || method === 'wallet') {
        try {
          const response = await axios.post(
            `${RABTUL_PAYMENT_URL}/api/payments/create`,
            {
              amount,
              currency: 'INR',
              method,
              reference: invoiceId,
              metadata: { invoiceId, guestId: invoice.guestId },
            },
            { headers: { 'X-Internal-Token': INTERNAL_TOKEN } }
          );

          transaction.gatewayTransactionId = response.data?.transactionId;
          transaction.status = 'completed';
          transaction.completedAt = new Date();
        } catch (paymentError: any) {
          transaction.status = 'failed';
          logger.error(`Payment processing failed: ${paymentError.message}`);
          return {
            success: false,
            error: `Payment processing failed: ${paymentError.message}`,
          };
        }
      } else {
        // Cash or corporate - mark as completed
        transaction.status = 'completed';
        transaction.completedAt = new Date();
      }

      transactions.set(transactionId, transaction);

      // Update invoice
      invoice.amountPaid += amount;
      invoice.amountDue = invoice.total - invoice.amountPaid;

      if (invoice.amountPaid >= invoice.total) {
        invoice.status = 'paid';
        invoice.paidAt = new Date();
      } else {
        invoice.status = 'partial';
      }

      invoices.set(invoiceId, invoice);

      logger.info(`Payment processed: ${transactionId}`, {
        transactionId,
        invoiceId,
        amount,
        method,
        newStatus: invoice.status,
      });

      return { success: true, transaction, invoice };
    } catch (error: any) {
      logger.error(`Payment processing failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process refund
   */
  async processRefund(
    invoiceId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
    try {
      const invoice = invoices.get(invoiceId);
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      const transactionId = `TXN-${Date.now().toString(36).toUpperCase()}`;
      const transaction: Transaction = {
        transactionId,
        invoiceId,
        amount,
        type: 'refund',
        method: 'wallet', // Refunds go to wallet
        status: 'pending',
        reference: reason,
        createdAt: new Date(),
      };

      // Process via RABTUL
      try {
        await axios.post(
          `${RABTUL_WALLET_URL}/api/wallet/refund`,
          {
            userId: invoice.guestId,
            amount,
            reason,
            metadata: { invoiceId, transactionId },
          },
          { headers: { 'X-Internal-Token': INTERNAL_TOKEN } }
        );

        transaction.status = 'completed';
        transaction.completedAt = new Date();
      } catch (refundError: any) {
        transaction.status = 'failed';
        logger.error(`Refund processing failed: ${refundError.message}`);
        return {
          success: false,
          error: `Refund processing failed: ${refundError.message}`,
        };
      }

      transactions.set(transactionId, transaction);

      // Update invoice
      invoice.amountPaid -= amount;
      invoice.amountDue = invoice.total - invoice.amountPaid;
      invoice.status = invoice.amountPaid <= 0 ? 'pending' : 'partial';

      invoices.set(invoiceId, invoice);

      logger.info(`Refund processed: ${transactionId}`, {
        transactionId,
        invoiceId,
        amount,
        reason,
      });

      return { success: true, transaction };
    } catch (error: any) {
      logger.error(`Refund processing failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<Transaction | null> {
    return transactions.get(transactionId) || null;
  }

  /**
   * Get transactions by invoice
   */
  async getTransactionsByInvoice(invoiceId: string): Promise<Transaction[]> {
    return Array.from(transactions.values())
      .filter((t) => t.invoiceId === invoiceId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get payment summary for hotel
   */
  async getPaymentSummary(hotelId: string, dateRange?: { start: Date; end: Date }): Promise<{
    totalRevenue: number;
    totalCollected: number;
    totalPending: number;
    totalRefunded: number;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    let hotelInvoices = Array.from(invoices.values()).filter(
      (inv) => inv.hotelId === hotelId
    );

    if (dateRange) {
      hotelInvoices = hotelInvoices.filter(
        (inv) =>
          inv.createdAt >= dateRange.start && inv.createdAt <= dateRange.end
      );
    }

    const totalRevenue = hotelInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalCollected = hotelInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const totalPending = hotelInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);

    const hotelTransactions = Array.from(transactions.values()).filter(
      (t) => hotelInvoices.some((inv) => inv.invoiceId === t.invoiceId)
    );
    const totalRefunded = hotelTransactions
      .filter((t) => t.type === 'refund' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const byMethod: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    hotelTransactions
      .filter((t) => t.type === 'payment' && t.status === 'completed')
      .forEach((t) => {
        byMethod[t.method] = (byMethod[t.method] || 0) + t.amount;
      });

    hotelInvoices.forEach((inv) => {
      byStatus[inv.status] = (byStatus[inv.status] || 0) + 1;
    });

    return {
      totalRevenue,
      totalCollected,
      totalPending,
      totalRefunded,
      byMethod,
      byStatus,
    };
  }

  /**
   * Generate bill summary for checkout
   */
  async generateBillSummary(guestId: string): Promise<{
    guestName: string;
    nights: number;
    roomCharges: number;
    services: number;
    taxes: number;
    total: number;
    paid: number;
    balance: number;
    breakdown: InvoiceItem[];
  } | null> {
    const guestInvoices = await this.getInvoicesByGuest(guestId);
    if (guestInvoices.length === 0) {
      return null;
    }

    const latestInvoice = guestInvoices[0];
    const roomItems = latestInvoice.items.filter((i) => i.category === 'room');
    const serviceItems = latestInvoice.items.filter(
      (i) => i.category !== 'room'
    );

    const roomCharges = roomItems.reduce((sum, i) => sum + i.total, 0);
    const services = serviceItems.reduce((sum, i) => sum + i.total, 0);

    return {
      guestName: latestInvoice.guestName,
      nights: roomItems.length > 0 ? roomItems[0].quantity : 0,
      roomCharges,
      services,
      taxes: latestInvoice.taxes,
      total: latestInvoice.total,
      paid: latestInvoice.amountPaid,
      balance: latestInvoice.amountDue,
      breakdown: latestInvoice.items,
    };
  }
}

export const paymentService = new PaymentService();
export default PaymentService;
