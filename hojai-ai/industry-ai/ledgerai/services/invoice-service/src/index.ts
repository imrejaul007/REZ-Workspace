/**
 * Invoice Service
 * LEDGERAI - Accounting AI Operating System
 * Port: 4894
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  hsnCode?: string;
  cgst?: number;
  sgst?: number;
  igst?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'invoice' | 'credit_note' | 'debit_note' | 'proforma';
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGstin?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  paidAmount?: number;
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

class InvoiceService {
  private invoices: Map<string, Invoice> = new Map();
  private invoiceCounter = 1000;

  async create(data: {
    customerId: string;
    customerName: string;
    items: Omit<InvoiceLineItem, 'amount'>[];
    customerEmail?: string;
    customerAddress?: string;
    customerGstin?: string;
    discount?: number;
    creditDays?: number;
    notes?: string;
  }): Promise<Invoice> {
    const items: InvoiceLineItem[] = data.items.map(item => {
      const amount = item.quantity * item.rate;
      const cgst = item.cgst || 9;
      const sgst = item.sgst || 9;
      return { ...item, amount };
    });

    const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
    const discount = data.discount || 0;
    const taxableAmount = subtotal - discount;
    const taxAmount = items.reduce((sum, i) => {
      const rate = (i.cgst || 0) + (i.sgst || 0) + (i.igst || 0);
      return sum + (taxableAmount * rate / 100);
    }, 0);
    const total = taxableAmount + taxAmount;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (data.creditDays || 30));

    const invoice: Invoice = {
      id: uuidv4(),
      invoiceNumber: `INV-${++this.invoiceCounter}`,
      type: 'invoice',
      customerId: data.customerId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerAddress: data.customerAddress,
      customerGstin: data.customerGstin,
      items,
      subtotal,
      taxAmount,
      discount,
      total,
      currency: 'INR',
      status: 'draft',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  async getById(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getAll(filters?: { status?: string; customerId?: string; from?: string; to?: string }): Promise<Invoice[]> {
    let result = Array.from(this.invoices.values());

    if (filters?.status) {
      result = result.filter(i => i.status === filters.status);
    }
    if (filters?.customerId) {
      result = result.filter(i => i.customerId === filters.customerId);
    }
    if (filters?.from) {
      result = result.filter(i => i.issueDate >= filters.from!);
    }
    if (filters?.to) {
      result = result.filter(i => i.issueDate <= filters.to!);
    }

    return result.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }

  async update(id: string, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;

    Object.assign(invoice, updates, { updatedAt: new Date().toISOString() });
    this.invoices.set(id, invoice);
    return invoice;
  }

  async recordPayment(id: string, amount: number, method: 'cash' | 'card' | 'upi' | 'bank'): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;

    const paidAmount = (invoice.paidAmount || 0) + amount;

    if (paidAmount >= invoice.total) {
      invoice.status = 'paid';
      invoice.paidDate = new Date().toISOString();
      invoice.paidAmount = invoice.total;
    } else {
      invoice.status = 'partial';
      invoice.paidAmount = paidAmount;
    }

    invoice.updatedAt = new Date().toISOString();
    this.invoices.set(id, invoice);
    return invoice;
  }

  async send(id: string): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;

    invoice.status = 'sent';
    invoice.updatedAt = new Date().toISOString();
    this.invoices.set(id, invoice);
    return invoice;
  }

  async cancel(id: string): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;

    invoice.status = 'cancelled';
    invoice.updatedAt = new Date().toISOString();
    this.invoices.set(id, invoice);
    return invoice;
  }

  async getStats(from?: string, to?: string): Promise<{
    totalInvoices: number;
    totalValue: number;
    paid: number;
    pending: number;
    overdue: number;
    byCustomer: { customerId: string; name: string; total: number; paid: number }[];
  }> {
    let invoices = Array.from(this.invoices.values());

    if (from) invoices = invoices.filter(i => i.issueDate >= from);
    if (to) invoices = invoices.filter(i => i.issueDate <= to);

    const byCustomer = new Map<string, { name: string; total: number; paid: number }>();

    for (const inv of invoices) {
      const existing = byCustomer.get(inv.customerId) || { name: inv.customerName, total: 0, paid: 0 };
      existing.total += inv.total;
      if (inv.status === 'paid') existing.paid += inv.total;
      byCustomer.set(inv.customerId, existing);
    }

    return {
      totalInvoices: invoices.length,
      totalValue: invoices.reduce((sum, i) => sum + i.total, 0),
      paid: invoices.filter(i => i.status === 'paid').length,
      pending: invoices.filter(i => ['sent', 'viewed', 'partial'].includes(i.status)).length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      byCustomer: Array.from(byCustomer.entries()).map(([id, data]) => ({
        customerId: id,
        ...data,
      })),
    };
  }

  async generateReminderMessage(id: string): Promise<{ subject: string; message: string } | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;

    const daysOverdue = Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / (24 * 60 * 60 * 1000));

    return {
      subject: `Payment Reminder: Invoice ${invoice.invoiceNumber}`,
      message: `Dear ${invoice.customerName},\n\nThis is a reminder that Invoice ${invoice.invoiceNumber} for ₹${invoice.total.toLocaleString()} was due on ${invoice.dueDate}.\n\n${daysOverdue > 0 ? `It is ${daysOverdue} days overdue.` : 'Please ensure timely payment.'}\n\nPlease ignore if already paid.\n\nRegards,\nAccounts Team`,
    };
  }
}

const invoiceService = new InvoiceService();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'ledgerai-invoice-service', port: 4894 });
});

app.post('/api/invoices', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.create(req.body);
    res.status(201).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

app.get('/api/invoices', async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      customerId: req.query.customerId as string,
      from: req.query.from as string,
      to: req.query.to as string,
    };
    const invoices = await invoiceService.getAll(filters);
    res.json({ success: true, invoices, count: invoices.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

app.get('/api/invoices/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

app.patch('/api/invoices/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.update(req.params.id, req.body);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

app.post('/api/invoices/:id/payment', async (req: Request, res: Response) => {
  try {
    const { amount, method } = req.body;
    const invoice = await invoiceService.recordPayment(req.params.id, amount, method);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

app.post('/api/invoices/:id/send', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.send(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send invoice' });
  }
});

app.post('/api/invoices/:id/cancel', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.cancel(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel invoice' });
  }
});

app.get('/api/invoices/:id/reminder', async (req: Request, res: Response) => {
  try {
    const reminder = await invoiceService.generateReminderMessage(req.params.id);
    if (!reminder) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true, ...reminder });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate reminder' });
  }
});

app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const from = req.query.from as string;
    const to = req.query.to as string;
    const stats = await invoiceService.getStats(from, to);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

const PORT = 4894;
app.listen(PORT, () => {
  console.log(`📄 Invoice Service running on port ${PORT}`);
  console.log(`📊 LEDGERAI - Accounting AI Operating System`);
});

export default app;