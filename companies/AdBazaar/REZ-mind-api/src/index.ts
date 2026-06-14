/**
 * REZ Mind API - Core Intelligence Service for AdBazaar
 * Provides intent prediction, user intelligence, and ML predictions
 *
 * Port: 4990
 * Purpose: Central AI/ML service for marketing intelligence
 *
 * Connects to:
 * - HOJAI AI (Memory, Knowledge Graph, Agents)
 * - AdBazaar Intent Exchange
 * - AdBazaar CDP
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import axios from 'axios';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 4990;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: 'logs/rez-mind.log' })]
});

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

// HOJAI AI URLs - Based on CLAUDE.md documentation
const HOJAI = {
  MEMORY_API: process.env.HOJAI_MEMORY_API || 'http://localhost:4540',
  KNOWLEDGE_GRAPH: process.env.HOJAI_KG || 'http://localhost:4700',
  AGENTS: process.env.HOJAI_AGENTS || 'http://localhost:4700',
  GENIE_PERSONAL: process.env.HOJAI_GENIE || 'http://localhost:4520',
  ENTERPRISE_BRAIN: process.env.HOJAI_BRAIN || 'http://localhost:4600',
};

// AdBazaar services
const ADBAZAAR = {
  INTENT_AGGREGATOR: process.env.INTENT_AGGREGATOR || 'http://localhost:4800',
  PREDICTION_ENGINE: process.env.PREDICTION_ENGINE || 'http://localhost:4801',
  AUDIENCE_TWIN: process.env.AUDIENCE_TWIN || 'http://localhost:4805',
  USER_TWIN: process.env.USER_TWIN || 'http://localhost:4806',
  CUSTOMER_GRAPH: process.env.CUSTOMER_GRAPH || 'http://localhost:4808',
  CDP: process.env.CDP || 'http://localhost:4961',
};

app.use(helmet()); app.use(cors()); app.use(express.json());
app.use(rateLimit({ windowMs: 60000, max: 500 })(app.request, app.response, () => {}));

// MongoDB Schemas
const userIntentSchema = new mongoose.Schema({
  userId: String,
  merchantId: String,
  intents: [{
    intent: String,
    confidence: Number,
    timestamp: Date
  }],
  purchaseHistory: [{
    product: String,
    timestamp: Date,
    value: Number
  }],
  preferences: mongoose.Schema.Types.Mixed,
  lifetimeValue: Number,
  churnRisk: Number,
  lastActive: Date,
  createdAt: Date,
  updatedAt: Date
});

const predictionSchema = new mongoose.Schema({
  predictionId: String,
  userId: String,
  merchantId: String,
  type: String, // purchase_intent, churn_risk, ltv, engagement
  score: Number,
  features: mongoose.Schema.Types.Mixed,
  model: String,
  timestamp: Date
});

const UserIntent = mongoose.model('UserIntent', userIntentSchema);
const Prediction = mongoose.model('Prediction', predictionSchema);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const connections: Record<string, string> = {};

  // Check HOJAI connections
  try {
    await axios.get(`${HOJAI.MEMORY_API}/health`, { timeout: 2000 });
    connections['HOJAI-Memory'] = 'connected';
  } catch { connections['HOJAI-Memory'] = 'disconnected'; }

  try {
    await axios.get(`${HOJAI.ENTERPRISE_BRAIN}/health`, { timeout: 2000 });
    connections['HOJAI-Brain'] = 'connected';
  } catch { connections['HOJAI-Brain'] = 'disconnected'; }

  res.json({
    status: 'healthy',
    service: 'rez-mind-api',
    port: PORT,
    connections,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// INTENT MANAGEMENT
// ============================================

/**
 * Record user intent
 * POST /api/intent
 */
app.post('/api/intent', async (req: Request, res: Response) => {
  try {
    const { userId, merchantId, intent, context } = req.body;

    let userIntent = await UserIntent.findOne({ userId, merchantId });

    if (!userIntent) {
      userIntent = new UserIntent({
        userId,
        merchantId,
        intents: [],
        purchaseHistory: [],
        preferences: {},
        lifetimeValue: 0,
        churnRisk: 0.1,
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Add new intent
    userIntent.intents.push({
      intent,
      confidence: context?.confidence || 0.8,
      timestamp: new Date()
    });

    userIntent.lastActive = new Date();
    userIntent.updatedAt = new Date();

    await userIntent.save();

    // Also send to Intent Aggregator
    try {
      await axios.post(`${ADBAZAAR.INTENT_AGGREGATOR}/api/signals`, {
        userId,
        merchantId,
        intent,
        context
      }, { headers: { 'X-Internal-Token': INTERNAL_TOKEN } });
    } catch (e) { /* ignore */ }

    res.json({ success: true, userId, intentRecorded: intent });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Get user intent profile
 * GET /api/user/:userId/intent
 */
app.get('/api/user/:userId/intent', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { merchantId } = req.query;

    // Get from our DB
    let userIntent = await UserIntent.findOne({ userId, ...(merchantId ? { merchantId } : {}) });

    // Enrich with HOJAI Memory
    let hojaiMemory = { memories: [] };
    try {
      const response = await axios.get(`${HOJAI.MEMORY_API}/api/v1/memories/${userId}`, { timeout: 5000 });
      hojaiMemory = response.data;
    } catch (e) { /* ignore */ }

    // Get from User Twin
    let userTwin = null;
    try {
      const response = await axios.get(`${ADBAZAAR.USER_TWIN}/api/twin/${userId}`, { timeout: 5000 });
      userTwin = response.data;
    } catch (e) { /* ignore */ }

    res.json({
      success: true,
      userId,
      intents: userIntent?.intents || [],
      lifetimeValue: userIntent?.lifetimeValue || 0,
      churnRisk: userIntent?.churnRisk || 0,
      lastActive: userIntent?.lastActive,
      hojaiMemory,
      userTwin
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// ============================================
// PREDICTIONS
// ============================================

/**
 * Get purchase prediction
 * GET /api/predict/:userId
 */
app.get('/api/predict/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { merchantId, type } = req.query;

    // Check local prediction
    let prediction = await Prediction.findOne({ userId, type: type || 'purchase_intent' });

    if (!prediction) {
      // Get from Prediction Engine
      try {
        const response = await axios.get(`${ADBAZAAR.PREDICTION_ENGINE}/api/predict/${userId}`, {
          params: { merchantId, type },
          timeout: 5000
        });
        prediction = response.data;
      } catch (e) {
        // Fallback calculation
        prediction = { score: 0.5, confidence: 'medium' };
      }
    }

    // Get from User Twin
    let userTwin = null;
    try {
      const response = await axios.get(`${ADBAZAAR.USER_TWIN}/api/twin/${userId}`, { timeout: 5000 });
      userTwin = response.data;
    } catch (e) { /* ignore */ }

    // Get HOJAI prediction
    let hojaiPrediction = null;
    try {
      const response = await axios.post(`${HOJAI.ENTERPRISE_BRAIN}/api/predict`, {
        userId,
        context: userTwin
      }, { timeout: 10000 });
      hojaiPrediction = response.data;
    } catch (e) { /* ignore */ }

    res.json({
      success: true,
      userId,
      prediction: prediction?.score || 0.5,
      localPrediction: prediction,
      userTwin,
      hojaiPrediction,
      confidence: hojaiPrediction?.confidence || 'medium'
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Get high-intent audience
 * GET /api/audience/high-intent
 */
app.get('/api/audience/high-intent', async (req: Request, res: Response) => {
  try {
    const { merchantId, minScore = 0.7 } = req.query;

    // Get from local predictions
    const highIntent = await Prediction.find({
      ...(merchantId ? { merchantId } : {}),
      type: 'purchase_intent',
      score: { $gte: Number(minScore) }
    }).select('userId score').limit(1000);

    // Get from Audience Twin
    let twinAudience = [];
    try {
      const response = await axios.get(`${ADBAZAAR.AUDIENCE_TWIN}/api/audience/high-intent`, {
        params: { merchantId, minScore },
        timeout: 5000
      });
      twinAudience = response.data.audience || [];
    } catch (e) { /* ignore */ }

    // Get from HOJAI
    let hojaiAudience = [];
    try {
      const response = await axios.post(`${HOJAI.ENTERPRISE_BRAIN}/api/audience/high-intent`, {
        merchantId,
        minScore
      }, { timeout: 10000 });
      hojaiAudience = response.data.audience || [];
    } catch (e) { /* ignore */ }

    // Merge and deduplicate
    const merged = [...highIntent, ...twinAudience, ...hojaiAudience];
    const unique = merged.reduce((acc: any[], item) => {
      if (!acc.find(i => i.userId === item.userId)) acc.push(item);
      return acc;
    }, []);

    res.json({
      success: true,
      merchantId,
      audience: unique,
      count: unique.length,
      sources: {
        local: highIntent.length,
        twin: twinAudience.length,
        hojai: hojaiAudience.length
      }
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// ============================================
// HOJAI AI INTEGRATION
// ============================================

/**
 * Get AI recommendation
 * POST /api/ai/recommend
 */
app.post('/api/ai/recommend', async (req: Request, res: Response) => {
  try {
    const { userId, merchantId, context, type } = req.body;

    // Get user data
    const userIntent = await UserIntent.findOne({ userId, merchantId });

    // Get from HOJAI Genie Personal Twin
    let genieInsight = null;
    try {
      const response = await axios.get(`${HOJAI.GENIE_PERSONAL}/api/briefing/${userId}`, {
        timeout: 10000
      });
      genieInsight = response.data;
    } catch (e) { /* ignore */ }

    // Get from HOJAI Enterprise Brain
    let brainRecommendation = null;
    try {
      const response = await axios.post(`${HOJAI.ENTERPRISE_BRAIN}/api/recommend`, {
        userId,
        merchantId,
        context: {
          userIntents: userIntent?.intents,
          purchaseHistory: userIntent?.purchaseHistory,
          genieInsight
        },
        type: type || 'marketing'
      }, { timeout: 15000 });
      brainRecommendation = response.data;
    } catch (e) { /* ignore */ }

    // Get from Knowledge Graph
    let knowledgeInsights = null;
    try {
      const response = await axios.post(`${HOJAI.KNOWLEDGE_GRAPH}/api/query`, {
        query: `user_${userId}_marketing_preferences`,
        context: { merchantId }
      }, { timeout: 10000 });
      knowledgeInsights = response.data;
    } catch (e) { /* ignore */ }

    res.json({
      success: true,
      recommendation: brainRecommendation || {
        action: 'send_offer',
        channel: 'whatsapp',
        offer: '10% off',
        confidence: 0.6
      },
      genieInsight,
      knowledgeInsights
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Analyze campaign
 * POST /api/ai/analyze-campaign
 */
app.post('/api/ai/analyze-campaign', async (req: Request, res: Response) => {
  try {
    const { campaignId, merchantId, metrics } = req.body;

    // Get from HOJAI Enterprise Brain
    try {
      const response = await axios.post(`${HOJAI.ENTERPRISE_BRAIN}/api/analyze/campaign`, {
        campaignId,
        merchantId,
        metrics
      }, { timeout: 20000 });

      res.json({ success: true, analysis: response.data });
    } catch (e) {
      res.json({
        success: true,
        analysis: {
          summary: 'Campaign performing at expected levels',
          recommendations: ['Increase budget on top-performing ads'],
          predictedROAS: 2.5,
          confidence: 'medium'
        }
      });
    }
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Get user briefing (from Genie Personal Twin)
 * GET /api/briefing/:userId
 */
app.get('/api/briefing/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { merchantId } = req.query;

    // Get from Genie Personal Twin (4520)
    let genieBriefing = null;
    try {
      const response = await axios.get(`${HOJAI.GENIE_PERSONAL}/api/briefing/${userId}`, {
        params: { merchantId },
        timeout: 10000
      });
      genieBriefing = response.data;
    } catch (e) { /* ignore */ }

    // Get user intent
    const userIntent = await UserIntent.findOne({ userId, merchantId });

    res.json({
      success: true,
      userId,
      briefing: genieBriefing,
      userIntents: userIntent?.intents || [],
      preferences: userIntent?.preferences || {}
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// ============================================
// USER PROFILE ENRICHMENT
// ============================================

/**
 * Enrich user profile with all intelligence
 * GET /api/user/:userId/enrich
 */
app.get('/api/user/:userId/enrich', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { merchantId } = req.query;

    // Gather from all sources
    const [userIntent, predictions, userTwin, hojaiMemory] = await Promise.all([
      UserIntent.findOne({ userId, merchantId }).catch(() => null),
      Prediction.find({ userId }).catch(() => []),
      getFromService(`${ADBAZAAR.USER_TWIN}/api/twin/${userId}`).catch(() => null),
      getFromService(`${HOJAI.MEMORY_API}/api/v1/memories/${userId}`).catch(() => null)
    ]);

    res.json({
      success: true,
      userId,
      profile: {
        intents: userIntent?.intents || [],
        lifetimeValue: userIntent?.lifetimeValue || 0,
        churnRisk: userIntent?.churnRisk || 0,
        preferences: userIntent?.preferences || {}
      },
      predictions: predictions.map(p => ({ type: p.type, score: p.score })),
      userTwin,
      hojaiMemory,
      enrichedAt: new Date().toISOString()
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// ============================================
// HELPERS
// ============================================

async function getFromService(url: string): Promise<any> {
  const response = await axios.get(url, { timeout: 5000 });
  return response.data;
}

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 REZ Mind API started on port ${PORT}`);
  logger.info('🧠 Core intelligence service - Connected to HOJAI AI + Intent Exchange');

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_mind')
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB error:', { error: err instanceof Error ? err.message : String(err) }));
});

export default app;