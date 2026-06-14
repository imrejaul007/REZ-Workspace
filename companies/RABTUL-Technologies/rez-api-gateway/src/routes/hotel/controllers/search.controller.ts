/**
 * Search Controller
 * Handles hotel search, property details, and availability endpoints
 */

import { Request, Response } from 'express';
import { searchSchema } from '../validators/makcorps.validators';
import { makcorpsService } from '../services/makcorps.service';
import { logger } from '../../../config/logger';

export class SearchController {
  /**
   * Search hotels
   * GET /api/hotels/search
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const result = searchSchema.safeParse(req.query);
      if (!result.success) {
        res.status(400).json({ success: false, message: 'Invalid search parameters' });
        return;
      }

      const { city, checkIn, checkOut, guests, minRating, maxPrice } = result.data;
      const properties = await makcorpsService.searchProperties({
        city,
        checkIn,
        checkOut,
        guests,
        minRating,
        maxPrice,
      });

      logger.info('[Makcorps] Hotel search', {
        city,
        checkIn,
        checkOut,
        guests,
        results: properties.length,
      });

      res.json({ success: true, data: properties });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('[Makcorps] Search failed', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get property details
   * GET /api/hotels/:propertyId
   */
  async getProperty(req: Request, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      const property = await makcorpsService.getProperty(propertyId);

      if (!property) {
        res.status(404).json({ success: false, message: 'Property not found' });
        return;
      }

      res.json({ success: true, data: property });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('[Makcorps] Get property failed', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get room availability for a property
   * GET /api/hotels/:propertyId/availability
   */
  async getAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      const { checkIn, checkOut } = req.query;

      const property = await makcorpsService.getProperty(propertyId);
      if (!property) {
        res.status(404).json({ success: false, message: 'Property not found' });
        return;
      }

      const availableRooms = await makcorpsService.getAvailableRooms(propertyId);

      logger.info('[Makcorps] Room availability', {
        propertyId,
        checkIn,
        checkOut,
        available: availableRooms.length,
      });

      res.json({ success: true, data: availableRooms });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('[Makcorps] Availability check failed', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const searchController = new SearchController();
