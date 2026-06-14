/**
 * Request Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { conciergeService } from '../services/concierge.service';

const router = Router();

// Validation schemas
const createRequestSchema = z.object({
  guestId: z.string().min(1),
  bookingId: z.string().optional(),
  merchantId: z.string().min(1),
  requestType: z.enum([
    'room_service', 'housekeeping', 'transport', 'spa',
    'restaurant', 'information', 'complaint', 'checkout',
    'checkin', 'general'
  ]),
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  dueBy: z.string().datetime().optional(),
});

const updateRequestSchema = z.object({
  status: z.enum(['pending', 'assigned', 'in_progress', 'completed', 'cancelled']).optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

// POST /api/requests - Create a new request
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = createRequestSchema.parse(req.body);
    const request = await conciergeService.createRequest(validated);

    res.status(201).json({
      success: true,
      data: { request },
      message: 'Request created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to create request' },
    });
  }
});

// GET /api/requests - List requests
router.get('/', async (req: Request, res: Response) => {
  try {
    const { merchantId, guestId, status, requestType, page = '1', limit = '50' } = req.query;

    const requests = await conciergeService.getRequests(
      {
        merchantId: merchantId as string,
        guestId: guestId as string,
        status: status as any,
        requestType: requestType as any,
      },
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      }
    );

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get requests' },
    });
  }
});

// GET /api/requests/:requestId - Get single request
router.get('/:requestId', async (req: Request, res: Response) => {
  try {
    const request = await conciergeService.getRequestById(req.params.requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Request not found' },
      });
    }

    res.json({ success: true, data: { request } });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get request' },
    });
  }
});

// PUT /api/requests/:requestId - Update request
router.put('/:requestId', async (req: Request, res: Response) => {
  try {
    const validated = updateRequestSchema.parse(req.body);
    const request = await conciergeService.updateRequest(req.params.requestId, validated);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Request not found' },
      });
    }

    res.json({
      success: true,
      data: { request },
      message: 'Request updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Update request error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to update request' },
    });
  }
});

// PATCH /api/requests/:requestId/assign - Assign request
router.patch('/:requestId/assign', async (req: Request, res: Response) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'assignedTo is required' },
      });
    }

    const request = await conciergeService.assignRequest(req.params.requestId, assignedTo);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Request not found' },
      });
    }

    res.json({
      success: true,
      data: { request },
      message: 'Request assigned successfully',
    });
  } catch (error) {
    console.error('Assign request error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to assign request' },
    });
  }
});

// PATCH /api/requests/:requestId/complete - Complete request
router.patch('/:requestId/complete', async (req: Request, res: Response) => {
  try {
    const { notes } = req.body;
    const request = await conciergeService.completeRequest(req.params.requestId, notes);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Request not found' },
      });
    }

    res.json({
      success: true,
      data: { request },
      message: 'Request completed successfully',
    });
  } catch (error) {
    console.error('Complete request error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to complete request' },
    });
  }
});

// GET /api/requests/booking/:bookingId - Get requests by booking
router.get('/booking/:bookingId', async (req: Request, res: Response) => {
  try {
    const requests = await conciergeService.getRequestsByBooking(req.params.bookingId);

    res.json({
      success: true,
      data: { requests },
    });
  } catch (error) {
    console.error('Get booking requests error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get requests' },
    });
  }
});

// GET /api/requests/stats/:merchantId - Get request statistics
router.get('/stats/:merchantId', async (req: Request, res: Response) => {
  try {
    const stats = await conciergeService.getRequestStats(req.params.merchantId);

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get statistics' },
    });
  }
});

export default router;
