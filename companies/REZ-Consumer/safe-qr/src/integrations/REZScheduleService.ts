/**
 * REZ Schedule Integration for Safe QR
 *
 * Safe QR has 15 emergency modes:
 * Pet, Personal, Device, Medical, Helmet, Child, Vehicle, Bicycle, Key,
 * Luggage, Home, Office, Event, Student, Package
 *
 * Integration with REZ-schedule-service for:
 * - Emergency service appointments
 * - Safety check-in scheduling
 * - Medical appointments
 * - Vehicle service booking
 * - Device repair scheduling
 */

const REZ_SCHEDULE_CONFIG = {
  apiBaseUrl: process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090',
  apiKey: process.env.REZ_SCHEDULE_API_KEY,
};

// Safe QR service modes and their scheduling needs
const SAFE_QR_MODES: Record<string, {
  name: string;
  needsScheduling: boolean;
  duration: number;
  eventSlug: string;
  description: string;
}> = {
  'medical': {
    name: 'Medical Emergency',
    needsScheduling: true,
    duration: 30,
    eventSlug: 'medical-appointment',
    description: 'Book medical consultation'
  },
  'vehicle': {
    name: 'Vehicle Service',
    needsScheduling: true,
    duration: 60,
    eventSlug: 'vehicle-service',
    description: 'Book vehicle service appointment'
  },
  'device': {
    name: 'Device Repair',
    needsScheduling: true,
    duration: 30,
    eventSlug: 'device-repair',
    description: 'Book device repair slot'
  },
  'home': {
    name: 'Home Security',
    needsScheduling: true,
    duration: 45,
    eventSlug: 'home-service',
    description: 'Book home security service'
  },
  'personal': {
    name: 'Personal Safety',
    needsScheduling: true,
    duration: 30,
    eventSlug: 'safety-consultation',
    description: 'Book safety consultation'
  },
  'child': {
    name: 'Child Safety',
    needsScheduling: true,
    duration: 30,
    eventSlug: 'child-safety',
    description: 'Book child safety session'
  },
  'event': {
    name: 'Event Safety',
    needsScheduling: true,
    duration: 60,
    eventSlug: 'event-planning',
    description: 'Book event safety planning'
  },
  'student': {
    name: 'Student Safety',
    needsScheduling: true,
    duration: 30,
    eventSlug: 'student-service',
    description: 'Book student safety service'
  },
  // Non-scheduling modes (information/alerts only)
  'pet': {
    name: 'Pet Safety',
    needsScheduling: false,
    duration: 0,
    eventSlug: '',
    description: 'Pet safety information'
  },
  'helmet': {
    name: 'Helmet Check',
    needsScheduling: false,
    duration: 0,
    eventSlug: '',
    description: 'Helmet safety reminder'
  },
  'bicycle': {
    name: 'Bicycle Safety',
    needsScheduling: false,
    duration: 0,
    eventSlug: '',
    description: 'Bicycle safety information'
  },
  'key': {
    name: 'Key Safety',
    needsScheduling: false,
    duration: 0,
    eventSlug: '',
    description: 'Key safety information'
  },
  'luggage': {
    name: 'Luggage Safety',
    needsScheduling: false,
    duration: 0,
    eventSlug: '',
    description: 'Luggage tracking'
  },
  'office': {
    name: 'Office Safety',
    needsScheduling: false,
    duration: 0,
    eventSlug: '',
    description: 'Office safety information'
  },
  'package': {
    name: 'Package Safety',
    needsScheduling: false,
    duration: 0,
    eventSlug: '',
    description: 'Package tracking'
  },
};

// Get Safe QR modes that need scheduling
export function getSchedulingModes(): Array<{
  mode: string;
  name: string;
  description: string;
  duration: number;
}> {
  return Object.entries(SAFE_QR_MODES)
    .filter(([, config]) => config.needsScheduling)
    .map(([mode, config]) => ({
      mode,
      name: config.name,
      description: config.description,
      duration: config.duration,
    }));
}

// Get all Safe QR modes
export function getAllModes(): Array<{
  mode: string;
  name: string;
  description: string;
  hasScheduling: boolean;
}> {
  return Object.entries(SAFE_QR_MODES).map(([mode, config]) => ({
    mode,
    name: config.name,
    description: config.description,
    hasScheduling: config.needsScheduling,
  }));
}

// Book appointment for safe QR mode
export async function bookSafeQRAppointment(params: {
  mode: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  preferredDate: string;
  preferredTime: string;
  emergencyLevel: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
}): Promise<{
  success: boolean;
  bookingUid?: string;
  confirmationId?: string;
  scheduledTime?: string;
  error?: string;
}> {
  const modeConfig = SAFE_QR_MODES[params.mode];

  if (!modeConfig || !modeConfig.needsScheduling) {
    return { success: false, error: 'This mode does not support booking' };
  }

  try {
    const startTime = new Date(`${params.preferredDate}T${params.preferredTime}`);
    const endTime = new Date(startTime.getTime() + modeConfig.duration * 60000);

    const response = await fetch(`${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
      },
      body: JSON.stringify({
        eventTypeId: `safeqr_${params.mode}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        attendeeName: params.userName,
        attendeeEmail: params.userEmail,
        attendeePhone: params.userPhone,
        timezone: 'Asia/Kolkata',
        responses: {
          safeQRMode: params.mode,
          userId: params.userId,
          emergencyLevel: params.emergencyLevel,
          notes: params.notes,
          source: 'safe-qr',
        },
        idempotencyKey: `safeqr_${params.mode}_${params.userId}_${startTime.toISOString()}`,
      }),
    });

    const data = await response.json();

    if (data.success && data.data) {
      return {
        success: true,
        bookingUid: data.data.uid,
        confirmationId: `SQ-${params.mode.slice(0, 3).toUpperCase()}-${data.data.uid.slice(-6).toUpperCase()}`,
        scheduledTime: startTime.toISOString(),
      };
    }

    return { success: false, error: data.error || 'Failed to create booking' };
  } catch (error) {
    console.error('[SafeQR-REZSchedule] Error:', error);
    return { success: false, error: 'Service unavailable' };
  }
}

// Get availability for Safe QR service
export async function getSafeQRAvailability(
  mode: string,
  startDate: string,
  endDate: string
): Promise<{
  success: boolean;
  slots?: Array<{
    time: string;
    startTime: string;
    endTime: string;
    available: boolean;
  }>;
  error?: string;
}> {
  const modeConfig = SAFE_QR_MODES[mode];

  if (!modeConfig || !modeConfig.needsScheduling) {
    return { success: false, error: 'Scheduling not available for this mode' };
  }

  try {
    const response = await fetch(
      `${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/availability/safeqr/${mode}?` +
      new URLSearchParams({ startDate, endDate }),
      {
        headers: {
          'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
        },
      }
    );

    const data = await response.json();

    if (data.success && data.data?.slots) {
      return {
        success: true,
        slots: data.data.slots.map((slot: { startTime: string; endTime: string; available: boolean }) => ({
          time: new Date(slot.startTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          startTime: slot.startTime,
          endTime: slot.endTime,
          available: slot.available,
        })),
      };
    }

    return { success: false, error: 'No slots available' };
  } catch (error) {
    console.error('[SafeQR-REZSchedule] Availability error:', error);
    return { success: false, error: 'Failed to fetch availability' };
  }
}

// Create emergency alert (no scheduling)
export function createEmergencyAlert(params: {
  mode: string;
  userId: string;
  userLocation: { lat: number; lng: number; address: string };
  contactName: string;
  contactPhone: string;
  notes?: string;
}): {
  alertId: string;
  status: 'sent';
  message: string;
} {
  // In real implementation, this would trigger notifications
  return {
    alertId: `alert_${Date.now()}`,
    status: 'sent',
    message: `Emergency alert sent to ${params.contactName}`,
  };
}

// Get Safe QR booking status
export async function getSafeQRBookingStatus(bookingUid: string): Promise<{
  success: boolean;
  status?: string;
  scheduledTime?: string;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/bookings/${bookingUid}`,
      {
        headers: {
          'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
        },
      }
    );

    const data = await response.json();

    if (data.success && data.data) {
      return {
        success: true,
        status: data.data.status,
        scheduledTime: data.data.startTime,
      };
    }

    return { success: false, error: data.error || 'Booking not found' };
  } catch (error) {
    return { success: false, error: 'Failed to fetch status' };
  }
}

// Cancel Safe QR booking
export async function cancelSafeQRBooking(
  bookingUid: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/bookings/${bookingUid}/cancel`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
        },
        body: JSON.stringify({
          reason: reason || 'Cancelled via Safe QR',
          notifyHost: false,
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

// Quick status check - does mode need scheduling?
export function modeNeedsScheduling(mode: string): boolean {
  const config = SAFE_QR_MODES[mode];
  return config?.needsScheduling ?? false;
}
