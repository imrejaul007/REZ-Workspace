import { Router, Request, Response } from 'express';
import { GuestMemoryService } from '../services';
import {
  CreateGuestTwinRequestSchema,
  UpdatePreferencesRequestSchema,
  CreateRoomTwinRequestSchema,
  CreatePropertyTwinRequestSchema,
} from '../validators';
import { asyncHandler, ApiError } from '../middleware';
import { logger } from '../utils';

export function createTwinsRouter(guestMemoryService: GuestMemoryService): Router {
  const router = Router();

  // POST /api/twins/guest - Create guest twin
  router.post(
    '/guest',
    asyncHandler(async (req: Request, res: Response) => {
      const validatedData = CreateGuestTwinRequestSchema.parse(req.body);

      const result = await guestMemoryService.createGuestTwin({
        ...validatedData,
        sync_to_twinos: validatedData.sync_to_twinos,
      });

      logger.info(`Guest Twin created: ${result.guest_id}`);

      res.status(201).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // GET /api/twins/guest/:id - Get guest twin
  router.get(
    '/guest/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;

      const guestTwin = await guestMemoryService.getGuestTwin(id);

      if (!guestTwin) {
        const error: ApiError = new Error(`Guest Twin not found: ${id}`) as ApiError;
        error.statusCode = 404;
        error.code = 'TWIN_NOT_FOUND';
        throw error;
      }

      res.json({
        success: true,
        data: guestTwin,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // PUT /api/twins/guest/:id/preferences - Update preferences
  router.put(
    '/guest/:id/preferences',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const validatedData = UpdatePreferencesRequestSchema.parse(req.body);

      // Check if guest exists
      const guestTwin = await guestMemoryService.getGuestTwin(id);
      if (!guestTwin) {
        const error: ApiError = new Error(`Guest Twin not found: ${id}`) as ApiError;
        error.statusCode = 404;
        error.code = 'TWIN_NOT_FOUND';
        throw error;
      }

      const result = await guestMemoryService.updatePreferences({
        guest_id: id,
        preferences: validatedData.preferences,
        sync_to_twinos: validatedData.sync_to_twinos,
      });

      logger.info(`Preferences updated for Guest Twin: ${id}`);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // GET /api/twins/guest - List all guest twins
  router.get(
    '/guest',
    asyncHandler(async (req: Request, res: Response) => {
      const guests = guestMemoryService.getAllGuestTwins();

      res.json({
        success: true,
        data: guests,
        count: guests.length,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // POST /api/twins/room - Create room twin
  router.post(
    '/room',
    asyncHandler(async (req: Request, res: Response) => {
      const validatedData = CreateRoomTwinRequestSchema.parse(req.body);

      const result = await guestMemoryService.createRoomTwin({
        ...validatedData,
        sync_to_twinos: validatedData.sync_to_twinos,
      });

      logger.info(`Room Twin created: ${result.room_id}`);

      res.status(201).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // GET /api/twins/room/:id/status - Get room status
  router.get(
    '/room/:id/status',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;

      const roomStatus = await guestMemoryService.getRoomStatus(id);

      if (!roomStatus) {
        const error: ApiError = new Error(`Room Twin not found: ${id}`) as ApiError;
        error.statusCode = 404;
        error.code = 'TWIN_NOT_FOUND';
        throw error;
      }

      res.json({
        success: true,
        data: roomStatus,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // GET /api/twins/room/:id - Get room twin
  router.get(
    '/room/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const rooms = guestMemoryService.getAllRoomTwins();
      const room = rooms.find((r) => r.room_id === id);

      if (!room) {
        const error: ApiError = new Error(`Room Twin not found: ${id}`) as ApiError;
        error.statusCode = 404;
        error.code = 'TWIN_NOT_FOUND';
        throw error;
      }

      res.json({
        success: true,
        data: room,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // GET /api/twins/room - List all room twins
  router.get(
    '/room',
    asyncHandler(async (req: Request, res: Response) => {
      const rooms = guestMemoryService.getAllRoomTwins();

      res.json({
        success: true,
        data: rooms,
        count: rooms.length,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // POST /api/twins/property - Create property twin
  router.post(
    '/property',
    asyncHandler(async (req: Request, res: Response) => {
      const validatedData = CreatePropertyTwinRequestSchema.parse(req.body);

      const result = await guestMemoryService.createPropertyTwin({
        ...validatedData,
        sync_to_twinos: validatedData.sync_to_twinos,
      });

      logger.info(`Property Twin created: ${result.property_id}`);

      res.status(201).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // GET /api/twins/property/:id - Get property twin
  router.get(
    '/property/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const properties = guestMemoryService.getAllPropertyTwins();
      const property = properties.find((p) => p.property_id === id);

      if (!property) {
        const error: ApiError = new Error(`Property Twin not found: ${id}`) as ApiError;
        error.statusCode = 404;
        error.code = 'TWIN_NOT_FOUND';
        throw error;
      }

      res.json({
        success: true,
        data: property,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // GET /api/twins/property - List all property twins
  router.get(
    '/property',
    asyncHandler(async (req: Request, res: Response) => {
      const properties = guestMemoryService.getAllPropertyTwins();

      res.json({
        success: true,
        data: properties,
        count: properties.length,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // GET /api/twins/sync-status - Get TwinOS sync status
  router.get(
    '/sync-status',
    asyncHandler(async (req: Request, res: Response) => {
      const isEnabled = guestMemoryService.isTwinOSEnabledCheck();

      res.json({
        success: true,
        data: {
          twinos_sync_enabled: isEnabled,
          message: isEnabled
            ? 'TwinOS Hub synchronization is enabled'
            : 'TwinOS Hub synchronization is disabled',
        },
        timestamp: new Date().toISOString(),
      });
    })
  );

  return router;
}