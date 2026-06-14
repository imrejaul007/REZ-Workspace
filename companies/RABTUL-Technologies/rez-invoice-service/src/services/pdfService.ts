import PDFDocument from 'pdfkit';
import { Invoice, LineItem } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class PDFService {
  private getFontPath(filename: string): string {
    return path.join(__dirname, '../../fonts', filename);
  }

  async generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Invoice ${invoice.invoiceNumber}`,
            Author: invoice.businessName,
            Subject: 'GST Tax Invoice'
          }
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Colors
        const primaryColor = invoice.color || '#2563eb';
        const textColor = '#1f2937';
        const lightGray = '#f3f4f6';
        const borderColor = '#e5e7eb';

        // Header
        this.drawHeader(doc, invoice, primaryColor, textColor);

        // Business and Customer Info
        this.drawAddressSection(doc, invoice, textColor, borderColor);

        // Invoice Details
        this.drawInvoiceDetails(doc, invoice, textColor);

        // Line Items Table
        this.drawLineItemsTable(doc, invoice, primaryColor, textColor, borderColor);

        // Tax Summary
        this.drawTaxSummary(doc, invoice, primaryColor, textColor, borderColor);

        // Amount in Words
        this.drawAmountInWords(doc, invoice, textColor);

        // Bank Details
        if (invoice.bankDetails) {
          this.drawBankDetails(doc, invoice, textColor, borderColor);
        }

        // Notes and Terms
        this.drawNotesAndTerms(doc, invoice, textColor);

        // Footer
        this.drawFooter(doc, invoice, primaryColor);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private drawHeader(doc: PDFKit.PDFDocument, invoice: Invoice, primaryColor: string, textColor: string): void {
    // Company Logo/Name area
    doc.rect(50, 50, 200, 60)
       .fill(primaryColor);

    doc.fillColor('#ffffff')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text(invoice.businessName, 60, 62, { width: 180, align: 'left' });

    doc.fontSize(9)
       .font('Helvetica')
       .text('GST Tax Invoice', 60, 82, { width: 180 });

    // Invoice Title
    const titleX = 350;
    doc.fillColor(textColor)
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('INVOICE', titleX, 50, { align: 'right' });

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Invoice #: ${invoice.invoiceNumber}`, titleX, 82, { align: 'right' })
       .text(`Date: ${this.formatDate(invoice.invoiceDate)}`, titleX, 95, { align: 'right' })
       .text(`Due Date: ${this.formatDate(invoice.dueDate)}`, titleX, 108, { align: 'right' });

    // GST Badge
    if (invoice.businessGstin) {
      doc.fontSize(8)
         .text(`GSTIN: ${invoice.businessGstin}`, titleX, 121, { align: 'right' });
    }
  }

  private drawAddressSection(doc: PDFKit.PDFDocument, invoice: Invoice, textColor: string, borderColor: string): void {
    const startY = 150;

    // From Section
    doc.fillColor(textColor)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('From:', 50, startY);

    doc.font('Helvetica')
       .fontSize(9)
       .text(invoice.businessName, 50, startY + 15);

    const businessAddr = this.formatAddress(invoice.businessAddress);
    doc.text(businessAddr, 50, startY + 28, { width: 200 });

    if (invoice.businessGstin) {
      doc.text(`GSTIN: ${invoice.businessGstin}`, 50, startY + 68);
    }
    if (invoice.businessPan) {
      doc.text(`PAN: ${invoice.businessPan}`, 50, startY + 80);
    }

    // To Section
    doc.font('Helvetica-Bold')
       .text('Bill To:', 300, startY);

    doc.font('Helvetica')
       .fontSize(9)
       .text(invoice.customerName, 300, startY + 15);

    const customerAddr = this.formatAddress(invoice.customerAddress);
    doc.text(customerAddr, 300, startY + 28, { width: 200 });

    if (invoice.customerGstin) {
      doc.text(`GSTIN: ${invoice.customerGstin}`, 300, startY + 68);
    }
    if (invoice.customerPan) {
      doc.text(`PAN: ${invoice.customerPan}`, 300, startY + 80);
    }

    // Place of Supply
    doc.font('Helvetica-Bold')
       .text('Place of Supply:', 50, startY + 100);
    doc.font('Helvetica')
       .text(invoice.placeOfSupply, 140, startY + 100);
  }

  private drawInvoiceDetails(doc: PDFKit.PDFDocument, invoice: Invoice, textColor: string): void {
    const y = 280;

    // Details box
    doc.rect(50, y, 495, 35)
       .fill('#f9fafb');

    const details = [
      { label: 'Invoice Type:', value: this.formatInvoiceType(invoice.type) },
      { label: 'Status:', value: invoice.status.toUpperCase() },
      { label: 'Currency:', value: invoice.currency }
    ];

    if (invoice.reference) {
      details.push({ label: 'Reference:', value: invoice.reference });
    }

    details.forEach((item, i) => {
      const x = 60 + (i * 160);
      doc.fillColor(textColor)
         .fontSize(8)
         .font('Helvetica-Bold')
         .text(item.label, x, y + 5)
         .font('Helvetica')
         .text(item.value, x, y + 18);
    });
  }

  private drawLineItemsTable(
    doc: PDFKit.PDFDocument,
    invoice: Invoice,
    primaryColor: string,
    textColor: string,
    borderColor: string
  ): void {
    const tableTop = 330;
    const tableWidth = 495;
    let y = tableTop;

    // Table Header
    const headers = [
      { label: '#', width: 25 },
      { label: 'Description', width: 130 },
      { label: 'HSN', width: 50 },
      { label: 'Qty', width: 35 },
      { label: 'Unit', width: 35 },
      { label: 'Rate', width: 55 },
      { label: 'Discount', width: 50 },
      { label: 'Taxable', width: 60 },
      { label: 'Tax', width: 45 }
    ];

    // Calculate positions
    let x = 50;
    const positions: number[] = [];
    headers.forEach(h => {
      positions.push(x);
      x += h.width;
    });

    // Header background
    doc.rect(50, y, tableWidth, 25)
       .fill(primaryColor);

    doc.fillColor('#ffffff')
       .fontSize(8)
       .font('Helvetica-Bold');

    headers.forEach((h, i) => {
      doc.text(h.label, positions[i] + 2, y + 8, { width: h.width - 4, align: 'center' });
    });

    y += 25;

    // Table Rows
    doc.fillColor(textColor)
       .font('Helvetica');

    invoice.items.forEach((item, index) => {
      const rowHeight = 20;
      const isAlternate = index % 2 === 0;

      if (isAlternate) {
        doc.rect(50, y, tableWidth, rowHeight).fill('#f9fafb');
      }

      doc.fontSize(8);

      // Sl No
      doc.text((index + 1).toString(), positions[0], y + 6, { width: headers[0].width, align: 'center' });

      // Description
      doc.text(item.description, positions[1] + 2, y + 4, { width: headers[1].width - 4 });

      // HSN
      doc.text(item.hsnCode, positions[2], y + 6, { width: headers[2].width, align: 'center' });

      // Qty
      doc.text(item.quantity.toString(), positions[3], y + 6, { width: headers[3].width, align: 'right' });

      // Unit
      doc.text(item.unit, positions[4], y + 6, { width: headers[4].width, align: 'center' });

      // Rate
      doc.text(this.formatCurrency(item.rate), positions[5], y + 6, { width: headers[5].width, align: 'right' });

      // Discount
      const discountText = item.discountPercent
        ? `${item.discountPercent}%`
        : (item.discount ? this.formatCurrency(item.discount) : '-');
      doc.text(discountText, positions[6], y + 6, { width: headers[6].width, align: 'right' });

      // Taxable Value
      doc.text(this.formatCurrency(item.taxableValue), positions[7], y + 6, { width: headers[7].width, align: 'right' });

      // Tax
      const taxAmount = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0) + (item.cessAmount || 0);
      doc.text(this.formatCurrency(taxAmount), positions[8], y + 6, { width: headers[8].width, align: 'right' });

      y += rowHeight;

      // Border line
      doc.moveTo(50, y).lineTo(545, y).stroke(borderColor);
    });

    // Subtotal section before total
    y += 10;
    doc.rect(50, y, tableWidth, 80).stroke(borderColor);

    const subtotalX = 350;
    const valueX = 480;

    doc.fontSize(9)
       .font('Helvetica');

    doc.text('Subtotal:', subtotalX, y + 10);
    doc.text(this.formatCurrency(invoice.subtotal), valueX, y + 10, { width: 60, align: 'right' });

    doc.text('Total Discount:', subtotalX, y + 25);
    doc.text(`-${this.formatCurrency(invoice.totalDiscount)}`, valueX, y + 25, { width: 60, align: 'right' });

    doc.text('Taxable Value:', subtotalX, y + 40);
    doc.text(this.formatCurrency(invoice.taxableValue), valueX, y + 40, { width: 60, align: 'right' });

    doc.text('Total Tax:', subtotalX, y + 55);
    doc.text(this.formatCurrency(invoice.totalTax), valueX, y + 55, { width: 60, align: 'right' });

    // Grand Total
    y += 90;
    doc.rect(50, y, tableWidth, 30).fill(primaryColor);

    doc.fillColor('#ffffff')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('TOTAL:', subtotalX, y + 8);

    doc.text(this.formatCurrency(invoice.totalAmount), valueX, y + 8, { width: 60, align: 'right' });
  }

  private drawTaxSummary(
    doc: PDFKit.PDFDocument,
    invoice: Invoice,
    primaryColor: string,
    textColor: string,
    borderColor: string
  ): void {
    const y = 580;

    doc.rect(350, y, 195, 70)
       .stroke(borderColor);

    doc.fillColor(textColor)
       .fontSize(8)
       .font('Helvetica-Bold')
       .text('Tax Breakdown', 355, y + 5);

    doc.font('Helvetica')
       .fontSize(8);

    let lineY = y + 18;
    const isInterState = invoice.taxBreakup.igstTotal > 0;

    if (isInterState) {
      doc.text('IGST:', 355, lineY);
      doc.text(this.formatCurrency(invoice.taxBreakup.igstTotal), 500, lineY, { width: 40, align: 'right' });
      lineY += 12;
    } else {
      doc.text('CGST:', 355, lineY);
      doc.text(this.formatCurrency(invoice.taxBreakup.cgstTotal), 500, lineY, { width: 40, align: 'right' });
      lineY += 12;

      doc.text('SGST:', 355, lineY);
      doc.text(this.formatCurrency(invoice.taxBreakup.sgstTotal), 500, lineY, { width: 40, align: 'right' });
      lineY += 12;
    }

    if (invoice.taxBreakup.cessTotal > 0) {
      doc.text('Cess:', 355, lineY);
      doc.text(this.formatCurrency(invoice.taxBreakup.cessTotal), 500, lineY, { width: 40, align: 'right' });
    }

    // Round Off
    if (invoice.roundOff !== 0) {
      lineY += 12;
      doc.text('Round Off:', 355, lineY);
      doc.text(this.formatCurrency(invoice.roundOff), 500, lineY, { width: 40, align: 'right' });
    }
  }

  private drawAmountInWords(doc: PDFKit.PDFDocument, invoice: Invoice, textColor: string): void {
    const y = 665;

    doc.rect(50, y, 290, 40)
       .stroke('#e5e7eb');

    doc.fillColor(textColor)
       .fontSize(8)
       .font('Helvetica-Bold')
       .text('Amount in Words:', 55, y + 5);

    doc.font('Helvetica')
       .fontSize(9)
       .text(`${invoice.currency} ${invoice.amountInWords} Only`, 55, y + 18);
  }

  private drawBankDetails(
    doc: PDFKit.PDFDocument,
    invoice: Invoice,
    textColor: string,
    borderColor: string
  ): void {
    const y = 720;
    const bd = invoice.bankDetails;

    if (!bd) return;

    doc.rect(50, y, 290, 65)
       .stroke(borderColor);

    doc.fillColor(textColor)
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('Bank Details', 55, y + 5);

    doc.font('Helvetica')
       .fontSize(8);

    let lineY = y + 18;

    if (bd.bankName) {
      doc.text(`Bank: ${bd.bankName}`, 55, lineY);
      lineY += 11;
    }
    if (bd.branch) {
      doc.text(`Branch: ${bd.branch}`, 55, lineY);
      lineY += 11;
    }
    if (bd.accountNumber) {
      doc.text(`A/C No: ${bd.accountNumber}`, 55, lineY);
      lineY += 11;
    }
    if (bd.ifscCode) {
      doc.text(`IFSC: ${bd.ifscCode}`, 55, lineY);
      lineY += 11;
    }
    if (bd.upiId) {
      doc.text(`UPI: ${bd.upiId}`, 55, lineY);
    }
  }

  private drawNotesAndTerms(doc: PDFKit.PDFDocument, invoice: Invoice, textColor: string): void {
    const y = 720;
    const x = 360;

    doc.fillColor(textColor)
       .fontSize(8)
       .font('Helvetica-Bold')
       .text('Notes', x, y);

    doc.font('Helvetica')
       .fontSize(7);

    if (invoice.notes) {
      doc.text(invoice.notes, x, y + 12, { width: 180 });
    }

    if (invoice.terms) {
      doc.font('Helvetica-Bold')
         .text('Terms & Conditions', x, y + 45);
      doc.font('Helvetica')
         .text(invoice.terms, x, y + 57, { width: 180 });
    }
  }

  private drawFooter(doc: PDFKit.PDFDocument, invoice: Invoice, primaryColor: string): void {
    const pageHeight = doc.page.height;

    doc.rect(50, pageHeight - 60, 495, 50)
       .fill('#f9fafb');

    doc.fillColor(primaryColor)
       .fontSize(8)
       .font('Helvetica-Bold')
       .text('Thank you for your business!', 50, pageHeight - 50, { align: 'center' });

    doc.fillColor('#6b7280')
       .fontSize(7)
       .font('Helvetica')
       .text(
         `${invoice.businessName} | ${invoice.businessAddress.line1}, ${invoice.businessAddress.city}`,
         50,
         pageHeight - 35,
         { align: 'center', width: 495 }
       )
       .text(
         `This is a computer-generated invoice. For queries, contact us at ${invoice.businessAddress.email || 'support@company.com'}`,
         50,
         pageHeight - 23,
         { align: 'center', width: 495 }
       );

    // Page number
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.fillColor('#9ca3af')
         .fontSize(7)
         .text(`Page ${i + 1} of ${totalPages}`, 50, pageHeight - 15, { align: 'center', width: 495 });
    }
  }

  private formatAddress(addr: any): string {
    const parts = [
      addr.line1,
      addr.line2,
      addr.city,
      addr.state,
      addr.postalCode,
      addr.country
    ].filter(Boolean);
    return parts.join(', ');
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  private formatCurrency(amount: number): string {
    return `Rs. ${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  private formatInvoiceType(type: string): string {
    const types: Record<string, string> = {
      'tax_invoice': 'Tax Invoice',
      'bill_of_supply': 'Bill of Supply',
      'receipt': 'Receipt',
      'credit_note': 'Credit Note',
      'debit_note': 'Debit Note'
    };
    return types[type] || type;
  }

  async savePDF(invoice: Invoice, outputPath: string): Promise<string> {
    const pdfBuffer = await this.generateInvoicePDF(invoice);

    // Whitelist validation - extract only the filename
    const filename = path.basename(outputPath);
    if (!/^[a-zA-Z0-9_-]+\.pdf$/i.test(filename)) {
      throw new Error('Invalid filename characters');
    }

    // Restrict to allowed directory only
    const allowedDir = path.join(process.cwd(), 'generated-pdfs');
    const absolutePath = path.join(allowedDir, filename);

    // Verify resolved path is within allowed directory (prevents path traversal)
    const resolved = path.resolve(absolutePath);
    const allowedResolved = path.resolve(allowedDir);
    if (!resolved.startsWith(allowedResolved)) {
      throw new Error('Path outside allowed directory');
    }

    // Ensure the allowed directory exists
    if (!fs.existsSync(allowedDir)) {
      fs.mkdirSync(allowedDir, { recursive: true });
    }

    fs.writeFileSync(absolutePath, pdfBuffer);
    return absolutePath;
  }
}

export const pdfService = new PDFService();
