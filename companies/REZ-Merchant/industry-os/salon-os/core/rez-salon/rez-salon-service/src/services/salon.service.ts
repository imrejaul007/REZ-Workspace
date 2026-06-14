/**
 * Salon Service - Business logic for salon operations
 */

import { Service } from '../models/Service';
import { Stylist } from '../models/Stylist';
import { logger } from '../config/logger';

export interface ServiceFilters {
  salonId?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

export interface StylistFilters {
  salonId?: string;
  specializations?: string[];
  level?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Get services with filtering and pagination
 */
export async function getServices(filters: ServiceFilters) {
  const {
    salonId,
    category,
    minPrice,
    maxPrice,
    search,
    active = true,
    page = 1,
    limit = 20,
  } = filters;

  const query: Record<string, unknown> = { isActive: active };

  if (salonId) query.salonId = salonId;
  if (category) query.category = category;
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) (query.price as Record<string, number>).$gte = minPrice;
    if (maxPrice !== undefined) (query.price as Record<string, number>).$lte = maxPrice;
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [services, total] = await Promise.all([
    Service.find(query).skip(skip).limit(limit).sort({ category: 1, name: 1 }),
    Service.countDocuments(query),
  ]);

  return {
    services,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get stylists with filtering and pagination
 */
export async function getStylists(filters: StylistFilters) {
  const {
    salonId,
    specializations,
    level,
    active = true,
    page = 1,
    limit = 20,
  } = filters;

  const query: Record<string, unknown> = { isActive: active };

  if (salonId) query.salonId = salonId;
  if (specializations && specializations.length > 0) {
    query.specialties = { $in: specializations };
  }
  if (level) query.level = level;

  const skip = (page - 1) * limit;

  const [stylists, total] = await Promise.all([
    Stylist.find(query).skip(skip).limit(limit).sort({ rating: -1, name: 1 }),
    Stylist.countDocuments(query),
  ]);

  return {
    stylists,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Calculate service price with discounts
 */
export function calculateServicePrice(
  basePrice: number,
  discountedPrice?: number,
  membershipDiscount?: number
): { originalPrice: number; finalPrice: number; discount: number; discountPercent: number } {
  const originalPrice = basePrice;
  let finalPrice = discountedPrice ?? basePrice;

  if (membershipDiscount && membershipDiscount > 0) {
    const membershipDiscountAmount = finalPrice * (membershipDiscount / 100);
    finalPrice = finalPrice - membershipDiscountAmount;
  }

  const discount = originalPrice - finalPrice;
  const discountPercent = originalPrice > 0 ? Math.round((discount / originalPrice) * 100) : 0;

  return {
    originalPrice,
    finalPrice: Math.round(finalPrice * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    discountPercent,
  };
}

/**
 * Calculate estimated service duration including buffer time
 */
export function calculateServiceDuration(
  baseDuration: number,
  bufferMinutes: number = 5
): { baseDuration: number; bufferMinutes: number; totalDuration: number } {
  return {
    baseDuration,
    bufferMinutes,
    totalDuration: baseDuration + bufferMinutes,
  };
}

/**
 * Get available time slots for a stylist on a given date
 */
export function getAvailableTimeSlots(
  workingHours: { start: string; end: string; breakStart?: string; breakEnd?: string },
  bookedSlots: Array<{ start: string; end: string }>,
  serviceDuration: number
): Array<{ start: string; end: string }> {
  const slots: Array<{ start: string; end: string }> = [];

  const workStart = workingHours.start.split(':').map(Number);
  const workEnd = workingHours.end.split(':').map(Number);

  let currentMinutes = workStart[0] * 60 + workStart[1];
  const endMinutes = workEnd[0] * 60 + workEnd[1];

  const breakStart = workingHours.breakStart
    ? workingHours.breakStart.split(':').map(Number).reduce((acc, v, i) => acc + v * (i === 0 ? 60 : 1), 0)
    : null;
  const breakEnd = workingHours.breakEnd
    ? workingHours.breakEnd.split(':').map(Number).reduce((acc, v, i) => acc + v * (i === 0 ? 60 : 1), 0)
    : null;

  while (currentMinutes + serviceDuration <= endMinutes) {
    const slotEnd = currentMinutes + serviceDuration;

    // Skip if slot overlaps with break
    if (breakStart !== null && breakEnd !== null) {
      if (currentMinutes < breakEnd && slotEnd > breakStart) {
        currentMinutes = breakEnd;
        continue;
      }
    }

    // Check for booking conflicts
    const hasConflict = bookedSlots.some(slot => {
      const bookedStart = slot.start.split(':').map(Number).reduce((acc, v, i) => acc + v * (i === 0 ? 60 : 1), 0);
      const bookedEnd = slot.end.split(':').map(Number).reduce((acc, v, i) => acc + v * (i === 0 ? 60 : 1), 0);
      return currentMinutes < bookedEnd && slotEnd > bookedStart;
    });

    if (!hasConflict) {
      const toTimeString = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      };

      slots.push({
        start: toTimeString(currentMinutes),
        end: toTimeString(slotEnd),
      });
    }

    currentMinutes += 30; // 30-minute slot intervals
  }

  return slots;
}

/**
 * Log service operation for analytics
 */
export function logServiceOperation(
  operation: 'create' | 'update' | 'delete' | 'view',
  entityType: 'service' | 'stylist',
  entityId: string,
  details?: Record<string, unknown>
): void {
  logger.info('Service operation', {
    operation,
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
    ...details,
  });
}
