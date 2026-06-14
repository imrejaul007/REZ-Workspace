import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { guestService, CreateGuestDto, UpdateGuestDto } from '../services/guestService';
import { recordGuestCreated, recordRsvpUpdate } from '../utils/metrics';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createGuestSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  rsvp: z.enum(['pending', 'confirmed', 'declined', 'tentative']).optional(),
  plusOne: z.boolean().optional(),
  plusOneName: z.string().optional(),
  dietary: z.object({
    vegetarian: z.boolean().optional(),
    vegan: z.boolean().optional(),
    glutenFree: z.boolean().optional(),
    halal: z.boolean().optional(),
    kosher: z.boolean().optional(),
    nutAllergy: z.boolean().optional(),
    dairyFree: z.boolean().optional(),
    other: z.string().optional()
  }).optional(),
  tableNumber: z.number().optional(),
  seatNumber: z.string().optional(),
  category: z.enum(['family', 'friend', 'colleague', 'vendor', 'neighbor', 'other']).optional(),
  relationship: z.string().optional(),
  giftRegistered: z.boolean().optional(),
  mealPreference: z.enum(['buffet', 'plated', 'family_style']).optional(),
  specialRequests: z.string().optional(),
  attendingCeremony: z.boolean().optional(),
  attendingReception: z.boolean().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional()
  }).optional()
});

const bulkGuestSchema = z.object({
  guests: z.array(createGuestSchema).min(1).max(500)
});

const updateGuestSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  rsvp: z.enum(['pending', 'confirmed', 'declined', 'tentative']).optional(),
  plusOne: z.boolean().optional(),
  plusOneName: z.string().optional(),
  dietary: z.object({
    vegetarian: z.boolean().optional(),
    vegan: z.boolean().optional(),
    glutenFree: z.boolean().optional(),
    halal: z.boolean().optional(),
    kosher: z.boolean().optional(),
    nutAllergy: z.boolean().optional(),
    dairyFree: z.boolean().optional(),
    other: z.string().optional()
  }).optional(),
  tableNumber: z.number().optional(),
  seatNumber: z.string().optional(),
  category: z.enum(['family', 'friend', 'colleague', 'vendor', 'neighbor', 'other']).optional(),
  relationship: z.string().optional(),
  giftRegistered: z.boolean().optional(),
  mealPreference: z.enum(['buffet', 'plated', 'family_style']).optional(),
  specialRequests: z.string().optional(),
  attendingCeremony: z.boolean().optional(),
  attendingReception: z.boolean().optional(),
  sendingGift: z.boolean().optional(),
  giftAmount: z.number().optional(),
  invitationSent: z.boolean().optional(),
  reminderSent: z.boolean().optional()
});

/**
 * POST /api/weddings/:weddingId/guests - Add guest(s) to wedding
 */
router.post('/:weddingId/guests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const weddingId = req.params.weddingId;

    // Check if bulk or single guest
    if (Array.isArray(req.body.guests)) {
      // Bulk guest creation
      const validationResult = bulkGuestSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid bulk guest data',
          details: validationResult.error.errors
        });
        return;
      }

      const result = await guestService.createBulkGuests({
        weddingId,
        guests: validationResult.data.guests
      });

      recordGuestCreated();

      logger.info('Bulk guests created via API', {
        weddingId,
        created: result.created,
        failed: result.failed
      });

      res.status(201).json({
        success: true,
        data: result.guests,
        summary: {
          created: result.created,
          failed: result.failed
        }
      });
    } else {
      // Single guest creation
      const validationResult = createGuestSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid guest data',
          details: validationResult.error.errors
        });
        return;
      }

      const data: CreateGuestDto = {
        weddingId,
        ...validationResult.data
      };

      const guest = await guestService.createGuest(data);

      recordGuestCreated();

      logger.info('Guest created via API', {
        guestId: guest.guestId,
        weddingId
      });

      res.status(201).json({
        success: true,
        data: guest
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weddings/:weddingId/guests - List guests for a wedding
 */
router.get('/:weddingId/guests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const weddingId = req.params.weddingId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const filters = {
      weddingId,
      rsvp: req.query.rsvp as any,
      category: req.query.category as any,
      tableNumber: req.query.tableNumber ? parseInt(req.query.tableNumber as string) : undefined,
      dietary: req.query.dietary as string,
      attendingCeremony: req.query.attendingCeremony === 'true' ? true : req.query.attendingCeremony === 'false' ? false : undefined,
      attendingReception: req.query.attendingReception === 'true' ? true : req.query.attendingReception === 'false' ? false : undefined,
      search: req.query.search as string
    };

    const result = await guestService.listGuests(filters, page, limit);

    res.json({
      success: true,
      data: result.guests,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weddings/:weddingId/guests/stats - Get guest statistics
 */
router.get('/:weddingId/guests/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await guestService.getGuestStats(req.params.weddingId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weddings/:weddingId/guests/locations - Get guest locations
 */
router.get('/:weddingId/guests/locations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locations = await guestService.getGuestsByLocation(req.params.weddingId);

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weddings/:weddingId/guests/:guestId - Get specific guest
 */
router.get('/:weddingId/guests/:guestId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guest = await guestService.getGuestById(req.params.guestId);

    if (!guest) {
      res.status(404).json({
        error: 'Not Found',
        message: `Guest ${req.params.guestId} not found`
      });
      return;
    }

    res.json({
      success: true,
      data: guest
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/weddings/:weddingId/guests/:guestId - Update guest
 */
router.put('/:weddingId/guests/:guestId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = updateGuestSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid guest update data',
        details: validationResult.error.errors
      });
      return;
    }

    const previousGuest = await guestService.getGuestById(req.params.guestId);
    const previousRsvp = previousGuest?.rsvp;

    const guest = await guestService.updateGuest(req.params.guestId, validationResult.data);

    if (!guest) {
      res.status(404).json({
        error: 'Not Found',
        message: `Guest ${req.params.guestId} not found`
      });
      return;
    }

    // Track RSVP changes
    if (validationResult.data.rsvp && validationResult.data.rsvp !== previousRsvp) {
      recordRsvpUpdate(validationResult.data.rsvp);
    }

    logger.info('Guest updated via API', {
      guestId: guest.guestId,
      updatedFields: Object.keys(validationResult.data)
    });

    res.json({
      success: true,
      data: guest
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/weddings/:weddingId/guests/:guestId - Remove guest
 */
router.delete('/:weddingId/guests/:guestId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await guestService.deleteGuest(req.params.guestId);

    if (!success) {
      res.status(404).json({
        error: 'Not Found',
        message: `Guest ${req.params.guestId} not found`
      });
      return;
    }

    logger.info('Guest deleted via API', {
      guestId: req.params.guestId,
      weddingId: req.params.weddingId
    });

    res.json({
      success: true,
      message: 'Guest removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;