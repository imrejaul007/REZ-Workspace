import PDFDocument from 'pdfkit';
import { IHandover } from '../models/handover.model';
import logger from '../config/logger';

export interface HandoverReportData {
  handover: IHandover;
  checklistProgress: {
    total: number;
    completed: number;
    required: number;
    requiredCompleted: number;
    progressPercentage: number;
    requiredProgressPercentage: number;
  };
  timeline: Array<{
    event: string;
    description: string;
    timestamp: Date;
    userId: string;
  }>;
}

export class ReportService {
  /**
   * Generate PDF report for handover
   */
  static async generateHandoverReport(handover: IHandover): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const chunks: Uint8Array[] = [];
        const doc = new PDFDocument({ margin: 50 });

        doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('Property Handover Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text(`Handover ID: ${handover.handoverId}`, { align: 'center' });
        doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
        doc.moveDown(2);

        // Property Details
        doc.fontSize(16).font('Helvetica-Bold').text('Property Details');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Address: ${handover.propertyAddress}`);
        if (handover.unitNumber) doc.text(`Unit Number: ${handover.unitNumber}`);
        if (handover.floor) doc.text(`Floor: ${handover.floor}`);
        if (handover.tower) doc.text(`Tower: ${handover.tower}`);
        doc.moveDown();

        // Parties
        doc.fontSize(16).font('Helvetica-Bold').text('Parties Involved');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Buyer ID: ${handover.buyerId}`);
        doc.text(`Seller ID: ${handover.sellerId}`);
        if (handover.brokerId) doc.text(`Broker ID: ${handover.brokerId}`);
        doc.moveDown();

        // Schedule
        doc.fontSize(16).font('Helvetica-Bold').text('Schedule');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        if (handover.scheduledDate) {
          doc.text(`Scheduled Date: ${new Date(handover.scheduledDate).toLocaleDateString('en-IN')}`);
          doc.text(`Scheduled Time: ${handover.scheduledTime || 'N/A'}`);
        }
        if (handover.actualDate) {
          doc.text(`Actual Date: ${new Date(handover.actualDate).toLocaleDateString('en-IN')}`);
          doc.text(`Actual Time: ${handover.actualTime || 'N/A'}`);
        }
        doc.moveDown();

        // Status
        doc.fontSize(16).font('Helvetica-Bold').text('Handover Status');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Status: ${handover.status.toUpperCase()}`);
        doc.text(`Buyer Arrived: ${handover.buyerArrived ? 'Yes' : 'No'}`);
        if (handover.buyerRepresentative) {
          doc.text(`Buyer Representative: ${handover.buyerRepresentative}`);
        }
        doc.moveDown();

        // Keys
        if (handover.keys && handover.keys.length > 0) {
          doc.fontSize(16).font('Helvetica-Bold').text('Keys Handed Over');
          doc.moveDown(0.5);
          doc.fontSize(11).font('Helvetica');
          handover.keys.forEach((key) => {
            doc.text(`- ${key.type.replace('_', ' ').toUpperCase()}: ${key.handedOver ? 'Yes' : 'No'} (Qty: ${key.quantity})`);
            if (key.notes) doc.text(`  Notes: ${key.notes}`);
          });
          if (handover.keysHandedAt) {
            doc.text(`Keys Handed At: ${new Date(handover.keysHandedAt).toLocaleString('en-IN')}`);
          }
          doc.moveDown();
        }

        // Documents
        if (handover.documents && handover.documents.length > 0) {
          doc.fontSize(16).font('Helvetica-Bold').text('Documents Handed Over');
          doc.moveDown(0.5);
          doc.fontSize(11).font('Helvetica');
          handover.documents.forEach((doc) => {
            doc.text(`- ${doc.type.replace('_', ' ').toUpperCase()}: ${doc.handedOver ? 'Yes' : 'No'} (Verified: ${doc.verified ? 'Yes' : 'No'})`);
            if (doc.notes) doc.text(`  Notes: ${doc.notes}`);
          });
          if (handover.documentsHandedAt) {
            doc.text(`Documents Handed At: ${new Date(handover.documentsHandedAt).toLocaleString('en-IN')}`);
          }
          doc.moveDown();
        }

        // Condition Report
        if (handover.conditionReport) {
          doc.fontSize(16).font('Helvetica-Bold').text('Property Condition Report');
          doc.moveDown(0.5);
          doc.fontSize(11).font('Helvetica');
          const cr = handover.conditionReport;
          doc.text(`Interior Condition: ${cr.interior.toUpperCase()}`);
          doc.text(`Exterior Condition: ${cr.exterior.toUpperCase()}`);
          doc.text(`Fixtures: ${cr.fixtures.toUpperCase()}`);
          doc.text(`Appliances: ${cr.appliances.toUpperCase()}`);
          doc.text(`Keys Working: ${cr.keysWorking ? 'Yes' : 'No'}`);
          doc.text(`Electricity Connected: ${cr.electricityConnected ? 'Yes' : 'No'}`);
          doc.text(`Water Connected: ${cr.waterConnected ? 'Yes' : 'No'}`);
          if (cr.gasConnected !== undefined) {
            doc.text(`Gas Connected: ${cr.gasConnected ? 'Yes' : 'No'}`);
          }
          if (cr.notes) doc.text(`Notes: ${cr.notes}`);
          doc.moveDown();
        }

        // Meter Readings
        if (handover.meterReadings) {
          doc.fontSize(16).font('Helvetica-Bold').text('Meter Readings');
          doc.moveDown(0.5);
          doc.fontSize(11).font('Helvetica');
          const mr = handover.meterReadings;
          doc.text(`Electricity: ${mr.electricity.reading} ${mr.electricity.unit}`);
          doc.text(`Water: ${mr.water.reading} ${mr.water.unit}`);
          if (mr.gas) doc.text(`Gas: ${mr.gas.reading} ${mr.gas.unit}`);
          doc.moveDown();
        }

        // Checklist Summary
        if (handover.checklist && handover.checklist.length > 0) {
          doc.fontSize(16).font('Helvetica-Bold').text('Checklist Summary');
          doc.moveDown(0.5);
          doc.fontSize(11).font('Helvetica');
          const completed = handover.checklist.filter((item) => item.completed).length;
          const total = handover.checklist.length;
          doc.text(`Completed: ${completed}/${total}`);
          doc.text(`Progress: ${((completed / total) * 100).toFixed(1)}%`);
          doc.moveDown();
        }

        // Buyer Acceptance
        if (handover.buyerAcceptance) {
          doc.fontSize(16).font('Helvetica-Bold').text('Buyer Acceptance');
          doc.moveDown(0.5);
          doc.fontSize(11).font('Helvetica');
          const ba = handover.buyerAcceptance;
          doc.text(`Accepted: ${ba.accepted ? 'Yes' : 'No'}`);
          doc.text(`Condition Accepted: ${ba.conditionAccepted ? 'Yes' : 'No'}`);
          if (ba.acceptedAt) {
            doc.text(`Accepted At: ${new Date(ba.acceptedAt).toLocaleString('en-IN')}`);
          }
          doc.text(`Accepted By: ${ba.acceptedBy}`);
          if (ba.notes) doc.text(`Notes: ${ba.notes}`);
          doc.moveDown();
        }

        // Disputes
        if (handover.disputes && handover.disputes.length > 0) {
          doc.fontSize(16).font('Helvetica-Bold').text('Disputes');
          doc.moveDown(0.5);
          doc.fontSize(11).font('Helvetica');
          handover.disputes.forEach((dispute, index) => {
            doc.text(`${index + 1}. ${dispute.item}`);
            doc.text(`   Description: ${dispute.description}`);
            doc.text(`   Status: ${dispute.status.toUpperCase()}`);
            doc.text(`   Raised By: ${dispute.raisedBy}`);
            if (dispute.resolution) doc.text(`   Resolution: ${dispute.resolution}`);
          });
          doc.moveDown();
        }

        // Feedback
        if (handover.feedback) {
          doc.fontSize(16).font('Helvetica-Bold').text('Feedback');
          doc.moveDown(0.5);
          doc.fontSize(11).font('Helvetica');
          doc.text(`Rating: ${'★'.repeat(handover.feedback.rating)}${'☆'.repeat(5 - handover.feedback.rating)}`);
          if (handover.feedback.comments) doc.text(`Comments: ${handover.feedback.comments}`);
          if (handover.feedback.buyerFeedback) doc.text(`Buyer Feedback: ${handover.feedback.buyerFeedback}`);
          if (handover.feedback.sellerFeedback) doc.text(`Seller Feedback: ${handover.feedback.sellerFeedback}`);
          doc.moveDown();
        }

        // Timeline
        if (handover.timeline && handover.timeline.length > 0) {
          doc.fontSize(16).font('Helvetica-Bold').text('Timeline');
          doc.moveDown(0.5);
          doc.fontSize(10).font('Helvetica');
          handover.timeline.forEach((event, index) => {
            const timestamp = new Date(event.timestamp).toLocaleString('en-IN');
            doc.text(`${index + 1}. [${timestamp}] ${event.event}`);
            doc.text(`   ${event.description}`);
          });
          doc.moveDown();
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(10).font('Helvetica');
        doc.text('This is a system-generated document.', { align: 'center' });
        doc.text('Generated by RisnaEstate Handover Service', { align: 'center' });

        doc.end();
      } catch (error) {
        logger.error('Error generating handover report:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate summary report data
   */
  static generateSummaryReport(handover: IHandover): {
    propertyAddress: string;
    status: string;
    scheduledDate: string | null;
    completedItems: number;
    totalItems: number;
    buyerAccepted: boolean;
    hasDisputes: boolean;
    disputeCount: number;
  } {
    return {
      propertyAddress: handover.propertyAddress,
      status: handover.status,
      scheduledDate: handover.scheduledDate ? new Date(handover.scheduledDate).toLocaleDateString('en-IN') : null,
      completedItems: handover.checklist.filter((item) => item.completed).length,
      totalItems: handover.checklist.length,
      buyerAccepted: handover.buyerAcceptance?.accepted ?? false,
      hasDisputes: handover.disputes.length > 0,
      disputeCount: handover.disputes.length,
    };
  }
}

export default ReportService;