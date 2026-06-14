import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TelemedicineService } from '../services/TelemedicineService';
import { logger } from '../config/logger';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const telemedicineService = new TelemedicineService();

// Apply authentication to all routes - HIPAA requires proper auth for telemedicine sessions
router.use(authenticateToken);

// Validation schemas
const startSessionSchema = z.object({
  appointmentId: z.string().min(1),
  patientId: z.string().min(1),
  providerId: z.string().min(1),
  enableRecording: z.boolean().optional(),
});

const joinSessionSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(['patient', 'provider']),
});

// Start telemedicine session
router.post('/session/start', async (req: Request, res: Response) => {
  try {
    const validatedData = startSessionSchema.parse(req.body);

    const session = await telemedicineService.startSession(validatedData);

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    } else {
      logger.error('Failed to start telemedicine session', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to start telemedicine session',
      });
    }
  }
});

// Join telemedicine session
router.post('/session/join', async (req: Request, res: Response) => {
  try {
    const validatedData = joinSessionSchema.parse(req.body);

    const session = await telemedicineService.joinSession(
      validatedData.sessionId,
      validatedData.userId,
      validatedData.role
    );

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    } else if (error instanceof Error && error.message === 'Session has ended') {
      res.status(410).json({
        success: false,
        error: 'Session has ended',
      });
    } else {
      logger.error('Failed to join telemedicine session', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to join telemedicine session',
      });
    }
  }
});

// End telemedicine session
router.post('/session/:sessionId/end', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await telemedicineService.endSession(sessionId);

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    logger.error('Failed to end telemedicine session', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      success: false,
      error: 'Failed to end telemedicine session',
    });
  }
});

// Get session details
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await telemedicineService.getSession(sessionId);

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    logger.error('Failed to get session', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      success: false,
      error: 'Failed to get session',
    });
  }
});

// Get active sessions for user
router.get('/sessions/active/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const sessions = await telemedicineService.getActiveSessions(userId);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    logger.error('Failed to get active sessions', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: 'Failed to get active sessions',
    });
  }
});

// Generate presigned URL for recording
router.post('/session/:sessionId/recording-url', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { fileName } = req.body;

    if (!fileName) {
      res.status(400).json({
        success: false,
        error: 'fileName is required',
      });
      return;
    }

    const url = await telemedicineService.generatePresignedUrl(sessionId, fileName);

    res.json({
      success: true,
      data: { url },
    });
  } catch (error) {
    logger.error('Failed to generate recording URL', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      success: false,
      error: 'Failed to generate recording URL',
    });
  }
});

export default router;
