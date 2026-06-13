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
   * GET /api/twins/property/:id - Get property twin
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
   * PUT /api/twins/property/:id/metrics - Update property metrics
   */
  async updateMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const propertyTwin = await propertyTwinService.updateMetrics(id, req.body);

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
        message: 'Property metrics updated successfully',
      });
    } catch (error) {
      logger.error('Error updating property metrics:', error);
      next(error);
    }
  }

  /**
   * POST /api/twins/property/:id/venues - Add venue
   */
  async addVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const propertyTwin = await propertyTwinService.addVenue(id, req.body);

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
        message: 'Venue added successfully',
      });
    } catch (error) {
      logger.error('Error adding venue:', error);
      next(error);
    }
  }

  /**
   * PUT /api/twins/property/:id/venues/:venueId - Update venue
   */
  async updateVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, venueId } = req.params;
      const propertyTwin = await propertyTwinService.updateVenue(id, venueId, req.body);

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
        message: 'Venue updated successfully',
      });
    } catch (error) {
      logger.error('Error updating venue:', error);
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

  /**
   * DELETE /api/twins/property/:id/venues/:venueId - Remove venue
   */
  async removeVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, venueId } = req.params;
      const propertyTwin = await propertyTwinService.removeVenue(id, venueId);

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
        message: 'Venue removed successfully',
      });
    } catch (error) {
      logger.error('Error removing venue:', error);
      next(error);
    }
  }

  /**
   * POST /api/twins/property/:id/amenities - Add amenity
   */
  async addAmenity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const propertyTwin = await propertyTwinService.addAmenity(id, req.body);

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
        message: 'Amenity added successfully',
      });
    } catch (error) {
      logger.error('Error adding amenity:', error);
      next(error);
    }
  }

  /**
   * PUT /api/twins/property/:id/amenities/:amenityId - Update amenity
   */
  async updateAmenity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, amenityId } = req.params;
      const { available } = req.body;

      const propertyTwin = await propertyTwinService.updateAmenityAvailability(id, amenityId, available);

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
        message: 'Amenity updated successfully',
      });
    } catch (error) {
      logger.error('Error updating amenity:', error);
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

  /**
   * POST /api/twins/property/:id/policies - Add policy
   */
  async addPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const propertyTwin = await propertyTwinService.addPolicy(id, req.body);

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
        message: 'Policy added successfully',
      });
    } catch (error) {
      logger.error('Error adding policy:', error);
      next(error);
    }
  }

  /**
   * PUT /api/twins/property/:id/revenue-centers/:centerId - Update revenue center
   */
  async updateRevenueCenter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, centerId } = req.params;
      const propertyTwin = await propertyTwinService.updateRevenueCenter(id, centerId, req.body);

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
        message: 'Revenue center updated successfully',
      });
    } catch (error) {
      logger.error('Error updating revenue center:', error);
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

  /**
   * PUT /api/twins/property/:id/integrations/:serviceName - Update integration status
   */
  async updateIntegration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, serviceName } = req.params;
      const { status, endpoint } = req.body;

      const propertyTwin = await propertyTwinService.updateIntegrationStatus(
        id,
        serviceName,
        status,
        endpoint
      );

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
        message: 'Integration status updated successfully',
      });
    } catch (error) {
      logger.error('Error updating integration:', error);
      next(error);
    }
  }

  /**
   * GET /api/twins/property - Query property twins
   */
  async query(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { city, country, starRating, status, tag, minRooms, maxRooms, limit, offset } = req.query;

      const filters = {
        city: city as string,
        country: country as string,
        starRating: starRating ? parseInt(starRating as string, 10) : undefined,
        status: status as string,
        tag: tag as string,
        minRooms: minRooms ? parseInt(minRooms as string, 10) : undefined,
        maxRooms: maxRooms ? parseInt(maxRooms as string, 10) : undefined,
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
   * GET /api/twins/property/:id/venues - Get active venues
   */
  async getActiveVenues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const venues = await propertyTwinService.getActiveVenues(id);

      res.json({
        success: true,
        data: venues,
        count: venues.length,
      });
    } catch (error) {
      logger.error('Error getting active venues:', error);
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

  /**
   * GET /api/twins/property/:id/amenities - Get available amenities
   */
  async getAvailableAmenities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const amenities = await propertyTwinService.getAvailableAmenities(id);

      res.json({
        success: true,
        data: amenities,
        count: amenities.length,
      });
    } catch (error) {
      logger.error('Error getting available amenities:', error);
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

  /**
   * GET /api/twins/property/:id/policies - Get policies by category
   */
  async getPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { category } = req.query;

      if (category) {
        const policies = await propertyTwinService.getPoliciesByCategory(id, category as 'checkin' | 'checkout' | 'cancellation' | 'pet' | 'smoking' | 'parking' | 'payment' | 'general');
        res.json({
          success: true,
          data: policies,
          count: policies.length,
        });
      } else {
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
          data: propertyTwin.policies,
          count: propertyTwin.policies.length,
        });
      }
    } catch (error) {
      logger.error('Error getting policies:', error);
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

  /**
   * GET /api/twins/property/:id/revpar - Get RevPAR
   */
  async getRevPAR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const revPAR = await propertyTwinService.calculateRevPAR(id);

      res.json({
        success: true,
        data: { propertyId: id, revPAR },
      });
    } catch (error) {
      logger.error('Error getting RevPAR:', error);
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

  /**
   * GET /api/twins/property/:id/capacity - Get total venue capacity
   */
  async getTotalCapacity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const capacity = await propertyTwinService.getTotalVenueCapacity(id);

      res.json({
        success: true,
        data: { propertyId: id, totalVenueCapacity: capacity },
      });
    } catch (error) {
      logger.error('Error getting total capacity:', error);
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

  /**
   * GET /api/twins/property/stats/portfolio - Get portfolio statistics
   */
  async getPortfolioStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await propertyTwinService.getPortfolioStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting portfolio statistics:', error);
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
}

export const propertyTwinController = new PropertyTwinController();
