import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a custom registry
export const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// Custom metrics

// Signal ingestion metrics
export const signalsIngested = new Counter({
  name: 'intent_signals_ingested_total',
  help: 'Total number of intent signals ingested',
  labelNames: ['source', 'category'],
  registers: [register],
});

export const ingestionErrors = new Counter({
  name: 'intent_signals_ingestion_errors_total',
  help: 'Total number of signal ingestion errors',
  labelNames: ['source'],
  registers: [register],
});

export const ingestionDuration = new Histogram({
  name: 'intent_signal_ingestion_duration_seconds',
  help: 'Duration of signal ingestion in seconds',
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

export const duplicateSignals = new Counter({
  name: 'intent_signals_duplicates_total',
  help: 'Total number of duplicate signals detected',
  registers: [register],
});

// Batch ingestion metrics
export const batchIngested = new Counter({
  name: 'intent_signals_batch_ingested_total',
  help: 'Total number of signals in batch ingestions',
  registers: [register],
});

export const batchSize = new Histogram({
  name: 'intent_signal_batch_size',
  help: 'Size of signal batches',
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
  registers: [register],
});

export const batchIngestionDuration = new Histogram({
  name: 'intent_signal_batch_ingestion_duration_seconds',
  help: 'Duration of batch signal ingestion in seconds',
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
  registers: [register],
});

// Enrichment metrics
export const signalsEnriched = new Counter({
  name: 'intent_signals_enriched_total',
  help: 'Total number of signals enriched',
  registers: [register],
});

export const enrichmentDuration = new Histogram({
  name: 'intent_signal_enrichment_duration_seconds',
  help: 'Duration of signal enrichment in seconds',
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [register],
});

// Routing metrics
export const signalsRouted = new Counter({
  name: 'intent_signals_routed_total',
  help: 'Total number of signals routed',
  labelNames: ['category'],
  registers: [register],
});

export const routingErrors = new Counter({
  name: 'intent_signals_routing_errors_total',
  help: 'Total number of signal routing errors',
  labelNames: ['target'],
  registers: [register],
});

export const routingDuration = new Histogram({
  name: 'intent_signal_routing_duration_seconds',
  help: 'Duration of signal routing in seconds',
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1],
  registers: [register],
});

// Active signals gauge
export const activeSignals = new Gauge({
  name: 'intent_signals_active',
  help: 'Number of active signals in the system',
  registers: [register],
});

// API request metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [register],
});

// Export the metrics object for convenience
export const metrics = {
  signalsIngested,
  ingestionErrors,
  ingestionDuration,
  duplicateSignals,
  batchIngested,
  batchSize,
  batchIngestionDuration,
  signalsEnriched,
  enrichmentDuration,
  signalsRouted,
  routingErrors,
  routingDuration,
  activeSignals,
  httpRequestsTotal,
  httpRequestDuration,
};
