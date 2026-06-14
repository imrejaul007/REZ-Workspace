import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { IAgreement } from '../models/agreement.model.js';
import { PDFGenerationError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { config } from '../config/index.js';

export class PDFService {
  private readonly storagePath: string;

  constructor() {
    this.storagePath = config.pdfStoragePath || './storage/pdfs';
    this.ensureStorageDirectory();
  }

  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * Generate PDF for agreement
   */
  async generateAgreementPdf(agreement: IAgreement): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          info: {
            Title: `Agreement ${agreement.agreementId}`,
            Author: config.company.name,
            Subject: `Property Agreement - ${agreement.type}`,
            Keywords: 'agreement, property, real estate',
            Creator: 'RisnaEstate Agreement Service',
            Producer: 'RisnaEstate'
          }
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add content
        this.addHeader(doc, agreement);
        this.addPropertyDetails(doc, agreement);
        this.addParties(doc, agreement);
        this.addPriceDetails(doc, agreement);
        this.addTermsAndConditions(doc, agreement);
        this.addSpecialConditions(doc, agreement);
        this.addPaymentSchedule(doc, agreement);
        this.addSignatureBlocks(doc, agreement);
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        logger.error('PDF generation failed', { error, agreementId: agreement.agreementId });
        reject(new PDFGenerationError('Failed to generate PDF'));
      }
    });
  }

  private addHeader(doc: PDFKit.PDFDocument, agreement: IAgreement): void {
    // Company header
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(config.company.name, { align: 'center' })
      .moveDown(0.3);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(config.company.address, { align: 'center' })
      .text(`Phone: ${config.company.phone} | Email: ${config.company.email}`, { align: 'center' })
      .moveDown(0.5);

    // Horizontal line
    doc
      .strokeColor('#000000')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke()
      .moveDown(0.5);

    // Agreement title
    const title = this.getAgreementTitle(agreement.type);
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(title.toUpperCase(), { align: 'center' })
      .moveDown(0.3);

    doc
      .fontSize(10)
      .text(`Agreement ID: ${agreement.agreementId}`, { align: 'center' })
      .moveDown(0.5);

    // Agreement date
    const agreementDate = new Date(agreement.agreementDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`This Agreement is made on ${agreementDate}`, { align: 'center' })
      .moveDown(1);
  }

  private addPropertyDetails(doc: PDFKit.PDFDocument, agreement: IAgreement): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('PROPERTY DETAILS', { underline: true })
      .moveDown(0.3);

    doc
      .fontSize(10)
      .font('Helvetica');

    const propertyTypeLabel = agreement.propertyType.charAt(0).toUpperCase() +
      agreement.propertyType.slice(1);

    const details = [
      `Property Type: ${propertyTypeLabel}`,
      `Address: ${agreement.propertyAddress}`,
      `Area: ${agreement.propertyArea} ${agreement.propertyAreaUnit.toUpperCase()}`
    ];

    details.forEach(detail => {
      doc.text(detail);
    });

    doc.moveDown(1);
  }

  private addParties(doc: PDFKit.PDFDocument, agreement: IAgreement): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('PARTIES TO THIS AGREEMENT', { underline: true })
      .moveDown(0.3);

    doc.fontSize(10).font('Helvetica');

    const parties = [
      { role: 'BUYER', id: agreement.buyerId },
      { role: 'SELLER', id: agreement.sellerId },
      { role: 'BROKER', id: 'Broker' }
    ];

    parties.forEach((party, index) => {
      doc
        .font('Helvetica-Bold')
        .text(`${index + 1}. ${party.role}:`)
        .font('Helvetica')
        .text(`   ${party.id}`)
        .moveDown(0.3);
    });

    doc.moveDown(1);
  }

  private addPriceDetails(doc: PDFKit.PDFDocument, agreement: IAgreement): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('PRICE AND PAYMENT DETAILS', { underline: true })
      .moveDown(0.3);

    doc.fontSize(10).font('Helvetica');

    const priceDetails = [
      ['Total Sale Consideration:', `Rs. ${agreement.saleConsideration.toLocaleString('en-IN')}`],
      ['Total Price:', `Rs. ${agreement.totalPrice.toLocaleString('en-IN')}`],
      ['Token Amount:', `Rs. ${agreement.tokenAmount.toLocaleString('en-IN')}`],
      ['Stamp Duty:', `Rs. ${agreement.stampDuty.toLocaleString('en-IN')}`],
      ['GST:', `Rs. ${agreement.gst.toLocaleString('en-IN')}`],
      ['Registration Amount:', `Rs. ${agreement.registrationAmount.toLocaleString('en-IN')}`]
    ];

    if (agreement.parkingIncluded) {
      priceDetails.push(['Parking Price:', `Rs. ${agreement.parkingPrice.toLocaleString('en-IN')}`]);
    }

    const maxLabelLength = Math.max(...priceDetails.map(([label]) => label.length));

    priceDetails.forEach(([label, value]) => {
      const paddedLabel = label.padEnd(maxLabelLength + 2);
      doc.text(`${paddedLabel} ${value}`);
    });

    doc.moveDown(1);

    // Possession date
    const possessionDate = new Date(agreement.possessionDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    doc.text(`Expected Possession Date: ${possessionDate}`);
    doc.moveDown(1);
  }

  private addTermsAndConditions(doc: PDFKit.PDFDocument, agreement: IAgreement): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('TERMS AND CONDITIONS', { underline: true })
      .moveDown(0.3);

    doc.fontSize(10).font('Helvetica');

    const terms = agreement.terms || this.getDefaultTerms(agreement.type);
    const lines = terms.split('\n');

    lines.forEach(line => {
      if (line.trim()) {
        doc.text(line.trim(), { align: 'justify' });
      }
    });

    doc.moveDown(1);
  }

  private addSpecialConditions(doc: PDFKit.PDFDocument, agreement: IAgreement): void {
    if (!agreement.specialConditions) return;

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('SPECIAL CONDITIONS', { underline: true })
      .moveDown(0.3);

    doc.fontSize(10).font('Helvetica');

    const lines = agreement.specialConditions.split('\n');

    lines.forEach((line, index) => {
      if (line.trim()) {
        doc.text(`${index + 1}. ${line.trim()}`, { align: 'justify' });
      }
    });

    doc.moveDown(1);
  }

  private addPaymentSchedule(doc: PDFKit.PDFDocument, agreement: IAgreement): void {
    if (!agreement.paymentSchedule || agreement.paymentSchedule.length === 0) return;

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('PAYMENT SCHEDULE', { underline: true })
      .moveDown(0.3);

    // Table header
    doc
      .font('Helvetica-Bold')
      .fontSize(10);

    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 250;
    const col3 = 350;
    const col4 = 450;

    doc.text('Milestone', col1, tableTop);
    doc.text('Amount', col2, tableTop);
    doc.text('Due Date', col3, tableTop);
    doc.text('Status', col4, tableTop);

    doc.moveDown(0.3);

    // Table rows
    doc.font('Helvetica').fontSize(10);

    agreement.paymentSchedule.forEach((payment, index) => {
      if (doc.y > 700) {
        doc.addPage();
      }

      const y = doc.y;
      const dueDate = new Date(payment.dueDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      doc.text(payment.milestone, col1, y, { width: 190 });
      doc.text(`Rs. ${payment.amount.toLocaleString('en-IN')}`, col2, y);
      doc.text(dueDate, col3, y);
      doc.text(payment.status.toUpperCase(), col4, y);

      doc.moveDown(0.5);
    });

    doc.moveDown(1);
  }

  private addSignatureBlocks(doc: PDFKit.PDFDocument, agreement: IAgreement): void {
    // Check if we need a new page
    if (doc.y > 600) {
      doc.addPage();
    }

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('SIGNATURES', { underline: true })
      .moveDown(0.5);

    const signatures = [
      { role: 'BUYER', signedAt: agreement.buyerSignedAt, signature: agreement.buyerSignature },
      { role: 'SELLER', signedAt: agreement.sellerSignedAt, signature: agreement.sellerSignature },
      { role: 'WITNESS 1', signedAt: agreement.witness1SignedAt, signature: agreement.witness1Signature },
      { role: 'WITNESS 2', signedAt: agreement.witness2SignedAt, signature: agreement.witness2Signature }
    ];

    signatures.forEach((sig, index) => {
      if (doc.y > 700) {
        doc.addPage();
      }

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`${sig.role}:`)
        .moveDown(0.2);

      if (sig.signature) {
        try {
          // Add signature image
          const sigBuffer = Buffer.from(sig.signature.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(sigBuffer, doc.x, doc.y, { width: 150, height: 50 });
          doc.moveDown(4);
        } catch {
          doc
            .font('Helvetica')
            .fontSize(10)
            .text('[Signature on file]');
          doc.moveDown(1);
        }
      } else {
        doc
          .font('Helvetica')
          .fontSize(10)
          .text('_____________________________');
        doc.moveDown(0.5);
      }

      if (sig.signedAt) {
        const signedDate = new Date(sig.signedAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        doc
          .fontSize(9)
          .text(`Signed on: ${signedDate}`);
      }

      doc.moveDown(0.5);
    });
  }

  private addFooter(doc: PDFKit.PDFDocument): void {
    const pageHeight = doc.page.height;

    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Generated by ${config.company.name} Agreement Service`,
        50,
        pageHeight - 50,
        { align: 'center' }
      )
      .text(
        `Page 1 of ${doc.bufferedPageRange().count || 1}`,
        50,
        pageHeight - 40,
        { align: 'center' }
      );
  }

  private getAgreementTitle(type: string): string {
    const titles: Record<string, string> = {
      'sale_agreement': 'Sale Agreement',
      'noc': 'No Objection Certificate',
      'mou': 'Memorandum of Understanding',
      '租约': 'Lease Agreement',
      'leave_license': 'Leave and License Agreement',
      '租让协议': 'Tenancy Agreement'
    };

    return titles[type] || 'Property Agreement';
  }

  private getDefaultTerms(type: string): string {
    const terms: Record<string, string> = {
      'sale_agreement': `1. The Seller agrees to sell and the Buyer agrees to purchase the property described herein.

2. The total sale consideration shall be as mentioned in this Agreement.

3. The possession of the property shall be delivered to the Buyer on the date mentioned herein, subject to full payment.

4. The Buyer shall pay the stamp duty and registration charges as per applicable laws.

5. The Seller confirms that the property is free from all encumbrances, liens, and disputes.

6. Both parties agree to execute all necessary documents for registration of this Agreement.

7. This Agreement shall be binding on the heirs, successors, and assigns of both parties.

8. Any dispute arising out of this Agreement shall be subject to the jurisdiction of the courts in the concerned city.

9. Both parties acknowledge that they have read, understood, and agreed to all terms and conditions mentioned herein.`,

      'noc': `1. This No Objection Certificate is issued to confirm that we have no objection to the transaction mentioned herein.

2. We confirm that all dues related to the property have been cleared.

3. We agree to cooperate in the registration process of the property.

4. This NOC is valid for a period of 90 days from the date of issue.`,

      'mou': `1. This Memorandum of Understanding sets forth the preliminary agreement between the parties.

2. The terms of the final agreement shall be negotiated and finalized within 30 days.

3. Both parties agree to act in good faith during the negotiation process.

4. This MoU is not legally binding but indicates a serious intent to enter into a formal agreement.`,

      '租约': `1. This Lease Agreement is entered into between the Landlord and Tenant.

2. The property shall be used only for residential/commercial purposes as specified.

3. The Tenant agrees to pay rent on time and maintain the property in good condition.

4. The security deposit shall be refundable at the end of the lease term, subject to deductions for damages.

5. Either party can terminate this agreement by giving notice as specified.`,

      'leave_license': `1. This Leave and License Agreement grants temporary occupation rights.

2. The Licensee shall not sublet or transfer the premises.

3. The Licensor retains ownership of the property.

4. This agreement does not create any tenancy rights.`,

      '租让协议': `1. This Tenancy Agreement establishes a landlord-tenant relationship.

2. The Tenant agrees to pay rent by the specified date each month.

3. The property shall be maintained in its original condition, subject to fair wear and tear.

4. The Landlord agrees to provide essential services and maintenance.`
    };

    return terms[type] || terms['sale_agreement'];
  }

  /**
   * Save PDF to file
   */
  async savePdf(agreementId: string, pdfBuffer: Buffer): Promise<string> {
    const filename = `${agreementId}_${Date.now()}.pdf`;
    const filepath = path.join(this.storagePath, filename);

    await fs.promises.writeFile(filepath, pdfBuffer);
    logger.info('PDF saved', { agreementId, filename });

    return filepath;
  }

  /**
   * Get PDF filepath
   */
  getPdfPath(agreementId: string): string {
    // Find the latest PDF for this agreement
    const files = fs.readdirSync(this.storagePath);
    const matchingFiles = files.filter(f => f.startsWith(agreementId));

    if (matchingFiles.length === 0) {
      return '';
    }

    // Return the latest file
    matchingFiles.sort().reverse();
    return path.join(this.storagePath, matchingFiles[0]);
  }
}

export const pdfService = new PDFService();
export default pdfService;