import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a custom registry
export const registry = new Registry();

// Add default metrics
collectDefaultMetrics({ register: registry });

// Custom metrics

// Consent counters
export const consentGranted = new Counter({
  name: 'consent_granted_total',
  help: 'Total number of consents granted',
  labelNames: ['type', 'framework'],
  registers: [registry]
});

export const consentWithdrawn = new Counter({
  name: 'consent_withdrawn_total',
  help: 'Total number of consents withdrawn',
  labelNames: ['type', 'framework'],
  registers: [registry]
});

export const consentUpdated = new Counter({
  name: 'consent_updated_total',
  help: 'Total number of consent updates',
  labelNames: ['type', 'framework'],
  registers: [registry]
});

export const consentQueries = new Counter({
  name: 'consent_queries_total',
  help: 'Total number of consent queries',
  labelNames: ['type'],
  registers: [registry]
});

export const bulkOperations = new Counter({
  name: 'consent_bulk_operations_total',
  help: 'Total number of bulk consent operations',
  registers: [registry]
});

// Error counter
export const errorsTotal = new Counter({
  name: 'consent_errors_total',
  help: 'Total number of errors',
  labelNames: ['type'],
  registers: [registry]
});

// Request duration histogram
export const requestDuration = new Histogram({
  name: 'consent_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [registry]
});

// Active consents gauge
export const activeConsents = new Gauge({
  name: 'consent_active_gauge',
  help: 'Number of active consents',
  labelNames: ['type', 'framework'],
  registers: [registry]
});

// User consent gauge
export const userConsentGauge = new Gauge({
  name: 'consent_user_gauge',
  help: 'Number of users with recorded consents',
  registers: [registry]
});

// Compliance rate gauge
export const complianceRate = new Gauge({
  name: 'consent_compliance_rate',
  help: 'Consent compliance rate by framework',
  labelNames: ['framework'],
  registers: [registry]
});

// Export metrics object
export const metrics = {
  registry,
  consentGranted,
  consentWithdrawn,
  consentUpdated,
  consentQueries,
  bulkOperations,
  errorsTotal,
  requestDuration,
  activeConsents,
  userConsentGauge,
  complianceRate
};

export { collectDefaultMetrics };
