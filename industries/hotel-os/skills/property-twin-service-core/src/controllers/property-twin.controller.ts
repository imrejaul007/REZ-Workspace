import { Request, Response, NextFunction } from 'express';
import { propertyTwinService } from '../services/property-twin.service';
import {
  validateCreatePropertyTwin,
  validateUpdateVenue,
  validateUpdateRevenue,
  CreatePropertyTwinRequest,
  UpdateVenueRequest,
  UpdateRevenueRequest
} from '../schemas/property-twin.schema';

export class PropertyTwinController {
  /**
   * POST /api/twins/property
   * Create a new Property Twin
   */
  async createPropertyTwin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const valid = validateCreatePropertyTwin(req.body);
      if (!valid) {
        res.status(400).json({
          error: 'Validation Error',
          details: validateCreatePropertyTwin.errors
        });
        return;
      }

      const request: CreatePropertyTwinRequest = req.body;
      const result = await propertyTwinService.createPropertyTwin(request);

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
   * GET /api/twins/property/:id
   * Get Property Twin by ID
   */
  async getPropertyTwin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await propertyTwinService.getPropertyTwin(id);

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
   * POST /api/twins/property/:id/venues
   * Add venue to property
   */
  async addVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const venue = req.body;

      if (!venue.venueId || !venue.name || !venue.type) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'venueId, name, and type are required'
        });
        return;
      }

      const result = await propertyTwinService.addVenue(id, venue);

      res.status(201).json({
        success: true,
        message: 'Venue added',
        venueId: venue.venueId
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not Found',
          message: error.message
        });
        return;
      }
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
   * PUT /api/twins/property/:id/venues
   * Update venue
   */
  async updateVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const valid = validateUpdateVenue(req.body);
      if (!valid) {
        res.status(400).json({
          error: 'Validation Error',
          details: validateUpdateVenue.errors
        });
        return;
      }

      const request: UpdateVenueRequest = req.body;
      const result = await propertyTwinService.updateVenue(id, request);

      res.json({
        success: true,
        message: 'Venue updated',
        venueId: request.venueId
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
   * PUT /api/twins/property/:id/revenue
   * Update revenue
   */
  async updateRevenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const valid = validateUpdateRevenue(req.body);
      if (!valid) {
        res.status(400).json({
          error: 'Validation Error',
          details: validateUpdateRevenue.errors
        });
        return;
      }

      const request: UpdateRevenueRequest = req.body;
      await propertyTwinService.updateRevenue(id, request);

      res.json({ success: true, message: 'Revenue updated' });
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
   * PUT /api/twins/property/:id/inventory
   * Update inventory
   */
  async updateInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const inventory = req.body;

      await propertyTwinService.updateInventory(id, inventory);

      res.json({ success: true, message: 'Inventory updated' });
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
   * PUT /api/twins/property/:id/staff
   * Update staff
   */
  async updateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const staff = req.body;

      await propertyTwinService.updateStaff(id, staff);

      res.json({ success: true, message: 'Staff updated' });
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
   * PUT /api/twins/property/:id/settings
   * Update settings
   */
  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const settings = req.body;

      await propertyTwinService.updateSettings(id, settings);

      res.json({ success: true, message: 'Settings updated' });
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
   * GET /api/twins/property/:id/performance
   * Get performance summary
   */
  async getPerformanceSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await propertyTwinService.getPerformanceSummary(id);

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
   * DELETE /api/twins/property/:id
   * Delete Property Twin
   */
  async deletePropertyTwin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await propertyTwinService.deletePropertyTwin(id);

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
export const propertyTwinController = new PropertyTwinController();
