/**
 * GLAMAI - Services Routes
 * Salon AI Operating System
 */

import { Router, Request, Response } from 'express';
import { Service } from '../models';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler, errors } from '../middleware/error';
import { ServiceSchema } from '../types';
import { logger } from '../middleware/logger';

const router = Router();

/**
 * POST /api/services
 * Create a new service
 */
router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = ServiceSchema.parse(req.body);
    const { name, category, price, duration, description } = validated;

    const existing = await Service.findOne({ name });
    if (existing) {
      throw errors.conflict('Service with this name already exists');
    }

    const service = await Service.create({
      name,
      category,
      price,
      duration,
      description,
      isActive: true,
    });

    logger.info('Service created', { serviceId: service._id, name });

    res.status(201).json({
      success: true,
      service,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/services
 * List all services
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { category, active } = req.query;
    const query: any = {};

    if (category) {
      query.category = category;
    }
    if (active !== undefined) {
      query.isActive = active === 'true';
    } else {
      query.isActive = true;
    }

    const services = await Service.find(query).sort({ category: 1, price: 1 });

    res.json({
      success: true,
      services,
      total: services.length,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/services/categories
 * Get all service categories
 */
router.get(
  '/categories',
  asyncHandler(async (req: Request, res: Response) => {
    const categories = await Service.distinct('category', { isActive: true });

    res.json({
      success: true,
      categories,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/services/:id
 * Get service by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const service = await Service.findById(req.params.id);
    if (!service) {
      throw errors.notFound('Service');
    }

    res.json({
      success: true,
      service,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/services/:id
 * Update service
 */
router.patch(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const service = await Service.findById(req.params.id);
    if (!service) {
      throw errors.notFound('Service');
    }

    const { name, category, price, duration, description, isActive } = req.body;

    if (name) service.name = name;
    if (category) service.category = category;
    if (price !== undefined) service.price = price;
    if (duration !== undefined) service.duration = duration;
    if (description !== undefined) service.description = description;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    logger.info('Service updated', { serviceId: service._id });

    res.json({
      success: true,
      service,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * DELETE /api/services/:id
 * Delete service (soft delete - set isActive to false)
 */
router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const service = await Service.findById(req.params.id);
    if (!service) {
      throw errors.notFound('Service');
    }

    service.isActive = false;
    await service.save();

    logger.info('Service deactivated', { serviceId: service._id });

    res.json({
      success: true,
      message: 'Service deactivated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;