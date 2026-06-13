import { Request, Response, NextFunction } from 'express';
import { propertyTwinService } from '../services';
import { logger } from '../utils/logger';

export class PropertyTwinController {
  /**
   * POST /api/twins/property - Create property twin
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const propertyTwin = await propertyTwinService.create(req.body);
      res.status(201).json({
        success: true,
        data: propertyTwin,
        message: 'Property twin created successfully',
      });
    } catch (error) {
      logger.error('Error creating property twin:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/property/:id - Get property twin by propertyId
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const propertyTwin = await propertyTwinService.getById(id);

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
      logger.error('Error getting property twin:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/property/twin/:twinId - Get property twin by twinId
   */
  async getByTwinId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { twinId } = req.params;
      const propertyTwin = await propertyTwinService.getByTwinId(twinId);

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
      logger.error('Error getting property twin by twinId:', error);
      next(error);
    }
  }

  /**
   * PUT /api/twins/property/:id - Update property twin
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const propertyTwin = await propertyTwinService.update(id, req.body);

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
        message: 'Property twin updated successfully',
      });
    } catch (error) {
      logger.error('Error updating property twin:', error);
      next(error);
    }
  }

  /**
   * PATCH /api/twins/property/:id/status - Update listing status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'pending', 'under_contract', 'sold', 'off_market'].includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status value',
        });
        return;
      }

      const propertyTwin = await propertyTwinService.updateListingStatus(id, status);

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
        message: 'Listing status updated successfully',
      });
    } catch (error) {
      logger.error('Error updating listing status:', error);
      next(error);
    }
  }

  /**
   * PATCH /api/twins/property/:id/price - Update property price
   */
  async updatePrice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { price } = req.body;

      if (!price || typeof price !== 'number' || price <= 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid price value',
        });
        return;
      }

      const propertyTwin = await propertyTwinService.updatePrice(id, price);

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
        message: 'Price updated successfully',
      });
    } catch (error) {
      logger.error('Error updating price:', error);
      next(error);
    }
  }

  /**
   * POST /api/twins/property/:id/media - Add media
   */
  async addMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { type, urls } = req.body;

      if (!['photos', 'videos', 'documents'].includes(type) || !Array.isArray(urls)) {
        res.status(400).json({
          success: false,
          error: 'Invalid media type or urls',
        });
        return;
      }

      const propertyTwin = await propertyTwinService.addMedia(id, type, urls);

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
        message: 'Media added successfully',
      });
    } catch (error) {
      logger.error('Error adding media:', error);
      next(error);
    }
  }

  /**
   * POST /api/twins/property/:id/tour - Add 3D tour URL
   */
  async addTour(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { tourUrl } = req.body;

      if (!tourUrl) {
        res.status(400).json({
          success: false,
          error: 'Tour URL is required',
        });
        return;
      }

      const propertyTwin = await propertyTwinService.addThreeDTour(id, tourUrl);

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
        message: '3D tour added successfully',
      });
    } catch (error) {
      logger.error('Error adding 3D tour:', error);
      next(error);
    }
  }

  /**
   * POST /api/twins/property/:id/floorplan - Add floor plan URL
   */
  async addFloorPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { floorPlanUrl } = req.body;

      if (!floorPlanUrl) {
        res.status(400).json({
          success: false,
          error: 'Floor plan URL is required',
        });
        return;
      }

      const propertyTwin = await propertyTwinService.addFloorPlan(id, floorPlanUrl);

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
        message: 'Floor plan added successfully',
      });
    } catch (error) {
      logger.error('Error adding floor plan:', error);
      next(error);
    }
  }

  /**
   * PATCH /api/twins/property/:id/agent - Update agent assignment
   */
  async updateAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const propertyTwin = await propertyTwinService.updateAgent(id, req.body);

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
        message: 'Agent updated successfully',
      });
    } catch (error) {
      logger.error('Error updating agent:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/property - Query property twins
   */
  async query(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        city,
        state,
        postalCode,
        propertyType,
        status,
        minPrice,
        maxPrice,
        minBedrooms,
        maxBedrooms,
        minBathrooms,
        maxBathrooms,
        minSqft,
        maxSqft,
        areaId,
        neighborhood,
        tags,
        search,
        sortBy,
        sortOrder,
        limit,
        offset,
      } = req.query;

      const filters = {
        city: city as string,
        state: state as string,
        postalCode: postalCode as string,
        propertyType: propertyType as string,
        status: status as string,
        minPrice: minPrice ? parseInt(minPrice as string, 10) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice as string, 10) : undefined,
        minBedrooms: minBedrooms ? parseInt(minBedrooms as string, 10) : undefined,
        maxBedrooms: maxBedrooms ? parseInt(maxBedrooms as string, 10) : undefined,
        minBathrooms: minBathrooms ? parseInt(minBathrooms as string, 10) : undefined,
        maxBathrooms: maxBathrooms ? parseInt(maxBathrooms as string, 10) : undefined,
        minSqft: minSqft ? parseInt(minSqft as string, 10) : undefined,
        maxSqft: maxSqft ? parseInt(maxSqft as string, 10) : undefined,
        areaId: areaId as string,
        neighborhood: neighborhood as string,
        tags: tags ? (tags as string).split(',') : undefined,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      };

      const result = await propertyTwinService.query(filters);

      res.json({
        success: true,
        data: result.properties,
        pagination: {
          total: result.total,
          limit: filters.limit || 20,
          offset: filters.offset || 0,
        },
      });
    } catch (error) {
      logger.error('Error querying property twins:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/property/search - Search property twins
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, limit } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
        return;
      }

      const properties = await propertyTwinService.search(q, limit ? parseInt(limit as string, 10) : 20);

      res.json({
        success: true,
        data: properties,
        count: properties.length,
      });
    } catch (error) {
      logger.error('Error searching property twins:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/property/:id/active - Get active listings only
   */
  async getActiveListings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const properties = await propertyTwinService.getActiveListings();

      res.json({
        success: true,
        data: properties,
        count: properties.length,
      });
    } catch (error) {
      logger.error('Error getting active listings:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/property/:id/area/:areaId - Get properties by area
   */
  async getByArea(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { areaId } = req.params;
      const properties = await propertyTwinService.getByArea(areaId);

      res.json({
        success: true,
        data: properties,
        count: properties.length,
      });
    } catch (error) {
      logger.error('Error getting properties by area:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/property/:id/agent/:agentId - Get properties by agent
   */
  async getByAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { agentId } = req.params;
      const properties = await propertyTwinService.getByAgent(agentId);

      res.json({
        success: true,
        data: properties,
        count: properties.length,
      });
    } catch (error) {
      logger.error('Error getting properties by agent:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/property/:id/recent - Get recent listings
   */
  async getRecentListings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit } = req.query;
      const properties = await propertyTwinService.getRecentListings(
        limit ? parseInt(limit as string, 10) : 10
      );

      res.json({
        success: true,
        data: properties,
        count: properties.length,
      });
    } catch (error) {
      logger.error('Error getting recent listings:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/property/stats/market - Get market statistics
   */
  async getMarketStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { city } = req.query;
      const stats = await propertyTwinService.getMarketStats(city as string | undefined);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting market statistics:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/property/stats/price-per-sqft - Get price per sqft statistics
   */
  async getPricePerSqftStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { city } = req.query;
      const stats = await propertyTwinService.getPricePerSqftStats(city as string | undefined);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting price per sqft statistics:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/property/:id/propflow - Get PropFlow insights
   */
  async getPropflowInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const insights = await propertyTwinService.getPropflowInsights(id);

      if (!insights) {
        res.status(404).json({
          success: false,
          error: 'Property twin not found',
        });
        return;
      }

      res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      logger.error('Error getting PropFlow insights:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/twins/property/:id - Archive property twin
   */
  async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const propertyTwin = await propertyTwinService.archive(id);

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
        message: 'Property twin archived successfully',
      });
    } catch (error) {
      logger.error('Error archiving property twin:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/twins/property/:id/permanent - Permanently delete property twin
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await propertyTwinService.delete(id);

      res.json({
        success: true,
        message: 'Property twin deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting property twin:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }
}

export const propertyTwinController = new PropertyTwinController();
