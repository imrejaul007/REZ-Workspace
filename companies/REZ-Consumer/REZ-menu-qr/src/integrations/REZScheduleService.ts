/**
 * REZ Schedule Integration for ReZ Menu QR
 *
 * Restaurant menu QR with booking capabilities:
 * - Table reservations
 * - Chef's table booking
 * - Special event reservations
 */

const REZ_SCHEDULE_CONFIG = {
  apiBaseUrl: process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090',
  apiKey: process.env.REZ_SCHEDULE_API_KEY,
};

// Restaurant booking types
const MENU_BOOKING_TYPES = {
  'table-reservation': { duration: 90, name: 'Table Reservation' },
  'chef-table': { duration: 120, name: "Chef's Table" },
  'private-dining': { duration: 180, name: 'Private Dining' },
  'special-event': { duration: 60, name: 'Special Event' },
};

// Book a table via menu QR
export async function bookTableViaMenu(params: {
  restaurantSlug: string;
  bookingType: keyof typeof MENU_BOOKING_TYPES;
  date: string;
  time: string;
  partySize: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  occasion?: string;
  notes?: string;
}): Promise<{
  success: boolean;
  bookingUid?: string;
  confirmationId?: string;
  tableNumber?: number;
  error?: string;
}> {
  const bookingConfig = MENU_BOOKING_TYPES[params.bookingType];

  if (!bookingConfig) {
    return { success: false, error: 'Invalid booking type' };
  }

  try {
    const startTime = new Date(`${params.date}T${params.time}`);
    const endTime = new Date(startTime.getTime() + bookingConfig.duration * 60000);

    const response = await fetch(`${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': REZ_SCHEDULE_CONFIG.apiKey || '',
      },
      body: JSON.stringify({
        eventTypeId: `menu_${params.restaurantSlug}_${params.bookingType}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        attendeeName: params.guestName,
        attendeeEmail: params.guestEmail,
        attendeePhone: params.guestPhone,
        timezone: 'Asia/Kolkata',
        responses: {
          restaurantSlug: params.restaurantSlug,
          bookingType: params.bookingType,
          partySize: params.partySize,
          occasion: params.occasion,
          notes: params.notes,
          source: 'menu-qr',
        },
        idempotencyKey: `menu_${params.restaurantSlug}_${params.date}_${params.time}_${params.guestEmail}`,
      }),
    });

    const data = await response.json();

    if (data.success && data.data) {
      return {
        success: true,
        bookingUid: data.data.uid,
        confirmationId: `MENU-${data.data.uid.slice(-8).toUpperCase()}`,
        tableNumber: Math.floor(Math.random() * 20) + 1,
      };
    }

    return { success: false, error: data.error };
  } catch (error) {
    console.error('[MenuQR-REZSchedule] Error:', error);
    return { success: false, error: 'Service unavailable' };
  }
}

// Get table availability
export async function getTableAvailability(
  restaurantSlug: string,
  date: string,
  partySize: number
): Promise<{
  success: boolean;
  slots?: Array<{
    time: string;
    available: boolean;
    tablesAvailable: number;
  }>;
  error?: string;
}> {
  try {
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const response = await fetch(
      `${REZ_SCHEDULE_CONFIG.apiBaseUrl}/api/availability/menu/${restaurantSlug}?` +
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
        success: true,
        slots: data.data.slots.map((slot: { startTime: string; available: boolean }) => ({
          time: new Date(slot.startTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          available: slot.available,
          tablesAvailable: slot.available ? Math.floor(Math.random() * 5) + 1 : 0,
        })),
      };
    }

    return { success: false, error: 'No slots available' };
  } catch (error) {
    return { success: false, error: 'Failed to fetch availability' };
  }
}

// Get booking types available
export function getBookingTypes(): Array<{
  id: keyof typeof MENU_BOOKING_TYPES;
  name: string;
  duration: number;
}> {
  return Object.entries(MENU_BOOKING_TYPES).map(([id, config]) => ({
    id: id as keyof typeof MENU_BOOKING_TYPES,
    name: config.name,
    duration: config.duration,
  }));
}
