import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { campaignService, CreateCampaignInput, CampaignFilters } from '../services/CampaignService';
import { visitService, CreateVisitInput } from '../services/VisitService';
import { OutreachChannel } from '../config/constants';

const router = Router();

// Validation schemas
const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['birthday', 'anniversary', 'reengagement', 'loyalty_reward', 'new_menu', 'special_offer']),
  target: z.object({
    segment: z.enum(['VIP', 'REGULAR', 'LAPSED', 'NEW', 'ALL']).optional(),
    customerIds: z.array(z.string()).optional(),
    criteria: z.object({
      minLifetimeValue: z.number().optional(),
      maxLifetimeValue: z.number().optional(),
      birthdayThisMonth: z.boolean().optional(),
      anniversaryThisMonth: z.boolean().optional(),
      minVisits: z.number().optional(),
    }).optional(),
  }),
  message: z.object({
    subject: z.string().optional(),
    body: z.string().min(1),
    templateId: z.string().optional(),
  }),
  channels: z.array(z.enum(['whatsapp', 'sms', 'email'])),
  scheduledAt: z.string().datetime().optional(),
  createdBy: z.string().min(1),
});

const UpdateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  target: z.object({
    segment: z.enum(['VIP', 'REGULAR', 'LAPSED', 'NEW', 'ALL']).optional(),
    customerIds: z.array(z.string()).optional(),
    criteria: z.object({
      minLifetimeValue: z.number().optional(),
      maxLifetimeValue: z.number().optional(),
      birthdayThisMonth: z.boolean().optional(),
      anniversaryThisMonth: z.boolean().optional(),
      minVisits: z.number().optional(),
    }).optional(),
  }).optional(),
  message: z.object({
    subject: z.string().optional(),
    body: z.string().min(1).optional(),
    templateId: z.string().optional(),
  }).optional(),
  channels: z.array(z.enum(['whatsapp', 'sms', 'email'])).optional(),
  scheduledAt: z.string().datetime().optional(),
});

const RecordVisitSchema = z.object({
  customerId: z.string().min(1),
  orderId: z.string().optional(),
  tableNumber: z.string().optional(),
  staffMemberId: z.string().optional(),
  visitDate: z.string().datetime().optional(),
  items: z.array(z.object({
    itemId: z.string(),
    itemName: z.string(),
    quantity: z.number().int().min(1),
    price: z.number().min(0),
    category: z.string().optional(),
  })),
  paymentMethod: z.string().optional(),
  duration: z.number().int().min(1).optional(),
  partySize: z.number().int().min(1).optional(),
  loyaltyPointsRedeemed: z.number().int().min(0).optional(),
});

const FeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// Middleware for validation
const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        next(error);
      }
    }
  };
};

// ============= VISIT ROUTES =============

// Record a visit
router.post('/visits', validate(RecordVisitSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: CreateVisitInput = {
      customerId: req.body.customerId,
      orderId: req.body.orderId,
      tableNumber: req.body.tableNumber,
      staffMemberId: req.body.staffMemberId,
      visitDate: req.body.visitDate ? new Date(req.body.visitDate) : undefined,
      items: req.body.items,
      paymentMethod: req.body.paymentMethod,
      duration: req.body.duration,
      partySize: req.body.partySize,
      loyaltyPointsRedeemed: req.body.loyaltyPointsRedeemed,
    };

    const visit = await visitService.recordVisit(input);
    res.status(201).json(visit);
  } catch (error) {
    if (error instanceof Error && error.message === 'Customer not found') {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

// Get visit by ID
router.get('/visits/:visitId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visit = await visitService.getVisitById(req.params.visitId);
    if (!visit) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }
    res.json(visit);
  } catch (error) {
    next(error);
  }
});

// List visits with filters
router.get('/visits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      customerId: req.query.customerId as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
      maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
    };

    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await visitService.listVisits(filters, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Add feedback to visit
router.post('/visits/:visitId/feedback', validate(FeedbackSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visit = await visitService.addFeedback(req.params.visitId, req.body.rating, req.body.comment);
    if (!visit) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }
    res.json(visit);
  } catch (error) {
    next(error);
  }
});

// Get visit analytics
router.get('/analytics/visits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const analytics = await visitService.getAnalytics(startDate, endDate);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

// ============= CAMPAIGN ROUTES =============

// Create campaign
router.post('/', validate(CreateCampaignSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: CreateCampaignInput = {
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      target: req.body.target,
      message: req.body.message,
      channels: req.body.channels as OutreachChannel[],
      scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
      createdBy: req.body.createdBy,
    };

    const campaign = await campaignService.createCampaign(input);
    res.status(201).json(campaign);
  } catch (error) {
    next(error);
  }
});

// Get campaign by ID
router.get('/:campaignId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignService.getCampaignById(req.params.campaignId);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
    res.json(campaign);
  } catch (error) {
    next(error);
  }
});

// Update campaign
router.patch('/:campaignId', validate(UpdateCampaignSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignService.updateCampaign(req.params.campaignId, req.body);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
    res.json(campaign);
  } catch (error) {
    next(error);
  }
});

// Update campaign status
router.post('/:campaignId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const campaign = await campaignService.updateStatus(req.params.campaignId, status);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
    res.json(campaign);
  } catch (error) {
    next(error);
  }
});

// List campaigns
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: CampaignFilters = {
      type: req.query.type as string | undefined,
      status: req.query.status as string | undefined,
      createdBy: req.query.createdBy as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await campaignService.listCampaigns(filters, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Execute campaign
router.post('/:campaignId/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await campaignService.executeCampaign(req.params.campaignId);
    res.json({ campaignId: req.params.campaignId, metrics });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    } else {
      next(error);
    }
  }
});

// Preview campaign target (see who will receive)
router.get('/:campaignId/targets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignService.getCampaignById(req.params.campaignId);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const customers = await campaignService.getTargetCustomers(campaign.target);
    res.json({
      campaignId: req.params.campaignId,
      totalTargets: customers.length,
      customers: customers.slice(0, 100), // Limit preview to 100
    });
  } catch (error) {
    next(error);
  }
});

// Track conversion
router.post('/:campaignId/conversion', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { revenue } = req.body;
    if (typeof revenue !== 'number' || revenue < 0) {
      res.status(400).json({ error: 'Revenue must be a non-negative number' });
      return;
    }

    await campaignService.trackConversion(req.params.campaignId, revenue);
    res.json({ campaignId: req.params.campaignId, revenue });
  } catch (error) {
    next(error);
  }
});

// Get campaign report
router.get('/:campaignId/report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await campaignService.getCampaignReport(req.params.campaignId);
    if (!report) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// Create birthday campaign
router.post('/templates/birthday', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, message, channels, createdBy } = req.body;

    if (!name || !message || !channels || !createdBy) {
      res.status(400).json({ error: 'Missing required fields: name, message, channels, createdBy' });
      return;
    }

    const campaign = await campaignService.createBirthdayCampaign(
      name,
      message,
      channels as OutreachChannel[],
      createdBy
    );
    res.status(201).json(campaign);
  } catch (error) {
    next(error);
  }
});

// Create reengagement campaign
router.post('/templates/reengagement', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, message, channels, createdBy } = req.body;

    if (!name || !message || !channels || !createdBy) {
      res.status(400).json({ error: 'Missing required fields: name, message, channels, createdBy' });
      return;
    }

    const campaign = await campaignService.createReengagementCampaign(
      name,
      message,
      channels as OutreachChannel[],
      createdBy
    );
    res.status(201).json(campaign);
  } catch (error) {
    next(error);
  }
});

export default router;
