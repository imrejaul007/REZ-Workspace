/**
 * REZ Mind Hotel Service
 *
 * AI-powered hotel intelligence service that:
 * - Ingests events from StayOwn and Hotel PMS
 * - Provides AI recommendations and predictions
 * - Delivers analytics and insights
 * - Integrates with REZ-Intelligence platform
 *
 * Port: 4017
 *
 * REZ-Intelligence Integration:
 * - Signal Aggregator (4121)
 * - Predictive Engine (4123)
 * - Unified Profile (4120)
 * - Realtime Segments (4126)
 * - Intent Predictor (4018)
 */

import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

// Routes
import eventRoutes from './routes/event-routes';
import analyticsRoutes from './routes/analytics-routes';
import calendarRoutes from './routes/calendar-routes';
import knowledgeRoutes from './routes/knowledge-routes';
import pricingRoutes from './routes/pricing-routes';

// AI Service
import { hotelAIService } from './services/ai-service';

// Recommendations Engine
import { recommendationsEngine } from './services/recommendations-engine';

// REZ-Intelligence Integration
import { rezIntelligence } from './integrations/rezIntelligence';

const app = express();
const PORT = parseInt(process.env.PORT || '4017', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_mind_hotel';

// REZ-Intelligence URLs (from environment)
const REZ_INTELLIGENCE_URL = process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4121';
const INTENT_PREDICTOR_URL = process.env.INTENT_PREDICTOR_URL || 'http://localhost:4018';
const UNIFIED_PROFILE_URL = process.env.UNIFIED_PROFILE_URL || 'http://localhost:4120';

// ─── Middleware ───────────────────────────────────────────────────────────────

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Health Endpoints ───────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'rez-mind-hotel',
    version: '1.0.0',
    integratedWith: 'REZ-Intelligence',
    intelligence: {
      signalAggregator: REZ_INTELLIGENCE_URL,
      intentPredictor: INTENT_PREDICTOR_URL,
      unifiedProfile: UNIFIED_PROFILE_URL,
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  let isReady = true;
  const checks = {
    mongodb: false,
    rezIntelligence: false,
  };

  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not connected');
    }
    if (!mongoose.connection.db) {
      throw new Error('MongoDB database not available');
    }
    await mongoose.connection.db.admin().ping();
    checks.mongodb = true;
  } catch {
    isReady = false;
  }

  // Check REZ-Intelligence connectivity
  try {
    const response = await fetch(`${REZ_INTELLIGENCE_URL}/health`, {
      signal: AbortSignal.timeout(2000)
    });
    checks.rezIntelligence = response.ok;
  } catch {
    // REZ-Intelligence is optional - don't fail readiness
    (checks as any).rezIntelligence = null; // null means unchecked/unavailable
  }

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────

// Event ingestion routes
app.use('/api/events', eventRoutes);

// Analytics routes
app.use('/api/analytics', analyticsRoutes);

// Calendar/Event routes
app.use('/api/calendar', calendarRoutes);

// Knowledge base routes
app.use('/api/knowledge', knowledgeRoutes);

// Dynamic pricing routes
app.use('/ai', pricingRoutes);

// ─── AI Endpoints ──────────────────────────────────────────────────────────

/**
 * POST /api/ai/recommendations
 * Get personalized hotel recommendations
 */
app.post('/api/ai/recommendations', async (req: Request, res: Response) => {
  try {
    const { userId, city, checkIn, checkOut, budget, guests } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, message: 'userId is required' });
      return;
    }

    const recommendations = await hotelAIService.getRecommendations(userId, {
      city,
      checkIn,
      checkOut,
      budget,
      guests,
    });

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('[AI] Recommendations error:', error);
    res.status(500).json({ success: false, message: 'Failed to get recommendations' });
  }
});

/**
 * POST /api/ai/pricing
 * Get dynamic pricing for a room
 */
app.post('/api/ai/pricing', async (req: Request, res: Response) => {
  try {
    const { hotelId, roomTypeId, baseRate, checkIn, checkOut } = req.body;

    if (!hotelId || !baseRate || !checkIn || !checkOut) {
      res.status(400).json({
        success: false,
        message: 'hotelId, baseRate, checkIn, and checkOut are required',
      });
      return;
    }

    const pricing = await hotelAIService.getDynamicPricing(
      hotelId,
      roomTypeId || 'default',
      baseRate,
      checkIn,
      checkOut
    );

    res.json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    console.error('[AI] Pricing error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate pricing' });
  }
});

/**
 * POST /api/ai/satisfaction
 * Predict guest satisfaction
 */
app.post('/api/ai/satisfaction', async (req: Request, res: Response) => {
  try {
    const { bookingId, checkInTime, serviceResponseTimes, totalCharges, specialRequests, ratings } = req.body;

    const prediction = await hotelAIService.predictSatisfaction(bookingId, {
      checkInTime,
      serviceResponseTimes,
      totalCharges,
      specialRequests,
      ratings,
    });

    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error('[AI] Satisfaction prediction error:', error);
    res.status(500).json({ success: false, message: 'Failed to predict satisfaction' });
  }
});

/**
 * POST /api/ai/sla-predict
 * Predict service SLA
 */
app.post('/api/ai/sla-predict', async (req: Request, res: Response) => {
  try {
    const { hotelId, requestType } = req.body;

    if (!hotelId || !requestType) {
      res.status(400).json({ success: false, message: 'hotelId and requestType are required' });
      return;
    }

    const prediction = await hotelAIService.predictSLA(hotelId, requestType);

    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error('[AI] SLA prediction error:', error);
    res.status(500).json({ success: false, message: 'Failed to predict SLA' });
  }
});

// ─── Recommendations Engine Endpoints ───────────────────────────────────────

/**
 * GET /ai/recommendations/:userId
 * Get personalized "For You" recommendations for a user
 *
 * Query params:
 * - city: Filter by city
 * - checkIn: Check-in date (ISO string)
 * - checkOut: Check-out date (ISO string)
 * - budget: Max budget in rupees
 * - guests: Number of guests
 */
app.get('/ai/recommendations/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { city, checkIn, checkOut, budget, guests } = req.query;

    const result = await recommendationsEngine.getRecommendations(userId, {
      city: city as string,
      checkIn: checkIn ? new Date(checkIn as string) : undefined,
      checkOut: checkOut ? new Date(checkOut as string) : undefined,
      budget: budget ? parseInt(budget as string, 10) : undefined,
      guests: guests ? parseInt(guests as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Recommendations] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /ai/upsells/:bookingId
 * Get upsell recommendations for an active booking
 */
app.get('/ai/upsells/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      res.status(400).json({ success: false, message: 'bookingId is required' });
      return;
    }

    const result = await recommendationsEngine.getUpsells(bookingId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Upsells] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get upsell recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /ai/predictions/:userId
 * Predict rebooking likelihood and recommend next destinations
 */
app.get('/ai/predictions/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ success: false, message: 'userId is required' });
      return;
    }

    const prediction = await recommendationsEngine.predictRebooking(userId);

    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error('[Predictions] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict rebooking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ─── Error Handler ─────────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// ─── Server Startup ────────────────────────────────────────────────────────

async function startServer(): Promise<void> {
  logger.info('[Startup] Starting REZ Mind Hotel Service...');

  try {
    // Connect to MongoDB
    logger.info('[Startup] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logger.info('[Startup] MongoDB connected');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`[Startup] REZ Mind Hotel Service running on port ${PORT}`);
      logger.info(`[Startup] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`[Shutdown] Received ${signal}, shutting down...`);
      server.close(async () => {
        // Cleanup REZ-Intelligence client
        rezIntelligence.destroy();
        logger.info('[Shutdown] REZ-Intelligence client destroyed');
        await mongoose.disconnect();
        logger.info('[Shutdown] MongoDB disconnected');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('[Startup] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
