import { Router, Request, Response } from 'express';
import { campaignService, CreateCampaignInput } from '../services/CampaignService';
import { notificationService } from '../services/NotificationService';
import { z } from 'zod';

const router = Router();

// Validation schemas
const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['birthday', 'anniversary', 'reengagement', 'promotional', 'loyalty', 'seasonal', 'winback', 'new_service', 'VIP']),
  channel: z.enum(['sms', 'email', 'both']),
  segmentCriteria: z.object({
    type: z.enum(['all', 'tier', 'spend_range', 'visit_frequency', 'days_inactive', 'service_preference', 'tags', 'custom']),
    tiers: z.array(z.enum(['new', 'regular', 'vip', 'at-risk', 'churned'])).optional(),
    minSpend: z.number().optional(),
    maxSpend: z.number().optional(),
    minVisits: z.number().optional(),
    maxVisits: z.number().optional(),
    minDaysInactive: z.number().optional(),
    maxDaysInactive: z.number().optional(),
    services: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    customQuery: z.record(z.unknown()).optional(),
  }),
  content: z.object({
    subject: z.string().optional(),
    templateId: z.string().optional(),
    smsBody: z.string().min(1),
    emailHtml: z.string().optional(),
    emailText: z.string().optional(),
    variables: z.record(z.string()).optional(),
  }),
  schedule: z.object({
    sendAt: z.string(),
    timezone: z.string().optional(),
    recurring: z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
      endDate: z.string().optional(),
    }).optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  createdBy: z.string().min(1),
});

const UpdateCampaignSchema = CreateCampaignSchema.partial();

const ScheduleCampaignSchema = z.object({
  sendAt: z.string().datetime(),
});

const SegmentPreviewSchema = z.object({
  type: z.enum(['all', 'tier', 'spend_range', 'visit_frequency', 'days_inactive', 'service_preference', 'tags', 'custom']),
  tiers: z.array(z.enum(['new', 'regular', 'vip', 'at-risk', 'churned'])).optional(),
  minSpend: z.number().optional(),
  maxSpend: z.number().optional(),
  minVisits: z.number().optional(),
  maxVisits: z.number().optional(),
  minDaysInactive: z.number().optional(),
  maxDaysInactive: z.number().optional(),
  services: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * @route POST /api/campaigns
 * @desc Create a new campaign
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateCampaignSchema.parse(req.body);
    const campaign = await campaignService.createCampaign(validatedData as CreateCampaignInput);
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create campaign' });
    }
  }
});

/**
 * @route GET /api/campaigns
 * @desc Get all campaigns with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, status, startDate, endDate } = req.query;
    const campaigns = await campaignService.getCampaigns({
      type: type as unknown,
      status: status as unknown,
      startDate: startDate as string,
      endDate: endDate as string,
    });
    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get campaigns' });
  }
});

/**
 * @route GET /api/campaigns/:id
 * @desc Get campaign by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.getCampaignById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get campaign' });
  }
});

/**
 * @route PUT /api/campaigns/:id
 * @desc Update campaign
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = UpdateCampaignSchema.parse(req.body);
    const campaign = await campaignService.updateCampaign(req.params.id, validatedData as Partial<CreateCampaignInput>);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found or cannot be updated' });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update campaign' });
    }
  }
});

/**
 * @route POST /api/campaigns/:id/schedule
 * @desc Schedule campaign for future sending
 */
router.post('/:id/schedule', async (req: Request, res: Response) => {
  try {
    const { sendAt } = ScheduleCampaignSchema.parse(req.body);
    const campaign = await campaignService.scheduleCampaign(req.params.id, new Date(sendAt));
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found or cannot be scheduled' });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to schedule campaign' });
    }
  }
});

/**
 * @route POST /api/campaigns/:id/execute
 * @desc Execute campaign immediately
 */
router.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const result = await campaignService.executeCampaign(req.params.id);
    res.json({ success: result.success, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to execute campaign' });
  }
});

/**
 * @route POST /api/campaigns/:id/cancel
 * @desc Cancel a campaign
 */
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.cancelCampaign(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found or cannot be cancelled' });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to cancel campaign' });
  }
});

/**
 * @route POST /api/campaigns/:id/pause
 * @desc Pause a running campaign
 */
router.post('/:id/pause', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.pauseCampaign(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found or cannot be paused' });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to pause campaign' });
  }
});

/**
 * @route POST /api/campaigns/:id/resume
 * @desc Resume a paused campaign
 */
router.post('/:id/resume', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.resumeCampaign(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found or cannot be resumed' });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to resume campaign' });
  }
});

/**
 * @route GET /api/campaigns/:id/preview
 * @desc Preview campaign - see who would receive it
 */
router.get('/:id/preview', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const preview = await campaignService.previewCampaign(req.params.id, limit);
    res.json({ success: true, data: preview });
  } catch (error) {
    if (error.message === 'Campaign not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Failed to preview campaign' });
  }
});

/**
 * @route GET /api/campaigns/:id/metrics
 * @desc Get campaign performance metrics
 */
router.get('/:id/metrics', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.getCampaignMetrics(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    res.json({
      success: true,
      data: {
        campaignId: campaign.campaignId,
        name: campaign.name,
        metrics: campaign.metrics,
        status: campaign.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get campaign metrics' });
  }
});

/**
 * @route POST /api/campaigns/:id/convert
 * @desc Track campaign conversion
 */
router.post('/:id/convert', async (req: Request, res: Response) => {
  try {
    const { customerId, revenue } = req.body;
    if (!customerId) {
      return res.status(400).json({ success: false, error: 'customerId is required' });
    }
    await campaignService.trackConversion(req.params.id, customerId, revenue);
    res.json({ success: true, message: 'Conversion tracked' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to track conversion' });
  }
});

/**
 * @route POST /api/campaigns/segment/targets
 * @desc Get customers matching segment criteria
 */
router.post('/segment/targets', async (req: Request, res: Response) => {
  try {
    const validatedData = SegmentPreviewSchema.parse(req.body);
    const customers = await campaignService.getTargetCustomers(validatedData as unknown);
    res.json({ success: true, data: { count: customers.length, customers } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to get segment targets' });
    }
  }
});

/**
 * @route POST /api/campaigns/automated/birthday
 * @desc Run automated birthday campaign
 */
router.post('/automated/birthday', async (req: Request, res: Response) => {
  try {
    const createdBy = req.body.createdBy || 'system';
    const result = await campaignService.runBirthdayCampaign(createdBy);
    res.json({ success: result.success, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to run birthday campaign' });
  }
});

/**
 * @route POST /api/campaigns/automated/anniversary
 * @desc Run automated anniversary campaign
 */
router.post('/automated/anniversary', async (req: Request, res: Response) => {
  try {
    const createdBy = req.body.createdBy || 'system';
    const result = await campaignService.runAnniversaryCampaign(createdBy);
    res.json({ success: result.success, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to run anniversary campaign' });
  }
});

/**
 * @route POST /api/campaigns/automated/reengagement
 * @desc Run automated re-engagement campaign
 */
router.post('/automated/reengagement', async (req: Request, res: Response) => {
  try {
    const createdBy = req.body.createdBy || 'system';
    const inactiveDays = req.body.inactiveDays || 60;
    const result = await campaignService.runReengagementCampaign(createdBy, inactiveDays);
    res.json({ success: result.success, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to run re-engagement campaign' });
  }
});

/**
 * @route GET /api/notifications/templates/sms
 * @desc Get available SMS templates
 */
router.get('/notifications/templates/sms', async (req: Request, res: Response) => {
  try {
    const templates = notificationService.getSMSTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get SMS templates' });
  }
});

/**
 * @route GET /api/notifications/templates/email
 * @desc Get available email templates
 */
router.get('/notifications/templates/email', async (req: Request, res: Response) => {
  try {
    const templates = notificationService.getEmailTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get email templates' });
  }
});

/**
 * @route POST /api/notifications/send
 * @desc Send notification to a customer
 */
router.post('/notifications/send', async (req: Request, res: Response) => {
  try {
    const { customerId, message, channel, subject, emailHtml } = req.body;
    if (!customerId || !message) {
      return res.status(400).json({ success: false, error: 'customerId and message are required' });
    }
    const results = await notificationService.sendToCustomer(customerId, message, {
      channel,
      subject,
      emailHtml,
    });
    res.json({ success: true, data: results });
  } catch (error) {
    if (error.message?.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

/**
 * @route POST /api/notifications/birthday-reminders
 * @desc Process birthday reminders manually
 */
router.post('/notifications/birthday-reminders', async (req: Request, res: Response) => {
  try {
    const result = await notificationService.processBirthdayReminders();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to process birthday reminders' });
  }
});

/**
 * @route POST /api/notifications/anniversary-reminders
 * @desc Process anniversary reminders manually
 */
router.post('/notifications/anniversary-reminders', async (req: Request, res: Response) => {
  try {
    const result = await notificationService.processAnniversaryReminders();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to process anniversary reminders' });
  }
});

/**
 * @route POST /api/notifications/reengagement-reminders
 * @desc Process re-engagement reminders manually
 */
router.post('/notifications/reengagement-reminders', async (req: Request, res: Response) => {
  try {
    const inactiveDays = req.body.inactiveDays || 60;
    const result = await notificationService.processReengagementReminders(inactiveDays);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to process re-engagement reminders' });
  }
});

export default router;
