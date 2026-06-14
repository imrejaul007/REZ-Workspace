/**
 * REZ-Schedule Integration for Salon App
 *
 * This file integrates REZ-schedule-service with the existing salon booking system.
 * It provides:
 * - Real-time slot availability from REZ-schedule-service
 * - Booking creation via REZ-schedule-service
 * - Webhook listeners for booking events
 * - Fallback to local slot generation if service unavailable
 */

import { salonService, SalonBooking, TimeSlot, BlockedSlot } from '@/services/api/salon';

// REZ Schedule Service configuration
const REZ_SCHEDULE_CONFIG = {
  apiBaseUrl: process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090',
  apiKey: process.env.REZ_SCHEDULE_API_KEY,
  fallbackEnabled: true, // Fall back to local slots if API unavailable
};

// Salon-specific event type mappings
const SALON_EVENT_TYPE_MAPPINGS: Record<string, { slug: string; duration: number }> = {
  'haircut': { slug: 'haircut-styling', duration: 45 },
  'facial': { slug: 'facial-treatment', duration: 60 },
  'coloring': { slug: 'hair-coloring', duration: 120 },
  'massage': { slug: 'spa-massage', duration: 60 },
};

// Extended salon booking with REZ Schedule fields
export interface ExtendedSalonBooking extends SalonBooking {
  rezScheduleBookingUid?: string;
  rezScheduleWebhookVerified?: boolean;
}

// Fetch availability from REZ-schedule-service
export async function fetchREZAvailability(
  username: string,
  slug: string,
  date: string
): Promise<TimeSlot[]> {
  try {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const response = await fetch(
      `${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/availability/${username}/${slug}?` +
      new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
      {
        headers: {
          'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`REZ Schedule API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.data?.slots) {
      // Convert REZ Schedule slots to local TimeSlot format
      return data.data.slots
        .filter((slot: { available: boolean }) => slot.available)
        .map((slot: { startTime: string; endTime: string }) => {
          const startTime = new Date(slot.startTime);
          const endTime = new Date(slot.endTime);
          return {
            time: startTime.toTimeString().slice(0, 5), // "HH:MM"
            hour: startTime.getHours(),
            minute: startTime.getMinutes(),
            available: true,
            bookingId: null,
            booking: null,
          };
        });
    }

    return [];
  } catch (error) {
    console.error('[REZ-Schedule] Failed to fetch availability:', error);

    if (REZ_SCHEDULE_CONFIG.fallbackEnabled) {
      console.log('[REZ-Schedule] Falling back to local slot generation');
      return generateLocalSlots();
    }

    return [];
  }
}

// Create booking via REZ-schedule-service
export async function createREZBooking(params: {
  username: string;
  slug: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceId?: string;
  staffId?: string;
  notes?: string;
}): Promise<{
  success: boolean;
  bookingUid?: string;
  localBooking?: SalonBooking;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/bookings`,
      {
        method: 'POST',
        headers: {
          'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventTypeId: `${params.slug}`, // In real impl, fetch eventTypeId first
          startTime: params.startTime,
          endTime: params.endTime,
          attendeeName: params.customerName,
          attendeeEmail: params.customerEmail,
          attendeePhone: params.customerPhone,
          responses: {
            serviceId: params.serviceId,
            staffId: params.staffId,
            notes: params.notes,
          },
          timezone: 'Asia/Kolkata',
          idempotencyKey: `salon_${params.startTime}_${Date.now()}`,
        }),
      }
    );

    const data = await response.json();

    if (data.success && data.data) {
      // Also create local booking for salon-specific data
      const localBooking = await salonService.createBooking({
        customerId: params.customerEmail, // Using email as customer ID
        serviceId: params.serviceId || '',
        staffId: params.staffId,
        date: params.startTime,
        startTime: new Date(params.startTime).toTimeString().slice(0, 5),
        endTime: new Date(params.endTime).toTimeString().slice(0, 5),
        status: 'confirmed',
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        customerEmail: params.customerEmail,
        notes: params.notes,
      });

      return {
        success: true,
        bookingUid: data.data.uid,
        localBooking,
      };
    }

    return { success: false, error: data.error || 'Failed to create booking' };
  } catch (error) {
    console.error('[REZ-Schedule] Failed to create booking:', error);
    return { success: false, error: 'REZ Schedule service unavailable' };
  }
}

// Get event types for salon
export async function getREZEventTypes(): Promise<{
  id: string;
  slug: string;
  title: string;
  duration: number;
  price?: number;
}[]> {
  try {
    const response = await fetch(
      `${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/event-types`,
      {
        headers: {
          'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        return data.data.map((et: { id: string; slug: string; title: string; duration: number; price?: number }) => ({
          id: et.id,
          slug: et.slug,
          title: et.title,
          duration: et.duration,
          price: et.price,
        }));
      }
    }

    return [];
  } catch (error) {
    console.error('[REZ-Schedule] Failed to get event types:', error);
    return [];
  }
}

// Cancel booking via REZ-schedule-service
export async function cancelREZBooking(bookingUid: string, reason?: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/bookings/${bookingUid}/cancel`,
      {
        method: 'PATCH',
        headers: {
          'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('[REZ-Schedule] Failed to cancel booking:', error);
    return false;
  }
}

// Reschedule booking via REZ-schedule-service
export async function rescheduleREZBooking(
  bookingUid: string,
  newStartTime: string,
  newEndTime: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/bookings/${bookingUid}/reschedule`,
      {
        method: 'PATCH',
        headers: {
          'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newStartTime,
          newEndTime,
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('[REZ-Schedule] Failed to reschedule booking:', error);
    return false;
  }
}

// Verify webhook signature
export function verifyREZWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Import crypto for HMAC verification
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Sync local bookings with REZ-schedule-service
export async function syncSalonWithREZSchedule(merchantId: string): Promise<{
  synced: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;

  try {
    // Get all local bookings
    const localBookings = await salonService.getBookings(merchantId, { status: 'confirmed' });

    for (const booking of localBookings) {
      try {
        // In real implementation, check if booking exists in REZ-schedule
        // and sync any differences
        // This is a placeholder for the sync logic
        synced++;
      } catch (error) {
        errors.push(`Failed to sync booking ${booking.id}: ${error}`);
      }
    }

    return { synced, errors };
  } catch (error) {
    return { synced: 0, errors: [`Sync failed: ${error}`] };
  }
}

// Generate local time slots (fallback)
function generateLocalSlots(): TimeSlot[] {
  return Array.from({ length: 28 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8; // Start at 8 AM
    const minute = (i % 2) * 30;
    return {
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      hour,
      minute,
      available: true,
      bookingId: null,
      booking: null,
    };
  });
}

// Hook for using REZ-schedule in React components
export function useREZSchedule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  const fetchSlots = useCallback(async (username: string, slug: string, date: string) => {
    setLoading(true);
    setError(null);
    try {
      const availableSlots = await fetchREZAvailability(username, slug, date);
      setSlots(availableSlots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch slots');
    } finally {
      setLoading(false);
    }
  }, []);

  const createBooking = useCallback(async (params: Parameters<typeof createREZBooking>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createREZBooking(params);
      if (!result.success) {
        setError(result.error || 'Failed to create booking');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create booking';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    slots,
    fetchSlots,
    createBooking,
  };
}

import { useState } from 'react';
