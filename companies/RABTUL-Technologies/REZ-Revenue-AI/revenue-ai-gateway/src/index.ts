/**
 * REZ Revenue AI - Unified Gateway
 * Single entry point for all Revenue AI services
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import axios, { AxiosInstance } from 'axios';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })],
});

// ================== SERVICE CLIENTS ==================

interface ServiceClients {
  pricingEngine: AxiosInstance;
  demandForecast: AxiosInstance;
  offerOptimizer: AxiosInstance;
  cashbackOptimizer: AxiosInstance;
  merchantAdvisor: AxiosInstance;
}

const createServiceClients = (): ServiceClients => {
  const baseUrl = process.env.SERVICE_BASE_URL || 'http://localhost';

  return {
    pricingEngine: axios.create({
      baseURL: `${baseUrl}:${process.env.PRICING_ENGINE_PORT || 4301}`,
      timeout: 5000,
    }),
    demandForecast: axios.create({
      baseURL: `${baseUrl}:${process.env.DEMAND_FORECAST_PORT || 4302}`,
      timeout: 5000,
    }),
    offerOptimizer: axios.create({
      baseURL: `${baseUrl}:${process.env.OFFER_OPTIMIZER_PORT || 4303}`,
      timeout: 5000,
    }),
    cashbackOptimizer: axios.create({
      baseURL: `${baseUrl}:${process.env.CASHBACK_OPTIMIZER_PORT || 4304}`,
      timeout: 5000,
    }),
    merchantAdvisor: axios.create({
      baseURL: `${baseUrl}:${process.env.MERCHANT_ADVISOR_PORT || 4305}`,
      timeout: 5000,
    }),
  };
};

// ================== EXPRESS APP ==================

const app = express();
const clients = createServiceClients();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '5mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  const startTime = Date.now();

  res.on('finish', () => {
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - startTime,
    });
  });

  next();
});

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const checks = {
    pricingEngine: false,
    demandForecast: false,
    offerOptimizer: false,
    cashbackOptimizer: false,
    merchantAdvisor: false,
  };

  await Promise.allSettled([
    axios.get(`http://localhost:${process.env.PRICING_ENGINE_PORT || 4301}/health`).then(() => checks.pricingEngine = true),
    axios.get(`http://localhost:${process.env.DEMAND_FORECAST_PORT || 4302}/health`).then(() => checks.demandForecast = true),
    axios.get(`http://localhost:${process.env.OFFER_OPTIMIZER_PORT || 4303}/health`).then(() => checks.offerOptimizer = true),
    axios.get(`http://localhost:${process.env.CASHBACK_OPTIMIZER_PORT || 4304}/health`).then(() => checks.cashbackOptimizer = true),
    axios.get(`http://localhost:${process.env.MERCHANT_ADVISOR_PORT || 4305}/health`).then(() => checks.merchantAdvisor = true),
  ]);

  const allHealthy = Object.values(checks).every(v => v);

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    service: 'rez-revenue-ai-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    checks,
  });
});

// Readiness check
app.get('/ready', (req: Request, res: Response) => {
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

// ================== PRICING ROUTES ==================

/**
 * POST /api/v1/pricing/calculate
 * Calculate dynamic price
 */
app.post('/api/v1/pricing/calculate', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    const response = await clients.pricingEngine.post('/api/v1/pricing/calculate', req.body, {
      headers: { 'x-request-id': requestId },
    });

    res.json({
      ...response.data,
      metadata: {
        ...response.data.metadata,
        gatewayTimestamp: new Date().toISOString(),
        calculationTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    logger.error('Pricing calculation error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_ERROR', message: 'Failed to calculate price' },
    });
  }
});

/**
 * POST /api/v1/pricing/batch
 * Batch pricing calculation
 */
app.post('/api/v1/pricing/batch', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    const response = await clients.pricingEngine.post('/api/v1/pricing/batch', req.body, {
      headers: { 'x-request-id': requestId },
    });

    res.json({
      ...response.data,
      metadata: {
        ...response.data.metadata,
        gatewayTimestamp: new Date().toISOString(),
        calculationTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    logger.error('Batch pricing error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_ERROR', message: 'Failed to calculate batch prices' },
    });
  }
});

/**
 * GET /api/v1/pricing/caps
 * Get pricing caps for all verticals
 */
app.get('/api/v1/pricing/caps', async (req: Request, res: Response) => {
  try {
    const response = await clients.pricingEngine.get('/api/v1/pricing/caps');
    res.json(response.data);
  } catch (error) {
    logger.error('Get pricing caps error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_ERROR', message: 'Failed to get pricing caps' },
    });
  }
});

// ================== DEMAND FORECAST ROUTES ==================

/**
 * POST /api/v1/forecast
 * Generate demand forecast
 */
app.post('/api/v1/forecast', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    const response = await clients.demandForecast.post('/api/v1/forecast', req.body, {
      headers: { 'x-request-id': requestId },
    });

    res.json({
      ...response.data,
      metadata: {
        ...response.data.metadata,
        gatewayTimestamp: new Date().toISOString(),
        calculationTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    logger.error('Forecast error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_ERROR', message: 'Failed to generate forecast' },
    });
  }
});

/**
 * GET /api/v1/forecast/:merchantId
 * Get forecast for merchant
 */
app.get('/api/v1/forecast/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { horizon = 'week' } = req.query;

    const response = await clients.demandForecast.get(`/api/v1/forecast/${merchantId}`, {
      params: { horizon },
    });

    res.json(response.data);
  } catch (error) {
    logger.error('Get forecast error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_ERROR', message: 'Failed to get forecast' },
    });
  }
});

// ================== OFFER ROUTES ==================

/**
 * POST /api/v1/offers/optimize
 * Optimize offer
 */
app.post('/api/v1/offers/optimize', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    const response = await clients.offerOptimizer.post('/api/v1/offers/optimize', req.body, {
      headers: { 'x-request-id': requestId },
    });

    res.json({
      ...response.data,
      metadata: {
        ...response.data.metadata,
        gatewayTimestamp: new Date().toISOString(),
        calculationTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    logger.error('Offer optimization error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_ERROR', message: 'Failed to optimize offer' },
    });
  }
});

/**
 * GET /api/v1/offers/templates
 * Get offer templates
 */
app.get('/api/v1/offers/templates', async (req: Request, res: Response) => {
  try {
    const response = await clients.offerOptimizer.get('/api/v1/offers/templates');
    res.json(response.data);
  } catch (error) {
    logger.error('Get offer templates error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_ERROR', message: 'Failed to get offer templates' },
    });
  }
});

// ================== CASHBACK ROUTES ==================

/**
 * POST /api/v1/cashback/optimize
 * Optimize cashback
 */
app.post('/api/v1/cashback/optimize', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    const response = await clients.cashbackOptimizer.post('/api/v1/cashback/optimize', req.body, {
      headers: { 'x-request-id': requestId },
    });

    res.json({
      ...response.data,
      metadata: {
        ...response.data.metadata,
        gatewayTimestamp: new Date().toISOString(),
        calculationTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    logger.error('Cashback optimization error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_ERROR', message: 'Failed to optimize cashback' },
    });
  }
});

/**
 * GET /api/v1/cashback/segments/:vertical
 * Get segment cashback rates
 */
app.get('/api/v1/cashback/segments/:vertical', async (req: Request, res: Response) => {
  try {
    const { vertical } = req.params;
    const response = await clients.cashbackOptimizer.get(`/api/v1/cashback/segments/${vertical}`);
    res.json(response.data);
  } catch (error) {
    logger.error('Get segment rates error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_ERROR', message: 'Failed to get segment rates' },
    });
  }
});

// ================== MERCHANT ADVISOR ROUTES ==================

/**
 * POST /api/v1/advisor/diagnosis
 * Get merchant diagnosis
 */
app.post('/api/v1/advisor/diagnosis', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    const response = await clients.merchantAdvisor.post('/api/v1/advisor/diagnosis', req.body, {
      headers: { 'x-request-id': requestId },
    });

    res.json({
      ...response.data,
      metadata: {
        ...response.data.metadata,
        gatewayTimestamp: new Date().toISOString(),
        calculationTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    logger.error('Merchant diagnosis error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_ERROR', message: 'Failed to get diagnosis' },
    });
  }
});

/**
 * GET /api/v1/advisor/ask
 * Ask merchant advisor
 */
app.get('/api/v1/advisor/ask', async (req: Request, res: Response) => {
  try {
    const { merchantId, question } = req.query;

    if (!merchantId || !question) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMS', message: 'merchantId and question are required' },
      });
    }

    const response = await clients.merchantAdvisor.get('/api/v1/advisor/ask', {
      params: { merchantId, question },
    });

    res.json(response.data);
  } catch (error) {
    logger.error('Merchant advisor error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_ERROR', message: 'Failed to get answer' },
    });
  }
});

/**
 * GET /api/v1/insights/:merchantId
 * Get merchant insights
 */
app.get('/api/v1/insights/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const response = await clients.merchantAdvisor.get(`/api/v1/insights/${merchantId}`);
    res.json(response.data);
  } catch (error) {
    logger.error('Get insights error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_ERROR', message: 'Failed to get insights' },
    });
  }
});

// ================== UNIFIED ENDPOINT ==================

/**
 * POST /api/v1/revenue/optimize
 * Unified endpoint for full revenue optimization
 */
app.post('/api/v1/revenue/optimize', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;
    const { merchantId, entityId, basePrice, cost, vertical, audience, location, context } = req.body;

    // Execute all optimizations in parallel
    const [pricingResult, offerResult, cashbackResult] = await Promise.allSettled([
      clients.pricingEngine.post('/api/v1/pricing/calculate', {
        context: {
          entity: { id: entityId, type: 'service', category: 'general', vertical, name: entityId, basePrice, cost },
          ...context,
          location,
        },
      }, { headers: { 'x-request-id': requestId } }),
      clients.offerOptimizer.post('/api/v1/offers/optimize', {
        merchantId,
        entityId,
        basePrice,
        audience,
        context,
        optimizationGoal: 'revenue',
      }, { headers: { 'x-request-id': requestId } }),
      clients.cashbackOptimizer.post('/api/v1/cashback/optimize', {
        merchantId,
        userId: audience?.userId,
        orderValue: basePrice,
        category: 'general',
        vertical,
        context: { audience, demand: context?.demand?.current },
      }, { headers: { 'x-request-id': requestId } }),
    ]);

    const results: Record<string, unknown> = {};

    if (pricingResult.status === 'fulfilled') {
      results.pricing = pricingResult.value.data;
    }
    if (offerResult.status === 'fulfilled') {
      results.offer = offerResult.value.data;
    }
    if (cashbackResult.status === 'fulfilled') {
      results.cashback = cashbackResult.value.data;
    }

    logger.info('Revenue optimization completed', {
      merchantId,
      entityId,
      duration: Date.now() - startTime,
    });

    res.json({
      success: true,
      data: results,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        calculationTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    logger.error('Revenue optimization error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_ERROR', message: 'Failed to optimize revenue' },
    });
  }
});

// ================== METRICS ==================

app.get('/metrics', (req: Request, res: Response) => {
  res.json({
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

// ================== ERROR HANDLER ==================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err, path: req.path });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  });
});

// ================== SERVER START ==================

const PORT = process.env.PORT || 4300;

app.listen(PORT, () => {
  logger.info('REZ Revenue AI Gateway started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    services: {
      pricingEngine: `localhost:${process.env.PRICING_ENGINE_PORT || 4301}`,
      demandForecast: `localhost:${process.env.DEMAND_FORECAST_PORT || 4302}`,
      offerOptimizer: `localhost:${process.env.OFFER_OPTIMIZER_PORT || 4303}`,
      cashbackOptimizer: `localhost:${process.env.CASHBACK_OPTIMIZER_PORT || 4304}`,
      merchantAdvisor: `localhost:${process.env.MERCHANT_ADVISOR_PORT || 4305}`,
    },
  });
});

export default app;
