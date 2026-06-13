/**
 * AI Concierge Agent - Property Twin Routes
 * API endpoints for Property Twin operations
 */

import { Router, Request, Response } from 'express';
import { PropertyTwinService } from '../services';
import { asyncHandler } from '../utils';
import { CreatePropertyTwinInput } from '../schemas';

export const createPropertyTwinRoutes = (propertyTwinService: PropertyTwinService) => {
  const router = Router();

  /**
   * POST /api/twins/property
   * Create a new Property Twin
   */
  router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const input: CreatePropertyTwinInput = req.body;
      const result = await propertyTwinService.createPropertyTwin(input);
      res.status(201).json(result);
    })
  );

  /**
   * GET /api/twins/property
   * Get all Property Twins
   */
  router.get(
    '/',
    asyncHandler(async (_req: Request, res: Response) => {
      const result = await propertyTwinService.getAllPropertyTwins();
      res.json(result);
    })
  );

  /**
   * GET /api/twins/property/:id
   * Get a Property Twin by ID
   */
  router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const result = await propertyTwinService.getPropertyTwin(id);
      res.json(result);
    })
  );

  /**
   * PUT /api/twins/property/:id/inventory
   * Update property inventory
   */
  router.put(
    '/:id/inventory',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const inventory = req.body;
      const result = await propertyTwinService.updateInventory(id, inventory);
      res.json(result);
    })
  );

  /**
   * PUT /api/twins/property/:id/venue
   * Add or update a venue
   */
  router.put(
    '/:id/venue',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const venue = req.body;
      const result = await propertyTwinService.updateVenue(id, venue);
      res.json(result);
    })
  );

  /**
   * PUT /api/twins/property/:id/revenue
   * Update revenue metrics
   */
  router.put(
    '/:id/revenue',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const revenue = req.body;
      const result = await propertyTwinService.updateRevenue(id, revenue);
      res.json(result);
    })
  );

  /**
   * PUT /api/twins/property/:id/staff
   * Update staff information
   */
  router.put(
    '/:id/staff',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const staff = req.body;
      const result = await propertyTwinService.updateStaff(id, staff);
      res.json(result);
    })
  );

  /**
   * PUT /api/twins/property/:id/services
   * Update services
   */
  router.put(
    '/:id/services',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const services = req.body;
      const result = await propertyTwinService.updateServices(id, services);
      res.json(result);
    })
  );

  /**
   * DELETE /api/twins/property/:id
   * Delete a Property Twin
   */
  router.delete(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const result = await propertyTwinService.deletePropertyTwin(id);
      res.json(result);
    })
  );

  return router;
};