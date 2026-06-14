import PDFDocument from 'pdfkit';
import { IQuote } from '../models/Quote';

class PdfGenerator {
  async generateQuotePDF(quote: IQuote): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({ margin: 50 });

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('QUOTATION', 50, 50, { align: 'right' });
        doc.moveDown(0.5);

        // Quote details box
        doc.fontSize(10).font('Helvetica');
        doc.text(`Quote #: ${quote.quoteNumber}`, 50, 85);
        doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, 50, 100);
        doc.text(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}`, 50, 115);
        doc.text(`Status: ${quote.status.toUpperCase()}`, 50, 130);

        // Company header
        doc.fontSize(18).font('Helvetica-Bold').text('BIZORA', 50, 50);
        doc.fontSize(10).font('Helvetica').text('CorpPerks HRMS Platform', 50, 70);

        // Customer details
        doc.moveDown(2);
        doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, 180);
        doc.fontSize(10).font('Helvetica');
        doc.text(quote.customerName, 50, 200);
        if (quote.customerCompany) doc.text(quote.customerCompany, 50, 215);
        if (quote.customerEmail) doc.text(quote.customerEmail, 50, 230);
        if (quote.customerPhone) doc.text(quote.customerPhone, 50, 245);
        if (quote.customerAddress) doc.text(quote.customerAddress, 50, 260);

        // Quote title
        doc.moveDown(5);
        doc.fontSize(16).font('Helvetica-Bold').text(quote.title, 50);
        if (quote.description) {
          doc.moveDown(0.5);
          doc.fontSize(10).font('Helvetica').text(quote.description, { width: 500 });
        }

        // Line items table header
        const tableTop = doc.y + 30;
        const tableHeaders = ['Description', 'Qty', 'Unit Price', 'Discount', 'Total'];
        const colWidths = [220, 50, 80, 60, 80];
        let xPos = 50;

        // Header background
        doc.rect(50, tableTop - 5, 500, 20).fill('#f0f0f0');
        doc.fill('#000000');

        doc.fontSize(9).font('Helvetica-Bold');
        tableHeaders.forEach((header, i) => {
          doc.text(header, xPos, tableTop, { width: colWidths[i], align: i === 0 ? 'left' : 'right' });
          xPos += colWidths[i];
        });

        // Line items
        let yPos = tableTop + 25;
        doc.font('Helvetica');

        quote.lineItems.forEach((item, index) => {
          if (yPos > 650) {
            doc.addPage();
            yPos = 50;
          }

          xPos = 50;
          const rowData = [
            item.description,
            item.quantity.toString(),
            `₹${item.unitPrice.toLocaleString()}`,
            item.discount ? `${item.discount}%` : '-',
            `₹${item.total.toLocaleString()}`
          ];

          rowData.forEach((cell, i) => {
            doc.text(cell, xPos, yPos, { width: colWidths[i], align: i === 0 ? 'left' : 'right' });
            xPos += colWidths[i];
          });

          yPos += 20;
        });

        // Totals section
        yPos += 20;
        const totalsX = 400;
        const valuesX = 500;

        doc.fontSize(10).font('Helvetica');
        doc.text('Subtotal:', totalsX, yPos, { align: 'left' });
        doc.text(`₹${quote.subtotal.toLocaleString()}`, valuesX, yPos, { align: 'right', width: 80 });

        if (quote.discount && quote.discount > 0) {
          yPos += 18;
          doc.text('Discount:', totalsX, yPos, { align: 'left' });
          doc.text(`-₹${quote.discount.toLocaleString()}`, valuesX, yPos, { align: 'right', width: 80 });
        }

        yPos += 18;
        doc.text(`Tax (${quote.taxRate || 18}%):`, totalsX, yPos, { align: 'left' });
        doc.text(`₹${(quote.taxAmount || 0).toLocaleString()}`, valuesX, yPos, { align: 'right', width: 80 });

        yPos += 25;
        doc.rect(totalsX - 10, yPos - 5, 140, 25).fill('#2c3e50');
        doc.fill('#ffffff');
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('TOTAL:', totalsX, yPos, { align: 'left' });
        doc.text(`${quote.currency || 'INR'} ${quote.totalAmount.toLocaleString()}`, valuesX, yPos, { align: 'right', width: 80 });

        // Notes and terms
        doc.fill('#000000');
        yPos += 50;
        doc.fontSize(10).font('Helvetica-Bold').text('Notes:', 50, yPos);
        doc.font('Helvetica').text(quote.notes || 'Payment due within 30 days of invoice date.', 50, yPos + 15, { width: 500 });

        yPos += 50;
        doc.fontSize(10).font('Helvetica-Bold').text('Terms & Conditions:', 50, yPos);
        doc.font('Helvetica').fontSize(9).text(
          quote.terms || '1. This quote is valid for 30 days from the date of issue.\n2. Prices are exclusive of applicable taxes.\n3. Payment terms: Net 30 days.\n4. Delivery: Within 5-7 business days after order confirmation.',
          50,
          yPos + 15,
          { width: 500 }
        );

        // Footer
        doc.fontSize(8).font('Helvetica');
        doc.text(
          'Generated by BIZORA - CorpPerks HRMS Platform',
          50,
          750,
          { align: 'center', width: 500 }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const pdfGenerator = new PdfGenerator();