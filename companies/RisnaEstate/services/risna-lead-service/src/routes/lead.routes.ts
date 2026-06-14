import { Router, Request, Response, NextFunction } from 'express';
import { leadService, CreateLeadInput } from '../services/leadService';
import { successResponse, errorResponse, errors, paginatedResponse } from '../utils/response';
import { LeadStatus } from '../models/Lead';

const router = Router();

// List leads with filters
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      segment,
      status,
      source,
      brokerId,
      minScore,
      maxScore,
      search
    } = req.query;

    const result = await leadService.search({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      segment: segment as any,
      status: status as any,
      source: source as string,
      brokerId: brokerId as string,
      minScore: minScore ? parseInt(minScore as string, 10) : undefined,
      maxScore: maxScore ? parseInt(maxScore as string, 10) : undefined,
      search: search as string
    });

    paginatedResponse(res, result.leads, parseInt(page as string, 10), parseInt(limit as string, 10), result.total);
  } catch (err) {
    next(err);
  }
});

// Get hot leads
router.get('/hot', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const leads = await leadService.getHotLeads();
    successResponse(res, leads);
  } catch (err) {
    next(err);
  }
});

// Get leads by segment
router.get('/segments/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leads = await leadService.getBySegment(req.params.type as any);
    successResponse(res, leads);
  } catch (err) {
    next(err);
  }
});

// Get dashboard stats
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brokerId } = req.query;
    const stats = await leadService.getDashboardStats(brokerId as string);
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
});

// Get lead by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadService.getById(req.params.id);
    if (!lead) {
      return errorResponse(res, errors.notFound('Lead'), 404);
    }
    successResponse(res, lead);
  } catch (err) {
    next(err);
  }
});

// Get lead by phone
router.get('/phone/:phone', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadService.getByPhone(req.params.phone);
    if (!lead) {
      return errorResponse(res, errors.notFound('Lead'), 404);
    }
    successResponse(res, lead);
  } catch (err) {
    next(err);
  }
});

// Create lead
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadService.create(req.body as CreateLeadInput);
    successResponse(res, lead, 201);
  } catch (err: any) {
    if (err.code === 11000) {
      // Duplicate phone - return existing lead
      const existing = await leadService.getByPhone(req.body.phone);
      if (existing) {
        return successResponse(res, existing);
      }
    }
    next(err);
  }
});

// Update lead
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadService.update(req.params.id, req.body);
    if (!lead) {
      return errorResponse(res, errors.notFound('Lead'), 404);
    }
    successResponse(res, lead);
  } catch (err) {
    next(err);
  }
});

// Delete lead
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await leadService.delete(req.params.id);
    if (!deleted) {
      return errorResponse(res, errors.notFound('Lead'), 404);
    }
    successResponse(res, { message: 'Lead deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// Score lead with AI
router.post('/:id/score', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadService.scoreLead(req.params.id);
    if (!lead) {
      return errorResponse(res, errors.notFound('Lead'), 404);
    }
    successResponse(res, {
      leadId: lead._id,
      aiScore: lead.aiScore
    });
  } catch (err) {
    next(err);
  }
});

// Qualify lead
router.post('/:id/qualify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, reason } = req.body;
    if (!status || !Object.values(LeadStatus).includes(status)) {
      return errorResponse(res, errors.badRequest('Valid status required'), 400);
    }
    const lead = await leadService.qualify(req.params.id, status, reason);
    if (!lead) {
      return errorResponse(res, errors.notFound('Lead'), 404);
    }
    successResponse(res, lead);
  } catch (err) {
    next(err);
  }
});

// Assign lead to broker
router.post('/:id/assign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brokerId } = req.body;
    if (!brokerId) {
      return errorResponse(res, errors.badRequest('brokerId required'), 400);
    }
    const lead = await leadService.assignToBroker(req.params.id, brokerId);
    if (!lead) {
      return errorResponse(res, errors.notFound('Lead'), 404);
    }
    successResponse(res, lead);
  } catch (err) {
    next(err);
  }
});

// Add interaction
router.post('/:id/interaction', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadService.addInteraction(req.params.id, req.body);
    if (!lead) {
      return errorResponse(res, errors.notFound('Lead'), 404);
    }
    successResponse(res, lead);
  } catch (err) {
    next(err);
  }
});

// Get lead timeline
router.get('/:id/timeline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timeline = await leadService.getTimeline(req.params.id);
    successResponse(res, timeline);
  } catch (err) {
    next(err);
  }
});

export default router;
