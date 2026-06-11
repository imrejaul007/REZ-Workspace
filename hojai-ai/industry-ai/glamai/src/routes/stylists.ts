/**
 * GLAMAI - Stylists Routes
 * Salon AI Operating System
 */

import { Router, Request, Response } from 'express';
import { Stylist } from '../models';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler, errors } from '../middleware/error';
import { StylistSchema } from '../types';
import { logger } from '../middleware/logger';

const router = Router();

/**
 * POST /api/stylists
 * Create a new stylist
 */
router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = StylistSchema.parse(req.body);
    const { name, phone, email, specialties, rating } = validated;

    const stylist = await Stylist.create({
      name,
      phone,
      email,
      specialties: specialties || [],
      rating: rating || 0,
      isActive: true,
    });

    logger.info('Stylist created', { stylistId: stylist._id, name });

    res.status(201).json({
      success: true,
      stylist,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/stylists
 * List all stylists
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { active, specialty } = req.query;
    const query: any = {};

    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    if (specialty) {
      query.specialties = { $in: [specialty] };
    }

    const stylists = await Stylist.find(query).sort({ rating: -1, name: 1 });

    res.json({
      success: true,
      stylists,
      total: stylists.length,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/stylists/specialties
 * Get all specialties
 */
router.get(
  '/specialties',
  asyncHandler(async (req: Request, res: Response) => {
    const specialties = await Stylist.distinct('specialties', { isActive: true });

    res.json({
      success: true,
      specialties,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/stylists/:id
 * Get stylist by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const stylist = await Stylist.findById(req.params.id);
    if (!stylist) {
      throw errors.notFound('Stylist');
    }

    res.json({
      success: true,
      stylist,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/stylists/:id
 * Update stylist
 */
router.patch(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const stylist = await Stylist.findById(req.params.id);
    if (!stylist) {
      throw errors.notFound('Stylist');
    }

    const { name, phone, email, specialties, rating, isActive } = req.body;

    if (name) stylist.name = name;
    if (phone !== undefined) stylist.phone = phone;
    if (email !== undefined) stylist.email = email;
    if (specialties) stylist.specialties = specialties;
    if (rating !== undefined) stylist.rating = rating;
    if (isActive !== undefined) stylist.isActive = isActive;

    await stylist.save();

    logger.info('Stylist updated', { stylistId: stylist._id });

    res.json({
      success: true,
      stylist,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * DELETE /api/stylists/:id
 * Delete stylist (soft delete)
 */
router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const stylist = await Stylist.findById(req.params.id);
    if (!stylist) {
      throw errors.notFound('Stylist');
    }

    stylist.isActive = false;
    await stylist.save();

    logger.info('Stylist deactivated', { stylistId: stylist._id });

    res.json({
      success: true,
      message: 'Stylist deactivated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;