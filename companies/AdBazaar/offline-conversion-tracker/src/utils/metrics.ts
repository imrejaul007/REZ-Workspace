import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for offline conversion tracker
export const conversionsTotal = new client.Counter({
  name: 'offline_conversions_total',
  help: 'Total number of offline conversions recorded',
  labelNames: ['campaign_id', 'type', 'status'],
  registers: [register]
});

export const conversionsValue = new client.Gauge({
  name: 'offline_conversions_value_total',
  help: 'Total value of offline conversions',
  labelNames: ['campaign_id', 'currency'],
  registers: [register]
});

export const conversionMatchRate = new client.Gauge({
  name: 'offline_conversion_match_rate',
  help: 'Rate of offline conversions matched to online',
  labelNames: ['campaign_id'],
  registers: [register]
});

export const conversionImportTotal = new client.Counter({
  name: 'offline_conversion_imports_total',
  help: 'Total number of conversion imports',
  labelNames: ['status'],
  registers: [register]
});

export const conversionImportRecords = new client.Gauge({
  name: 'offline_conversion_import_records',
  help: 'Number of records in conversion imports',
  labelNames: ['import_id'],
  registers: [register]
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const databaseOperationDuration = new client.Histogram({
  name: 'database_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register]
});

export const analyticsQueries = new client.Counter({
  name: 'analytics_queries_total',
  help: 'Total number of analytics queries',
  labelNames: ['type'],
  registers: [register]
});

export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['type'],
  registers: [register]
});

export default {
  register,
  conversionsTotal,
  conversionsValue,
  conversionMatchRate,
  conversionImportTotal,
  conversionImportRecords,
  httpRequestDuration,
  httpRequestsTotal,
  databaseOperationDuration,
  analyticsQueries,
  activeConnections
};
