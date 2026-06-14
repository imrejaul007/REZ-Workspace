import { Request, Response, NextFunction } from 'express';
import client, { Counter, Histogram, Gauge, Registry } from 'prom-client';
import logger from '../config/logger.js';

// Create a custom registry
const register = new Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestsTotal = new Counter({
  name: 'yield_brain_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: 'yield_brain_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const yieldDecisionsTotal = new Counter({
  name: 'yield_brain_decisions_total',
  help: 'Total number of yield decisions',
  labelNames: ['optimization_goal', 'result'],
  registers: [register],
});

const yieldDecisionRevenue = new Histogram({
  name: 'yield_brain_decision_revenue',
  help: 'Expected revenue per yield decision',
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const yieldDecisionConfidence = new Gauge({
  name: 'yield_brain_decision_confidence',
  help: 'Confidence score of yield decisions',
  registers: [register],
});

const floorPriceValue = new Gauge({
  name: 'yield_brain_floor_price',
  help: 'Current floor price value',
  labelNames: ['inventory_type'],
  registers: [register],
});

const activeBidsGauge = new Gauge({
  name: 'yield_brain_active_bids',
  help: 'Number of active bids in landscape',
  labelNames: ['inventory_type'],
  registers: [register],
});

const abTestsRunning = new Gauge({
  name: 'yield_brain_ab_tests_running',
  help: 'Number of running A/B tests',
  registers: [register],
});

const strategiesActive = new Gauge({
  name: 'yield_brain_strategies_active',
  help: 'Number of active yield strategies',
  registers: [register],
});

// Metrics endpoint
export async function metricsHandler(req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics', { error });
    res.status(500).end('Error generating metrics');
  }
}

// Request metrics middleware
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const path = normalizePath(req.path);

    httpRequestsTotal.inc({ method: req.method, path, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, path, status: res.statusCode }, duration);
  });

  next();
}

// Normalize path to avoid high cardinality
function normalizePath(path: string): string {
  // Replace dynamic segments with placeholders
  return path
    .replace(/\/api\/yield\/floor\/[^/]+/, '/api/yield/floor/:id')
    .replace(/\/api\/yield\/decision\/[^/]+/, '/api/yield/decision/:id')
    .replace(/\/api\/strategies\/[^/]+/, '/api/strategies/:id')
    .replace(/\/api\/tests\/[^/]+/, '/api/tests/:id');
}

// Record decision metrics
export function recordDecisionMetrics(
  optimizationGoal: string,
  result: 'success' | 'no_ad' | 'error',
  revenue: number,
  confidence: number
): void {
  yieldDecisionsTotal.inc({ optimization_goal: optimizationGoal, result });
  yieldDecisionRevenue.observe(revenue);
  yieldDecisionConfidence.set(confidence);
}

// Record floor price
export function recordFloorPrice(inventoryType: string, price: number): void {
  floorPriceValue.set({ inventory_type: inventoryType }, price);
}

// Record bid landscape
export function recordActiveBids(inventoryType: string, count: number): void {
  activeBidsGauge.set({ inventory_type: inventoryType }, count);
}

// Record A/B test status
export function recordABTests(count: number): void {
  abTestsRunning.set(count);
}

// Record active strategies
export function recordStrategies(count: number): void {
  strategiesActive.set(count);
}

export { register };