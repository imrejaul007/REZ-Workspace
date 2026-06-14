/**
 * Guest Routes - API endpoints for guest management
 */

import { Router, Request, Response } from 'express';
import { guestService } from '../services/GuestService';
import { validateGuestInput, validateRequestId } from '../validators';
import { standardLimiter } from '../middleware/rateLimiter';
import { logger } from '../config/logger';

const router = Router();

/**
 * POST /api/guests
 * Create a new guest
 */
router.post('/', standardLimiter, validateGuestInput, async (req: Request, res: Response) => {
  try {
    const guest = await guestService.createGuest(req.body);
    res.status(201).json({ success: true, data: guest });
  } catch (error) {
    logger.error('Error creating guest', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to create guest' });
  }
});

/**
 * GET /api/guests/:id
 * Get guest by ID
 */
router.get('/:id', standardLimiter, validateRequestId, async (req: Request, res: Response) => {
  try {
    const guest = await guestService.getGuestById(req.params.id);
    if (!guest) {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }
    res.json({ success: true, data: guest });
  } catch (error) {
    logger.error('Error getting guest', { error: (error as Error).message, guestId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to get guest' });
  }
});

/**
 * GET /api/guests/room/:roomNumber
 * Get guests by room number
 */
router.get('/room/:roomNumber', standardLimiter, async (req: Request, res: Response) => {
  try {
    const guests = await guestService.getGuestsByRoom(req.params.roomNumber);
    res.json({ success: true, data: guests, count: guests.length });
  } catch (error) {
    logger.error('Error getting guests by room', { error: (error as Error).message, roomNumber: req.params.roomNumber });
    res.status(500).json({ success: false, error: 'Failed to get guests' });
  }
});

/**
 * PUT /api/guests/:id/requests
 * Add a request to guest
 */
router.put('/:id/requests', standardLimiter, validateRequestId, async (req: Request, res: Response) => {
  try {
    const { request } = req.body;
    if (!request || typeof request !== 'string') {
      return res.status(400).json({ success: false, error: 'Request text is required' });
    }

    const guest = await guestService.addRequest(req.params.id, request);
    if (!guest) {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }
    res.json({ success: true, data: guest });
  } catch (error) {
    logger.error('Error adding request to guest', { error: (error as Error).message, guestId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to add request' });
  }
});

/**
 * PUT /api/guests/:id
 * Update guest
 */
router.put('/:id', standardLimiter, validateRequestId, async (req: Request, res: Response) => {
  try {
    const guest = await guestService.updateGuest(req.params.id, req.body);
    if (!guest) {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }
    res.json({ success: true, data: guest });
  } catch (error) {
    logger.error('Error updating guest', { error: (error as Error).message, guestId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to update guest' });
  }
});

/**
 * DELETE /api/guests/:id
 * Delete guest
 */
router.delete('/:id', standardLimiter, validateRequestId, async (req: Request, res: Response) => {
  try {
    const deleted = await guestService.deleteGuest(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }
    res.json({ success: true, message: 'Guest deleted' });
  } catch (error) {
    logger.error('Error deleting guest', { error: (error as Error).message, guestId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to delete guest' });
  }
});

export default router;