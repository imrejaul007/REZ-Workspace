import { Request, Response, NextFunction } from 'express';
import { roomTwinService } from '../services';
import { logger } from '../utils/logger';

export class RoomTwinController {
  /**
   * POST /api/twins/room - Create room twin
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roomTwin = await roomTwinService.create(req.body);
      res.status(201).json({
        success: true,
        data: roomTwin,
        message: 'Room twin created successfully',
      });
    } catch (error) {
      logger.error('Error creating room twin:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/room/:id - Get room twin
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const roomTwin = await roomTwinService.getById(id);

      if (!roomTwin) {
        res.status(404).json({
          success: false,
          error: 'Room twin not found',
        });
        return;
      }

      res.json({
        success: true,
        data: roomTwin,
      });
    } catch (error) {
      logger.error('Error getting room twin:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/room/:id/status - Get room status
   */
  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const status = await roomTwinService.getStatus(id);

      if (!status) {
        res.status(404).json({
          success: false,
          error: 'Room twin not found',
        });
        return;
      }

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('Error getting room status:', error);
      next(error);
    }
  }

  /**
   * PUT /api/twins/room/:id/status - Update room status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, reason, changedBy } = req.body;

      const roomTwin = await roomTwinService.updateStatus(id, status, changedBy, reason);

      if (!roomTwin) {
        res.status(404).json({
          success: false,
          error: 'Room twin not found',
        });
        return;
      }

      res.json({
        success: true,
        data: roomTwin,
        message: 'Room status updated successfully',
      });
    } catch (error) {
      logger.error('Error updating room status:', error);
      next(error);
    }
  }

  /**
   * PUT /api/twins/room/:id/condition - Update room condition
   */
  async updateCondition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const roomTwin = await roomTwinService.updateCondition(id, req.body);

      if (!roomTwin) {
        res.status(404).json({
          success: false,
          error: 'Room twin not found',
        });
        return;
      }

      res.json({
        success: true,
        data: roomTwin,
        message: 'Room condition updated successfully',
      });
    } catch (error) {
      logger.error('Error updating room condition:', error);
      next(error);
    }
  }

  /**
   * PUT /api/twins/room/:id/iot - Update IoT state
   */
  async updateIoTState(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const roomTwin = await roomTwinService.updateIoTState(id, req.body);

      if (!roomTwin) {
        res.status(404).json({
          success: false,
          error: 'Room twin not found',
        });
        return;
      }

      res.json({
        success: true,
        data: roomTwin,
        message: 'IoT state updated successfully',
      });
    } catch (error) {
      logger.error('Error updating IoT state:', error);
      next(error);
    }
  }

  /**
   * POST /api/twins/room/:id/checkin - Check in guest
   */
  async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { guestId, checkIn, checkOut } = req.body;

      if (!guestId || !checkIn || !checkOut) {
        res.status(400).json({
          success: false,
          error: 'guestId, checkIn, and checkOut are required',
        });
        return;
      }

      const roomTwin = await roomTwinService.checkIn(
        id,
        guestId,
        new Date(checkIn),
        new Date(checkOut)
      );

      if (!roomTwin) {
        res.status(404).json({
          success: false,
          error: 'Room twin not found',
        });
        return;
      }

      res.json({
        success: true,
        data: roomTwin,
        message: 'Guest checked in successfully',
      });
    } catch (error) {
      logger.error('Error checking in guest:', error);
      if (error instanceof Error && error.message.includes('not available')) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/twins/room/:id/checkout - Check out guest
   */
  async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const roomTwin = await roomTwinService.checkOut(id);

      if (!roomTwin) {
        res.status(404).json({
          success: false,
          error: 'Room twin not found',
        });
        return;
      }

      res.json({
        success: true,
        data: roomTwin,
        message: 'Guest checked out successfully',
      });
    } catch (error) {
      logger.error('Error checking out guest:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/room - Query room twins
   */
  async query(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        propertyId,
        status,
        bedType,
        floor,
        view,
        minPrice,
        maxPrice,
        accessibility,
        tag,
        limit,
        offset,
      } = req.query;

      const filters = {
        propertyId: propertyId as string,
        status: status as string,
        bedType: bedType as string,
        floor: floor ? parseInt(floor as string, 10) : undefined,
        view: view as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        accessibility: accessibility === 'true' ? true : accessibility === 'false' ? false : undefined,
        tag: tag as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      };

      const result = await roomTwinService.query(filters);

      res.json({
        success: true,
        data: result.rooms,
        pagination: {
          total: result.total,
          limit: filters.limit || 20,
          offset: filters.offset || 0,
        },
      });
    } catch (error) {
      logger.error('Error querying room twins:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/room/available - Find available rooms
   */
  async findAvailable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        propertyId,
        checkIn,
        checkOut,
        guestCount,
        bedType,
        floor,
        view,
        accessibility,
        limit,
      } = req.query;

      if (!propertyId) {
        res.status(400).json({
          success: false,
          error: 'propertyId is required',
        });
        return;
      }

      const query = {
        propertyId: propertyId as string,
        checkIn: checkIn ? new Date(checkIn as string) : undefined,
        checkOut: checkOut ? new Date(checkOut as string) : undefined,
        guestCount: guestCount ? parseInt(guestCount as string, 10) : 1,
        bedType: bedType as string,
        floor: floor ? parseInt(floor as string, 10) : undefined,
        view: view as string,
        accessibility: accessibility === 'true' ? true : accessibility === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string, 10) : 20,
      };

      const rooms = await roomTwinService.findAvailable(query);

      res.json({
        success: true,
        data: rooms,
        count: rooms.length,
      });
    } catch (error) {
      logger.error('Error finding available rooms:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/room/maintenance - Get rooms needing maintenance
   */
  async getMaintenanceRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.query;
      const rooms = await roomTwinService.getRoomsNeedingMaintenance(propertyId as string);

      res.json({
        success: true,
        data: rooms,
        count: rooms.length,
      });
    } catch (error) {
      logger.error('Error getting maintenance rooms:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/room/stats - Get room statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.query;
      const stats = await roomTwinService.getStatistics(propertyId as string);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting room statistics:', error);
      next(error);
    }
  }

  /**
   * POST /api/twins/room/bulk - Bulk create rooms
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rooms } = req.body;

      if (!Array.isArray(rooms)) {
        res.status(400).json({
          success: false,
          error: 'rooms must be an array',
        });
        return;
      }

      const result = await roomTwinService.bulkCreate(rooms);

      res.json({
        success: true,
        data: result,
        message: `Bulk create completed: ${result.created} created, ${result.failed} failed`,
      });
    } catch (error) {
      logger.error('Error bulk creating rooms:', error);
      next(error);
    }
  }
}

export const roomTwinController = new RoomTwinController();
