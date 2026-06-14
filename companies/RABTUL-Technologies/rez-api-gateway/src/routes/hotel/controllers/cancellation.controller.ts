/**
 * Cancellation Controller
 * Handles booking cancellation
 */

import { Request, Response } from 'express';
import { bookingService } from '../services/booking.service';
import { logger } from '../../../config/logger';

export class CancellationController {
  /**
   * Cancel a booking
   * POST /api/hotels/bookings/:bookingId/cancel
   */
  async cancelBooking(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const { reason } = req.body;
      const companyId = req.headers['x-company-id'] as string;

      const booking = bookingService.cancelBooking(bookingId, reason);

      logger.info('[Makcorps] Booking cancelled', { bookingId, reason, companyId });

      res.json({ success: true, data: booking });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('[Makcorps] Cancel booking failed', { error: error.message });

      if (error.message.includes('not found')) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      if (error.message.includes('already cancelled')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }

      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const cancellationController = new CancellationController();
