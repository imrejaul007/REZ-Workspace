import PDFDocument from 'pdfkit';
import { IInvoice } from '../models/Invoice';
import { numberToWords } from './gstCalculator';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

interface PDFOptions {
  logoBase64?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

class PDFGeneratorService {
  /**
   * Generate GST-compliant invoice PDF
   */
  async generateInvoicePDF(invoice: IInvoice, options: PDFOptions = {}): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `Invoice ${invoice.invoiceNumber}`,
            Author: options.companyName || 'BIZORA',
            Subject: 'GST Invoice'
          }
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          logger.info('PDF generated successfully', {
            invoiceNumber: invoice.invoiceNumber,
            size: pdfBuffer.length
          });
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Draw PDF content
        this.drawHeader(doc, invoice, options);
        this.drawInvoiceInfo(doc, invoice);
        this.drawAddresses(doc, invoice);
        this.drawLineItemsTable(doc, invoice);
        this.drawTaxSummary(doc, invoice);
        this.drawTotals(doc, invoice);
        this.drawBankDetails(doc, invoice);
        this.drawTermsAndConditions(doc, invoice);
        this.drawFooter(doc);

        doc.end();
      } catch (error) {
        logger.error('Error generating PDF:', error);
        reject(error);
      }
    });
  }

  private drawHeader(doc: PDFKit.PDFDocument, invoice: IInvoice, options: PDFOptions): void {
    const pageWidth = doc.page.width - 80;

    // Company name / Logo area
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text(options.companyName || 'BIZORA', 40, 40, { align: 'left' });

    // TAX INVOICE title
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('TAX INVOICE', 0, 35, { align: 'center' });

    // Invoice number and date on right
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#333333')
      .text(`Invoice No: ${invoice.invoiceNumber}`, 400, 45, { align: 'right', width: 170 })
      .text(`Date: ${this.formatDate(invoice.invoiceDate)}`, 400, 58, { align: 'right', width: 170 })
      .text(`Due Date: ${this.formatDate(invoice.dueDate)}`, 400, 71, { align: 'right', width: 170 });

    // Horizontal line
    doc
      .strokeColor('#1a365d')
      .lineWidth(2)
      .moveTo(40, 90)
      .lineTo(pageWidth + 40, 90)
      .stroke();

    // Status badge
    const statusColors: Record<string, string> = {
      draft: '#6b7280',
      sent: '#3b82f6',
      paid: '#10b981',
      overdue: '#ef4444',
      cancelled: '#9ca3af'
    };

    const statusColor = statusColors[invoice.status] || '#6b7280';
    const statusText = invoice.status.toUpperCase();

    doc
      .fontSize(8)
      .fillColor(statusColor)
      .text(statusText, 400, 85, { align: 'right', width: 170 });

    // Place of Supply
    doc
      .fontSize(10)
      .fillColor('#333333')
      .text(`Place of Supply: ${invoice.placeOfSupply}`, 40, 95);
  }

  private drawInvoiceInfo(doc: PDFKit.PDFDocument, invoice: IInvoice): void {
    const yPos = 115;

    // Reverse Charge indicator
    if (invoice.reverseCharge) {
      doc
        .fontSize(9)
        .fillColor('#dc2626')
        .text('* Reverse Charge Applicable', 40, yPos);
    }

    doc.moveDown(1);
  }

  private drawAddresses(doc: PDFKit.PDFDocument, invoice: IInvoice): void {
    const startY = 125;
    const col1X = 40;
    const col2X = 320;
    const boxWidth = 260;

    // Seller Address Box
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('Bill From (Seller):', col1X, startY);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text(invoice.seller.businessName, col1X, startY + 15);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`GSTIN: ${invoice.seller.gstin}`, col1X, startY + 30)
      .text(invoice.seller.address, col1X, startY + 45)
      .text(`${invoice.seller.state} (State Code: ${invoice.seller.stateCode})`, col1X, startY + 65);

    // Buyer Address Box
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('Bill To (Buyer):', col2X, startY);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text(invoice.buyer.businessName, col2X, startY + 15);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`GSTIN: ${invoice.buyer.gstin}`, col2X, startY + 30)
      .text(invoice.buyer.address, col2X, startY + 45)
      .text(`${invoice.buyer.state} (State Code: ${invoice.buyer.stateCode})`, col2X, startY + 65);
  }

  private drawLineItemsTable(doc: PDFKit.PDFDocument, invoice: IInvoice): void {
    const startY = 210;
    const pageWidth = doc.page.width - 80;

    // Table header
    const headers = [
      { label: 'Sr No', x: 40, width: 30 },
      { label: 'Description', x: 70, width: 150 },
      { label: 'HSN', x: 220, width: 60 },
      { label: 'Qty', x: 280, width: 40 },
      { label: 'Rate', x: 320, width: 60 },
      { label: 'Amount', x: 380, width: 70 },
      { label: 'Tax', x: 450, width: 50 },
      { label: 'Total', x: 500, width: 70 }
    ];

    // Draw header background
    doc
      .rect(40, startY, pageWidth, 20)
      .fill('#1a365d');

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#ffffff');

    headers.forEach(header => {
      doc.text(header.label, header.x, startY + 6, { width: header.width });
    });

    // Table rows
    let rowY = startY + 20;
    const rowHeight = 18;

    invoice.lineItems.forEach((item, index) => {
      // Alternate row colors
      const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';

      doc
        .rect(40, rowY, pageWidth, rowHeight)
        .fill(bgColor);

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#333333');

      const taxInfo = invoice.totalIgst > 0
        ? `IGST ${item.igstRate?.toFixed(0) || 0}%`
        : `CGST ${item.cgstRate?.toFixed(0) || 0}% + SGST ${item.sgstRate?.toFixed(0) || 0}%`;

      doc.text(String(index + 1), 40, rowY + 5, { width: 30 });
      doc.text(item.description.substring(0, 30), 70, rowY + 5, { width: 150 });
      doc.text(item.hsnCode || 'N/A', 220, rowY + 5, { width: 60 });
      doc.text(String(item.quantity), 280, rowY + 5, { width: 40 });
      doc.text(this.formatCurrency(item.unitPrice), 320, rowY + 5, { width: 60 });
      doc.text(this.formatCurrency(item.taxableAmount), 380, rowY + 5, { width: 70 });
      doc.text(taxInfo, 450, rowY + 5, { width: 50 });
      doc.text(this.formatCurrency(item.total), 500, rowY + 5, { width: 70 });

      rowY += rowHeight;
    });

    // Draw table borders
    doc
      .strokeColor('#e5e7eb')
      .lineWidth(0.5)
      .rect(40, startY, pageWidth, rowY - startY)
      .stroke();

    // Table header border
    doc
      .rect(40, startY, pageWidth, 20)
      .stroke();
  }

  private drawTaxSummary(doc: PDFKit.PDFDocument, invoice: IInvoice): void {
    const startY = doc.y + 20;
    const pageWidth = doc.page.width - 80;

    // Tax breakdown
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('Tax Summary:', 40, startY);

    let yPos = startY + 15;

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#333333');

    // Subtotal
    doc.text('Subtotal:', 400, yPos);
    doc.text(this.formatCurrency(invoice.subtotal), 500, yPos, { width: 70 });

    // Discount
    if (invoice.totalDiscount > 0) {
      yPos += 15;
      doc.text('Discount:', 400, yPos);
      doc.text(`-${this.formatCurrency(invoice.totalDiscount)}`, 500, yPos, { width: 70 });
    }

    // Taxable amount
    yPos += 15;
    doc.text('Total Taxable Amount:', 400, yPos);
    doc.text(this.formatCurrency(invoice.totalTaxableAmount), 500, yPos, { width: 70 });

    // CGST
    if (invoice.totalCgst > 0) {
      yPos += 15;
      doc.text(`CGST (${(invoice.totalCgst / invoice.totalTaxableAmount * 100 / 2).toFixed(1) || 0}%):`, 400, yPos);
      doc.text(this.formatCurrency(invoice.totalCgst), 500, yPos, { width: 70 });
    }

    // SGST
    if (invoice.totalSgst > 0) {
      yPos += 15;
      doc.text(`SGST (${(invoice.totalSgst / invoice.totalTaxableAmount * 100 / 2).toFixed(1) || 0}%):`, 400, yPos);
      doc.text(this.formatCurrency(invoice.totalSgst), 500, yPos, { width: 70 });
    }

    // IGST
    if (invoice.totalIgst > 0) {
      yPos += 15;
      doc.text(`IGST (${(invoice.totalIgst / invoice.totalTaxableAmount * 100).toFixed(1) || 0}%):`, 400, yPos);
      doc.text(this.formatCurrency(invoice.totalIgst), 500, yPos, { width: 70 });
    }

    // Total Tax
    yPos += 15;
    doc.text('Total Tax:', 400, yPos);
    doc.text(this.formatCurrency(invoice.totalTaxAmount), 500, yPos, { width: 70 });

    doc.y = yPos + 10;
  }

  private drawTotals(doc: PDFKit.PDFDocument, invoice: IInvoice): void {
    const startY = doc.y;
    const pageWidth = doc.page.width - 80;

    // Grand Total box
    doc
      .rect(40, startY, pageWidth, 45)
      .fill('#1a365d');

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text('GRAND TOTAL:', 50, startY + 15);

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text(this.formatCurrency(invoice.grandTotal), 350, startY + 10);

    // Amount in words
    doc.y = startY + 50;
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#333333')
      .text(`Amount in Words: ${invoice.totalInWords}`, 40, doc.y);

    doc.y += 20;
  }

  private drawBankDetails(doc: PDFKit.PDFDocument, invoice: IInvoice): void {
    const startY = doc.y;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('Bank Details:', 40, startY);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#666666')
      .text('Bank Name: As per company records', 40, startY + 15)
      .text('Account Number: XXXXXXXXXXX', 40, startY + 28)
      .text('IFSC Code: XXXXX0000', 40, startY + 41);

    // Payment details if available
    if (invoice.paymentDetails) {
      doc
        .text(`Payment Method: ${invoice.paymentDetails.paymentMethod || 'N/A'}`, 200, startY + 15)
        .text(`Transaction ID: ${invoice.paymentDetails.transactionId || 'N/A'}`, 200, startY + 28);

      if (invoice.paymentDetails.paymentDate) {
        doc.text(`Payment Date: ${this.formatDate(invoice.paymentDetails.paymentDate)}`, 200, startY + 41);
      }
    }

    doc.y = startY + 60;
  }

  private drawTermsAndConditions(doc: PDFKit.PDFDocument, invoice: IInvoice): void {
    const startY = doc.y;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('Terms & Conditions:', 40, startY);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        invoice.terms || '1. Payment due within 30 days.\n2. Interest @ 18% p.a. will be charged on overdue payments.\n3. Subject to jurisdiction.',
        40,
        startY + 12,
        { width: 350, lineGap: 2 }
      );

    // Notes
    if (invoice.notes) {
      doc
        .text('Notes:', 400, startY)
        .text(invoice.notes, 400, startY + 12, { width: 170 });
    }

    doc.y = startY + 80;
  }

  private drawFooter(doc: PDFKit.PDFDocument): void {
    const pageHeight = doc.page.height - 60;

    doc
      .strokeColor('#1a365d')
      .lineWidth(1)
      .moveTo(40, pageHeight)
      .lineTo(doc.page.width - 40, pageHeight)
      .stroke();

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text('This is a computer-generated invoice.', 40, pageHeight + 10, { align: 'center', width: doc.page.width - 80 })
      .text('Generated by BIZORA Invoice Generator', 40, pageHeight + 22, { align: 'center', width: doc.page.width - 80 });
  }

  private formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}

export const pdfGeneratorService = new PDFGeneratorService();
export default pdfGeneratorService;
