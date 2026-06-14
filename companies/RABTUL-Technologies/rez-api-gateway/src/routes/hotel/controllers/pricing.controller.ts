/**
 * Pricing Controller
 * Handles pricing calculations
 */

import { Request, Response } from 'express';
import { pricingSchema } from '../validators/makcorps.validators';
import { bookingService } from '../services/booking.service';
import { logger } from '../../../config/logger';

export class PricingController {
  /**
   * Calculate booking price
   * POST /api/hotels/pricing/calculate
   */
  async calculatePricing(req: Request, res: Response): Promise<void> {
    try {
      const result = pricingSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ success: false, message: 'Invalid pricing parameters' });
        return;
      }

      const { propertyId, roomId, checkIn, checkOut, corporateCode } = result.data;
      const pricing = await bookingService.calculatePricing({
        propertyId,
        roomId,
        checkIn,
        checkOut,
        corporateCode,
      });

      logger.info('[Makcorps] Price calculated', {
        propertyId,
        roomId,
        nights: pricing.nights,
        totalAmount: pricing.totalAmount,
      });

      res.json({ success: true, data: pricing });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('[Makcorps] Calculate price failed', { error: error.message });

      if (error.message.includes('not found')) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }

      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const pricingController = new PricingController();
