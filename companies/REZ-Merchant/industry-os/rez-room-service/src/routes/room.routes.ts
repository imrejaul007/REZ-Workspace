/**
 * Room Routes
 *
 * Room-specific endpoints for guest mobile app
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

// Validation schemas
const RoomServiceRequestSchema = z.object({
  guestId: z.string().min(1),
  bookingId: z.string().min(1),
  type: z.enum(['cleaning', 'towels', 'toiletries', 'minibar', 'maintenance', 'other']),
  notes: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
});

// GET /api/room/:bookingId - Get room info
router.get('/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    // Mock room data
    const roomData = {
      bookingId,
      roomNumber: '301',
      floor: 3,
      type: 'Deluxe Suite',
      checkIn: new Date().toISOString(),
      checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      amenities: ['WiFi', 'AC', 'Mini Bar', 'Room Service', 'Pool Access'],
      status: 'checked-in',
    };

    res.json({ success: true, data: roomData });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ success: false, error: { code: 'ERROR', message: 'Failed to get room info' } });
  }
});

// POST /api/room/:bookingId/service - Request room service
router.post('/:bookingId/service', async (req: Request, res: Response) => {
  try {
    const validated = RoomServiceRequestSchema.parse(req.body);
    const { bookingId } = req.params;

    // Create room service request
    const request = {
      id: `RS-${Date.now()}`,
      bookingId,
      ...validated,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      data: { request },
      message: 'Room service request submitted',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    }
    console.error('Room service error:', error);
    res.status(500).json({ success: false, error: { code: 'ERROR', message: 'Failed to submit request' } });
  }
});

// GET /api/room/:bookingId/services - Get room service history
router.get('/:bookingId/services', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    // Mock service history
    const services = [];

    res.json({ success: true, data: { services } });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ success: false, error: { code: 'ERROR', message: 'Failed to get services' } });
  }
});

// PUT /api/room/:bookingId/dnd - Toggle Do Not Disturb
router.put('/:bookingId/dnd', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { enabled } = req.body;

    res.json({
      success: true,
      data: { bookingId, dndEnabled: enabled },
      message: enabled ? 'Do Not Disturb enabled' : 'Do Not Disturb disabled',
    });
  } catch (error) {
    console.error('DND toggle error:', error);
    res.status(500).json({ success: false, error: { code: 'ERROR', message: 'Failed to update DND status' } });
  }
});

// PUT /api/room/:bookingId/thermostat - Control room temperature
router.put('/:bookingId/thermostat', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { temperature, mode } = req.body;

    res.json({
      success: true,
      data: { bookingId, temperature, mode },
      message: 'Thermostat updated',
    });
  } catch (error) {
    console.error('Thermostat error:', error);
    res.status(500).json({ success: false, error: { code: 'ERROR', message: 'Failed to update thermostat' } });
  }
});

// GET /api/room/:bookingId/keys - Get digital room key
router.get('/:bookingId/keys', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    res.json({
      success: true,
      data: {
        bookingId,
        roomKey: {
          qrCode: 'mock-qr-code',
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Get keys error:', error);
    res.status(500).json({ success: false, error: { code: 'ERROR', message: 'Failed to get room keys' } });
  }
});

export default router;
