import client, { Registry, Counter, Histogram, Gauge, Summary } from 'prom-client';

// Create a custom registry
const register = new Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// HTTP metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register],
});

// Computation metrics
export const computationsTotal = new Counter({
  name: 'privacy_computations_total',
  help: 'Total number of privacy-preserving computations',
  labelNames: ['type', 'status'],
  registers: [register],
});

export const computationDuration = new Histogram({
  name: 'privacy_computation_duration_seconds',
  help: 'Duration of privacy computations in seconds',
  labelNames: ['type'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 120, 300, 600],
  registers: [register],
});

// Federated learning metrics
export const federatedRoundsTotal = new Counter({
  name: 'federated_rounds_total',
  help: 'Total number of federated learning rounds completed',
  labelNames: ['status'],
  registers: [register],
});

export const federatedParticipantsTotal = new Counter({
  name: 'federated_participants_total',
  help: 'Total number of federated learning participants',
  labelNames: ['status'],
  registers: [register],
});

export const federatedGradientsReceived = new Counter({
  name: 'federated_gradients_received_total',
  help: 'Total number of gradients received in federated learning',
  registers: [register],
});

// MPC metrics
export const mpcOperationsTotal = new Counter({
  name: 'mpc_operations_total',
  help: 'Total number of MPC operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

export const mpcSharesGenerated = new Counter({
  name: 'mpc_shares_generated_total',
  help: 'Total number of MPC shares generated',
  registers: [register],
});

export const mpcReconstructionsTotal = new Counter({
  name: 'mpc_reconstructions_total',
  help: 'Total number of MPC value reconstructions',
  labelNames: ['status'],
  registers: [register],
});

// Differential privacy metrics
export const differentialPrivacyQueriesTotal = new Counter({
  name: 'differential_privacy_queries_total',
  help: 'Total number of differential privacy queries',
  labelNames: ['query_type', 'mechanism'],
  registers: [register],
});

export const privacyBudgetUsed = new Gauge({
  name: 'privacy_budget_used',
  help: 'Privacy budget used (epsilon)',
  labelNames: ['computation_id'],
  registers: [register],
});

export const noiseGenerated = new Counter({
  name: 'differential_privacy_noise_generated_total',
  help: 'Total amount of noise generated for differential privacy',
  labelNames: ['mechanism'],
  registers: [register],
});

// Secure aggregation metrics
export const secureAggregationTotal = new Counter({
  name: 'secure_aggregations_total',
  help: 'Total number of secure aggregations',
  labelNames: ['status'],
  registers: [register],
});

export const aggregationParticipantsTotal = new Counter({
  name: 'secure_aggregation_participants_total',
  help: 'Total number of participants in secure aggregations',
  registers: [register],
});

export const droppedParticipantsTotal = new Counter({
  name: 'secure_aggregation_dropped_total',
  help: 'Total number of dropped participants in secure aggregations',
  registers: [register],
});

// Audit metrics
export const auditLogsTotal = new Counter({
  name: 'audit_logs_total',
  help: 'Total number of audit log entries',
  labelNames: ['action'],
  registers: [register],
});

// Service health metrics
export const serviceInfo = new Gauge({
  name: 'service_info',
  help: 'Service information',
  labelNames: ['service_name', 'version'],
  registers: [register],
});

export const activeComputations = new Gauge({
  name: 'active_computations',
  help: 'Number of currently running computations',
  labelNames: ['type'],
  registers: [register],
});

// Privacy validation metrics
export const privacyValidationsTotal = new Counter({
  name: 'privacy_validations_total',
  help: 'Total number of privacy validations',
  labelNames: ['result'],
  registers: [register],
});

// Export metrics object
export const metrics = {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  computationsTotal,
  computationDuration,
  federatedRoundsTotal,
  federatedParticipantsTotal,
  federatedGradientsReceived,
  mpcOperationsTotal,
  mpcSharesGenerated,
  mpcReconstructionsTotal,
  differentialPrivacyQueriesTotal,
  privacyBudgetUsed,
  noiseGenerated,
  secureAggregationTotal,
  aggregationParticipantsTotal,
  droppedParticipantsTotal,
  auditLogsTotal,
  serviceInfo,
  activeComputations,
  privacyValidationsTotal,
};

export default metrics;