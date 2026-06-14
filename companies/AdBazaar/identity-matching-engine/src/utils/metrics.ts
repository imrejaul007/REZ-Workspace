import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics for identity matching engine

// HTTP request duration histogram
export const httpRequestDuration = new client.Histogram({
  name: 'identity_matching_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Total matches counter
export const matchesTotal = new client.Counter({
  name: 'identity_matching_matches_total',
  help: 'Total number of identity matches',
  labelNames: ['method', 'status']
});

// Match confidence histogram
export const matchConfidence = new client.Histogram({
  name: 'identity_matching_confidence',
  help: 'Distribution of match confidence scores',
  labelNames: ['method'],
  buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
});

// Identity count gauge
export const identityCount = new client.Gauge({
  name: 'identity_matching_identity_count',
  help: 'Number of identities in the system',
  labelNames: ['status']
});

// Graph size gauge
export const graphSize = new client.Gauge({
  name: 'identity_matching_graph_size',
  help: 'Size of identity graphs',
  labelNames: ['entity_id']
});

// Active connections gauge
export const activeConnections = new client.Gauge({
  name: 'identity_matching_active_connections',
  help: 'Number of active database connections',
  labelNames: ['type']
});

// Merge operations counter
export const mergesTotal = new client.Counter({
  name: 'identity_matching_merges_total',
  help: 'Total number of identity merge operations',
  labelNames: ['strategy', 'status']
});

// Batch operation histogram
export const batchOperationDuration = new client.Histogram({
  name: 'identity_matching_batch_duration_seconds',
  help: 'Duration of batch operations',
  labelNames: ['operation_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});

// Audit entries counter
export const auditEntriesTotal = new client.Counter({
  name: 'identity_matching_audit_entries_total',
  help: 'Total number of audit entries created',
  labelNames: ['action']
});

// Cache hit ratio
export const cacheHitRatio = new client.Gauge({
  name: 'identity_matching_cache_hit_ratio',
  help: 'Cache hit ratio',
  labelNames: ['cache_type']
});

// Resolution latency histogram
export const resolutionLatency = new client.Histogram({
  name: 'identity_matching_resolution_latency_seconds',
  help: 'Latency of identity resolution operations',
  labelNames: ['method'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
});

// Export metrics object
export const metrics = {
  register,
  httpRequestDuration,
  matchesTotal,
  matchConfidence,
  identityCount,
  graphSize,
  activeConnections,
  mergesTotal,
  batchOperationDuration,
  auditEntriesTotal,
  cacheHitRatio,
  resolutionLatency
};

// Helper functions to update metrics
export function recordMatch(method: string, confidence: number, success: boolean): void {
  const status = success ? 'success' : 'error';
  matchesTotal.inc({ method, status });
  matchConfidence.observe({ method }, confidence);
}

export function recordIdentityCreation(isNew: boolean): void {
  identityCount.inc({ status: isNew ? 'new' : 'updated' });
}

export function recordMerge(strategy: string, success: boolean): void {
  mergesTotal.inc({ strategy, status: success ? 'success' : 'error' });
}

export function recordBatchOperation(operationType: string, durationMs: number): void {
  batchOperationDuration.observe({ operation_type: operationType }, durationMs / 1000);
}

export function recordAuditEntry(action: string): void {
  auditEntriesTotal.inc({ action });
}

export function recordResolutionLatency(method: string, durationMs: number): void {
  resolutionLatency.observe({ method }, durationMs / 1000);
}

// Export for use in other modules
export default metrics;