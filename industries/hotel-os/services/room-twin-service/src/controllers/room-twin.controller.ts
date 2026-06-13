import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { roomTwinService } from '../services/room-twin.service';
import {
  CreateRoomTwinSchema,
  UpdateRoomTwinSchema,
  createSuccessResponse,
  createErrorResponse
} from '../schemas';
import { logger } from '../utils/logger';

export class RoomTwinController {
  /**
   * POST /api/twins/room - Create a new room twin
   */
  async createRoomTwin(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();

    try {
      const validationResult = CreateRoomTwinSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'Invalid request body',
            validationResult.error.errors,
            requestId
          )
        );
        return;
      }

      const roomTwin = await roomTwinService.createRoomTwin(validationResult.data);

      logger.info('Room twin created via API', {
        requestId,
        roomId: roomTwin.roomId
      });

      res.status(201).json(createSuccessResponse(roomTwin, requestId));
    } catch (error) {
      logger.error('Error creating room twin', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json(
          createErrorResponse('CONFLICT', error.message, undefined, requestId)
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          'INTERNAL_ERROR',
          'Failed to create room twin',
          undefined,
          requestId
        )
      );
    }
  }

  /**
   * GET /api/twins/room/:id - Get room twin by ID
   */
  async getRoomTwin(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;

    try {
      const roomTwin = await roomTwinService.getRoomTwin(id);

      if (!roomTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Room twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(roomTwin, requestId));
    } catch (error) {
      logger.error('Error fetching room twin', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch room twin', undefined, requestId)
      );
    }
  }

  /**
   * GET /api/twins/room/:id/status - Get room status with IoT state
   */
  async getRoomStatus(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;

    try {
      const status = await roomTwinService.getRoomStatus(id);

      if (!status) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Room status for ${id} not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(status, requestId));
    } catch (error) {
      logger.error('Error fetching room status', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch room status', undefined, requestId)
      );
    }
  }

  /**
   * PUT /api/twins/room/:id - Update room twin
   */
  async updateRoomTwin(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;

    try {
      const validationResult = UpdateRoomTwinSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'Invalid request body',
            validationResult.error.errors,
            requestId
          )
        );
        return;
      }

      const roomTwin = await roomTwinService.updateRoomTwin(id, validationResult.data);

      if (!roomTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Room twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      logger.info('Room twin updated via API', {
        requestId,
        roomId: id
      });

      res.json(createSuccessResponse(roomTwin, requestId));
    } catch (error) {
      logger.error('Error updating room twin', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to update room twin', undefined, requestId)
      );
    }
  }

  /**
   * POST /api/twins/room/:id/checkin - Check-in guest to room
   */
  async checkInGuest(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;
    const { guestId, reservationId } = req.body;

    try {
      if (!guestId || !reservationId) {
        res.status(400).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'guestId and reservationId are required',
            undefined,
            requestId
          )
        );
        return;
      }

      const roomTwin = await roomTwinService.checkInGuest(id, guestId, reservationId);

      if (!roomTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Room twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      logger.info('Guest checked in via API', {
        requestId,
        roomId: id,
        guestId
      });

      res.json(createSuccessResponse(roomTwin, requestId));
    } catch (error) {
      logger.error('Error checking in guest', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to check in guest', undefined, requestId)
      );
    }
  }

  /**
   * POST /api/twins/room/:id/checkout - Check-out guest from room
   */
  async checkOutGuest(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;

    try {
      const roomTwin = await roomTwinService.checkOutGuest(id);

      if (!roomTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Room twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      logger.info('Guest checked out via API', {
        requestId,
        roomId: id
      });

      res.json(createSuccessResponse(roomTwin, requestId));
    } catch (error) {
      logger.error('Error checking out guest', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to check out guest', undefined, requestId)
      );
    }
  }

  /**
   * GET /api/twins/room/property/:propertyId - Get all rooms for a property
   */
  async getRoomsByProperty(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { propertyId } = req.params;

    try {
      const rooms = await roomTwinService.getRoomsByProperty(propertyId);
      res.json(createSuccessResponse(rooms, requestId));
    } catch (error) {
      logger.error('Error fetching rooms by property', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch rooms', undefined, requestId)
      );
    }
  }

  /**
   * GET /api/twins/room/property/:propertyId/available - Get available rooms
   */
  async getAvailableRooms(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { propertyId } = req.params;

    try {
      const rooms = await roomTwinService.getAvailableRooms(propertyId);
      res.json(createSuccessResponse(rooms, requestId));
    } catch (error) {
      logger.error('Error fetching available rooms', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch available rooms', undefined, requestId)
      );
    }
  }

  /**
   * GET /api/twins/room/property/:propertyId/stats - Get room statistics
   */
  async getRoomStats(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { propertyId } = req.params;

    try {
      const stats = await roomTwinService.getRoomStats(propertyId);
      res.json(createSuccessResponse(stats, requestId));
    } catch (error) {
      logger.error('Error fetching room stats', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch room stats', undefined, requestId)
      );
    }
  }

  /**
   * POST /api/twins/room/:id/maintenance - Add maintenance issue
   */
  async addMaintenanceIssue(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;
    const { description, severity } = req.body;

    try {
      if (!description || !severity) {
        res.status(400).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'description and severity are required',
            undefined,
            requestId
          )
        );
        return;
      }

      const roomTwin = await roomTwinService.addMaintenanceIssue(id, description, severity);

      if (!roomTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Room twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(roomTwin, requestId));
    } catch (error) {
      logger.error('Error adding maintenance issue', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to add maintenance issue', undefined, requestId)
      );
    }
  }

  /**
   * POST /api/twins/room/:id/iot/command - Send IoT command to room
   */
  async sendIoTCommand(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;
    const { deviceId, command, parameters } = req.body;

    try {
      if (!deviceId || !command) {
        res.status(400).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'deviceId and command are required',
            undefined,
            requestId
          )
        );
        return;
      }

      const { iotService } = require('../services/iot-integration.service');
      const commandId = await iotService.sendCommand({
        deviceId,
        roomId: id,
        command,
        parameters
      });

      res.json(createSuccessResponse({ commandId }, requestId));
    } catch (error) {
      logger.error('Error sending IoT command', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to send IoT command', undefined, requestId)
      );
    }
  }
}

export const roomTwinController = new RoomTwinController();
