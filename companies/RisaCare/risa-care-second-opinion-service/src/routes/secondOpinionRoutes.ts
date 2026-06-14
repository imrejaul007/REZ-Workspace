/**
 * Second Opinion Service Routes
 */
import { Router, Request, Response } from 'express';
import { requestService } from '../services/requestService.js';
import { specialistService } from '../services/specialistService.js';
import { opinionService } from '../services/opinionService.js';
import { RequestStatus, ReportType, UrgencyLevel } from '../models/secondOpinion.js';

const router = Router();

// Helper for async handler errors
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response) => fn(req, res).catch((err: Error) => {
    res.status(500).json({ success: false, error: err.message });
  });

// ============== REQUESTS ==============

/**
 * POST /requests - Create second opinion request
 */
router.post('/requests', asyncHandler(async (req: Request, res: Response) => {
  const request = await requestService.createRequest(req.body);
  res.status(201).json({ success: true, data: request });
}));

/**
 * GET /requests/:patientId - Get patient's requests
 */
router.get('/requests/:patientId', asyncHandler(async (req: Request, res: Response) => {
  const requests = await requestService.getPatientRequests(req.params.patientId);
  res.json({ success: true, data: requests, count: requests.length });
}));

/**
 * GET /requests/detail/:requestId - Get request details
 */
router.get('/requests/detail/:requestId', asyncHandler(async (req: Request, res: Response) => {
  const request = await requestService.getRequest(req.params.requestId);
  if (!request) {
    return res.status(404).json({ success: false, error: 'Request not found' });
  }

  // Get assigned specialist if any
  let specialist = null;
  if (request.assignedSpecialistId) {
    specialist = await specialistService.getSpecialist(request.assignedSpecialistId);
  }

  // Get opinions
  const opinions = await opinionService.getRequestOpinions(request.requestId);

  res.json({ success: true, data: { request, specialist, opinions } });
}));

/**
 * PUT /requests/:requestId - Update request status
 */
router.put('/requests/:requestId', asyncHandler(async (req: Request, res: Response) => {
  const { status, specialistId } = req.body;
  const request = await requestService.updateRequestStatus(
    req.params.requestId,
    status as RequestStatus,
    specialistId
  );
  if (!request) {
    return res.status(404).json({ success: false, error: 'Request not found' });
  }
  res.json({ success: true, data: request });
}));

/**
 * GET /requests - List all requests with optional filters
 */
router.get('/requests', asyncHandler(async (req: Request, res: Response) => {
  const { status, specialty, urgency } = req.query;
  const requests = await requestService.getAllRequests({
    status: status as RequestStatus,
    specialty: specialty as string,
    urgency: urgency as UrgencyLevel,
  });
  res.json({ success: true, data: requests, count: requests.length });
}));

/**
 * POST /requests/:requestId/assign - Assign specialist to request
 */
router.post('/requests/:requestId/assign', asyncHandler(async (req: Request, res: Response) => {
  const { specialistId } = req.body;
  const request = await requestService.assignSpecialist(req.params.requestId, specialistId);
  if (!request) {
    return res.status(404).json({ success: false, error: 'Request not found' });
  }
  res.json({ success: true, data: request });
}));

// ============== SPECIALISTS ==============

/**
 * GET /specialists - List all specialists
 */
router.get('/specialists', asyncHandler(async (req: Request, res: Response) => {
  const { specialty, minRating, maxFee, language, availableOnly } = req.query;
  const specialists = await specialistService.listSpecialists({
    specialty: specialty as string,
    minRating: minRating ? parseFloat(minRating as string) : undefined,
    maxFee: maxFee ? parseFloat(maxFee as string) : undefined,
    language: language as string,
    availableOnly: availableOnly === 'true',
  });
  res.json({ success: true, data: specialists, count: specialists.length });
}));

/**
 * GET /specialists/search - Search specialists
 */
router.get('/specialists/search', asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ success: false, error: 'Query parameter required' });
  }
  const specialists = await specialistService.findSpecialists(query as string);
  res.json({ success: true, data: specialists, count: specialists.length });
}));

/**
 * GET /specialists/match - Match specialists for a request
 */
router.get('/specialists/match', asyncHandler(async (req: Request, res: Response) => {
  const { specialty, language, maxFee, minRating } = req.query;
  if (!specialty) {
    return res.status(400).json({ success: false, error: 'Specialty parameter required' });
  }
  const specialists = await specialistService.matchSpecialist(specialty as string, {
    language: language as string,
    maxFee: maxFee ? parseFloat(maxFee as string) : undefined,
    minRating: minRating ? parseFloat(minRating as string) : undefined,
  });
  res.json({ success: true, data: specialists, count: specialists.length });
}));

/**
 * GET /specialists/:specialistId - Get specialist details
 */
router.get('/specialists/:specialistId', asyncHandler(async (req: Request, res: Response) => {
  const specialist = await specialistService.getSpecialist(req.params.specialistId);
  if (!specialist) {
    return res.status(404).json({ success: false, error: 'Specialist not found' });
  }

  // Get stats
  const stats = await specialistService.getSpecialistStats(req.params.specialistId);

  res.json({ success: true, data: { ...specialist, stats } });
}));

/**
 * GET /specialists/:specialistId/availability - Get specialist availability
 */
router.get('/specialists/:specialistId/availability', asyncHandler(async (req: Request, res: Response) => {
  const { dayOfWeek } = req.query;
  const availability = await specialistService.getAvailableSlots(
    req.params.specialistId,
    dayOfWeek ? parseInt(dayOfWeek as string) : undefined
  );
  res.json({ success: true, data: availability });
}));

/**
 * GET /specialists/specialties - Get specialists grouped by specialty
 */
router.get('/specialists/specialties', asyncHandler(async (req: Request, res: Response) => {
  const grouped = await specialistService.getSpecialistsBySpecialty();
  res.json({ success: true, data: grouped });
}));

// ============== OPINIONS ==============

/**
 * POST /opinions - Submit second opinion
 */
router.post('/opinions', asyncHandler(async (req: Request, res: Response) => {
  const opinion = await opinionService.submitOpinion(req.body);
  if (!opinion) {
    return res.status(404).json({ success: false, error: 'Request or specialist not found' });
  }
  res.status(201).json({ success: true, data: opinion });
}));

/**
 * GET /opinions/:reportId - Get opinion report
 */
router.get('/opinions/:reportId', asyncHandler(async (req: Request, res: Response) => {
  const opinion = await opinionService.getOpinion(req.params.reportId);
  if (!opinion) {
    return res.status(404).json({ success: false, error: 'Opinion report not found' });
  }
  res.json({ success: true, data: opinion });
}));

/**
 * GET /opinions/request/:requestId - Get opinions for a request
 */
router.get('/opinions/request/:requestId', asyncHandler(async (req: Request, res: Response) => {
  const opinions = await opinionService.getRequestOpinions(req.params.requestId);
  res.json({ success: true, data: opinions, count: opinions.length });
}));

/**
 * GET /opinions/request/:requestId/summary - Get opinion summary
 */
router.get('/opinions/request/:requestId/summary', asyncHandler(async (req: Request, res: Response) => {
  const summary = await opinionService.getOpinionSummary(req.params.requestId);
  if (!summary) {
    return res.status(404).json({ success: false, error: 'No opinions found for this request' });
  }
  res.json({ success: true, data: summary });
}));

/**
 * GET /opinions/patient/:patientId - Get all opinions for a patient
 */
router.get('/opinions/patient/:patientId', asyncHandler(async (req: Request, res: Response) => {
  const opinions = await opinionService.getPatientOpinions(req.params.patientId);
  res.json({ success: true, data: opinions, count: opinions.length });
}));

/**
 * POST /opinions/:requestId/complete - Mark request as completed
 */
router.post('/opinions/:requestId/complete', asyncHandler(async (req: Request, res: Response) => {
  const success = await opinionService.completeRequest(req.params.requestId);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Request not found' });
  }
  res.json({ success: true, message: 'Request completed' });
}));

// ============== REPORTS ==============

/**
 * POST /reports - Upload medical report
 */
router.post('/reports', asyncHandler(async (req: Request, res: Response) => {
  const { requestId, type, title, fileUrl } = req.body;
  const report = await requestService.uploadReport(requestId, {
    type: type as ReportType,
    title,
    fileUrl,
  });
  if (!report) {
    return res.status(404).json({ success: false, error: 'Request not found' });
  }
  res.status(201).json({ success: true, data: report });
}));

/**
 * GET /reports/:requestId - Get reports for a request
 */
router.get('/reports/:requestId', asyncHandler(async (req: Request, res: Response) => {
  const reports = await requestService.getReports(req.params.requestId);
  res.json({ success: true, data: reports, count: reports.length });
}));

export default router;
