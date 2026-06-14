import { Router } from 'express';
import { ConciergeService, ConciergeInput } from '../services/conciergeService';
import { merchantAuth } from '../middleware/merchantAuth';
import { CONCIERGE_REQUEST_TYPES, CONCIERGE_REQUEST_STATUSES } from '../models/ConciergeRequest';
import { logger } from '../config/logger';

const router = Router();
const service = new ConciergeService();

/**
 * POST /api/v1/merchant/concierge
 * Create a new concierge request
 */
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { storeId, roomId, guestName, guestPhone, type, description, preferredTime, notes } = req.body;

    // Validate required fields
    if (!storeId || !roomId || !guestName || !guestPhone || !type || !description) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: storeId, roomId, guestName, guestPhone, type, description',
      });
      return;
    }

    // Validate type
    if (!CONCIERGE_REQUEST_TYPES.includes(type)) {
      res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${CONCIERGE_REQUEST_TYPES.join(', ')}`,
      });
      return;
    }

    const input: ConciergeInput = {
      storeId,
      roomId,
      guestName,
      guestPhone,
      type,
      description,
      preferredTime: preferredTime ? new Date(preferredTime) : undefined,
      notes,
    };

    const request = await service.createRequest(input);

    res.status(201).json({
      success: true,
      data: request,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Concierge] Failed to create request', { error: message });
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /api/v1/merchant/concierge
 * Get concierge requests for a store, optionally filtered by status
 */
router.get('/', merchantAuth, async (req, res) => {
  try {
    const { storeId, status } = req.query;

    if (!storeId || typeof storeId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'storeId is required',
      });
      return;
    }

    // Validate status if provided
    if (status && !CONCIERGE_REQUEST_STATUSES.includes(status as 'pending' | 'in_progress' | 'completed' | 'cancelled')) {
      res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${CONCIERGE_REQUEST_STATUSES.join(', ')}`,
      });
      return;
    }

    const requests = await service.getRequests(storeId, status as string | undefined);

    res.json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Concierge] Failed to get requests', { error: message });
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/v1/merchant/concierge/:id/assign
 * Assign a concierge request to a staff member
 */
router.post('/:id/assign', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    if (!staffId) {
      res.status(400).json({
        success: false,
        error: 'staffId is required',
      });
      return;
    }

    await service.assignRequest(id, staffId);

    res.json({
      success: true,
      message: 'Request assigned successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    logger.error('[Concierge] Failed to assign request', { requestId: req.params.id, error: message });
    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/v1/merchant/concierge/:id/complete
 * Mark a concierge request as completed
 */
router.post('/:id/complete', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    await service.completeRequest(id, notes);

    res.json({
      success: true,
      message: 'Request completed successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    logger.error('[Concierge] Failed to complete request', { requestId: req.params.id, error: message });
    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/v1/merchant/concierge/:id/feedback
 * Add feedback and rating to a completed concierge request
 */
router.post('/:id/feedback', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || typeof rating !== 'number') {
      res.status(400).json({
        success: false,
        error: 'rating is required and must be a number (1-5)',
      });
      return;
    }

    await service.addFeedback(id, rating, feedback);

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    logger.error('[Concierge] Failed to add feedback', { requestId: req.params.id, error: message });
    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /api/v1/merchant/concierge/guest/:phone
 * Get guest request history by phone number
 */
router.get('/guest/:phone', merchantAuth, async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      res.status(400).json({
        success: false,
        error: 'Guest phone is required',
      });
      return;
    }

    const requests = await service.getGuestHistory(phone);

    res.json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Concierge] Failed to get guest history', { phone: req.params.phone, error: message });
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /api/v1/merchant/concierge/staff/:staffId
 * Get requests assigned to a specific staff member
 */
router.get('/staff/:staffId', merchantAuth, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { status } = req.query;

    // Validate status if provided
    if (status && !CONCIERGE_REQUEST_STATUSES.includes(status as 'pending' | 'in_progress' | 'completed' | 'cancelled')) {
      res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${CONCIERGE_REQUEST_STATUSES.join(', ')}`,
      });
      return;
    }

    const requests = await service.getStaffRequests(staffId, status as string | undefined);

    res.json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Concierge] Failed to get staff requests', { staffId: req.params.staffId, error: message });
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/v1/merchant/concierge/:id/cancel
 * Cancel a concierge request
 */
router.post('/:id/cancel', merchantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await service.cancelRequest(id, reason);

    res.json({
      success: true,
      message: 'Request cancelled successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    logger.error('[Concierge] Failed to cancel request', { requestId: req.params.id, error: message });
    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

export default router;
