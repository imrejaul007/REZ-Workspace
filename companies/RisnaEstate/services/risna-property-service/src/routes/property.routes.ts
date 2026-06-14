import { Router, Request, Response, NextFunction } from 'express';
import { propertyService, CreatePropertyInput } from '../services/propertyService';
import { successResponse, errorResponse, errors, paginatedResponse } from '../utils/response';

const router = Router();

// List properties with filters
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      country,
      city,
      locality,
      propertyType,
      listingType,
      status,
      minPrice,
      maxPrice,
      minBedrooms,
      maxBedrooms,
      furnished,
      search,
      lat,
      lng,
      radiusKm
    } = req.query;

    const result = await propertyService.search({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      country: country as string,
      city: city as string,
      locality: locality as string,
      propertyType: propertyType as string,
      listingType: listingType as string,
      status: status as string,
      minPrice: minPrice ? parseInt(minPrice as string, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice as string, 10) : undefined,
      minBedrooms: minBedrooms ? parseInt(minBedrooms as string, 10) : undefined,
      maxBedrooms: maxBedrooms ? parseInt(maxBedrooms as string, 10) : undefined,
      furnished: furnished as string,
      search: search as string,
      lat: lat ? parseFloat(lat as string) : undefined,
      lng: lng ? parseFloat(lng as string) : undefined,
      radiusKm: radiusKm ? parseFloat(radiusKm as string) : undefined
    });

    paginatedResponse(res, result.properties, parseInt(page as string, 10), parseInt(limit as string, 10), result.total);
  } catch (err) {
    next(err);
  }
});

// Get featured properties
router.get('/featured', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const properties = await propertyService.getFeatured(10);
    successResponse(res, properties);
  } catch (err) {
    next(err);
  }
});

// Get new launches
router.get('/new-launches', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const properties = await propertyService.getNewLaunches(10);
    successResponse(res, properties);
  } catch (err) {
    next(err);
  }
});

// Search properties
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, ...filters } = req.query;
    const result = await propertyService.search({
      search: q as string,
      ...filters
    } as any);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

// Get property by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
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

// Create property
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await propertyService.create(req.body as CreatePropertyInput);
    successResponse(res, property, 201);
  } catch (err: any) {
    if (err.code === 11000) {
      return errorResponse(res, errors.conflict('Property with this slug already exists'), 409);
    }
    next(err);
  }
});

// Update property
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
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

// Delete property (soft delete)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await propertyService.delete(req.params.id);
    if (!deleted) {
      return errorResponse(res, errors.notFound('Property'), 404);
    }
    successResponse(res, { message: 'Property deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// Publish property
router.post('/:id/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await propertyService.publish(req.params.id);
    if (!property) {
      return errorResponse(res, errors.notFound('Property'), 404);
    }
    successResponse(res, property);
  } catch (err) {
    next(err);
  }
});

// Unpublish property
router.post('/:id/unpublish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await propertyService.unpublish(req.params.id);
    if (!property) {
      return errorResponse(res, errors.notFound('Property'), 404);
    }
    successResponse(res, property);
  } catch (err) {
    next(err);
  }
});

// Track property view
router.post('/:id/view', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.userId;
    await propertyService.trackView(req.params.id, userId);
    successResponse(res, { message: 'View tracked' });
  } catch (err) {
    next(err);
  }
});

// Track property inquiry
router.post('/:id/inquire', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.userId;
    await propertyService.trackInquiry(req.params.id, userId);
    successResponse(res, { message: 'Inquiry tracked' });
  } catch (err) {
    next(err);
  }
});

// Shortlist property
router.post('/:id/shortlist', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await propertyService.trackShortlist(req.params.id);
    successResponse(res, { message: 'Property shortlisted' });
  } catch (err) {
    next(err);
  }
});

// Get property analytics
router.get('/:id/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await propertyService.getAnalytics(req.params.id);
    if (!analytics) {
      return errorResponse(res, errors.notFound('Property'), 404);
    }
    successResponse(res, analytics);
  } catch (err) {
    next(err);
  }
});

// Get similar properties
router.get('/:id/similar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const properties = await propertyService.getSimilar(req.params.id);
    successResponse(res, properties);
  } catch (err) {
    next(err);
  }
});

export default router;
