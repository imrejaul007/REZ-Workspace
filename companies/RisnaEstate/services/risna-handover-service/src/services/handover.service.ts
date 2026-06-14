import mongoose, { Types } from 'mongoose';
import { Handover, IHandover } from '../models/handover.model';
import {
  CreateHandoverInput,
  ScheduleHandoverInput,
  RescheduleHandoverInput,
  CheckInInput,
  KeysUpdateInput,
  DocumentsUpdateInput,
  ConditionReportUpdateInput,
  MeterReadingsUpdateInput,
  CreateDisputeInput,
  UpdateDisputeInput,
  ResolveDisputeInput,
  AcceptanceInput,
  SubmitFeedbackInput,
  ListHandoversQuery,
} from '../schemas/handover.schema';
import { DEFAULT_CHECKLIST } from '../utils/checklist';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import ChecklistService from './checklist.service';
import ReportService from './report.service';
import logger from '../config/logger';

export class HandoverService {
  /**
   * Create a new handover
   */
  static async createHandover(input: CreateHandoverInput, userId: string): Promise<IHandover> {
    // Check for existing handover for the same deal
    const existing = await Handover.findOne({ dealId: new Types.ObjectId(input.dealId) });
    if (existing) {
      throw new ConflictError('Handover already exists for this deal');
    }

    // Initialize checklist from default items
    const checklist = DEFAULT_CHECKLIST.map((item) => ({
      item: item.item,
      category: item.category,
      required: item.required,
      completed: false,
    }));

    const handover = new Handover({
      ...input,
      dealId: new Types.ObjectId(input.dealId),
      agreementId: new Types.ObjectId(input.agreementId),
      propertyId: new Types.ObjectId(input.propertyId),
      brokerId: input.brokerId ? new Types.ObjectId(input.brokerId) : undefined,
      checklist,
      buyerArrived: false,
      status: 'scheduled',
      createdBy: userId,
      timeline: [
        {
          event: 'created',
          description: 'Handover created',
          timestamp: new Date(),
          userId,
        },
      ],
    });

    await handover.save();

    logger.info(`Handover created: ${handover.handoverId}`);
    return handover;
  }

  /**
   * Get handover by ID
   */
  static async getHandoverById(id: string): Promise<IHandover> {
    const handover = await Handover.findById(id);
    if (!handover) {
      throw new NotFoundError('Handover not found');
    }
    return handover;
  }

  /**
   * List handovers with filters
   */
  static async listHandovers(query: ListHandoversQuery): Promise<{
    handovers: IHandover[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { status, dealId, propertyId, buyerId, sellerId, startDate, endDate, page = 1, limit = 20 } = query;

    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (dealId) filter.dealId = new Types.ObjectId(dealId);
    if (propertyId) filter.propertyId = new Types.ObjectId(propertyId);
    if (buyerId) filter.buyerId = buyerId;
    if (sellerId) filter.sellerId = sellerId;

    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) (filter.scheduledDate as Record<string, Date>).$gte = new Date(startDate);
      if (endDate) (filter.scheduledDate as Record<string, Date>).$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [handovers, total] = await Promise.all([
      Handover.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Handover.countDocuments(filter),
    ]);

    return {
      handovers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update handover
   */
  static async updateHandover(id: string, updates: Partial<IHandover>, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    Object.assign(handover, updates);
    handover.timeline.push({
      event: 'updated',
      description: 'Handover updated',
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Handover ${id} updated`);
    return handover;
  }

  /**
   * Schedule handover
   */
  static async scheduleHandover(id: string, input: ScheduleHandoverInput, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    handover.scheduledDate = new Date(input.scheduledDate);
    handover.scheduledTime = input.scheduledTime;
    handover.scheduledBy = input.scheduledBy;
    handover.status = 'scheduled';
    handover.timeline.push({
      event: 'scheduled',
      description: `Handover scheduled for ${input.scheduledDate} at ${input.scheduledTime}`,
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Handover ${id} scheduled for ${input.scheduledDate}`);
    return handover;
  }

  /**
   * Reschedule handover
   */
  static async rescheduleHandover(id: string, input: RescheduleHandoverInput, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    const oldDate = handover.scheduledDate ? new Date(handover.scheduledDate).toLocaleDateString() : 'Not set';
    const oldTime = handover.scheduledTime || 'Not set';

    handover.scheduledDate = new Date(input.scheduledDate);
    handover.scheduledTime = input.scheduledTime;
    handover.timeline.push({
      event: 'rescheduled',
      description: `Handover rescheduled from ${oldDate} ${oldTime} to ${input.scheduledDate} ${input.scheduledTime}. Reason: ${input.reason}`,
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Handover ${id} rescheduled`);
    return handover;
  }

  /**
   * Get available time slots
   */
  static async getAvailableSlots(date: string, propertyId?: string): Promise<string[]> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(9, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(18, 0, 0, 0));

    const existingHandovers = await Handover.find({
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['scheduled', 'in_progress'] },
    });

    const bookedSlots = existingHandovers.map((h) => h.scheduledTime).filter(Boolean);

    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    ];

    return allSlots.filter((slot) => !bookedSlots.includes(slot));
  }

  /**
   * Buyer check-in
   */
  static async checkIn(id: string, input: CheckInInput, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    if (handover.buyerArrived) {
      throw new ConflictError('Buyer has already checked in');
    }

    handover.buyerArrived = true;
    handover.buyerArrivedAt = new Date();
    handover.buyerRepresentative = input.buyerRepresentative;
    handover.status = 'in_progress';
    handover.timeline.push({
      event: 'checkin',
      description: `${input.buyerRepresentative} checked in`,
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Buyer checked in for handover ${id}`);
    return handover;
  }

  /**
   * Get check-in status
   */
  static async getCheckInStatus(id: string): Promise<{
    buyerArrived: boolean;
    buyerArrivedAt: Date | null;
    buyerRepresentative: string | null;
    waitingTime: number | null;
  }> {
    const handover = await this.getHandoverById(id);

    const result = {
      buyerArrived: handover.buyerArrived,
      buyerArrivedAt: handover.buyerArrivedAt || null,
      buyerRepresentative: handover.buyerRepresentative || null,
      waitingTime: handover.buyerArrivedAt
        ? Math.floor((Date.now() - handover.buyerArrivedAt.getTime()) / 60000)
        : null,
    };

    return result;
  }

  /**
   * Update keys status
   */
  static async updateKeys(id: string, input: KeysUpdateInput, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    handover.keys = input.keys.map((k) => ({
      type: k.type,
      quantity: k.quantity,
      handedOver: k.handedOver,
      notes: k.notes,
    }));

    handover.timeline.push({
      event: 'keys_updated',
      description: 'Keys status updated',
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Keys updated for handover ${id}`);
    return handover;
  }

  /**
   * Confirm keys handed over
   */
  static async confirmKeysHandedOver(id: string, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    handover.keys.forEach((key) => {
      key.handedOver = true;
    });
    handover.keysHandedAt = new Date();

    handover.timeline.push({
      event: 'keys_confirmed',
      description: 'All keys confirmed as handed over',
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Keys confirmed for handover ${id}`);
    return handover;
  }

  /**
   * Update documents status
   */
  static async updateDocuments(id: string, input: DocumentsUpdateInput, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    handover.documents = input.documents.map((d) => ({
      type: d.type,
      handedOver: d.handedOver,
      verified: d.verified,
      notes: d.notes,
    }));

    handover.timeline.push({
      event: 'documents_updated',
      description: 'Documents status updated',
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Documents updated for handover ${id}`);
    return handover;
  }

  /**
   * Confirm documents handed over
   */
  static async confirmDocumentsHandedOver(id: string, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    handover.documents.forEach((doc) => {
      doc.handedOver = true;
    });
    handover.documentsHandedAt = new Date();

    handover.timeline.push({
      event: 'documents_confirmed',
      description: 'All documents confirmed as handed over',
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Documents confirmed for handover ${id}`);
    return handover;
  }

  /**
   * Submit condition report
   */
  static async submitConditionReport(id: string, input: ConditionReportUpdateInput, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    handover.conditionReport = input.conditionReport;
    handover.timeline.push({
      event: 'condition_report_submitted',
      description: 'Property condition report submitted',
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Condition report submitted for handover ${id}`);
    return handover;
  }

  /**
   * Update condition report
   */
  static async updateConditionReport(id: string, input: ConditionReportUpdateInput, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    if (!handover.conditionReport) {
      throw new BadRequestError('No condition report exists to update');
    }

    handover.conditionReport = { ...handover.conditionReport, ...input.conditionReport };
    handover.timeline.push({
      event: 'condition_report_updated',
      description: 'Property condition report updated',
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Condition report updated for handover ${id}`);
    return handover;
  }

  /**
   * Verify condition report
   */
  static async verifyConditionReport(id: string, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    if (!handover.conditionReport) {
      throw new BadRequestError('No condition report to verify');
    }

    handover.timeline.push({
      event: 'condition_report_verified',
      description: 'Property condition report verified',
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Condition report verified for handover ${id}`);
    return handover;
  }

  /**
   * Submit meter readings
   */
  static async submitMeterReadings(id: string, input: MeterReadingsUpdateInput, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    handover.meterReadings = input.meterReadings;
    handover.timeline.push({
      event: 'meter_readings_submitted',
      description: 'Meter readings submitted',
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Meter readings submitted for handover ${id}`);
    return handover;
  }

  /**
   * Update meter readings
   */
  static async updateMeterReadings(id: string, input: MeterReadingsUpdateInput, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    if (!handover.meterReadings) {
      throw new BadRequestError('No meter readings exist to update');
    }

    handover.meterReadings = { ...handover.meterReadings, ...input.meterReadings };
    handover.timeline.push({
      event: 'meter_readings_updated',
      description: 'Meter readings updated',
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Meter readings updated for handover ${id}`);
    return handover;
  }

  /**
   * Get checklist
   */
  static async getChecklist(id: string): Promise<{
    checklist: IHandover['checklist'];
    progress: {
      total: number;
      completed: number;
      required: number;
      requiredCompleted: number;
      progressPercentage: number;
      requiredProgressPercentage: number;
    };
  }> {
    const handover = await this.getHandoverById(id);
    const progress = await ChecklistService.getChecklistProgress(id);

    return {
      checklist: handover.checklist,
      progress,
    };
  }

  /**
   * Update checklist item
   */
  static async updateChecklistItem(
    id: string,
    itemId: string,
    updates: { completed?: boolean; verifiedBy?: string; notes?: string },
    userId: string
  ): Promise<IHandover> {
    const item = await ChecklistService.updateChecklistItem(id, itemId, updates);

    const handover = await this.getHandoverById(id);
    handover.timeline.push({
      event: 'checklist_item_updated',
      description: `Checklist item "${item.item}" updated`,
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    return handover;
  }

  /**
   * Mark checklist complete
   */
  static async completeChecklist(id: string, userId: string): Promise<IHandover> {
    await ChecklistService.completeChecklist(id, userId);

    const handover = await this.getHandoverById(id);
    handover.timeline.push({
      event: 'checklist_completed',
      description: 'All checklist items marked as complete',
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Checklist completed for handover ${id}`);
    return handover;
  }

  /**
   * Raise dispute
   */
  static async raiseDispute(id: string, input: CreateDisputeInput, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    handover.disputes.push({
      item: input.item,
      description: input.description,
      raisedBy: userId,
      raisedAt: new Date(),
      status: 'open',
    });

    handover.status = 'disputed';
    handover.timeline.push({
      event: 'dispute_raised',
      description: `Dispute raised: ${input.item}`,
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Dispute raised for handover ${id}: ${input.item}`);
    return handover;
  }

  /**
   * List disputes
   */
  static async listDisputes(id: string): Promise<IHandover['disputes']> {
    const handover = await this.getHandoverById(id);
    return handover.disputes;
  }

  /**
   * Update dispute
   */
  static async updateDispute(
    id: string,
    disputeId: string,
    input: UpdateDisputeInput,
    userId: string
  ): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    const dispute = handover.disputes.find((d) => d._id?.toString() === disputeId);
    if (!dispute) {
      throw new NotFoundError('Dispute not found');
    }

    if (input.status) dispute.status = input.status;
    if (input.resolution) dispute.resolution = input.resolution;

    handover.timeline.push({
      event: 'dispute_updated',
      description: `Dispute "${dispute.item}" updated`,
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    return handover;
  }

  /**
   * Resolve dispute
   */
  static async resolveDispute(id: string, disputeId: string, input: ResolveDisputeInput, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    const dispute = handover.disputes.find((d) => d._id?.toString() === disputeId);
    if (!dispute) {
      throw new NotFoundError('Dispute not found');
    }

    dispute.status = 'resolved';
    dispute.resolution = input.resolution;
    dispute.resolvedAt = new Date();

    // Check if all disputes are resolved
    const openDisputes = handover.disputes.filter((d) => d.status === 'open');
    if (openDisputes.length === 0) {
      handover.status = 'in_progress';
    }

    handover.timeline.push({
      event: 'dispute_resolved',
      description: `Dispute "${dispute.item}" resolved`,
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Dispute ${disputeId} resolved for handover ${id}`);
    return handover;
  }

  /**
   * Buyer accepts handover
   */
  static async buyerAccept(id: string, input: AcceptanceInput, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    handover.buyerAcceptance = {
      accepted: input.accepted,
      acceptedAt: new Date(),
      acceptedBy: userId,
      signature: input.signature,
      conditionAccepted: input.conditionAccepted,
      notes: input.notes,
    };

    handover.timeline.push({
      event: 'buyer_accepted',
      description: 'Buyer accepted handover',
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Buyer accepted handover ${id}`);
    return handover;
  }

  /**
   * Buyer rejects handover
   */
  static async buyerReject(id: string, input: AcceptanceInput, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    handover.buyerAcceptance = {
      accepted: false,
      acceptedAt: new Date(),
      acceptedBy: userId,
      signature: input.signature,
      conditionAccepted: input.conditionAccepted,
      notes: input.notes,
    };

    handover.status = 'disputed';
    handover.timeline.push({
      event: 'buyer_rejected',
      description: 'Buyer rejected handover',
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Buyer rejected handover ${id}`);
    return handover;
  }

  /**
   * Complete handover
   */
  static async completeHandover(id: string, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    handover.status = 'completed';
    handover.actualDate = new Date();
    handover.actualTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    handover.timeline.push({
      event: 'completed',
      description: 'Handover completed successfully',
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Handover ${id} completed`);
    return handover;
  }

  /**
   * Cancel handover
   */
  static async cancelHandover(id: string, reason: string, userId: string): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    handover.status = 'cancelled';
    handover.timeline.push({
      event: 'cancelled',
      description: `Handover cancelled. Reason: ${reason}`,
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Handover ${id} cancelled`);
    return handover;
  }

  /**
   * Get handover report
   */
  static async getHandoverReport(id: string): Promise<Buffer> {
    const handover = await this.getHandoverById(id);
    return ReportService.generateHandoverReport(handover);
  }

  /**
   * Submit feedback
   */
  static async submitFeedback(id: string, input: SubmitFeedbackInput, userId: string, role: 'buyer' | 'seller'): Promise<IHandover> {
    const handover = await this.getHandoverById(id);

    if (!handover.feedback) {
      handover.feedback = {
        rating: input.rating,
        comments: input.comments,
      };
    } else {
      handover.feedback.rating = input.rating;
      if (input.comments) handover.feedback.comments = input.comments;
    }

    if (role === 'buyer') {
      handover.feedback.buyerFeedback = input.comments;
    } else {
      handover.feedback.sellerFeedback = input.comments;
    }

    handover.timeline.push({
      event: 'feedback_submitted',
      description: `${role} submitted feedback`,
      timestamp: new Date(),
      userId,
    });

    await handover.save();
    logger.info(`Feedback submitted for handover ${id} by ${role}`);
    return handover;
  }

  /**
   * Get timeline
   */
  static async getTimeline(id: string): Promise<IHandover['timeline']> {
    const handover = await this.getHandoverById(id);
    return handover.timeline;
  }

  /**
   * Delete handover
   */
  static async deleteHandover(id: string, userId: string): Promise<void> {
    const handover = await this.getHandoverById(id);

    if (['in_progress', 'completed'].includes(handover.status)) {
      throw new BadRequestError('Cannot delete handover that is in progress or completed');
    }

    handover.timeline.push({
      event: 'deleted',
      description: 'Handover deleted',
      timestamp: new Date(),
      userId,
    });

    handover.status = 'cancelled';
    await handover.save();
    logger.info(`Handover ${id} deleted`);
  }

  /**
   * Get handover by handoverId (not ObjectId)
   */
  static async getHandoverByHandoverId(handoverId: string): Promise<IHandover> {
    const handover = await Handover.findOne({ handoverId });
    if (!handover) {
      throw new NotFoundError('Handover not found');
    }
    return handover;
  }
}

export default HandoverService;