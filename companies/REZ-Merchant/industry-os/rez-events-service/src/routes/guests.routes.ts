import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Guest, GuestCategory, GuestStatus } from '../models';
import { rsvpService } from '../services/rsvpService';
import { authenticateToken } from '../middleware/auth';
import { sendRSVPConfirmationWhatsApp } from '../integrations/rabtul';
import logger from '../utils/logger';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createGuestSchema = z.object({
  eventId: z.string().min(1),
  merchantId: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  category: z.nativeEnum(GuestCategory).optional(),
  plusOnes: z.number().int().nonnegative().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  tableNumber: z.number().int().positive().optional(),
  seatNumber: z.number().int().positive().optional(),
  notes: z.string().optional()
});

const bulkImportGuestsSchema = z.object({
  eventId: z.string().min(1),
  merchantId: z.string().min(1),
  guests: z.array(z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    category: z.nativeEnum(GuestCategory).optional(),
    plusOnes: z.number().int().nonnegative().optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    tableNumber: z.number().int().positive().optional(),
    seatNumber: z.number().int().positive().optional(),
    notes: z.string().optional()
  })).min(1)
});

const updateGuestSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  category: z.nativeEnum(GuestCategory).optional(),
  plusOnes: z.number().int().nonnegative().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  tableNumber: z.number().int().positive().optional(),
  seatNumber: z.number().int().positive().optional(),
  status: z.nativeEnum(GuestStatus).optional(),
  reminderSent: z.boolean().optional(),
  notes: z.string().optional()
});

const searchQuerySchema = z.object({
  q: z.string().optional(),
  eventId: z.string().optional(),
  merchantId: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  tableNumber: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

const rsvpSchema = z.object({
  status: z.nativeEnum(GuestStatus),
  plusOnes: z.number().int().nonnegative().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  notes: z.string().optional()
});

/**
 * POST /api/guests - Create a new guest
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createGuestSchema.parse(req.body);

    const guest = new Guest({
      ...validatedData,
      guestId: `GST-${uuidv4().substring(0, 8).toUpperCase()}`,
      category: validatedData.category || GuestCategory.RSVP_PENDING,
      plusOnes: validatedData.plusOnes || 0,
      dietaryRestrictions: validatedData.dietaryRestrictions || [],
      status: GuestStatus.PENDING,
      reminderSent: false
    });

    await guest.save();

    res.status(201).json({
      success: true,
      data: guest
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * POST /api/guests/bulk - Bulk import guests
 */
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const validatedData = bulkImportGuestsSchema.parse(req.body);

    const guests = await rsvpService.bulkImportGuests({
      eventId: validatedData.eventId,
      merchantId: validatedData.merchantId,
      guests: validatedData.guests
    });

    res.status(201).json({
      success: true,
      data: {
        imported: guests.length,
        guests
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/guests - List/search guests
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = searchQuerySchema.parse(req.query);

    const filter: Record<string, unknown> = {};

    if (query.q) {
      filter.$text = { $search: query.q };
    }
    if (query.eventId) {
      filter.eventId = query.eventId;
    }
    if (query.merchantId) {
      filter.merchantId = query.merchantId;
    }
    if (query.category) {
      filter.category = query.category;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.tableNumber) {
      filter.tableNumber = parseInt(query.tableNumber);
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 50;
    const skip = (page - 1) * limit;

    const [guests, total] = await Promise.all([
      Guest.find(filter)
        .sort({ tableNumber: 1, seatNumber: 1, name: 1 })
        .skip(skip)
        .limit(limit),
      Guest.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        guests,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/guests/:id - Get guest by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const guest = await Guest.findOne({ guestId: req.params.id });

    if (!guest) {
      res.status(404).json({
        success: false,
        error: 'Guest not found'
      });
      return;
    }

    res.json({
      success: true,
      data: guest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * PUT /api/guests/:id - Update guest
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = updateGuestSchema.parse(req.body);

    const guest = await Guest.findOneAndUpdate(
      { guestId: req.params.id },
      { $set: validatedData },
      { new: true }
    );

    if (!guest) {
      res.status(404).json({
        success: false,
        error: 'Guest not found'
      });
      return;
    }

    res.json({
      success: true,
      data: guest
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * DELETE /api/guests/:id - Delete guest
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const guest = await Guest.findOneAndDelete({ guestId: req.params.id });

    if (!guest) {
      res.status(404).json({
        success: false,
        error: 'Guest not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Guest deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/guests/:id/rsvp - RSVP for guest
 */
router.post('/:id/rsvp', async (req: Request, res: Response) => {
  try {
    const validatedData = rsvpSchema.parse(req.body);

    const result = await rsvpService.processRSVP(req.params.id, {
      status: validatedData.status,
      plusOnes: validatedData.plusOnes,
      dietaryRestrictions: validatedData.dietaryRestrictions,
      notes: validatedData.notes
    });

    // Send RSVP confirmation via WhatsApp using RABTUL SDK
    try {
      const guest = await Guest.findOne({ guestId: req.params.id });
      if (guest && guest.phone) {
        // Map GuestStatus to our notification status
        let notificationStatus: 'confirmed' | 'declined' | 'tentative' = 'tentative';
        if (guest.status === GuestStatus.CONFIRMED || validatedData.status === GuestStatus.CONFIRMED) {
          notificationStatus = 'confirmed';
        } else if (guest.status === GuestStatus.DECLINED || validatedData.status === GuestStatus.DECLINED) {
          notificationStatus = 'declined';
        }

        await sendRSVPConfirmationWhatsApp({
          guestId: guest.guestId,
          guestPhone: guest.phone,
          guestName: guest.name,
          eventId: guest.eventId,
          eventName: '', // Would need to fetch from Event model
          eventDate: new Date().toLocaleDateString('en-IN'),
          eventTime: '',
          status: notificationStatus,
          merchantId: guest.merchantId,
        });
        logger.info('RSVP confirmation sent via RABTUL SDK', {
          guestId: guest.guestId,
          eventId: guest.eventId,
          status: notificationStatus,
        });
      }
    } catch (notifyError) {
      logger.warn('Failed to send RSVP confirmation WhatsApp', { error: notifyError, guestId: req.params.id });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/guests/event/:eventId - Get guests for event
 */
router.get('/event/:eventId', async (req: Request, res: Response) => {
  try {
    const guests = await Guest.find({ eventId: req.params.eventId })
      .sort({ tableNumber: 1, seatNumber: 1, name: 1 });

    // Calculate statistics
    const stats = {
      total: guests.length,
      totalWithPlusOnes: guests.reduce((sum, g) => sum + 1 + g.plusOnes, 0),
      byStatus: {
        pending: guests.filter(g => g.status === GuestStatus.PENDING).length,
        invited: guests.filter(g => g.status === GuestStatus.INVITED).length,
        confirmed: guests.filter(g => g.status === GuestStatus.CONFIRMED).length,
        attended: guests.filter(g => g.status === GuestStatus.ATTENDED).length,
        absent: guests.filter(g => g.status === GuestStatus.ABSENT).length
      },
      byCategory: {
        vip: guests.filter(g => g.category === GuestCategory.VIP).length,
        invitation: guests.filter(g => g.category === GuestCategory.INVITATION).length,
        confirmed: guests.filter(g => g.category === GuestCategory.CONFIRMED).length,
        rsvpPending: guests.filter(g => g.category === GuestCategory.RSVP_PENDING).length
      }
    };

    // Group by table
    const tableGroups: Record<number, typeof guests> = {};
    for (const guest of guests) {
      if (guest.tableNumber) {
        if (!tableGroups[guest.tableNumber]) {
          tableGroups[guest.tableNumber] = [];
        }
        tableGroups[guest.tableNumber].push(guest);
      }
    }

    res.json({
      success: true,
      data: {
        guests,
        stats,
        groupedByTable: tableGroups,
        total: guests.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;