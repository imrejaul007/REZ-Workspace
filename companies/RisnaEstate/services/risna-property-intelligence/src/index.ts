import { logger } from './logger';
/**
 * RisnaEstate - Property Intelligence Graph Service
 *
 * Builds understanding of investor behavior, demand patterns,
 * and property recommendation intelligence.
 */

import express, { Request, Response } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { EventEmitter } from 'events';

const app = express();
const PORT = process.env.PORT || 4116;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Event emitter
const graphEvents = new EventEmitter();

// External services
const REZ_INTELLIGENCE = process.env.REZ_INTELLIGENCE_URL || 'https://rez-intelligence.rez.app';

// =============================================
// PROPERTY GRAPH SCHEMAS
// =============================================

/**
 * User-Property Interaction Graph
 * Tracks all user interactions with properties
 */
interface IPropertyInteraction {
  userId: string;
  propertyId: string;
  type: 'view' | 'search' | 'save' | 'visit' | 'inquiry' | 'booking';
  context: {
    source?: string;
    location?: string;
    budget?: number;
    searchQuery?: string;
  };
  intent?: 'buy' | 'rent' | 'invest';
  duration?: number; // seconds
  score: number;
  createdAt: Date;
}

const PropertyInteractionSchema = new Schema<IPropertyInteraction & Document>('PropertyInteraction', {
  userId: { type: String, index: true },
  propertyId: { type: String, index: true },
  type: { type: String, enum: ['view', 'search', 'save', 'visit', 'inquiry', 'booking'] },
  context: {
    source: String,
    location: String,
    budget: Number,
    searchQuery: String
  },
  intent: String,
  duration: Number,
  score: { type: Number, default: 1 }
}, { timestamps: true });

const PropertyInteraction = mongoose.model<IPropertyInteraction & Document>('PropertyInteraction', PropertyInteractionSchema);

/**
 * User Property Preference Graph
 * Learns user preferences over time
 */
interface IUserPropertyPreference {
  userId: { type: String, unique: true, index: true };
  preferences: {
    locations: Array<{ id: string; name: string; score: number }>;
    propertyTypes: Array<{ type: string; score: number }>;
    priceRange: { min: number; max: number };
    bedrooms: number[];
    features: Array<{ name: string; score: number }>;
    countries: Array<{ code: string; score: number }>;
  };
  signals: {
    investmentIntent: number; // 0-100
    luxuryAffinity: number;
    urgency: number;
    firstTimeBuyer: boolean;
  };
  lastUpdated: Date;
}

const UserPropertyPreferenceSchema = new Schema<IUserPropertyPreference & Document>('UserPropertyPreference', {
  userId: String,
  preferences: {
    locations: [{
      id: String,
      name: String,
      score: Number
    }],
    propertyTypes: [{
      type: String,
      score: Number
    }],
    priceRange: {
      min: Number,
      max: Number
    },
    bedrooms: [Number],
    features: [{
      name: String,
      score: Number
    }],
    countries: [{
      code: String,
      score: Number
    }]
  },
  signals: {
    investmentIntent: { type: Number, default: 0 },
    luxuryAffinity: { type: Number, default: 0 },
    urgency: { type: Number, default: 0 },
    firstTimeBuyer: { type: Boolean, default: true }
  },
  lastUpdated: Date
}, { timestamps: true });

const UserPropertyPreference = mongoose.model<IUserPropertyPreference & Document>('UserPropertyPreference', UserPropertyPreferenceSchema);

/**
 * Locality Demand Graph
 * Tracks demand patterns by location
 */
interface ILocalityDemand {
  localityId: string;
  localityName: string;
  city: string;
  country: string;
  demand: {
    views: number;
    searches: number;
    saves: number;
    visits: number;
    inquiries: number;
    bookings: number;
  };
  demandScore: number;
  trend: 'rising' | 'stable' | 'falling';
  avgPrice: number;
  avgDaysOnMarket: number;
  investorScore: number;
  hniScore: number;
  lastUpdated: Date;
}

const LocalityDemandSchema = new Schema<ILocalityDemand & Document>('LocalityDemand', {
  localityId: { type: String, unique: true, index: true },
  localityName: String,
  city: String,
  country: String,
  demand: {
    views: { type: Number, default: 0 },
    searches: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    visits: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 }
  },
  demandScore: { type: Number, default: 0 },
  trend: { type: String, enum: ['rising', 'stable', 'falling'], default: 'stable' },
  avgPrice: Number,
  avgDaysOnMarket: Number,
  investorScore: { type: Number, default: 0 },
  hniScore: { type: Number, default: 0 }
}, { timestamps: true });

const LocalityDemand = mongoose.model<ILocalityDemand & Document>('LocalityDemand', LocalityDemandSchema);

/**
 * Property Similarity Graph
 * Links similar properties for recommendations
 */
interface IPropertySimilarity {
  propertyId: String;
  similarProperties: Array<{
    id: string;
    score: number;
    reason: string;
  }>;
}

const PropertySimilaritySchema = new Schema<IPropertySimilarity & Document>('PropertySimilarity', {
  propertyId: { type: String, unique: true, index: true },
  similarProperties: [{
    id: String,
    score: Number,
    reason: String
  }]
});

const PropertySimilarity = mongoose.model<IPropertySimilarity & Document>('PropertySimilarity', PropertySimilaritySchema);

// =============================================
// INTELLIGENCE FUNCTIONS
// =============================================

/**
 * Calculate user preference from interaction history
 */
async function calculateUserPreferences(userId: string): Promise<IUserPropertyPreference | null> {
  const interactions = await PropertyInteraction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(100);

  if (interactions.length === 0) return null;

  // Aggregate preferences
  const locations: Record<string, number> = {};
  const propertyTypes: Record<string, number> = {};
  const features: Record<string, number> = {};
  const countries: Record<string, number> = {};
  const budgets: number[] = [];
  const bedroomCounts: number[] = [];

  for (const i of interactions) {
    // Weight by interaction type
    const weight = i.score || 1;

    if (i.context?.location) {
      locations[i.context.location] = (locations[i.context.location] || 0) + weight;
    }
    if (i.context?.budget) {
      budgets.push(i.context.budget);
    }
    if (i.propertyId) {
      // Would need property data for type/features
      propertyTypes['apartment'] = (propertyTypes['apartment'] || 0) + weight;
    }
    if (i.type === 'booking') {
      countries['AE'] = (countries['AE'] || 0) + weight * 3; // Bookings weighted higher
    }
  }

  // Sort and normalize
  const sortedLocations = Object.entries(locations)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, score], i) => ({ id, name: id, score: 100 - i * 10 }));

  const sortedTypes = Object.entries(propertyTypes)
    .sort((a, b) => b[1] - a[1])
    .map(([type, score]) => ({ type, score: Math.min(100, score) }));

  const sortedFeatures = Object.entries(features)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, score]) => ({ name, score: Math.min(100, score) }));

  const sortedCountries = Object.entries(countries)
    .sort((a, b) => b[1] - a[1])
    .map(([code, score]) => ({ code, score: Math.min(100, score) }));

  const avgBudget = budgets.length > 0
    ? budgets.reduce((a, b) => a + b, 0) / budgets.length
    : 0;

  // Calculate signals
  const bookingInteractions = interactions.filter(i => i.type === 'booking').length;
  const viewInteractions = interactions.filter(i => i.type === 'view').length;

  const signals = {
    investmentIntent: Math.min(100, sortedCountries.length > 1 ? 70 : 30),
    luxuryAffinity: avgBudget > 10000000 ? 80 : avgBudget > 5000000 ? 50 : 20,
    urgency: bookingInteractions > 0 ? 70 : viewInteractions > 5 ? 40 : 10,
    firstTimeBuyer: bookingInteractions === 0
  };

  return {
    userId,
    preferences: {
      locations: sortedLocations,
      propertyTypes: sortedTypes,
      priceRange: {
        min: avgBudget * 0.8,
        max: avgBudget * 1.2
      },
      bedrooms: [...new Set(bedroomCounts)],
      features: sortedFeatures,
      countries: sortedCountries
    },
    signals,
    lastUpdated: new Date()
  };
}

/**
 * Calculate locality demand score
 */
async function calculateLocalityDemand(localityId: string): Promise<ILocalityDemand | null> {
  const interactions = await PropertyInteraction.aggregate([
    { $match: { 'context.location': localityId } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalScore: { $sum: '$score' }
      }
    }
  ]);

  if (interactions.length === 0) return null;

  const demand: ILocalityDemand['demand'] = {
    views: 0, searches: 0, saves: 0, visits: 0, inquiries: 0, bookings: 0
  };

  for (const i of interactions) {
    if (i._id === 'view') demand.views = i.count;
    else if (i._id === 'search') demand.searches = i.count;
    else if (i._id === 'save') demand.saves = i.count;
    else if (i._id === 'visit') demand.visits = i.count;
    else if (i._id === 'inquiry') demand.inquiries = i.count;
    else if (i._id === 'booking') demand.bookings = i.count;
  }

  // Weighted demand score
  const demandScore =
    demand.views * 1 +
    demand.searches * 2 +
    demand.saves * 5 +
    demand.visits * 10 +
    demand.inquiries * 20 +
    demand.bookings * 50;

  return {
    localityId,
    localityName: localityId,
    city: 'Unknown',
    country: 'AE',
    demand,
    demandScore: Math.min(100, demandScore / 10),
    trend: 'stable',
    avgPrice: 0,
    avgDaysOnMarket: 0,
    investorScore: demand.inquiries > 10 ? 70 : 40,
    hniScore: demand.bookings > 5 ? 80 : 50,
    lastUpdated: new Date()
  };
}

/**
 * Generate property recommendations
 */
async function getPropertyRecommendations(userId: string, limit = 10): Promise<any[]> {
  const prefs = await UserPropertyPreference.findOne({ userId });

  if (!prefs) {
    // Return popular properties as fallback
    return getPopularProperties(limit);
  }

  // Get localities user prefers
  const preferredLocations = prefs.preferences.locations
    .filter(l => l.score > 50)
    .map(l => l.id);

  // Get properties matching preferences
  const recommendations = [];

  for (const location of preferredLocations) {
    const localityDemand = await LocalityDemand.findOne({ localityId: location });
    if (localityDemand) {
      recommendations.push({
        locality: location,
        demandScore: localityDemand.demandScore,
        trend: localityDemand.trend,
        investorScore: localityDemand.investorScore,
        reason: `${localityDemand.trend === 'rising' ? '📈 Rising' : '📊 Popular'} demand in ${location}`
      });
    }
  }

  // Sort by score and return top
  return recommendations
    .sort((a, b) => b.demandScore - a.demandScore)
    .slice(0, limit);
}

/**
 * Get popular properties (fallback)
 */
async function getPopularProperties(limit: number): Promise<any[]> {
  const popular = await PropertyInteraction.aggregate([
    { $match: { type: 'view' } },
    {
      $group: {
        _id: '$propertyId',
        views: { $sum: 1 }
      }
    },
    { $sort: { views: -1 } },
    { $limit: limit }
  ]);

  return popular.map(p => ({
    propertyId: p._id,
    views: p.views,
    reason: 'Popular property'
  }));
}

// =============================================
// API ROUTES
// =============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    service: 'risna-property-intelligence',
    status: 'healthy'
  });
});

/**
 * Record property interaction
 * POST /api/interactions
 */
app.post('/api/interactions', async (req: Request, res: Response) => {
  try {
    const { userId, propertyId, type, context, intent, duration } = req.body;

    // Calculate score based on interaction type
    const scores: Record<string, number> = {
      view: 1,
      search: 2,
      save: 5,
      visit: 10,
      inquiry: 20,
      booking: 50
    };

    const interaction = new PropertyInteraction({
      userId,
      propertyId,
      type,
      context,
      intent,
      duration,
      score: scores[type] || 1
    });

    await interaction.save();

    // Update locality demand
    if (context?.location) {
      const locality = await LocalityDemand.findOne({ localityId: context.location });
      if (locality) {
        locality.demand[type === 'booking' ? 'bookings' :
          type === 'visit' ? 'visits' :
            type === 'inquiry' ? 'inquiries' :
              type === 'save' ? 'saves' :
                type === 'search' ? 'searches' : 'views']++;
        locality.demandScore += scores[type];
        await locality.save();
      }
    }

    // Emit event
    graphEvents.emit('interaction:recorded', { userId, propertyId, type });

    res.json({ success: true, interaction });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user preferences
 * GET /api/preferences/:userId
 */
app.get('/api/preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    let prefs = await UserPropertyPreference.findOne({ userId });

    // Recalculate if stale
    if (!prefs || (Date.now() - prefs.lastUpdated.getTime()) > 86400000) {
      prefs = await calculateUserPreferences(userId);
      if (prefs) {
        await UserPropertyPreference.findOneAndUpdate(
          { userId },
          prefs,
          { upsert: true, new: true }
        );
      }
    }

    res.json({ preferences: prefs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get property recommendations
 * GET /api/recommendations/:userId
 */
app.get('/api/recommendations/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const recommendations = await getPropertyRecommendations(userId, parseInt(limit as string));

    res.json({ recommendations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get locality demand
 * GET /api/localities/:localityId
 */
app.get('/api/localities/:localityId', async (req: Request, res: Response) => {
  try {
    const { localityId } = req.params;

    let locality = await LocalityDemand.findOne({ localityId });

    // Recalculate if stale or missing
    if (!locality) {
      locality = await calculateLocalityDemand(localityId);
      if (locality) {
        await new LocalityDemand(locality).save();
      }
    }

    res.json({ locality });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get demand trends
 * GET /api/trends
 */
app.get('/api/trends', async (req: Request, res: Response) => {
  try {
    const { city, country } = req.query;

    const query: any = {};
    if (city) query.city = city;
    if (country) query.country = country;

    const localities = await LocalityDemand.find(query)
      .sort({ demandScore: -1 })
      .limit(20);

    // Categorize
    const rising = localities.filter(l => l.trend === 'rising');
    const stable = localities.filter(l => l.trend === 'stable');

    res.json({
      rising: rising.slice(0, 5),
      stable: stable.slice(0, 5),
      top: localities.slice(0, 10)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get investor insights
 * GET /api/insights/investor
 */
app.get('/api/insights/investor', async (req: Request, res: Response) => {
  try {
    const localities = await LocalityDemand.find({
      investorScore: { $gte: 60 }
    }).sort({ investorScore: -1 });

    res.json({
      insights: localities.map(l => ({
        locality: l.localityName,
        score: l.investorScore,
        demand: l.demand,
        avgPrice: l.avgPrice,
        recommendation: l.investorScore > 80 ? 'Hot Investment Zone' :
          l.investorScore > 70 ? 'Good Investment' : 'Consider'
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get HNI hotspots
 * GET /api/insights/hni
 */
app.get('/api/insights/hni', async (req: Request, res: Response) => {
  try {
    const localities = await LocalityDemand.find({
      hniScore: { $gte: 70 }
    }).sort({ hniScore: -1 });

    res.json({
      hotspots: localities.map(l => ({
        locality: l.localityName,
        score: l.hniScore,
        avgPrice: l.avgPrice,
        bookings: l.demand.bookings
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Sync with REZ Intelligence
 * POST /api/sync
 */
app.post('/api/sync', async (req: Request, res: Response) => {
  try {
    // Get signals from REZ Intelligence
    const response = await fetch(`${REZ_INTELLIGENCE}/api/v1/signals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: 'risnaestate' })
    });

    const data = await response.json();

    // Update localities with intelligence signals
    if (data.signals) {
      for (const signal of data.signals) {
        await LocalityDemand.findOneAndUpdate(
          { localityId: signal.localityId },
          {
            investorScore: signal.investorScore,
            hniScore: signal.hniScore,
            trend: signal.trend
          }
        );
      }
    }

    res.json({ success: true, synced: data.signals?.length || 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// START SERVER
// =============================================

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/risna-property-intelligence');
    logger.info('✅ Connected to MongoDB');

    await PropertyInteraction.createIndexes();
    await UserPropertyPreference.createIndexes();
    await LocalityDemand.createIndexes();

    app.listen(PORT, () => {
      logger.info(`🚀 RisnaEstate Property Intelligence running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
