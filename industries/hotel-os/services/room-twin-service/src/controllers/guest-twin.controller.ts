import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { guestTwinService } from '../services/guest-twin.service';
import {
  CreateGuestTwinSchema,
  UpdateGuestPreferencesSchema,
  createSuccessResponse,
  createErrorResponse
} from '../schemas';
import { logger } from '../utils/logger';

export class GuestTwinController {
  /**
   * POST /api/twins/guest - Create a new guest twin
   */
  async createGuestTwin(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();

    try {
      const validationResult = CreateGuestTwinSchema.safeParse(req.body);

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

      const guestTwin = await guestTwinService.createGuestTwin(validationResult.data);

      logger.info('Guest twin created via API', {
        requestId,
        guestId: guestTwin.guestId
      });

      res.status(201).json(createSuccessResponse(guestTwin, requestId));
    } catch (error) {
      logger.error('Error creating guest twin', {
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
          'Failed to create guest twin',
          undefined,
          requestId
        )
      );
    }
  }

  /**
   * GET /api/twins/guest/:id - Get guest twin by ID
   */
  async getGuestTwin(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;

    try {
      const guestTwin = await guestTwinService.getGuestTwin(id);

      if (!guestTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Guest twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(guestTwin, requestId));
    } catch (error) {
      logger.error('Error fetching guest twin', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch guest twin', undefined, requestId)
      );
    }
  }

  /**
   * GET /api/twins/guest/:id/full - Get guest twin with memory data
   */
  async getGuestTwinWithMemory(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;

    try {
      const result = await guestTwinService.getGuestTwinWithMemory(id);

      if (!result.guestTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Guest twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(result, requestId));
    } catch (error) {
      logger.error('Error fetching guest twin with memory', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch guest twin', undefined, requestId)
      );
    }
  }

  /**
   * PUT /api/twins/guest/:id/preferences - Update guest preferences
   */
  async updateGuestPreferences(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;

    try {
      const validationResult = UpdateGuestPreferencesSchema.safeParse(req.body);

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

      const guestTwin = await guestTwinService.updateGuestPreferences(id, validationResult.data);

      if (!guestTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Guest twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      logger.info('Guest preferences updated via API', {
        requestId,
        guestId: id
      });

      res.json(createSuccessResponse(guestTwin, requestId));
    } catch (error) {
      logger.error('Error updating guest preferences', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to update guest preferences', undefined, requestId)
      );
    }
  }

  /**
   * POST /api/twins/guest/:id/stay - Add stay to guest history
   */
  async addStayHistory(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;
    const { reservationId, propertyId, roomId, checkIn, checkOut, totalSpend } = req.body;

    try {
      if (!reservationId || !propertyId || !roomId || !checkIn || !checkOut) {
        res.status(400).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'reservationId, propertyId, roomId, checkIn, and checkOut are required',
            undefined,
            requestId
          )
        );
        return;
      }

      const guestTwin = await guestTwinService.addStayHistory(id, {
        reservationId,
        propertyId,
        roomId,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        totalSpend
      });

      if (!guestTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Guest twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(guestTwin, requestId));
    } catch (error) {
      logger.error('Error adding stay history', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to add stay history', undefined, requestId)
      );
    }
  }

  /**
   * POST /api/twins/guest/:id/feedback - Add feedback to stay
   */
  async addStayFeedback(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;
    const { reservationId, rating, comment } = req.body;

    try {
      if (!reservationId || !rating) {
        res.status(400).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'reservationId and rating are required',
            undefined,
            requestId
          )
        );
        return;
      }

      if (rating < 1 || rating > 5) {
        res.status(400).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'rating must be between 1 and 5',
            undefined,
            requestId
          )
        );
        return;
      }

      const guestTwin = await guestTwinService.addStayFeedback(id, reservationId, { rating, comment });

      if (!guestTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Guest twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(guestTwin, requestId));
    } catch (error) {
      logger.error('Error adding stay feedback', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to add stay feedback', undefined, requestId)
      );
    }
  }

  /**
   * GET /api/twins/guest/:id/loyalty - Get guest loyalty info
   */
  async getGuestLoyalty(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;

    try {
      const loyalty = await guestTwinService.getGuestLoyalty(id);

      if (!loyalty) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Guest twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(loyalty, requestId));
    } catch (error) {
      logger.error('Error fetching guest loyalty', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch guest loyalty', undefined, requestId)
      );
    }
  }

  /**
   * GET /api/twins/guest/:id/room-preferences - Get room preferences for setup
   */
  async getRoomPreferences(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;

    try {
      const preferences = await guestTwinService.getRoomPreferences(id);

      if (!preferences) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Guest twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(preferences, requestId));
    } catch (error) {
      logger.error('Error fetching room preferences', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch room preferences', undefined, requestId)
      );
    }
  }

  /**
   * GET /api/twins/guest/top/loyalty - Get top loyalty guests
   */
  async getTopLoyaltyGuests(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const limit = parseInt(req.query.limit as string) || 10;

    try {
      const guests = await guestTwinService.getTopLoyaltyGuests(limit);
      res.json(createSuccessResponse(guests, requestId));
    } catch (error) {
      logger.error('Error fetching top loyalty guests', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch top loyalty guests', undefined, requestId)
      );
    }
  }

  /**
   * GET /api/twins/guest/sentiment/:minScore/:maxScore - Get guests by sentiment
   */
  async getGuestsBySentiment(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const minScore = parseFloat(req.params.minScore);
    const maxScore = parseFloat(req.params.maxScore);

    try {
      if (isNaN(minScore) || isNaN(maxScore)) {
        res.status(400).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'minScore and maxScore must be valid numbers',
            undefined,
            requestId
          )
        );
        return;
      }

      const guests = await guestTwinService.getGuestsBySentiment(minScore, maxScore);
      res.json(createSuccessResponse(guests, requestId));
    } catch (error) {
      logger.error('Error fetching guests by sentiment', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch guests by sentiment', undefined, requestId)
      );
    }
  }
}

export const guestTwinController = new GuestTwinController();
