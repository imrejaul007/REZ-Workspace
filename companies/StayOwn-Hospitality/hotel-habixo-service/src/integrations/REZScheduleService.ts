import { logger } from '../../shared/logger';
/**
 * REZ-Schedule Integration for Hotel Services
 *
 * Extends StayOwn-Hospitality with service booking capabilities:
 * - Room tours (15-min property viewings)
 * - Spa appointments
 * - Restaurant reservations
 * - Conference room bookings
 */

import { Request, Response } from 'express';

// REZ Schedule Service configuration
const REZ_SCHEDULE_CONFIG = {
  apiBaseUrl: process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090',
  apiKey: process.env.REZ_SCHEDULE_API_KEY,
};

// Service type to event slug mapping
const SERVICE_EVENT_MAPPING: Record<string, { slug: string; duration: number }> = {
  'room-tour': { slug: 'room-tour', duration: 15 },
  'spa-massage': { slug: 'spa-massage', duration: 60 },
  'spa-facial': { slug: 'spa-facial', duration: 45 },
  'restaurant-dinner': { slug: 'restaurant-dinner', duration: 120 },
  'restaurant-lunch': { slug: 'restaurant-lunch', duration: 90 },
  'conference-room': { slug: 'conference-room', duration: 60 },
  'business-center': { slug: 'business-center', duration: 30 },
  'concierge': { slug: 'concierge-consultation', duration: 15 },
};

// Hotel service booking request
export interface HotelServiceBookingRequest {
  propertyId: string;
  serviceType: keyof typeof SERVICE_EVENT_MAPPING;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  preferredDate: string;
  preferredTime: string;
  partySize?: number; // For restaurant
  notes?: string;
}

// Hotel service booking response
export interface HotelServiceBookingResponse {
  success: boolean;
  bookingUid?: string;
  bookingReference?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  confirmationSent?: boolean;
  error?: string;
}

// Create hotel service booking via REZ-schedule-service
export async function createHotelServiceBooking(
  params: HotelServiceBookingRequest
): Promise<HotelServiceBookingResponse> {
  const serviceConfig = SERVICE_EVENT_MAPPING[params.serviceType];

  if (!serviceConfig) {
    return { success: false, error: `Unknown service type: ${params.serviceType}` };
  }

  try {
    // Calculate start and end times
    const startTime = new Date(`${params.preferredDate}T${params.preferredTime}:00`);
    const endTime = new Date(startTime.getTime() + serviceConfig.duration * 60000);

    // Create booking in REZ-schedule-service
    const response = await fetch(`${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventTypeId: `${params.propertyId}_${serviceConfig.slug}`, // Composite ID
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        attendeeName: params.guestName,
        attendeeEmail: params.guestEmail,
        attendeePhone: params.guestPhone,
        timezone: 'Asia/Kolkata',
        responses: {
          propertyId: params.propertyId,
          serviceType: params.serviceType,
          partySize: params.partySize,
          notes: params.notes,
        },
        idempotencyKey: `hotel_${params.propertyId}_${startTime.toISOString()}`,
      }),
    });

    const data = await response.json();

    if (data.success && data.data) {
      return {
        success: true,
        bookingUid: data.data.uid,
        startTime: data.data.startTime,
        endTime: data.data.endTime,
        location: getServiceLocation(params.serviceType),
        confirmationSent: true,
      };
    }

    return { success: false, error: data.error || 'Failed to create booking' };
  } catch (error) {
    logger.error('[Hotel-REZSchedule] Booking error:', error);
    return { success: false, error: 'Service temporarily unavailable' };
  }
}

// Get available slots for hotel service
export async function getHotelServiceAvailability(
  propertyId: string,
  serviceType: keyof typeof SERVICE_EVENT_MAPPING,
  date: string
): Promise<{ slots: HotelServiceSlot[]; error?: string }> {
  const serviceConfig = SERVICE_EVENT_MAPPING[serviceType];

  if (!serviceConfig) {
    return { slots: [], error: `Unknown service type: ${serviceType}` };
  }

  try {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const response = await fetch(
      `${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/event-types/${propertyId}_${serviceConfig.slug}/availability?` +
      new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
      {
        headers: {
          'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
        },
      }
    );

    const data = await response.json();

    if (data.success && data.data?.slots) {
      return {
        slots: data.data.slots.map((slot: { startTime: string; endTime: string; available: boolean }) => ({
          time: new Date(slot.startTime).toTimeString().slice(0, 5),
          startTime: slot.startTime,
          endTime: slot.endTime,
          available: slot.available,
        })),
      };
    }

    return { slots: [] };
  } catch (error) {
    logger.error('[Hotel-REZSchedule] Availability error:', error);
    return { slots: [], error: 'Failed to fetch availability' };
  }
}

// Cancel hotel service booking
export async function cancelHotelServiceBooking(
  bookingUid: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/bookings/${bookingUid}/cancel`,
      {
        method: 'PATCH',
        headers: {
          'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason || 'Cancelled by hotel',
          notifyHost: true,
          notifyGuest: true,
        }),
      }
    );

    const data = await response.json();
    return { success: data.success, error: data.error };
  } catch (error) {
    return { success: false, error: 'Failed to cancel booking' };
  }
}

// Get service location based on type
function getServiceLocation(serviceType: string): string {
  const locations: Record<string, string> = {
    'room-tour': 'Hotel Lobby - Ground Floor',
    'spa-massage': 'Spa Wing - 3rd Floor',
    'spa-facial': 'Spa Wing - 3rd Floor',
    'restaurant-dinner': 'Fine Dining Restaurant - 5th Floor',
    'restaurant-lunch': 'All Day Dining - Ground Floor',
    'conference-room': 'Business Center - 2nd Floor',
    'business-center': 'Business Center - 2nd Floor',
    'concierge': 'Hotel Lobby',
  };
  return locations[serviceType] || 'Hotel Lobby';
}

// Hotel service types available for booking
export function getAvailableHotelServices(): {
  type: string;
  name: string;
  duration: number;
  description: string;
}[] {
  return [
    { type: 'room-tour', name: 'Room Tour', duration: 15, description: 'Guided tour of our rooms and facilities' },
    { type: 'spa-massage', name: 'Spa Massage', duration: 60, description: 'Relaxing full body massage' },
    { type: 'spa-facial', name: 'Facial Treatment', duration: 45, description: 'Rejuvenating facial treatment' },
    { type: 'restaurant-dinner', name: 'Dinner Reservation', duration: 120, description: 'Table reservation for dinner' },
    { type: 'restaurant-lunch', name: 'Lunch Reservation', duration: 90, description: 'Table reservation for lunch' },
    { type: 'conference-room', name: 'Conference Room', duration: 60, description: 'Meeting room with AV equipment' },
    { type: 'business-center', name: 'Business Center', duration: 30, description: 'Workspace and printing services' },
    { type: 'concierge', name: 'Concierge Consultation', duration: 15, description: 'Personal concierge assistance' },
  ];
}

// Create event types for hotel services (called during setup)
export async function setupHotelEventTypes(propertyId: string): Promise<void> {
  const services = getAvailableHotelServices();

  for (const service of services) {
    try {
      await fetch(`${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/event-types`, {
        method: 'POST',
        headers: {
          'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: `${propertyId}_${service.type}`,
          title: service.name,
          description: service.description,
          duration: service.duration,
          locationType: 'IN_PERSON',
          locationAddress: getServiceLocation(service.type),
          requiresConfirmation: false,
          userId: propertyId,
        }),
      });
    } catch (error) {
      logger.error(`[Hotel-REZSchedule] Failed to create event type: ${service.type}`, error);
    }
  }
}
