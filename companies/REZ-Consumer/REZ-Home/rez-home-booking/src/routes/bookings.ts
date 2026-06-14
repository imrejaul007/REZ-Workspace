import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize router
export const bookingsRouter = Router();

// Types
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ServiceCategory {
  PLUMBER = 'plumber',
  ELECTRICIAN = 'electrician',
  AC_SERVICE = 'ac_service',
  CLEANING = 'cleaning',
  PEST_CONTROL = 'pest_control',
  CARPENTRY = 'carpentry'
}

interface GeoLocation {
  latitude: number;
  longitude: number;
}

interface Address {
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  location?: GeoLocation;
}

interface PriceBreakdown {
  basePrice: number;
  serviceCharge: number;
  tax: number;
  discount: number;
  total: number;
}

interface Booking {
  id: string;
  userId: string;
  providerId: string;
  serviceId: string;
  category: ServiceCategory;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  address: Address;
  status: BookingStatus;
  price: PriceBreakdown;
  providerLocation?: GeoLocation;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory storage (replace with database in production)
const bookings: Map<string, Booking> = new Map();

// Zod Schemas
const createBookingSchema = z.object({
  providerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  category: z.nativeEnum(ServiceCategory),
  serviceName: z.string().min(1),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  address: z.object({
    houseNumber: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().length(6),
    landmark: z.string().optional(),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    }).optional()
  }),
  description: z.string().optional()
});

const updateBookingSchema = z.object({
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  address: z.object({
    houseNumber: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().length(6),
    landmark: z.string().optional(),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    }).optional()
  }).optional(),
  description: z.string().optional()
});

const rescheduleSchema = z.object({
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/)
});

const trackBookingSchema = z.object({
  providerId: z.string().uuid().optional()
});

// Helper function to get userId from request
const getUserId = (req: Request): string => {
  return req.headers['x-user-id'] as string || 'anonymous';
};

// POST /bookings - Create a new booking
bookingsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const validationResult = createBookingSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const data = validationResult.data;

    // Calculate price (mock - integrate with pricing service)
    const basePrice = 500; // Base price
    const serviceCharge = Math.round(basePrice * 0.05); // 5% service charge
    const tax = Math.round((basePrice + serviceCharge) * 0.18); // 18% GST
    const total = basePrice + serviceCharge + tax;

    const booking: Booking = {
      id: uuidv4(),
      userId,
      providerId: data.providerId,
      serviceId: data.serviceId,
      category: data.category,
      serviceName: data.serviceName,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      address: data.address,
      status: BookingStatus.PENDING,
      price: {
        basePrice,
        serviceCharge,
        tax,
        discount: 0,
        total
      },
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    bookings.set(booking.id, booking);

    logger.info({
      message: 'Booking created',
      bookingId: booking.id,
      userId,
      providerId: data.providerId
    });

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    logger.error({ message: 'Error creating booking', error: error.message });
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET /bookings - List user bookings
bookingsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const status = req.query.status as BookingStatus | undefined;
    const category = req.query.category as ServiceCategory | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    let userBookings = Array.from(bookings.values())
      .filter(booking => booking.userId === userId);

    if (status) {
      userBookings = userBookings.filter(booking => booking.status === status);
    }

    if (category) {
      userBookings = userBookings.filter(booking => booking.category === category);
    }

    // Sort by createdAt descending
    userBookings.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = userBookings.length;
    const paginatedBookings = userBookings.slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginatedBookings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error: any) {
    logger.error({ message: 'Error fetching bookings', error: error.message });
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /bookings/:id - Get booking details
bookingsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const bookingId = req.params.id;

    const booking = bookings.get(bookingId);

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Check ownership (unless admin)
    if (booking.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    logger.error({ message: 'Error fetching booking', error: error.message });
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// PATCH /bookings/:id - Update booking
bookingsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const bookingId = req.params.id;

    const booking = bookings.get(bookingId);

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Check ownership
    if (booking.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const validationResult = updateBookingSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const updates = validationResult.data;

    // Validate status transitions
    if (updates.status) {
      const validTransitions: Record<BookingStatus, BookingStatus[]> = {
        [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
        [BookingStatus.CONFIRMED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
        [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
        [BookingStatus.COMPLETED]: [],
        [BookingStatus.CANCELLED]: []
      };

      if (!validTransitions[booking.status].includes(updates.status)) {
        res.status(400).json({
          error: 'Invalid status transition',
          currentStatus: booking.status,
          requestedStatus: updates.status
        });
        return;
      }
    }

    // Apply updates
    Object.assign(booking, updates, { updatedAt: new Date().toISOString() });
    bookings.set(bookingId, booking);

    logger.info({
      message: 'Booking updated',
      bookingId,
      userId,
      updates
    });

    res.json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    logger.error({ message: 'Error updating booking', error: error.message });
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// DELETE /bookings/:id - Cancel booking
bookingsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const bookingId = req.params.id;

    const booking = bookings.get(bookingId);

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Check ownership
    if (booking.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Can only cancel pending or confirmed bookings
    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
      res.status(400).json({
        error: 'Cannot cancel booking',
        currentStatus: booking.status
      });
      return;
    }

    booking.status = BookingStatus.CANCELLED;
    booking.updatedAt = new Date().toISOString();
    bookings.set(bookingId, booking);

    logger.info({
      message: 'Booking cancelled',
      bookingId,
      userId
    });

    res.json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    logger.error({ message: 'Error cancelling booking', error: error.message });
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// POST /bookings/:id/track - Track provider location
bookingsRouter.post('/:id/track', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const bookingId = req.params.id;

    const booking = bookings.get(bookingId);

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Check ownership
    if (booking.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Only track confirmed or in-progress bookings
    if (![BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS].includes(booking.status)) {
      res.status(400).json({
        error: 'Cannot track provider',
        currentStatus: booking.status
      });
      return;
    }

    // Mock provider location (integrate with provider service in production)
    const providerLocation = booking.providerLocation || {
      latitude: 26.8467 + (Math.random() - 0.5) * 0.1,
      longitude: 80.9462 + (Math.random() - 0.5) * 0.1
    };

    res.json({
      success: true,
      data: {
        bookingId,
        providerId: booking.providerId,
        location: providerLocation,
        estimatedArrival: '15 minutes',
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ message: 'Error tracking provider', error: error.message });
    res.status(500).json({ error: 'Failed to track provider' });
  }
});

// POST /bookings/:id/reschedule - Reschedule booking
bookingsRouter.post('/:id/reschedule', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const bookingId = req.params.id;

    const booking = bookings.get(bookingId);

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Check ownership
    if (booking.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Can only reschedule pending or confirmed bookings
    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
      res.status(400).json({
        error: 'Cannot reschedule booking',
        currentStatus: booking.status
      });
      return;
    }

    const validationResult = rescheduleSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const { scheduledDate, scheduledTime } = validationResult.data;

    booking.scheduledDate = scheduledDate;
    booking.scheduledTime = scheduledTime;
    booking.updatedAt = new Date().toISOString();
    bookings.set(bookingId, booking);

    logger.info({
      message: 'Booking rescheduled',
      bookingId,
      userId,
      newDate: scheduledDate,
      newTime: scheduledTime
    });

    res.json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    logger.error({ message: 'Error rescheduling booking', error: error.message });
    res.status(500).json({ error: 'Failed to reschedule booking' });
  }
});

// POST /bookings/:id/complete - Mark booking as complete
bookingsRouter.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const bookingId = req.params.id;

    const booking = bookings.get(bookingId);

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Check ownership
    if (booking.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Can only complete in-progress bookings
    if (booking.status !== BookingStatus.IN_PROGRESS) {
      res.status(400).json({
        error: 'Cannot complete booking',
        currentStatus: booking.status
      });
      return;
    }

    booking.status = BookingStatus.COMPLETED;
    booking.updatedAt = new Date().toISOString();
    bookings.set(bookingId, booking);

    logger.info({
      message: 'Booking completed',
      bookingId,
      userId
    });

    res.json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    logger.error({ message: 'Error completing booking', error: error.message });
    res.status(500).json({ error: 'Failed to complete booking' });
  }
});
