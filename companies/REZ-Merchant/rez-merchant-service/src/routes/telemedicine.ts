/**
 * Telemedicine Routes - Healthcare Telemedicine Session Management
 * Route: /api/v1/merchant/telemedicine
 */

import { Router } from 'express';
import { merchantAuth } from '../middleware/auth';
import { telemedicineService, SessionInput } from '../services/telemedicineService';
import { errorResponse, errors } from '../utils/response';

const router = Router();

// All routes require merchant authentication
router.use(merchantAuth);

/**
 * POST /telemedicine - Schedule a new telemedicine session
 */
router.post('/', async (req, res) => {
  try {
    const {
      appointmentId,
      patientId,
      doctorId,
      storeId,
      scheduledTime,
      recordingConsent,
    } = req.body;

    // Validate required fields
    if (!appointmentId || !patientId || !doctorId || !storeId || !scheduledTime) {
      return errorResponse(res, errors.badRequest('Missing required fields: appointmentId, patientId, doctorId, storeId, scheduledTime'));
    }

    // Validate scheduledTime is a future date
    const sessionTime = new Date(scheduledTime);
    if (isNaN(sessionTime.getTime())) {
      return errorResponse(res, errors.badRequest('Invalid scheduledTime format'));
    }

    if (sessionTime <= new Date()) {
      return errorResponse(res, errors.badRequest('scheduledTime must be a future date'));
    }

    const input: SessionInput = {
      appointmentId,
      patientId,
      doctorId,
      storeId,
      merchantId: req.merchantId,
      scheduledTime: sessionTime,
      recordingConsent: recordingConsent ?? false,
    };

    const session = await telemedicineService.scheduleSession(input);

    res.status(201).json({
      success: true,
      message: 'Telemedicine session scheduled successfully',
      data: session,
    });
  } catch (error) {
    console.error('Error scheduling telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule telemedicine session',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /telemedicine/:id/start - Start a telemedicine session
 */
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await telemedicineService.startSession(id);

    res.json({
      success: true,
      message: 'Telemedicine session started',
      data: {
        meetingLink: result.meetingLink,
        sessionId: result.session._id,
      },
    });
  } catch (error) {
    console.error('Error starting telemedicine session:', error);

    if ((error as Error).message === 'Session not found') {
      return errorResponse(res, errors.notFound('Telemedicine session'));
    }

    if ((error as Error).message.includes('Cannot start')) {
      return errorResponse(res, errors.badRequest((error as Error).message));
    }

    res.status(500).json({
      success: false,
      message: 'Failed to start telemedicine session',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /telemedicine/:id/end - End a telemedicine session
 */
router.post('/:id/end', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const session = await telemedicineService.endSession(id, notes);

    res.json({
      success: true,
      message: 'Telemedicine session ended',
      data: session,
    });
  } catch (error) {
    console.error('Error ending telemedicine session:', error);

    if ((error as Error).message === 'Session not found') {
      return errorResponse(res, errors.notFound('Telemedicine session'));
    }

    if ((error as Error).message.includes('Cannot end')) {
      return errorResponse(res, errors.badRequest((error as Error).message));
    }

    res.status(500).json({
      success: false,
      message: 'Failed to end telemedicine session',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /telemedicine/:id/cancel - Cancel a telemedicine session
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await telemedicineService.cancelSession(id);

    res.json({
      success: true,
      message: 'Telemedicine session cancelled',
      data: session,
    });
  } catch (error) {
    console.error('Error cancelling telemedicine session:', error);

    if ((error as Error).message === 'Session not found') {
      return errorResponse(res, errors.notFound('Telemedicine session'));
    }

    if ((error as Error).message.includes('Cannot cancel')) {
      return errorResponse(res, errors.badRequest((error as Error).message));
    }

    res.status(500).json({
      success: false,
      message: 'Failed to cancel telemedicine session',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /telemedicine/:id/no-show - Mark session as no-show
 */
router.post('/:id/no-show', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await telemedicineService.markNoShow(id);

    res.json({
      success: true,
      message: 'Session marked as no-show',
      data: session,
    });
  } catch (error) {
    console.error('Error marking session as no-show:', error);

    if ((error as Error).message === 'Session not found') {
      return errorResponse(res, errors.notFound('Telemedicine session'));
    }

    res.status(500).json({
      success: false,
      message: 'Failed to mark session as no-show',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /telemedicine/:id - Get a telemedicine session by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await telemedicineService.getSession(id);

    if (!session) {
      return errorResponse(res, errors.notFound('Telemedicine session'));
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error fetching telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch telemedicine session',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /telemedicine/doctor/:doctorId - Get sessions for a doctor on a specific date
 */
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    const sessionDate = date ? new Date(date as string) : new Date();
    if (isNaN(sessionDate.getTime())) {
      return errorResponse(res, errors.badRequest('Invalid date format'));
    }

    const sessions = await telemedicineService.getSessions(doctorId, sessionDate);

    res.json({
      success: true,
      data: sessions,
      meta: {
        doctorId,
        date: sessionDate.toISOString().split('T')[0],
        count: sessions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching doctor telemedicine sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch telemedicine sessions',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /telemedicine/doctor/:doctorId/upcoming - Get upcoming sessions for a doctor
 */
router.get('/doctor/:doctorId/upcoming', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { limit } = req.query;

    const sessions = await telemedicineService.getUpcomingSessions(
      doctorId,
      limit ? parseInt(limit as string) : 10
    );

    res.json({
      success: true,
      data: sessions,
      meta: {
        doctorId,
        count: sessions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching upcoming telemedicine sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming telemedicine sessions',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /telemedicine/doctor/:doctorId/stats - Get session statistics for a doctor
 */
router.get('/doctor/:doctorId/stats', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return errorResponse(res, errors.badRequest('Invalid date format'));
    }

    const stats = await telemedicineService.getSessionStats(doctorId, start, end);

    res.json({
      success: true,
      data: stats,
      meta: {
        doctorId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching telemedicine session stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session statistics',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /telemedicine/patient/:patientId - Get sessions for a patient
 */
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status, limit, page } = req.query;

    const result = await telemedicineService.getPatientSessions(patientId, {
      status: status as unknown,
      limit: limit ? parseInt(limit as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
    });

    res.json({
      success: true,
      data: result.sessions,
      pagination: {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (parseInt(limit as string) || 20)),
      },
    });
  } catch (error) {
    console.error('Error fetching patient telemedicine sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch telemedicine sessions',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /telemedicine/:id/prescription - Add prescription to session
 */
router.post('/:id/prescription', async (req, res) => {
  try {
    const { id } = req.params;
    const { prescriptionId } = req.body;

    if (!prescriptionId) {
      return errorResponse(res, errors.badRequest('Missing required field: prescriptionId'));
    }

    const session = await telemedicineService.addPrescription(id, prescriptionId);

    if (!session) {
      return errorResponse(res, errors.notFound('Telemedicine session'));
    }

    res.json({
      success: true,
      message: 'Prescription added to session',
      data: session,
    });
  } catch (error) {
    console.error('Error adding prescription to telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add prescription to session',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /telemedicine/:id/recording - Set recording URL for session
 */
router.post('/:id/recording', async (req, res) => {
  try {
    const { id } = req.params;
    const { recordingUrl } = req.body;

    if (!recordingUrl) {
      return errorResponse(res, errors.badRequest('Missing required field: recordingUrl'));
    }

    const session = await telemedicineService.setRecordingUrl(id, recordingUrl);

    if (!session) {
      return errorResponse(res, errors.notFound('Telemedicine session'));
    }

    res.json({
      success: true,
      message: 'Recording URL set for session',
      data: session,
    });
  } catch (error) {
    console.error('Error setting recording URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set recording URL',
      error: (error as Error).message,
    });
  }
});

export default router;
