import { v4 as uuidv4 } from 'uuid';
import {
  UnifiedBooking,
  UnifiedBookingDocument,
  WaitlistEntry,
} from '../models';
import { getVerticalConfig } from '../config/verticals';
import {
  checkAvailability,
  createVerticalBooking as createVerticalBookingProxy,
  updateVerticalBooking as updateVerticalBookingProxy,
  deleteVerticalBooking as deleteVerticalBookingProxy,
} from './verticalProxy';
import { sendBookingConfirmation } from './notificationService';
import { createLogger } from '../utils/logger';
import {
  AvailabilityRequest,
  AvailabilitySlot,
  BookingStatus,
  CreateBookingParams,
  UpdateBookingParams,
  CalendarEvent,
  MerchantResult,
  MerchantSearchRequest,
  PaginationMeta,
  UnifiedBooking as IUnifiedBooking,
} from '../types';

const logger = createLogger('booking-service');

// ============================================
// Availability Search
// ============================================

export async function searchAvailability(
  request: AvailabilityRequest
): Promise<AvailabilitySlot[]> {
  const { vertical, merchantId, date, startTime, endTime, partySize, filters } = request;

  const verticalConfig = getVerticalConfig(vertical);
  if (!verticalConfig) {
    logger.warn('Invalid vertical requested', { vertical });
    return [];
  }

  // First, try to get availability from the vertical service
  const result = await checkAvailability(vertical, {
    merchantId,
    date,
    startTime,
    endTime,
    partySize,
    filters,
  });

  if (!result.success || !result.data) {
    logger.warn('Vertical availability check failed, returning empty slots', {
      vertical,
      merchantId,
      error: result.error?.message,
    });
    return [];
  }

  return result.data;
}

export async function searchAllVerticals(
  date: string,
  startTime?: string,
  partySize?: number,
  verticalFilter?: string
): Promise<{ vertical: string; verticalName: string; slots: AvailabilitySlot[] }[]> {
  const verticals = verticalFilter
    ? [verticalFilter]
    : [
        'restaurant', 'hotel', 'salon', 'spa', 'gym',
        'education', 'events', 'automotive', 'medical',
        'tours', 'rentals', 'entertainment', 'cleaning',
        'repair', 'childcare', 'petcare', 'legal',
      ];

  const results = await Promise.all(
    verticals.map(async (vertical) => {
      try {
        const config = getVerticalConfig(vertical);
        const slots = await searchAvailability({
          vertical,
          merchantId: '', // Empty to search all merchants
          date,
          startTime,
          partySize,
        });

        return {
          vertical,
          verticalName: config?.name || vertical,
          slots,
        };
      } catch (error) {
        logger.error('Failed to search vertical', { vertical, error });
        return {
          vertical,
          verticalName: vertical,
          slots: [] as AvailabilitySlot[],
        };
      }
    })
  );

  return results.filter((r) => r.slots.length > 0);
}

export async function searchMerchants(
  request: MerchantSearchRequest
): Promise<MerchantResult[]> {
  // This would typically call a merchant registry service
  // For now, return an empty array as a placeholder
  // In production, this would integrate with the merchant service

  logger.info('Merchant search requested', { request });

  // Placeholder implementation - in production, this would:
  // 1. Query merchant registry for merchants matching the criteria
  // 2. Filter by vertical, location, and other criteria
  // 3. Return with distance calculations if lat/lng provided

  return [];
}

// ============================================
// Booking Management
// ============================================

export interface CreateBookingResult {
  booking: IUnifiedBooking;
  paymentRequired: boolean;
  paymentDetails?: {
    amount: number;
    currency: string;
  };
}

export async function createBooking(params: CreateBookingParams): Promise<CreateBookingResult> {
  const {
    userId,
    merchantId,
    vertical,
    type,
    startDateTime,
    duration,
    partySize,
    bookingData = {},
    paymentRequired: paymentRequiredOverride,
  } = params;

  const verticalConfig = getVerticalConfig(vertical);
  if (!verticalConfig) {
    throw new Error(`Invalid vertical: ${vertical}`);
  }

  const effectiveDuration = duration || verticalConfig.defaultDuration || 60;

  // Calculate end date time
  const endDateTime = new Date(startDateTime.getTime() + effectiveDuration * 60 * 1000);

  // Create booking in the vertical service first
  const verticalBookingResult = await createVerticalBookingProxy(vertical, {
    merchantId,
    userId,
    type,
    startDateTime: startDateTime.toISOString(),
    duration: effectiveDuration,
    partySize,
    bookingData,
  });

  if (!verticalBookingResult.success || !verticalBookingResult.data) {
    throw new Error(
      `Failed to create booking in ${vertical} service: ${verticalBookingResult.error?.message}`
    );
  }

  // Create the unified booking record
  const booking = new UnifiedBooking({
    bookingId: `UB-${uuidv4()}`,
    userId,
    merchantId,
    vertical,
    verticalBookingId: verticalBookingResult.data.bookingId,
    type,
    status: 'pending',
    startDateTime,
    endDateTime,
    duration: effectiveDuration,
    partySize,
    totalAmount: 0,
    amountPaid: 0,
    currency: 'USD',
    paymentStatus: 'pending',
    bookingData,
  });

  await booking.save();

  logger.info('Unified booking created', {
    bookingId: booking.bookingId,
    verticalBookingId: booking.verticalBookingId,
    vertical,
    merchantId,
    userId,
  });

  // Send confirmation notification
  try {
    await sendBookingConfirmation(booking);
  } catch (notificationError) {
    logger.error('Failed to send booking confirmation', {
      bookingId: booking.bookingId,
      error: notificationError instanceof Error ? notificationError.message : 'Unknown',
    });
  }

  // Determine if payment is required
  const paymentRequired = paymentRequiredOverride ?? verticalConfig.requiresPayment;

  return {
    booking: booking.toObject() as IUnifiedBooking,
    paymentRequired,
    paymentDetails: paymentRequired
      ? { amount: booking.totalAmount, currency: booking.currency }
      : undefined,
  };
}

export async function getBookingById(bookingId: string): Promise<IUnifiedBooking | null> {
  const booking = await UnifiedBooking.findByBookingId(bookingId);
  return booking ? (booking.toObject() as IUnifiedBooking) : null;
}

export async function getBookingByVerticalId(
  vertical: string,
  verticalBookingId: string
): Promise<IUnifiedBooking | null> {
  const booking = await UnifiedBooking.findOne({ vertical, verticalBookingId });
  return booking ? (booking.toObject() as IUnifiedBooking) : null;
}

export async function updateBooking(
  bookingId: string,
  updates: UpdateBookingParams
): Promise<IUnifiedBooking | null> {
  const booking = await UnifiedBooking.findByBookingId(bookingId);

  if (!booking) {
    return null;
  }

  // Check if booking can be updated
  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new Error(`Cannot update booking with status: ${booking.status}`);
  }

  // Apply updates
  if (updates.startDateTime) {
    booking.startDateTime = updates.startDateTime;
    // Recalculate end time
    booking.endDateTime = new Date(
      updates.startDateTime.getTime() + (updates.duration || booking.duration) * 60 * 1000
    );
  }

  if (updates.duration) {
    booking.duration = updates.duration;
    // Recalculate end time
    booking.endDateTime = new Date(
      booking.startDateTime.getTime() + updates.duration * 60 * 1000
    );
  }

  if (updates.notes !== undefined) {
    booking.notes = updates.notes;
  }

  if (updates.partySize !== undefined) {
    booking.partySize = updates.partySize;
  }

  await booking.save();

  // Update in vertical service
  const verticalResult = await updateVerticalBookingProxy(booking.vertical, booking.verticalBookingId, {
    startDateTime: booking.startDateTime.toISOString(),
    duration: booking.duration,
    notes: booking.notes,
    partySize: booking.partySize,
  });

  if (!verticalResult.success) {
    logger.warn('Failed to update booking in vertical service', {
      bookingId,
      vertical: booking.vertical,
      verticalBookingId: booking.verticalBookingId,
      error: verticalResult.error?.message,
    });
  }

  logger.info('Booking updated', {
    bookingId,
    updates: Object.keys(updates),
  });

  return booking.toObject() as IUnifiedBooking;
}

export interface CancelBookingResult {
  booking: IUnifiedBooking;
  refundRequired: boolean;
  refundAmount: number;
}

export async function cancelBooking(
  bookingId: string,
  reason?: string,
  cancelledBy?: string
): Promise<CancelBookingResult | null> {
  const booking = await UnifiedBooking.findByBookingId(bookingId);

  if (!booking) {
    return null;
  }

  // Check if booking can be cancelled
  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new Error(`Cannot cancel booking with status: ${booking.status}`);
  }

  // Cancel in vertical service
  const verticalResult = await deleteVerticalBookingProxy(
    booking.vertical,
    booking.verticalBookingId,
    reason
  );

  if (!verticalResult.success) {
    logger.warn('Failed to cancel booking in vertical service', {
      bookingId,
      vertical: booking.vertical,
      error: verticalResult.error?.message,
    });
  }

  // Update local booking
  booking.status = 'cancelled';
  booking.cancellationReason = reason;
  booking.cancelledAt = new Date();
  await booking.save();

  // Calculate refund
  let refundRequired = false;
  let refundAmount = 0;

  if (booking.amountPaid > 0 && booking.paymentStatus !== 'refunded') {
    // Check cancellation policy
    const verticalConfig = getVerticalConfig(booking.vertical);
    const policyMinutes = parseCancellationPolicy(verticalConfig?.cancellationPolicy || '24h');

    const hoursUntilBooking =
      (booking.startDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilBooking >= policyMinutes) {
      // Full refund
      refundRequired = true;
      refundAmount = booking.amountPaid;
    } else {
      // Partial refund or no refund based on policy
      // For simplicity, let's say 50% refund if within policy
      refundRequired = true;
      refundAmount = Math.floor(booking.amountPaid * 0.5);
    }
  }

  logger.info('Booking cancelled', {
    bookingId,
    refundRequired,
    refundAmount,
  });

  return {
    booking: booking.toObject() as IUnifiedBooking,
    refundRequired,
    refundAmount,
  };
}

export interface RescheduleResult {
  available: boolean;
  slots?: AvailabilitySlot[];
  currentBooking?: IUnifiedBooking;
}

export async function getRescheduleOptions(bookingId: string): Promise<RescheduleResult | null> {
  const booking = await UnifiedBooking.findByBookingId(bookingId);

  if (!booking) {
    return null;
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    return {
      available: false,
      currentBooking: booking.toObject() as IUnifiedBooking,
    };
  }

  // Get available slots for the same date
  const date = booking.startDateTime.toISOString().split('T')[0];
  const slots = await searchAvailability({
    vertical: booking.vertical,
    merchantId: booking.merchantId,
    date,
    partySize: booking.partySize,
  });

  // Filter out the current time slot
  const currentTime = booking.startDateTime.toTimeString().slice(0, 5);
  const availableSlots = slots.filter(
    (slot) => slot.startTime !== currentTime && slot.available > 0
  );

  return {
    available: availableSlots.length > 0,
    slots: availableSlots,
    currentBooking: booking.toObject() as IUnifiedBooking,
  };
}

// ============================================
// Booking Listing
// ============================================

export interface ListBookingsParams {
  userId: string;
  vertical?: string;
  status?: BookingStatus;
  fromDate?: Date;
  toDate?: Date;
  page: number;
  limit: number;
}

export interface ListBookingsResult {
  bookings: IUnifiedBooking[];
  pagination: PaginationMeta;
}

export async function listUserBookings(
  params: ListBookingsParams
): Promise<ListBookingsResult> {
  const { userId, vertical, status, fromDate, toDate, page, limit } = params;

  const query: Record<string, unknown> = { userId };

  if (vertical) {
    query.vertical = vertical;
  }

  if (status) {
    query.status = status;
  }

  if (fromDate || toDate) {
    query.startDateTime = {};
    if (fromDate) {
      (query.startDateTime as Record<string, Date>)['$gte'] = fromDate;
    }
    if (toDate) {
      (query.startDateTime as Record<string, Date>)['$lte'] = toDate;
    }
  }

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    UnifiedBooking.find(query).sort({ startDateTime: -1 }).skip(skip).limit(limit),
    UnifiedBooking.countDocuments(query),
  ]);

  return {
    bookings: bookings.map((b) => b.toObject() as IUnifiedBooking),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================
// Calendar
// ============================================

export async function getUserCalendar(
  userId: string,
  fromDate: Date,
  toDate: Date,
  vertical?: string,
  status?: BookingStatus
): Promise<CalendarEvent[]> {
  const query: Record<string, unknown> = {
    userId,
    startDateTime: { $gte: fromDate, $lte: toDate },
  };

  if (vertical) {
    query.vertical = vertical;
  }

  if (status) {
    query.status = status;
  }

  const bookings = await UnifiedBooking.find(query).sort({ startDateTime: 1 });

  return bookings.map((booking) => ({
    eventId: booking.bookingId,
    bookingId: booking.bookingId,
    userId: booking.userId,
    merchantId: booking.merchantId,
    merchantName: '', // Would be populated from merchant service
    vertical: booking.vertical,
    type: booking.type,
    status: booking.status,
    startDateTime: booking.startDateTime,
    endDateTime: booking.endDateTime,
    duration: booking.duration,
    partySize: booking.partySize,
    totalAmount: booking.totalAmount,
    notes: booking.notes,
  }));
}

export async function getMerchantCalendar(
  merchantId: string,
  fromDate: Date,
  toDate: Date,
  status?: BookingStatus
): Promise<CalendarEvent[]> {
  const query: Record<string, unknown> = {
    merchantId,
    startDateTime: { $gte: fromDate, $lte: toDate },
  };

  if (status) {
    query.status = status;
  }

  const bookings = await UnifiedBooking.find(query).sort({ startDateTime: 1 });

  return bookings.map((booking) => ({
    eventId: booking.bookingId,
    bookingId: booking.bookingId,
    userId: booking.userId,
    merchantId: booking.merchantId,
    merchantName: '',
    vertical: booking.vertical,
    type: booking.type,
    status: booking.status,
    startDateTime: booking.startDateTime,
    endDateTime: booking.endDateTime,
    duration: booking.duration,
    partySize: booking.partySize,
    totalAmount: booking.totalAmount,
    notes: booking.notes,
  }));
}

// ============================================
// Helper Functions
// ============================================

function parseCancellationPolicy(policy: string): number {
  // Parse policy like "24h", "2h", "7d" to minutes
  const match = policy.match(/^(\d+)([hd])$/);
  if (!match) {
    return 24 * 60; // Default 24 hours
  }

  const value = parseInt(match[1] ?? '24', 10);
  const unit = match[2] ?? 'h';

  if (unit === 'd') {
    return value * 24 * 60;
  }
  return value * 60;
}

export default {
  searchAvailability,
  searchAllVerticals,
  searchMerchants,
  createBooking,
  getBookingById,
  getBookingByVerticalId,
  updateBooking,
  cancelBooking,
  getRescheduleOptions,
  listUserBookings,
  getUserCalendar,
  getMerchantCalendar,
};