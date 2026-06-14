/**
 * REZ Intent Graph Service
 *
 * Graph-based intent tracking and analysis for the REZ ecosystem.
 * Captures user intent signals, builds intent graphs, and provides
 * real-time intent predictions.
 *
 * Features:
 * - Intent signal capture
 * - Intent graph building
 * - Purchase intent prediction
 * - Cross-device/cross-session tracking
 * - Trend analysis
 *
 * Database: MongoDB
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4018;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-intent-graph';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================
// MONGOOSE SCHEMAS
// ============================================

// Intent Signal - raw intent data
const intentSignalSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  sessionId: { type: String, index: true },
  deviceId: String,
  intent: { type: String, required: true, index: true },
  intentCategory: { type: String, enum: ['browse', 'search', 'compare', 'cart', 'purchase', 'support'], index: true },
  productId: String,
  productCategory: String,
  query: String,
  metadata: mongoose.Schema.Types.Mixed,
  source: { type: String, enum: ['web', 'mobile', 'app', 'api', 'whatsapp'], default: 'web' },
  context: {
    page: String,
    referrer: String,
    utm: mongoose.Schema.Types.Mixed
  },
  location: {
    country: String,
    city: String,
    lat: Number,
    lng: Number
  },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

// Intent Node - aggregated intent per entity
const intentNodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true, unique: true, index: true },
  nodeType: { type: String, enum: ['user', 'product', 'category', 'brand', 'merchant', 'search'], required: true },
  userId: String,
  productId: String,
  category: String,
  brand: String,
  merchantId: String,
  searchQuery: String,
  intentSignals: {
    browse: { type: Number, default: 0 },
    search: { type: Number, default: 0 },
    compare: { type: Number, default: 0 },
    cart: { type: Number, default: 0 },
    purchase: { type: Number, default: 0 },
    support: { type: Number, default: 0 }
  },
  intentScore: { type: Number, default: 0, index: true },
  intentStrength: { type: String, enum: ['cold', 'warm', 'hot'], default: 'warm' },
  velocity: { type: Number, default: 0 }, // signals per hour
  decayFactor: { type: Number, default: 0.95 },
  lastSignal: Date,
  predictedIntent: {
    action: String,
    confidence: Number,
    timeframe: String
  },
  tags: [String],
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Intent Edge - relationships between nodes
const intentEdgeSchema = new mongoose.Schema({
  sourceNodeId: { type: String, required: true, index: true },
  targetNodeId: { type: String, required: true, index: true },
  relationship: {
    type: String,
    enum: ['browsed_after', 'compared_with', 'added_to_cart', 'purchased_after', 'viewed_similar', 'searched_for', 'related_to'],
    required: true
  },
  weight: { type: Number, default: 1 },
  frequency: { type: Number, default: 1 },
  avgTimeBetween: Number, // ms
  conversionRate: Number,
  lastInteraction: Date,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Intent Session - session-level aggregation
const intentSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, index: true },
  deviceId: String,
  signals: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // ms
  intentHistory: [{
    intent: String,
    category: String,
    timestamp: Date
  }],
  finalIntent: {
    intent: String,
    confidence: Number
  },
  converted: { type: Boolean, default: false },
  convertedAt: Date,
  conversionValue: Number
}, { timestamps: true });

// Intent Prediction - ML-based predictions
const intentPredictionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  predictions: [{
    intent: { type: String, required: true },
    probability: { type: Number, required: true },
    timeframe: String,
    factors: [String],
    confidence: Number
  }],
  modelVersion: String,
  features: mongoose.Schema.Types.Mixed,
  nextPredictedAction: {
    action: String,
    productId: String,
    probability: Number
  },
  churnRisk: {
    score: Number,
    factors: [String]
  },
  ltvScore: {
    score: Number,
    tier: String
  }
}, { timestamps: true });

// Create models
const IntentSignal = mongoose.model('IntentSignal', intentSignalSchema);
const IntentNode = mongoose.model('IntentNode', intentNodeSchema);
const IntentEdge = mongoose.model('IntentEdge', intentEdgeSchema);
const IntentSession = mongoose.model('IntentSession', intentSessionSchema);
const IntentPrediction = mongoose.model('IntentPrediction', intentPredictionSchema);

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateIntentScore(signals: Record<string, number>): number {
  const weights = {
    browse: 1,
    search: 2,
    compare: 3,
    cart: 5,
    purchase: 10,
    support: 1
  };

  let score = 0;
  for (const [type, count] of Object.entries(signals)) {
    score += (weights[type as keyof typeof weights] || 1) * count;
  }

  return Math.round(score * 100) / 100;
}

function determineIntentStrength(score: number): 'cold' | 'warm' | 'hot' {
  if (score >= 50) return 'hot';
  if (score >= 20) return 'warm';
  return 'cold';
}

function generateNodeId(type: string, id: string): string {
  return `${type}:${id}`;
}

function calculateVelocity(signals: Record<string, number>, hours: number): number {
  const totalSignals = Object.values(signals).reduce((sum, count) => sum + count, 0);
  return hours > 0 ? totalSignals / hours : 0;
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token-here';

function requireInternal(req: Request, res: Response, next: express.NextFunction) {
  const token = req.headers['x-internal-token'] as string;
  if (token !== INTERNAL_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (_req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const stats = {
      signals: await IntentSignal.countDocuments(),
      nodes: await IntentNode.countDocuments(),
      edges: await IntentEdge.countDocuments(),
      sessions: await IntentSession.countDocuments(),
      predictions: await IntentPrediction.countDocuments()
    };

    res.json({
      status: 'ok',
      service: 'REZ-intent-graph',
      timestamp: new Date().toISOString(),
      database: mongoStatus,
      stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: (error as Error).message
    });
  }
});

// ============================================
// SIGNAL CAPTURE APIS
// ============================================

// Capture intent signal
app.post('/api/signals', requireInternal, async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      deviceId,
      intent,
      intentCategory,
      productId,
      productCategory,
      query,
      source,
      context,
      location,
      metadata
    } = req.body;

    if (!intent || !intentCategory) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'intent and intentCategory are required' }
      });
      return;
    }

    // Create signal
    const signal = new IntentSignal({
      userId,
      sessionId,
      deviceId,
      intent,
      intentCategory,
      productId,
      productCategory,
      query,
      source: source || 'api',
      context,
      location,
      metadata
    });

    await signal.save();

    // Update user intent node
    if (userId) {
      await updateUserIntentNode(userId, intentCategory, signal);
    }

    // Update product intent node
    if (productId) {
      await updateProductIntentNode(productId, intentCategory, productCategory, signal);
    }

    // Create edges if applicable
    if (sessionId) {
      await updateSessionIntents(sessionId, userId, intentCategory, signal);
    }

    res.status(201).json({
      success: true,
      data: {
        signalId: signal._id,
        intent,
        intentCategory
      }
    });
  } catch (error) {
    console.error('Error capturing signal:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Batch capture signals
app.post('/api/signals/batch', requireInternal, async (req, res) => {
  try {
    const { signals } = req.body;

    if (!Array.isArray(signals) || signals.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'signals array is required' }
      });
      return;
    }

    const createdSignals = await IntentSignal.insertMany(signals);

    // Process signals in background
    for (const signal of createdSignals) {
      if (signal.userId) await updateUserIntentNode(signal.userId, signal.intentCategory, signal);
      if (signal.productId) await updateProductIntentNode(signal.productId, signal.intentCategory, signal.productCategory, signal);
    }

    res.status(201).json({
      success: true,
      data: {
        count: createdSignals.length,
        signalIds: createdSignals.map(s => s._id)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// ============================================
// NODE APIs
// ============================================

// Get user intent profile
app.get('/api/users/:userId/intent', requireInternal, async (req, res) => {
  try {
    const { timeframe } = req.query;

    // Get user node
    const nodeId = generateNodeId('user', req.params.userId);
    const node = await IntentNode.findOne({ nodeId });

    // Get recent signals
    const signalQuery: Record<string, unknown> = { userId: req.params.userId };
    if (timeframe) {
      const hoursAgo = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
      signalQuery.timestamp = { $gte: new Date(Date.now() - hoursAgo * 60 * 60 * 1000) };
    }

    const signals = await IntentSignal.find(signalQuery)
      .sort({ timestamp: -1 })
      .limit(100);

    // Get predictions
    const predictions = await IntentPrediction.findOne({ userId: req.params.userId });

    // Get related products
    const relatedEdges = await IntentEdge.find({
      sourceNodeId: nodeId,
      relationship: { $in: ['browsed_after', 'added_to_cart', 'purchased_after'] }
    }).limit(20);

    const relatedProductIds = relatedEdges.map(e => e.targetNodeId.replace('product:', ''));

    res.json({
      success: true,
      data: {
        node: node ? {
          intentSignals: node.intentSignals,
          intentScore: node.intentScore,
          intentStrength: node.intentStrength,
          velocity: node.velocity,
          predictedIntent: node.predictedIntent
        } : null,
        signals: signals.length,
        recentIntents: signals.slice(0, 10).map(s => ({
          intent: s.intent,
          category: s.intentCategory,
          timestamp: s.timestamp
        })),
        predictions: predictions ? predictions.predictions : [],
        churnRisk: predictions?.churnRisk,
        ltvScore: predictions?.ltvScore,
        relatedProducts: relatedProductIds
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Get product intent data
app.get('/api/products/:productId/intent', requireInternal, async (req, res) => {
  try {
    const nodeId = generateNodeId('product', req.params.productId);
    const node = await IntentNode.findOne({ nodeId });

    // Get recent signals
    const signals = await IntentSignal.find({ productId: req.params.productId })
      .sort({ timestamp: -1 })
      .limit(50);

    // Get related products (edges)
    const relatedEdges = await IntentEdge.find({
      $or: [
        { sourceNodeId: nodeId },
        { targetNodeId: nodeId }
      ],
      relationship: { $in: ['viewed_similar', 'purchased_after', 'compared_with'] }
    }).limit(20);

    const relatedProducts = relatedEdges
      .filter(e => e.targetNodeId !== nodeId)
      .map(e => ({
        productId: e.targetNodeId.replace('product:', ''),
        relationship: e.relationship,
        weight: e.weight
      }));

    res.json({
      success: true,
      data: {
        node: node ? {
          intentSignals: node.intentSignals,
          intentScore: node.intentScore,
          intentStrength: node.intentStrength,
          velocity: node.velocity,
          lastSignal: node.lastSignal
        } : null,
        signals: signals.length,
        intentDistribution: getIntentDistribution(signals),
        relatedProducts,
        topSearchQueries: getTopSearchQueries(signals)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Get hot/intent products
app.get('/api/intent/hot-products', requireInternal, async (req, res) => {
  try {
    const { limit = 20, category } = req.query;

    const query: Record<string, unknown> = {
      nodeType: 'product',
      intentStrength: { $in: ['warm', 'hot'] }
    };

    if (category) {
      query.category = category;
    }

    const hotProducts = await IntentNode.find(query)
      .sort({ intentScore: -1, velocity: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: hotProducts.map(p => ({
        productId: p.productId,
        category: p.category,
        brand: p.brand,
        intentScore: p.intentScore,
        intentStrength: p.intentStrength,
        velocity: p.velocity,
        signals: p.intentSignals
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// ============================================
// GRAPH APIs
// ============================================

// Get user's intent graph
app.get('/api/users/:userId/graph', requireInternal, async (req, res) => {
  try {
    const nodeId = generateNodeId('user', req.params.userId);
    const { depth = 2 } = req.query;

    // Get user node
    const userNode = await IntentNode.findOne({ nodeId });

    // Get edges (up to specified depth)
    const edges = await IntentEdge.find({
      $or: [
        { sourceNodeId: nodeId },
        { targetNodeId: nodeId }
      ]
    }).sort({ weight: -1 }).limit(100);

    // Get related nodes
    const nodeIds = new Set<string>([nodeId]);
    edges.forEach(e => {
      nodeIds.add(e.sourceNodeId);
      nodeIds.add(e.targetNodeId);
    });

    const nodes = await IntentNode.find({ nodeId: { $in: Array.from(nodeIds) } });

    res.json({
      success: true,
      data: {
        nodes: nodes.map(n => ({
          id: n.nodeId,
          type: n.nodeType,
          label: n.productId || n.userId || n.searchQuery,
          intentScore: n.intentScore,
          intentStrength: n.intentStrength,
          metadata: n.metadata
        })),
        edges: edges.map(e => ({
          source: e.sourceNodeId,
          target: e.targetNodeId,
          relationship: e.relationship,
          weight: e.weight
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// ============================================
// PREDICTION APIs
// ============================================

// Predict user intent
app.post('/api/predict', requireInternal, async (req, res) => {
  try {
    const { userId, context } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId is required' }
      });
      return;
    }

    // Get user signals
    const signals = await IntentSignal.find({ userId })
      .sort({ timestamp: -1 })
      .limit(100);

    // Calculate predictions based on signals
    const predictions = calculatePredictions(signals, context);

    // Store prediction
    await IntentPrediction.findOneAndUpdate(
      { userId },
      {
        userId,
        predictions: predictions.intents,
        modelVersion: '1.0.0',
        features: { signalCount: signals.length, categories: [...new Set(signals.map(s => s.intentCategory))] },
        nextPredictedAction: predictions.nextAction,
        churnRisk: predictions.churnRisk,
        ltvScore: predictions.ltvScore
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// ============================================
// SESSION APIs
// ============================================

// Get session details
app.get('/api/sessions/:sessionId', requireInternal, async (req, res) => {
  try {
    const session = await IntentSession.findOne({ sessionId: req.params.sessionId });

    if (!session) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' }
      });
      return;
    }

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// ============================================
// ANALYTICS APIs
// ============================================

// Get intent trends
app.get('/api/analytics/trends', requireInternal, async (req, res) => {
  try {
    const { period = '7d', category } = req.query;

    const hoursAgo = period === '24h' ? 24 : period === '7d' ? 168 : 720;
    const startDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    const matchStage: Record<string, unknown> = { timestamp: { $gte: startDate } };
    if (category) matchStage.intentCategory = category;

    const trends = await IntentSignal.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            period: {
              $dateToString: {
                format: period === '24h' ? '%Y-%m-%d %H:00' : '%Y-%m-%d',
                date: '$timestamp'
              }
            },
            category: '$intentCategory'
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      { $sort: { '_id.period': 1 } }
    ]);

    // Format trends
    const formattedTrends = trends.map(t => ({
      period: t._id.period,
      category: t._id.category,
      count: t.count,
      uniqueUsers: t.uniqueUsers.length
    }));

    res.json({
      success: true,
      data: {
        trends: formattedTrends,
        summary: {
          totalSignals: formattedTrends.reduce((sum, t) => sum + t.count, 0),
          uniqueUsers: new Set(formattedTrends.map(t => t.uniqueUsers)).size
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Get intent funnel
app.get('/api/analytics/funnel', requireInternal, async (req, res) => {
  try {
    const { userId, productId } = req.query;

    const matchStage: Record<string, unknown> = {};
    if (userId) matchStage.userId = userId;
    if (productId) matchStage.productId = productId;

    const funnel = await IntentSignal.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$intentCategory',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const funnelOrder = ['browse', 'search', 'compare', 'cart', 'purchase'];
    const orderedFunnel = funnelOrder.map((stage, index) => {
      const found = funnel.find(f => f._id === stage);
      const nextStage = funnelOrder[index + 1];
      const nextFound = funnel.find(f => f._id === nextStage);

      return {
        stage,
        count: found?.count || 0,
        conversionToNext: nextFound && found ? Math.round((nextFound.count / found.count) * 100) : 0
      };
    });

    res.json({
      success: true,
      data: {
        funnel: orderedFunnel,
        totalSessions: await IntentSession.countDocuments(matchStage.userId ? { userId: matchStage.userId } : {}),
        convertedSessions: await IntentSession.countDocuments({
          ...(matchStage.userId ? { userId: matchStage.userId } : {}),
          converted: true
        })
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// ============================================
// HELPER FUNCTIONS FOR SIGNAL PROCESSING
// ============================================

async function updateUserIntentNode(userId: string, intentCategory: string, signal: Record<string, unknown>) {
  const nodeId = generateNodeId('user', userId);

  const update: Record<string, unknown> = {
    $set: {
      lastSignal: signal.timestamp || new Date()
    },
    $inc: {
      [`intentSignals.${intentCategory}`]: 1
    }
  };

  await IntentNode.findOneAndUpdate(
    { nodeId },
    update,
    { upsert: true, new: true }
  );

  // Recalculate intent score
  const node = await IntentNode.findOne({ nodeId });
  if (node) {
    const hoursSinceLastSignal = (Date.now() - node.lastSignal.getTime()) / (1000 * 60 * 60);
    node.intentScore = calculateIntentScore(node.intentSignals as Record<string, number>);
    node.velocity = calculateVelocity(node.intentSignals as Record<string, number>, hoursSinceLastSignal);
    node.intentStrength = determineIntentStrength(node.intentScore);
    node.predictedIntent = predictNextIntent(node);
    await node.save();
  }
}

async function updateProductIntentNode(productId: string, intentCategory: string, category: string | undefined, signal: Record<string, unknown>) {
  const nodeId = generateNodeId('product', productId);

  await IntentNode.findOneAndUpdate(
    { nodeId },
    {
      $set: {
        lastSignal: signal.timestamp || new Date(),
        category: category || undefined
      },
      $inc: {
        [`intentSignals.${intentCategory}`]: 1
      },
      $setOnInsert: {
        nodeType: 'product',
        productId
      }
    },
    { upsert: true, new: true }
  );

  // Recalculate
  const node = await IntentNode.findOne({ nodeId });
  if (node) {
    node.intentScore = calculateIntentScore(node.intentSignals as Record<string, number>);
    node.intentStrength = determineIntentStrength(node.intentScore);
    await node.save();
  }
}

async function updateSessionIntents(sessionId: string, userId: string | undefined, intentCategory: string, signal: Record<string, unknown>) {
  await IntentSession.findOneAndUpdate(
    { sessionId },
    {
      $set: {
        userId,
        deviceId: signal.deviceId
      },
      $inc: { signals: 1 },
      $push: {
        intentHistory: {
          intent: signal.intent,
          category: intentCategory,
          timestamp: signal.timestamp || new Date()
        }
      }
    },
    { upsert: true, new: true }
  );
}

function predictNextIntent(node: Record<string, unknown>): { action: string; confidence: number; timeframe: string } {
  const signals = node.intentSignals as Record<string, number>;
  const sortedCategories = Object.entries(signals)
    .sort(([, a], [, b]) => b - a)
    .map(([category]) => category);

  const topCategory = sortedCategories[0] || 'browse';
  const confidence = signals[topCategory] ? signals[topCategory] / Object.values(signals).reduce((sum, v) => sum + v, 0) : 0.5;

  // Predict next step in funnel
  const funnelOrder = ['browse', 'search', 'compare', 'cart', 'purchase'];
  const currentIndex = funnelOrder.indexOf(topCategory);
  const nextAction = funnelOrder[Math.min(currentIndex + 1, funnelOrder.length - 1)];

  return {
    action: nextAction,
    confidence: Math.round(confidence * 100) / 100,
    timeframe: confidence > 0.7 ? 'immediate' : '1-2 days'
  };
}

function calculatePredictions(signals: Record<string, unknown>[], context: Record<string, unknown> | undefined) {
  const intents: Record<string, number> = {};

  for (const signal of signals) {
    const category = signal.intentCategory as string;
    intents[category] = (intents[category] || 0) + 1;
  }

  const totalSignals = signals.length;
  const predictions = Object.entries(intents)
    .map(([intent, count]) => ({
      intent,
      probability: Math.round((count / totalSignals) * 100) / 100,
      timeframe: '7 days',
      factors: [`${count} ${intent} signals`],
      confidence: Math.min(1, count / 10)
    }))
    .sort((a, b) => b.probability - a.probability);

  // Determine next action
  const topIntent = predictions[0]?.intent || 'browse';
  const funnelOrder = ['browse', 'search', 'compare', 'cart', 'purchase'];
  const currentIndex = funnelOrder.indexOf(topIntent);
  const nextAction = funnelOrder[Math.min(currentIndex + 1, funnelOrder.length - 1)];

  // Calculate churn risk
  const daysSinceLastSignal = signals.length > 0
    ? (Date.now() - (signals[0].timestamp as Date).getTime()) / (1000 * 60 * 60 * 24)
    : 999;
  const churnRisk = {
    score: daysSinceLastSignal > 14 ? 0.8 : daysSinceLastSignal > 7 ? 0.5 : 0.2,
    factors: daysSinceLastSignal > 14 ? ['No activity in 14+ days'] : []
  };

  // Calculate LTV score
  const purchaseCount = intents.purchase || 0;
  const ltvScore = {
    score: Math.min(100, purchaseCount * 20 + 50),
    tier: purchaseCount > 5 ? 'high' : purchaseCount > 2 ? 'medium' : 'low'
  };

  return {
    intents: predictions,
    nextAction: {
      action: nextAction,
      productId: signals.find((s: Record<string, unknown>) => s.productId)?.productId as string,
      probability: predictions[0]?.probability || 0.5
    },
    churnRisk,
    ltvScore
  };
}

function getIntentDistribution(signals: Record<string, unknown>[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (const signal of signals) {
    const category = signal.intentCategory as string;
    distribution[category] = (distribution[category] || 0) + 1;
  }
  return distribution;
}

function getTopSearchQueries(signals: Record<string, unknown>[]): { query: string; count: number }[] {
  const queries: Record<string, number> = {};
  for (const signal of signals) {
    if (signal.intentCategory === 'search' && signal.query) {
      queries[signal.query as string] = (queries[signal.query as string] || 0) + 1;
    }
  }
  return Object.entries(queries)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// ============================================
// ERROR HANDLER
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: err.message }
  });
});

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create indexes
    await IntentSignal.createIndexes();
    await IntentNode.createIndexes();
    await IntentEdge.createIndexes();
    await IntentSession.createIndexes();
    await IntentPrediction.createIndexes();

    app.listen(PORT, () => {
      console.log(`REZ Intent Graph Service running on port ${PORT}`);
      console.log(`📊 Graph-based intent tracking and prediction`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

export default app;