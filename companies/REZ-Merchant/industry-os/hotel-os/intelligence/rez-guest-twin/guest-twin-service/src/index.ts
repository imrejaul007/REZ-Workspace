import { logger } from '../../shared/logger';
/**
 * Guest Twin Service
 *
 * Per-guest AI twin that personalizes hotel experiences.
 * Part of The Invisible Hotel story.
 *
 * Port: 4764
 */

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { GuestTwin, IGuestTwin, IStayRecord, IStayPreference } from './models/GuestTwin.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Config
const PORT = parseInt(process.env.PORT || '4764', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/guest-twins';

// External Services
const GENIE_MEMORY_URL = process.env.GENIE_MEMORY_URL || 'http://localhost:4703';
const TWINOS_URL = process.env.TWINOS_URL || 'http://localhost:4760';
const STAYOWN_API = process.env.STAYOWN_API || 'http://localhost:4015';

// =============================================================================
// HELPERS
// =============================================================================

function generateTwinId(guestId: string): string {
  return `TWIN-GUEST-${guestId}`;
}

function calculateLoyaltyScore(stays: IStayRecord[]): number {
  if (stays.length === 0) return 50;

  const avgSatisfaction = stays.reduce((sum, s) => sum + (s.satisfaction || 3), 0) / stays.length;
  const stayCountBonus = Math.min(30, stays.length * 3);
  const recentBonus = stays[0]?.checkInDate &&
    (Date.now() - new Date(stays[0].checkInDate).getTime()) < 90 * 24 * 60 * 60 * 1000 ? 10 : 0;

  return Math.min(100, Math.round(avgSatisfaction * 15 + stayCountBonus + recentBonus));
}

function inferPreferences(stays: IStayRecord[]): IStayPreference {
  const prefs: IStayPreference = {};

  // Infer from stay patterns
  if (stays.length >= 2) {
    // Floor preference (higher floor = higher room number pattern)
    const avgRoomNum = stays.reduce((sum, s) => sum + (parseInt(s.roomType.replace(/\D/g, '')) || 0, 0) / stays.length;
    if (avgRoomNum > 500) prefs.floorPreference = 'high';
    else if (avgRoomNum > 200) prefs.floorPreference = 'any';

    // Stay duration
    const avgDuration = stays.reduce((sum, s) => {
      const checkIn = new Date(s.checkInDate);
      const checkOut = s.checkOutDate ? new Date(s.checkOutDate) : new Date();
      return sum + (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
    }, 0) / stays.length;

    if (avgDuration <= 1) {
      prefs.earlyCheckIn = true;
      prefs.lateCheckOut = true;
    }
  }

  return prefs;
}

function detectPatterns(stays: IStayRecord[]): { pattern: string; confidence: number }[] {
  const patterns: { pattern: string; confidence: number }[] = [];

  if (stays.length < 2) return patterns;

  // Business vs leisure pattern
  const businessRatio = stays.filter(s => s.purpose === 'business').length / stays.length;
  if (businessRatio > 0.7) {
    patterns.push({ pattern: 'frequent_business_traveler', confidence: 0.85 });
  } else if (businessRatio < 0.3) {
    patterns.push({ pattern: 'leisure_traveler', confidence: 0.75 });
  }

  // Weekday vs weekend
  const weekdayStays = stays.filter(s => {
    const day = new Date(s.checkInDate).getDay();
    return day >= 1 && day <= 5;
  }).length;
  if (weekdayStays / stays.length > 0.7) {
    patterns.push({ pattern: 'weekday_traveler', confidence: 0.8 });
  }

  // High value
  const avgSpent = stays.reduce((sum, s) => sum + (s.spent || 0), 0) / stays.length;
  if (avgSpent > 10000) {
    patterns.push({ pattern: 'high_value_guest', confidence: 0.9 });
  }

  return patterns;
}

// =============================================================================
// ROUTES
// =============================================================================

/**
 * Health check
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'guest-twin-service',
    version: '1.0.0',
    tagline: 'Hotel Guest Personalization',
    timestamp: new Date().toISOString()
  });
});

/**
 * Create or get Guest Twin
 */
app.post('/twins', async (req, res) => {
  try {
    const { guestId, name, email, phone, nationality, company } = req.body;

    if (!guestId) {
      return res.status(400).json({ error: 'guestId is required' });
    }

    const twinId = generateTwinId(guestId);

    // Check if exists
    let twin = await GuestTwin.findOne({ twinId });

    if (twin) {
      return res.json({ twin, created: false });
    }

    // Create new twin
    twin = new GuestTwin({
      twinId,
      guestId,
      name,
      email,
      phone,
      nationality,
      company,
      stays: [],
      preferences: {},
      preferencePatterns: [],
      metrics: {
        stayCount: 0,
        totalNights: 0,
        loyaltyScore: 50,
        avgSatisfaction: 0,
        avgRoomRate: 0,
        totalSpent: 0,
        travelFrequency: 0,
        preferredDestinations: [],
        preferredRoomTypes: []
      },
      insights: {
        riskOfChurn: 0.5
      },
      privacy: {
        shareWithHotel: true,
        shareWithPartners: false,
        marketingConsent: false
      }
    });

    await twin.save();

    res.status(201).json({ twin, created: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Guest Twin
 */
app.get('/twins/:twinId', async (req, res) => {
  try {
    const twin = await GuestTwin.findOne({ twinId: req.params.twinId });

    if (!twin) {
      return res.status(404).json({ error: 'Twin not found' });
    }

    res.json({ twin });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Guest Twin by guestId
 */
app.get('/twins/guest/:guestId', async (req, res) => {
  try {
    const twinId = generateTwinId(req.params.guestId);
    const twin = await GuestTwin.findOne({ twinId });

    if (!twin) {
      // Create new twin
      const twinData = new GuestTwin({
        twinId,
        guestId: req.params.guestId,
        stays: [],
        preferences: {},
        preferencePatterns: [],
        metrics: {
          stayCount: 0,
          totalNights: 0,
          loyaltyScore: 50,
          travelFrequency: 0,
          preferredDestinations: [],
          preferredRoomTypes: []
        },
        insights: {
          riskOfChurn: 0.5
        }
      });
      await twinData.save();
      return res.json({ twin: twinData, created: true });
    }

    res.json({ twin });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add stay record
 */
app.post('/twins/:twinId/stays', async (req, res) => {
  try {
    const { hotelId, hotelName, roomType, checkInDate, checkOutDate, satisfaction, feedback, purpose, spent } = req.body;

    const twin = await GuestTwin.findOne({ twinId: req.params.twinId });
    if (!twin) {
      return res.status(404).json({ error: 'Twin not found' });
    }

    // Add stay
    const stay: IStayRecord = {
      hotelId,
      hotelName,
      roomType,
      checkInDate: new Date(checkInDate),
      checkOutDate: checkOutDate ? new Date(checkOutDate) : undefined,
      satisfaction: satisfaction || 3,
      feedback,
      purpose: purpose || 'business',
      spent: spent || 0
    };

    twin.stays.push(stay);

    // Update metrics
    twin.metrics.stayCount = twin.stays.length;
    twin.metrics.lastStay = new Date(checkInDate);

    if (checkOutDate) {
      const duration = (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24);
      twin.metrics.totalNights += duration;
    }

    twin.metrics.totalSpent += spent || 0;
    twin.metrics.avgRoomRate = twin.metrics.totalSpent / twin.metrics.totalNights;

    // Recalculate satisfaction
    const totalSat = twin.stays.reduce((sum, s) => sum + (s.satisfaction || 3), 0);
    twin.metrics.avgSatisfaction = totalSat / twin.stays.length;

    // Loyalty score
    twin.metrics.loyaltyScore = calculateLoyaltyScore(twin.stays);

    // Infer preferences
    const inferredPrefs = inferPreferences(twin.stays);
    twin.preferences = { ...twin.preferences, ...inferredPrefs };

    // Detect patterns
    const patterns = detectPatterns(twin.stays);
    twin.preferencePatterns = patterns.map(p => ({
      category: 'behavior',
      preference: p.pattern,
      confidence: p.confidence,
      source: 'implicit' as const,
      lastUpdated: new Date()
    }));

    // Update insights
    twin.insights.riskOfChurn = twin.stays.length < 3 ? 0.7 : twin.stays.length > 5 ? 0.2 : 0.5;
    twin.insights.prediction = twin.stays.length > 3 ? 'likely_to_return' : 'new_guest';
    twin.insights.nextBestOffer = twin.metrics.loyaltyScore > 70 ? 'free_upgrade' : 'late_checkout';

    await twin.save();

    res.json({ twin, stay });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get personalized recommendations
 */
app.get('/twins/:twinId/recommendations', async (req, res) => {
  try {
    const twin = await GuestTwin.findOne({ twinId: req.params.twinId });

    if (!twin) {
      return res.status(404).json({ error: 'Twin not found' });
    }

    const recommendations: any = {
      guestId: twin.guestId,
      loyaltyTier: twin.metrics.loyaltyScore >= 80 ? 'platinum' :
                   twin.metrics.loyaltyScore >= 60 ? 'gold' :
                   twin.metrics.loyaltyScore >= 40 ? 'silver' : 'bronze',
      personalization: {
        preferredFloor: twin.preferences.floorPreference,
        quietRoom: twin.preferences.quietRoom,
        dietaryRequirements: twin.preferences.dietaryRequirements,
        earlyCheckIn: twin.preferences.earlyCheckIn,
        lateCheckOut: twin.preferences.lateCheckOut,
        pillowType: twin.preferences.pillowType,
        temperature: twin.preferences.temperature
      },
      offers: twin.insights.nextBestOffer ?
        [{ type: twin.insights.nextBestOffer, priority: 'high' }] : [],
      insights: twin.insights,
      metrics: {
        stayCount: twin.metrics.stayCount,
        loyaltyScore: twin.metrics.loyaltyScore,
        avgSatisfaction: twin.metrics.avgSatisfaction
      }
    };

    res.json({ recommendations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get stay history
 */
app.get('/twins/:twinId/stays', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const twin = await GuestTwin.findOne({ twinId: req.params.twinId });

    if (!twin) {
      return res.status(404).json({ error: 'Twin not found' });
    }

    const stays = twin.stays
      .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime())
      .slice(0, Number(limit));

    res.json({ stays, total: twin.stays.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update preferences
 */
app.patch('/twins/:twinId/preferences', async (req, res) => {
  try {
    const twin = await GuestTwin.findOne({ twinId: req.params.twinId });

    if (!twin) {
      return res.status(404).json({ error: 'Twin not found' });
    }

    const { preferences } = req.body;
    twin.preferences = { ...twin.preferences, ...preferences };

    // Add explicit preference patterns
    if (preferences) {
      Object.entries(preferences).forEach(([key, value]) => {
        twin.preferencePatterns.push({
          category: 'preference',
          preference: `${key}:${value}`,
          confidence: 0.95, // Explicit preferences have high confidence
          source: 'explicit',
          lastUpdated: new Date()
        });
      });
    }

    await twin.save();

    res.json({ twin });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Privacy settings
 */
app.patch('/twins/:twinId/privacy', async (req, res) => {
  try {
    const twin = await GuestTwin.findOne({ twinId: req.params.twinId });

    if (!twin) {
      return res.status(404).json({ error: 'Twin not found' });
    }

    const { privacy } = req.body;
    twin.privacy = { ...twin.privacy, ...privacy };
    await twin.save();

    res.json({ twin });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export twin data
 */
app.get('/twins/:twinId/export', async (req, res) => {
  try {
    const twin = await GuestTwin.findOne({ twinId: req.params.twinId });

    if (!twin) {
      return res.status(404).json({ error: 'Twin not found' });
    }

    // Respect privacy settings
    const exportData = {
      twinId: twin.twinId,
      guestId: twin.guestId,
      name: twin.name,
      preferences: twin.privacy.shareWithHotel ? twin.preferences : {},
      stayCount: twin.stays.length,
      metrics: twin.metrics,
      exportedAt: new Date().toISOString()
    };

    res.json({ data: exportData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Search twins by pattern
 */
app.get('/twins/search', async (req, res) => {
  try {
    const { loyaltyMin, loyaltyMax, pattern, destination } = req.query;

    const query: any = {};

    if (loyaltyMin || loyaltyMax) {
      query['metrics.loyaltyScore'] = {};
      if (loyaltyMin) query['metrics.loyaltyScore'].$gte = Number(loyaltyMin);
      if (loyaltyMax) query['metrics.loyaltyScore'].$lte = Number(loyaltyMax);
    }

    if (pattern) {
      query['preferencePatterns.preference'] = { $regex: pattern as string, $options: 'i' };
    }

    const twins = await GuestTwin.find(query)
      .select('twinId guestId name metrics preferences')
      .limit(50);

    res.json({ twins, count: twins.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// WEBHOOKS (from other services)
// =============================================================================

/**
 * Receive booking confirmation
 */
app.post('/webhooks/booking', async (req, res) => {
  try {
    const { guestId, hotelId, checkInDate, checkOutDate, roomType } = req.body;

    // Find or create twin
    const twinId = generateTwinId(guestId);
    let twin = await GuestTwin.findOne({ twinId });

    if (!twin) {
      twin = new GuestTwin({
        twinId,
        guestId,
        stays: [],
        preferences: {},
        metrics: {
          stayCount: 0,
          totalNights: 0,
          loyaltyScore: 50,
          travelFrequency: 0,
          preferredDestinations: [],
          preferredRoomTypes: []
        }
      });
    }

    // Pre-populate upcoming stay
    twin.stays.push({
      hotelId,
      roomType,
      checkInDate: new Date(checkInDate),
      checkOutDate: checkOutDate ? new Date(checkOutDate) : undefined,
      satisfaction: 0,
      purpose: 'business'
    });

    // Track destination preference
    if (!twin.metrics.preferredDestinations.includes(hotelId)) {
      twin.metrics.preferredDestinations.push(hotelId);
    }

    await twin.save();

    res.json({ success: true, twin });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Receive checkout feedback
 */
app.post('/webhooks/checkout', async (req, res) => {
  try {
    const { guestId, satisfaction, feedback, spent } = req.body;

    const twinId = generateTwinId(guestId);
    const twin = await GuestTwin.findOne({ twinId });

    if (!twin) {
      return res.status(404).json({ error: 'Twin not found' });
    }

    // Update most recent stay
    if (twin.stays.length > 0) {
      const lastStay = twin.stays[twin.stays.length - 1];
      if (lastStay.satisfaction === 0) {
        lastStay.satisfaction = satisfaction || 3;
        lastStay.feedback = feedback;
        lastStay.spent = spent || 0;

        // Update metrics
        twin.metrics.avgSatisfaction =
          twin.stays.reduce((sum, s) => sum + (s.satisfaction || 0), 0) / twin.stays.length;
        twin.metrics.loyaltyScore = calculateLoyaltyScore(twin.stays);
      }
    }

    await twin.save();

    res.json({ success: true, twin });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// START
// =============================================================================

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`🏨 Guest Twin Service running on port ${PORT}`);
      logger.info(`   Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('❌ Failed to start:', error);
    process.exit(1);
  }
}

start();
