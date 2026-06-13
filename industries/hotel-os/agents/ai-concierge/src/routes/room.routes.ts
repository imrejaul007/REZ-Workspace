/**
 * AI Concierge Agent - Room Twin Routes
 * API endpoints for Room Twin operations
 */

import { Router, Request, Response } from 'express';
import { RoomTwinService } from '../services';
import { asyncHandler } from '../utils';
import { CreateRoomTwinInput, UpdateRoomStatusInput, UpdateIoTStateInput } from '../schemas';

export const createRoomTwinRoutes = (roomTwinService: RoomTwinService) => {
  const router = Router();

  /**
   * POST /api/twins/room
   * Create a new Room Twin
   */
  router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const input: CreateRoomTwinInput = req.body;
      const result = await roomTwinService.createRoomTwin(input);
      res.status(201).json(result);
    })
  );

  /**
   * GET /api/twins/room
   * Get all Room Twins
   */
  router.get(
    '/',
    asyncHandler(async (_req: Request, res: Response) => {
      const { property_id, available } = _req.query;

      if (property_id) {
        if (available === 'true') {
          const result = await roomTwinService.getAvailableRooms(property_id as string);
          return res.json(result);
        }
        const result = await roomTwinService.getRoomsByProperty(property_id as string);
        return res.json(result);
      }

      // Return all rooms (for admin purposes)
      const rooms: any[] = [];
      const allRooms = await roomTwinService.getAvailableRooms('__all__');
      res.json(allRooms);
    })
  );

  /**
   * GET /api/twins/room/:id
   * Get a Room Twin by ID
   */
  router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const result = await roomTwinService.getRoomTwin(id);
      res.json(result);
    })
  );

  /**
   * GET /api/twins/room/:id/status
   * Get room status only
   */
  router.get(
    '/:id/status',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const result = await roomTwinService.getRoomStatus(id);
      res.json(result);
    })
  );

  /**
   * PUT /api/twins/room/:id/status
   * Update room status
   */
  router.put(
    '/:id/status',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const input: UpdateRoomStatusInput = req.body;
      const result = await roomTwinService.updateRoomStatus(id, input);
      res.json(result);
    })
  );

  /**
   * PATCH /api/twins/room/:id/status
   * Partially update room status
   */
  router.patch(
    '/:id/status',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const input: UpdateRoomStatusInput = req.body;
      const result = await roomTwinService.updateRoomStatus(id, input);
      res.json(result);
    })
  );

  /**
   * PUT /api/twins/room/:id/iot
   * Update IoT state
   */
  router.put(
    '/:id/iot',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const input: UpdateIoTStateInput = req.body;
      const result = await roomTwinService.updateIoTState(id, input);
      res.json(result);
    })
  );

  /**
   * PATCH /api/twins/room/:id/iot
   * Partially update IoT state
   */
  router.patch(
    '/:id/iot',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const input: UpdateIoTStateInput = req.body;
      const result = await roomTwinService.updateIoTState(id, input);
      res.json(result);
    })
  );

  /**
   * PUT /api/twins/room/:id/housekeeping
   * Update housekeeping status
   */
  router.put(
    '/:id/housekeeping',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const status = req.body;
      const result = await roomTwinService.updateHousekeeping(id, status);
      res.json(result);
    })
  );

  /**
   * DELETE /api/twins/room/:id
   * Delete a Room Twin
   */
  router.delete(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const result = await roomTwinService.deleteRoomTwin(id);
      res.json(result);
    })
  );

  return router;
};