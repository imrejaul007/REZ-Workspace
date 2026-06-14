import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { campaignService, CreateCampaignInput, UpdateCampaignInput } from '../services/campaignService';
import { reminderService, ScheduleReminderInput } from '../services/reminderService';
import { engagementService, CareCircleInput, SendToCareCircleInput } from '../services/engagementService';
import { logger } from 'utils/logger.js';
import { AppError } from '../utils/errors';

const router = Router();

// Validation schemas
const createCampaignSchema = z.object({
  type: z.enum(['adherence', 'checkup', 'vaccination', 'wellness', 'preventive']),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  message: z.string().min(1).max(1000),
  targetCriteria: z.object({
    ageMin: z.number().min(0).max(120).optional(),
    ageMax: z.number().min(0).max(120).optional(),
    gender: z.array(z.string()).optional(),
    conditions: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
    riskLevel: z.array(z.enum(['low', 'medium', 'high'])).optional(),
    lastVisitDays: z.number().min(0).optional(),
    location: z.object({
      city: z.array(z.string()).optional(),
      state: z.array(z.string()).optional(),
      pincode: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
  channels: z.array(z.enum(['whatsapp', 'sms', 'push', 'email'])).min(1),
  schedule: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    recurring: z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      daysOfMonth: z.array(z.number().min(1).max(31)).optional(),
      timeOfDay: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    }).optional(),
  }).optional(),
  incentives: z.object({
    type: z.enum(['points', 'discount', 'badge']),
    amount: z.number().min(0),
    description: z.string().optional(),
  }).optional(),
  createdBy: z.string().min(1),
});

const updateCampaignSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  message: z.string().min(1).max(1000).optional(),
  targetCriteria: z.object({
    ageMin: z.number().min(0).max(120).optional(),
    ageMax: z.number().min(0).max(120).optional(),
    gender: z.array(z.string()).optional(),
    conditions: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
    riskLevel: z.array(z.enum(['low', 'medium', 'high'])).optional(),
    lastVisitDays: z.number().min(0).optional(),
    location: z.object({
      city: z.array(z.string()).optional(),
      state: z.array(z.string()).optional(),
      pincode: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
  channels: z.array(z.enum(['whatsapp', 'sms', 'push', 'email'])).min(1).optional(),
  schedule: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    recurring: z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      daysOfMonth: z.array(z.number().min(1).max(31)).optional(),
      timeOfDay: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    }).optional(),
  }).optional(),
  incentives: z.object({
    type: z.enum(['points', 'discount', 'badge']),
    amount: z.number().min(0),
    description: z.string().optional(),
  }).optional(),
});

const scheduleReminderSchema = z.object({
  reminderType: z.enum(['medication', 'appointment', 'vaccination', 'checkup']),
  patientId: z.string().min(1),
  patientName: z.string().optional(),
  familyIds: z.array(z.string()).optional(),
  familyNotify: z.boolean().optional(),
  channels: z.array(z.enum(['whatsapp', 'sms', 'push', 'email'])).min(1),
  eventDetails: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(500).optional(),
    scheduledTime: z.string().datetime(),
    location: z.string().optional(),
    medicationName: z.string().optional(),
    dosage: z.string().optional(),
  }),
  timing: z.object({
    advanceMinutes: z.number().min(0).optional(),
    repeatCount: z.number().min(1).optional(),
    repeatInterval: z.number().min(1).optional(),
  }).optional(),
});

const careCircleSchema = z.object({
  profileId: z.string().min(1),
  members: z.array(z.object({
    userId: z.string().min(1),
    name: z.string().min(1),
    relationship: z.enum(['parent', 'child', 'spouse', 'sibling', 'caregiver', 'other']),
    notifyOnHealth: z.boolean().optional(),
    notifyOnEmergency: z.boolean().optional(),
    accessLevel: z.enum(['view', 'manage']).optional(),
  })).min(1),
});

const sendToCareCircleSchema = z.object({
  profileId: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  urgency: z.enum(['normal', 'high', 'emergency']).default('normal'),
  channels: z.array(z.enum(['whatsapp', 'sms', 'push', 'email'])).optional(),
  includeVitalSigns: z.boolean().optional(),
});

// Error handling wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// ==================== CAMPAIGN ROUTES ====================

/**
 * POST /campaigns/health
 * Create a new health campaign
 */
router.post('/campaigns/health', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createCampaignSchema.parse(req.body);

  const input: CreateCampaignInput = {
    ...validatedData,
    targetCriteria: validatedData.targetCriteria,
    schedule: validatedData.schedule ? {
      startDate: validatedData.schedule.startDate ? new Date(validatedData.schedule.startDate) : undefined,
      endDate: validatedData.schedule.endDate ? new Date(validatedData.schedule.endDate) : undefined,
      recurring: validatedData.schedule.recurring ? {
        frequency: validatedData.schedule.recurring.frequency,
        daysOfWeek: validatedData.schedule.recurring.daysOfWeek,
        daysOfMonth: validatedData.schedule.recurring.daysOfMonth,
        timeOfDay: validatedData.schedule.recurring.timeOfDay || '09:00',
      } : undefined,
    } : undefined,
  };

  const campaign = await campaignService.createCampaign(input);

  res.status(201).json({
    success: true,
    data: campaign,
  });
}));

/**
 * GET /campaigns/health
 * List all campaigns (with optional filters)
 */
router.get('/campaigns/health', asyncHandler(async (req: Request, res: Response) => {
  const { status, type } = req.query;

  let campaigns;
  if (status && typeof status === 'string') {
    campaigns = await campaignService.getCampaignsByStatus(status as any);
  } else {
    campaigns = await campaignService.getCampaignsByStatus('draft');
    if (type && typeof type === 'string') {
      campaigns = await campaignService.getCampaignsByStatus('active');
    }
  }

  res.json({
    success: true,
    data: campaigns,
    count: campaigns.length,
  });
}));

/**
 * GET /campaigns/health/:id
 * Get campaign by ID
 */
router.get('/campaigns/health/:id', asyncHandler(async (req: Request, res: Response) => {
  const campaign = await campaignService.getCampaign(req.params.id);

  res.json({
    success: true,
    data: campaign,
  });
}));

/**
 * PATCH /campaigns/health/:id
 * Update a campaign
 */
router.patch('/campaigns/health/:id', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = updateCampaignSchema.parse(req.body);

  const updateInput: UpdateCampaignInput = {
    ...validatedData,
    schedule: validatedData.schedule ? {
      startDate: validatedData.schedule.startDate ? new Date(validatedData.schedule.startDate) : undefined,
      endDate: validatedData.schedule.endDate ? new Date(validatedData.schedule.endDate) : undefined,
      recurring: validatedData.schedule.recurring ? {
        frequency: validatedData.schedule.recurring.frequency,
        daysOfWeek: validatedData.schedule.recurring.daysOfWeek,
        daysOfMonth: validatedData.schedule.recurring.daysOfMonth,
        timeOfDay: validatedData.schedule.recurring.timeOfDay || '09:00',
      } : undefined,
    } : undefined,
  };

  const campaign = await campaignService.updateCampaign(req.params.id, updateInput);

  res.json({
    success: true,
    data: campaign,
  });
}));

/**
 * POST /campaigns/health/:id/schedule
 * Schedule a campaign for future execution
 */
router.post('/campaigns/health/:id/schedule', asyncHandler(async (req: Request, res: Response) => {
  const { startDate } = req.body;

  if (!startDate) {
    res.status(400).json({
      success: false,
      error: 'startDate is required',
    });
    return;
  }

  const campaign = await campaignService.scheduleCampaign(req.params.id, new Date(startDate));

  res.json({
    success: true,
    data: campaign,
  });
}));

/**
 * POST /campaigns/health/:id/send
 * Send a campaign
 */
router.post('/campaigns/health/:id/send', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Campaign send requested', { campaignId: req.params.id });

  const result = await campaignService.sendCampaign(req.params.id);

  res.json({
    success: result.success,
    data: result.metrics,
  });
}));

/**
 * POST /campaigns/health/:id/pause
 * Pause an active campaign
 */
router.post('/campaigns/health/:id/pause', asyncHandler(async (req: Request, res: Response) => {
  const campaign = await campaignService.pauseCampaign(req.params.id);

  res.json({
    success: true,
    data: campaign,
  });
}));

/**
 * POST /campaigns/health/:id/resume
 * Resume a paused campaign
 */
router.post('/campaigns/health/:id/resume', asyncHandler(async (req: Request, res: Response) => {
  const campaign = await campaignService.resumeCampaign(req.params.id);

  res.json({
    success: true,
    data: campaign,
  });
}));

/**
 * GET /campaigns/health/:id/metrics
 * Get campaign metrics
 */
router.get('/campaigns/health/:id/metrics', asyncHandler(async (req: Request, res: Response) => {
  const metrics = await campaignService.getCampaignMetrics(req.params.id);

  res.json({
    success: true,
    data: metrics,
  });
}));

// ==================== REMINDER ROUTES ====================

/**
 * POST /reminders/schedule
 * Schedule a health reminder
 */
router.post('/reminders/schedule', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = scheduleReminderSchema.parse(req.body);

  const input: ScheduleReminderInput = {
    ...validatedData,
    eventDetails: {
      ...validatedData.eventDetails,
      scheduledTime: new Date(validatedData.eventDetails.scheduledTime),
    },
  };

  const reminder = await reminderService.scheduleReminder(input);

  res.status(201).json({
    success: true,
    data: reminder,
  });
}));

/**
 * GET /reminders/:profileId
 * Get reminders for a profile
 */
router.get('/reminders/:profileId', asyncHandler(async (req: Request, res: Response) => {
  const { profileId } = req.params;
  const { type, status } = req.query;

  let reminders = await reminderService.getRemindersByProfile(profileId);

  if (type && typeof type === 'string') {
    reminders = await reminderService.getRemindersByType(profileId, type as any);
  }

  res.json({
    success: true,
    data: reminders,
    count: reminders.length,
  });
}));

/**
 * GET /reminders/detail/:id
 * Get reminder by ID
 */
router.get('/reminders/detail/:id', asyncHandler(async (req: Request, res: Response) => {
  const reminder = await reminderService.getReminder(req.params.id);

  res.json({
    success: true,
    data: reminder,
  });
}));

/**
 * POST /reminders/:id/send
 * Send a reminder immediately
 */
router.post('/reminders/:id/send', asyncHandler(async (req: Request, res: Response) => {
  const result = await reminderService.sendReminder(req.params.id);

  res.json({
    success: result.success,
    data: result,
  });
}));

/**
 * POST /reminders/:id/acknowledge
 * Acknowledge a reminder
 */
router.post('/reminders/:id/acknowledge', asyncHandler(async (req: Request, res: Response) => {
  const { profileId } = req.body;

  if (!profileId) {
    res.status(400).json({
      success: false,
      error: 'profileId is required',
    });
    return;
  }

  const reminder = await reminderService.acknowledgeReminder(req.params.id, profileId);

  res.json({
    success: true,
    data: reminder,
  });
}));

/**
 * POST /reminders/:id/snooze
 * Snooze a reminder
 */
router.post('/reminders/:id/snooze', asyncHandler(async (req: Request, res: Response) => {
  const { snoozeMinutes = 15 } = req.body;

  const reminder = await reminderService.snoozeReminder(req.params.id, snoozeMinutes);

  res.json({
    success: true,
    data: reminder,
  });
}));

/**
 * DELETE /reminders/:id
 * Cancel a reminder
 */
router.delete('/reminders/:id', asyncHandler(async (req: Request, res: Response) => {
  await reminderService.cancelReminder(req.params.id);

  res.json({
    success: true,
    message: 'Reminder cancelled',
  });
}));

/**
 * GET /reminders/:profileId/stats
 * Get reminder statistics for a profile
 */
router.get('/reminders/:profileId/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = await reminderService.getReminderStats(req.params.profileId);

  res.json({
    success: true,
    data: stats,
  });
}));

// ==================== ENGAGEMENT ROUTES ====================

/**
 * POST /engagement/care-circle
 * Create or update care circle
 */
router.post('/engagement/care-circle', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = careCircleSchema.parse(req.body);

  const careCircle = await engagementService.createCareCircle(validatedData);

  res.status(201).json({
    success: true,
    data: careCircle,
  });
}));

/**
 * GET /engagement/care-circle/:profileId
 * Get care circle for a profile
 */
router.get('/engagement/care-circle/:profileId', asyncHandler(async (req: Request, res: Response) => {
  const careCircle = await engagementService.getCareCircle(req.params.profileId);

  res.json({
    success: true,
    data: careCircle,
  });
}));

/**
 * POST /engagement/care-circle/:profileId/members
 * Add member to care circle
 */
router.post('/engagement/care-circle/:profileId/members', asyncHandler(async (req: Request, res: Response) => {
  const careCircle = await engagementService.addCareCircleMember(req.params.profileId, req.body);

  res.json({
    success: true,
    data: careCircle,
  });
}));

/**
 * DELETE /engagement/care-circle/:profileId/members/:userId
 * Remove member from care circle
 */
router.delete('/engagement/care-circle/:profileId/members/:userId', asyncHandler(async (req: Request, res: Response) => {
  const careCircle = await engagementService.removeCareCircleMember(req.params.profileId, req.params.userId);

  res.json({
    success: true,
    data: careCircle,
  });
}));

/**
 * POST /engagement/care-circle/send
 * Send notification to care circle
 */
router.post('/engagement/care-circle/send', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = sendToCareCircleSchema.parse(req.body);

  const result = await engagementService.sendToCareCircle(validatedData);

  res.json({
    success: result.success,
    data: result,
  });
}));

/**
 * GET /engagement/score/:profileId
 * Get engagement score for a profile
 */
router.get('/engagement/score/:profileId', asyncHandler(async (req: Request, res: Response) => {
  const score = await engagementService.getEngagementScore(req.params.profileId);

  res.json({
    success: true,
    data: score,
  });
}));

/**
 * GET /engagement/history/:profileId
 * Get engagement history for a profile
 */
router.get('/engagement/history/:profileId', asyncHandler(async (req: Request, res: Response) => {
  const { limit, action, channel } = req.query;

  const history = await engagementService.getEngagementHistory(req.params.profileId, {
    limit: limit ? parseInt(limit as string, 10) : undefined,
    action: action as string | undefined,
    channel: channel as string | undefined,
  });

  res.json({
    success: true,
    data: history,
    count: history.length,
  });
}));

/**
 * GET /engagement/family/:familyId/:patientId
 * Get family engagement score
 */
router.get('/engagement/family/:familyId/:patientId', asyncHandler(async (req: Request, res: Response) => {
  const score = await engagementService.getFamilyEngagementScore(
    req.params.familyId,
    req.params.patientId
  );

  res.json({
    success: true,
    data: score,
  });
}));

export default router;
