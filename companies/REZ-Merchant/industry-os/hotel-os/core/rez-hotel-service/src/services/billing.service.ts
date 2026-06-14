/**
 * Billing Service
 *
 * Business logic for guest billing and invoicing
 */

import { Booking } from '../models/Booking';
import { Guest } from '../models/Guest';
import { logger } from '../config/logger';
import axios from 'axios';

const log = (msg: string, meta?) => logger.info(`[billing-service] ${msg}`, meta);

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001';
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:4002';

export interface BillingItem {
  description: string;
  category: 'room' | 'food' | 'minibar' | 'laundry' | 'spa' | 'transport' | 'other' | 'discount' | 'tax' | 'fee';
  amount: number;
  quantity: number;
  unitPrice: number;
  date: Date;
}

export interface Invoice {
  invoiceId: string;
  bookingId: string;
  guestId: string;
  hotelId: string;
  items: BillingItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  currency: string;
  status: 'pending' | 'partial' | 'paid' | 'refunded';
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

function generateInvoiceId(): string {
  try {
    const { randomUUID } = require('crypto');
    const uuid = randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
    return `INV${Date.now().toString(36)}${uuid}`;
  } catch {
    return 'INV' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
}

class BillingService {
  /**
   * Generate invoice for a booking
   */
  async generateInvoice(bookingId: string): Promise<Invoice | null> {
    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      log('Booking not found for invoice generation', { bookingId });
      return null;
    }

    const invoiceId = generateInvoiceId();
    const guest = await Guest.findOne({ guestId: booking.guestId });

    // Create room charge items
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    const items: BillingItem[] = [
      {
        description: `Room charges (${nights} night${nights > 1 ? 's' : ''})`,
        category: 'room',
        amount: booking.totalAmount,
        quantity: nights,
        unitPrice: booking.totalAmount / nights,
        date: new Date(),
      },
      {
        description: 'Taxes & Fees',
        category: 'tax',
        amount: Math.round(booking.totalAmount * 0.18 * 100) / 100, // 18% GST
        quantity: 1,
        unitPrice: Math.round(booking.totalAmount * 0.18 * 100) / 100,
        date: new Date(),
      },
    ];

    const subtotal = booking.totalAmount;
    const taxAmount = items.find(i => i.category === 'tax')?.amount || 0;
    const totalAmount = subtotal + taxAmount;

    const invoice: Invoice = {
      invoiceId,
      bookingId: booking.bookingId,
      guestId: booking.guestId,
      hotelId: booking.hotelId,
      items,
      subtotal,
      taxAmount,
      discountAmount: 0,
      totalAmount,
      paidAmount: booking.paidAmount,
      pendingAmount: totalAmount - booking.paidAmount,
      currency: booking.currency,
      status: booking.paidAmount >= totalAmount ? 'paid' : booking.paidAmount > 0 ? 'partial' : 'pending',
      dueDate: checkOut,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    log('Invoice generated', { invoiceId, bookingId, totalAmount });
    return invoice;
  }

  /**
   * Add billing item to booking
   */
  async addBillingItem(
    bookingId: string,
    item: Omit<BillingItem, 'date'>
  ): Promise<Invoice | null> {
    // For now, we'll just log this - in production, you'd store these in a separate billing collection
    log('Billing item added', { bookingId, description: item.description, amount: item.amount });

    // Return updated invoice
    return this.generateInvoice(bookingId);
  }

  /**
   * Process payment for invoice
   */
  async processPayment(
    bookingId: string,
    amount: number,
    method: 'card' | 'cash' | 'upi' | 'wallet' | 'bank_transfer',
    transactionId?: string
  ): Promise<{
    success: boolean;
    invoice?: Invoice;
    transactionId?: string;
    error?: string;
  }> {
    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    try {
      // Call payment service
      const paymentResponse = await axios.post(
        `${PAYMENT_SERVICE_URL}/api/payments/create`,
        {
          bookingId,
          guestId: booking.guestId,
          hotelId: booking.hotelId,
          amount,
          currency: booking.currency,
          method,
          type: 'hotel_billing',
        },
        { timeout: 10000 }
      );

      const paymentTxId = paymentResponse.data?.transactionId || transactionId;

      // Update booking payment
      const newPaidAmount = booking.paidAmount + amount;
      const invoice = await this.generateInvoice(bookingId);

      if (!invoice) {
        return { success: false, error: 'Failed to generate invoice' };
      }

      // Update booking
      await Booking.findOneAndUpdate(
        { bookingId },
        {
          $set: {
            paidAmount: newPaidAmount,
            paymentStatus: newPaidAmount >= invoice.totalAmount ? 'paid' : 'partial',
          },
        }
      );

      // Update invoice status
      invoice.paidAmount = newPaidAmount;
      invoice.pendingAmount = invoice.totalAmount - newPaidAmount;
      invoice.status = newPaidAmount >= invoice.totalAmount ? 'paid' : 'partial';
      if (newPaidAmount >= invoice.totalAmount) {
        invoice.paidAt = new Date();
      }
      invoice.updatedAt = new Date();

      log('Payment processed', { bookingId, amount, paymentTxId, newPaidAmount });

      return {
        success: true,
        invoice,
        transactionId: paymentTxId,
      };
    } catch (error) {
      log('Payment processing failed', { bookingId, amount, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  /**
   * Process refund
   */
  async processRefund(
    bookingId: string,
    amount: number,
    reason: string
  ): Promise<{
    success: boolean;
    refundId?: string;
    error?: string;
  }> {
    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    if (amount > booking.paidAmount) {
      return { success: false, error: 'Refund amount exceeds paid amount' };
    }

    try {
      // Call payment service for refund
      const refundResponse = await axios.post(
        `${PAYMENT_SERVICE_URL}/api/payments/refund`,
        {
          bookingId,
          amount,
          reason,
          originalPaymentMethod: 'card',
        },
        { timeout: 10000 }
      );

      const refundId = refundResponse.data?.refundId;

      // Update booking
      const newPaidAmount = booking.paidAmount - amount;
      await Booking.findOneAndUpdate(
        { bookingId },
        {
          $set: {
            paidAmount: newPaidAmount,
            paymentStatus: newPaidAmount <= 0 ? 'pending' : 'partial',
          },
        }
      );

      log('Refund processed', { bookingId, amount, refundId, reason });

      return {
        success: true,
        refundId,
      };
    } catch (error) {
      log('Refund processing failed', { bookingId, amount, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund processing failed',
      };
    }
  }

  /**
   * Get billing summary for guest
   */
  async getGuestBillingSummary(guestId: string): Promise<{
    totalSpent: number;
    pendingAmount: number;
    bookingsCount: number;
    averageBookingValue: number;
    lastBooking?: string;
  }> {
    const bookings = await Booking.find({
      guestId,
      status: { $in: ['checked_out', 'confirmed', 'checked_in'] },
    });

    let totalSpent = 0;
    let pendingAmount = 0;

    for (const booking of bookings) {
      totalSpent += booking.totalAmount;
      if (booking.paymentStatus === 'pending' || booking.paymentStatus === 'partial') {
        pendingAmount += booking.totalAmount - booking.paidAmount;
      }
    }

    return {
      totalSpent,
      pendingAmount,
      bookingsCount: bookings.length,
      averageBookingValue: bookings.length > 0 ? totalSpent / bookings.length : 0,
      lastBooking: bookings.length > 0 ? bookings[0].bookingId : undefined,
    };
  }

  /**
   * Generate end-of-day billing report
   */
  async getDailyBillingReport(hotelId: string, date: Date): Promise<{
    date: string;
    totalRevenue: number;
    totalPaid: number;
    totalPending: number;
    checkoutRevenue: number;
    advanceCollections: number;
    refunds: number;
    byCategory: Record<string, number>;
    transactions: Array<{
      bookingId: string;
      guestName: string;
      amount: number;
      type: 'payment' | 'refund';
      method?: string;
    }>;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      hotelId,
      updatedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const report = {
      date: date.toISOString().split('T')[0],
      totalRevenue: 0,
      totalPaid: 0,
      totalPending: 0,
      checkoutRevenue: 0,
      advanceCollections: 0,
      refunds: 0,
      byCategory: {} as Record<string, number>,
      transactions: [] as Array<{
        bookingId: string;
        guestName: string;
        amount: number;
        type: 'payment' | 'refund';
        method?: string;
      }>,
    };

    for (const booking of bookings) {
      const guest = await Guest.findOne({ guestId: booking.guestId });
      const guestName = guest?.name || 'Unknown';

      report.totalRevenue += booking.totalAmount;
      report.totalPending += booking.totalAmount - booking.paidAmount;

      if (booking.paymentStatus === 'paid') {
        report.totalPaid += booking.totalAmount;
      }

      if (booking.status === 'checked_out') {
        report.checkoutRevenue += booking.totalAmount;
      }

      // Categorize by source
      if (!report.byCategory[booking.source]) {
        report.byCategory[booking.source] = 0;
      }
      report.byCategory[booking.source] += booking.totalAmount;

      report.transactions.push({
        bookingId: booking.bookingId,
        guestName,
        amount: booking.paidAmount,
        type: 'payment',
      });
    }

    return report;
  }
}

export const billingService = new BillingService();
