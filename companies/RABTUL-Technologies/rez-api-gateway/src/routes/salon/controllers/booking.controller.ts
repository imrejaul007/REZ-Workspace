/**
 * Booking Controller
 *
 * Handles salon booking operations: create, retrieve, cancel bookings.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../../config/logger';
import {
  circuitBreaker,
  CircuitOpenError,
} from '../../utils/circuitBreaker';
import {
  Booking,
  BookingService,
  CreateBookingRequest,
  TimeSlot,
  SalonService,
} from './types';

// Service URLs
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:4012';

// In-memory store for demo
const bookingsStore = new Map<string, Booking>();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const bookingIdParamSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
});

const createBookingSchema = z.object({
  salonId: z.string().min(1, 'Salon ID is required'),
  services: z.array(z.object({
    serviceId: z.string().min(1, 'Service ID is required'),
  })).min(1, 'At least one service is required'),
  stylistId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  notes: z.string().optional(),
});

// ============================================
// ORDER SERVICE CALL
// ============================================

async function callOrderService<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<T> {
  return circuitBreaker(
    'order-service',
    async () => {
      const response = await fetch(`${ORDER_SERVICE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Order service error: ${response.status}`);
      }

      return response.json() as Promise<T>;
    }
  );
}

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

/**
 * Create a new booking
 * POST /salons/:id/bookings
 */
export async function createBooking(req: Request, res: Response): Promise<void> {
  try {
    const { id: salonId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
      return;
    }

    const bodyValidation = createBookingSchema.safeParse({
      ...req.body,
      salonId,
    });

    if (!bodyValidation.success) {
      res.status(400).json({
        success: false,
        message: bodyValidation.error.errors[0].message,
      });
      return;
    }

    const bookingData = bodyValidation.data;

    logger.info('[Salon] Create booking', {
      userId,
      salonId,
      services: bookingData.services.map(s => s.serviceId),
      date: bookingData.date,
      time: bookingData.time,
    });

    // Try circuit breaker call first, fall back to demo data
    let booking: Booking;

    try {
      booking = await callOrderService<Booking>('/api/bookings', 'POST', {
        ...bookingData,
        userId,
      });
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
        res.status(503).json({
          success: false,
          error: 'Order service temporarily unavailable',
          circuitState: error.circuitState,
          retryAfterMs: error.retryAfter,
        });
        return;
      }

      // Fallback to demo booking
      booking = generateDemoBooking(bookingData, userId);
    }

    bookingsStore.set(booking.id, booking);

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Booking creation failed';
    logger.error('[Salon] Create booking failed', { error: message });
    res.status(500).json({ success: false, message });
  }
}

/**
 * Get booking by ID
 * GET /bookings/:id
 */
export async function getBooking(req: Request, res: Response): Promise<void> {
  try {
    const { id: bookingId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    const validation = bookingIdParamSchema.safeParse({ bookingId });
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
      return;
    }

    logger.info('[Salon] Get booking', { bookingId, userId });

    // Try circuit breaker call first, fall back to demo data
    let booking: Booking;

    try {
      booking = await callOrderService<Booking>(`/api/bookings/${bookingId}`);
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
        res.status(503).json({
          success: false,
          error: 'Order service temporarily unavailable',
          circuitState: error.circuitState,
          retryAfterMs: error.retryAfter,
        });
        return;
      }

      // Fallback to demo data
      booking = bookingsStore.get(bookingId) || generateDemoBooking({
        salonId: 'SALON001',
        services: [{ serviceId: 'SVC001' }],
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
      }, userId);
      booking.id = bookingId;
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get booking';
    logger.error('[Salon] Get booking failed', { error: message });
    res.status(500).json({ success: false, message });
  }
}

/**
 * Cancel booking
 * DELETE /bookings/:id
 */
export async function cancelBooking(req: Request, res: Response): Promise<void> {
  try {
    const { id: bookingId } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const { reason } = req.body || {};

    const validation = bookingIdParamSchema.safeParse({ bookingId });
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
      return;
    }

    logger.info('[Salon] Cancel booking', { bookingId, userId, reason });

    // Try circuit breaker call first
    let result: { success: boolean; message: string };

    try {
      result = await callOrderService<{ success: boolean; message: string }>(
        `/api/bookings/${bookingId}`,
        'DELETE'
      );
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
        res.status(503).json({
          success: false,
          error: 'Order service temporarily unavailable',
          circuitState: error.circuitState,
          retryAfterMs: error.retryAfter,
        });
        return;
      }

      // Fallback to demo cancellation
      const booking = bookingsStore.get(bookingId);
      if (!booking) {
        res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
        return;
      }

      if (booking.status === 'cancelled') {
        res.status(400).json({
          success: false,
          message: 'Booking is already cancelled',
        });
        return;
      }

      if (booking.status === 'completed' || booking.status === 'in_progress') {
        res.status(400).json({
          success: false,
          message: 'Cannot cancel a completed or in-progress booking',
        });
        return;
      }

      booking.status = 'cancelled';
      booking.cancellationReason = reason || 'User requested cancellation';
      booking.updatedAt = new Date().toISOString();

      bookingsStore.set(bookingId, booking);

      result = { success: true, message: 'Booking cancelled successfully' };
    }

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel booking';
    logger.error('[Salon] Cancel booking failed', { error: message });
    res.status(500).json({ success: false, message });
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateDemoBooking(data: CreateBookingRequest, userId: string): Booking {
  const bookingId = `BKG${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const services: BookingService[] = data.services.map(svc => ({
    serviceId: svc.serviceId,
    serviceName: getServiceName(svc.serviceId),
    price: getServicePrice(svc.serviceId),
    duration: getServiceDuration(svc.serviceId),
  }));

  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);

  return {
    id: bookingId,
    salonId: data.salonId,
    salonName: getSalonName(data.salonId),
    userId,
    services,
    stylistId: data.stylistId,
    date: data.date,
    time: data.time,
    status: 'pending',
    totalPrice,
    duration: totalDuration,
    notes: data.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getServiceName(serviceId: string): string {
  const services: Record<string, string> = {
    SVC001: 'Haircut & Styling',
    SVC002: 'Hair Spa',
    SVC003: 'Facial',
    SVC004: 'Manicure',
    SVC005: 'Pedicure',
  };
  return services[serviceId] || 'Beauty Service';
}

function getServicePrice(serviceId: string): number {
  const prices: Record<string, number> = {
    SVC001: 500,
    SVC002: 800,
    SVC003: 600,
    SVC004: 300,
    SVC005: 350,
  };
  return prices[serviceId] || 500;
}

function getServiceDuration(serviceId: string): number {
  const durations: Record<string, number> = {
    SVC001: 45,
    SVC002: 60,
    SVC003: 50,
    SVC004: 30,
    SVC005: 35,
  };
  return durations[serviceId] || 30;
}

function getSalonName(salonId: string): string {
  const salons: Record<string, string> = {
    SALON001: 'Glamour Studio',
    SALON002: 'Style Lounge',
    SALON003: 'Natural Beauty',
  };
  return salons[salonId] || 'Unknown Salon';
}

export { bookingsStore };
