import { Router, Request, Response, NextFunction } from 'express';
import { requireInternalAuth } from '../middleware/auth';
import { propertyService } from '../services/propertyService';
import { successResponse, errorResponse, errors, paginatedResponse } from '../utils/response';

const router = Router();

// All internal routes require internal auth
router.use(requireInternalAuth);

// Get properties by broker
router.get('/by-broker/:brokerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const result = await propertyService.getByBroker(
      req.params.brokerId,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );
    paginatedResponse(res, result.properties, parseInt(page as string, 10), parseInt(limit as string, 10), result.total);
  } catch (err) {
    next(err);
  }
});

// Bulk update properties
router.post('/bulk-update', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || !updates) {
      return errorResponse(res, errors.badRequest('ids array and updates object required'), 400);
    }

    const result = await Promise.all(
      ids.map((id: string) => propertyService.update(id, updates))
    );

    successResponse(res, {
      updated: result.filter(p => p !== null).length,
      failed: result.filter(p => p === null).length
    });
  } catch (err) {
    next(err);
  }
});

// Get property for internal use
router.get('/property/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await propertyService.getById(req.params.id);
    if (!property) {
      return errorResponse(res, errors.notFound('Property'), 404);
    }
    successResponse(res, property);
  } catch (err) {
    next(err);
  }
});

// Create property internally (e.g., from broker service)
router.post('/property', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await propertyService.create(req.body);
    successResponse(res, property, 201);
  } catch (err) {
    next(err);
  }
});

// Update property internally
router.put('/property/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await propertyService.update(req.params.id, req.body);
    if (!property) {
      return errorResponse(res, errors.notFound('Property'), 404);
    }
    successResponse(res, property);
  } catch (err) {
    next(err);
  }
});

export default router;
