import { logger } from './logger';
/**
 * RisnaEstate - Smart Distribution Router
 *
 * AI-powered lead routing to best broker/influencer.
 * Routes based on: location, segment, score, availability, performance.
 */

import express, { Request, Response } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { EventEmitter } from 'events';

const app = express();
const PORT = process.env.PORT || 4117;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Event emitter
const routeEvents = new EventEmitter();

// External services
const REZ_INTELLIGENCE = process.env.REZ_INTELLIGENCE_URL || 'https://rez-intelligence.rez.app';

// =============================================
// SCHEMAS
// =============================================

/**
 * Broker availability and performance
 */
interface IBrokerRoutingProfile {
  brokerId: string;
  name: string;
  phone: string;
  city: string;
  locality: string;
  segments: string[]; // hni, corporate, standard
  languages: string[];
  maxLeadsPerDay: number;
  currentLeadCount: number;
  performance: {
    totalLeads: number;
    converted: number;
    conversionRate: number;
    avgResponseTime: number;
    rating: number;
  };
  availability: 'available' | 'busy' | 'offline';
  lastAssignedAt?: Date;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const BrokerRoutingProfileSchema = new Schema<IBrokerRoutingProfile & Document>('BrokerRoutingProfile', {
  brokerId: { type: String, unique: true, index: true },
  name: String,
  phone: String,
  city: String,
  locality: String,
  segments: [String],
  languages: [String],
  maxLeadsPerDay: { type: Number, default: 20 },
  currentLeadCount: { type: Number, default: 0 },
  performance: {
    totalLeads: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    rating: { type: Number, default: 5 }
  },
  availability: { type: String, enum: ['available', 'busy', 'offline'], default: 'available' },
  lastAssignedAt: Date,
  priority: { type: Number, default: 1 }
}, { timestamps: true });

const BrokerRoutingProfile = mongoose.model<IBrokerRoutingProfile & Document>('BrokerRoutingProfile', BrokerRoutingProfileSchema);

/**
 * Influencer routing profile
 */
interface IInfluencerRoutingProfile {
  influencerId: string;
  name: string;
  handle: string;
  platform: string;
  followers: number;
  reach: number;
  engagement: number;
  segments: string[];
  localities: string[];
  commission: {
    perLead: number;
    perBooking: number;
  };
  performance: {
    totalLeads: number;
    totalBookings: number;
    revenue: number;
  };
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const InfluencerRoutingProfileSchema = new Schema<IInfluencerRoutingProfile & Document>('InfluencerRoutingProfile', {
  influencerId: { type: String, unique: true, index: true },
  name: String,
  handle: String,
  platform: String,
  followers: Number,
  reach: Number,
  engagement: Number,
  segments: [String],
  localities: [String],
  commission: {
    perLead: Number,
    perBooking: Number
  },
  performance: {
    totalLeads: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

const InfluencerRoutingProfile = mongoose.model<IInfluencerRoutingProfile & Document>('InfluencerRoutingProfile', InfluencerRoutingProfileSchema);

/**
 * Routing decision log
 */
interface IRoutingDecision {
  leadId: string;
  leadScore: number;
  segment: string;
  leadLocation: string;
  assignedTo: {
    type: 'broker' | 'influencer';
    id: string;
    name: string;
  };
  routingMethod: 'ai' | 'round_robin' | 'location' | 'segment';
  confidence: number;
  alternativeOptions: Array<{ type: string; id: string; name: string; score: number }>;
  createdAt: Date;
}

const RoutingDecisionSchema = new Schema<IRoutingDecision & Document>('RoutingDecision', {
  leadId: String,
  leadScore: Number,
  segment: String,
  leadLocation: String,
  assignedTo: {
    type: String,
    id: String,
    name: String
  },
  routingMethod: String,
  confidence: Number,
  alternativeOptions: [{
    type: String,
    id: String,
    name: String,
    score: Number
  }]
}, { timestamps: true });

const RoutingDecision = mongoose.model<IRoutingDecision & Document>('RoutingDecision', RoutingDecisionSchema);

// =============================================
// ROUTING ALGORITHMS
// =============================================

/**
 * AI-powered routing score calculation
 */
function calculateRoutingScore(
  profile: IBrokerRoutingProfile | IInfluencerRoutingProfile,
  leadData: { score: number; segment: string; location: string; language?: string }
): number {
  let score = 0;

  // Segment match (30 points)
  if (profile.segments?.includes(leadData.segment)) {
    score += 30;
  }

  // Location match (25 points)
  if ('locality' in profile && profile.locality?.toLowerCase().includes(leadData.location.toLowerCase())) {
    score += 25;
  } else if ('localities' in profile && profile.localities?.some(l => l.toLowerCase().includes(leadData.location.toLowerCase()))) {
    score += 25;
  }

  // Availability (20 points)
  if ('availability' in profile) {
    if (profile.availability === 'available') score += 20;
    else if (profile.availability === 'busy') score += 5;
  }

  // Capacity (15 points)
  if ('maxLeadsPerDay' in profile && 'currentLeadCount' in profile) {
    const capacityRatio = profile.currentLeadCount / profile.maxLeadsPerDay;
    if (capacityRatio < 0.5) score += 15;
    else if (capacityRatio < 0.8) score += 10;
    else if (capacityRatio < 1) score += 5;
  }

  // Performance (10 points)
  if ('performance' in profile) {
    const perf = profile.performance as any;
    if (perf.conversionRate > 20) score += 10;
    else if (perf.conversionRate > 10) score += 7;
    else if (perf.conversionRate > 5) score += 4;
  }

  return Math.min(100, score);
}

/**
 * Find best broker for lead
 */
async function findBestBroker(leadData: {
  score: number;
  segment: string;
  location: string;
  city: string;
  language?: string;
}): Promise<IBrokerRoutingProfile | null> {
  // Get available brokers in the city
  const brokers = await BrokerRoutingProfile.find({
    city: leadData.city,
    availability: { $ne: 'offline' }
  });

  if (brokers.length === 0) {
    // Fallback to any available broker
    const fallbackBrokers = await BrokerRoutingProfile.find({
      availability: 'available'
    }).limit(5);

    return fallbackBrokers[0] || null;
  }

  // Calculate routing scores
  const scoredBrokers = brokers.map(broker => ({
    broker,
    score: calculateRoutingScore(broker, leadData)
  }));

  // Sort by score (highest first)
  scoredBrokers.sort((a, b) => b.score - a.score);

  return scoredBrokers[0]?.broker || null;
}

/**
 * Find best influencer for lead
 */
async function findBestInfluencer(leadData: {
  score: number;
  segment: string;
  location: string;
}): Promise<IInfluencerRoutingProfile | null> {
  const influencers = await InfluencerRoutingProfile.find({
    status: 'active',
    segments: leadData.segment
  });

  if (influencers.length === 0) return null;

  const scoredInfluencers = influencers.map(inf => ({
    influencer: inf,
    score: calculateRoutingScore(inf, leadData)
  }));

  scoredInfluencers.sort((a, b) => b.score - a.score);

  return scoredInfluencers[0]?.influencer || null;
}

/**
 * Route lead to best destination
 */
async function routeLead(leadData: {
  leadId: string;
  score: number;
  segment: string;
  location: string;
  city: string;
  language?: string;
}): Promise<{
  assignedTo: { type: string; id: string; name: string } | null;
  method: string;
  confidence: number;
  alternatives: any[];
}> {
  const alternatives: any[] = [];

  // Try AI routing first
  const broker = await findBestBroker(leadData);
  const influencer = await findBestInfluencer(leadData);

  if (!broker && !influencer) {
    return {
      assignedTo: null,
      method: 'none',
      confidence: 0,
      alternatives: []
    };
  }

  // Compare scores
  const brokerScore = broker ? calculateRoutingScore(broker, leadData) : 0;
  const influencerScore = influencer ? calculateRoutingScore(influencer, leadData) : 0;

  // Determine best route
  let assignedTo: { type: string; id: string; name: string } | null = null;
  let method = 'ai';
  let confidence = 0;

  if (brokerScore > influencerScore) {
    assignedTo = { type: 'broker', id: broker!._id!.toString(), name: broker!.name };
    confidence = brokerScore;
    if (influencer) {
      alternatives.push({ type: 'influencer', id: influencer._id!.toString(), name: influencer.name, score: influencerScore });
    }
  } else if (influencerScore > brokerScore) {
    assignedTo = { type: 'influencer', id: influencer!._id!.toString(), name: influencer!.name };
    confidence = influencerScore;
    if (broker) {
      alternatives.push({ type: 'broker', id: broker._id!.toString(), name: broker.name, score: brokerScore });
    }
  } else {
    // Tie - prefer broker
    assignedTo = broker ? { type: 'broker', id: broker._id!.toString(), name: broker.name } : null;
    confidence = brokerScore;
    method = 'tie_breaker';
  }

  // Log decision
  const decision = new RoutingDecision({
    leadId: leadData.leadId,
    leadScore: leadData.score,
    segment: leadData.segment,
    leadLocation: leadData.location,
    assignedTo: assignedTo!,
    routingMethod: method,
    confidence,
    alternativeOptions: alternatives
  });

  await decision.save();

  // Update broker/influencer counts
  if (assignedTo?.type === 'broker' && broker) {
    broker.currentLeadCount++;
    broker.lastAssignedAt = new Date();
    await broker.save();
  } else if (assignedTo?.type === 'influencer' && influencer) {
    influencer.performance.totalLeads++;
    await influencer.save();
  }

  // Emit event
  routeEvents.emit('lead:routed', {
    leadId: leadData.leadId,
    assignedTo,
    confidence
  });

  return {
    assignedTo,
    method,
    confidence,
    alternatives
  };
}

// =============================================
// API ROUTES
// =============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    service: 'risna-distribution-router',
    status: 'healthy'
  });
});

/**
 * Route a lead
 * POST /api/route
 */
app.post('/api/route', async (req: Request, res: Response) => {
  try {
    const { leadId, score, segment, location, city, language } = req.body;

    if (!leadId || !segment) {
      return res.status(400).json({ error: 'Lead ID and segment required' });
    }

    const result = await routeLead({
      leadId,
      score: score || 50,
      segment,
      location: location || '',
      city: city || '',
      language
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Batch route leads
 * POST /api/route/batch
 */
app.post('/api/route/batch', async (req: Request, res: Response) => {
  try {
    const { leads } = req.body;

    const results = [];
    for (const lead of leads) {
      const result = await routeLead({
        leadId: lead.leadId,
        score: lead.score || 50,
        segment: lead.segment,
        location: lead.location || '',
        city: lead.city || '',
        language: lead.language
      });
      results.push({ leadId: lead.leadId, ...result });
    }

    res.json({ success: true, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get available brokers
 * GET /api/brokers
 */
app.get('/api/brokers', async (req: Request, res: Response) => {
  try {
    const { city, segment, available } = req.query;

    const query: any = {};
    if (city) query.city = city;
    if (segment) query.segments = segment as string;
    if (available === 'true') query.availability = 'available';

    const brokers = await BrokerRoutingProfile.find(query)
      .sort({ priority: -1, 'performance.conversionRate': -1 });

    res.json({ brokers, count: brokers.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add broker to routing pool
 * POST /api/brokers
 */
app.post('/api/brokers', async (req: Request, res: Response) => {
  try {
    const brokerData = req.body;

    const broker = new BrokerRoutingProfile(brokerData);
    await broker.save();

    res.json({ success: true, broker });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update broker availability
 * PATCH /api/brokers/:id/availability
 */
app.patch('/api/brokers/:id/availability', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { availability, currentLeadCount } = req.body;

    const update: any = {};
    if (availability) update.availability = availability;
    if (currentLeadCount !== undefined) update.currentLeadCount = currentLeadCount;

    const broker = await BrokerRoutingProfile.findByIdAndUpdate(
      id,
      update,
      { new: true }
    );

    if (!broker) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    res.json({ success: true, broker });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get routing decisions
 * GET /api/decisions
 */
app.get('/api/decisions', async (req: Request, res: Response) => {
  try {
    const { leadId, limit = 50 } = req.query;

    const query: any = {};
    if (leadId) query.leadId = leadId;

    const decisions = await RoutingDecision.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));

    // Get stats
    const stats = await RoutingDecision.aggregate([
      {
        $group: {
          _id: '$assignedTo.type',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' }
        }
      }
    ]);

    res.json({ decisions, stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get influencer performance
 * GET /api/influencers
 */
app.get('/api/influencers', async (req: Request, res: Response) => {
  try {
    const { segment, active } = req.query;

    const query: any = {};
    if (segment) query.segments = segment as string;
    if (active === 'true') query.status = 'active';

    const influencers = await InfluencerRoutingProfile.find(query)
      .sort({ 'performance.revenue': -1 });

    res.json({ influencers, count: influencers.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add influencer
 * POST /api/influencers
 */
app.post('/api/influencers', async (req: Request, res: Response) => {
  try {
    const infData = req.body;

    const influencer = new InfluencerRoutingProfile(infData);
    await influencer.save();

    res.json({ success: true, influencer });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// START SERVER
// =============================================

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/risna-distribution-router');
    logger.info('✅ Connected to MongoDB');

    await BrokerRoutingProfile.createIndexes();
    await InfluencerRoutingProfile.createIndexes();
    await RoutingDecision.createIndexes();

    app.listen(PORT, () => {
      logger.info(`🚀 RisnaEstate Distribution Router running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
