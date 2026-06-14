import { Router, Request, Response, NextFunction } from 'express';
import { requireInternalAuth } from '../middleware/auth';
import { leadService } from '../services/leadService';
import { successResponse, errorResponse, errors, paginatedResponse } from '../utils/response';

const router = Router();

// All internal routes require internal auth
router.use(requireInternalAuth);

// Bulk assign leads
router.post('/bulk-assign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { leadIds, brokerId } = req.body;
    if (!leadIds || !Array.isArray(leadIds) || !brokerId) {
      return errorResponse(res, errors.badRequest('leadIds array and brokerId required'), 400);
    }

    const results = await Promise.all(
      leadIds.map((id: string) => leadService.assignToBroker(id, brokerId))
    );

    successResponse(res, {
      assigned: results.filter(l => l !== null).length,
      failed: results.filter(l => l === null).length
    });
  } catch (err) {
    next(err);
  }
});

// Track property inquiry (from property service)
router.post('/property-inquiry', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { propertyId, userId, source, medium } = req.body;

    // Try to find existing lead or create new one
    if (userId) {
      const existing = await leadService.getById(userId);
      if (existing) {
        // Add property to interests
        await leadService.update(userId, {
          interestedPropertyIds: [
            ...(existing.interestedPropertyIds || []),
            propertyId
          ]
        });
      }
    }

    successResponse(res, { message: 'Inquiry tracked' });
  } catch (err) {
    next(err);
  }
});

// Batch score leads
router.post('/batch-score', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { leadIds } = req.body;
    if (!leadIds || !Array.isArray(leadIds)) {
      return errorResponse(res, errors.badRequest('leadIds array required'), 400);
    }

    const results = await Promise.all(
      leadIds.map((id: string) => leadService.scoreLead(id))
    );

    successResponse(res, {
      scored: results.filter(l => l !== null).length,
      failed: results.filter(l => l === null).length
    });
  } catch (err) {
    next(err);
  }
});

// Get lead for internal use
router.get('/lead/:id', async (req: Request, res: Response, next: NextFunction) => {
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

export default router;
