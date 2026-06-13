import { Request, Response, NextFunction } from 'express';
import { roomTwinService } from '../services/room-twin.service';
import {
  validateCreateRoomTwin,
  validateUpdateIoTState,
  validateUpdateRoomStatus,
  CreateRoomTwinRequest,
  UpdateIoTStateRequest,
  UpdateRoomStatusRequest
} from '../schemas/room-twin.schema';
import { logger } from '../utils/logger';

export class RoomTwinController {
  /**
   * POST /api/twins/room
   * Create a new Room Twin
   */
  async createRoomTwin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const valid = validateCreateRoomTwin(req.body);
      if (!valid) {
        res.status(400).json({
          error: 'Validation Error',
          details: validateCreateRoomTwin.errors
        });
        return;
      }

      const request: CreateRoomTwinRequest = req.body;
      const result = await roomTwinService.createRoomTwin(request);

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          error: 'Conflict',
          message: error.message
        });
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/twins/room/:id
   * Get Room Twin by ID
   */
  async getRoomTwin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await roomTwinService.getRoomTwin(id);

      res.json(result.toJSON());
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/twins/room/:id/status
   * Get Room Status
   */
  async getRoomStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await roomTwinService.getRoomStatus(id);

      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      next(error);
    }
  }

  /**
   * PUT /api/twins/room/:id/iot
   * Update Room IoT State
   */
  async updateIoTState(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const valid = validateUpdateIoTState(req.body);
      if (!valid) {
        res.status(400).json({
          error: 'Validation Error',
          details: validateUpdateIoTState.errors
        });
        return;
      }

      const request: UpdateIoTStateRequest = req.body;
      const result = await roomTwinService.updateIoTState(id, request);

      res.json({
        twinId: result.twinId,
        roomId: result.roomId,
        iotState: result.iotState,
        updatedAt: result.updatedAt.toISOString()
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      next(error);
    }
  }

  /**
   * PUT /api/twins/room/:id/status
   * Update Room Status
   */
  async updateRoomStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const valid = validateUpdateRoomStatus(req.body);
      if (!valid) {
        res.status(400).json({
          error: 'Validation Error',
          details: validateUpdateRoomStatus.errors
        });
        return;
      }

      const request: UpdateRoomStatusRequest = req.body;
      const result = await roomTwinService.updateRoomStatus(id, request);

      res.json({
        twinId: result.twinId,
        roomId: result.roomId,
        status: result.status,
        updatedAt: result.updatedAt.toISOString()
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      next(error);
    }
  }

  /**
   * PUT /api/twins/room/:id/assign
   * Assign guest to room
   */
  async assignGuest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { guestId, checkOutDate } = req.body;

      if (!guestId) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'guestId is required'
        });
        return;
      }

      await roomTwinService.assignGuest(id, guestId, checkOutDate);

      res.json({ success: true, message: 'Guest assigned to room' });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      next(error);
    }
  }

  /**
   * PUT /api/twins/room/:id/vacate
   * Vacate room (checkout)
   */
  async vacateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await roomTwinService.vacateRoom(id);

      res.json({ success: true, message: 'Room vacated' });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      next(error);
    }
  }

  /**
   * PUT /api/twins/room/:id/availability
   * Check room availability
   */
  async getRoomAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { propertyId, currentRoomType } = req.query;

      if (propertyId && currentRoomType) {
        const rooms = await roomTwinService.getAvailableRoomsForUpgrade(
          propertyId as string,
          currentRoomType as string
        );
        res.json({ rooms });
      } else {
        const room = await roomTwinService.getRoomStatus(id);
        res.json({ available: room.status.current === 'available', room });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      next(error);
    }
  }

  /**
   * DELETE /api/twins/room/:id
   * Delete Room Twin
   */
  async deleteRoomTwin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await roomTwinService.deleteRoomTwin(id);

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      next(error);
    }
  }
}

// Export singleton instance
export const roomTwinController = new RoomTwinController();
