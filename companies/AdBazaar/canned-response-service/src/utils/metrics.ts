/**
 * Prometheus metrics for Canned Response Service
 */

import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'cfr_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});
register.registerMetric(httpRequestDuration);

// Response metrics
const responsesCreated = new client.Counter({
  name: 'cfr_responses_created_total',
  help: 'Total number of responses created',
});
register.registerMetric(responsesCreated);

const responsesUsed = new client.Counter({
  name: 'cfr_responses_used_total',
  help: 'Total number of response usages',
});
register.registerMetric(responsesUsed);

const responsesSearched = new client.Counter({
  name: 'cfr_responses_searched_total',
  help: 'Total number of response searches',
});
register.registerMetric(responsesSearched);

// Category metrics
const categoriesCreated = new client.Counter({
  name: 'cfr_categories_created_total',
  help: 'Total number of categories created',
});
register.registerMetric(categoriesCreated);

// Active responses gauge
const activeResponses = new client.Gauge({
  name: 'cfr_active_responses',
  help: 'Number of active responses',
  labelNames: ['category'],
});
register.registerMetric(activeResponses);

// Export metrics utilities
export const cannedMetrics = {
  register,
  recordRequestDuration: (path: string, durationMs: number) => {
    httpRequestDuration.observe({ method: 'GET', path, status_code: '200' }, durationMs / 1000);
  },
  incrementResponsesCreated: () => {
    responsesCreated.inc();
  },
  incrementResponsesUsed: () => {
    responsesUsed.inc();
  },
  incrementResponsesSearched: () => {
    responsesSearched.inc();
  },
  incrementCategoriesCreated: () => {
    categoriesCreated.inc();
  },
  setActiveResponses: (category: string, count: number) => {
    activeResponses.set({ category }, count);
  },
};

export default cannedMetrics;