/**
 * PROPFLOW - Real Estate AI Operating System
 * Property Routes
 */

import { Router, Request, Response } from 'express';
import { Property } from '../models';
import { logger } from '../config/logger';
import {
  authenticate,
  optionalAuth,
  asyncHandler,
  Errors
} from '../middleware';
import { validateBody } from '../middleware/validation';
import {
  createPropertySchema,
  updatePropertySchema,
  z
} from '../schemas/validation';
import { triggerWebhook, syncToHOJAI } from '../utils/webhook';

const router = Router();

// Query schema for filtering
const propertyQuerySchema = z.object({
  status: z.enum(['available', 'sold', 'reserved', 'under-construction', 'unavailable']).optional(),
  type: z.enum(['apartment', 'villa', 'plot', 'commercial', 'office', 'penthouse', 'townhouse']).optional(),
  city: z.string().optional(),
  locality: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'price', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * GET /api/properties
 * Get all properties with filtering and pagination
 */
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const query = propertyQuerySchema.parse(req.query);

    // Build filter
    const filter: any = { isActive: true };
    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;
    if (query.city) filter['location.city'] = new RegExp(query.city, 'i');
    if (query.locality) filter['location.locality'] = new RegExp(query.locality, 'i');
    if (query.minPrice || query.maxPrice) {
      filter.price = {};
      if (query.minPrice) filter.price.$gte = query.minPrice;
      if (query.maxPrice) filter.price.$lte = query.maxPrice;
    }
    if (query.bedrooms) filter['specifications.bedrooms'] = query.bedrooms;

    // Count total
    const total = await Property.countDocuments(filter);

    // Get paginated results
    const skip = (query.page - 1) * query.limit;
    const properties = await Property.find(filter)
      .sort({ [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(query.limit)
      .lean();

    res.json({
      success: true,
      properties,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
        hasNext: query.page * query.limit < total,
        hasPrev: query.page > 1
      }
    });
  })
);

/**
 * GET /api/properties/:id
 * Get single property by ID
 */
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const property = await Property.findById(req.params.id);
    if (!property) {
      throw Errors.notFound('Property');
    }

    // Increment view count
    await Property.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    res.json({
      success: true,
      property
    });
  })
);

/**
 * POST /api/properties
 * Create new property
 */
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const propertyData = createPropertySchema.parse(req.body);

    const property = await Property.create({
      ...propertyData,
      createdBy: req.user?.id
    });

    logger.info('Property created', { propertyId: property._id, by: req.user?.id });

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('propflow.property.registered', { propertyId: property._id.toString(), title: property.title, type: property.type, price: property.price, location: property.location });
    await syncToHOJAI('property', 'registered', { propertyId: property._id.toString(), title: property.title, type: property.type, price: property.price, location: property.location });

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      property
    });
  })
);

/**
 * POST /api/properties/bulk
 * Create multiple properties
 */
router.post(
  '/bulk',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { properties } = req.body;

    if (!Array.isArray(properties) || properties.length === 0) {
      throw Errors.badRequest('Properties array required');
    }

    const createdProperties = await Property.insertMany(
      properties.map(p => ({ ...p, createdBy: req.user?.id })),
      { ordered: false }
    );

    logger.info('Bulk properties created', { count: createdProperties.length, by: req.user?.id });

    res.status(201).json({
      success: true,
      message: `${createdProperties.length} properties created`,
      properties: createdProperties
    });
  })
);

/**
 * PATCH /api/properties/:id
 * Update property
 */
router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const property = await Property.findById(req.params.id);
    if (!property) {
      throw Errors.notFound('Property');
    }

    const updateData = updatePropertySchema.parse(req.body);
    Object.assign(property, updateData);
    await property.save();

    logger.info('Property updated', { propertyId: property._id, by: req.user?.id });

    res.json({
      success: true,
      message: 'Property updated successfully',
      property
    });
  })
);

/**
 * DELETE /api/properties/:id
 * Soft delete property (set isActive to false)
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const property = await Property.findById(req.params.id);
    if (!property) {
      throw Errors.notFound('Property');
    }

    property.isActive = false;
    property.status = 'unavailable';
    await property.save();

    logger.info('Property deleted', { propertyId: property._id, by: req.user?.id });

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  })
);

/**
 * GET /api/properties/:id/similar
 * Get similar properties
 */
router.get(
  '/:id/similar',
  asyncHandler(async (req: Request, res: Response) => {
    const property = await Property.findById(req.params.id);
    if (!property) {
      throw Errors.notFound('Property');
    }

    const similarProperties = await Property.find({
      _id: { $ne: property._id },
      status: 'available',
      isActive: true,
      type: property.type,
      price: {
        $gte: property.price * 0.8,
        $lte: property.price * 1.2
      }
    }).limit(5);

    res.json({
      success: true,
      properties: similarProperties
    });
  })
);

/**
 * GET /api/properties/stats/summary
 * Get property statistics
 */
router.get(
  '/stats/summary',
  asyncHandler(async (req: Request, res: Response) => {
    const [total, available, sold, reserved] = await Promise.all([
      Property.countDocuments({ isActive: true }),
      Property.countDocuments({ status: 'available', isActive: true }),
      Property.countDocuments({ status: 'sold', isActive: true }),
      Property.countDocuments({ status: 'reserved', isActive: true })
    ]);

    const avgPriceResult = await Property.aggregate([
      { $match: { status: 'available', isActive: true } },
      { $group: { _id: null, avgPrice: { $avg: '$price' } } }
    ]);
    const avgPrice = avgPriceResult[0]?.avgPrice || 0;

    res.json({
      success: true,
      stats: {
        total,
        available,
        sold,
        reserved,
        avgPrice: Math.round(avgPrice)
      }
    });
  })
);

export default router;