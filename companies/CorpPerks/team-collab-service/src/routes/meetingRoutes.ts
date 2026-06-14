import { Router, Response } from 'express';
import { meetingService } from '../services/meetingService.js';
import { aiNoteService } from '../services/aiNoteService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler, validateRequest } from '../middleware/errorHandler.js';
import { createMeetingSchema, updateMeetingSchema, createActionItemSchema } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Create a new meeting
 */
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = validateRequest(createMeetingSchema)(req, res, () => {});

    const meeting = await meetingService.createMeeting({
      ...validatedData,
      hostId: req.user!.userId,
      hostName: req.user!.name,
      hostAvatar: req.user!.avatar,
    });

    res.status(201).json({
      success: true,
      data: meeting,
      message: 'Meeting scheduled successfully',
    });
  })
);

/**
 * List meetings for current user
 */
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const status = req.query.status
      ? (req.query.status as string).split(',') as Array<'scheduled' | 'in_progress' | 'completed' | 'cancelled'>
      : undefined;

    const { meetings, total } = await meetingService.listMeetings(req.user!.userId, {
      status,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      limit: parseInt(req.query.limit as string) || 50,
    });

    res.json({
      success: true,
      data: {
        items: meetings,
        total,
      },
    });
  })
);

/**
 * Get upcoming meetings
 */
router.get(
  '/upcoming',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const meetings = await meetingService.getUpcomingMeetings(req.user!.userId, {
      limit: parseInt(req.query.limit as string) || 10,
    });

    res.json({
      success: true,
      data: meetings,
    });
  })
);

/**
 * Get today's meetings
 */
router.get(
  '/today',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const meetings = await meetingService.getTodayMeetings(req.user!.userId);

    res.json({
      success: true,
      data: meetings,
    });
  })
);

/**
 * Get meetings by date range
 */
router.get(
  '/calendar',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const startDate = req.query.start as string;
    const endDate = req.query.end as string;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'start and end query parameters are required',
      });
      return;
    }

    const meetings = await meetingService.getMeetingsByDateRange(
      req.user!.userId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: meetings,
    });
  })
);

/**
 * Get meeting by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const meeting = await meetingService.getMeeting(req.params.id);

    // Verify user is a participant
    if (!meeting.attendees.includes(req.user!.userId) && meeting.hostId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: 'You are not a participant in this meeting',
      });
      return;
    }

    res.json({
      success: true,
      data: meeting,
    });
  })
);

/**
 * Update a meeting
 */
router.patch(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = validateRequest(updateMeetingSchema)(req, res, () => {});

    const meeting = await meetingService.updateMeeting(
      req.params.id,
      req.user!.userId,
      validatedData
    );

    res.json({
      success: true,
      data: meeting,
      message: 'Meeting updated successfully',
    });
  })
);

/**
 * Start a meeting
 */
router.post(
  '/:id/start',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const meeting = await meetingService.startMeeting(req.params.id, req.user!.userId);

    res.json({
      success: true,
      data: meeting,
      message: 'Meeting started',
    });
  })
);

/**
 * End a meeting
 */
router.post(
  '/:id/end',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const meeting = await meetingService.endMeeting(req.params.id, req.user!.userId);

    res.json({
      success: true,
      data: meeting,
      message: 'Meeting ended',
    });
  })
);

/**
 * Cancel a meeting
 */
router.post(
  '/:id/cancel',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const meeting = await meetingService.cancelMeeting(req.params.id, req.user!.userId);

    res.json({
      success: true,
      data: meeting,
      message: 'Meeting cancelled',
    });
  })
);

/**
 * Delete a meeting
 */
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await meetingService.deleteMeeting(req.params.id, req.user!.userId);

    res.json({
      success: true,
      message: 'Meeting deleted successfully',
    });
  })
);

/**
 * Add action item to a meeting
 */
router.post(
  '/:id/action-items',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = validateRequest(createActionItemSchema)(req, res, () => {});

    const meeting = await meetingService.addActionItem(
      req.params.id,
      req.user!.userId,
      validatedData
    );

    res.status(201).json({
      success: true,
      data: meeting,
      message: 'Action item added',
    });
  })
);

/**
 * Get action items for a meeting
 */
router.get(
  '/:id/action-items',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const actionItems = await meetingService.getActionItems(req.params.id);

    res.json({
      success: true,
      data: actionItems,
    });
  })
);

/**
 * Update action item
 */
router.patch(
  '/:id/action-items/:itemId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { completed, task, dueDate, assigneeId, assigneeName } = req.body;

    const meeting = await meetingService.updateActionItem(
      req.params.id,
      req.user!.userId,
      req.params.itemId,
      {
        ...(completed !== undefined && { completed }),
        ...(task && { task }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(assigneeId && { assigneeId }),
        ...(assigneeName && { assigneeName }),
      }
    );

    res.json({
      success: true,
      data: meeting,
      message: 'Action item updated',
    });
  })
);

/**
 * Toggle action item completion
 */
router.post(
  '/:id/action-items/:itemId/toggle',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { completed, meeting } = await meetingService.toggleActionItem(
      req.params.id,
      req.user!.userId,
      req.params.itemId
    );

    res.json({
      success: true,
      data: { completed, meeting },
      message: completed ? 'Action item completed' : 'Action item marked as incomplete',
    });
  })
);

/**
 * Get meeting notes
 */
router.get(
  '/:id/notes',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const notes = await meetingService.getNotes(req.params.id);

    res.json({
      success: true,
      data: notes,
    });
  })
);

/**
 * Add manual notes to a meeting
 */
router.post(
  '/:id/notes',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { notes } = req.body;

    if (!notes) {
      res.status(400).json({
        success: false,
        error: 'Notes content is required',
      });
      return;
    }

    const meeting = await meetingService.addNotes(req.params.id, req.user!.userId, notes);

    res.json({
      success: true,
      data: meeting,
      message: 'Notes added successfully',
    });
  })
);

/**
 * Generate AI meeting notes
 */
router.post(
  '/:id/ai-notes',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const transcript = req.body.transcript;

    const generatedNotes = await aiNoteService.generateNotes(
      req.params.id,
      req.user!.userId,
      transcript
    );

    // Save the generated notes
    await aiNoteService.saveGeneratedNotes(req.params.id, req.user!.userId, generatedNotes);

    res.json({
      success: true,
      data: generatedNotes,
      message: 'AI notes generated successfully',
    });
  })
);

/**
 * Get my action items (across all meetings)
 */
router.get(
  '/action-items/my',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const actionItems = await meetingService.getActionItemsForUser(req.user!.userId, {
      completed: req.query.completed === 'true',
      overdue: req.query.overdue === 'true',
      limit: parseInt(req.query.limit as string) || 50,
    });

    res.json({
      success: true,
      data: actionItems,
    });
  })
);

/**
 * Get meeting statistics
 */
router.get(
  '/stats',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await meetingService.getStats(
      req.user!.userId,
      req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      req.query.endDate ? new Date(req.query.endDate as string) : undefined
    );

    res.json({
      success: true,
      data: stats,
    });
  })
);

export default router;
