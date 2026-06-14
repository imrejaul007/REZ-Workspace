import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AddRecordInputSchema, SetReminderInputSchema } from '../models/vaccination';
import * as vaccinationService from '../services/vaccinationService';

const router = Router();

// Helper for async handler errors
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response) => fn(req, res).catch((err: Error) => {
    res.status(500).json({ success: false, error: err.message });
  });

// ============== VACCINATION RECORDS ==============

/**
 * POST /vaccinations - Add vaccination record
 */
router.post('/vaccinations', asyncHandler(async (req: Request, res: Response) => {
  const validated = AddRecordInputSchema.parse(req.body);
  const record = vaccinationService.addVaccinationRecord(validated);
  res.status(201).json({ success: true, data: record });
}));

/**
 * GET /vaccinations/:userId - Get user's vaccination records
 */
router.get('/vaccinations/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const records = vaccinationService.getVaccinationRecords(userId);
  res.json({ success: true, data: records, count: records.length });
}));

/**
 * GET /vaccinations/:userId/upcoming - Get upcoming vaccinations
 */
router.get('/vaccinations/:userId/upcoming', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const upcoming = vaccinationService.getUpcomingVaccinations(userId);
  res.json({ success: true, data: upcoming, count: upcoming.length });
}));

/**
 * GET /vaccinations/:userId/overdue - Get overdue vaccinations
 */
router.get('/vaccinations/:userId/overdue', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const overdue = vaccinationService.getOverdueVaccinations(userId);
  res.json({ success: true, data: overdue, count: overdue.length });
}));

/**
 * GET /vaccinations/:userId/compliance - Get compliance report
 */
router.get('/vaccinations/:userId/compliance', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const report = vaccinationService.getComplianceReport(userId);
  res.json({ success: true, data: report });
}));

/**
 * GET /vaccinations/record/:recordId - Get specific record
 */
router.get('/vaccinations/record/:recordId', asyncHandler(async (req: Request, res: Response) => {
  const record = vaccinationService.getVaccinationRecord(req.params.recordId);
  if (!record) {
    return res.status(404).json({ success: false, error: 'Record not found' });
  }
  res.json({ success: true, data: record });
}));

// ============== VACCINE CATALOG ==============

/**
 * GET /vaccines - Get vaccine catalog
 */
router.get('/vaccines', asyncHandler(async (req: Request, res: Response) => {
  const { ageGroup } = req.query;
  const vaccines = vaccinationService.getVaccineCatalog(ageGroup as any);
  res.json({ success: true, data: vaccines, count: vaccines.length });
}));

/**
 * GET /vaccines/:code - Get vaccine details
 */
router.get('/vaccines/:code', asyncHandler(async (req: Request, res: Response) => {
  const vaccine = vaccinationService.getVaccine(req.params.code);
  if (!vaccine) {
    return res.status(404).json({ success: false, error: 'Vaccine not found' });
  }
  res.json({ success: true, data: vaccine });
}));

// ============== REMINDERS ==============

/**
 * POST /reminders - Set a reminder
 */
router.post('/reminders', asyncHandler(async (req: Request, res: Response) => {
  const validated = SetReminderInputSchema.parse(req.body);
  const reminder = vaccinationService.setReminder(validated);
  res.status(201).json({ success: true, data: reminder });
}));

/**
 * GET /reminders/:userId - Get user's reminders
 */
router.get('/reminders/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const reminders = vaccinationService.getReminders(userId);
  res.json({ success: true, data: reminders, count: reminders.length });
}));

/**
 * PUT /reminders/:reminderId/sent - Mark reminder as sent
 */
router.put('/reminders/:reminderId/sent', asyncHandler(async (req: Request, res: Response) => {
  const reminder = vaccinationService.markReminderSent(req.params.reminderId);
  if (!reminder) {
    return res.status(404).json({ success: false, error: 'Reminder not found' });
  }
  res.json({ success: true, data: reminder });
}));

// ============== CERTIFICATES ==============

/**
 * POST /certificates - Generate immunization certificate
 */
router.post('/certificates', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId is required' });
  }
  const certificate = vaccinationService.generateCertificate(userId);
  res.status(201).json({ success: true, data: certificate });
}));

/**
 * GET /certificates/:certificateId - Get certificate
 */
router.get('/certificates/:certificateId', asyncHandler(async (req: Request, res: Response) => {
  const certificate = vaccinationService.getCertificate(req.params.certificateId);
  if (!certificate) {
    return res.status(404).json({ success: false, error: 'Certificate not found' });
  }
  res.json({ success: true, data: certificate });
}));

export default router;
