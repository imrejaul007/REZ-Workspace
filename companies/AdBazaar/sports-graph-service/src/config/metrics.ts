import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import dotenv from 'dotenv';

dotenv.config();

export const metricsRegistry = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register: metricsRegistry });

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: 'sports_graph_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [metricsRegistry]
});

export const httpRequestTotal = new Counter({
  name: 'sports_graph_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry]
});

// Business metrics
export const eventsTrackedTotal = new Counter({
  name: 'sports_graph_events_tracked_total',
  help: 'Total number of sports events tracked',
  labelNames: ['sport', 'status'],
  registers: [metricsRegistry]
});

export const activeEventsGauge = new Gauge({
  name: 'sports_graph_active_events',
  help: 'Number of active/upcoming sports events',
  labelNames: ['sport', 'city'],
  registers: [metricsRegistry]
});

export const footfallPredictionTotal = new Counter({
  name: 'sports_graph_footfall_predictions_total',
  help: 'Total number of footfall predictions generated',
  labelNames: ['event_type'],
  registers: [metricsRegistry]
});

export const campaignRecommendationsTotal = new Counter({
  name: 'sports_graph_campaign_recommendations_total',
  help: 'Total number of campaign recommendations generated',
  labelNames: ['merchant_category'],
  registers: [metricsRegistry]
});

export const predictionAccuracyHistogram = new Histogram({
  name: 'sports_graph_prediction_accuracy',
  help: 'Footfall prediction accuracy score',
  buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  registers: [metricsRegistry]
});

// Database metrics
export const dbQueryDuration = new Histogram({
  name: 'sports_graph_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [metricsRegistry]
});

// External service metrics
export const externalServiceCalls = new Counter({
  name: 'sports_graph_external_service_calls_total',
  help: 'Total calls to external services',
  labelNames: ['service', 'endpoint', 'status'],
  registers: [metricsRegistry]
});

export const externalServiceDuration = new Histogram({
  name: 'sports_graph_external_service_duration_seconds',
  help: 'Duration of external service calls',
  labelNames: ['service', 'endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [metricsRegistry]
});

export default metricsRegistry;