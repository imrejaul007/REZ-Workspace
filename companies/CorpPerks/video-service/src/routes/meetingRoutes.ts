import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { meetingService } from '../services';
import {
  CreateMeetingSchema,
  UpdateMeetingSchema,
  JoinMeetingSchema,
  LeaveMeetingSchema,
  MeetingQuerySchema,
} from '../validators';
import { MeetingStatus } from '../types';

const router = Router();

// Helper to extract context from headers
const getContext = (req: Request) => ({
  userId: req.headers['x-user-id'] as string || 'system',
  userName: req.headers['x-user-name'] as string || 'System',
  companyId: req.headers['x-company-id'] as string || process.env.DEFAULT_COMPANY_ID || 'corpservice',
});

/**
 * POST /api/meetings - Create a new meeting
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, userName, companyId } = getContext(req);
    const input = CreateMeetingSchema.parse(req.body);

    const meeting = await meetingService.create(input, userId, userName, companyId);

    res.status(201).json({
      success: true,
      data: meeting,
      message: 'Meeting created successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/meetings - List meetings
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = MeetingQuerySchema.parse(req.query);
    const result = await meetingService.list(query);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/meetings/upcoming/:userId - Get upcoming meetings for user
 */
router.get('/upcoming/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit } = req.query;
    const meetings = await meetingService.getUpcoming(
      req.params.userId,
      limit ? parseInt(limit as string) : 10
    );

    res.json({
      success: true,
      data: meetings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/meetings/today/:userId - Get today's meetings for user
 */
router.get('/today/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meetings = await meetingService.getToday(req.params.userId);

    res.json({
      success: true,
      data: meetings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/meetings/range/:userId - Get meetings in date range
 */
router.get('/range/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      res.status(400).json({
        success: false,
        error: 'fromDate and toDate are required',
      });
      return;
    }

    const meetings = await meetingService.getInRange(
      req.params.userId,
      fromDate as string,
      toDate as string
    );

    res.json({
      success: true,
      data: meetings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/meetings/:id - Get meeting by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await meetingService.getById(req.params.id);

    if (!meeting) {
      res.status(404).json({
        success: false,
        error: 'Meeting not found',
      });
      return;
    }

    res.json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/meetings/:id - Update meeting
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = getContext(req);
    const input = UpdateMeetingSchema.parse(req.body);

    const meeting = await meetingService.update(req.params.id, input, userId);

    if (!meeting) {
      res.status(404).json({
        success: false,
        error: 'Meeting not found or cannot be updated',
      });
      return;
    }

    res.json({
      success: true,
      data: meeting,
      message: 'Meeting updated successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    if (error instanceof Error) {
      res.status(403).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/meetings/:id/join - Join a meeting
 */
router.post('/:id/join', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = JoinMeetingSchema.parse(req.body);

    const result = await meetingService.join(req.params.id, input);

    res.json({
      success: true,
      data: result,
      message: 'Joined meeting successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/meetings/:id/leave - Leave a meeting
 */
router.post('/:id/leave', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { participantId } = LeaveMeetingSchema.parse(req.body);

    const meeting = await meetingService.leave(req.params.id, participantId);

    if (!meeting) {
      res.status(404).json({
        success: false,
        error: 'Meeting or participant not found',
      });
      return;
    }

    res.json({
      success: true,
      data: meeting,
      message: 'Left meeting successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/meetings/:id/end - End a meeting (host only)
 */
router.post('/:id/end', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = getContext(req);

    const meeting = await meetingService.end(req.params.id, userId);

    if (!meeting) {
      res.status(404).json({
        success: false,
        error: 'Meeting not found',
      });
      return;
    }

    res.json({
      success: true,
      data: meeting,
      message: 'Meeting ended successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(403).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/meetings/:id/cancel - Cancel a meeting
 */
router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = getContext(req);
    const { reason } = req.body;

    const meeting = await meetingService.cancel(req.params.id, userId, reason);

    if (!meeting) {
      res.status(404).json({
        success: false,
        error: 'Meeting not found or cannot be cancelled',
      });
      return;
    }

    res.json({
      success: true,
      data: meeting,
      message: 'Meeting cancelled successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(403).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/meetings/:id/participants - Add participant
 */
router.post('/:id/participants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, name, email, role } = req.body;

    const meeting = await meetingService.addParticipant(
      req.params.id,
      userId,
      name,
      email,
      role
    );

    if (!meeting) {
      res.status(404).json({
        success: false,
        error: 'Meeting not found',
      });
      return;
    }

    res.json({
      success: true,
      data: meeting,
      message: 'Participant added successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

/**
 * DELETE /api/meetings/:id/participants/:participantId - Remove participant
 */
router.delete('/:id/participants/:participantId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = getContext(req);

    const meeting = await meetingService.removeParticipant(
      req.params.id,
      req.params.participantId,
      userId
    );

    if (!meeting) {
      res.status(404).json({
        success: false,
        error: 'Meeting or participant not found',
      });
      return;
    }

    res.json({
      success: true,
      data: meeting,
      message: 'Participant removed successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(403).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/meetings/stats/:userId - Get meeting stats for user
 */
router.get('/stats/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await meetingService.getStats(req.params.userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/meetings/:id - Delete meeting
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await meetingService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Meeting not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Meeting deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
