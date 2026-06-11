/**
 * Billing Service - Invoice & Payment Management
 * Part of STAYBOT - Hotel AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  category: 'room' | 'food' | 'spa' | 'transport' | 'laundry' | 'other';
}

export interface Invoice {
  id: string;
  guestId: string;
  folioId: string;
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  taxes: number;
  discount: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  status: 'pending' | 'partial' | 'paid' | 'cancelled';
  issueDate: string;
  dueDate: string;
  payments: Payment[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'cash' | 'card' | 'upi' | 'netbanking' | 'wallet';
  transactionId?: string;
  reference?: string;
  processedAt: string;
  processedBy?: string;
}

export interface Folio {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  invoices: Invoice[];
  balance: number;
  currency: string;
}

export class BillingService {
  private invoices: Map<string, Invoice> = new Map();
  private folios: Map<string, Folio> = new Map();

  async createFolio(guestId: string, guestName: string, roomNumber: string, checkIn: string, checkOut: string): Promise<Folio> {
    const folio: Folio = {
      id: uuidv4(),
      guestId,
      guestName,
      roomNumber,
      checkIn,
      checkOut,
      invoices: [],
      balance: 0,
      currency: 'INR'
    };

    this.folios.set(folio.id, folio);
    return folio;
  }

  async getFolioByGuest(guestId: string): Promise<Folio | undefined> {
    return Array.from(this.folios.values()).find(f => f.guestId === guestId);
  }

  async addCharge(guestId: string, item: Omit<InvoiceItem, 'amount'>): Promise<Invoice | undefined> {
    const folio = await this.getFolioByGuest(guestId);
    if (!folio) return undefined;

    // Get or create current invoice
    let invoice = folio.invoices.find(i => i.status === 'pending' || i.status === 'partial');
    if (!invoice) {
      invoice = await this.createInvoice(folio.id);
      folio.invoices.push(invoice);
    }

    const amount = item.quantity * item.unitPrice;
    invoice.items.push({ ...item, amount });
    invoice.subtotal += amount;
    invoice.taxes = Math.round(invoice.subtotal * 0.18);
    invoice.total = invoice.subtotal + invoice.taxes - invoice.discount;
    invoice.dueAmount = invoice.total - invoice.paidAmount;

    this.invoices.set(invoice.id, invoice);
    this.folios.set(folio.id, folio);

    return invoice;
  }

  async createInvoice(folioId: string): Promise<Invoice> {
    const folio = this.folios.get(folioId);
    if (!folio) throw new Error('Folio not found');

    const invoice: Invoice = {
      id: uuidv4(),
      guestId: folio.guestId,
      folioId,
      invoiceNumber: `INV${Date.now().toString(36).toUpperCase()}`,
      items: [],
      subtotal: 0,
      taxes: 0,
      discount: 0,
      total: 0,
      paidAmount: 0,
      dueAmount: 0,
      status: 'pending',
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      payments: []
    };

    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  async processPayment(invoiceId: string, payment: Omit<Payment, 'id' | 'invoiceId' | 'processedAt'>): Promise<{
    success: boolean;
    payment: Payment;
    invoice: Invoice;
  }> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const newPayment: Payment = {
      ...payment,
      id: uuidv4(),
      invoiceId,
      processedAt: new Date().toISOString()
    };

    invoice.payments.push(newPayment);
    invoice.paidAmount += payment.amount;
    invoice.dueAmount = invoice.total - invoice.paidAmount;

    if (invoice.dueAmount <= 0) {
      invoice.status = 'paid';
      invoice.dueAmount = 0;
    } else {
      invoice.status = 'partial';
    }

    this.invoices.set(invoice.id, invoice);

    // Update folio balance
    const folio = this.folios.get(invoice.folioId);
    if (folio) {
      folio.balance = folio.invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
      this.folios.set(folio.id, folio);
    }

    return { success: true, payment: newPayment, invoice };
  }

  async applyDiscount(invoiceId: string, discountAmount: number, reason: string): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return undefined;

    invoice.discount += discountAmount;
    invoice.total = invoice.subtotal + invoice.taxes - invoice.discount;
    invoice.dueAmount = invoice.total - invoice.paidAmount;

    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  async getInvoice(invoiceId: string): Promise<Invoice | undefined> {
    return this.invoices.get(invoiceId);
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    return Array.from(this.invoices.values()).find(i => i.invoiceNumber === invoiceNumber);
  }

  async getGuestBalance(guestId: string): Promise<number> {
    const folio = await this.getFolioByGuest(guestId);
    return folio?.balance || 0;
  }

  async generateFolioSummary(guestId: string): Promise<{
    guestId: string;
    totalCharges: number;
    totalPayments: number;
    balance: number;
    byCategory: Record<string, number>;
  } | null> {
    const folio = await this.getFolioByGuest(guestId);
    if (!folio) return null;

    const byCategory: Record<string, number> = {};
    let totalCharges = 0;

    folio.invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        totalCharges += item.amount;
        byCategory[item.category] = (byCategory[item.category] || 0) + item.amount;
      });
    });

    const totalPayments = folio.invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

    return {
      guestId,
      totalCharges,
      totalPayments,
      balance: totalCharges - totalPayments,
      byCategory
    };
  }

  async voidInvoice(invoiceId: string, reason: string): Promise<boolean> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return false;

    if (invoice.paidAmount > 0) {
      return false; // Cannot void partially paid invoice
    }

    invoice.status = 'cancelled';
    this.invoices.set(invoiceId, invoice);
    return true;
  }
}

export default BillingService;