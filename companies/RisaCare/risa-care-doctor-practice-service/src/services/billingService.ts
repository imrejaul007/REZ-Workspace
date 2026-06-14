import { v4 as uuidv4 } from 'uuid';
import type {
  Billing,
  BillingItem,
  BillingStatus,
  PaymentMethod,
  CreateBillingInput,
} from '../types/schemas.js';
import {
  getBilling,
  getBillingsByPatient,
  getBillingsByDoctor,
  getAllBillings,
  createBilling,
  updateBilling,
} from '../models/store.js';

export class BillingService {
  /**
   * Create a new bill
   */
  async createBill(input: CreateBillingInput): Promise<Billing> {
    // Calculate totals
    const subtotal = input.items.reduce((sum, item) => sum + item.total, 0);
    const tax = input.tax || 0;
    const discount = input.discount || 0;
    const total = subtotal + tax - discount;

    const billing: Billing = {
      billingId: uuidv4(),
      patientId: input.patientId,
      doctorId: input.doctorId,
      appointmentId: input.appointmentId,
      items: input.items,
      subtotal,
      tax,
      total,
      discount,
      paymentMethod: input.paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    return createBilling(billing);
  }

  /**
   * Get bill by ID
   */
  async getBilling(billingId: string): Promise<Billing | null> {
    return getBilling(billingId) || null;
  }

  /**
   * Get all bills for a patient
   */
  async getBillingsByPatientId(patientId: string): Promise<Billing[]> {
    return getBillingsByPatient(patientId);
  }

  /**
   * Get all bills for a doctor
   */
  async getBillingsByDoctorId(doctorId: string): Promise<Billing[]> {
    return getBillingsByDoctor(doctorId);
  }

  /**
   * Get all bills
   */
  async getAllBillings(): Promise<Billing[]> {
    return getAllBillings();
  }

  /**
   * Process payment for a bill
   */
  async processPayment(
    billingId: string,
    paymentMethod: PaymentMethod,
    amount?: number
  ): Promise<Billing | null> {
    const billing = getBilling(billingId);
    if (!billing) return null;

    if (billing.status === 'paid') {
      throw new Error('Bill is already paid');
    }

    const paymentAmount = amount || billing.total;

    let newStatus: BillingStatus = 'pending';
    if (paymentAmount >= billing.total) {
      newStatus = 'paid';
    } else if (paymentAmount > 0) {
      newStatus = 'partial';
    }

    return updateBilling(billingId, {
      status: newStatus,
      paymentMethod,
      paidAt: newStatus === 'paid' ? new Date().toISOString() : undefined,
    }) || null;
  }

  /**
   * Add item to existing bill
   */
  async addBillItem(
    billingId: string,
    item: Omit<BillingItem, 'itemId' | 'total'>
  ): Promise<Billing | null> {
    const billing = getBilling(billingId);
    if (!billing) return null;

    const newItem: BillingItem = {
      itemId: uuidv4(),
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    };

    const newItems = [...billing.items, newItem];
    const newSubtotal = newItems.reduce((sum, i) => sum + i.total, 0);
    const newTotal = newSubtotal + billing.tax - billing.discount;

    return updateBilling(billingId, {
      items: newItems,
      subtotal: newSubtotal,
      total: newTotal,
    }) || null;
  }

  /**
   * Remove item from bill
   */
  async removeBillItem(billingId: string, itemId: string): Promise<Billing | null> {
    const billing = getBilling(billingId);
    if (!billing) return null;

    const newItems = billing.items.filter(i => i.itemId !== itemId);
    const newSubtotal = newItems.reduce((sum, i) => sum + i.total, 0);
    const newTotal = newSubtotal + billing.tax - billing.discount;

    return updateBilling(billingId, {
      items: newItems,
      subtotal: newSubtotal,
      total: newTotal,
    }) || null;
  }

  /**
   * Apply discount to bill
   */
  async applyDiscount(billingId: string, discountAmount: number): Promise<Billing | null> {
    const billing = getBilling(billingId);
    if (!billing) return null;

    const newDiscount = billing.discount + discountAmount;
    const newTotal = billing.subtotal + billing.tax - newDiscount;

    return updateBilling(billingId, {
      discount: newDiscount,
      total: newTotal,
    }) || null;
  }

  /**
   * Generate invoice text for a bill
   */
  async generateInvoice(billingId: string): Promise<string | null> {
    const billing = getBilling(billingId);
    if (!billing) return null;

    const lines: string[] = [];

    lines.push('═══════════════════════════════════════════════════════');
    lines.push('                    MEDICAL INVOICE                     ');
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Invoice Number: ${billing.billingId.slice(0, 8).toUpperCase()}`);
    lines.push(`Date: ${new Date(billing.createdAt).toLocaleDateString()}`);
    lines.push(`Time: ${new Date(billing.createdAt).toLocaleTimeString()}`);
    lines.push('');
    lines.push('───────────────────────────────────────────────────────');
    lines.push('PATIENT DETAILS');
    lines.push('───────────────────────────────────────────────────────');
    lines.push(`Patient ID: ${billing.patientId}`);
    lines.push(`Doctor ID: ${billing.doctorId}`);
    lines.push('');
    lines.push('───────────────────────────────────────────────────────');
    lines.push('BILL ITEMS');
    lines.push('───────────────────────────────────────────────────────');

    billing.items.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.description}`);
      lines.push(`   Qty: ${item.quantity} x ₹${item.unitPrice.toFixed(2)} = ₹${item.total.toFixed(2)}`);
    });

    lines.push('');
    lines.push('───────────────────────────────────────────────────────');
    lines.push('SUMMARY');
    lines.push('───────────────────────────────────────────────────────');
    lines.push(`Subtotal:                                              ₹${billing.subtotal.toFixed(2)}`);
    if (billing.discount > 0) {
      lines.push(`Discount:                                            -₹${billing.discount.toFixed(2)}`);
    }
    lines.push(`Tax:                                                  ₹${billing.tax.toFixed(2)}`);
    lines.push('───────────────────────────────────────────────────────');
    lines.push(`TOTAL:                                                ₹${billing.total.toFixed(2)}`);
    lines.push('───────────────────────────────────────────────────────');

    if (billing.status === 'paid') {
      lines.push('');
      lines.push(`PAID via: ${billing.paymentMethod?.toUpperCase() || 'N/A'}`);
      lines.push(`Paid on: ${billing.paidAt ? new Date(billing.paidAt).toLocaleString() : 'N/A'}`);
    } else {
      lines.push('');
      lines.push('STATUS: PENDING PAYMENT');
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('     Thank you for choosing our medical services!       ');
    lines.push('═══════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * Get revenue statistics
   */
  async getRevenue(startDate?: string, endDate?: string): Promise<{
    totalRevenue: number;
    paidRevenue: number;
    pendingRevenue: number;
    partialRevenue: number;
    totalBills: number;
    paidBills: number;
    pendingBills: number;
    averageBillValue: number;
  }> {
    let billings = getAllBillings();

    // Filter by date range if provided
    if (startDate) {
      const start = new Date(startDate);
      billings = billings.filter(b => new Date(b.createdAt) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      billings = billings.filter(b => new Date(b.createdAt) <= end);
    }

    const paidBills = billings.filter(b => b.status === 'paid');
    const pendingBills = billings.filter(b => b.status === 'pending');
    const partialBills = billings.filter(b => b.status === 'partial');

    const totalRevenue = billings.reduce((sum, b) => sum + b.total, 0);
    const paidRevenue = paidBills.reduce((sum, b) => sum + b.total, 0);
    const pendingRevenue = pendingBills.reduce((sum, b) => sum + b.total, 0);
    const partialRevenue = partialBills.reduce((sum, b) => sum + b.total, 0);

    return {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      partialRevenue,
      totalBills: billings.length,
      paidBills: paidBills.length,
      pendingBills: pendingBills.length,
      averageBillValue: billings.length > 0 ? totalRevenue / billings.length : 0,
    };
  }

  /**
   * Get revenue by doctor
   */
  async getRevenueByDoctor(doctorId: string): Promise<{
    doctorId: string;
    totalRevenue: number;
    paidRevenue: number;
    pendingRevenue: number;
    billCount: number;
  } | null> {
    const billings = getBillingsByDoctor(doctorId);

    if (billings.length === 0) return null;

    const paidBills = billings.filter(b => b.status === 'paid');
    const pendingBills = billings.filter(b => b.status === 'pending');

    return {
      doctorId,
      totalRevenue: billings.reduce((sum, b) => sum + b.total, 0),
      paidRevenue: paidBills.reduce((sum, b) => sum + b.total, 0),
      pendingRevenue: pendingBills.reduce((sum, b) => sum + b.total, 0),
      billCount: billings.length,
    };
  }

  /**
   * Get pending bills
   */
  async getPendingBills(): Promise<Billing[]> {
    const billings = getAllBillings();
    return billings.filter(b => b.status === 'pending' || b.status === 'partial');
  }

  /**
   * Refund a bill
   */
  async refundBill(billingId: string): Promise<Billing | null> {
    const billing = getBilling(billingId);
    if (!billing) return null;

    if (billing.status !== 'paid') {
      throw new Error('Can only refund paid bills');
    }

    return updateBilling(billingId, {
      status: 'refunded',
    }) || null;
  }

  /**
   * Create bill from appointment (consultation fee)
   */
  async createConsultationBill(
    patientId: string,
    doctorId: string,
    appointmentId: string,
    fee: number
  ): Promise<Billing> {
    const item: BillingItem = {
      itemId: uuidv4(),
      description: 'Consultation Fee',
      quantity: 1,
      unitPrice: fee,
      total: fee,
    };

    return this.createBill({
      patientId,
      doctorId,
      appointmentId,
      items: [item],
      subtotal: fee,
      tax: 0,
      discount: 0,
    });
  }
}

// Export singleton instance
export const billingService = new BillingService();
