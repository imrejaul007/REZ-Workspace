/**
 * REZ Restaurant Booking Service
 *
 * Table reservation and dining appointment booking:
 * - Restaurant reservations
 * - Private dining
 * - Chef's table
 * - Event bookings
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'rez-restaurant-service',
    timestamp: new Date().toISOString(),
  });
});

// Restaurant types
const RESTAURANT_TYPES = {
  casual: { name: 'Casual Dining', duration: 90, avgPrice: 500 },
  fine: { name: 'Fine Dining', duration: 120, avgPrice: 2000 },
  cafe: { name: 'Cafe', duration: 60, avgPrice: 300 },
  bar: { name: 'Bar & Lounge', duration: 90, avgPrice: 800 },
  rooftop: { name: 'Rooftop', duration: 120, avgPrice: 1500 },
  buffet: { name: 'Buffet', duration: 90, avgPrice: 800 },
};

// Party sizes
const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20];

// Get restaurant info
app.get('/api/restaurant/:restaurantId', (req: Request, res: Response) => {
  const { restaurantId } = req.params;

  // Mock restaurant data
  res.json({
    success: true,
    data: {
      id: restaurantId,
      name: 'The Gourmet Kitchen',
      cuisine: 'Multi-cuisine',
      type: 'fine',
      address: '123 Food Street, Mumbai',
      rating: 4.5,
      reviews: 234,
      priceRange: '₹₹₹',
      openingHours: {
        lunch: '12:00 - 15:00',
        dinner: '19:00 - 23:00',
      },
      amenities: ['AC', 'WiFi', 'Parking', 'Wheelchair'],
      seatingTypes: ['Indoor', 'Outdoor', 'Rooftop', 'Private'],
    },
  });
});

// Get available time slots
app.get('/api/restaurant/:restaurantId/slots', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const { date, partySize, seatingType } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      error: 'Date is required',
    });
  }

  const restaurant = RESTAURANT_TYPES.casual;
  const slots = generateRestaurantSlots(
    date as string,
    restaurant.duration,
    parseInt(partySize as string) || 2
  );

  res.json({
    success: true,
    data: {
      restaurantId,
      date,
      partySize: parseInt(partySize as string) || 2,
      seatingType: seatingType || 'Indoor',
      slots,
    },
  });
});

// Create reservation
app.post('/api/reservations', async (req: Request, res: Response) => {
  const {
    restaurantId,
    date,
    time,
    partySize,
    guestName,
    guestEmail,
    guestPhone,
    seatingType,
    occasion,
    specialRequests,
  } = req.body;

  if (!restaurantId || !date || !time || !guestName || !guestEmail) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
    });
  }

  try {
    // Try to create via REZ-schedule-service
    const REZ_SCHEDULE_API = process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090';

    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + 90 * 60000); // 90 min default

    const response = await fetch(`${REZ_SCHEDULE_API}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.REZ_SCHEDULE_API_KEY || '',
      },
      body: JSON.stringify({
        eventTypeId: `restaurant_${restaurantId}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        attendeeName: guestName,
        attendeeEmail: guestEmail,
        attendeePhone: guestPhone,
        timezone: 'Asia/Kolkata',
        responses: {
          restaurantId,
          partySize,
          seatingType,
          occasion,
          specialRequests,
        },
        idempotencyKey: `restaurant_${restaurantId}_${date}_${time}_${guestEmail}`,
      }),
    });

    const data = await response.json();

    if (data.success) {
      return res.status(201).json({
        success: true,
        data: {
          reservationUid: data.data.uid,
          confirmationId: `RES-${Date.now().toString(36).toUpperCase()}`,
          restaurantId,
          date,
          time,
          partySize,
          guestName,
          status: 'CONFIRMED',
        },
      });
    }
  } catch {
    // Fall through to mock response
  }

  // Mock response for demo
  res.status(201).json({
    success: true,
    data: {
      reservationUid: `mock_${Date.now()}`,
      confirmationId: `RES-${Date.now().toString(36).toUpperCase()}`,
      restaurantId,
      date,
      time,
      partySize,
      guestName,
      status: 'CONFIRMED',
      tableNumber: Math.floor(Math.random() * 20) + 1,
      specialInstructions: 'Please arrive 10 minutes early',
    },
  });
});

// Get reservation
app.get('/api/reservations/:reservationId', async (req: Request, res: Response) => {
  const { reservationId } = req.params;

  try {
    const REZ_SCHEDULE_API = process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090';

    const response = await fetch(
      `${REZ_SCHEDULE_API}/api/bookings/${reservationId}`,
      {
        headers: {
          'X-API-Key': process.env.REZ_SCHEDULE_API_KEY || '',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
  } catch {
    // Fall through to mock
  }

  res.json({
    success: true,
    data: {
      uid: reservationId,
      status: 'CONFIRMED',
      restaurantId: 'rest-001',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      partySize: 4,
      guestName: 'John Doe',
    },
  });
});

// Cancel reservation
app.patch('/api/reservations/:reservationId/cancel', async (req: Request, res: Response) => {
  const { reservationId } = req.params;
  const { reason } = req.body;

  try {
    const REZ_SCHEDULE_API = process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090';

    await fetch(`${REZ_SCHEDULE_API}/api/bookings/${reservationId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.REZ_SCHEDULE_API_KEY || '',
      },
      body: JSON.stringify({ reason: reason || 'Cancelled by guest' }),
    });
  } catch {
    // Continue to mock response
  }

  res.json({
    success: true,
    message: 'Reservation cancelled',
  });
});

// Modify reservation
app.patch('/api/reservations/:reservationId/modify', async (req: Request, res: Response) => {
  const { reservationId } = req.params;
  const { date, time, partySize, seatingType } = req.body;

  res.json({
    success: true,
    data: {
      uid: reservationId,
      date,
      time,
      partySize,
      seatingType,
      status: 'MODIFIED',
    },
  });
});

// Get party sizes
app.get('/api/party-sizes', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: PARTY_SIZES,
  });
});

// Get seating types
app.get('/api/seating-types', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: ['Indoor', 'Outdoor', 'Rooftop', 'Private', 'Window', 'Bar'],
  });
});

// Get occasions
app.get('/api/occasions', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      'Birthday',
      'Anniversary',
      'Date Night',
      'Business Meal',
      'Family Gathering',
      'Celebration',
      'Casual',
      'Other',
    ],
  });
});

// Generate restaurant slots
function generateRestaurantSlots(
  date: string,
  duration: number,
  partySize: number
): unknown[] {
  const slots = [];
  const baseDate = new Date(date);
  const isLunch = true; // Could be dynamic

  // Lunch slots: 12:00 - 15:00
  for (let hour = 12; hour < 15; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const startTime = new Date(baseDate);
      startTime.setHours(hour, minute, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      if (startTime < new Date()) continue;

      const available = Math.random() > 0.3;
      const tablesAvailable = available ? Math.floor(Math.random() * 5) + 1 : 0;

      slots.push({
        time: startTime.toTimeString().slice(0, 5),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        available,
        tablesAvailable,
      });
    }
  }

  // Dinner slots: 19:00 - 22:00
  for (let hour = 19; hour < 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const startTime = new Date(baseDate);
      startTime.setHours(hour, minute, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      if (startTime < new Date()) continue;

      const available = Math.random() > 0.4;
      const tablesAvailable = available ? Math.floor(Math.random() * 3) + 1 : 0;

      slots.push({
        time: startTime.toTimeString().slice(0, 5),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        available,
        tablesAvailable,
      });
    }
  }

  return slots;
}

// Start server
const PORT = process.env.PORT || 4092;

app.listen(PORT, () => {
  console.log(`[Restaurant] REZ Restaurant Service running on port ${PORT}`);
});

export default app;
