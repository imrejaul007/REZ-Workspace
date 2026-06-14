import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import HandoverService from '../services/handover.service';
import {
  CreateHandoverSchema,
  ScheduleHandoverSchema,
  RescheduleHandoverSchema,
  CheckInSchema,
  KeysUpdateSchema,
  DocumentsUpdateSchema,
  ConditionReportUpdateSchema,
  MeterReadingsUpdateSchema,
  ChecklistItemUpdateSchema,
  CreateDisputeSchema,
  UpdateDisputeSchema,
  ResolveDisputeSchema,
  AcceptanceSchema,
  SubmitFeedbackSchema,
  ListHandoversQuerySchema,
  AvailableSlotsQuerySchema,
} from '../schemas/handover.schema';
import { BadRequestError } from '../utils/errors';
import logger from '../config/logger';

export class HandoverController {
  /**
   * Create a new handover
   */
  static async createHandover(req: AuthRequest, res: Response): Promise<void> {
    try {
      const handover = await HandoverService.createHandover(req.body, req.user!.userId);
      res.status(201).json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * List handovers
   */
  static async listHandovers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const query = ListHandoversQuerySchema.parse(req.query);
      const result = await HandoverService.listHandovers(query);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get handover by ID
   */
  static async getHandover(req: AuthRequest, res: Response): Promise<void> {
    try {
      const handover = await HandoverService.getHandoverById(req.params.id);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update handover
   */
  static async updateHandover(req: AuthRequest, res: Response): Promise<void> {
    try {
      const handover = await HandoverService.updateHandover(req.params.id, req.body, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete handover
   */
  static async deleteHandover(req: AuthRequest, res: Response): Promise<void> {
    try {
      await HandoverService.deleteHandover(req.params.id, req.user!.userId);
      res.json({
        success: true,
        message: 'Handover deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Schedule handover
   */
  static async scheduleHandover(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = ScheduleHandoverSchema.parse(req.body);
      const handover = await HandoverService.scheduleHandover(req.params.id, input, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get available slots
   */
  static async getAvailableSlots(req: AuthRequest, res: Response): Promise<void> {
    try {
      const query = AvailableSlotsQuerySchema.parse(req.query);
      const slots = await HandoverService.getAvailableSlots(query.date, query.propertyId);
      res.json({
        success: true,
        data: slots,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reschedule handover
   */
  static async rescheduleHandover(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = RescheduleHandoverSchema.parse(req.body);
      const handover = await HandoverService.rescheduleHandover(req.params.id, input, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buyer check-in
   */
  static async checkIn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = CheckInSchema.parse(req.body);
      const handover = await HandoverService.checkIn(req.params.id, input, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get check-in status
   */
  static async getCheckInStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const status = await HandoverService.getCheckInStatus(req.params.id);
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update keys status
   */
  static async updateKeys(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = KeysUpdateSchema.parse(req.body);
      const handover = await HandoverService.updateKeys(req.params.id, input, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Confirm keys handed over
   */
  static async confirmKeysHandedOver(req: AuthRequest, res: Response): Promise<void> {
    try {
      const handover = await HandoverService.confirmKeysHandedOver(req.params.id, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update documents status
   */
  static async updateDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = DocumentsUpdateSchema.parse(req.body);
      const handover = await HandoverService.updateDocuments(req.params.id, input, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Confirm documents handed over
   */
  static async confirmDocumentsHandedOver(req: AuthRequest, res: Response): Promise<void> {
    try {
      const handover = await HandoverService.confirmDocumentsHandedOver(req.params.id, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit condition report
   */
  static async submitConditionReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = ConditionReportUpdateSchema.parse(req.body);
      const handover = await HandoverService.submitConditionReport(req.params.id, input, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update condition report
   */
  static async updateConditionReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = ConditionReportUpdateSchema.parse(req.body);
      const handover = await HandoverService.updateConditionReport(req.params.id, input, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify condition report
   */
  static async verifyConditionReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const handover = await HandoverService.verifyConditionReport(req.params.id, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit meter readings
   */
  static async submitMeterReadings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = MeterReadingsUpdateSchema.parse(req.body);
      const handover = await HandoverService.submitMeterReadings(req.params.id, input, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update meter readings
   */
  static async updateMeterReadings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = MeterReadingsUpdateSchema.parse(req.body);
      const handover = await HandoverService.updateMeterReadings(req.params.id, input, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get checklist
   */
  static async getChecklist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await HandoverService.getChecklist(req.params.id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update checklist item
   */
  static async updateChecklistItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = ChecklistItemUpdateSchema.parse(req.body);
      const handover = await HandoverService.updateChecklistItem(
        req.params.id,
        req.params.itemId,
        input,
        req.user!.userId
      );
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark checklist complete
   */
  static async completeChecklist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const handover = await HandoverService.completeChecklist(req.params.id, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Raise dispute
   */
  static async raiseDispute(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = CreateDisputeSchema.parse(req.body);
      const handover = await HandoverService.raiseDispute(req.params.id, input, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * List disputes
   */
  static async listDisputes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const disputes = await HandoverService.listDisputes(req.params.id);
      res.json({
        success: true,
        data: disputes,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update dispute
   */
  static async updateDispute(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = UpdateDisputeSchema.parse(req.body);
      const handover = await HandoverService.updateDispute(req.params.id, req.params.disputeId, input, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resolve dispute
   */
  static async resolveDispute(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = ResolveDisputeSchema.parse(req.body);
      const handover = await HandoverService.resolveDispute(req.params.id, req.params.disputeId, input, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buyer accepts handover
   */
  static async buyerAccept(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = AcceptanceSchema.parse(req.body);
      const handover = await HandoverService.buyerAccept(req.params.id, input, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buyer rejects handover
   */
  static async buyerReject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = AcceptanceSchema.parse(req.body);
      const handover = await HandoverService.buyerReject(req.params.id, input, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Complete handover
   */
  static async completeHandover(req: AuthRequest, res: Response): Promise<void> {
    try {
      const handover = await HandoverService.completeHandover(req.params.id, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel handover
   */
  static async cancelHandover(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { reason } = req.body;
      if (!reason) {
        throw new BadRequestError('Cancellation reason is required');
      }
      const handover = await HandoverService.cancelHandover(req.params.id, reason, req.user!.userId);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get handover report
   */
  static async getHandoverReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const buffer = await HandoverService.getHandoverReport(req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=handover-report.pdf');
      res.send(buffer);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit feedback
   */
  static async submitFeedback(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = SubmitFeedbackSchema.parse(req.body);
      const role = req.query.role as 'buyer' | 'seller' || 'buyer';
      const handover = await HandoverService.submitFeedback(req.params.id, input, req.user!.userId, role);
      res.json({
        success: true,
        data: handover,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get timeline
   */
  static async getTimeline(req: AuthRequest, res: Response): Promise<void> {
    try {
      const timeline = await HandoverService.getTimeline(req.params.id);
      res.json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      throw error;
    }
  }
}

export default HandoverController;