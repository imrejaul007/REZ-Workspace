import PDFDocument from 'pdfkit';
import { IContract, IContractParty, IContractClause } from '../models/Contract.js';

export interface PDFGenerationOptions {
  includeSignatureFields?: boolean;
  includeQRCode?: boolean;
  companyLogo?: string;
 primaryColor?: string;
}

export class PDFGenerator {
  private defaultOptions: PDFGenerationOptions = {
    includeSignatureFields: true,
    includeQRCode: false,
    primaryColor: '#1a365d'
  };

  /**
   * Generate contract PDF
   */
  async generateContractPDF(
    contract: IContract,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    const opts = { ...this.defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true
      });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      this.addHeader(doc, contract, opts);

      // Contract Info
      this.addContractInfo(doc, contract);

      // Parties Section
      this.addPartiesSection(doc, contract);

      // Clauses Section
      this.addClausesSection(doc, contract);

      // Terms Section
      if (contract.terms) {
        this.addTermsSection(doc, contract);
      }

      // Signature Section
      if (opts.includeSignatureFields) {
        this.addSignatureSection(doc, contract);
      }

      // Footer
      this.addFooter(doc);

      doc.end();
    });
  }

  private addHeader(doc: PDFKit.PDFDocument, contract: IContract, opts: PDFGenerationOptions): void {
    // Company name
    doc.fontSize(20)
      .fillColor(opts.primaryColor || '#1a365d')
      .text('BIZORA', { align: 'center' })
      .moveDown(0.3);

    doc.fontSize(10)
      .fillColor('#666666')
      .text('Contract Management System', { align: 'center' })
      .moveDown(1);

    // Horizontal line
    doc.strokeColor(opts.primaryColor || '#1a365d')
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke()
      .moveDown(1);
  }

  private addContractInfo(doc: PDFKit.PDFDocument, contract: IContract): void {
    doc.fontSize(16)
      .fillColor('#1a365d')
      .text(contract.title, { align: 'center' })
      .moveDown(0.5);

    doc.fontSize(10)
      .fillColor('#333333');

    const info = [
      ['Contract Number:', contract.contractNumber],
      ['Type:', contract.type.toUpperCase()],
      ['Status:', contract.status.toUpperCase()],
      ['Start Date:', contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'N/A'],
      ['End Date:', contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'N/A']
    ];

    if (contract.value) {
      info.push(['Contract Value:', `${contract.currency || 'INR'} ${contract.value.toLocaleString()}`]);
    }

    const startX = 50;
    let y = doc.y;

    info.forEach(([label, value]) => {
      doc.fontSize(10)
        .fillColor('#666666')
        .text(label, startX, y, { width: 150 });
      doc.fillColor('#333333')
        .text(value, startX + 150, y, { width: 345 });
      y += 18;
    });

    doc.moveDown(1);
  }

  private addPartiesSection(doc: PDFKit.PDFDocument, contract: IContract): void {
    doc.fontSize(12)
      .fillColor('#1a365d')
      .text('PARTIES', { underline: true })
      .moveDown(0.5);

    contract.parties.forEach((party, index) => {
      doc.fontSize(11)
        .fillColor('#1a365d')
        .text(`Party ${index + 1}: ${party.name}`, { continued: false })
        .moveDown(0.3);

      doc.fontSize(10)
        .fillColor('#333333');

      const partyInfo = [
        ['Email:', party.email],
        ['Phone:', party.phone || 'N/A'],
        ['Company:', party.company || 'N/A'],
        ['Address:', party.address || 'N/A']
      ];

      let y = doc.y;
      partyInfo.forEach(([label, value]) => {
        doc.fillColor('#666666')
          .text(label, 70, y, { width: 80 });
        doc.fillColor('#333333')
          .text(value, 150, y, { width: 395 });
        y += 16;
      });

      if (party.signedAt) {
        doc.fillColor('#22c55e')
          .text(`Signed on: ${new Date(party.signedAt).toLocaleString()}`, 70, y);
      }

      doc.moveDown(0.5);
    });

    doc.moveDown(0.5);
  }

  private addClausesSection(doc: PDFKit.PDFDocument, contract: IContract): void {
    if (!contract.clauses || contract.clauses.length === 0) return;

    doc.fontSize(12)
      .fillColor('#1a365d')
      .text('TERMS AND CONDITIONS', { underline: true })
      .moveDown(0.5);

    contract.clauses
      .sort((a, b) => a.order - b.order)
      .forEach((clause, index) => {
        // Check if we need a new page
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(11)
          .fillColor('#1a365d')
          .text(`${index + 1}. ${clause.title}`, { continued: false })
          .moveDown(0.3);

        doc.fontSize(10)
          .fillColor('#333333')
          .text(clause.content, { align: 'justify', indent: 20 })
          .moveDown(0.5);
      });

    doc.moveDown(0.5);
  }

  private addTermsSection(doc: PDFKit.PDFDocument, contract: IContract): void {
    if (doc.y > 600) {
      doc.addPage();
    }

    doc.fontSize(12)
      .fillColor('#1a365d')
      .text('ADDITIONAL TERMS', { underline: true })
      .moveDown(0.5);

    doc.fontSize(10)
      .fillColor('#333333')
      .text(contract.terms, { align: 'justify' })
      .moveDown(1);
  }

  private addSignatureSection(doc: PDFKit.PDFDocument, contract: IContract): void {
    if (doc.y > 500) {
      doc.addPage();
    }

    doc.fontSize(12)
      .fillColor('#1a365d')
      .text('SIGNATURES', { underline: true })
      .moveDown(1);

    const signatureWidth = 220;
    const startX = 50;

    contract.parties.forEach((party, index) => {
      const x = startX + (index * (signatureWidth + 30));

      // Signature box
      doc.strokeColor('#cccccc')
        .lineWidth(1)
        .rect(x, doc.y, signatureWidth, 80)
        .stroke();

      doc.fontSize(10)
        .fillColor('#1a365d')
        .text(party.name, x, doc.y + 5, { width: signatureWidth, align: 'center' });

      doc.fillColor('#666666')
        .text('Signature:', x, doc.y + 25, { width: signatureWidth, align: 'center' });

      if (party.signature) {
        doc.fontSize(8)
          .fillColor('#22c55e')
          .text('SIGNED', x, doc.y + 50, { width: signatureWidth, align: 'center' });
      } else {
        doc.fontSize(8)
          .fillColor('#ef4444')
          .text('PENDING', x, doc.y + 50, { width: signatureWidth, align: 'center' });
      }

      doc.fontSize(8)
        .fillColor('#666666')
        .text('Date: _______________', x, doc.y + 65, { width: signatureWidth, align: 'center' });
    });

    doc.moveDown(4);
  }

  private addFooter(doc: PDFKit.PDFDocument): void {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      doc.fontSize(8)
        .fillColor('#999999')
        .text(
          `Page ${i + 1} of ${range.count}`,
          50,
          750,
          { align: 'center', width: 495 }
        )
        .text(
          `Generated on ${new Date().toLocaleString()}`,
          50,
          765,
          { align: 'center', width: 495 }
        );
    }
  }
}

export const pdfGenerator = new PDFGenerator();
