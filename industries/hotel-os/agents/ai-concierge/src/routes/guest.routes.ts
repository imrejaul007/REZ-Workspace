/**
 * AI Concierge Agent - Guest Twin Routes
 * API endpoints for Guest Twin operations
 */

import { Router, Request, Response } from 'express';
import { GuestTwinService } from '../services';
import { asyncHandler } from '../utils';
import { CreateGuestTwinInput, UpdateGuestPreferencesInput } from '../schemas';

export const createGuestTwinRoutes = (guestTwinService: GuestTwinService) => {
  const router = Router();

  /**
   * POST /api/twins/guest
   * Create a new Guest Twin
   */
  router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const input: CreateGuestTwinInput = req.body;
      const result = await guestTwinService.createGuestTwin(input);
      res.status(201).json(result);
    })
  );

  /**
   * GET /api/twins/guest
   * Get all Guest Twins
   */
  router.get(
    '/',
    asyncHandler(async (_req: Request, res: Response) => {
      const result = await guestTwinService.getAllGuestTwins();
      res.json(result);
    })
  );

  /**
   * GET /api/twins/guest/:id
   * Get a Guest Twin by ID
   */
  router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const result = await guestTwinService.getGuestTwin(id);
      res.json(result);
    })
  );

  /**
   * PUT /api/twins/guest/:id/preferences
   * Update guest preferences
   */
  router.put(
    '/:id/preferences',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const input: UpdateGuestPreferencesInput = req.body;
      const result = await guestTwinService.updatePreferences(id, input);
      res.json(result);
    })
  );

  /**
   * PATCH /api/twins/guest/:id/preferences
   * Partially update guest preferences
   */
  router.patch(
    '/:id/preferences',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const input: UpdateGuestPreferencesInput = req.body;
      const result = await guestTwinService.updatePreferences(id, input);
      res.json(result);
    })
  );

  /**
   * PUT /api/twins/guest/:id/stay
   * Update current stay information
   */
  router.put(
    '/:id/stay',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const stay = req.body;
      const result = await guestTwinService.updateCurrentStay(id, stay);
      res.json(result);
    })
  );

  /**
   * PUT /api/twins/guest/:id/sentiment
   * Update sentiment score
   */
  router.put(
    '/:id/sentiment',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const { score, trend, key_topics } = req.body;
      const result = await guestTwinService.updateSentiment(id, score, trend, key_topics);
      res.json(result);
    })
  );

  /**
   * DELETE /api/twins/guest/:id
   * Delete a Guest Twin
   */
  router.delete(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const result = await guestTwinService.deleteGuestTwin(id);
      res.json(result);
    })
  );

  return router;
};