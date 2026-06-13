import { Request, Response, NextFunction } from 'express';
import { twinService } from '../services/twin.service';
import {
  CreateGuestTwinRequestSchema,
  UpdateGuestPreferencesRequestSchema,
  CreateRoomTwinRequestSchema,
  UpdateRoomStatusRequestSchema,
  UpdateHousekeepingRequestSchema,
  CreatePropertyTwinRequestSchema,
} from '../schemas/twin.schemas';
import { ValidationError, AppError } from '../utils/errors';
import logger from '../utils/logger';

export class TwinController {
  // ============================================================================
  // Guest Twin Endpoints
  // ============================================================================

  async createGuestTwin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = CreateGuestTwinRequestSchema.parse(req.body);
      const guestTwin = await twinService.createGuestTwin(validatedData);

      res.status(201).json({
        success: true,
        data: guestTwin,
      });
    } catch (error) {
      next(error);
    }
  }

  async getGuestTwin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const guestTwin = await twinService.getGuestTwin(id);

      res.json({
        success: true,
        data: guestTwin,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateGuestPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = UpdateGuestPreferencesRequestSchema.parse(req.body);
      const guestTwin = await twinService.updateGuestPreferences(id, validatedData);

      res.json({
        success: true,
        data: guestTwin,
      });
    } catch (error) {
      next(error);
    }
  }

  async getGuestsByProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const guests = await twinService.getGuestsByProperty(propertyId);

      res.json({
        success: true,
        data: guests,
        count: guests.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getGuestsByRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roomId } = req.params;
      const guest = await twinService.getGuestsByRoom(roomId);

      res.json({
        success: true,
        data: guest,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // Room Twin Endpoints
  // ============================================================================

  async createRoomTwin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = CreateRoomTwinRequestSchema.parse(req.body);
      const roomTwin = await twinService.createRoomTwin(validatedData);

      res.status(201).json({
        success: true,
        data: roomTwin,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoomTwin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const roomTwin = await twinService.getRoomTwin(id);

      res.json({
        success: true,
        data: roomTwin,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoomTwinStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const status = await twinService.getRoomTwinStatus(id);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRoomTwinStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = UpdateRoomStatusRequestSchema.parse(req.body);
      const roomTwin = await twinService.updateRoomTwinStatus(id, validatedData);

      res.json({
        success: true,
        data: roomTwin,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateHousekeepingState(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = UpdateHousekeepingRequestSchema.parse(req.body);
      const roomTwin = await twinService.updateHousekeepingState(id, validatedData);

      res.json({
        success: true,
        data: roomTwin,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoomsByProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const rooms = await twinService.getRoomsByProperty(propertyId);

      res.json({
        success: true,
        data: rooms,
        count: rooms.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoomsByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId, status } = req.params;
      const rooms = await twinService.getRoomsByStatus(propertyId, status);

      res.json({
        success: true,
        data: rooms,
        count: rooms.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoomsNeedingCleaning(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const rooms = await twinService.getRoomsNeedingCleaning(propertyId);

      res.json({
        success: true,
        data: rooms,
        count: rooms.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // Property Twin Endpoints
  // ============================================================================

  async createPropertyTwin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = CreatePropertyTwinRequestSchema.parse(req.body);
      const propertyTwin = await twinService.createPropertyTwin(validatedData);

      res.status(201).json({
        success: true,
        data: propertyTwin,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPropertyTwin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const propertyTwin = await twinService.getPropertyTwin(id);

      res.json({
        success: true,
        data: propertyTwin,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePropertyRevenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const revenue = req.body;
      const propertyTwin = await twinService.updatePropertyRevenue(id, revenue);

      res.json({
        success: true,
        data: propertyTwin,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const twinController = new TwinController();