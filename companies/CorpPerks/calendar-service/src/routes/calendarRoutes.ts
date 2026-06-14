import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { calendarService } from '../services/calendarService';
import { googleCalendarService } from '../services/googleCalendarService';
import { outlookCalendarService } from '../services/outlookCalendarService';
import { ApiResponse, CalendarEventDocument } from '../types';

const router = Router();

// Validation schemas
const connectCalendarSchema = z.object({
  userId: z.string().min(1),
  companyId: z.string().min(1),
  provider: z.enum(['google', 'outlook', 'apple']),
  code: z.string().min(1),
  redirectUri: z.string().url(),
});

const createEventSchema = z.object({
  userId: z.string().min(1),
  companyId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  timezone: z.string().optional(),
  allDay: z.boolean().optional(),
  attendees: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })).optional(),
  meetingLink: z.string().optional(),
  linkedMeetingId: z.string().optional(),
  linkedProjectId: z.string().optional(),
});

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  timezone: z.string().optional(),
  allDay: z.boolean().optional(),
  attendees: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
    status: z.enum(['accepted', 'declined', 'tentative', 'needs_action', 'not_invited']).optional(),
  })).optional(),
  meetingLink: z.string().optional(),
});

const syncSchema = z.object({
  connectionId: z.string().min(1),
  userId: z.string().min(1),
  companyId: z.string().min(1),
  provider: z.enum(['google', 'outlook', 'apple']),
  fullSync: z.boolean().optional(),
});

// Middleware for async error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==================== AUTH ====================

// Get Google OAuth URL
router.get('/auth/google',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, companyId } = req.query;

    if (!userId || !companyId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'userId and companyId are required',
      };
      return res.status(400).json(response);
    }

    const state = Buffer.from(JSON.stringify({ userId, companyId })).toString('base64');
    const authUrl = googleCalendarService.getAuthUrl(state);

    const response: ApiResponse<{ authUrl: string }> = {
      success: true,
      data: { authUrl },
    };

    res.json(response);
  })
);

// Google OAuth callback
router.get('/auth/google/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!code || !state) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing code or state',
      };
      return res.status(400).json(response);
    }

    const { userId, companyId } = JSON.parse(Buffer.from(state as string, 'base64').toString());

    const connection = await calendarService.connectCalendar(
      userId as string,
      companyId as string,
      'google',
      code as string,
      process.env.GOOGLE_REDIRECT_URI || ''
    );

    const response: ApiResponse<typeof connection> = {
      success: true,
      data: connection,
      message: 'Google Calendar connected successfully',
    };

    res.json(response);
  })
);

// Get Microsoft OAuth URL
router.get('/auth/microsoft',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, companyId } = req.query;

    if (!userId || !companyId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'userId and companyId are required',
      };
      return res.status(400).json(response);
    }

    const state = Buffer.from(JSON.stringify({ userId, companyId })).toString('base64');
    const authUrl = outlookCalendarService.getAuthUrl(state);

    const response: ApiResponse<{ authUrl: string }> = {
      success: true,
      data: { authUrl },
    };

    res.json(response);
  })
);

// Microsoft OAuth callback
router.get('/auth/microsoft/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!code || !state) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing code or state',
      };
      return res.status(400).json(response);
    }

    const { userId, companyId } = JSON.parse(Buffer.from(state as string, 'base64').toString());

    const connection = await calendarService.connectCalendar(
      userId as string,
      companyId as string,
      'outlook',
      code as string,
      process.env.MICROSOFT_REDIRECT_URI || ''
    );

    const response: ApiResponse<typeof connection> = {
      success: true,
      data: connection,
      message: 'Outlook Calendar connected successfully',
    };

    res.json(response);
  })
);

// ==================== CONNECTIONS ====================

// Get user connections
router.get('/connections',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID is required',
      };
      return res.status(401).json(response);
    }

    const connections = await calendarService.getConnections(userId);

    const response: ApiResponse<typeof connections> = {
      success: true,
      data: connections,
    };

    res.json(response);
  })
);

// Disconnect calendar
router.delete('/connections/:connectionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { connectionId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID is required',
      };
      return res.status(401).json(response);
    }

    const disconnected = await calendarService.disconnectCalendar(connectionId, userId);

    if (!disconnected) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Connection not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Calendar disconnected successfully',
    };

    res.json(response);
  })
);

// ==================== EVENTS ====================

// Get events
router.get('/events',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const { startDate, endDate, connectionId, page, limit } = req.query;

    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID is required',
      };
      return res.status(401).json(response);
    }

    const result = await calendarService.getEvents(userId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      connectionId: connectionId as string,
      skip: page ? (parseInt(page as string) - 1) * (parseInt(limit as string) || 50) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
    });

    const response: ApiResponse<{
      events: CalendarEventDocument[];
      total: number;
      page: number;
      limit: number;
      hasMore: boolean;
    }> = {
      success: true,
      data: {
        events: result.events,
        total: result.total,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
        hasMore: (page ? (parseInt(page as string) - 1) * (parseInt(limit as string) || 50) : 0) + result.events.length < result.total,
      },
    };

    res.json(response);
  })
);

// Create event
router.post('/events',
  asyncHandler(async (req: Request, res: Response) => {
    const validated = createEventSchema.parse(req.body);

    const event = await calendarService.createEvent({
      ...validated,
      startTime: validated.startTime,
      endTime: validated.endTime,
    });

    const response: ApiResponse<CalendarEventDocument> = {
      success: true,
      data: event,
      message: 'Event created successfully',
    };

    res.status(201).json(response);
  })
);

// Update event
router.patch('/events/:eventId',
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const validated = updateEventSchema.parse(req.body);

    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID is required',
      };
      return res.status(401).json(response);
    }

    const event = await calendarService.updateEvent(eventId, userId, validated);

    if (!event) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Event not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<CalendarEventDocument> = {
      success: true,
      data: event,
      message: 'Event updated successfully',
    };

    res.json(response);
  })
);

// Delete event
router.delete('/events/:eventId',
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID is required',
      };
      return res.status(401).json(response);
    }

    const deleted = await calendarService.deleteEvent(eventId, userId);

    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Event not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Event deleted successfully',
    };

    res.json(response);
  })
);

// Get calendar view
router.get('/calendar-view',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const { startDate, endDate } = req.query;

    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID is required',
      };
      return res.status(401).json(response);
    }

    if (!startDate || !endDate) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'startDate and endDate are required',
      };
      return res.status(400).json(response);
    }

    const view = await calendarService.getCalendarView(
      userId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    const response: ApiResponse<typeof view> = {
      success: true,
      data: view,
    };

    res.json(response);
  })
);

// ==================== SYNC ====================

// Sync calendar
router.post('/sync',
  asyncHandler(async (req: Request, res: Response) => {
    const validated = syncSchema.parse(req.body);

    const syncLog = await calendarService.syncCalendar({
      ...validated,
      provider: validated.provider as 'google' | 'outlook' | 'apple',
    });

    const response: ApiResponse<typeof syncLog> = {
      success: true,
      data: syncLog,
      message: syncLog.status === 'completed'
        ? `Sync completed: ${syncLog.eventsAdded} added, ${syncLog.eventsUpdated} updated`
        : 'Sync failed',
    };

    res.json(response);
  })
);

// Get sync history
router.get('/sync/:connectionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { connectionId } = req.params;
    const { limit } = req.query;

    const history = await calendarService.getSyncHistory(
      connectionId,
      limit ? parseInt(limit as string) : 10
    );

    const response: ApiResponse<typeof history> = {
      success: true,
      data: history,
    };

    res.json(response);
  })
);

export default router;
