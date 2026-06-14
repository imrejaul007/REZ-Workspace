/**
 * AdBazaar CDP - Customer Data Platform
 * Unified profile management across all touchpoints
 *
 * Port: 4961
 * Purpose: Collect, unify, and activate customer data from all channels
 *
 * Features:
 * - Multi-source data ingestion
 * - Identity resolution
 * - Profile unification
 * - Segment building
 * - Data activation
 * - Privacy compliance
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import axios from 'axios';
import crypto from 'crypto';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 4961;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/cdp.log' })
  ]
});

// Configuration
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';
const HASH_SECRET = process.env.HASH_SECRET || 'cdp-secret';

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests' }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(express.json({ limit: '10mb' }));
app.use(limiter);

// MongoDB Schemas

// Unified Customer Profile
const profileSchema = new mongoose.Schema({
  profileId: { type: String, unique: true, index: true },
  merchantId: { type: String, index: true },

  // Identity
  identifiers: [{
    type: { type: String }, // email, phone, device_id, cookie,external_id
    value: String,
    hash: String,
    source: String,
    firstSeen: Date,
    lastSeen: Date,
    verified: Boolean
  }],

  // Core attributes
  attributes: {
    demographics: {
      age: Number,
      gender: String,
      location: {
        city: String,
        state: String,
        country: String,
        pincode: String,
        lat: Number,
        lng: Number
      },
      language: String,
      timezone: String
    },
    firmographics: {
      company: String,
      industry: String,
      companySize: String,
      designation: String
    },
    behavioral: {
      totalPurchases: Number,
      totalSpent: Number,
      avgOrderValue: Number,
      firstPurchaseDate: Date,
      lastPurchaseDate: Date,
      purchaseFrequency: Number,
      preferredCategories: [String],
      preferredChannels: [String]
    },
    lifecycle: {
      status: String, // prospect, new, active, lapsed, churned
      stage: String,
      score: Number,
      churnRisk: String, // low, medium, high
      lifetimeValue: Number
    }
  },

  // Consent & Privacy
  consent: {
    email: { granted: Boolean, timestamp: Date },
    sms: { granted: Boolean, timestamp: Date },
    whatsapp: { granted: Boolean, timestamp: Date },
    push: { granted: Boolean, timestamp: Date },
    tracking: { granted: Boolean, timestamp: Date }
  },

  // Data sources
  sources: [{
    source: String,
    records: Number,
    lastSync: Date
  }],

  // Calculated scores
  scores: {
    engagement: Number,
    propensity: Number,
    rfm: Number
  },

  // Metadata
  createdAt: Date,
  updatedAt: Date,
  lastActivity: Date
}, { timestamps: true });

// Event Store (append-only)
const eventSchema = new mongoose.Schema({
  eventId: { type: String, unique: true, index: true },
  profileId: { type: String, index: true },
  merchantId: { type: String, index: true },

  event: {
    type: String, // page_view, add_to_cart, purchase, signup, etc.
    category: String,
    name: String,
    properties: mongoose.Schema.Types.Mixed
  },

  context: {
    channel: String, // web, mobile, app, in_store, call
    source: String,
    campaign: String,
    medium: String,
    referrer: String
  },

  location: {
    ip: String,
    userAgent: String,
    device: String,
    browser: String,
    os: String
  },

  timestamp: { type: Date, index: true },
  processed: Boolean,
  processedAt: Date
});

// Segment
const segmentSchema = new mongoose.Schema({
  segmentId: { type: String, unique: true, index: true },
  merchantId: { type: String, index: true },
  name: String,
  description: String,

  criteria: mongoose.Schema.TypesMixed,

  stats: {
    size: Number,
    lastCalculated: Date
  },

  status: String, // active, paused, archived
  createdAt: Date,
  updatedAt: Date
});

// Audience (activated segment)
const audienceSchema = new mongoose.Schema({
  audienceId: { type: String, unique: true, index: true },
  segmentId: String,
  merchantId: { type: String, index: true },
  name: String,

  destination: {
    type: String, // instagram, google, facebook, etc.
    config: mongoose.Schema.Types.Mixed
  },

  status: String,
  lastSync: Date,
  recordsSynced: Number,

  createdAt: Date
});

// Models
const Profile = mongoose.model('Profile', profileSchema);
const Event = mongoose.model('Event', eventSchema);
const Segment = mongoose.model('Segment', segmentSchema);
const Audience = mongoose.model('Audience', audienceSchema);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const mongoOk = mongoose.connection.readyState === 1;

  res.json({
    status: mongoOk ? 'healthy' : 'degraded',
    service: 'adbazaar-cdp',
    port: PORT,
    mongodb: mongoOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// DATA INGESTION
// ============================================

/**
 * Track event (pixel endpoint)
 * POST /api/track
 */
app.post('/api/track', async (req: Request, res: Response) => {
  try {
    const { event, context, location, profileId, merchantId } = req.body;

    const eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Create event record
    const eventRecord = new Event({
      eventId,
      profileId: profileId || 'anonymous',
      merchantId,
      event: event.type ? event : { type: 'unknown', name: event },
      context: context || {},
      location: {
        ip: location?.ip,
        userAgent: req.headers['user-agent'],
        device: detectDevice(req.headers['user-agent']),
        browser: detectBrowser(req.headers['user-agent']),
        os: detectOS(req.headers['user-agent'])
      },
      timestamp: new Date(),
      processed: false
    });

    await eventRecord.save();

    // Update profile with latest activity
    if (profileId) {
      await Profile.findOneAndUpdate(
        { profileId },
        { lastActivity: new Date() }
      );
    }

    // Emit for real-time processing
    processEventAsync(eventRecord);

    res.json({ success: true, eventId });
  } catch (error) {
    logger.error('Track error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Batch track events
 * POST /api/track/batch
 */
app.post('/api/track/batch', async (req: Request, res: Response) => {
  try {
    const { events, merchantId } = req.body;

    const eventIds: string[] = [];

    for (const eventData of events) {
      const eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      const eventRecord = new Event({
        eventId,
        profileId: eventData.profileId || 'anonymous',
        merchantId,
        event: eventData.event,
        context: eventData.context || {},
        location: {
          ip: eventData.ip,
          userAgent: eventData.userAgent
        },
        timestamp: eventData.timestamp || new Date(),
        processed: false
      });

      await eventRecord.save();
      eventIds.push(eventId);
    }

    res.json({ success: true, eventIds, count: eventIds.length });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Identify user (merge anonymous to known)
 * POST /api/identify
 */
app.post('/api/identify', async (req: Request, res: Response) => {
  try {
    const { merchantId, anonymousId, traits, context } = req.body;

    let profile = await Profile.findOne({ profileId: anonymousId, merchantId });

    if (!profile) {
      profile = new Profile({
        profileId: anonymousId,
        merchantId,
        identifiers: [],
        attributes: {
          demographics: {},
          firmographics: {},
          behavioral: { totalPurchases: 0, totalSpent: 0 },
          lifecycle: { status: 'prospect', stage: 'unknown', score: 0, churnRisk: 'low' }
        },
        consent: {
          email: { granted: false, timestamp: new Date() },
          sms: { granted: false, timestamp: new Date() },
          whatsapp: { granted: false, timestamp: new Date() },
          push: { granted: false, timestamp: new Date() },
          tracking: { granted: true, timestamp: new Date() }
        },
        sources: [{ source: 'cdp', records: 0, lastSync: new Date() }],
        scores: { engagement: 0, propensity: 0, rfm: 0 },
        createdAt: new Date()
      });
    }

    // Add new identifiers
    if (traits.email) {
      profile.identifiers.push({
        type: 'email',
        value: traits.email,
        hash: hashIdentifier(traits.email),
        source: context?.source || 'direct',
        firstSeen: new Date(),
        lastSeen: new Date(),
        verified: false
      });
    }

    if (traits.phone) {
      profile.identifiers.push({
        type: 'phone',
        value: traits.phone,
        hash: hashIdentifier(traits.phone),
        source: context?.source || 'direct',
        firstSeen: new Date(),
        lastSeen: new Date(),
        verified: false
      });
    }

    // Update attributes
    if (traits.demographics) {
      profile.attributes.demographics = { ...profile.attributes.demographics, ...traits.demographics };
    }
    if (traits.firmographics) {
      profile.attributes.firmographics = { ...profile.attributes.firmographics, ...traits.firmographics };
    }

    profile.attributes.lifecycle.status = 'active';
    profile.lastActivity = new Date();

    await profile.save();

    res.json({
      success: true,
      profileId: profile.profileId,
      traits: profile.attributes
    });
  } catch (error) {
    logger.error('Identify error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// PROFILE MANAGEMENT
// ============================================

/**
 * Get profile
 * GET /api/profiles/:profileId
 */
app.get('/api/profiles/:profileId', async (req: Request, res: Response) => {
  try {
    const profile = await Profile.findOne({ profileId: req.params.profileId });

    if (!profile) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }

    res.json({
      success: true,
      profile: {
        profileId: profile.profileId,
        attributes: profile.attributes,
        consent: profile.consent,
        scores: profile.scores,
        lastActivity: profile.lastActivity,
        sources: profile.sources
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get profiles by identifiers
 * POST /api/profiles/lookup
 */
app.post('/api/profiles/lookup', async (req: Request, res: Response) => {
  try {
    const { key, value, merchantId } = req.body;

    const hash = hashIdentifier(value);

    const profile = await Profile.findOne({
      merchantId,
      $or: [
        { 'identifiers.value': value },
        { 'identifiers.hash': hash }
      ]
    });

    if (!profile) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }

    res.json({
      success: true,
      profileId: profile.profileId,
      attributes: profile.attributes
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Search profiles
 * POST /api/profiles/search
 */
app.post('/api/profiles/search', async (req: Request, res: Response) => {
  try {
    const { merchantId, query, limit = 100, offset = 0 } = req.body;

    const profiles = await Profile.find({
      merchantId,
      ...query
    })
      .select('profileId attributes.attributes.demographics attributes.lifecycle scores lastActivity')
      .limit(limit)
      .skip(offset);

    const total = await Profile.countDocuments({ merchantId, ...query });

    res.json({
      success: true,
      profiles,
      total,
      limit,
      offset
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Update profile
 * PATCH /api/profiles/:profileId
 */
app.patch('/api/profiles/:profileId', async (req: Request, res: Response) => {
  try {
    const { attributes, consent, scores } = req.body;

    const update: any = { updatedAt: new Date() };

    if (attributes) {
      Object.keys(attributes).forEach(key => {
        update[`attributes.${key}`] = attributes[key];
      });
    }

    if (consent) {
      update.consent = consent;
    }

    if (scores) {
      update.scores = scores;
    }

    const profile = await Profile.findOneAndUpdate(
      { profileId: req.params.profileId },
      { $set: update },
      { new: true }
    );

    if (!profile) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }

    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// SEGMENTS
// ============================================

/**
 * Create segment
 * POST /api/segments
 */
app.post('/api/segments', async (req: Request, res: Response) => {
  try {
    const { merchantId, name, description, criteria } = req.body;

    const segment = new Segment({
      segmentId: `seg_${Date.now()}`,
      merchantId,
      name,
      description,
      criteria,
      stats: { size: 0, lastCalculated: new Date() },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await segment.save();

    // Calculate segment size
    await calculateSegmentSize(segment);

    res.json({
      success: true,
      segment: {
        segmentId: segment.segmentId,
        name: segment.name,
        size: segment.stats.size
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get segments
 * GET /api/segments/:merchantId
 */
app.get('/api/segments/:merchantId', async (req: Request, res: Response) => {
  try {
    const segments = await Segment.find({
      merchantId: req.params.merchantId,
      status: 'active'
    });

    res.json({
      success: true,
      segments: segments.map(s => ({
        segmentId: s.segmentId,
        name: s.name,
        description: s.description,
        size: s.stats.size,
        lastCalculated: s.stats.lastCalculated
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get segment profiles
 * GET /api/segments/:segmentId/profiles
 */
app.get('/api/segments/:segmentId/profiles', async (req: Request, res: Response) => {
  try {
    const { limit = 1000, offset = 0 } = req.query;

    const segment = await Segment.findOne({ segmentId: req.params.segmentId });

    if (!segment) {
      res.status(404).json({ success: false, error: 'Segment not found' });
      return;
    }

    // Build query from criteria
    const query = buildSegmentQuery(segment.criteria);

    const profiles = await Profile.find({
      merchantId: segment.merchantId,
      ...query
    })
      .select('profileId identifiers attributes')
      .limit(Number(limit))
      .skip(Number(offset));

    res.json({
      success: true,
      profiles: profiles.map(p => ({
        profileId: p.profileId,
        identifiers: p.identifiers.map(i => ({ type: i.type, value: i.value })),
        attributes: p.attributes
      })),
      count: profiles.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// AUDIENCE ACTIVATION
// ============================================

/**
 * Create audience (activated segment)
 * POST /api/audiences
 */
app.post('/api/audiences', async (req: Request, res: Response) => {
  try {
    const { segmentId, merchantId, name, destination } = req.body;

    const audience = new Audience({
      audienceId: `aud_${Date.now()}`,
      segmentId,
      merchantId,
      name,
      destination,
      status: 'active',
      lastSync: new Date(),
      recordsSynced: 0,
      createdAt: new Date()
    });

    await audience.save();

    // Trigger sync
    await syncAudience(audience);

    res.json({
      success: true,
      audienceId: audience.audienceId,
      status: 'syncing'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Sync audience
 * POST /api/audiences/:audienceId/sync
 */
app.post('/api/audiences/:audienceId/sync', async (req: Request, res: Response) => {
  try {
    const audience = await Audience.findOne({ audienceId: req.params.audienceId });

    if (!audience) {
      res.status(404).json({ success: false, error: 'Audience not found' });
      return;
    }

    const synced = await syncAudience(audience);

    res.json({
      success: true,
      recordsSynced: synced,
      lastSync: new Date()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get audiences
 * GET /api/audiences/:merchantId
 */
app.get('/api/audiences/:merchantId', async (req: Request, res: Response) => {
  try {
    const audiences = await Audience.find({ merchantId: req.params.merchantId });

    res.json({
      success: true,
      audiences: audiences.map(a => ({
        audienceId: a.audienceId,
        name: a.name,
        segmentId: a.segmentId,
        destination: a.destination.type,
        status: a.status,
        lastSync: a.lastSync,
        recordsSynced: a.recordsSynced
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// ANALYTICS
// ============================================

/**
 * Get aggregate stats
 * GET /api/analytics/:merchantId
 */
app.get('/api/analytics/:merchantId', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const match: any = {
      merchantId: req.params.merchantId,
      timestamp: {
        $gte: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        $lte: endDate ? new Date(endDate as string) : new Date()
      }
    };

    const [eventStats, profileStats] = await Promise.all([
      Event.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$event.type',
            count: { $sum: 1 }
          }
        }
      ]),
      Profile.aggregate([
        { $match: { merchantId: req.params.merchantId } },
        {
          $group: {
            _id: '$attributes.lifecycle.status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const totalProfiles = await Profile.countDocuments({ merchantId: req.params.merchantId });
    const totalEvents = await Event.countDocuments(match);

    res.json({
      success: true,
      analytics: {
        profiles: {
          total: totalProfiles,
          byStatus: profileStats
        },
        events: {
          total: totalEvents,
          byType: eventStats
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// CONSENT & PRIVACY
// ============================================

/**
 * Update consent
 * POST /api/consent
 */
app.post('/api/consent', async (req: Request, res: Response) => {
  try {
    const { profileId, channel, granted } = req.body;

    const update = {
      [`consent.${channel}`]: { granted, timestamp: new Date() }
    };

    await Profile.findOneAndUpdate({ profileId }, { $set: update });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Delete profile (GDPR)
 * DELETE /api/profiles/:profileId
 */
app.delete('/api/profiles/:profileId', async (req: Request, res: Response) => {
  try {
    await Profile.deleteOne({ profileId: req.params.profileId });
    await Event.deleteMany({ profileId: req.params.profileId });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Export data (GDPR)
 * GET /api/export/:profileId
 */
app.get('/api/export/:profileId', async (req: Request, res: Response) => {
  try {
    const profile = await Profile.findOne({ profileId: req.params.profileId });
    const events = await Event.find({ profileId: req.params.profileId });

    res.json({
      success: true,
      profile,
      events,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function hashIdentifier(value: string): string {
  return crypto.createHmac('sha256', HASH_SECRET).update(value.toLowerCase().trim()).digest('hex');
}

function detectDevice(userAgent: string): string {
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function detectBrowser(userAgent: string): string {
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/edge/i.test(userAgent)) return 'Edge';
  return 'Other';
}

function detectOS(userAgent: string): string {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/ios|iphone|ipad/i.test(userAgent)) return 'iOS';
  return 'Other';
}

async function processEventAsync(event: any): Promise<void> {
  // In production, this would publish to Kafka for real-time processing
  logger.info('Processing event', { eventId: event.eventId, type: event.event.type });
}

async function calculateSegmentSize(segment: any): Promise<void> {
  const query = buildSegmentQuery(segment.criteria);
  const count = await Profile.countDocuments({
    merchantId: segment.merchantId,
    ...query
  });

  segment.stats.size = count;
  segment.stats.lastCalculated = new Date();
  await segment.save();
}

function buildSegmentQuery(criteria: any): any {
  if (!criteria) return {};

  const query: any = {};

  if (criteria.lifecycleStatus) {
    query['attributes.lifecycle.status'] = criteria.lifecycleStatus;
  }

  if (criteria.churnRisk) {
    query['attributes.lifecycle.churnRisk'] = criteria.churnRisk;
  }

  if (criteria.minSpent) {
    query['attributes.behavioral.totalSpent'] = { $gte: criteria.minSpent };
  }

  if (criteria.location) {
    query['attributes.demographics.city'] = criteria.location;
  }

  if (criteria.traits) {
    Object.keys(criteria.traits).forEach(key => {
      query[`attributes.${key}`] = criteria.traits[key];
    });
  }

  return query;
}

async function syncAudience(audience: any): Promise<number> {
  const segment = await Segment.findOne({ segmentId: audience.segmentId });

  if (!segment) return 0;

  const query = buildSegmentQuery(segment.criteria);
  const profiles = await Profile.find({
    merchantId: audience.merchantId,
    ...query
  }).select('identifiers');

  const identifiers = profiles.flatMap(p =>
    p.identifiers.map(i => ({ type: i.type, value: i.value }))
  );

  // Send to destination based on type
  switch (audience.destination.type) {
    case 'instagram':
      await syncToInstagram(identifiers);
      break;
    case 'google':
      await syncToGoogle(identifiers);
      break;
    case 'facebook':
      await syncToFacebook(identifiers);
      break;
  }

  audience.recordsSynced = identifiers.length;
  audience.lastSync = new Date();
  await audience.save();

  return identifiers.length;
}

async function syncToInstagram(identifiers: any[]): Promise<void> {
  logger.info(`Syncing ${identifiers.length} to Instagram`);
  // In production, call Instagram Custom Audiences API
}

async function syncToGoogle(identifiers: any[]): Promise<void> {
  logger.info(`Syncing ${identifiers.length} to Google`);
  // In production, call Google Customer Match API
}

async function syncToFacebook(identifiers: any[]): Promise<void> {
  logger.info(`Syncing ${identifiers.length} to Facebook`);
  // In production, call Facebook Custom Audiences API
}

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 AdBazaar CDP started on port ${PORT}`);
  logger.info('📊 Customer Data Platform - Unified profiles');

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar_cdp')
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB connection error:', { error: err instanceof Error ? err.message : String(err) }));
});

export default app;