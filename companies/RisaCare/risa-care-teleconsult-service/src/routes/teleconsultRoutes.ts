import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sessionService } from '../services/sessionService.js';
import { availabilityService } from '../services/availabilityService.js';
import { prescriptionService } from '../services/prescriptionService.js';
import { notesService } from '../services/notesService.js';
import { reviewService } from '../services/reviewService.js';
import {
  ConsultationMode,
  SessionStatus,
  ScheduleSessionRequest,
  SetAvailabilityRequest,
  SaveNotesRequest,
  CreatePrescriptionRequest,
  SubmitReviewRequest,
} from '../models/teleconsult.js';

const router = Router();

// Validation schemas
const ScheduleSessionSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  appointmentId: z.string().optional(),
  consultationMode: z.nativeEnum(ConsultationMode).optional(),
  chiefComplaint: z.string().optional(),
  slotStart: z.string().datetime().optional(),
  slotEnd: z.string().datetime().optional(),
});

const SetAvailabilitySchema = z.object({
  doctorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slots: z.array(z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  })).min(1),
  consultationMode: z.nativeEnum(ConsultationMode).optional(),
  consultationFee: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
});

const SaveNotesSchema = z.object({
  doctorId: z.string().min(1),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  prescriptions: z.array(z.object({
    name: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    instructions: z.string().optional(),
    refills: z.number().int().min(0).optional(),
  })).optional(),
  labOrders: z.array(z.object({
    testName: z.string(),
    instructions: z.string().optional(),
    priority: z.enum(['routine', 'urgent', 'stat']).optional(),
  })).optional(),
  followUp: z.object({
    recommended: z.boolean(),
    daysUntilFollowUp: z.number().int().positive().optional(),
    notes: z.string().optional(),
  }).optional(),
  icdCodes: z.array(z.string()).optional(),
});

const CreatePrescriptionSchema = z.object({
  medicines: z.array(z.object({
    name: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    instructions: z.string().optional(),
    refills: z.number().int().min(0).optional(),
  })).min(1),
  notes: z.string().optional(),
});

const SubmitReviewSchema = z.object({
  patientId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().optional(),
  wouldRecommend: z.boolean(),
  categories: z.object({
    punctuality: z.number().int().min(1).max(5).optional(),
    professionalism: z.number().int().min(1).max(5).optional(),
    thoroughness: z.number().int().min(1).max(5).optional(),
    communication: z.number().int().min(1).max(5).optional(),
  }).optional(),
});

// Error handling wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============== SESSION ROUTES ==============

/**
 * POST /sessions - Schedule a new consultation
 */
router.post('/sessions', asyncHandler(async (req: Request, res: Response) => {
  const validated = ScheduleSessionSchema.parse(req.body);
  const session = await sessionService.scheduleSession(validated as ScheduleSessionRequest);
  res.status(201).json({ success: true, data: session });
}));

/**
 * GET /sessions/:sessionId - Get session by ID
 */
router.get('/sessions/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  const session = sessionService.getSession(req.params.sessionId);
  if (!session) {
    res.status(404).json({ success: false, error: 'Session not found' });
    return;
  }
  res.json({ success: true, data: session });
}));

/**
 * PUT /sessions/:sessionId/start - Start a session
 */
router.put('/sessions/:sessionId/start', asyncHandler(async (req: Request, res: Response) => {
  const { userId, userType } = req.body;
  const session = await sessionService.startSession(
    req.params.sessionId,
    userId || 'unknown',
    userType || 'patient'
  );
  res.json({ success: true, data: session });
}));

/**
 * PUT /sessions/:sessionId/end - End a session
 */
router.put('/sessions/:sessionId/end', asyncHandler(async (req: Request, res: Response) => {
  const { endedBy } = req.body;
  const session = await sessionService.endSession(
    req.params.sessionId,
    endedBy || 'system'
  );
  res.json({ success: true, data: session });
}));

/**
 * PUT /sessions/:sessionId/cancel - Cancel a session
 */
router.put('/sessions/:sessionId/cancel', asyncHandler(async (req: Request, res: Response) => {
  const { cancelledBy, reason } = req.body;
  const session = await sessionService.cancelSession(
    req.params.sessionId,
    cancelledBy || 'unknown',
    reason
  );
  res.json({ success: true, data: session });
}));

/**
 * PUT /sessions/:sessionId/no-show - Mark as no-show
 */
router.put('/sessions/:sessionId/no-show', asyncHandler(async (req: Request, res: Response) => {
  const { markedBy } = req.body;
  const session = await sessionService.markNoShow(
    req.params.sessionId,
    markedBy || 'unknown'
  );
  res.json({ success: true, data: session });
}));

/**
 * GET /sessions/patient/:patientId - Get patient's sessions
 */
router.get('/sessions/patient/:patientId', asyncHandler(async (req: Request, res: Response) => {
  const { status, limit, offset } = req.query;
  const result = sessionService.getPatientSessions(req.params.patientId, {
    status: status as SessionStatus,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  });
  res.json({ success: true, data: result });
}));

/**
 * GET /sessions/doctor/:doctorId - Get doctor's sessions
 */
router.get('/sessions/doctor/:doctorId', asyncHandler(async (req: Request, res: Response) => {
  const { status, date, limit, offset } = req.query;
  const result = sessionService.getDoctorSessions(req.params.doctorId, {
    status: status as SessionStatus,
    date: date as string,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  });
  res.json({ success: true, data: result });
}));

/**
 * GET /sessions/:sessionId/token - Get video room token
 */
router.get('/sessions/:sessionId/token', asyncHandler(async (req: Request, res: Response) => {
  const { userId, userType } = req.query;
  const tokenData = await sessionService.getSessionToken(
    req.params.sessionId,
    userId as string || 'unknown',
    userType as 'patient' | 'doctor' || 'patient'
  );
  res.json({ success: true, data: tokenData });
}));

/**
 * GET /sessions/:sessionId/upcoming - Get upcoming sessions for user
 */
router.get('/sessions/upcoming/:userType/:userId', asyncHandler(async (req: Request, res: Response) => {
  const sessions = sessionService.getUpcomingSessions(
    req.params.userId,
    req.params.userType as 'patient' | 'doctor'
  );
  res.json({ success: true, data: sessions });
}));

/**
 * GET /sessions/doctor/:doctorId/stats - Get doctor's session statistics
 */
router.get('/sessions/doctor/:doctorId/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = sessionService.getDoctorSessionStats(req.params.doctorId);
  res.json({ success: true, data: stats });
}));

// ============== AVAILABILITY ROUTES ==============

/**
 * GET /availability/:doctorId/:date - Get availability for a doctor
 */
router.get('/availability/:doctorId/:date', asyncHandler(async (req: Request, res: Response) => {
  const availability = availabilityService.getAvailability(
    req.params.doctorId,
    req.params.date
  );
  if (!availability) {
    res.json({ success: true, data: { available: false, slots: [] } });
    return;
  }
  res.json({
    success: true,
    data: {
      available: true,
      ...availability,
    },
  });
}));

/**
 * POST /availability - Set availability
 */
router.post('/availability', asyncHandler(async (req: Request, res: Response) => {
  const validated = SetAvailabilitySchema.parse(req.body);
  const availability = await availabilityService.setAvailability(validated as SetAvailabilityRequest);
  res.status(201).json({ success: true, data: availability });
}));

/**
 * GET /availability/:doctorId/:startDate/:endDate - Get availability range
 */
router.get('/availability/:doctorId/:startDate/:endDate', asyncHandler(async (req: Request, res: Response) => {
  const availability = availabilityService.getAvailabilityRange(
    req.params.doctorId,
    req.params.startDate,
    req.params.endDate
  );
  res.json({ success: true, data: availability });
}));

/**
 * GET /availability/:doctorId/:date/slots - Get available slots only
 */
router.get('/availability/:doctorId/:date/slots', asyncHandler(async (req: Request, res: Response) => {
  const slots = availabilityService.getAvailableSlots(
    req.params.doctorId,
    req.params.date
  );
  res.json({ success: true, data: slots });
}));

/**
 * POST /availability/book - Book a slot
 */
router.post('/availability/book', asyncHandler(async (req: Request, res: Response) => {
  const { doctorId, date, slotStart, slotEnd, consultationId } = req.body;
  const result = await availabilityService.bookSlot(
    doctorId,
    date,
    slotStart,
    slotEnd,
    consultationId
  );
  res.json({ success: true, data: result });
}));

/**
 * DELETE /availability/:doctorId/:date - Delete availability
 */
router.delete('/availability/:doctorId/:date', asyncHandler(async (req: Request, res: Response) => {
  const deleted = availabilityService.deleteAvailability(
    req.params.doctorId,
    req.params.date
  );
  res.json({ success: true, data: { deleted } });
}));

// ============== NOTES ROUTES ==============

/**
 * POST /sessions/:sessionId/notes - Save consultation notes
 */
router.post('/sessions/:sessionId/notes', asyncHandler(async (req: Request, res: Response) => {
  const validated = SaveNotesSchema.parse(req.body);
  const notes = await notesService.saveNotes(
    req.params.sessionId,
    validated as SaveNotesRequest
  );
  res.status(201).json({ success: true, data: notes });
}));

/**
 * GET /sessions/:sessionId/notes - Get consultation notes
 */
router.get('/sessions/:sessionId/notes', asyncHandler(async (req: Request, res: Response) => {
  const notes = notesService.getNotes(req.params.sessionId);
  if (!notes) {
    res.status(404).json({ success: false, error: 'Notes not found' });
    return;
  }
  res.json({ success: true, data: notes });
}));

/**
 * PUT /sessions/:sessionId/notes - Update notes
 */
router.put('/sessions/:sessionId/notes', asyncHandler(async (req: Request, res: Response) => {
  const notes = await notesService.updateNotes(req.params.sessionId, req.body);
  res.json({ success: true, data: notes });
}));

/**
 * GET /sessions/:sessionId/notes/soap - Get SOAP format notes
 */
router.get('/sessions/:sessionId/notes/soap', asyncHandler(async (req: Request, res: Response) => {
  const soapNote = notesService.generateSoapNote(req.params.sessionId);
  if (!soapNote) {
    res.status(404).json({ success: false, error: 'Notes not found' });
    return;
  }
  res.json({ success: true, data: soapNote });
}));

// ============== PRESCRIPTION ROUTES ==============

/**
 * POST /sessions/:sessionId/prescription - Create prescription
 */
router.post('/sessions/:sessionId/prescription', asyncHandler(async (req: Request, res: Response) => {
  const validated = CreatePrescriptionSchema.parse(req.body);

  // Validate
  const validation = prescriptionService.validatePrescription(validated as CreatePrescriptionRequest);
  if (!validation.valid) {
    res.status(400).json({ success: false, errors: validation.errors });
    return;
  }

  const prescription = await prescriptionService.createPrescription(
    req.params.sessionId,
    validated as CreatePrescriptionRequest
  );
  res.status(201).json({ success: true, data: prescription });
}));

/**
 * GET /sessions/:sessionId/prescription - Get prescription
 */
router.get('/sessions/:sessionId/prescription', asyncHandler(async (req: Request, res: Response) => {
  const prescription = prescriptionService.getPrescription(req.params.sessionId);
  if (!prescription) {
    res.status(404).json({ success: false, error: 'Prescription not found' });
    return;
  }
  res.json({ success: true, data: prescription });
}));

/**
 * POST /sessions/:sessionId/prescription/medicine - Add medicine to prescription
 */
router.post('/sessions/:sessionId/prescription/medicine', asyncHandler(async (req: Request, res: Response) => {
  const prescription = await prescriptionService.addMedicine(
    req.params.sessionId,
    req.body
  );
  res.json({ success: true, data: prescription });
}));

// ============== REVIEW ROUTES ==============

/**
 * POST /sessions/:sessionId/review - Submit review
 */
router.post('/sessions/:sessionId/review', asyncHandler(async (req: Request, res: Response) => {
  const validated = SubmitReviewSchema.parse(req.body);
  const review = await reviewService.submitReview(
    req.params.sessionId,
    validated as SubmitReviewRequest
  );
  res.status(201).json({ success: true, data: review });
}));

/**
 * GET /doctors/:doctorId/reviews - Get doctor reviews
 */
router.get('/doctors/:doctorId/reviews', asyncHandler(async (req: Request, res: Response) => {
  const { limit, offset, minRating } = req.query;
  const result = reviewService.getDoctorReviews(req.params.doctorId, {
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
    minRating: minRating ? parseInt(minRating as string) : undefined,
  });
  res.json({ success: true, data: result });
}));

/**
 * GET /doctors/:doctorId/reviews/stats - Get doctor review statistics
 */
router.get('/doctors/:doctorId/reviews/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = reviewService.getDoctorReviewStats(req.params.doctorId);
  res.json({ success: true, data: stats });
}));

/**
 * GET /doctors/:doctorId/reviews/distribution - Get rating distribution
 */
router.get('/doctors/:doctorId/reviews/distribution', asyncHandler(async (req: Request, res: Response) => {
  const distribution = reviewService.getRatingDistribution(req.params.doctorId);
  res.json({ success: true, data: distribution });
}));

/**
 * GET /doctors/top-rated - Get top rated doctors
 */
router.get('/doctors/top-rated', asyncHandler(async (req: Request, res: Response) => {
  const minReviews = req.query.minReviews ? parseInt(req.query.minReviews as string) : 10;
  const topDoctors = reviewService.getTopRatedDoctors(minReviews);
  res.json({ success: true, data: topDoctors });
}));

export default router;
