import { logger } from '../../shared/logger';
/**
 * REZ-Schedule Integration for ReZ-Ride
 *
 * Adds scheduled ride booking capability:
 * - Book rides in advance
 * - Driver availability slots
 * - Pickup time selection
 */

import { Request, Response } from 'express';

// REZ Schedule Service configuration
const REZ_SCHEDULE_CONFIG = {
  apiBaseUrl: process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090',
  apiKey: process.env.REZ_SCHEDULE_API_KEY,
};

// Vehicle type event type mapping
const VEHICLE_EVENT_TYPES: Record<string, { slug: string; duration: number }> = {
  'bike': { slug: 'ride-bike', duration: 30 },
  'auto': { slug: 'ride-auto', duration: 30 },
  'sedan': { slug: 'ride-sedan', duration: 60 },
  'suv': { slug: 'ride-suv', duration: 60 },
  'premium': { slug: 'ride-premium', duration: 60 },
};

// Scheduled ride request
export interface ScheduledRideRequest {
  userId: string;
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  dropoffLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  vehicleType: keyof typeof VEHICLE_EVENT_TYPES;
  scheduledTime: string; // ISO datetime
  passengerCount: number;
  notes?: string;
}

// Scheduled ride response
export interface ScheduledRideResponse {
  success: boolean;
  rideId?: string;
  bookingUid?: string;
  scheduledTime?: string;
  estimatedPrice?: number;
  estimatedDuration?: number;
  driverAssigned?: boolean;
  error?: string;
}

// Driver availability slot
export interface DriverAvailabilitySlot {
  driverId: string;
  driverName: string;
  vehicleType: string;
  rating: number;
  startTime: string;
  endTime: string;
  available: boolean;
}

// Create scheduled ride booking
export async function createScheduledRide(
  params: ScheduledRideRequest
): Promise<ScheduledRideResponse> {
  const vehicleConfig = VEHICLE_EVENT_TYPES[params.vehicleType];

  if (!vehicleConfig) {
    return { success: false, error: `Invalid vehicle type: ${params.vehicleType}` };
  }

  try {
    // Create booking in REZ-schedule-service
    const response = await fetch(`${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventTypeId: `rezride_${params.vehicleType}`,
        startTime: params.scheduledTime,
        endTime: new Date(
          new Date(params.scheduledTime).getTime() + vehicleConfig.duration * 60000
        ).toISOString(),
        attendeeName: `User ${params.userId}`,
        attendeeEmail: `user_${params.userId}@rezride.app`,
        timezone: 'Asia/Kolkata',
        responses: {
          rideType: 'scheduled',
          pickupAddress: params.pickupLocation.address,
          pickupLat: params.pickupLocation.lat,
          pickupLng: params.pickupLocation.lng,
          dropoffAddress: params.dropoffLocation.address,
          dropoffLat: params.dropoffLocation.lat,
          dropoffLng: params.dropoffLocation.lng,
          vehicleType: params.vehicleType,
          passengerCount: params.passengerCount,
          notes: params.notes,
        },
        idempotencyKey: `rezride_${params.userId}_${params.scheduledTime}`,
      }),
    });

    const data = await response.json();

    if (data.success && data.data) {
      return {
        success: true,
        bookingUid: data.data.uid,
        scheduledTime: params.scheduledTime,
        driverAssigned: false, // Will be assigned later
      };
    }

    return { success: false, error: data.error || 'Failed to schedule ride' };
  } catch (error) {
    logger.error('[ReZ-Ride-REZSchedule] Scheduling error:', error);
    return { success: false, error: 'Service temporarily unavailable' };
  }
}

// Get driver availability for scheduled rides
export async function getDriverAvailability(
  vehicleType: keyof typeof VEHICLE_EVENT_TYPES,
  date: string
): Promise<{ slots: DriverAvailabilitySlot[]; error?: string }> {
  try {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const response = await fetch(
      `${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/availability/rezride/${vehicleType}?` +
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
        slots: data.data.slots
          .filter((slot: { available: boolean }) => slot.available)
          .map((slot: { startTime: string; endTime: string }) => ({
            driverId: 'pending', // Will be assigned on booking
            driverName: 'Assigning...',
            vehicleType,
            rating: 4.8,
            startTime: slot.startTime,
            endTime: slot.endTime,
            available: slot.available,
          })),
      };
    }

    return { slots: [] };
  } catch (error) {
    logger.error('[ReZ-Ride-REZSchedule] Availability error:', error);
    return { slots: [], error: 'Failed to fetch availability' };
  }
}

// Cancel scheduled ride
export async function cancelScheduledRide(
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
        body: JSON.stringify({ reason: reason || 'Ride cancelled by user' }),
      }
    );

    const data = await response.json();
    return { success: data.success, error: data.error };
  } catch (error) {
    return { success: false, error: 'Failed to cancel ride' };
  }
}

// Reschedule ride
export async function rescheduleRide(
  bookingUid: string,
  newScheduledTime: string
): Promise<{ success: boolean; newBookingUid?: string; error?: string }> {
  try {
    const newStartTime = new Date(newScheduledTime);
    const newEndTime = new Date(newStartTime.getTime() + 30 * 60000); // 30 min default

    const response = await fetch(
      `${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/bookings/${bookingUid}/reschedule`,
      {
        method: 'PATCH',
        headers: {
          'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newStartTime: newStartTime.toISOString(),
          newEndTime: newEndTime.toISOString(),
        }),
      }
    );

    const data = await response.json();

    if (data.success && data.data) {
      return { success: true, newBookingUid: data.data.uid };
    }

    return { success: false, error: data.error || 'Failed to reschedule' };
  } catch (error) {
    return { success: false, error: 'Failed to reschedule ride' };
  }
}

// Get user's scheduled rides
export async function getUserScheduledRides(userId: string): Promise<{
  upcoming: ScheduledRideResponse[];
  past: ScheduledRideResponse[];
}> {
  try {
    // In real implementation, query REZ-schedule-service for user's bookings
    // This is a placeholder
    return { upcoming: [], past: [] };
  } catch (error) {
    return { upcoming: [], past: [] };
  }
}

// Setup event types for each vehicle type (called during setup)
export async function setupReZRideEventTypes(): Promise<void> {
  const eventTypes = [
    { type: 'bike', title: 'Bike Ride', duration: 30, price: 15 },
    { type: 'auto', title: 'Auto Ride', duration: 30, price: 25 },
    { type: 'sedan', title: 'Sedan Ride', duration: 60, price: 40 },
    { type: 'suv', title: 'SUV Ride', duration: 60, price: 60 },
    { type: 'premium', title: 'Premium Ride', duration: 60, price: 100 },
  ];

  for (const vehicle of eventTypes) {
    try {
      await fetch(`${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/event-types`, {
        method: 'POST',
        headers: {
          'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: `rezride_${vehicle.type}`,
          title: vehicle.title,
          description: `Book a ${vehicle.title.toLowerCase()} in advance`,
          duration: vehicle.duration,
          locationType: 'CUSTOM_LINK',
          price: vehicle.price,
          currency: 'INR',
          paidBooking: false,
          requiresConfirmation: true,
        }),
      });
    } catch (error) {
      logger.error(`[ReZ-Ride] Failed to create event type: ${vehicle.type}`, error);
    }
  }
}

// Express routes for scheduled rides
export function scheduleRideRoutes(app: any): void {
  // Create scheduled ride
  app.post('/api/rides/schedule', async (req: Request, res: Response) => {
    const result = await createScheduledRide(req.body);
    res.json(result);
  });

  // Get driver availability
  app.get('/api/rides/availability', async (req: Request, res: Response) => {
    const { vehicleType, date } = req.query;
    const result = await getDriverAvailability(
      vehicleType as keyof typeof VEHICLE_EVENT_TYPES,
      date as string
    );
    res.json(result);
  });

  // Cancel scheduled ride
  app.delete('/api/rides/schedule/:bookingUid', async (req: Request, res: Response) => {
    const result = await cancelScheduledRide(req.params.bookingUid, req.body.reason);
    res.json(result);
  });

  // Reschedule ride
  app.patch('/api/rides/schedule/:bookingUid', async (req: Request, res: Response) => {
    const result = await rescheduleRide(req.params.bookingUid, req.body.newTime);
    res.json(result);
  });

  // Get user's scheduled rides
  app.get('/api/rides/scheduled/:userId', async (req: Request, res: Response) => {
    const result = await getUserScheduledRides(req.params.userId);
    res.json(result);
  });
}
