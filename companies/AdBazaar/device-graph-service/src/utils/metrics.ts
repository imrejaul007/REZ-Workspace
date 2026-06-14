import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a custom registry
export const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// Custom metrics

// Device metrics
export const devicesRegistered = new Counter({
  name: 'device_graph_devices_registered_total',
  help: 'Total number of devices registered',
  labelNames: ['type', 'platform', 'action'],
  registers: [register],
});

export const devicesDeactivated = new Counter({
  name: 'device_graph_devices_deactivated_total',
  help: 'Total number of devices deactivated',
  registers: [register],
});

export const activeDevices = new Gauge({
  name: 'device_graph_active_devices',
  help: 'Current number of active devices',
  registers: [register],
});

// Device linking metrics
export const devicesLinked = new Counter({
  name: 'device_graph_devices_linked_total',
  help: 'Total number of device links created',
  labelNames: ['method'],
  registers: [register],
});

export const linkConfidence = new Histogram({
  name: 'device_graph_link_confidence',
  help: 'Distribution of link confidence scores',
  buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  registers: [register],
});

// Household metrics
export const householdsCreated = new Counter({
  name: 'device_graph_households_created_total',
  help: 'Total number of households created',
  registers: [register],
});

export const activeHouseholds = new Gauge({
  name: 'device_graph_active_households',
  help: 'Current number of active households',
  registers: [register],
});

// Resolution metrics
export const resolutionAttempts = new Counter({
  name: 'device_graph_resolution_attempts_total',
  help: 'Total number of user resolution attempts',
  labelNames: ['method'],
  registers: [register],
});

export const resolutionSuccess = new Counter({
  name: 'device_graph_resolution_success_total',
  help: 'Total number of successful user resolutions',
  labelNames: ['method'],
  registers: [register],
});

export const resolutionErrors = new Counter({
  name: 'device_graph_resolution_errors_total',
  help: 'Total number of user resolution errors',
  registers: [register],
});

// Graph metrics
export const graphNodes = new Gauge({
  name: 'device_graph_graph_nodes_total',
  help: 'Total number of nodes across all graphs',
  registers: [register],
});

export const graphEdges = new Gauge({
  name: 'device_graph_graph_edges_total',
  help: 'Total number of edges across all graphs',
  registers: [register],
});

// HTTP metrics
export const httpRequestDuration = new Histogram({
  name: 'device_graph_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestsTotal = new Counter({
  name: 'device_graph_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Database metrics
export const dbOperationDuration = new Histogram({
  name: 'device_graph_db_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Export all metrics as a single object
export const metrics = {
  devicesRegistered,
  devicesDeactivated,
  activeDevices,
  devicesLinked,
  linkConfidence,
  householdsCreated,
  activeHouseholds,
  resolutionAttempts,
  resolutionSuccess,
  resolutionErrors,
  graphNodes,
  graphEdges,
  httpRequestDuration,
  httpRequestsTotal,
  dbOperationDuration,
};

export default metrics;