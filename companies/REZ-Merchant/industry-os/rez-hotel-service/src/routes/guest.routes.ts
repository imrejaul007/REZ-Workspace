/**
 * Guest Routes
 *
 * Endpoints for guest management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { guestService } from '../services/guest.service';
import { logger } from '../config/logger';

const log = (msg: string, meta?) => logger.info(`[guest-routes] ${msg}`, meta);
const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const addressSchema = z.object({
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  landmark: z.string().optional(),
});

const preferencesSchema = z.object({
  roomType: z.string().optional(),
  floor: z.string().optional(),
  smoking: z.boolean().optional(),
  pillowType: z.string().optional(),
  amenities: z.array(z.string()).optional(),
});

const createGuestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  idType: z.enum(['passport', 'driving_license', 'aadhaar', 'voter_id', 'other']),
  idNumber: z.string().min(1),
  address: addressSchema.optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional().default('Indian'),
  preferences: preferencesSchema.optional(),
});

const updateGuestSchema = createGuestSchema.partial();

const blacklistSchema = z.object({
  reason: z.string().optional(),
});

const pointsSchema = z.object({
  points: z.number().int().positive(),
});

const searchSchema = z.object({
  hotelId: z.string().optional(),
  loyaltyTier: z.string().optional(),
  isBlacklisted: z.string().optional(),
  search: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

// ─── Protected Routes ─────────────────────────────────────────────────────────

/**
 * Create guest
 * POST /api/guests
 */
router.post('/', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const input = createGuestSchema.parse(req.body);
    const hotelId = req.user?.hotelId || req.body.hotelId;

    if (!hotelId) {
      res.status(400).json({ success: false, message: 'Hotel ID required' });
      return;
    }

    const guest = await guestService.createGuest(hotelId, input);

    res.status(201).json({
      success: true,
      data: guest,
      message: 'Guest created successfully',
    });
  } catch (error) {
    log('Create guest error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create guest' });
  }
});

/**
 * Get guest by ID
 * GET /api/guests/:guestId
 */
router.get('/:guestId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const guest = await guestService.getGuest(req.params.guestId);

    if (!guest) {
      res.status(404).json({ success: false, message: 'Guest not found' });
      return;
    }

    res.json({ success: true, data: guest });
  } catch (error) {
    log('Get guest error:', error);
    res.status(500).json({ success: false, message: 'Failed to get guest' });
  }
});

/**
 * Get guest by email
 * GET /api/guests/email/:email
 */
router.get('/email/:email', authenticateToken, async (req: Request, res: Response) => {
  try {
    const hotelId = req.user?.hotelId || req.query.hotelId as string;

    if (!hotelId) {
      res.status(400).json({ success: false, message: 'Hotel ID required' });
      return;
    }

    const guest = await guestService.getGuestByEmail(hotelId, req.params.email);

    if (!guest) {
      res.status(404).json({ success: false, message: 'Guest not found' });
      return;
    }

    res.json({ success: true, data: guest });
  } catch (error) {
    log('Get guest by email error:', error);
    res.status(500).json({ success: false, message: 'Failed to get guest' });
  }
});

/**
 * Get guest by phone
 * GET /api/guests/phone/:phone
 */
router.get('/phone/:phone', authenticateToken, async (req: Request, res: Response) => {
  try {
    const hotelId = req.user?.hotelId || req.query.hotelId as string;

    if (!hotelId) {
      res.status(400).json({ success: false, message: 'Hotel ID required' });
      return;
    }

    const guest = await guestService.getGuestByPhone(hotelId, req.params.phone);

    if (!guest) {
      res.status(404).json({ success: false, message: 'Guest not found' });
      return;
    }

    res.json({ success: true, data: guest });
  } catch (error) {
    log('Get guest by phone error:', error);
    res.status(500).json({ success: false, message: 'Failed to get guest' });
  }
});

/**
 * Get all guests for hotel
 * GET /api/guests
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const hotelId = req.user?.hotelId || req.query.hotelId as string;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!hotelId) {
      res.status(400).json({ success: false, message: 'Hotel ID required' });
      return;
    }

    const guests = await guestService.getGuestsByHotel(hotelId, limit, offset);

    res.json({
      success: true,
      data: { guests, total: guests.length },
    });
  } catch (error) {
    log('Get guests error:', error);
    res.status(500).json({ success: false, message: 'Failed to get guests' });
  }
});

/**
 * Search guests
 * GET /api/guests/search/all
 */
router.get('/search/all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const filters = searchSchema.parse(req.query);
    const guests = await guestService.searchGuests({
      ...filters,
      isBlacklisted: filters.isBlacklisted ? filters.isBlacklisted === 'true' : undefined,
    });

    res.json({
      success: true,
      data: { guests, total: guests.length, filters },
    });
  } catch (error) {
    log('Search guests error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid parameters', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

/**
 * Get VIP guests
 * GET /api/guests/vip/:hotelId
 */
router.get('/vip/:hotelId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const guests = await guestService.getVipGuests(req.params.hotelId);

    res.json({
      success: true,
      data: { guests, total: guests.length },
    });
  } catch (error) {
    log('Get VIP guests error:', error);
    res.status(500).json({ success: false, message: 'Failed to get VIP guests' });
  }
});

/**
 * Get guest booking history
 * GET /api/guests/:guestId/bookings
 */
router.get('/:guestId/bookings', authenticateToken, async (req: Request, res: Response) => {
  try {
    const bookings = await guestService.getGuestBookingHistory(req.params.guestId);

    res.json({
      success: true,
      data: { bookings, total: bookings.length },
    });
  } catch (error) {
    log('Get guest bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get guest booking history' });
  }
});

/**
 * Get guest statistics
 * GET /api/guests/stats/:hotelId
 */
router.get('/stats/:hotelId', authenticateToken, requireRoles('admin', 'hotel_owner'), async (req: Request, res: Response) => {
  try {
    const stats = await guestService.getGuestStats(req.params.hotelId);

    res.json({ success: true, data: stats });
  } catch (error) {
    log('Get guest stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get guest statistics' });
  }
});

/**
 * Update guest
 * PUT /api/guests/:guestId
 */
router.put('/:guestId', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const input = updateGuestSchema.parse(req.body);
    const guest = await guestService.updateGuest(req.params.guestId, input);

    if (!guest) {
      res.status(404).json({ success: false, message: 'Guest not found' });
      return;
    }

    res.json({
      success: true,
      data: guest,
      message: 'Guest updated successfully',
    });
  } catch (error) {
    log('Update guest error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update guest' });
  }
});

/**
 * Blacklist guest
 * POST /api/guests/:guestId/blacklist
 */
router.post('/:guestId/blacklist', authenticateToken, requireRoles('admin', 'hotel_owner'), async (req: Request, res: Response) => {
  try {
    const { reason } = blacklistSchema.parse(req.body);
    const guest = await guestService.blacklistGuest(req.params.guestId, reason);

    if (!guest) {
      res.status(404).json({ success: false, message: 'Guest not found' });
      return;
    }

    res.json({
      success: true,
      data: guest,
      message: 'Guest blacklisted successfully',
    });
  } catch (error) {
    log('Blacklist guest error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to blacklist guest' });
  }
});

/**
 * Remove guest from blacklist
 * POST /api/guests/:guestId/unblacklist
 */
router.post('/:guestId/unblacklist', authenticateToken, requireRoles('admin', 'hotel_owner'), async (req: Request, res: Response) => {
  try {
    const guest = await guestService.removeFromBlacklist(req.params.guestId);

    if (!guest) {
      res.status(404).json({ success: false, message: 'Guest not found' });
      return;
    }

    res.json({
      success: true,
      data: guest,
      message: 'Guest removed from blacklist successfully',
    });
  } catch (error) {
    log('Unblacklist guest error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove guest from blacklist' });
  }
});

/**
 * Add loyalty points
 * POST /api/guests/:guestId/points/add
 */
router.post('/:guestId/points/add', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const { points } = pointsSchema.parse(req.body);
    const guest = await guestService.addLoyaltyPoints(req.params.guestId, points);

    if (!guest) {
      res.status(404).json({ success: false, message: 'Guest not found' });
      return;
    }

    res.json({
      success: true,
      data: guest,
      message: `${points} points added successfully`,
    });
  } catch (error) {
    log('Add points error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to add points' });
  }
});

/**
 * Redeem loyalty points
 * POST /api/guests/:guestId/points/redeem
 */
router.post('/:guestId/points/redeem', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const { points } = pointsSchema.parse(req.body);
    const guest = await guestService.redeemLoyaltyPoints(req.params.guestId, points);

    if (!guest) {
      res.status(400).json({ success: false, message: 'Guest not found or insufficient points' });
      return;
    }

    res.json({
      success: true,
      data: guest,
      message: `${points} points redeemed successfully`,
    });
  } catch (error) {
    log('Redeem points error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to redeem points' });
  }
});

/**
 * Delete guest
 * DELETE /api/guests/:guestId
 */
router.delete('/:guestId', authenticateToken, requireRoles('admin', 'hotel_owner'), async (req: Request, res: Response) => {
  try {
    const deleted = await guestService.deleteGuest(req.params.guestId);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Guest not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Guest deleted successfully',
    });
  } catch (error) {
    log('Delete guest error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete guest' });
  }
});

export default router;
