import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Ticket, TicketType, TicketStatus } from '../models';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createTicketSchema = z.object({
  eventId: z.string().min(1),
  merchantId: z.string().min(1),
  type: z.nativeEnum(TicketType),
  price: z.number().nonnegative(),
  totalQty: z.number().int().positive(),
  validFrom: z.string().transform(s => new Date(s)),
  validUntil: z.string().transform(s => new Date(s)),
  benefits: z.array(z.string()).optional()
});

const updateTicketSchema = z.object({
  type: z.nativeEnum(TicketType).optional(),
  price: z.number().nonnegative().optional(),
  totalQty: z.number().int().positive().optional(),
  validFrom: z.string().transform(s => new Date(s)).optional(),
  validUntil: z.string().transform(s => new Date(s)).optional(),
  benefits: z.array(z.string()).optional(),
  status: z.nativeEnum(TicketStatus).optional()
});

const sellTicketSchema = z.object({
  quantity: z.number().int().positive(),
  purchaserName: z.string().optional(),
  purchaserEmail: z.string().email().optional(),
  purchaserPhone: z.string().optional()
});

const searchQuerySchema = z.object({
  eventId: z.string().optional(),
  merchantId: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

/**
 * POST /api/tickets - Create a new ticket type
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createTicketSchema.parse(req.body);

    const ticket = new Ticket({
      ...validatedData,
      ticketId: `TCK-${uuidv4().substring(0, 8).toUpperCase()}`,
      soldQty: 0,
      availableQty: validatedData.totalQty,
      status: TicketStatus.ACTIVE,
      benefits: validatedData.benefits || []
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      data: ticket
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
 * GET /api/tickets - List ticket types
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = searchQuerySchema.parse(req.query);

    const filter: Record<string, unknown> = {};

    if (query.eventId) {
      filter.eventId = query.eventId;
    }
    if (query.merchantId) {
      filter.merchantId = query.merchantId;
    }
    if (query.type) {
      filter.type = query.type;
    }
    if (query.status) {
      filter.status = query.status;
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 20;
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ price: 1 })
        .skip(skip)
        .limit(limit),
      Ticket.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        tickets,
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
 * GET /api/tickets/:id - Get ticket by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.id });

    if (!ticket) {
      res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
      return;
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * PUT /api/tickets/:id - Update ticket
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = updateTicketSchema.parse(req.body);

    // If totalQty is being reduced, calculate new availableQty
    if (validatedData.totalQty) {
      const currentTicket = await Ticket.findOne({ ticketId: req.params.id });
      if (currentTicket) {
        const soldQty = currentTicket.soldQty;
        validatedData.availableQty = Math.max(0, validatedData.totalQty - soldQty);

        if (validatedData.availableQty === 0) {
          validatedData.status = TicketStatus.SOLD_OUT;
        }
      }
    }

    const ticket = await Ticket.findOneAndUpdate(
      { ticketId: req.params.id },
      { $set: validatedData },
      { new: true }
    );

    if (!ticket) {
      res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
      return;
    }

    res.json({
      success: true,
      data: ticket
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
 * DELETE /api/tickets/:id - Delete ticket
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const ticket = await Ticket.findOneAndDelete({ ticketId: req.params.id });

    if (!ticket) {
      res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/tickets/:id/sell - Record ticket sale
 */
router.post('/:id/sell', async (req: Request, res: Response) => {
  try {
    const validatedData = sellTicketSchema.parse(req.body);

    const ticket = await Ticket.findOne({ ticketId: req.params.id });

    if (!ticket) {
      res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
      return;
    }

    if (ticket.status !== TicketStatus.ACTIVE) {
      res.status(400).json({
        success: false,
        error: `Cannot sell tickets with status: ${ticket.status}`
      });
      return;
    }

    if (ticket.availableQty < validatedData.quantity) {
      res.status(400).json({
        success: false,
        error: `Not enough tickets available. Requested: ${validatedData.quantity}, Available: ${ticket.availableQty}`
      });
      return;
    }

    const now = new Date();
    if (now < ticket.validFrom || now > ticket.validUntil) {
      res.status(400).json({
        success: false,
        error: 'Ticket sale period has ended or not started yet'
      });
      return;
    }

    // Update ticket quantities
    const newSoldQty = ticket.soldQty + validatedData.quantity;
    const newAvailableQty = ticket.totalQty - newSoldQty;

    const updatedTicket = await Ticket.findOneAndUpdate(
      { ticketId: req.params.id },
      {
        $set: {
          soldQty: newSoldQty,
          availableQty: newAvailableQty,
          status: newAvailableQty === 0 ? TicketStatus.SOLD_OUT : TicketStatus.ACTIVE
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        ticket: updatedTicket,
        sale: {
          quantity: validatedData.quantity,
          totalPrice: validatedData.quantity * (ticket.price || 0),
          purchaserName: validatedData.purchaserName,
          purchaserEmail: validatedData.purchaserEmail,
          purchasedAt: now
        }
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
 * GET /api/tickets/event/:eventId - Get tickets for event
 */
router.get('/event/:eventId', async (req: Request, res: Response) => {
  try {
    const tickets = await Ticket.find({ eventId: req.params.eventId })
      .sort({ price: 1 });

    // Calculate totals
    const totals = {
      totalTickets: tickets.reduce((sum, t) => sum + t.totalQty, 0),
      totalSold: tickets.reduce((sum, t) => sum + t.soldQty, 0),
      totalAvailable: tickets.reduce((sum, t) => sum + t.availableQty, 0),
      totalRevenue: tickets.reduce((sum, t) => sum + t.soldQty * t.price, 0)
    };

    res.json({
      success: true,
      data: {
        tickets,
        totals,
        total: tickets.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/tickets/:id/sales - Get ticket sales report
 */
router.get('/:id/sales', async (req: Request, res: Response) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.id });

    if (!ticket) {
      res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
      return;
    }

    const report = {
      ticket,
      salesSummary: {
        totalQty: ticket.totalQty,
        soldQty: ticket.soldQty,
        availableQty: ticket.availableQty,
        soldPercentage: ticket.totalQty > 0 ? (ticket.soldQty / ticket.totalQty) * 100 : 0,
        revenue: ticket.soldQty * ticket.price
      },
      validity: {
        validFrom: ticket.validFrom,
        validUntil: ticket.validUntil,
        isValid: new Date() >= ticket.validFrom && new Date() <= ticket.validUntil
      },
      status: ticket.status
    };

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/tickets/meta/types - Get all ticket types
 */
router.get('/meta/types', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.values(TicketType)
  });
});

export default router;