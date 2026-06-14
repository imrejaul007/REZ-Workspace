import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { meetingService } from '../services/meetingService';
import { calendarService } from '../services/calendarService';
import { ApiResponse, PaginatedResponse } from '../types';
import { MeetingDocument } from '../models/Meeting';

const router = Router();

// Validation schemas
const createMeetingSchema = z.object({
  companyId: z.string().min(1),
  type: z.enum(['1on1', 'skip_level', 'team_meeting']),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  hostId: z.string().min(1),
  hostName: z.string().min(1),
  hostAvatar: z.string().optional(),
  attendeeId: z.string().min(1),
  attendeeName: z.string().min(1),
  attendeeAvatar: z.string().optional(),
  participantIds: z.array(z.string()).optional(),
  location: z.string().optional(),
  meetingLink: z.string().optional(),
  meetingType: z.enum(['video', 'audio', 'in_person', 'phone']).optional(),
  duration: z.number().min(5).max(480).optional(),
  timezone: z.string().optional(),
  recurrence: z.object({
    frequency: z.enum(['weekly', 'biweekly', 'monthly']),
    endDate: z.string().datetime().optional(),
  }).optional(),
  agenda: z.array(z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    topicType: z.enum(['discussion', 'update', 'decision', 'feedback', 'goal', 'blocker', 'other']),
    duration: z.number().min(1).max(120).optional(),
  })).optional(),
  createdById: z.string().min(1),
});

const updateMeetingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  duration: z.number().min(5).max(480).optional(),
  location: z.string().optional(),
  meetingLink: z.string().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  agendaSent: z.boolean().optional(),
});

const addNoteSchema = z.object({
  content: z.string().min(1),
  discussionSummary: z.string().max(2000).optional(),
  decisions: z.array(z.string()).optional(),
  keyTakeaways: z.array(z.string()).optional(),
  isPrivate: z.boolean().optional(),
  sharedWith: z.array(z.string()).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
});

const addActionItemSchema = z.object({
  task: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().min(1),
  assigneeName: z.string().min(1),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

const addAgendaItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  topicType: z.enum(['discussion', 'update', 'decision', 'feedback', 'goal', 'blocker', 'other']),
  duration: z.number().min(1).max(120).optional(),
});

const submitFeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  feedbackType: z.enum(['meeting_prep', 'engagement', 'action_items', 'communication', 'overall']),
  comment: z.string().max(2000).optional(),
});

// Middleware for async error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==================== MEETING CRUD ====================

// Create meeting
router.post('/',
  asyncHandler(async (req: Request, res: Response) => {
    const validated = createMeetingSchema.parse(req.body);

    const meeting = await meetingService.createMeeting({
      ...validated,
      scheduledStart: new Date(validated.scheduledStart),
      scheduledEnd: new Date(validated.scheduledEnd),
      recurrence: validated.recurrence ? {
        ...validated.recurrence,
        endDate: validated.recurrence.endDate ? new Date(validated.recurrence.endDate) : undefined,
      } : undefined,
    });

    const response: ApiResponse<MeetingDocument> = {
      success: true,
      data: meeting,
      message: 'Meeting created successfully',
    };

    res.status(201).json(response);
  })
);

// Get meeting by ID
router.get('/:meetingId',
  asyncHandler(async (req: Request, res: Response) => {
    const { meetingId } = req.params;
    const meeting = await meetingService.getMeeting(meetingId);

    if (!meeting) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Meeting not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<MeetingDocument> = {
      success: true,
      data: meeting,
    };

    res.json(response);
  })
);

// Update meeting
router.patch('/:meetingId',
  asyncHandler(async (req: Request, res: Response) => {
    const { meetingId } = req.params;
    const validated = updateMeetingSchema.parse(req.body);

    const updates: Record<string, unknown> = { ...validated };
    if (validated.scheduledStart) {
      updates.scheduledStart = new Date(validated.scheduledStart);
    }
    if (validated.scheduledEnd) {
      updates.scheduledEnd = new Date(validated.scheduledEnd);
    }

    const meeting = await meetingService.updateMeeting(meetingId, updates as Parameters<typeof meetingService.updateMeeting>[1]);

    if (!meeting) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Meeting not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<MeetingDocument> = {
      success: true,
      data: meeting,
      message: 'Meeting updated successfully',
    };

    res.json(response);
  })
);

// Delete meeting
router.delete('/:meetingId',
  asyncHandler(async (req: Request, res: Response) => {
    const { meetingId } = req.params;
    const deleted = await meetingService.deleteMeeting(meetingId);

    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Meeting not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Meeting deleted successfully',
    };

    res.json(response);
  })
);

// ==================== MEETING ACTIONS ====================

// Start meeting
router.post('/:meetingId/start',
  asyncHandler(async (req: Request, res: Response) => {
    const { meetingId } = req.params;
    const meeting = await meetingService.startMeeting(meetingId);

    if (!meeting) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Meeting not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<MeetingDocument> = {
      success: true,
      data: meeting,
      message: 'Meeting started',
    };

    res.json(response);
  })
);

// End meeting
router.post('/:meetingId/end',
  asyncHandler(async (req: Request, res: Response) => {
    const { meetingId } = req.params;
    const { actualEnd, aiSummary } = req.body;

    const meeting = await meetingService.endMeeting(meetingId, { actualEnd, aiSummary });

    if (!meeting) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Meeting not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<MeetingDocument> = {
      success: true,
      data: meeting,
      message: 'Meeting ended',
    };

    res.json(response);
  })
);

// Cancel meeting
router.post('/:meetingId/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    const { meetingId } = req.params;
    const { reason } = req.body;

    const meeting = await meetingService.cancelMeeting(meetingId, reason);

    if (!meeting) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Meeting not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<MeetingDocument> = {
      success: true,
      data: meeting,
      message: 'Meeting cancelled',
    };

    res.json(response);
  })
);

// ==================== NOTES ====================

// Add note
router.post('/:meetingId/note',
  asyncHandler(async (req: Request, res: Response) => {
    const { meetingId } = req.params;
    const { authorId, authorName } = req.body;
    const validated = addNoteSchema.parse(req.body);

    const note = await meetingService.addNote(meetingId, authorId, authorName, validated);

    if (!note) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Meeting not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof note> = {
      success: true,
      data: note,
      message: 'Note added successfully',
    };

    res.status(201).json(response);
  })
);

// Get notes
router.get('/:meetingId/notes',
  asyncHandler(async (req: Request, res: Response) => {
    const { meetingId } = req.params;
    const userId = req.query.userId as string | undefined;

    const notes = await meetingService.getNotes(meetingId, userId);

    const response: ApiResponse<typeof notes> = {
      success: true,
      data: notes,
    };

    res.json(response);
  })
);

// ==================== ACTION ITEMS ====================

// Add action item
router.post('/:meetingId/action-item',
  asyncHandler(async (req: Request, res: Response) => {
    const { meetingId } = req.params;
    const { createdById, createdByName } = req.body;
    const validated = addActionItemSchema.parse(req.body);

    const actionItem = await meetingService.addActionItem(
      meetingId,
      createdById,
      createdByName,
      validated
    );

    if (!actionItem) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Meeting not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof actionItem> = {
      success: true,
      data: actionItem,
      message: 'Action item added',
    };

    res.status(201).json(response);
  })
);

// Get action items
router.get('/:meetingId/action-items',
  asyncHandler(async (req: Request, res: Response) => {
    const { meetingId } = req.params;

    const actionItems = await meetingService.getActionItems(meetingId);

    const response: ApiResponse<typeof actionItems> = {
      success: true,
      data: actionItems,
    };

    res.json(response);
  })
);

// Update action item
router.patch('/action-items/:itemId',
  asyncHandler(async (req: Request, res: Response) => {
    const { itemId } = req.params;
    const { status, dueDate, completedNote } = req.body;

    const actionItem = await meetingService.updateActionItem(itemId, { status, dueDate, completedNote });

    if (!actionItem) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Action item not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof actionItem> = {
      success: true,
      data: actionItem,
      message: 'Action item updated',
    };

    res.json(response);
  })
);

// ==================== FEEDBACK ====================

// Submit feedback
router.post('/:meetingId/feedback',
  asyncHandler(async (req: Request, res: Response) => {
    const { meetingId } = req.params;
    const { reviewerId, reviewerName, revieweeId, revieweeName } = req.body;
    const validated = submitFeedbackSchema.parse(req.body);

    const feedback = await meetingService.submitFeedback(
      meetingId,
      reviewerId,
      reviewerName,
      revieweeId,
      revieweeName,
      validated
    );

    if (!feedback) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Meeting not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof feedback> = {
      success: true,
      data: feedback,
      message: 'Feedback submitted',
    };

    res.status(201).json(response);
  })
);

// Get feedback
router.get('/:meetingId/feedback',
  asyncHandler(async (req: Request, res: Response) => {
    const { meetingId } = req.params;

    const feedback = await meetingService.getFeedback(meetingId);

    const response: ApiResponse<typeof feedback> = {
      success: true,
      data: feedback,
    };

    res.json(response);
  })
);

// ==================== AGENDA ====================

// Add agenda item
router.post('/:meetingId/agenda',
  asyncHandler(async (req: Request, res: Response) => {
    const { meetingId } = req.params;
    const { proposedById, proposedByName } = req.body;
    const validated = addAgendaItemSchema.parse(req.body);

    const agendaItem = await meetingService.addAgendaItem(
      meetingId,
      proposedById,
      proposedByName,
      validated
    );

    if (!agendaItem) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Meeting not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof agendaItem> = {
      success: true,
      data: agendaItem,
      message: 'Agenda item added',
    };

    res.status(201).json(response);
  })
);

// Get agenda
router.get('/:meetingId/agenda',
  asyncHandler(async (req: Request, res: Response) => {
    const { meetingId } = req.params;

    const agenda = await meetingService.getAgenda(meetingId);

    const response: ApiResponse<typeof agenda> = {
      success: true,
      data: agenda,
    };

    res.json(response);
  })
);

// ==================== QUERIES ====================

// Get upcoming meetings
router.get('/upcoming/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = parseInt(req.query.skip as string) || 0;

    const meetings = await meetingService.getUpcomingMeetings(userId, { limit, skip });

    const response: ApiResponse<typeof meetings> = {
      success: true,
      data: meetings,
    };

    res.json(response);
  })
);

// Get today's meetings
router.get('/today/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const meetings = await meetingService.getTodayMeetings(userId);

    const response: ApiResponse<typeof meetings> = {
      success: true,
      data: meetings,
    };

    res.json(response);
  })
);

// Get calendar meetings
router.get('/calendar/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { start, end } = req.query;

    if (!start || !end) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Start and end dates are required',
      };
      return res.status(400).json(response);
    }

    const meetings = await meetingService.getMeetingsInRange(
      userId,
      new Date(start as string),
      new Date(end as string)
    );

    const response: ApiResponse<typeof meetings> = {
      success: true,
      data: meetings,
    };

    res.json(response);
  })
);

// Get meeting history
router.get('/history/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = parseInt(req.query.skip as string) || 0;
    const status = req.query.status as string | undefined;

    const meetings = await meetingService.getMeetingHistory(userId, { limit, skip, status });

    const response: ApiResponse<typeof meetings> = {
      success: true,
      data: meetings,
    };

    res.json(response);
  })
);

// Get user action items
router.get('/action-items/my/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { status, overdue, limit } = req.query;

    const actionItems = await meetingService.getUserActionItems(userId, {
      status: status as string | undefined,
      overdue: overdue === 'true',
      limit: limit ? parseInt(limit as string) : undefined,
    });

    const response: ApiResponse<typeof actionItems> = {
      success: true,
      data: actionItems,
    };

    res.json(response);
  })
);

// Get meeting stats
router.get('/stats/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const stats = await meetingService.getMeetingStats(userId);

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
    };

    res.json(response);
  })
);

// ==================== CALENDAR ====================

// Check conflicts
router.post('/calendar/conflicts',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, startTime, endTime, excludeMeetingId } = req.body;

    const conflicts = await calendarService.checkConflicts(
      userId,
      new Date(startTime),
      new Date(endTime),
      excludeMeetingId
    );

    const response: ApiResponse<typeof conflicts> = {
      success: true,
      data: conflicts,
    };

    res.json(response);
  })
);

// Find available slots
router.post('/calendar/slots',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, startDate, endDate, duration } = req.body;

    const slots = await calendarService.findAvailableSlots(
      userId,
      new Date(startDate),
      new Date(endDate),
      duration
    );

    const response: ApiResponse<typeof slots> = {
      success: true,
      data: slots,
    };

    res.json(response);
  })
);

// Get calendar view
router.get('/calendar/view/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { start, end } = req.query;

    if (!start || !end) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Start and end dates are required',
      };
      return res.status(400).json(response);
    }

    const calendar = await calendarService.getCalendarView(
      userId,
      new Date(start as string),
      new Date(end as string)
    );

    const response: ApiResponse<typeof calendar> = {
      success: true,
      data: calendar,
    };

    res.json(response);
  })
);

// Get user feedback
router.get('/feedback/my/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { limit, skip } = req.query;

    const feedback = await meetingService.getUserFeedback(userId, {
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined,
    });

    const response: ApiResponse<typeof feedback> = {
      success: true,
      data: feedback,
    };

    res.json(response);
  })
);

export default router;
