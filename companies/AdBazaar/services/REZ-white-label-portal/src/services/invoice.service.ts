import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
  InvoiceTemplate,
  Currency,
  CreateInvoiceSchema,
  PaginatedResult,
  PaginationParams
} from '../types';
import logger from '../utils/logger';

const invoiceLogger = logger.child({ component: 'InvoiceService' });

// In-memory storage
const invoices: Map<string, Invoice> = new Map();
const invoiceTemplates: Map<string, InvoiceTemplate> = new Map();

// Invoice number prefix per tenant
const invoiceNumberCounters: Map<string, number> = new Map();

export class InvoiceService {
  // Generate invoice number
  private generateInvoiceNumber(tenantId: string): string {
    const counter = invoiceNumberCounters.get(tenantId) || 1000;
    invoiceNumberCounters.set(tenantId, counter + 1);
    const year = new Date().getFullYear();
    return `INV-${year}-${counter.toString().padStart(4, '0')}`;
  }

  // Create a new invoice
  async createInvoice(data: z.infer<typeof CreateInvoiceSchema>): Promise<Invoice> {
    invoiceLogger.info('Creating invoice', { tenantId: data.tenantId, clientId: data.clientId });
    
    // Calculate totals
    const subtotal = data.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * data.taxRate) / 100;
    const total = subtotal + taxAmount - data.discountAmount;
    
    // Process line items
    const lineItems: InvoiceLineItem[] = data.lineItems.map(item => ({
      ...item,
      id: uuidv4(),
    }));
    
    const invoice: Invoice = {
      id: uuidv4(),
      tenantId: data.tenantId,
      clientId: data.clientId,
      invoiceNumber: this.generateInvoiceNumber(data.tenantId),
      status: 'draft',
      issueDate: new Date(data.issueDate),
      dueDate: new Date(data.dueDate),
      currency: data.currency,
      subtotal,
      taxRate: data.taxRate,
      taxAmount,
      discountAmount: data.discountAmount,
      total,
      lineItems,
      notes: data.notes,
      terms: data.terms,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    invoices.set(invoice.id, invoice);
    return invoice;
  }

  // Get invoice by ID
  async getInvoice(id: string): Promise<Invoice | null> {
    return invoices.get(id) || null;
  }

  // Get invoice by invoice number
  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    for (const invoice of invoices.values()) {
      if (invoice.invoiceNumber === invoiceNumber) return invoice;
    }
    return null;
  }

  // Update invoice
  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice | null> {
    const invoice = invoices.get(id);
    if (!invoice) return null;
    
    // Recalculate totals if line items changed
    let { subtotal, taxAmount, total } = invoice;
    if (data.lineItems) {
      subtotal = data.lineItems.reduce((sum, item) => sum + item.amount, 0);
      taxAmount = (subtotal * (data.taxRate ?? invoice.taxRate)) / 100;
      total = subtotal + taxAmount - (data.discountAmount ?? invoice.discountAmount);
    }
    
    const updated: Invoice = {
      ...invoice,
      ...data,
      id: invoice.id,
      tenantId: invoice.tenantId,
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt,
      subtotal,
      taxAmount,
      total,
      updatedAt: new Date(),
    };
    
    invoices.set(id, updated);
    invoiceLogger.info('Invoice updated', { invoiceId: id });
    return updated;
  }

  // Delete invoice
  async deleteInvoice(id: string): Promise<boolean> {
    return invoices.delete(id);
  }

  // List invoices with filters
  async listInvoices(
    tenantId: string,
    pagination: PaginationParams,
    filters?: {
      clientId?: string;
      status?: InvoiceStatus;
      dateFrom?: Date;
      dateTo?: Date;
      search?: string;
    }
  ): Promise<PaginatedResult<Invoice>> {
    let filtered = Array.from(invoices.values()).filter(i => i.tenantId === tenantId);
    
    if (filters?.clientId) {
      filtered = filtered.filter(i => i.clientId === filters.clientId);
    }
    
    if (filters?.status) {
      filtered = filtered.filter(i => i.status === filters.status);
    }
    
    if (filters?.dateFrom) {
      filtered = filtered.filter(i => i.issueDate >= filters.dateFrom!);
    }
    
    if (filters?.dateTo) {
      filtered = filtered.filter(i => i.issueDate <= filters.dateTo!);
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(i =>
        i.invoiceNumber.toLowerCase().includes(search) ||
        i.notes?.toLowerCase().includes(search)
      );
    }
    
    // Sort by issue date descending
    filtered.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const start = (pagination.page - 1) * pagination.limit;
    
    return {
      data: filtered.slice(start, start + pagination.limit),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
    };
  }

  // Get invoices by client
  async getInvoicesByClient(clientId: string): Promise<Invoice[]> {
    const result: Invoice[] = [];
    for (const invoice of invoices.values()) {
      if (invoice.clientId === clientId) result.push(invoice);
    }
    return result.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());
  }

  // Update invoice status
  async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice | null> {
    const invoice = invoices.get(id);
    if (!invoice) return null;
    
    const updates: Partial<Invoice> = { status };
    
    if (status === 'paid') {
      updates.paidDate = new Date();
    }
    
    return this.updateInvoice(id, updates);
  }

  // Mark invoice as sent
  async sendInvoice(id: string): Promise<Invoice | null> {
    return this.updateStatus(id, 'sent');
  }

  // Mark invoice as paid
  async markPaid(id: string, paymentData?: {
    paymentMethod?: string;
    paymentReference?: string;
  }): Promise<Invoice | null> {
    const invoice = invoices.get(id);
    if (!invoice) return null;
    
    return this.updateInvoice(id, {
      status: 'paid',
      paidDate: new Date(),
      paymentMethod: paymentData?.paymentMethod,
      paymentReference: paymentData?.paymentReference,
    });
  }

  // Mark invoice as overdue
  async markOverdue(id: string): Promise<Invoice | null> {
    return this.updateStatus(id, 'overdue');
  }

  // Cancel invoice
  async cancelInvoice(id: string): Promise<Invoice | null> {
    return this.updateStatus(id, 'cancelled');
  }

  // Refund invoice
  async refundInvoice(id: string): Promise<Invoice | null> {
    return this.updateStatus(id, 'refunded');
  }

  // Add line item
  async addLineItem(
    invoiceId: string,
    item: Omit<InvoiceLineItem, 'id'>
  ): Promise<Invoice | null> {
    const invoice = invoices.get(invoiceId);
    if (!invoice) return null;
    
    const newItem: InvoiceLineItem = {
      ...item,
      id: uuidv4(),
    };
    
    return this.updateInvoice(invoiceId, {
      lineItems: [...invoice.lineItems, newItem],
    });
  }

  // Update line item
  async updateLineItem(
    invoiceId: string,
    lineItemId: string,
    updates: Partial<Omit<InvoiceLineItem, 'id'>>
  ): Promise<Invoice | null> {
    const invoice = invoices.get(invoiceId);
    if (!invoice) return null;
    
    const lineItems = invoice.lineItems.map(item => {
      if (item.id === lineItemId) {
        return { ...item, ...updates, id: lineItemId };
      }
      return item;
    });
    
    return this.updateInvoice(invoiceId, { lineItems });
  }

  // Remove line item
  async removeLineItem(invoiceId: string, lineItemId: string): Promise<Invoice | null> {
    const invoice = invoices.get(invoiceId);
    if (!invoice) return null;
    
    return this.updateInvoice(invoiceId, {
      lineItems: invoice.lineItems.filter(item => item.id !== lineItemId),
    });
  }

  // Get overdue invoices
  async getOverdueInvoices(tenantId: string): Promise<Invoice[]> {
    const now = new Date();
    return Array.from(invoices.values()).filter(
      i => i.tenantId === tenantId &&
           i.status === 'sent' &&
           i.dueDate < now
    );
  }

  // Get invoice statistics
  async getInvoiceStats(tenantId: string, dateFrom?: Date, dateTo?: Date): Promise<{
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    averageInvoiceValue: number;
  }> {
    let filtered = Array.from(invoices.values()).filter(i => i.tenantId === tenantId);
    
    if (dateFrom) {
      filtered = filtered.filter(i => i.issueDate >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(i => i.issueDate <= dateTo);
    }
    
    const totalAmount = filtered.reduce((sum, i) => sum + i.total, 0);
    const paidAmount = filtered.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
    const pendingAmount = filtered.filter(i => ['sent', 'draft'].includes(i.status)).reduce((sum, i) => sum + i.total, 0);
    const overdueAmount = filtered.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);
    
    return {
      totalInvoices: filtered.length,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      averageInvoiceValue: filtered.length > 0 ? totalAmount / filtered.length : 0,
    };
  }

  // Create invoice template
  async createTemplate(data: Omit<InvoiceTemplate, 'id'>): Promise<InvoiceTemplate> {
    const template: InvoiceTemplate = {
      ...data,
      id: uuidv4(),
    };
    
    invoiceTemplates.set(template.id, template);
    return template;
  }

  // Get invoice template
  async getTemplate(id: string): Promise<InvoiceTemplate | null> {
    return invoiceTemplates.get(id) || null;
  }

  // Get default template for tenant
  async getDefaultTemplate(tenantId: string): Promise<InvoiceTemplate | null> {
    for (const template of invoiceTemplates.values()) {
      if (template.tenantId === tenantId && template.isDefault) return template;
    }
    return null;
  }

  // Update template
  async updateTemplate(id: string, data: Partial<InvoiceTemplate>): Promise<InvoiceTemplate | null> {
    const template = invoiceTemplates.get(id);
    if (!template) return null;
    
    const updated: InvoiceTemplate = { ...template, ...data, id: template.id };
    invoiceTemplates.set(id, updated);
    return updated;
  }

  // Delete template
  async deleteTemplate(id: string): Promise<boolean> {
    return invoiceTemplates.delete(id);
  }

  // Generate invoice PDF content (placeholder)
  async generatePdfContent(invoiceId: string): Promise<string> {
    const invoice = invoices.get(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    
    // This is a placeholder - integrate with a PDF library like pdfkit or puppeteer
    return `
      INVOICE: ${invoice.invoiceNumber}
      ================================
      Issue Date: ${invoice.issueDate.toLocaleDateString()}
      Due Date: ${invoice.dueDate.toLocaleDateString()}
      Status: ${invoice.status}
      
      LINE ITEMS:
      ${invoice.lineItems.map(item => `${item.description} - Qty: ${item.quantity} x $${item.unitPrice} = $${item.amount}`).join('\n')}
      
      Subtotal: $${invoice.subtotal.toFixed(2)}
      Tax (${invoice.taxRate}%): $${invoice.taxAmount.toFixed(2)}
      Discount: -$${invoice.discountAmount.toFixed(2)}
      TOTAL: $${invoice.total.toFixed(2)}
      
      ${invoice.notes ? `Notes: ${invoice.notes}` : ''}
      ${invoice.terms ? `Terms: ${invoice.terms}` : ''}
    `;
  }

  // Get upcoming due invoices (within N days)
  async getUpcomingDueInvoices(tenantId: string, days: number = 7): Promise<Invoice[]> {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return Array.from(invoices.values()).filter(
      i => i.tenantId === tenantId &&
           ['sent', 'draft'].includes(i.status) &&
           i.dueDate >= now &&
           i.dueDate <= future
    );
  }

  // Bulk send invoices
  async bulkSend(invoiceIds: string[]): Promise<{ sent: string[]; failed: string[] }> {
    const sent: string[] = [];
    const failed: string[] = [];
    
    for (const id of invoiceIds) {
      try {
        const result = await this.sendInvoice(id);
        if (result) {
          sent.push(id);
        } else {
          failed.push(id);
        }
      } catch {
        failed.push(id);
      }
    }
    
    return { sent, failed };
  }

  // Duplicate invoice
  async duplicateInvoice(id: string): Promise<Invoice | null> {
    const invoice = invoices.get(id);
    if (!invoice) return null;
    
    const newInvoice: Invoice = {
      ...invoice,
      id: uuidv4(),
      invoiceNumber: this.generateInvoiceNumber(invoice.tenantId),
      status: 'draft',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      paidDate: undefined,
      paymentMethod: undefined,
      paymentReference: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    invoices.set(newInvoice.id, newInvoice);
    return newInvoice;
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;
