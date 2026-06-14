/**
 * Service Request Routes - API endpoints for service requests
 */

import { Router, Request, Response } from 'express';
import { serviceRequestService } from '../services/ServiceRequestService';
import { validateServiceRequestInput, validateStatusUpdate, validateRequestId } from '../validators';
import { standardLimiter } from '../middleware/rateLimiter';
import { logger } from '../config/logger';

const router = Router();

/**
 * POST /api/requests
 * Create a new service request
 */
router.post('/', standardLimiter, validateServiceRequestInput, async (req: Request, res: Response) => {
  try {
    const request = await serviceRequestService.createRequest(req.body);
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    logger.error('Error creating service request', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to create service request' });
  }
});

/**
 * GET /api/requests
 * Get service requests with filters
 */
router.get('/', standardLimiter, async (req: Request, res: Response) => {
  try {
    const { status, type, priority, roomNumber } = req.query;
    const result = await serviceRequestService.getRequests({
      status: status as string | undefined,
      type: type as string | undefined,
      priority: priority as string | undefined,
      roomNumber: roomNumber as string | undefined,
    });
    res.json({ success: true, data: result.requests, count: result.count });
  } catch (error) {
    logger.error('Error getting service requests', { error: (error as Error).message, filters: req.query });
    res.status(500).json({ success: false, error: 'Failed to get service requests' });
  }
});

/**
 * GET /api/requests/:id
 * Get service request by ID
 */
router.get('/:id', standardLimiter, validateRequestId, async (req: Request, res: Response) => {
  try {
    const request = await serviceRequestService.getRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }
    res.json({ success: true, data: request });
  } catch (error) {
    logger.error('Error getting service request', { error: (error as Error).message, requestId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to get service request' });
  }
});

/**
 * PUT /api/requests/:id/status
 * Update service request status
 */
router.put('/:id/status', standardLimiter, validateRequestId, validateStatusUpdate, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'in_progress', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const request = await serviceRequestService.updateStatus(req.params.id, status);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }
    res.json({ success: true, data: request });
  } catch (error) {
    logger.error('Error updating service request status', { error: (error as Error).message, requestId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to update service request status' });
  }
});

/**
 * GET /api/requests/room/:roomNumber
 * Get service requests for a room
 */
router.get('/room/:roomNumber', standardLimiter, async (req: Request, res: Response) => {
  try {
    const requests = await serviceRequestService.getRequestsForRoom(req.params.roomNumber);
    res.json({ success: true, data: requests, count: requests.length });
  } catch (error) {
    logger.error('Error getting room service requests', { error: (error as Error).message, roomNumber: req.params.roomNumber });
    res.status(500).json({ success: false, error: 'Failed to get service requests' });
  }
});

/**
 * GET /api/requests/stats
 * Get service request statistics
 */
router.get('/stats/summary', standardLimiter, async (_req: Request, res: Response) => {
  try {
    const pendingCount = await serviceRequestService.getPendingRequestsCount();
    const byType = await serviceRequestService.getRequestsByType();
    res.json({ success: true, data: { pending: pendingCount, byType } });
  } catch (error) {
    logger.error('Error getting service request stats', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get statistics' });
  }
});

export default router;