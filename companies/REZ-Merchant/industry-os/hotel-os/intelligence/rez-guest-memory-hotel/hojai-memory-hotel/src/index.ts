/**
 * HOJAI Memory Hotel Service
 * Port: 4720
 *
 * Centralized guest memory and preference layer.
 * Connects Guest Twin to HOJAI Memory for cross-stay learning.
 *
 * Features:
 * - Guest preference memory (room, service, dietary)
 * - Stay history with insights
 * - Pattern detection across stays
 * - Memory sync with HOJAI Core
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const PORT = process.env.PORT || 4720;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-memory-hotel';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const JWT_SECRET = process.env.JWT_SECRET || 'hojai-memory-secret';
const HOJAI_CORE_URL = process.env.HOJAI_CORE_URL || 'http://localhost:4500';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

let redis: RedisClientType;

// Types
interface GuestPreference {
  category: 'room' | 'service' | 'dietary' | 'transport' | 'general';
  key: string;
  value: any;
  confidence: number;
  source: 'explicit' | 'inferred' | 'historical';
  firstObserved: Date;
  lastUpdated: Date;
}

interface StayMemory {
  stayId: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  checkIn: Date;
  checkOut: Date;
  totalSpent: number;
  servicesUsed: string[];
  rating?: number;
  feedback?: string;
  notes: string[];
}

interface Pattern {
  type: 'checkin_time' | 'checkout_time' | 'room_type' | 'service_preference' | 'dietary' | 'transport';
  frequency: number;
  avgValue: any;
  confidence: number;
  lastObserved: Date;
}

interface GuestMemory {
  guestId: string;
  name: string;
  email: string;
  phone: string;
  preferences: GuestPreference[];
  stays: StayMemory[];
  patterns: Pattern[];
  lifetimeValue: number;
  stayCount: number;
  avgRating: number;
  createdAt: Date;
  updatedAt: Date;
}

// Schemas
const GuestMemorySchema = new mongoose.Schema({
  guestId: { type: String, required: true, unique: true },
  name: String,
  email: String,
  phone: String,
  preferences: [{
    category: String,
    key: String,
    value: mongoose.Schema.Types.Mixed,
    confidence: { type: Number, default: 0.5 },
    source: { type: String, enum: ['explicit', 'inferred', 'historical'], default: 'historical' },
    firstObserved: Date,
    lastUpdated: Date
  }],
  stays: [{
    stayId: String,
    hotelId: String,
    roomId: String,
    roomNumber: String,
    checkIn: Date,
    checkOut: Date,
    totalSpent: Number,
    servicesUsed: [String],
    rating: Number,
    feedback: String,
    notes: [String]
  }],
  patterns: [{
    type: String,
    frequency: Number,
    avgValue: mongoose.Schema.Types.Mixed,
    confidence: Number,
    lastObserved: Date
  }],
  lifetimeValue: { type: Number, default: 0 },
  stayCount: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },
  hojaiMemoryId: String // Link to HOJAI Core memory
}, { timestamps: true });

const HotelMemorySchema = new mongoose.Schema({
  hotelId: { type: String, required: true, unique: true },
  name: String,
  guestCount: { type: Number, default: 0 },
  avgStayValue: { type: Number, default: 0 },
  popularPreferences: [{
    category: String,
    key: String,
    count: Number
  }],
  insights: [{
    type: String,
    description: String,
    createdAt: Date
  }]
});

const GuestMemoryModel = mongoose.model('GuestMemory', GuestMemorySchema);
const HotelMemoryModel = mongoose.model('HotelMemory', HotelMemorySchema);

const app = express();
app.use(cors());
app.use(express.json());

const authMiddleware = async (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).hotelId = decoded.hotelId;
    (req as any).guestId = decoded.guestId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'hojai-memory-hotel', port: PORT });
});

// Create or get guest memory
app.post('/guests', async (req: Request, res: Response) => {
  try {
    const { guestId, name, email, phone, hotelId } = req.body;

    let memory = await GuestMemoryModel.findOne({ guestId });

    if (!memory) {
      memory = new GuestMemoryModel({
        guestId,
        name,
        email,
        phone
      });
      await memory.save();

      // Sync to HOJAI Core
      await syncToHojaiCore(guestId, 'guest_profile', { guestId, name, email, phone });
    }

    // Update hotel memory
    await updateHotelMemory(hotelId, 'guest_added');

    logger.info('Guest memory created', { guestId });
    res.status(201).json({ success: true, memory });
  } catch (error: any) {
    logger.error('Failed to create guest memory', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get guest memory
app.get('/guests/:guestId', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;

    // Try cache first
    const cached = await redis.get(`memory:guest:${guestId}`);
    if (cached) {
      return res.json({ memory: JSON.parse(cached), source: 'cache' });
    }

    const memory = await GuestMemoryModel.findOne({ guestId });
    if (!memory) return res.status(404).json({ error: 'Guest memory not found' });

    // Cache for quick access
    await redis.setEx(`memory:guest:${guestId}`, 3600, JSON.stringify(memory));

    res.json({ memory, source: 'database' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update guest preference
app.post('/guests/:guestId/preferences', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const { category, key, value, source = 'explicit', confidence = 1.0 } = req.body;

    const memory = await GuestMemoryModel.findOne({ guestId });
    if (!memory) return res.status(404).json({ error: 'Guest memory not found' });

    // Find existing or create new
    const existingIdx = memory.preferences.findIndex(
      p => p.category === category && p.key === key
    );

    if (existingIdx >= 0) {
      memory.preferences[existingIdx].value = value;
      memory.preferences[existingIdx].confidence = Math.max(
        memory.preferences[existingIdx].confidence,
        confidence
      );
      memory.preferences[existingIdx].lastUpdated = new Date();
    } else {
      memory.preferences.push({
        category,
        key,
        value,
        confidence,
        source,
        firstObserved: new Date(),
        lastUpdated: new Date()
      });
    }

    await memory.save();

    // Sync to HOJAI Core
    await syncToHojaiCore(guestId, 'preference_update', { category, key, value });

    // Update cache
    await redis.setEx(`memory:guest:${guestId}`, 3600, JSON.stringify(memory));

    logger.info('Preference updated', { guestId, category, key });

    res.json({ success: true, preference: memory.preferences[existingIdx >= 0 ? existingIdx : memory.preferences.length - 1] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get guest preferences
app.get('/guests/:guestId/preferences', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const { category } = req.query;

    const memory = await GuestMemoryModel.findOne({ guestId });
    if (!memory) return res.status(404).json({ error: 'Guest memory not found' });

    let preferences = memory.preferences;

    if (category) {
      preferences = preferences.filter(p => p.category === category);
    }

    // Sort by confidence (highest first)
    preferences.sort((a, b) => b.confidence - a.confidence);

    res.json({ preferences });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record stay
app.post('/guests/:guestId/stays', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const { stayId, hotelId, roomId, roomNumber, checkIn, checkOut, totalSpent, servicesUsed, rating, feedback } = req.body;

    const memory = await GuestMemoryModel.findOne({ guestId });
    if (!memory) return res.status(404).json({ error: 'Guest memory not found' });

    // Add stay
    memory.stays.push({
      stayId: stayId || `STAY_${uuidv4().substring(0, 8)}`,
      hotelId,
      roomId,
      roomNumber,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      totalSpent,
      servicesUsed: servicesUsed || [],
      rating,
      feedback,
      notes: []
    });

    // Update aggregates
    memory.stayCount = memory.stays.length;
    memory.lifetimeValue = memory.stays.reduce((sum, s) => sum + (s.totalSpent || 0), 0);

    if (rating) {
      const ratings = memory.stays.filter(s => s.rating).map(s => s.rating!);
      memory.avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    }

    // Infer preferences from stay
    await inferPreferences(memory, servicesUsed || []);

    await memory.save();

    // Sync to HOJAI Core
    await syncToHojaiCore(guestId, 'stay_completed', {
      stayId,
      hotelId,
      totalSpent,
      rating
    });

    // Update hotel memory
    await updateHotelMemory(hotelId, 'stay_recorded', { totalSpent, rating });

    // Update cache
    await redis.setEx(`memory:guest:${guestId}`, 3600, JSON.stringify(memory));

    logger.info('Stay recorded', { guestId, stayId });

    res.json({ success: true, memory });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get stay history
app.get('/guests/:guestId/stays', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const { hotelId, limit = 10 } = req.query;

    const memory = await GuestMemoryModel.findOne({ guestId });
    if (!memory) return res.status(404).json({ error: 'Guest memory not found' });

    let stays = memory.stays;
    if (hotelId) {
      stays = stays.filter(s => s.hotelId === hotelId);
    }

    // Sort by most recent first
    stays.sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());

    res.json({
      stays: stays.slice(0, Number(limit)),
      totalStays: stays.length,
      lifetimeValue: memory.lifetimeValue,
      avgRating: memory.avgRating
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get patterns
app.get('/guests/:guestId/patterns', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;

    const memory = await GuestMemoryModel.findOne({ guestId });
    if (!memory) return res.status(404).json({ error: 'Guest memory not found' });

    // Calculate patterns if not exists
    if (memory.patterns.length === 0) {
      memory.patterns = calculatePatterns(memory);
      await memory.save();
    }

    res.json({ patterns: memory.patterns });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get AI recommendations based on memory
app.get('/guests/:guestId/recommendations', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const { context = 'general' } = req.query;

    const memory = await GuestMemoryModel.findOne({ guestId });
    if (!memory) return res.status(404).json({ error: 'Guest memory not found' });

    const recommendations: any[] = [];

    // Room preferences
    const roomPrefs = memory.preferences.filter(p => p.category === 'room');
    if (roomPrefs.length > 0) {
      recommendations.push({
        type: 'room_preference',
        message: `Guest prefers: ${roomPrefs.map(p => `${p.key}: ${p.value}`).join(', ')}`,
        confidence: roomPrefs.reduce((sum, p) => sum + p.confidence, 0) / roomPrefs.length
      });
    }

    // Dietary preferences
    const dietaryPrefs = memory.preferences.filter(p => p.category === 'dietary');
    if (dietaryPrefs.length > 0) {
      recommendations.push({
        type: 'dietary',
        message: `Dietary needs: ${dietaryPrefs.map(p => p.value).join(', ')}`,
        confidence: dietaryPrefs.reduce((sum, p) => sum + p.confidence, 0) / dietaryPrefs.length
      });
    }

    // Service patterns
    const patterns = memory.patterns.filter(p => p.type === 'service_preference');
    if (patterns.length > 0) {
      recommendations.push({
        type: 'service_suggestion',
        message: `Based on history: ${patterns[0].avgValue}`,
        confidence: patterns[0].confidence
      });
    }

    // VIP indicator
    if (memory.avgRating >= 4.5 || memory.stayCount >= 5) {
      recommendations.push({
        type: 'vip_treatment',
        message: 'High-value guest - offer premium services',
        confidence: 0.95
      });
    }

    res.json({ recommendations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get hotel-level insights
app.get('/hotels/:hotelId/insights', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;

    let hotelMemory = await HotelMemoryModel.findOne({ hotelId });

    if (!hotelMemory) {
      // Create new hotel memory
      hotelMemory = new HotelMemoryModel({ hotelId });
      await hotelMemory.save();
    }

    // Calculate insights from guest memories
    const guests = await GuestMemoryModel.find({
      'stays.hotelId': hotelId
    });

    const insights: any[] = [];

    // Popular preferences
    const allPrefs: Record<string, number> = {};
    guests.forEach(g => {
      g.preferences.forEach(p => {
        const key = `${p.category}:${p.key}`;
        allPrefs[key] = (allPrefs[key] || 0) + 1;
      });
    });

    hotelMemory.popularPreferences = Object.entries(allPrefs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => {
        const [category, prefKey] = key.split(':');
        return { category, key: prefKey, count };
      });

    // Average stay value
    const totalSpent = guests.reduce((sum, g) => sum + g.lifetimeValue, 0);
    hotelMemory.avgStayValue = totalSpent / Math.max(guests.length, 1);
    hotelMemory.guestCount = guests.length;

    await hotelMemory.save();

    res.json({
      hotelId,
      guestCount: hotelMemory.guestCount,
      avgStayValue: hotelMemory.avgStayValue,
      popularPreferences: hotelMemory.popularPreferences,
      insights
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Sync memory to HOJAI Core
async function syncToHojaiCore(guestId: string, eventType: string, data: any): Promise<void> {
  try {
    // In production: POST to HOJAI Core memory service
    // await fetch(`${HOJAI_CORE_URL}/api/memory/store`, {...})

    logger.info('Syncing to HOJAI Core', { guestId, eventType });
  } catch (error) {
    logger.warn('Failed to sync to HOJAI Core', { error });
  }
}

// Update hotel-level memory
async function updateHotelMemory(hotelId: string, eventType: string, data?: any): Promise<void> {
  try {
    let hotelMemory = await HotelMemoryModel.findOne({ hotelId });

    if (!hotelMemory) {
      hotelMemory = new HotelMemoryModel({ hotelId });
    }

    hotelMemory.guestCount = await GuestMemoryModel.countDocuments({
      'stays.hotelId': hotelId
    });

    await hotelMemory.save();
  } catch (error) {
    logger.warn('Failed to update hotel memory', { error });
  }
}

// Infer preferences from services used
async function inferPreferences(memory: any, servicesUsed: string[]): Promise<void> {
  const preferenceMappings: Record<string, { category: string; key: string; value: any }> = {
    'room_service': { category: 'service', key: 'room_service', value: 'high_usage' },
    'spa': { category: 'service', key: 'spa', value: 'uses_spa' },
    'restaurant': { category: 'dietary', key: 'dining', value: 'uses_hotel_restaurant' },
    'laundry': { category: 'service', key: 'laundry', value: 'uses_laundry' },
    'taxi': { category: 'transport', key: 'taxi', value: 'prefers_hotel_taxi' },
    'gym': { category: 'room', key: 'gym_usage', value: 'fitness_oriented' }
  };

  servicesUsed.forEach(service => {
    const mapping = preferenceMappings[service];
    if (mapping) {
      const existing = memory.preferences.find(
        p => p.category === mapping.category && p.key === mapping.key
      );

      if (existing) {
        existing.confidence = Math.min(existing.confidence + 0.1, 0.95);
        existing.lastUpdated = new Date();
      } else {
        memory.preferences.push({
          ...mapping,
          confidence: 0.6,
          source: 'inferred',
          firstObserved: new Date(),
          lastUpdated: new Date()
        });
      }
    }
  });
}

// Calculate patterns from stay history
function calculatePatterns(memory: any): Pattern[] {
  const patterns: Pattern[] = [];

  if (memory.stays.length < 2) return patterns;

  // Check-in time pattern
  const checkInHours = memory.stays.map(s => new Date(s.checkIn).getHours());
  if (checkInHours.length > 0) {
    const avgHour = checkInHours.reduce((sum, h) => sum + h, 0) / checkInHours.length;
    patterns.push({
      type: 'checkin_time',
      frequency: memory.stays.length,
      avgValue: Math.round(avgHour),
      confidence: 0.8,
      lastObserved: new Date()
    });
  }

  // Room type pattern
  const roomTypes = memory.stays.map(s => s.roomNumber);
  const mostCommonRoom = roomTypes.sort((a, b) =>
    roomTypes.filter(v => v === a).length - roomTypes.filter(v => v === b).length
  ).pop();

  if (mostCommonRoom) {
    patterns.push({
      type: 'room_type',
      frequency: memory.stays.length,
      avgValue: mostCommonRoom,
      confidence: 0.7,
      lastObserved: new Date()
    });
  }

  return patterns;
}

// Start server
async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    redis = createClient({ url: REDIS_URL });
    await redis.connect();
    logger.info('Connected to Redis');

    app.listen(PORT, () => {
      logger.info(`HOJAI Memory Hotel Service started on port ${PORT}`);
      logger.info(🧠 HOJAI Memory Hotel running on port ${PORT}`);
    });
  } catch (error: any) {
    logger.error('Failed to start', { error: error.message });
    process.exit(1);
  }
}

start();