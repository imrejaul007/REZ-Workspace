import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics (process CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics for seat management service

// HTTP request counter
export const httpRequestsTotal = new client.Counter({
  name: 'seat_management_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register]
});

// HTTP request duration histogram
export const httpRequestDuration = new client.Histogram({
  name: 'seat_management_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Active seats gauge
export const activeSeatsGauge = new client.Gauge({
  name: 'seat_management_active_seats',
  help: 'Number of active seats',
  labelNames: ['organization_id'],
  registers: [register]
});

// Total seats gauge
export const totalSeatsGauge = new client.Gauge({
  name: 'seat_management_total_seats',
  help: 'Total number of seats',
  labelNames: ['organization_id'],
  registers: [register]
});

// Seat utilization histogram
export const seatUtilizationHistogram = new client.Histogram({
  name: 'seat_management_seat_utilization_percent',
  help: 'Seat utilization percentage',
  labelNames: ['organization_id', 'plan'],
  buckets: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  registers: [register]
});

// API calls counter
export const apiCallsCounter = new client.Counter({
  name: 'seat_management_api_calls_total',
  help: 'Total number of API calls',
  labelNames: ['seat_id', 'organization_id', 'resource'],
  registers: [register]
});

// Data processed counter
export const dataProcessedCounter = new client.Counter({
  name: 'seat_management_data_processed_bytes',
  help: 'Total data processed in bytes',
  labelNames: ['seat_id', 'organization_id'],
  registers: [register]
});

// Invitations sent counter
export const invitationsSentCounter = new client.Counter({
  name: 'seat_management_invitations_sent_total',
  help: 'Total number of invitations sent',
  labelNames: ['organization_id', 'status'],
  registers: [register]
});

// Permission changes counter
export const permissionChangesCounter = new client.Counter({
  name: 'seat_management_permission_changes_total',
  help: 'Total number of permission changes',
  labelNames: ['organization_id', 'action'],
  registers: [register]
});

// Billing amount gauge
export const billingAmountGauge = new client.Gauge({
  name: 'seat_management_billing_amount_cents',
  help: 'Current billing amount in cents',
  labelNames: ['organization_id', 'plan'],
  registers: [register]
});

// Middleware to track HTTP requests
export const metricsMiddleware = (
  req: { path: string; method: string },
  res: { statusCode: number },
  next: () => void
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      path: req.path,
      status: res.statusCode.toString()
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });

  next();
};

// Get metrics endpoint handler
export const getMetrics = async (): Promise<string> => {
  return register.metrics();
};

// Get metrics content type
export const getContentType = (): string => {
  return register.contentType;
};

// Update seat metrics for an organization
export const updateSeatMetrics = (
  organizationId: string,
  totalSeats: number,
  activeSeats: number,
  utilizationPercent: number,
  plan: string
): void => {
  const labels = { organization_id: organizationId };

  totalSeatsGauge.set(labels, totalSeats);
  activeSeatsGauge.set(labels, activeSeats);
  seatUtilizationHistogram.observe({ ...labels, plan }, utilizationPercent);
};

// Record API usage
export const recordApiUsage = (
  seatId: string,
  organizationId: string,
  apiCalls: number = 1,
  dataProcessed: number = 0,
  resource?: string
): void => {
  const labels = { seat_id: seatId, organization_id: organizationId };

  apiCallsCounter.inc(labels, apiCalls);
  if (resource) {
    apiCallsCounter.inc({ ...labels, resource }, apiCalls);
  }
  if (dataProcessed > 0) {
    dataProcessedCounter.inc(labels, dataProcessed);
  }
};

// Record invitation
export const recordInvitation = (
  organizationId: string,
  status: 'pending' | 'accepted' | 'declined' | 'expired'
): void => {
  invitationsSentCounter.inc({ organization_id: organizationId, status });
};

// Record permission change
export const recordPermissionChange = (
  organizationId: string,
  action: 'grant' | 'revoke' | 'update'
): void => {
  permissionChangesCounter.inc({ organization_id: organizationId, action });
};

export default {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  activeSeatsGauge,
  totalSeatsGauge,
  seatUtilizationHistogram,
  apiCallsCounter,
  dataProcessedCounter,
  invitationsSentCounter,
  permissionChangesCounter,
  billingAmountGauge,
  metricsMiddleware,
  getMetrics,
  getContentType,
  updateSeatMetrics,
  recordApiUsage,
  recordInvitation,
  recordPermissionChange
};