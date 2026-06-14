import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { oneOnOneService } from '../services/oneOnOneService';
import { meetingService } from '../services/meetingService';
import { ApiResponse } from '../types';
import { OneOnOneDocument } from '../models/OneOnOne';
import { MeetingDocument } from '../models/Meeting';

const router = Router();

// Validation schemas
const scheduleOneOnOneSchema = z.object({
  managerId: z.string().min(1),
  managerName: z.string().min(1),
  managerAvatar: z.string().optional(),
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  employeeAvatar: z.string().optional(),
  type: z.enum(['1on1', 'skip_level', 'team_meeting']),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  nextScheduled: z.string().datetime(),
  duration: z.number().min(15).max(120).optional(),
  preferredTime: z.string().optional(),
  preferredDays: z.array(z.number().min(0).max(6)).optional(),
  timezone: z.string().optional(),
  meetingLink: z.string().optional(),
});

const updateOneOnOneSchema = z.object({
  frequency: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
  duration: z.number().min(15).max(120).optional(),
  preferredTime: z.string().optional(),
  preferredDays: z.array(z.number().min(0).max(6)).optional(),
  meetingTemplate: z.object({
    defaultAgenda: z.array(z.string()).optional(),
    defaultDuration: z.number().min(15).max(120).optional(),
    includeLastMeetingReview: z.boolean().optional(),
  }).optional(),
});

const scheduleNextMeetingSchema = z.object({
  scheduledStart: z.string().datetime(),
  duration: z.number().min(15).max(120).optional(),
  meetingLink: z.string().optional(),
  agenda: z.array(z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    topicType: z.enum(['discussion', 'update', 'decision', 'feedback', 'goal', 'blocker', 'other']),
    duration: z.number().min(1).max(120).optional(),
  })).optional(),
});

// Middleware for async error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==================== 1:1 CRUD ====================

// Schedule 1:1 meeting
router.post('/schedule',
  asyncHandler(async (req: Request, res: Response) => {
    const { companyId, createdById } = req.body;
    const validated = scheduleOneOnOneSchema.parse(req.body);

    if (!companyId || !createdById) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'companyId and createdById are required',
      };
      return res.status(400).json(response);
    }

    try {
      const result = await oneOnOneService.scheduleOneOnOne({
        ...validated,
        companyId,
        createdById,
      });

      const response: ApiResponse<{
        oneOnOne: OneOnOneDocument;
        meeting: MeetingDocument;
      }> = {
        success: true,
        data: result,
        message: '1:1 meeting scheduled successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule 1:1',
      };
      res.status(400).json(response);
    }
  })
);

// Get 1:1 by ID
router.get('/:oneOnOneId',
  asyncHandler(async (req: Request, res: Response) => {
    const { oneOnOneId } = req.params;
    const oneOnOne = await oneOnOneService.getOneOnOne(oneOnOneId);

    if (!oneOnOne) {
      const response: ApiResponse<null> = {
        success: false,
        error: '1:1 relationship not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<OneOnOneDocument> = {
      success: true,
      data: oneOnOne,
    };

    res.json(response);
  })
);

// Get 1:1 by pair (manager + employee)
router.get('/pair/:managerId/:employeeId',
  asyncHandler(async (req: Request, res: Response) => {
    const { managerId, employeeId } = req.params;
    const oneOnOne = await oneOnOneService.getOneOnOneByPair(managerId, employeeId);

    if (!oneOnOne) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'No active 1:1 relationship found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<OneOnOneDocument> = {
      success: true,
      data: oneOnOne,
    };

    res.json(response);
  })
);

// Update 1:1 settings
router.patch('/:oneOnOneId',
  asyncHandler(async (req: Request, res: Response) => {
    const { oneOnOneId } = req.params;
    const validated = updateOneOnOneSchema.parse(req.body);

    const oneOnOne = await oneOnOneService.updateOneOnOne(oneOnOneId, validated);

    if (!oneOnOne) {
      const response: ApiResponse<null> = {
        success: false,
        error: '1:1 relationship not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<OneOnOneDocument> = {
      success: true,
      data: oneOnOne,
      message: '1:1 settings updated',
    };

    res.json(response);
  })
);

// Delete/End 1:1 relationship
router.post('/:oneOnOneId/end',
  asyncHandler(async (req: Request, res: Response) => {
    const { oneOnOneId } = req.params;
    const oneOnOne = await oneOnOneService.endOneOnOne(oneOnOneId);

    if (!oneOnOne) {
      const response: ApiResponse<null> = {
        success: false,
        error: '1:1 relationship not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<OneOnOneDocument> = {
      success: true,
      data: oneOnOne,
      message: '1:1 relationship ended',
    };

    res.json(response);
  })
);

// ==================== STATUS MANAGEMENT ====================

// Pause 1:1
router.post('/:oneOnOneId/pause',
  asyncHandler(async (req: Request, res: Response) => {
    const { oneOnOneId } = req.params;
    const { reason } = req.body;

    const oneOnOne = await oneOnOneService.pauseOneOnOne(oneOnOneId, reason);

    if (!oneOnOne) {
      const response: ApiResponse<null> = {
        success: false,
        error: '1:1 relationship not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<OneOnOneDocument> = {
      success: true,
      data: oneOnOne,
      message: '1:1 paused',
    };

    res.json(response);
  })
);

// Resume 1:1
router.post('/:oneOnOneId/resume',
  asyncHandler(async (req: Request, res: Response) => {
    const { oneOnOneId } = req.params;

    const oneOnOne = await oneOnOneService.resumeOneOnOne(oneOnOneId);

    if (!oneOnOne) {
      const response: ApiResponse<null> = {
        success: false,
        error: '1:1 relationship not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<OneOnOneDocument> = {
      success: true,
      data: oneOnOne,
      message: '1:1 resumed',
    };

    res.json(response);
  })
);

// ==================== MEETING MANAGEMENT ====================

// Schedule next meeting
router.post('/:oneOnOneId/schedule-next',
  asyncHandler(async (req: Request, res: Response) => {
    const { oneOnOneId } = req.params;
    const validated = scheduleNextMeetingSchema.parse(req.body);

    const meeting = await oneOnOneService.scheduleNextMeeting(oneOnOneId, {
      ...validated,
      scheduledStart: new Date(validated.scheduledStart),
    });

    if (!meeting) {
      const response: ApiResponse<null> = {
        success: false,
        error: '1:1 not found or not active',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<MeetingDocument> = {
      success: true,
      data: meeting,
      message: 'Next meeting scheduled',
    };

    res.status(201).json(response);
  })
);

// Get 1:1 stats
router.get('/:oneOnOneId/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const { oneOnOneId } = req.params;

    const stats = await oneOnOneService.getOneOnOneStats(oneOnOneId);

    if (!stats) {
      const response: ApiResponse<null> = {
        success: false,
        error: '1:1 relationship not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
    };

    res.json(response);
  })
);

// ==================== QUERIES ====================

// Get manager's 1:1s
router.get('/manager/:managerId',
  asyncHandler(async (req: Request, res: Response) => {
    const { managerId } = req.params;
    const { status, limit, skip } = req.query;

    const oneOnOnes = await oneOnOneService.getByManager(managerId, {
      status: status as 'active' | 'paused' | 'ended' | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined,
    });

    const response: ApiResponse<typeof oneOnOnes> = {
      success: true,
      data: oneOnOnes,
    };

    res.json(response);
  })
);

// Get employee's 1:1s
router.get('/employee/:employeeId',
  asyncHandler(async (req: Request, res: Response) => {
    const { employeeId } = req.params;
    const { status } = req.query;

    const oneOnOnes = await oneOnOneService.getByEmployee(employeeId, {
      status: status as 'active' | 'paused' | 'ended' | undefined,
    });

    const response: ApiResponse<typeof oneOnOnes> = {
      success: true,
      data: oneOnOnes,
    };

    res.json(response);
  })
);

// Get upcoming 1:1s for user
router.get('/upcoming/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { limit, daysAhead } = req.query;

    const oneOnOnes = await oneOnOneService.getUpcomingForUser(userId, {
      limit: limit ? parseInt(limit as string) : undefined,
      daysAhead: daysAhead ? parseInt(daysAhead as string) : undefined,
    });

    const response: ApiResponse<typeof oneOnOnes> = {
      success: true,
      data: oneOnOnes,
    };

    res.json(response);
  })
);

// Get active 1:1s for user
router.get('/active/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const oneOnOnes = await oneOnOneService.getActiveForUser(userId);

    const response: ApiResponse<typeof oneOnOnes> = {
      success: true,
      data: oneOnOnes,
    };

    res.json(response);
  })
);

// Get direct reports with 1:1 info
router.get('/direct-reports/:managerId',
  asyncHandler(async (req: Request, res: Response) => {
    const { managerId } = req.params;

    const reports = await oneOnOneService.getDirectReportsWithOneOnOne(managerId);

    const response: ApiResponse<typeof reports> = {
      success: true,
      data: reports,
    };

    res.json(response);
  })
);

// Get company 1:1 stats
router.get('/stats/company/:companyId',
  asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params;

    const stats = await oneOnOneService.getCompanyStats(companyId);

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
    };

    res.json(response);
  })
);

// Get meeting by 1:1
router.get('/:oneOnOneId/meeting',
  asyncHandler(async (req: Request, res: Response) => {
    const { oneOnOneId } = req.params;

    const oneOnOne = await oneOnOneService.getOneOnOne(oneOnOneId);

    if (!oneOnOne) {
      const response: ApiResponse<null> = {
        success: false,
        error: '1:1 relationship not found',
      };
      return res.status(404).json(response);
    }

    const meeting = await meetingService.getMeeting(oneOnOne.meetingId);

    const response: ApiResponse<MeetingDocument | null> = {
      success: true,
      data: meeting,
    };

    res.json(response);
  })
);

// Get meeting history for 1:1
router.get('/:oneOnOneId/history',
  asyncHandler(async (req: Request, res: Response) => {
    const { oneOnOneId } = req.params;
    const { limit, skip } = req.query;

    const oneOnOne = await oneOnOneService.getOneOnOne(oneOnOneId);

    if (!oneOnOne) {
      const response: ApiResponse<null> = {
        success: false,
        error: '1:1 relationship not found',
      };
      return res.status(404).json(response);
    }

    // Get all meetings between the pair
    const meetings = await meetingService.getMeetingHistory(oneOnOne.managerId, {
      limit: limit ? parseInt(limit as string) : 20,
      skip: skip ? parseInt(skip as string) : 0,
    });

    // Filter to only meetings with the employee
    const filteredMeetings = meetings.filter(
      (m) =>
        (m.hostId === oneOnOne.managerId && m.attendeeId === oneOnOne.employeeId) ||
        (m.hostId === oneOnOne.employeeId && m.attendeeId === oneOnOne.managerId)
    );

    const response: ApiResponse<typeof filteredMeetings> = {
      success: true,
      data: filteredMeetings,
    };

    res.json(response);
  })
);

export default router;
