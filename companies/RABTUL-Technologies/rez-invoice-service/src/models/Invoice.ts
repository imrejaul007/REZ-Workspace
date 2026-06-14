import { v4 as uuidv4 } from 'uuid';
import {
  Invoice,
  LineItem,
  InvoiceStatus,
  InvoiceType,
  TaxBreakup,
  PaymentRecord,
  ReminderRecord,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  RecordPaymentInput,
  InvoiceFilters,
  PaginationParams,
  PaginatedResult,
  InvoiceStats,
  GSTSummary,
  Address
} from '../types';
import { Database } from '../db/database';

export class InvoiceModel {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  private numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                  'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const scale = ['', 'Thousand', 'Lakh', 'Crore'];

    if (num === 0) return 'Zero';

    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = Math.floor(num / 100);
    num %= 100;
    const ten = Math.floor(num);

    const twoDigits = (n: number): string => {
      if (n < 20) return ones[n];
      return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    };

    let result = '';

    if (crore) result += twoDigits(crore) + ' Crore ';
    if (lakh) result += twoDigits(lakh) + ' Lakh ';
    if (thousand) result += twoDigits(thousand) + ' Thousand ';
    if (hundred) result += ones[hundred] + ' Hundred ';
    if (ten) result += twoDigits(ten);

    return result.trim();
  }

  private calculateTaxes(items: LineItem[], placeOfSupply: string, businessGstin?: string, customerGstin?: string): TaxBreakup {
    const isInterState = businessGstin?.substring(0, 2) !== customerGstin?.substring(0, 2);

    let taxableValue = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let cessTotal = 0;

    items.forEach(item => {
      taxableValue += item.taxableValue;
      if (isInterState) {
        igstTotal += item.igstAmount || 0;
      } else {
        cgstTotal += item.cgstAmount || 0;
        sgstTotal += item.sgstAmount || 0;
      }
      cessTotal += item.cessAmount || 0;
    });

    return {
      taxableValue: Math.round(taxableValue * 100) / 100,
      cgstTotal: Math.round(cgstTotal * 100) / 100,
      sgstTotal: Math.round(sgstTotal * 100) / 100,
      igstTotal: Math.round(igstTotal * 100) / 100,
      cessTotal: Math.round(cessTotal * 100) / 100,
      taxTotal: Math.round((cgstTotal + sgstTotal + igstTotal + cessTotal) * 100) / 100
    };
  }

  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM invoices
      WHERE strftime('%Y', invoice_date) = ?
    `).get(year.toString()) as { count: number };

    const sequence = (result.count + 1).toString().padStart(4, '0');
    return `INV-${year}-${sequence}`;
  }

  private processLineItems(
    inputItems: Omit<LineItem, 'id'>[],
    placeOfSupply: string,
    businessGstin?: string,
    customerGstin?: string
  ): LineItem[] {
    const isInterState = businessGstin?.substring(0, 2) !== customerGstin?.substring(0, 2);

    return inputItems.map(item => {
      const rate = item.rate;
      const quantity = item.quantity;
      let discountAmount = 0;

      if (item.discountPercent && item.discountPercent > 0) {
        discountAmount = (rate * quantity * item.discountPercent) / 100;
      } else if (item.discount) {
        discountAmount = item.discount;
      }

      const grossAmount = rate * quantity;
      const taxableValue = grossAmount - discountAmount;

      let cgstRate = 0, cgstAmount = 0;
      let sgstRate = 0, sgstAmount = 0;
      let igstRate = 0, igstAmount = 0;
      let cessRate = 0, cessAmount = 0;

      // Default GST rates if not specified
      const itemGstRate = 18; // Default to 18%

      if (isInterState) {
        igstRate = itemGstRate;
        igstAmount = Math.round(taxableValue * igstRate) / 100;
      } else {
        cgstRate = itemGstRate / 2;
        sgstRate = itemGstRate / 2;
        cgstAmount = Math.round(taxableValue * cgstRate) / 100;
        sgstAmount = Math.round(taxableValue * sgstRate) / 100;
      }

      const total = taxableValue + cgstAmount + sgstAmount + igstAmount + cessAmount;

      return {
        id: uuidv4(),
        description: item.description,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        unit: item.unit || 'pcs',
        rate: item.rate,
        discount: discountAmount,
        discountPercent: item.discountPercent,
        taxableValue: Math.round(taxableValue * 100) / 100,
        cgstRate,
        cgstAmount: Math.round(cgstAmount * 100) / 100,
        sgstRate,
        sgstAmount: Math.round(sgstAmount * 100) / 100,
        igstRate,
        igstAmount: Math.round(igstAmount * 100) / 100,
        cessRate,
        cessAmount: Math.round(cessAmount * 100) / 100,
        total: Math.round(total * 100) / 100
      };
    });
  }

  async create(input: CreateInvoiceInput): Promise<Invoice> {
    const id = uuidv4();
    const invoiceNumber = this.generateInvoiceNumber();
    const now = new Date().toISOString();

    const invoiceDate = input.invoiceDate || now.split('T')[0];
    const dueDate = input.dueDate || this.calculateDueDate(invoiceDate);

    const businessGstin = process.env.COMPANY_GSTIN;
    const customerGstin = input.customerGstin;
    const placeOfSupply = input.placeOfSupply || 'Maharashtra';

    const items = this.processLineItems(
      input.items,
      placeOfSupply,
      businessGstin,
      customerGstin
    );

    const subtotal = items.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
    const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const taxBreakup = this.calculateTaxes(items, placeOfSupply, businessGstin, customerGstin);
    const totalAmount = taxBreakup.taxableValue + taxBreakup.taxTotal;

    const roundOff = Math.round(totalAmount) - totalAmount;
    const finalAmount = Math.round(totalAmount);

    const invoice: Invoice = {
      id,
      invoiceNumber,
      type: input.type || 'tax_invoice',
      status: 'draft',
      businessName: process.env.COMPANY_NAME || 'Your Company',
      businessAddress: this.parseAddress(process.env.COMPANY_ADDRESS || ''),
      businessGstin,
      businessPan: process.env.COMPANY_PAN,
      customerName: input.customerName,
      customerAddress: input.customerAddress,
      customerGstin: input.customerGstin,
      customerPan: input.customerPan,
      invoiceDate,
      dueDate,
      placeOfSupply,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      taxableValue: taxBreakup.taxableValue,
      taxBreakup,
      totalTax: taxBreakup.taxTotal,
      roundOff: Math.round(roundOff * 100) / 100,
      totalAmount: Math.round(finalAmount * 100) / 100,
      amountInWords: this.numberToWords(finalAmount),
      bankDetails: input.bankDetails,
      amountPaid: 0,
      amountDue: Math.round(finalAmount * 100) / 100,
      payments: [],
      notes: input.notes,
      terms: input.terms,
      createdAt: now,
      updatedAt: now,
      reminders: [],
      reference: input.reference,
      template: input.template || 'standard',
      color: input.color || '#2563eb',
      currency: 'INR'
    };

    this.db.run(`
      INSERT INTO invoices (
        id, invoice_number, type, status, invoice_date, due_date,
        data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoice.id,
      invoice.invoiceNumber,
      invoice.type,
      invoice.status,
      invoice.invoiceDate,
      invoice.dueDate,
      JSON.stringify(invoice),
      invoice.createdAt,
      invoice.updatedAt
    ]);

    return invoice;
  }

  private parseAddress(addressStr: string): Address {
    const lines = addressStr.split(',').map(l => l.trim());
    return {
      line1: lines[0] || '',
      line2: lines[1] || '',
      city: lines[2] || '',
      state: lines[3] || '',
      postalCode: lines[4] || '',
      country: 'India'
    };
  }

  private calculateDueDate(invoiceDate: string): string {
    const days = parseInt(process.env.INVOICE_DUE_DAYS || '30');
    const date = new Date(invoiceDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  async findById(id: string): Promise<Invoice | null> {
    const row = this.db.prepare('SELECT data FROM invoices WHERE id = ?').get(id) as { data: string } | undefined;
    if (!row) return null;
    return JSON.parse(row.data);
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    const row = this.db.prepare('SELECT data FROM invoices WHERE invoice_number = ?').get(invoiceNumber) as { data: string } | undefined;
    if (!row) return null;
    return JSON.parse(row.data);
  }

  async update(id: string, input: UpdateInvoiceInput): Promise<Invoice | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();

    // If items are updated, recalculate totals
    let items = existing.items;
    let taxBreakup = existing.taxBreakup;
    let subtotal = existing.subtotal;
    let totalDiscount = existing.totalDiscount;
    let totalAmount = existing.totalAmount;
    let amountInWords = existing.amountInWords;
    let roundOff = existing.roundOff;

    if (input.items) {
      const businessGstin = existing.businessGstin;
      const customerGstin = input.customerGstin || existing.customerGstin;
      const placeOfSupply = input.placeOfSupply || existing.placeOfSupply;

      items = this.processLineItems(input.items, placeOfSupply, businessGstin, customerGstin);
      subtotal = items.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
      totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
      taxBreakup = this.calculateTaxes(items, placeOfSupply, businessGstin, customerGstin);
      totalAmount = taxBreakup.taxableValue + taxBreakup.taxTotal;
      roundOff = Math.round(totalAmount) - totalAmount;
      totalAmount = Math.round(totalAmount);
      amountInWords = this.numberToWords(totalAmount);
    }

    const updated: Invoice = {
      ...existing,
      ...input,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      taxableValue: taxBreakup.taxableValue,
      taxBreakup,
      totalTax: taxBreakup.taxTotal,
      roundOff: Math.round(roundOff * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      amountInWords,
      amountDue: Math.round((totalAmount - existing.amountPaid) * 100) / 100,
      updatedAt: now
    };

    if (input.invoiceDate) updated.invoiceDate = input.invoiceDate;
    if (input.dueDate) updated.dueDate = input.dueDate;

    this.db.run(`
      UPDATE invoices SET
        data = ?,
        status = ?,
        invoice_date = ?,
        due_date = ?,
        updated_at = ?
      WHERE id = ?
    `, [
      JSON.stringify(updated),
      updated.status,
      updated.invoiceDate,
      updated.dueDate,
      now,
      id
    ]);

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = this.db.run('DELETE FROM invoices WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async list(filters: InvoiceFilters = {}, pagination: PaginationParams = {}): Promise<PaginatedResult<Invoice>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    let whereClause = '1=1';
    const params: any[] = [];

    if (filters.status) {
      whereClause += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.fromDate) {
      whereClause += ' AND invoice_date >= ?';
      params.push(filters.fromDate);
    }

    if (filters.toDate) {
      whereClause += ' AND invoice_date <= ?';
      params.push(filters.toDate);
    }

    if (filters.customerName) {
      whereClause += ' AND data LIKE ?';
      params.push(`%${filters.customerName}%`);
    }

    if (filters.minAmount) {
      whereClause += ' AND json_extract(data, "$.totalAmount") >= ?';
      params.push(filters.minAmount);
    }

    if (filters.maxAmount) {
      whereClause += ' AND json_extract(data, "$.totalAmount") <= ?';
      params.push(filters.maxAmount);
    }

    if (filters.search) {
      whereClause += ' AND (invoice_number LIKE ? OR json_extract(data, "$.customerName") LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const sortColumn = {
      invoiceDate: 'invoice_date',
      invoiceNumber: 'invoice_number',
      totalAmount: 'json_extract(data, "$.totalAmount")',
      dueDate: 'due_date',
      createdAt: 'created_at'
    }[sortBy] || 'created_at';

    const countResult = this.db.prepare(`
      SELECT COUNT(*) as total FROM invoices WHERE ${whereClause}
    `).get(...params) as { total: number };

    const offset = (page - 1) * limit;
    const rows = this.db.prepare(`
      SELECT data FROM invoices
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as { data: string }[];

    const data = rows.map(row => JSON.parse(row.data));

    return {
      data,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updates: Partial<Invoice> = { status, updatedAt: now };

    if (status === 'sent' && !existing.sentAt) {
      updates.sentAt = now;
    }

    const updated: Invoice = {
      ...existing,
      ...updates
    };

    this.db.run(`
      UPDATE invoices SET data = ?, status = ?, updated_at = ? WHERE id = ?
    `, [JSON.stringify(updated), status, now, id]);

    return updated;
  }

  async recordPayment(id: string, payment: RecordPaymentInput): Promise<Invoice | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const paymentRecord: PaymentRecord = {
      id: uuidv4(),
      amount: payment.amount,
      date: payment.date,
      method: payment.method,
      reference: payment.reference,
      notes: payment.notes
    };

    const newAmountPaid = existing.amountPaid + payment.amount;
    const newAmountDue = existing.totalAmount - newAmountPaid;

    let newStatus: InvoiceStatus = existing.status;
    if (newAmountDue <= 0) {
      newStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newStatus = 'partial';
    }

    const updated: Invoice = {
      ...existing,
      amountPaid: Math.round(newAmountPaid * 100) / 100,
      amountDue: Math.round(newAmountDue * 100) / 100,
      status: newStatus,
      payments: [...existing.payments, paymentRecord],
      updatedAt: new Date().toISOString()
    };

    this.db.run(`
      UPDATE invoices SET data = ?, status = ?, updated_at = ? WHERE id = ?
    `, [JSON.stringify(updated), newStatus, updated.updatedAt, id]);

    return updated;
  }

  async addReminder(id: string, reminder: Omit<ReminderRecord, 'id'>): Promise<Invoice | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const reminderRecord: ReminderRecord = {
      id: uuidv4(),
      ...reminder
    };

    const updated: Invoice = {
      ...existing,
      reminders: [...existing.reminders, reminderRecord],
      updatedAt: new Date().toISOString()
    };

    this.db.run(`
      UPDATE invoices SET data = ?, updated_at = ? WHERE id = ?
    `, [JSON.stringify(updated), updated.updatedAt, id]);

    return updated;
  }

  async getStats(filters: InvoiceFilters = {}): Promise<InvoiceStats> {
    const invoices = await this.list(filters, { limit: 100000 });

    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;
    let draftCount = 0;
    let sentCount = 0;
    let paidCount = 0;
    let overdueCount = 0;

    const today = new Date().toISOString().split('T')[0];

    invoices.data.forEach(inv => {
      totalAmount += inv.totalAmount;
      paidAmount += inv.amountPaid;
      pendingAmount += inv.amountDue;

      if (inv.status === 'draft') draftCount++;
      if (inv.status === 'sent' || inv.status === 'viewed') sentCount++;
      if (inv.status === 'paid') paidCount++;
      if (inv.dueDate < today && inv.amountDue > 0 && inv.status !== 'paid') {
        overdueCount++;
        overdueAmount += inv.amountDue;
      }
    });

    return {
      totalInvoices: invoices.total,
      totalAmount: Math.round(totalAmount * 100) / 100,
      paidAmount: Math.round(paidAmount * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      draftCount,
      sentCount,
      paidCount,
      overdueCount
    };
  }

  async getGSTSummary(fromDate: string, toDate: string): Promise<GSTSummary> {
    const invoices = await this.list(
      { fromDate, toDate, status: 'paid' },
      { limit: 100000 }
    );

    let cgstCollected = 0;
    let sgstCollected = 0;
    let igstCollected = 0;
    let cessCollected = 0;
    let totalTaxableValue = 0;

    invoices.data.forEach(inv => {
      cgstCollected += inv.taxBreakup.cgstTotal;
      sgstCollected += inv.taxBreakup.sgstTotal;
      igstCollected += inv.taxBreakup.igstTotal;
      cessCollected += inv.taxBreakup.cessTotal;
      totalTaxableValue += inv.taxBreakup.taxableValue;
    });

    return {
      cgstCollected: Math.round(cgstCollected * 100) / 100,
      sgstCollected: Math.round(sgstCollected * 100) / 100,
      igstCollected: Math.round(igstCollected * 100) / 100,
      cessCollected: Math.round(cessCollected * 100) / 100,
      totalTaxCollected: Math.round((cgstCollected + sgstCollected + igstCollected + cessCollected) * 100) / 100,
      totalTaxableValue: Math.round(totalTaxableValue * 100) / 100
    };
  }

  async getOverdueInvoices(): Promise<Invoice[]> {
    const today = new Date().toISOString().split('T')[0];
    const invoices = await this.list(
      { toDate: today },
      { limit: 1000, sortBy: 'dueDate', sortOrder: 'asc' }
    );

    return invoices.data.filter(inv =>
      inv.dueDate < today &&
      inv.amountDue > 0 &&
      inv.status !== 'paid' &&
      inv.status !== 'cancelled'
    );
  }
}
