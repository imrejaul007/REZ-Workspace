import { Router } from 'express';
import HandoverController from '../controllers/handover.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
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
  AvailableSlotsQuerySchema,
} from '../schemas/handover.schema';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Handover Management
router.post(
  '/',
  validateBody(CreateHandoverSchema),
  HandoverController.createHandover
);

router.get('/', HandoverController.listHandovers);

router.get(
  '/available-slots',
  validateQuery(AvailableSlotsQuerySchema),
  HandoverController.getAvailableSlots
);

router.get('/:id', HandoverController.getHandover);

router.put('/:id', HandoverController.updateHandover);

router.delete('/:id', HandoverController.deleteHandover);

// Scheduling
router.post(
  '/:id/schedule',
  validateBody(ScheduleHandoverSchema),
  HandoverController.scheduleHandover
);

router.post(
  '/:id/reschedule',
  validateBody(RescheduleHandoverSchema),
  HandoverController.rescheduleHandover
);

// Check-in
router.post(
  '/:id/checkin',
  validateBody(CheckInSchema),
  HandoverController.checkIn
);

router.get('/:id/checkin-status', HandoverController.getCheckInStatus);

// Keys
router.post(
  '/:id/keys',
  validateBody(KeysUpdateSchema),
  HandoverController.updateKeys
);

router.post('/:id/keys/confirm', HandoverController.confirmKeysHandedOver);

// Documents
router.post(
  '/:id/documents',
  validateBody(DocumentsUpdateSchema),
  HandoverController.updateDocuments
);

router.post('/:id/documents/confirm', HandoverController.confirmDocumentsHandedOver);

// Condition Report
router.post(
  '/:id/condition',
  validateBody(ConditionReportUpdateSchema),
  HandoverController.submitConditionReport
);

router.put(
  '/:id/condition',
  validateBody(ConditionReportUpdateSchema),
  HandoverController.updateConditionReport
);

router.post('/:id/condition/verify', HandoverController.verifyConditionReport);

// Meter Readings
router.post(
  '/:id/meters',
  validateBody(MeterReadingsUpdateSchema),
  HandoverController.submitMeterReadings
);

router.put(
  '/:id/meters',
  validateBody(MeterReadingsUpdateSchema),
  HandoverController.updateMeterReadings
);

// Checklist
router.get('/:id/checklist', HandoverController.getChecklist);

router.post(
  '/:id/checklist/:itemId',
  validateBody(ChecklistItemUpdateSchema),
  HandoverController.updateChecklistItem
);

router.post('/:id/checklist/complete', HandoverController.completeChecklist);

// Disputes
router.post(
  '/:id/disputes',
  validateBody(CreateDisputeSchema),
  HandoverController.raiseDispute
);

router.get('/:id/disputes', HandoverController.listDisputes);

router.put(
  '/:id/disputes/:disputeId',
  validateBody(UpdateDisputeSchema),
  HandoverController.updateDispute
);

router.post(
  '/:id/disputes/:disputeId/resolve',
  validateBody(ResolveDisputeSchema),
  HandoverController.resolveDispute
);

// Acceptance
router.post(
  '/:id/accept',
  validateBody(AcceptanceSchema),
  HandoverController.buyerAccept
);

router.post(
  '/:id/reject',
  validateBody(AcceptanceSchema),
  HandoverController.buyerReject
);

// Completion
router.post('/:id/complete', HandoverController.completeHandover);

router.post('/:id/cancel', HandoverController.cancelHandover);

router.get('/:id/report', HandoverController.getHandoverReport);

router.post(
  '/:id/feedback',
  validateBody(SubmitFeedbackSchema),
  HandoverController.submitFeedback
);

// Timeline
router.get('/:id/timeline', HandoverController.getTimeline);

export default router;