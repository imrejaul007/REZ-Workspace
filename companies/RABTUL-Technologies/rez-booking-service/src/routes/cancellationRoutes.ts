/**
 * Cancellation Routes
 *
 * Booking cancellation and refund management
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { Booking, BookingStatus } from '../models';

const router = Router();

// ─── Configuration ────────────────────────────────────────────────────────────

const HOTEL_SERVICE_URL = process.env.HOTEL_SERVICE_URL || 'https://rez-hotel-service.onrender.com';
const STAYOWN_SERVICE_URL = process.env.STAYOWN_SERVICE_URL || 'https://rez-stayown-service.onrender.com';
const TRAVEL_SERVICE_URL = process.env.TRAVEL_SERVICE_URL || 'https://rez-travel-service.onrender.com';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// ─── Validation Schemas ──────────────────────────────────────────────────────

const cancelBookingSchema = z.object({
  reason: z.string().optional(),
  refundMethod: z.enum(['original', 'wallet', 'bank']).optional().default('original'),
});

// ─── Helper Functions ───────────────────────────────────────────────────────

async function cancelInSourceService(
  bookingType: string,
  externalBookingId: string
): Promise<{ success: boolean; refundAmount?: number; error?: string }> {
  let url: string;

  switch (bookingType) {
    case 'hotel':
    case 'stayown':
      url = `${STAYOWN_SERVICE_URL}/api/hotels/bookings/${externalBookingId}/cancel`;
      break;
    case 'travel':
      url = `${TRAVEL_SERVICE_URL}/api/travel/bookings/${externalBookingId}/cancel`;
      break;
    default:
      return { success: false, error: 'Unknown booking type' };
  }

  try {
    const response = await axios.post(
      url,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'x-service-key': INTERNAL_SERVICE_TOKEN,
        },
        timeout: 10000,
      }
    );

    return {
      success: true,
      refundAmount: response.data?.data?.refundAmount,
    };
  } catch (error) {
    console.error(`[Cancellation] Source cancel failed:`, error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Cancellation failed in source service',
    };
  }
}

async function processRefund(
  bookingId: string,
  amount: number,
  method: string
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/refunds`,
      {
        bookingId,
        amount,
        method,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-service-key': INTERNAL_SERVICE_TOKEN,
        },
        timeout: 10000,
      }
    );

    return {
      success: true,
      refundId: response.data?.refundId,
    };
  } catch (error) {
    console.error(`[Cancellation] Refund failed:`, error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Refund processing failed',
    };
  }
}

function calculateCancellationFee(
  totalAmount: number,
  hoursUntilCheckIn: number
): { refundAmount: number; fee: number; feePercentage: number } {
  // Cancellation policy
  const policies = [
    { hours: 24, refundPercentage: 0 },      // Within 24 hours: no refund
    { hours: 48, refundPercentage: 50 },    // 24-48 hours: 50% refund
    { hours: 72, refundPercentage: 75 },    // 48-72 hours: 75% refund
    { hours: Infinity, refundPercentage: 100 }, // >72 hours: full refund
  ];

  const policy = policies.find(p => hoursUntilCheckIn <= p.hours);
  const refundPercentage = policy?.refundPercentage || 100;
  const refundAmount = Math.floor(totalAmount * (refundPercentage / 100));
  const fee = totalAmount - refundAmount;

  return { refundAmount, fee, feePercentage: 100 - refundPercentage };
}

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * Check cancellation eligibility
 * GET /api/bookings/cancellations/:bookingId/eligibility
 */
router.get('/:bookingId/eligibility', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Already cancelled
    if (booking.status === BookingStatus.CANCELLED) {
      return res.json({
        success: true,
        data: {
          eligible: false,
          reason: 'Booking is already cancelled',
          refundAmount: 0,
        },
      });
    }

    // Completed booking
    if (booking.status === BookingStatus.COMPLETED) {
      return res.json({
        success: true,
        data: {
          eligible: false,
          reason: 'Completed bookings cannot be cancelled',
          refundAmount: 0,
        },
      });
    }

    // Calculate refund based on time until check-in/departure
    const checkInDate = booking.checkIn || booking.departureDate;
    let refundAmount = 0;
    let fee = 0;
    let feePercentage = 0;
    let eligible = true;

    if (checkInDate) {
      const hoursUntil = (new Date(checkInDate).getTime() - Date.now()) / (1000 * 60 * 60);

      if (hoursUntil <= 0) {
        eligible = false;
        refundAmount = 0;
      } else {
        const cancellation = calculateCancellationFee(booking.pricing.total, hoursUntil);
        refundAmount = cancellation.refundAmount;
        fee = cancellation.fee;
        feePercentage = cancellation.feePercentage;
      }
    } else {
      // No check-in date set, allow full refund
      refundAmount = booking.pricing.total;
    }

    res.json({
      success: true,
      data: {
        eligible,
        bookingId,
        bookingType: booking.type,
        currentStatus: booking.status,
        totalAmount: booking.pricing.total,
        refundAmount,
        fee,
        feePercentage,
        checkInDate: checkInDate?.toISOString(),
        hoursUntilCheckIn: checkInDate
          ? Math.max(0, (new Date(checkInDate).getTime() - Date.now()) / (1000 * 60 * 60))
          : null,
        reason: eligible
          ? feePercentage === 0
            ? 'No refund available for late cancellation'
            : feePercentage < 100
              ? `${feePercentage}% cancellation fee applies`
              : 'Free cancellation available'
          : 'Booking cannot be cancelled',
      },
    });
  } catch (error) {
    console.error('[Cancellation] Eligibility error:', error);
    res.status(500).json({ success: false, message: 'Failed to check cancellation eligibility' });
  }
});

/**
 * Cancel booking
 * POST /api/bookings/cancellations/:bookingId
 */
router.post('/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const data = cancelBookingSchema.parse(req.body);

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if already cancelled
    if (booking.status === BookingStatus.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    // Check if can be cancelled
    if (booking.status === BookingStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Completed bookings cannot be cancelled',
      });
    }

    // Calculate refund
    const checkInDate = booking.checkIn || booking.departureDate;
    let refundAmount = 0;

    if (checkInDate) {
      const hoursUntil = (new Date(checkInDate).getTime() - Date.now()) / (1000 * 60 * 60);

      if (hoursUntil > 0) {
        const cancellation = calculateCancellationFee(booking.pricing.total, hoursUntil);
        refundAmount = cancellation.refundAmount;
      }
    } else {
      refundAmount = booking.pricing.total;
    }

    // Try to cancel in source service
    const sourceResult = booking.externalBookingId
      ? await cancelInSourceService(booking.type, booking.externalBookingId)
      : { success: false, error: 'No external booking ID' };

    // Process refund if applicable
    let refundResult = { success: false };
    if (refundAmount > 0) {
      refundResult = await processRefund(bookingId, refundAmount, data.refundMethod);
    }

    // Update booking status
    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = data.reason;
    booking.cancelledAt = new Date();

    if (refundAmount > 0) {
      booking.refundAmount = refundAmount;
      booking.refundStatus = refundResult.success ? 'processing' : 'pending';
      booking.refundId = refundResult.refundId;
    }

    booking.metadata = {
      ...booking.metadata,
      cancellationSource: sourceResult.success ? 'source_service' : 'direct',
      refundSource: refundResult.success ? 'payment_service' : 'local',
    };

    await booking.save();

    res.json({
      success: true,
      data: {
        bookingId: booking.bookingId,
        status: 'cancelled',
        cancellationReason: data.reason,
        cancelledAt: booking.cancelledAt.toISOString(),
        refundAmount,
        refundStatus: booking.refundStatus,
        refundId: booking.refundId,
        sourceCancellationResult: sourceResult.success ? 'success' : sourceResult.error,
        refundResult: refundResult.success ? 'success' : refundResult.error,
      },
    });
  } catch (error) {
    console.error('[Cancellation] Cancel error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Cancellation failed' });
  }
});

/**
 * Get cancellation history
 * GET /api/bookings/cancellations/history?userId=...
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { userId, page = 1, limit = 20 } = req.query;

    const filter: unknown = { status: BookingStatus.CANCELLED };
    if (userId) filter.userId = userId;

    const bookings = await Booking.find(filter)
      .select('bookingId userId type status refundAmount refundStatus cancellationReason cancelledAt createdAt')
      .sort({ cancelledAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Booking.countDocuments(filter);

    // Calculate cancellation stats
    const stats = await Booking.aggregate([
      { $match: { status: BookingStatus.CANCELLED, ...(userId ? { userId } : {}) } },
      {
        $group: {
          _id: null,
          totalCancelled: { $sum: 1 },
          totalRefundAmount: { $sum: '$refundAmount' },
          avgRefundPercentage: {
            $avg: {
              $cond: [
                { $eq: ['$pricing.total', 0] },
                0,
                { $multiply: [{ $divide: ['$refundAmount', '$pricing.total'] }, 100] },
              ],
            },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        cancellations: bookings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
        stats: stats[0] || {
          totalCancelled: 0,
          totalRefundAmount: 0,
          avgRefundPercentage: 0,
        },
      },
    });
  } catch (error) {
    console.error('[Cancellation] History error:', error);
    res.status(500).json({ success: false, message: 'Failed to get cancellation history' });
  }
});

export default router;
