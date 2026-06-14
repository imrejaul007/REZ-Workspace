/**
 * Restaurant Routes
 *
 * Endpoints for restaurant profile management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, optionalAuth, requireRoles } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimiter';
import { restaurantService, CreateRestaurantInput, UpdateRestaurantInput, BranchInput } from '../services/RestaurantService';
import { logger } from '../config/logger';

const log = (msg: string, meta?) => logger.info(`[restaurant-routes] ${msg}`, meta);
const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const addressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().default('India'),
  pincode: z.string().min(1),
  landmark: z.string().optional(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

const operatingHoursSchema = z.object({
  day: z.number().min(0).max(6),
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
  isClosed: z.boolean().default(false),
});

const createRestaurantSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  cuisineTypes: z.array(z.string()).min(1),
  priceRange: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  address: addressSchema,
  phone: z.string().min(10),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  socialMedia: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
  }).optional(),
  operatingHours: z.array(operatingHoursSchema),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

const updateRestaurantSchema = createRestaurantSchema.partial();

const branchSchema = z.object({
  name: z.string().min(1),
  address: addressSchema,
  phone: z.string().min(10),
  email: z.string().email().optional(),
  operatingHours: z.array(operatingHoursSchema),
});

const searchSchema = z.object({
  city: z.string().optional(),
  cuisineTypes: z.string().optional(), // comma-separated
  priceRange: z.string().optional(), // comma-separated
  amenities: z.string().optional(), // comma-separated
  minRating: z.string().optional(),
});

// ─── Public Routes ────────────────────────────────────────────────────────────

/**
 * Search restaurants
 * GET /api/restaurants
 */
router.get('/', rateLimiters.search, optionalAuth, async (req: Request, res: Response) => {
  try {
    const { city, cuisineTypes, priceRange, amenities, minRating } = searchSchema.parse(req.query);

    const filters = {
      city,
      cuisineTypes: cuisineTypes?.split(',').map(s => s.trim()),
      priceRange: priceRange?.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n)),
      amenities: amenities?.split(',').map(s => s.trim()),
      minRating: minRating ? parseFloat(minRating) : undefined,
    };

    const restaurants = await restaurantService.searchRestaurants(filters);

    res.json({
      success: true,
      data: {
        restaurants,
        total: restaurants.length,
        filters,
      },
    });
  } catch (error) {
    log('Search restaurants error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid parameters', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

/**
 * Get restaurant by slug (public)
 * GET /api/restaurants/:slug
 */
router.get('/:slug', optionalAuth, async (req: Request, res: Response) => {
  try {
    const restaurant = await restaurantService.getRestaurantBySlug(req.params.slug);

    if (!restaurant) {
      res.status(404).json({ success: false, message: 'Restaurant not found' });
      return;
    }

    res.json({ success: true, data: restaurant });
  } catch (error) {
    log('Get restaurant error:', error);
    res.status(500).json({ success: false, message: 'Failed to get restaurant' });
  }
});

// ─── Protected Routes ─────────────────────────────────────────────────────────

/**
 * Create restaurant
 * POST /api/restaurants
 */
router.post('/', authenticateToken, requireRoles('admin', 'restaurant_owner'), async (req: Request, res: Response) => {
  try {
    const input = createRestaurantSchema.parse(req.body);

    const restaurant = await restaurantService.createRestaurant({
      ...input,
      ownerId: req.user!.sub,
    });

    res.status(201).json({
      success: true,
      data: restaurant,
      message: 'Restaurant created successfully',
    });
  } catch (error) {
    log('Create restaurant error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create restaurant' });
  }
});

/**
 * Get restaurant by ID
 * GET /api/restaurants/:restaurantId
 */
router.get('/:restaurantId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const restaurant = await restaurantService.getRestaurant(req.params.restaurantId);

    if (!restaurant) {
      res.status(404).json({ success: false, message: 'Restaurant not found' });
      return;
    }

    res.json({ success: true, data: restaurant });
  } catch (error) {
    log('Get restaurant error:', error);
    res.status(500).json({ success: false, message: 'Failed to get restaurant' });
  }
});

/**
 * Update restaurant
 * PUT /api/restaurants/:restaurantId
 */
router.put('/:restaurantId', authenticateToken, requireRoles('admin', 'restaurant_owner'), async (req: Request, res: Response) => {
  try {
    const input = updateRestaurantSchema.parse(req.body);

    const restaurant = await restaurantService.updateRestaurant(req.params.restaurantId, input);

    if (!restaurant) {
      res.status(404).json({ success: false, message: 'Restaurant not found' });
      return;
    }

    res.json({
      success: true,
      data: restaurant,
      message: 'Restaurant updated successfully',
    });
  } catch (error) {
    log('Update restaurant error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update restaurant' });
  }
});

/**
 * Delete restaurant
 * DELETE /api/restaurants/:restaurantId
 */
router.delete('/:restaurantId', authenticateToken, requireRoles('admin', 'restaurant_owner'), async (req: Request, res: Response) => {
  try {
    const deleted = await restaurantService.deleteRestaurant(req.params.restaurantId);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Restaurant not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Restaurant deleted successfully',
    });
  } catch (error) {
    log('Delete restaurant error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete restaurant' });
  }
});

/**
 * Get my restaurants
 * GET /api/restaurants/my/list
 */
router.get('/my/list', authenticateToken, requireRoles('admin', 'restaurant_owner'), async (req: Request, res: Response) => {
  try {
    const restaurants = await restaurantService.getRestaurantsByOwner(req.user!.sub);

    res.json({
      success: true,
      data: restaurants,
    });
  } catch (error) {
    log('Get my restaurants error:', error);
    res.status(500).json({ success: false, message: 'Failed to get restaurants' });
  }
});

// ─── Branch Routes ─────────────────────────────────────────────────────────────

/**
 * Add branch
 * POST /api/restaurants/:restaurantId/branches
 */
router.post('/:restaurantId/branches', authenticateToken, requireRoles('admin', 'restaurant_owner'), async (req: Request, res: Response) => {
  try {
    const branch = branchSchema.parse(req.body);

    const restaurant = await restaurantService.addBranch(req.params.restaurantId, branch);

    if (!restaurant) {
      res.status(404).json({ success: false, message: 'Restaurant not found' });
      return;
    }

    res.status(201).json({
      success: true,
      data: restaurant,
      message: 'Branch added successfully',
    });
  } catch (error) {
    log('Add branch error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to add branch' });
  }
});

/**
 * Update branch
 * PUT /api/restaurants/:restaurantId/branches/:branchId
 */
router.put('/:restaurantId/branches/:branchId', authenticateToken, requireRoles('admin', 'restaurant_owner'), async (req: Request, res: Response) => {
  try {
    const restaurant = await restaurantService.updateBranch(
      req.params.restaurantId,
      req.params.branchId,
      req.body
    );

    if (!restaurant) {
      res.status(404).json({ success: false, message: 'Restaurant or branch not found' });
      return;
    }

    res.json({
      success: true,
      data: restaurant,
      message: 'Branch updated successfully',
    });
  } catch (error) {
    log('Update branch error:', error);
    res.status(500).json({ success: false, message: 'Failed to update branch' });
  }
});

/**
 * Remove branch
 * DELETE /api/restaurants/:restaurantId/branches/:branchId
 */
router.delete('/:restaurantId/branches/:branchId', authenticateToken, requireRoles('admin', 'restaurant_owner'), async (req: Request, res: Response) => {
  try {
    const restaurant = await restaurantService.removeBranch(
      req.params.restaurantId,
      req.params.branchId
    );

    if (!restaurant) {
      res.status(404).json({ success: false, message: 'Restaurant or branch not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Branch removed successfully',
    });
  } catch (error) {
    log('Remove branch error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove branch' });
  }
});

export default router;
