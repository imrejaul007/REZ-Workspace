import { Router, Request, Response, NextFunction } from 'express';
import { twinService } from '../services';
import {
  validateCreateGuestTwin,
  validateUpdatePreferences,
  validateCreateRoomTwin,
  validateUpdateRoomStatus,
  validateCreatePropertyTwin,
} from '../schemas/twin.schemas';
import { logger } from '../utils/logger';

const router = Router();

// Validation middleware helper
const validate = (validator: (data: unknown) => boolean) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const valid = validator(req.body);
    if (!valid) {
      const errors = (validator as any).errors;
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
      return;
    }
    next();
  };
};

// ============ GUEST TWIN ROUTES ============

/**
 * POST /api/twins/guest
 * Create a new guest twin
 */
router.post(
  '/guest',
  validate(validateCreateGuestTwin),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guestTwin = await twinService.createGuestTwin(req.body);
      res.status(201).json({
        success: true,
        data: guestTwin,
        message: 'Guest twin created successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }
);

/**
 * GET /api/twins/guest/:id
 * Get guest twin by ID
 */
router.get(
  '/guest/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guestTwin = await twinService.getGuestTwin(req.params.id);
      if (!guestTwin) {
        res.status(404).json({
          success: false,
          error: 'Guest twin not found',
        });
        return;
      }
      res.json({
        success: true,
        data: guestTwin,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/twins/guest/:id/preferences
 * Update guest preferences
 */
router.put(
  '/guest/:id/preferences',
  validate(validateUpdatePreferences),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guestTwin = await twinService.updateGuestPreferences(req.params.id, req.body);
      if (!guestTwin) {
        res.status(404).json({
          success: false,
          error: 'Guest twin not found',
        });
        return;
      }
      res.json({
        success: true,
        data: guestTwin,
        message: 'Preferences updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============ ROOM TWIN ROUTES ============

/**
 * POST /api/twins/room
 * Create a new room twin
 */
router.post(
  '/room',
  validate(validateCreateRoomTwin),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomTwin = await twinService.createRoomTwin(req.body);
      res.status(201).json({
        success: true,
        data: roomTwin,
        message: 'Room twin created successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }
);

/**
 * GET /api/twins/room/:id/status
 * Get room status
 */
router.get(
  '/room/:id/status',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await twinService.getRoomStatus(req.params.id);
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
      next(error);
    }
  }
);

/**
 * PUT /api/twins/room/:id/status
 * Update room status
 */
router.put(
  '/room/:id/status',
  validate(validateUpdateRoomStatus),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomTwin = await twinService.updateRoomStatus(req.params.id, req.body);
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
      next(error);
    }
  }
);

// ============ PROPERTY TWIN ROUTES ============

/**
 * POST /api/twins/property
 * Create a new property twin
 */
router.post(
  '/property',
  validate(validateCreatePropertyTwin),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const propertyTwin = await twinService.createPropertyTwin(req.body);
      res.status(201).json({
        success: true,
        data: propertyTwin,
        message: 'Property twin created successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }
);

/**
 * GET /api/twins/property/:id
 * Get property twin by ID
 */
router.get(
  '/property/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const propertyTwin = await twinService.getPropertyTwin(req.params.id);
      if (!propertyTwin) {
        res.status(404).json({
          success: false,
          error: 'Property twin not found',
        });
        return;
      }
      res.json({
        success: true,
        data: propertyTwin,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
