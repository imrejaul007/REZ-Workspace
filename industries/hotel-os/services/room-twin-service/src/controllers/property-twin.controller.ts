import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { propertyTwinService } from '../services/property-twin.service';
import {
  CreatePropertyTwinSchema,
  createSuccessResponse,
  createErrorResponse
} from '../schemas';
import { logger } from '../utils/logger';

export class PropertyTwinController {
  /**
   * POST /api/twins/property - Create a new property twin
   */
  async createPropertyTwin(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();

    try {
      const validationResult = CreatePropertyTwinSchema.safeParse(req.body);

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

      const propertyTwin = await propertyTwinService.createPropertyTwin(validationResult.data);

      logger.info('Property twin created via API', {
        requestId,
        propertyId: propertyTwin.propertyId
      });

      res.status(201).json(createSuccessResponse(propertyTwin, requestId));
    } catch (error) {
      logger.error('Error creating property twin', {
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
          'Failed to create property twin',
          undefined,
          requestId
        )
      );
    }
  }

  /**
   * GET /api/twins/property/:id - Get property twin by ID
   */
  async getPropertyTwin(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;

    try {
      const propertyTwin = await propertyTwinService.getPropertyTwin(id);

      if (!propertyTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Property twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(propertyTwin, requestId));
    } catch (error) {
      logger.error('Error fetching property twin', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch property twin', undefined, requestId)
      );
    }
  }

  /**
   * PUT /api/twins/property/:id - Update property twin
   */
  async updatePropertyTwin(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;

    try {
      const propertyTwin = await propertyTwinService.updatePropertyTwin(id, req.body);

      if (!propertyTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Property twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      logger.info('Property twin updated via API', {
        requestId,
        propertyId: id
      });

      res.json(createSuccessResponse(propertyTwin, requestId));
    } catch (error) {
      logger.error('Error updating property twin', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to update property twin', undefined, requestId)
      );
    }
  }

  /**
   * POST /api/twins/property/:id/venue - Add venue to property
   */
  async addVenue(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;
    const venue = req.body;

    try {
      if (!venue.venueId || !venue.name || !venue.type) {
        res.status(400).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'venueId, name, and type are required',
            undefined,
            requestId
          )
        );
        return;
      }

      const propertyTwin = await propertyTwinService.addVenue(id, venue);

      if (!propertyTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Property twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(propertyTwin, requestId));
    } catch (error) {
      logger.error('Error adding venue', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to add venue', undefined, requestId)
      );
    }
  }

  /**
   * PUT /api/twins/property/:id/venue/:venueId - Update venue
   */
  async updateVenue(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id, venueId } = req.params;

    try {
      const propertyTwin = await propertyTwinService.updateVenue(id, venueId, req.body);

      if (!propertyTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Property or venue not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(propertyTwin, requestId));
    } catch (error) {
      logger.error('Error updating venue', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to update venue', undefined, requestId)
      );
    }
  }

  /**
   * DELETE /api/twins/property/:id/venue/:venueId - Remove venue
   */
  async removeVenue(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id, venueId } = req.params;

    try {
      const propertyTwin = await propertyTwinService.removeVenue(id, venueId);

      if (!propertyTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Property or venue not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(propertyTwin, requestId));
    } catch (error) {
      logger.error('Error removing venue', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to remove venue', undefined, requestId)
      );
    }
  }

  /**
   * POST /api/twins/property/:id/revenue-center - Add revenue center
   */
  async addRevenueCenter(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;
    const center = req.body;

    try {
      if (!center.centerId || !center.name || !center.type) {
        res.status(400).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'centerId, name, and type are required',
            undefined,
            requestId
          )
        );
        return;
      }

      const propertyTwin = await propertyTwinService.addRevenueCenter(id, center);

      if (!propertyTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Property twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(propertyTwin, requestId));
    } catch (error) {
      logger.error('Error adding revenue center', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to add revenue center', undefined, requestId)
      );
    }
  }

  /**
   * PUT /api/twins/property/:id/stats - Update property statistics
   */
  async updateStats(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;
    const stats = req.body;

    try {
      const propertyTwin = await propertyTwinService.updateStats(id, stats);

      if (!propertyTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Property twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(propertyTwin, requestId));
    } catch (error) {
      logger.error('Error updating property stats', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to update property stats', undefined, requestId)
      );
    }
  }

  /**
   * PUT /api/twins/property/:id/policies - Update property policies
   */
  async updatePolicies(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;
    const policies = req.body;

    try {
      const propertyTwin = await propertyTwinService.updatePolicies(id, policies);

      if (!propertyTwin) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Property twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(propertyTwin, requestId));
    } catch (error) {
      logger.error('Error updating property policies', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to update property policies', undefined, requestId)
      );
    }
  }

  /**
   * GET /api/twins/property/:id/summary - Get property summary
   */
  async getPropertySummary(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;

    try {
      const summary = await propertyTwinService.getPropertySummary(id);

      if (!summary) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Property twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(summary, requestId));
    } catch (error) {
      logger.error('Error fetching property summary', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch property summary', undefined, requestId)
      );
    }
  }

  /**
   * GET /api/twins/property/:id/revenue - Get total revenue
   */
  async getTotalRevenue(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { id } = req.params;

    try {
      const revenue = await propertyTwinService.getTotalRevenue(id);

      if (!revenue) {
        res.status(404).json(
          createErrorResponse('NOT_FOUND', `Property twin with ID ${id} not found`, undefined, requestId)
        );
        return;
      }

      res.json(createSuccessResponse(revenue, requestId));
    } catch (error) {
      logger.error('Error fetching total revenue', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch total revenue', undefined, requestId)
      );
    }
  }

  /**
   * GET /api/twins/property/brand/:brand - Get properties by brand
   */
  async getPropertiesByBrand(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { brand } = req.params;

    try {
      const properties = await propertyTwinService.getPropertiesByBrand(brand);
      res.json(createSuccessResponse(properties, requestId));
    } catch (error) {
      logger.error('Error fetching properties by brand', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch properties', undefined, requestId)
      );
    }
  }

  /**
   * GET /api/twins/property/city/:city - Get properties by city
   */
  async getPropertiesByCity(req: Request, res: Response): Promise<void> {
    const requestId = uuidv4();
    const { city } = req.params;

    try {
      const properties = await propertyTwinService.getPropertiesByCity(city);
      res.json(createSuccessResponse(properties, requestId));
    } catch (error) {
      logger.error('Error fetching properties by city', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch properties', undefined, requestId)
      );
    }
  }
}

export const propertyTwinController = new PropertyTwinController();
