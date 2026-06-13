import { Request, Response, NextFunction } from 'express';
import { guestTwinService } from '../services/guest-twin.service';
import {
  validateCreateGuestTwin,
  validateUpdatePreferences,
  CreateGuestTwinRequest,
  UpdatePreferencesRequest
} from '../schemas/guest-twin.schema';
import { logger } from '../utils/logger';

export class GuestTwinController {
  /**
   * POST /api/twins/guest
   * Create a new Guest Twin
   */
  async createGuestTwin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const valid = validateCreateGuestTwin(req.body);
      if (!valid) {
        res.status(400).json({
          error: 'Validation Error',
          details: validateCreateGuestTwin.errors
        });
        return;
      }

      const request: CreateGuestTwinRequest = req.body;
      const result = await guestTwinService.createGuestTwin(request);

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
   * GET /api/twins/guest/:id
   * Get Guest Twin by ID
   */
  async getGuestTwin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await guestTwinService.getGuestTwin(id);

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
   * PUT /api/twins/guest/:id/preferences
   * Update Guest Twin preferences
   */
  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const valid = validateUpdatePreferences(req.body);
      if (!valid) {
        res.status(400).json({
          error: 'Validation Error',
          details: validateUpdatePreferences.errors
        });
        return;
      }

      const request: UpdatePreferencesRequest = req.body;
      const result = await guestTwinService.updatePreferences(id, request);

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
   * PUT /api/twins/guest/:id/stay
   * Update Guest Twin current stay
   */
  async updateCurrentStay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const stay = req.body;

      await guestTwinService.updateCurrentStay(id, stay);

      res.json({ success: true, message: 'Current stay updated' });
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
   * PUT /api/twins/guest/:id/sentiment
   * Update Guest Twin sentiment
   */
  async updateSentiment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const sentiment = req.body;

      await guestTwinService.updateSentiment(id, sentiment);

      res.json({ success: true, message: 'Sentiment updated' });
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
   * PUT /api/twins/guest/:id/loyalty
   * Update Guest Twin loyalty
   */
  async updateLoyalty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const loyalty = req.body;

      await guestTwinService.updateLoyalty(id, loyalty);

      res.json({ success: true, message: 'Loyalty updated' });
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
   * GET /api/twins/guest/:id/upsell-eligibility
   * Get upsell eligibility for guest
   */
  async getUpsellEligibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await guestTwinService.getUpsellEligibility(id);

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
   * DELETE /api/twins/guest/:id
   * Delete Guest Twin
   */
  async deleteGuestTwin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await guestTwinService.deleteGuestTwin(id);

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
export const guestTwinController = new GuestTwinController();
