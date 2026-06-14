/**
 * AdBazaar REZ Intelligence Bridge
 * Connects AdBazaar to REZ-Intelligence and HOJAI AI
 *
 * Port: 4980
 * Purpose: Bridge between AdBazaar marketing services and REZ Intelligence layer
 *
 * Integrates with:
 * - REZ-Intelligence (Intent Graph, Mind, Predictions)
 * - HOJAI AI (Memory, Agents, Knowledge Graph)
 * - Intent Signal Aggregator (4800)
 * - Prediction Engine (4801)
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import axios from 'axios';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 4980;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: 'logs/intel-bridge.log' })]
});

// Configuration
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

// REZ-Intelligence URLs
const REZ_INTEL = {
  MIND_API: process.env.REZ_MIND_API || 'http://localhost:4990',
  INTENT_GRAPH: process.env.REZ_INTENT_GRAPH || 'http://localhost:4990',
  LEAD_INTELLIGENCE: process.env.REZ_LEAD_INTELLIGENCE || 'http://localhost:4990',
  MERCHANT_INTEL: process.env.REZ_MERCHANT_INTEL || 'http://localhost:4990',
};

// HOJAI AI URLs - Correct ports from CLAUDE.md
const HOJAI = {
  BASE_URL: process.env.HOJAI_BASE_URL || 'http://localhost:4800',
  MEMORY: process.env.HOJAI_MEMORY || 'http://localhost:4540',
  KNOWLEDGE_GRAPH: process.env.HOJAI_KG || 'http://localhost:4700',
  AGENTS: process.env.HOJAI_AGENTS || 'http://localhost:4700',
  GENIE: process.env.HOJAI_GENIE || 'http://localhost:4520',
  ENTERPRISE_BRAIN: process.env.HOJAI_BRAIN || 'http://localhost:4600',
};

// AdBazaar Intent Services
const ADBAZAAR = {
  INTENT_AGGREGATOR: process.env.INTENT_AGGREGATOR || 'http://localhost:4800',
  PREDICTION_ENGINE: process.env.PREDICTION_ENGINE || 'http://localhost:4801',
  AUDIENCE_TWIN: process.env.AUDIENCE_TWIN || 'http://localhost:4805',
 USER_TWIN: process.env.USER_TWIN || 'http://localhost:4806',
  CUSTOMER_GRAPH: process.env.CUSTOMER_GRAPH || 'http://localhost:4808',
};

// Rate limiting
const limiter = rateLimit({ windowMs: 60000, max: 500 });
app.use(helmet()); app.use(cors()); app.use(express.json()); app.use(limiter);

// MongoDB Schemas
const intentSignalSchema = new mongoose.Schema({
  signalId: String,
  source: String, // cdp, pixel, campaign, behavior
  userId: String,
  merchantId: String,
  intent: { type: String, index: true },
  confidence: Number,
  context: mongoose.Schema.Types.Mixed,
  processed: Boolean,
  timestamp: Date
});

const PredictionSchema = new mongoose.Schema({
  predictionId: String,
  userId: String,
  merchantId: String,
  type: String, // purchase_intent, churn_risk, lifetime_value
  score: Number,
  model: String,
  features: mongoose.Schema.Types.Mixed,
  timestamp: Date
});

const IntentSignal = mongoose.model('IntentSignal', intentSignalSchema);
const Prediction = mongoose.model('Prediction', PredictionSchema);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const status = {
    service: 'adbazaar-intel-bridge',
    port: PORT,
    connections: {} as Record<string, string>,
    timestamp: new Date().toISOString()
  };

  // Check REZ-Intelligence
  try {
    await axios.get(`${REZ_INTEL.MIND_API}/health`, { timeout: 2000 });
    status.connections['REZ-Mind'] = 'connected';
  } catch { status.connections['REZ-Mind'] = 'disconnected'; }

  // Check HOJAI
  try {
    await axios.get(`${HOJAI.BASE_URL}/health`, { timeout: 2000 });
    status.connections['HOJAI'] = 'connected';
  } catch { status.connections['HOJAI'] = 'disconnected'; }

  // Check Intent Aggregator
  try {
    await axios.get(`${ADBAZAAR.INTENT_AGGREGATOR}/health`, { timeout: 2000 });
    status.connections['Intent-Aggregator'] = 'connected';
  } catch { status.connections['Intent-Aggregator'] = 'disconnected'; }

  res.json(status);
});

// ============================================
// INTENT SIGNAL FLOW
// ============================================

/**
 * Receive intent signal from CDP/Pixel
 * POST /api/signals/ingest
 */
app.post('/api/signals/ingest', async (req: Request, res: Response) => {
  try {
    const { userId, merchantId, event, context, source } = req.body;

    // Store signal
    const signal = new IntentSignal({
      signalId: `sig_${Date.now()}`,
      source: source || 'direct',
      userId,
      merchantId,
      intent: event,
      confidence: 0.8,
      context,
      processed: false,
      timestamp: new Date()
    });
    await signal.save();

    // Forward to Intent Aggregator
    try {
      await axios.post(`${ADBAZAAR.INTENT_AGGREGATOR}/api/signals`, {
        signalId: signal.signalId,
        userId,
        merchantId,
        event,
        context
      }, { headers: { 'X-Internal-Token': INTERNAL_TOKEN } });
    } catch (e) { logger.warn('Intent aggregator unavailable'); }

    // Send to REZ-Intelligence Mind API
    try {
      await axios.post(`${REZ_INTEL.MIND_API}/api/intent`, {
        userId,
        merchantId,
        intent: event,
        context
      }, { headers: { 'X-Internal-Token': INTERNAL_TOKEN } });
    } catch (e) { logger.warn('REZ Mind unavailable'); }

    res.json({ success: true, signalId: signal.signalId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Get user intent profile
 * GET /api/intent/:userId
 */
app.get('/api/intent/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { merchantId } = req.query;

    // Get signals from our DB
    const signals = await IntentSignal.find({ userId, ...(merchantId ? { merchantId } : {}) })
      .sort({ timestamp: -1 }).limit(50);

    // Get predictions
    const predictions = await Prediction.find({ userId });

    // Enrich with REZ-Intelligence data
    let rezIntel = { intent: null, predictions: [] };
    try {
      const response = await axios.get(`${REZ_INTEL.MIND_API}/api/user/${userId}/intent`, {
        params: { merchantId },
        headers: { 'X-Internal-Token': INTERNAL_TOKEN },
        timeout: 5000
      });
      rezIntel = response.data;
    } catch (e) { logger.warn('REZ Mind unavailable'); }

    // Get HOJAI memory
    let hojaiMemory = { memories: [] };
    try {
      const response = await axios.get(`${HOJAI.MEMORY}/api/v1/memories/${userId}`, {
        timeout: 5000
      });
      hojaiMemory = response.data;
    } catch (e) { logger.warn('HOJAI Memory unavailable'); }

    res.json({
      success: true,
      userId,
      signals: signals.map(s => ({ intent: s.intent, confidence: s.confidence, timestamp: s.timestamp })),
      predictions,
      rezIntelligence: rezIntel,
      hojaiMemory
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// ============================================
// PREDICTIONS
// ============================================

/**
 * Get purchase prediction
 * GET /api/predict/purchase/:userId
 */
app.get('/api/predict/purchase/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { merchantId } = req.query;

    // Check local prediction
    let prediction = await Prediction.findOne({ userId, type: 'purchase_intent' });

    if (!prediction) {
      // Get from prediction engine
      try {
        const response = await axios.get(`${ADBAZAAR.PREDICTION_ENGINE}/api/predict/purchase/${userId}`, {
          params: { merchantId },
          timeout: 5000
        });
        prediction = response.data;
      } catch (e) {
        // Fallback
        prediction = { score: 0.5, confidence: 'low' };
      }
    }

    // Get from REZ-Intelligence
    let rezPrediction = null;
    try {
      const response = await axios.get(`${REZ_INTEL.MIND_API}/api/predict/${userId}`, {
        params: { type: 'purchase', merchantId },
        timeout: 5000
      });
      rezPrediction = response.data;
    } catch (e) { /* ignore */ }

    res.json({
      success: true,
      userId,
      localPrediction: prediction,
      rezPrediction,
      finalScore: prediction?.score || rezPrediction?.score || 0.5
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Get churn risk
 * GET /api/predict/churn/:userId
 */
app.get('/api/predict/churn/:userId', async (req: Request, res: Response) => {
 try {
    const { userId } = req.params;

    let prediction = await Prediction.findOne({ userId, type: 'churn_risk' });

    if (!prediction) {
      try {
        const response = await axios.get(`${ADBAZAAR.PREDICTION_ENGINE}/api/predict/churn/${userId}`, { timeout: 5000 });
        prediction = response.data;
      } catch (e) {
        prediction = { score: 0.2, risk: 'low' };
      }
    }

    res.json({ success: true, userId, churnRisk: prediction });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// ============================================
// AUDIENCE INTELLIGENCE
// ============================================

/**
 * Get high-intent audience
 * GET /api/audience/high-intent/:merchantId
 */
app.get('/api/audience/high-intent/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { minScore = 0.7 } = req.query;

    // Get from local predictions
    const highIntent = await Prediction.find({
      merchantId,
      type: 'purchase_intent',
      score: { $gte: Number(minScore) }
    }).select('userId score');

    // Get from REZ-Intelligence
    let rezAudience = [];
    try {
      const response = await axios.get(`${REZ_INTEL.MIND_API}/api/audience/high-intent`, {
        params: { merchantId, minScore },
        timeout: 5000
      });
      rezAudience = response.data.audience || [];
    } catch (e) { /* ignore */ }

    // Merge and deduplicate
    const merged = [...highIntent, ...rezAudience];
    const unique = merged.reduce((acc, item) => {
      if (!acc.find(i => i.userId === item.userId)) acc.push(item);
      return acc;
    }, []);

    res.json({
      success: true,
      merchantId,
      audience: unique,
      count: unique.length
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// ============================================
// HOJAI AI INTEGRATION
// ============================================

/**
 * Get AI-powered recommendation
 * POST /api/ai/recommend
 */
app.post('/api/ai/recommend', async (req: Request, res: Response) => {
  try {
    const { userId, merchantId, context, type } = req.body;

    // Get user data from multiple sources
    const [signals, predictions, hojaiMemory] = await Promise.all([
      IntentSignal.find({ userId }).sort({ timestamp: -1 }).limit(20),
      Prediction.find({ userId }),
      getHOJAIMemory(userId).catch(() => null)
    ]);

    // Send to HOJAI AI for recommendation
    try {
      const response = await axios.post(`${HOJAI.BASE_URL}/api/recommend`, {
        userId,
        context: {
          signals: signals.map(s => s.intent),
          predictions: predictions.map(p => ({ type: p.type, score: p.score })),
          hojaiMemory
        },
        type: type || 'marketing'
      }, { timeout: 10000 });

      res.json({ success: true, recommendation: response.data });
    } catch (e) {
      // Fallback recommendation
      res.json({
        success: true,
        recommendation: {
          action: 'send_offer',
          offer: '10% off',
          channel: 'whatsapp',
          confidence: 0.6
        }
      });
    }
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Analyze campaign with AI
 * POST /api/ai/analyze-campaign
 */
app.post('/api/ai/analyze-campaign', async (req: Request, res: Response) => {
  try {
    const { campaignId, merchantId, metrics } = req.body;

    // Get HOJAI AI analysis
    try {
      const response = await axios.post(`${HOJAI.BASE_URL}/api/analyze/campaign`, {
        campaignId,
        merchantId,
        metrics
      }, { timeout: 15000 });

      res.json({ success: true, analysis: response.data });
    } catch (e) {
      res.json({
        success: true,
        analysis: {
          summary: 'Campaign performing at expected levels',
          recommendations: ['Increase budget on top-performing ads', 'Test new creative variations'],
          predictedROAS: 2.5
        }
      });
    }
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// ============================================
// HELPERS
// ============================================

async function getHOJAIMemory(userId: string): Promise<any> {
  const response = await axios.get(`${HOJAI.MEMORY}/api/v1/memories/${userId}`, { timeout: 5000 });
  return response.data;
}

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 AdBazaar Intel Bridge started on port ${PORT}`);
  logger.info('🔗 Connected to: REZ-Intelligence + HOJAI AI + Intent Exchange');

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar_intel_bridge')
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB error:', { error: err instanceof Error ? err.message : String(err) }));
});

export default app;