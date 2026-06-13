import { Request, Response } from 'express';
import { restaurantTwinService } from '../services/restaurant-twin.service';
import { logger } from '../utils/logger';
import {
  CreateRestaurantTwinRequest,
  UpdateRestaurantStatusRequest,
  UpdateMetricsRequest,
  UpdateOperatingHoursRequest,
  UpdateFeaturesRequest,
  ListRestaurantsRequest,
  RestaurantStatus,
  CuisineType
} from '../schemas/restaurant-twin.schema';

export class RestaurantTwinController {
  /**
   * Create a new Restaurant Twin
   * POST /api/twins/restaurant
   */
  async createRestaurantTwin(req: Request, res: Response): Promise<void> {
    try {
      const request: CreateRestaurantTwinRequest = req.body;

      // Validate required fields
      if (!request.restaurantId || !request.merchantId || !request.name) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: restaurantId, merchantId, name'
          }
        });
        return;
      }

      if (!request.location || !request.contact) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: location, contact'
          }
        });
        return;
      }

      if (!request.cuisineType || request.cuisineType.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one cuisine type is required'
          }
        });
        return;
      }

      const result = await restaurantTwinService.createRestaurantTwin(request);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error creating Restaurant Twin', { error: (error as Error).message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: (error as Error).message
        }
      });
    }
  }

  /**
   * Get Restaurant Twin by ID
   * GET /api/twins/restaurant/:restaurantId
   */
  async getRestaurantTwin(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;

      if (!restaurantId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'restaurantId is required'
          }
        });
        return;
      }

      const result = await restaurantTwinService.getRestaurantTwin(restaurantId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error fetching Restaurant Twin', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * Update Restaurant Status
   * PUT /api/twins/restaurant/:restaurantId/status
   */
  async updateRestaurantStatus(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;
      const request: UpdateRestaurantStatusRequest = req.body;

      if (!restaurantId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'restaurantId is required'
          }
        });
        return;
      }

      if (!request.status) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'status is required'
          }
        });
        return;
      }

      const validStatuses = Object.values(RestaurantStatus);
      if (!validStatuses.includes(request.status)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
          }
        });
        return;
      }

      const result = await restaurantTwinService.updateRestaurantStatus(restaurantId, request);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error updating Restaurant Twin status', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * Update Restaurant Metrics
   * PUT /api/twins/restaurant/:restaurantId/metrics
   */
  async updateMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;
      const request: UpdateMetricsRequest = req.body;

      if (!restaurantId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'restaurantId is required'
          }
        });
        return;
      }

      const result = await restaurantTwinService.updateMetrics(restaurantId, request);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error updating Restaurant Twin metrics', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * Update Operating Hours
   * PUT /api/twins/restaurant/:restaurantId/hours
   */
  async updateOperatingHours(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;
      const request: UpdateOperatingHoursRequest = req.body;

      if (!restaurantId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'restaurantId is required'
          }
        });
        return;
      }

      if (!request.operatingHours || !Array.isArray(request.operatingHours)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'operatingHours array is required'
          }
        });
        return;
      }

      const result = await restaurantTwinService.updateOperatingHours(restaurantId, request);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error updating Restaurant Twin operating hours', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * Update Restaurant Features
   * PUT /api/twins/restaurant/:restaurantId/features
   */
  async updateFeatures(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;
      const request: UpdateFeaturesRequest = req.body;

      if (!restaurantId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'restaurantId is required'
          }
        });
        return;
      }

      if (!request.features || typeof request.features !== 'object') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'features object is required'
          }
        });
        return;
      }

      const result = await restaurantTwinService.updateFeatures(restaurantId, request);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error updating Restaurant Twin features', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }

  /**
   * List Restaurant Twins
   * GET /api/twins/restaurant
   */
  async listRestaurants(req: Request, res: Response): Promise<void> {
    try {
      const request: ListRestaurantsRequest = {
        merchantId: req.query.merchantId as string,
        status: req.query.status as RestaurantStatus,
        cuisineType: req.query.cuisineType as CuisineType,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const result = await restaurantTwinService.listRestaurants(request);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error listing Restaurant Twins', { error: (error as Error).message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: (error as Error).message
        }
      });
    }
  }

  /**
   * Delete Restaurant Twin
   * DELETE /api/twins/restaurant/:restaurantId
   */
  async deleteRestaurantTwin(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;

      if (!restaurantId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'restaurantId is required'
          }
        });
        return;
      }

      await restaurantTwinService.deleteRestaurantTwin(restaurantId);

      res.status(200).json({
        success: true,
        message: 'Restaurant Twin deleted successfully'
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message
          }
        });
        return;
      }
      logger.error('Error deleting Restaurant Twin', { error: message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    }
  }
}

export const restaurantTwinController = new RestaurantTwinController();
