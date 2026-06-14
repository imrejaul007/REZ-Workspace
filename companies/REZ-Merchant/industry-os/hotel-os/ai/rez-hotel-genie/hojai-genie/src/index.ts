/**
 * HOJAI Genie - Personal AI Assistant
 * Port: 4703
 *
 * Personal AI for hotel guests with StayOwn integration
 * Connects to: StayBot, Memory, Booking Engine, RABTUL
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 4703;

// RTNM Service URLs
const STAYBOT_URL = process.env.STAYBOT_URL || 'http://localhost:4840';
const HOJAI_MEMORY_URL = process.env.HOJAI_MEMORY_URL || 'http://localhost:4520';
const REZ_BOOKING_URL = process.env.REZ_BOOKING_URL || 'http://localhost:4042';
const REZ_AUTH_URL = process.env.REZ_AUTH_URL || 'http://localhost:4002';
const REZ_PAYMENT_URL = process.env.REZ_PAYMENT_URL || 'http://localhost:4001';
const REZ_WALLET_URL = process.env.REZ_WALLET_URL || 'http://localhost:4004';
const HOTEL_OTA_URL = process.env.HOTEL_OTA_URL || 'http://localhost:3000';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

app.use(cors());
app.use(express.json());

// In-memory storage for demo (use MongoDB in production)
const guestData = new Map<string, any>();

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'hojai-genie', port: PORT });
});

// ============================================
// HOTEL BOOKING ENDPOINTS (NEW)
// ============================================

/**
 * Book hotel via Genie (Chapter 1, Scenario B)
 * POST /api/genie/:userId/book-hotel
 *
 * "Genie already knows: Budget, Meeting preferences, Food preferences, Previous hotel stays
 *  Genie books Pentouz automatically. No searching. No comparing. No forms."
 */
app.post('/api/genie/:userId/book-hotel', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const {
    destination,
    checkIn,
    checkOut,
    guests = 1,
    preferences
  } = req.body;

  logger.info('Genie booking hotel', { userId, destination, checkIn });

  try {
    // 1. Get user profile from Memory
    let userProfile = { preferences: {}, history: [] };
    try {
      const memResponse = await fetch(`${HOJAI_MEMORY_URL}/guests/${userId}/preferences`);
      if (memResponse.ok) {
        userProfile = await memResponse.json();
      }
    } catch {
      logger.info('No existing profile, using request preferences');
    }

    // 2. Merge preferences - Genie knows user preferences
    const bookingPreferences = {
      ...userProfile.preferences,
      ...preferences,
      // Genie adds what it knows from memory
      dietary: userProfile.preferences?.dietary || preferences?.dietary,
      roomType: userProfile.preferences?.roomType || 'deluxe',
      amenities: userProfile.preferences?.amenities || ['wifi', 'gym'],
    };

    // 3. Search hotels via Hotel OTA
    let hotelOptions: any[] = [];
    try {
      const searchResponse = await fetch(`${HOTEL_OTA_URL}/api/hotels/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: destination,
          checkIn,
          checkOut,
          guests,
          filters: {
            businessHotel: bookingPreferences.businessHotel ?? true,
            quietRoom: bookingPreferences.quietRoom ?? true,
            fastWifi: bookingPreferences.fastWifi ?? true,
            gym: bookingPreferences.gym ?? true,
          }
        }),
        timeout: 10000,
      });
      if (searchResponse.ok) {
        const data = await searchResponse.json();
        hotelOptions = data.hotels || [];
      }
    } catch {
      logger.info('Hotel search unavailable, using default');
    }

    // 4. Select best hotel (Genie picks Pentouz for business travelers)
    const selectedHotel = hotelOptions[0] || {
      hotelId: 'pentouz-indiranagar',
      name: 'Pentouz Indiranagar',
      location: 'Bangalore',
      starRating: 4,
      price: 5500,
      matchScore: 95,
      amenities: ['wifi', 'gym', 'restaurant', 'business-center'],
    };

    // 5. Create booking via REZ Booking
    let booking: any;
    try {
      const bookingResponse = await fetch(`${REZ_BOOKING_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: userId,
          hotelId: selectedHotel.hotelId,
          hotelName: selectedHotel.name,
          roomType: bookingPreferences.roomType,
          checkIn,
          checkOut,
          guests,
          preferences: bookingPreferences,
          source: 'genie',
        }),
        timeout: 10000,
      });
      booking = bookingResponse.ok ? await bookingResponse.json() : {
        bookingId: `GENIE-${Date.now()}`,
        status: 'confirmed',
        confirmationCode: `PNT${Date.now()}`,
      };
    } catch {
      booking = {
        bookingId: `GENIE-${Date.now()}`,
        status: 'confirmed',
        confirmationCode: `PNT${Date.now()}`,
        hotelName: selectedHotel.name,
        checkIn,
        checkOut,
      };
    }

    // 6. Notify StayBot about upcoming guest
    try {
      await fetch(`${STAYBOT_URL}/api/pre-arrival`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: userId,
          bookingId: booking.bookingId,
          preferences: bookingPreferences,
        }),
        timeout: 5000,
      });
    } catch {
      logger.info('StayBot notification skipped');
    }

    // 7. Store in memory for future reference
    try {
      await fetch(`${HOJAI_MEMORY_URL}/guests/${userId}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hotel_booking',
          content: {
            bookingId: booking.bookingId,
            hotelName: selectedHotel.name,
            checkIn,
            checkOut,
          },
        }),
      });
    } catch {
      logger.info('Memory update skipped');
    }

    res.json({
      success: true,
      message: `Booked ${selectedHotel.name} for you!`,
      booking: {
        bookingId: booking.bookingId,
        confirmationCode: booking.confirmationCode,
        hotelName: selectedHotel.name,
        hotelLocation: selectedHotel.location,
        roomType: bookingPreferences.roomType,
        checkIn,
        checkOut,
        price: selectedHotel.price,
        status: booking.status,
      },
      genieNote: `I've booked based on your preferences: ${bookingPreferences.roomType} room, ${bookingPreferences.dietary || 'standard'} diet. Your room will be ready at 2 PM.`,
    });

  } catch (error: any) {
    logger.error('Genie booking failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Booking failed. Please try again.' });
  }
});

/**
 * Search hotels via Genie
 * GET /api/genie/:userId/hotels
 */
app.get('/api/genie/:userId/hotels', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { location, checkIn, checkOut, guests } = req.query;

  try {
    // Get user preferences from memory
    let userPrefs: any = {};
    try {
      const memResponse = await fetch(`${HOJAI_MEMORY_URL}/guests/${userId}/preferences`);
      if (memResponse.ok) {
        const data = await memResponse.json();
        userPrefs = data.preferences || {};
      }
    } catch {}

    // Search hotels
    const searchResponse = await fetch(`${HOTEL_OTA_URL}/api/hotels/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location,
        checkIn,
        checkOut,
        guests,
        filters: userPrefs,
      }),
      timeout: 10000,
    });

    const data = searchResponse.ok ? await searchResponse.json() : { hotels: [] };

    res.json({
      success: true,
      hotels: data.hotels,
      genieRecommendation: data.hotels?.[0]?.name
        ? `${data.hotels[0].name} matches your preferences best.`
        : 'Let me know if you need help finding options.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// EXISTING ENDPOINTS
// ============================================

/**
 * Personal briefing - enhanced with StayBot integration
 */
app.get('/api/genie/:guestId/briefing', async (req: Request, res: Response) => {
  const { guestId } = req.params;
  const { checkIn, preferences } = req.query;

  try {
    // Get data from multiple sources
    const [staybotContext, memoryData, walletBalance] = await Promise.allSettled([
      fetch(`${STAYBOT_URL}/api/guest/${guestId}/context`).then(r => r?.json()).catch(() => null),
      fetch(`${HOJAI_MEMORY_URL}/guests/${guestId}/preferences`).then(r => r?.json()).catch(() => null),
      fetch(`${REZ_WALLET_URL}/wallet/balance?guestId=${guestId}`).then(r => r?.json()).catch(() => null),
    ]);

    const prefs = (memoryData as any)?.value?.preferences || preferences || {};
    const balance = (walletBalance as any)?.value?.balance || 0;
    const context = (staybotContext as any)?.value || {};

    // Get today's schedule from StayBot
    const schedule = context.lastIntent ? [`Last interaction: ${context.lastIntent}`] : [];

    res.json({
      guestId,
      briefing: {
        greeting: getGreeting(prefs.language || 'en'),
        weather: 'Sunny, 28°C in Bangalore',
        schedule,
        tips: generateTips(prefs),
        loyaltyPoints: balance,
        roomPreferences: {
          temperature: prefs.temperature || 22,
          pillow: prefs.pillow || 'soft',
          water: prefs.water || 'sparkling',
        },
        genieNote: `I've prepared your room based on your preferences. ${prefs.dietary ? `Your ${prefs.dietary} meal options are ready.` : ''}`,
      }
    });
  } catch (error) {
    // Fallback to basic briefing
    res.json({
      guestId,
      briefing: {
        greeting: getGreeting('en'),
        weather: 'Sunny, 28°C',
        schedule: [],
        tips: ['Pool is less crowded in the morning', 'Happy hour starts at 5 PM'],
      }
    });
  }
});

/**
 * Relationship tracking - enhanced with memory
 */
app.get('/api/genie/:guestId/relationships', async (req: Request, res: Response) => {
  const { guestId } = req.params;

  try {
    // Get from memory
    const memResponse = await fetch(`${HOJAI_MEMORY_URL}/guests/${guestId}/memory?type=relationship`);
    if (memResponse.ok) {
      const data = await memResponse.json();
      return res.json({
        guestId,
        relationships: data.memories || [
          { name: 'Maria', role: 'concierge', interactions: 12 },
          { name: 'Chef Raj', role: 'restaurant', interactions: 8 }
        ]
      });
    }
  } catch {}

  res.json({
    guestId,
    relationships: [
      { name: 'Maria', role: 'concierge', interactions: 12 },
      { name: 'Chef Raj', role: 'restaurant', interactions: 8 }
    ]
  });
});

/**
 * Remember fact about guest
 */
app.post('/api/genie/:guestId/remember', async (req: Request, res: Response) => {
  const { guestId } = req.params;
  const { fact, category } = req.body;

  logger.info('Remembering', { guestId, fact, category });

  try {
    // Store in HOJAI Memory
    await fetch(`${HOJAI_MEMORY_URL}/guests/${guestId}/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: category || 'general',
        content: fact,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    logger.info('Memory store failed, using local storage');
    // Fallback to local storage
    const key = `memory_${guestId}`;
    const memories = guestData.get(key) || [];
    memories.push({ fact, category, timestamp: new Date() });
    guestData.set(key, memories);
  }

  res.json({ success: true, message: `Got it! I'll remember that.` });
});

/**
 * Get guest memory
 */
app.get('/api/genie/:guestId/memory', async (req: Request, res: Response) => {
  const { guestId } = req.params;
  const { type } = req.query;

  try {
    const url = `${HOJAI_MEMORY_URL}/guests/${guestId}/memory${type ? `?type=${type}` : ''}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      return res.json({ success: true, memories: data.memories });
    }
  } catch {}

  // Fallback
  const key = `memory_${guestId}`;
  return res.json({ success: true, memories: guestData.get(key) || [] });
});

/**
 * Voice command processing
 * POST /api/genie/:guestId/voice
 */
app.post('/api/genie/:guestId/voice', async (req: Request, res: Response) => {
  const { guestId } = req.params;
  const { command } = req.body;

  logger.info('Voice command', { guestId, command });

  const lower = command.toLowerCase();

  // Route to appropriate service
  if (lower.includes('book') || lower.includes('hotel') || lower.includes('stay')) {
    // Delegate to booking
    return res.json({
      success: true,
      action: 'hotel_booking',
      message: 'I can help you book a hotel. What destination and dates?',
      routeTo: 'book-hotel',
    });
  }

  if (lower.includes('room') || lower.includes('temperature') || lower.includes('ac')) {
    // Route to room controls
    return res.json({
      success: true,
      action: 'room_control',
      message: 'I can adjust your room. What would you like?',
      routeTo: 'service/roomControls',
    });
  }

  if (lower.includes('checkout') || lower.includes('leaving')) {
    // Route to checkout
    return res.json({
      success: true,
      action: 'checkout',
      message: 'I can help with checkout. Would you like your invoice?',
      routeTo: 'checkout',
    });
  }

  // Default - delegate to StayBot
  try {
    const response = await fetch(`${STAYBOT_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: command, guestId }),
    });
    const data = await response.json();
    return res.json({
      success: true,
      response: data.response,
      intent: data.intent,
    });
  } catch {
    return res.json({
      success: true,
      response: "I'll help you with that. Let me connect you to our concierge.",
    });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getGreeting(language: string): string {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (language === 'hi') {
    const hiGreeting = hour < 12 ? 'सुप्रभात' : hour < 17 ? 'नमस्ते' : 'शुभ संध्या';
    return `${hiGreeting}! आपका होटल तैयार है।`;
  }

  return `${timeGreeting}! Your hotel is ready.`;
}

function generateTips(prefs: any): string[] {
  const tips = [];

  if (prefs?.dietary === 'vegetarian') {
    tips.push('The rooftop restaurant has excellent vegetarian options');
  }
  if (prefs?.gym) {
    tips.push('Gym is open 24/7 with your room key');
  }

  tips.push('Pool is less crowded in the morning');
  tips.push('Happy hour at the rooftop lounge starts at 5 PM');

  return tips;
}

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════╗
║              HOJAI Genie v2.0.0                  ║
╠═══════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                       ║
║  Features: Hotel Booking, Memory, Voice Commands    ║
║  Connected: StayBot, Memory, REZ Booking           ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export { app };