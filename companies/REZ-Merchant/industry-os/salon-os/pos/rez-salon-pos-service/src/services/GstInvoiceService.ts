import PDFDocument from 'pdfkit';
import { Invoice, IInvoice } from '../models/Invoice';
import { config } from '../config';

export interface InvoiceQuery {
  invoiceNumber?: string;
  transactionId?: string;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  paymentStatus?: string;
}

export class GstInvoiceService {
  /**
   * Generate GST-compliant PDF invoice
   */
  async generatePdf(invoice: IInvoice): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        this.drawHeader(doc, invoice);

        // Invoice meta info
        this.drawInvoiceMeta(doc, invoice);

        // Customer info
        this.drawCustomerInfo(doc, invoice);

        // Table header
        const tableTop = 270;
        this.drawTableHeader(doc, tableTop);

        // Table rows
        this.drawTableRows(doc, invoice, tableTop);

        // Totals section
        const totalsTop = tableTop + 40 + invoice.items.length * 25;
        this.drawTotals(doc, invoice, totalsTop);

        // Footer
        this.drawFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private drawHeader(doc: PDFKit.PDFDocument, invoice: IInvoice): void {
    // Salon name
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(invoice.salonName, 50, 50, { align: 'center' });

    // Address
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(invoice.salonAddress, 50, 80, { align: 'center' });

    doc.text(`Phone: ${invoice.salonPhone}`, { align: 'center' });
    doc.text(`GSTIN: ${invoice.salonGstin}`, { align: 'center' });

    // Tax Invoice label
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('TAX INVOICE', 50, 140, { align: 'center' });

    // Horizontal line
    doc
      .moveTo(50, 160)
      .lineTo(545, 160)
      .stroke();
  }

  private drawInvoiceMeta(doc: PDFKit.PDFDocument, invoice: IInvoice): void {
    const leftCol = 50;
    const rightCol = 350;

    doc.fontSize(10).font('Helvetica-Bold').text('Invoice Number:', leftCol, 175);
    doc.font('Helvetica').text(invoice.invoiceNumber);

    doc.font('Helvetica-Bold').text('Invoice Date:', rightCol, 175);
    doc.font('Helvetica').text(this.formatDate(invoice.invoiceDate));

    doc.font('Helvetica-Bold').text('Place of Supply:', leftCol, 195);
    doc.font('Helvetica').text(invoice.placeOfSupply);

    doc.font('Helvetica-Bold').text('Payment Status:', rightCol, 195);
    doc.font('Helvetica').text(invoice.paymentStatus.toUpperCase());

    if (invoice.dueDate) {
      doc.font('Helvetica-Bold').text('Due Date:', leftCol, 215);
      doc.font('Helvetica').text(this.formatDate(invoice.dueDate));
    }

    doc
      .moveTo(50, 240)
      .lineTo(545, 240)
      .stroke();
  }

  private drawCustomerInfo(doc: PDFKit.PDFDocument, invoice: IInvoice): void {
    doc.fontSize(11).font('Helvetica-Bold').text('Bill To:', 50, 250);

    doc.font('Helvetica').fontSize(10);
    doc.text(invoice.customerName, 50, 265);

    if (invoice.customerAddress) {
      doc.text(invoice.customerAddress, 50, 280);
    }

    if (invoice.customerPhone) {
      doc.text(`Phone: ${invoice.customerPhone}`, 50, 295);
    }

    if (invoice.customerEmail) {
      doc.text(`Email: ${invoice.customerEmail}`, 50, 310);
    }

    if (invoice.customerGstin) {
      doc.text(`GSTIN: ${invoice.customerGstin}`, 50, 325);
    }
  }

  private drawTableHeader(doc: PDFKit.PDFDocument, y: number): void {
    const cols = {
      sr: 50,
      description: 80,
      hsn: 270,
      qty: 330,
      rate: 370,
      discount: 420,
      taxable: 460,
      tax: 500,
      total: 540,
    };

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Sr.', cols.sr, y);
    doc.text('Description', cols.description, y);
    doc.text('HSN', cols.hsn, y);
    doc.text('Qty', cols.qty, y);
    doc.text('Rate', cols.rate, y);
    doc.text('Disc %', cols.discount, y);
    doc.text('Taxable', cols.taxable, y);
    doc.text('Tax', cols.tax, y);
    doc.text('Total', cols.total, y);

    doc
      .moveTo(50, y + 15)
      .lineTo(545, y + 15)
      .stroke();
  }

  private drawTableRows(
    doc: PDFKit.PDFDocument,
    invoice: IInvoice,
    tableTop: number
  ): void {
    const cols = {
      sr: 50,
      description: 80,
      hsn: 270,
      qty: 330,
      rate: 370,
      discount: 420,
      taxable: 460,
      tax: 500,
      total: 540,
    };

    doc.font('Helvetica').fontSize(9);

    invoice.items.forEach((item, index) => {
      const y = tableTop + 25 + index * 25;

      doc.text(String(index + 1), cols.sr, y);
      doc.text(item.description.substring(0, 30), cols.description, y);
      doc.text(item.hsnCode, cols.hsn, y);
      doc.text(String(item.quantity), cols.qty, y);
      doc.text(`Rs. ${item.rate.toFixed(2)}`, cols.rate, y);
      doc.text(`${item.discount}%`, cols.discount, y);
      doc.text(`Rs. ${item.taxableValue.toFixed(2)}`, cols.taxable, y);
      doc.text(`${item.taxRate}%`, cols.tax, y);
      doc.text(`Rs. ${item.total.toFixed(2)}`, cols.total, y);
    });

    doc
      .moveTo(50, tableTop + 25 + invoice.items.length * 25)
      .lineTo(545, tableTop + 25 + invoice.items.length * 25)
      .stroke();
  }

  private drawTotals(
    doc: PDFKit.PDFDocument,
    invoice: IInvoice,
    y: number
  ): void {
    const labelCol = 400;
    const valueCol = 545;

    doc.fontSize(10);

    // Subtotal
    doc.font('Helvetica').text('Subtotal:', labelCol, y);
    doc.text(`Rs. ${invoice.subtotal.toFixed(2)}`, valueCol, y, { align: 'right' });

    // Discount
    if (invoice.discountTotal > 0) {
      doc.text('Discount:', labelCol, y + 15);
      doc.text(`- Rs. ${invoice.discountTotal.toFixed(2)}`, valueCol, y + 15, {
        align: 'right',
      });
    }

    // Taxable value
    doc.text('Total Taxable Value:', labelCol, y + 35);
    doc.text(`Rs. ${invoice.totalTaxableValue.toFixed(2)}`, valueCol, y + 35, {
      align: 'right',
    });

    // CGST
    if (invoice.cgstTotal > 0) {
      doc.text('CGST:', labelCol, y + 55);
      doc.text(`Rs. ${invoice.cgstTotal.toFixed(2)}`, valueCol, y + 55, {
        align: 'right',
      });
    }

    // SGST
    if (invoice.sgstTotal > 0) {
      doc.text('SGST:', labelCol, y + 75);
      doc.text(`Rs. ${invoice.sgstTotal.toFixed(2)}`, valueCol, y + 75, {
        align: 'right',
      });
    }

    // IGST
    if (invoice.igstTotal > 0) {
      doc.text('IGST:', labelCol, y + 55);
      doc.text(`Rs. ${invoice.igstTotal.toFixed(2)}`, valueCol, y + 55, {
        align: 'right',
      });
    }

    // Round off
    if (invoice.roundOff !== 0) {
      doc.text('Round Off:', labelCol, y + 95);
      doc.text(
        `${invoice.roundOff >= 0 ? '' : '- '}Rs. ${Math.abs(invoice.roundOff).toFixed(2)}`,
        valueCol,
        y + 95,
        { align: 'right' }
      );
    }

    // Total
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('TOTAL:', labelCol, y + 120);
    doc.text(`Rs. ${invoice.totalAmount.toFixed(2)}`, valueCol, y + 120, {
      align: 'right',
    });

    // Amount paid/due
    if (invoice.amountPaid > 0) {
      doc.font('Helvetica').fontSize(10);
      doc.text('Amount Paid:', labelCol, y + 145);
      doc.text(`Rs. ${invoice.amountPaid.toFixed(2)}`, valueCol, y + 145, {
        align: 'right',
      });
    }

    if (invoice.amountDue > 0) {
      doc.text('Amount Due:', labelCol, y + 165);
      doc.text(`Rs. ${invoice.amountDue.toFixed(2)}`, valueCol, y + 165, {
        align: 'right',
      });
    }

    // Payment method
    doc.text(`Payment Method: ${invoice.paymentMethod.toUpperCase()}`, 50, y + 145);
  }

  private drawFooter(doc: PDFKit.PDFDocument): void {
    doc
      .moveTo(50, 700)
      .lineTo(545, 700)
      .stroke();

    doc.fontSize(8).font('Helvetica');
    doc.text('This is a computer-generated invoice.', 50, 710, { align: 'center' });
    doc.text('Thank you for your business!', 50, 725, { align: 'center' });
    doc.text('For unknown queries, please contact the salon.', 50, 740, { align: 'center' });
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Get invoice by number
   */
  async getInvoice(invoiceNumber: string): Promise<IInvoice | null> {
    return Invoice.findOne({ invoiceNumber });
  }

  /**
   * Get invoice by transaction ID
   */
  async getInvoiceByTransaction(transactionId: string): Promise<IInvoice | null> {
    return Invoice.findOne({ transactionId });
  }

  /**
   * Get invoices with filtering
   */
  async getInvoices(
    query: InvoiceQuery,
    page: number = 1,
    limit: number = 20
  ): Promise<{ invoices: IInvoice[]; total: number; page: number; totalPages: number }> {
    const filter: unknown = {};

    if (query.invoiceNumber) filter.invoiceNumber = query.invoiceNumber;
    if (query.transactionId) filter.transactionId = query.transactionId;
    if (query.customerId) filter.customerId = query.customerId;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

    if (query.startDate || query.endDate) {
      filter.invoiceDate = {};
      if (query.startDate) filter.invoiceDate.$gte = query.startDate;
      if (query.endDate) filter.invoiceDate.$lte = query.endDate;
    }

    const total = await Invoice.countDocuments(filter);
    const invoices = await Invoice.find(filter)
      .sort({ invoiceDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      invoices,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update invoice payment status
   */
  async updatePaymentStatus(
    invoiceNumber: string,
    status: 'paid' | 'partial' | 'pending'
  ): Promise<IInvoice | null> {
    return Invoice.findOneAndUpdate(
      { invoiceNumber },
      { $set: { paymentStatus: status } },
      { new: true }
    );
  }

  /**
   * Get monthly invoice summary
   */
  async getMonthlySummary(
    year: number,
    month: number
  ): Promise<{
    totalInvoices: number;
    totalAmount: number;
    totalTax: number;
    paidInvoices: number;
    pendingInvoices: number;
    partialInvoices: number;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const invoices = await Invoice.find({
      invoiceDate: { $gte: startDate, $lte: endDate },
    });

    return {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      totalTax: invoices.reduce((sum, inv) => sum + inv.totalTax, 0),
      paidInvoices: invoices.filter((inv) => inv.paymentStatus === 'paid').length,
      pendingInvoices: invoices.filter((inv) => inv.paymentStatus === 'pending').length,
      partialInvoices: invoices.filter((inv) => inv.paymentStatus === 'partial').length,
    };
  }

  /**
   * Void/cancel an invoice
   */
  async voidInvoice(invoiceNumber: string, reason: string): Promise<IInvoice | null> {
    return Invoice.findOneAndUpdate(
      { invoiceNumber, paymentStatus: { $ne: 'refunded' } },
      {
        $set: {
          paymentStatus: 'refunded',
          notes: `Voided: ${reason}`,
        },
      },
      { new: true }
    );
  }
}

export const gstInvoiceService = new GstInvoiceService();
