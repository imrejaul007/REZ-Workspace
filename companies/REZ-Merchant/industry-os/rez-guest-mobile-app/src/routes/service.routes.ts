/**
 * Service Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { GuestProfile } from '../models/GuestProfile';

const router = Router();

// Validation schemas
const ServiceRequestSchema = z.object({
  guestId: z.string().min(1),
  bookingId: z.string().min(1),
  serviceType: z.enum(['room_service', 'spa', 'transport', 'restaurant', 'concierge', 'laundry']),
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  scheduledTime: z.string().datetime().optional(),
});

const RoomServiceRequestSchema = z.object({
  guestId: z.string().min(1),
  bookingId: z.string().min(1),
  type: z.enum(['cleaning', 'towels', 'toiletries', 'minibar', 'maintenance', 'dnd', 'other']),
  description: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
});

const FeedbackSchema = z.object({
  guestId: z.string().min(1),
  bookingId: z.string().min(1),
  hotelId: z.string().min(1),
  rating: z.number().min(1).max(5),
  categories: z.object({
    cleanliness: z.number().min(1).max(5).optional(),
    service: z.number().min(1).max(5).optional(),
    amenities: z.number().min(1).max(5).optional(),
    value: z.number().min(1).max(5).optional(),
  }).optional(),
  comment: z.string().max(2000).optional(),
});

// GET /api/services - List available services
router.get('/', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.query;

    const services = {
      roomService: {
        name: 'Room Service',
        icon: 'restaurant',
        available: true,
        categories: ['Food & Beverages', 'Minibar', 'Late Night Menu'],
      },
      spa: {
        name: 'Spa & Wellness',
        icon: 'spa',
        available: true,
        categories: ['Massage', 'Facials', 'Body Treatments'],
      },
      transport: {
        name: 'Transportation',
        icon: 'car',
        available: true,
        categories: ['Airport Transfer', 'City Tour', 'Local Travel'],
      },
      restaurant: {
        name: 'Restaurant Reservations',
        icon: 'restaurant',
        available: true,
        categories: ['In-hotel Dining', 'Special Occasions'],
      },
      concierge: {
        name: 'Concierge',
        icon: 'support_agent',
        available: true,
        categories: ['Information', 'Special Requests'],
      },
      laundry: {
        name: 'Laundry & Dry Cleaning',
        icon: 'local_laundry_service',
        available: true,
        categories: ['Same-day Service', 'Express Service'],
      },
    };

    res.json({ success: true, data: { services } });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get services' },
    });
  }
});

// POST /api/services/request - Create service request
router.post('/request', async (req: Request, res: Response) => {
  try {
    const validated = ServiceRequestSchema.parse(req.body);

    const request = {
      id: `SR-${Date.now()}`,
      ...validated,
      scheduledTime: validated.scheduledTime ? new Date(validated.scheduledTime) : undefined,
      status: 'pending',
      createdAt: new Date(),
    };

    res.status(201).json({
      success: true,
      data: { request },
      message: 'Service request submitted successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Service request error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to submit request' },
    });
  }
});

// GET /api/services/history/:guestId - Get service history
router.get('/history/:guestId', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const { status, type } = req.query;

    // Mock service history
    const services = [];

    res.json({ success: true, data: { services } });
  } catch (error) {
    console.error('Get service history error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get service history' },
    });
  }
});

// POST /api/services/room - Room service request
router.post('/room', async (req: Request, res: Response) => {
  try {
    const validated = RoomServiceRequestSchema.parse(req.body);

    const request = {
      id: `RS-${Date.now()}`,
      ...validated,
      status: 'pending',
      createdAt: new Date(),
    };

    res.status(201).json({
      success: true,
      data: { request },
      message: 'Room service request submitted',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Room service error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to submit request' },
    });
  }
});

// POST /api/services/feedback - Submit feedback
router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const validated = FeedbackSchema.parse(req.body);

    const feedback = {
      id: `FB-${Date.now()}`,
      ...validated,
      status: 'submitted',
      createdAt: new Date(),
    };

    res.status(201).json({
      success: true,
      data: { feedback },
      message: 'Thank you for your feedback!',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Feedback error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to submit feedback' },
    });
  }
});

export default router;
