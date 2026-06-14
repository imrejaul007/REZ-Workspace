/**
 * HOJAI Memory - Guest Memory Service
 * Port: 4520
 *
 * Production-ready guest preference and history storage with MongoDB
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import mongoose from 'mongoose';

// Configuration
const PORT = parseInt(process.env.PORT || '4520', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-memory';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Logger setup
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Express app
const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.debug('Incoming request', { method: req.method, path: req.path });
  next();
});

// ============================================
// MONGODB SCHEMAS
// ============================================

// Guest Memory Schema
const memorySchema = new mongoose.Schema({
  guestId: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['stay', 'service', 'preference', 'feedback', 'interaction'] },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  metadata: {
    hotelId: String,
    roomId: String,
    staffId: String,
    source: { type: String, default: 'system' },
  },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

memorySchema.index({ guestId: 1, createdAt: -1 });
memorySchema.index({ guestId: 1, type: 1 });

const Memory = mongoose.model('Memory', memorySchema);

// Guest Preferences Schema
const preferencesSchema = new mongoose.Schema({
  guestId: { type: String, required: true, unique: true, index: true },
  hotelId: String,
  preferences: {
    room: {
      temperature: Number,
      pillowType: String,
      bedType: String,
      floorPreference: String,
      quietRoom: Boolean,
    },
    dietary: {
      restrictions: [String],
      likes: [String],
      allergies: [String],
    },
    amenities: [String],
    language: { type: String, default: 'en' },
    celebration: Boolean,
    lateCheckout: Boolean,
    earlyCheckin: Boolean,
  },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Preferences = mongoose.model('Preferences', preferencesSchema);

// Guest Pattern Schema (computed insights)
const patternSchema = new mongoose.Schema({
  guestId: { type: String, required: true, unique: true, index: true },
  patterns: [{
    type: { type: String, required: true },
    confidence: Number,
    description: String,
    data: mongoose.Schema.Types.Mixed,
    detectedAt: Date,
  }],
  stayCount: { type: Number, default: 0 },
  totalSpend: { type: Number, default: 0 },
  favoriteServices: [String],
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

const Pattern = mongoose.model('Pattern', patternSchema);

// ============================================
// DATABASE CONNECTION
// ============================================

let isConnected = false;

async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });
  } catch (error) {
    isConnected = false;
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    // Don't exit - allow in-memory fallback for development
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// In-memory fallback for development
const inMemoryMemories: Map<string, any[]> = new Map();
const inMemoryPreferences: Map<string, any> = new Map();
const inMemoryPatterns: Map<string, any> = new Map();

// ============================================
// HEALTH ENDPOINTS
// ============================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'hojai-memory',
    version: '1.0.0',
    database: isConnected ? 'MongoDB' : 'in-memory',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', (_req: Request, res: Response) => {
  const ready = isConnected;
  res.status(ready ? 200 : 503).json({
    ready,
    database: isConnected ? 'connected' : 'disconnected',
  });
});

// ============================================
// MEMORY ENDPOINTS
// ============================================

/**
 * Store guest memory
 */
app.post('/guests/:guestId/memory', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const { type, data, metadata } = req.body;

    if (!type || !data) {
      return res.status(400).json({ error: 'type and data are required' });
    }

    if (isConnected) {
      const memory = new Memory({ guestId, type, data, metadata });
      await memory.save();

      // Update patterns
      await updatePatterns(guestId, type, data);

      logger.info('Memory stored', { guestId, type });
      return res.json({ success: true, id: memory._id, count: await Memory.countDocuments({ guestId }) });
    } else {
      // In-memory fallback
      const existing = inMemoryMemories.get(guestId) || [];
      const newMemory = { _id: `mem_${Date.now()}`, guestId, type, data, metadata, timestamp: new Date() };
      existing.push(newMemory);
      inMemoryMemories.set(guestId, existing);

      logger.warn('Using in-memory storage (not production-ready)', { guestId });
      return res.json({ success: true, id: newMemory._id, count: existing.length, warning: 'in-memory' });
    }
  } catch (error) {
    logger.error('Failed to store memory', { error: (error as Error).message });
    return res.status(500).json({ error: 'Failed to store memory' });
  }
});

/**
 * Get guest memory
 */
app.get('/guests/:guestId/memory', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const { type, limit = '50', startDate, endDate } = req.query;

    const query: any = { guestId };
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const limitNum = parseInt(limit as string, 10);

    if (isConnected) {
      const memories = await Memory.find(query)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .lean();

      return res.json({ guestId, memories, count: memories.length });
    } else {
      let mems = inMemoryMemories.get(guestId) || [];
      if (type) mems = mems.filter((m) => m.type === type);
      mems = mems.slice(-limitNum);
      return res.json({ guestId, memories: mems, count: mems.length, warning: 'in-memory' });
    }
  } catch (error) {
    logger.error('Failed to get memory', { error: (error as Error).message });
    return res.status(500).json({ error: 'Failed to get memory' });
  }
});

/**
 * Get memory summary/stats
 */
app.get('/guests/:guestId/memory/summary', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;

    if (isConnected) {
      const [total, byType] = await Promise.all([
        Memory.countDocuments({ guestId }),
        Memory.aggregate([
          { $match: { guestId } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
      ]);

      return res.json({
        guestId,
        total,
        byType: byType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      });
    } else {
      const mems = inMemoryMemories.get(guestId) || [];
      const byType: Record<string, number> = {};
      mems.forEach((m) => { byType[m.type] = (byType[m.type] || 0) + 1; });
      return res.json({ guestId, total: mems.length, byType, warning: 'in-memory' });
    }
  } catch (error) {
    logger.error('Failed to get memory summary', { error: (error as Error).message });
    return res.status(500).json({ error: 'Failed to get memory summary' });
  }
});

// ============================================
// PREFERENCES ENDPOINTS
// ============================================

/**
 * Store preferences
 */
app.post('/guests/:guestId/preferences', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const newPrefs = req.body;

    if (isConnected) {
      const prefs = await Preferences.findOneAndUpdate(
        { guestId },
        { $set: { preferences: newPrefs, updatedAt: new Date() } },
        { upsert: true, new: true, runValidators: true }
      );

      logger.info('Preferences updated', { guestId });
      return res.json({ success: true, preferences: prefs.preferences });
    } else {
      const merged = { ...inMemoryPreferences.get(guestId), ...newPrefs, updatedAt: new Date() };
      inMemoryPreferences.set(guestId, merged);
      logger.warn('Using in-memory preferences (not production-ready)', { guestId });
      return res.json({ success: true, preferences: merged, warning: 'in-memory' });
    }
  } catch (error) {
    logger.error('Failed to update preferences', { error: (error as Error).message });
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * Get preferences
 */
app.get('/guests/:guestId/preferences', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;

    if (isConnected) {
      const prefs = await Preferences.findOne({ guestId }).lean();
      return res.json({ guestId, preferences: prefs?.preferences || {} });
    } else {
      return res.json({ guestId, preferences: inMemoryPreferences.get(guestId) || {}, warning: 'in-memory' });
    }
  } catch (error) {
    logger.error('Failed to get preferences', { error: (error as Error).message });
    return res.status(500).json({ error: 'Failed to get preferences' });
  }
});

/**
 * Merge/update specific preference fields
 */
app.patch('/guests/:guestId/preferences', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const updates = req.body;

    if (isConnected) {
      const existing = await Preferences.findOne({ guestId });
      if (!existing) {
        return res.status(404).json({ error: 'Preferences not found' });
      }

      // Deep merge
      const mergedPreferences = {
        ...existing.preferences,
        ...Object.fromEntries(
          Object.entries(updates).map(([key, value]) => [
            key,
            typeof value === 'object' && !Array.isArray(value)
              ? { ...((existing.preferences as any)[key] || {}), ...(value as object) }
              : value,
          ])
        ),
      };

      existing.preferences = mergedPreferences as any;
      existing.updatedAt = new Date();
      await existing.save();

      return res.json({ success: true, preferences: existing.preferences });
    } else {
      const existing = inMemoryPreferences.get(guestId) || {};
      const merged = { ...existing, ...updates, updatedAt: new Date() };
      inMemoryPreferences.set(guestId, merged);
      return res.json({ success: true, preferences: merged, warning: 'in-memory' });
    }
  } catch (error) {
    logger.error('Failed to patch preferences', { error: (error as Error).message });
    return res.status(500).json({ error: 'Failed to patch preferences' });
  }
});

// ============================================
// PATTERNS ENDPOINTS
// ============================================

/**
 * Detect patterns
 */
app.get('/guests/:guestId/patterns', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;

    if (isConnected) {
      const patterns = await Pattern.findOne({ guestId }).lean();
      if (!patterns) {
        return res.json({ guestId, patterns: [], stayCount: 0 });
      }
      return res.json({ guestId, patterns: patterns.patterns, stayCount: patterns.stayCount });
    } else {
      return res.json({ guestId, patterns: inMemoryPatterns.get(guestId) || [], warning: 'in-memory' });
    }
  } catch (error) {
    logger.error('Failed to get patterns', { error: (error as Error).message });
    return res.status(500).json({ error: 'Failed to get patterns' });
  }
});

// ============================================
// RECOMMENDATIONS ENDPOINTS
// ============================================

/**
 * Get recommendations based on guest history
 */
app.get('/guests/:guestId/recommendations', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const recommendations: any[] = [];

    if (isConnected) {
      const [prefs, patterns, recentMemories] = await Promise.all([
        Preferences.findOne({ guestId }).lean(),
        Pattern.findOne({ guestId }).lean(),
        Memory.find({ guestId }).sort({ createdAt: -1 }).limit(20).lean(),
      ]);

      // Based on preferences
      if (prefs?.preferences?.celebration) {
        recommendations.push({
          type: 'celebration_package',
          title: 'Celebration Setup',
          description: 'Room decoration and special amenities for your celebration',
          confidence: 0.9,
        });
      }

      // Based on patterns
      if (patterns?.favoriteServices?.includes('spa')) {
        recommendations.push({
          type: 'spa_reminder',
          title: 'Book Spa Again?',
          description: 'You enjoyed our spa last time. Book a session?',
          confidence: 0.8,
        });
      }

      // Based on recent activity
      const services = recentMemories.filter((m) => m.type === 'service');
      const minibar = services.filter((s) => (s.data as any).service === 'minibar');
      if (minibar.length > 0) {
        recommendations.push({
          type: 'minibar_topup',
          title: 'Refill Minibar?',
          description: 'Your minibar might need restocking',
          confidence: 0.7,
        });
      }

      return res.json({ guestId, recommendations });
    } else {
      return res.json({ guestId, recommendations, warning: 'in-memory' });
    }
  } catch (error) {
    logger.error('Failed to get recommendations', { error: (error as Error).message });
    return res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// ============================================
// SEARCH ENDPOINT
// ============================================

/**
 * Search memories
 */
app.post('/memory/search', async (req: Request, res: Response) => {
  try {
    const { guestId, query, type, startDate, endDate, limit = '50' } = req.body;

    if (!guestId) {
      return res.status(400).json({ error: 'guestId is required' });
    }

    const limitNum = parseInt(limit, 10);
    const searchQuery: any = { guestId };

    if (type) searchQuery.type = type;
    if (startDate || endDate) {
      searchQuery.createdAt = {};
      if (startDate) searchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) searchQuery.createdAt.$lte = new Date(endDate);
    }

    if (isConnected) {
      let memories = await Memory.find(searchQuery)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .lean();

      // Text search if query provided
      if (query) {
        const lowerQuery = query.toLowerCase();
        memories = memories.filter((m) =>
          JSON.stringify(m.data).toLowerCase().includes(lowerQuery) ||
          JSON.stringify(m.metadata).toLowerCase().includes(lowerQuery)
        );
      }

      return res.json({ results: memories, count: memories.length });
    } else {
      let mems = inMemoryMemories.get(guestId) || [];
      if (type) mems = mems.filter((m) => m.type === type);
      if (query) {
        const lowerQuery = query.toLowerCase();
        mems = mems.filter((m) =>
          JSON.stringify(m.data).toLowerCase().includes(lowerQuery)
        );
      }
      return res.json({ results: mems.slice(-limitNum), count: mems.length, warning: 'in-memory' });
    }
  } catch (error) {
    logger.error('Failed to search memories', { error: (error as Error).message });
    return res.status(500).json({ error: 'Failed to search memories' });
  }
});

// ============================================
// GUEST JOURNEY (Unified View)
// ============================================

/**
 * Get complete guest journey
 */
app.get('/guests/:guestId/journey', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;

    if (isConnected) {
      const [preferences, patterns, memories] = await Promise.all([
        Preferences.findOne({ guestId }).lean(),
        Pattern.findOne({ guestId }).lean(),
        Memory.find({ guestId }).sort({ createdAt: -1 }).limit(100).lean(),
      ]);

      return res.json({
        guestId,
        preferences: preferences?.preferences || null,
        patterns: patterns?.patterns || [],
        journey: memories.map((m) => ({
          type: m.type,
          data: m.data,
          timestamp: m.createdAt,
        })),
        stats: {
          totalMemories: memories.length,
          stayCount: patterns?.stayCount || 0,
          favoriteServices: patterns?.favoriteServices || [],
        },
      });
    } else {
      return res.json({
        guestId,
        preferences: inMemoryPreferences.get(guestId) || null,
        patterns: inMemoryPatterns.get(guestId)?.patterns || [],
        journey: inMemoryMemories.get(guestId) || [],
        warning: 'in-memory',
      });
    }
  } catch (error) {
    logger.error('Failed to get guest journey', { error: (error as Error).message });
    return res.status(500).json({ error: 'Failed to get guest journey' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function updatePatterns(guestId: string, type: string, data: any): Promise<void> {
  try {
    const patterns = await Pattern.findOne({ guestId });
    const now = new Date();

    if (!patterns) {
      const newPattern = new Pattern({
        guestId,
        patterns: [],
        stayCount: 0,
      });
      await newPattern.save();
    }

    // Update based on memory type
    await Pattern.findOneAndUpdate(
      { guestId },
      { lastUpdated: now }
    );

    if (type === 'stay') {
      await Pattern.findOneAndUpdate(
        { guestId },
        { $inc: { stayCount: 1 } }
      );
    }

    if (type === 'service' && data?.service) {
      await Pattern.findOneAndUpdate(
        { guestId },
        { $addToSet: { favoriteServices: data.service } }
      );
    }
  } catch (error) {
    logger.error('Failed to update patterns', { error: (error as Error).message, guestId });
  }
}

// ============================================
// ERROR HANDLER
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  if (isConnected) {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  }
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// START SERVER
// ============================================

async function start(): Promise<void> {
  await connectDatabase();

  app.listen(PORT, () => {
    logger.info(`
╔═══════════════════════════════════════════════════════════╗
║           HOJAI Memory Service v1.0.0             ║
╠═══════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                            ║
║  Database: ${isConnected ? 'MongoDB ✅' : 'In-Memory ⚠️'}                             ║
║  Mode:     ${NODE_ENV}                                        ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

start();

export { app };