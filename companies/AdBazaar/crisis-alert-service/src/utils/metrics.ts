/**
 * Prometheus metrics for Crisis Alert Service
 */

import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'cas_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});
register.registerMetric(httpRequestDuration);

// Alert metrics
const alertsCreated = new client.Counter({
  name: 'cas_alerts_created_total',
  help: 'Total number of alerts created',
  labelNames: ['severity', 'type'],
});
register.registerMetric(alertsCreated);

const alertsAcknowledged = new client.Counter({
  name: 'cas_alerts_acknowledged_total',
  help: 'Total number of alerts acknowledged',
});
register.registerMetric(alertsAcknowledged);

const alertsEscalated = new client.Counter({
  name: 'cas_alerts_escalated_total',
  help: 'Total number of alerts escalated',
});
register.registerMetric(alertsEscalated);

const alertsResolved = new client.Counter({
  name: 'cas_alerts_resolved_total',
  help: 'Total number of alerts resolved',
});
register.registerMetric(alertsResolved);

// Active alerts gauge
const activeAlerts = new client.Gauge({
  name: 'cas_active_alerts',
  help: 'Number of active alerts',
  labelNames: ['severity', 'type'],
});
register.registerMetric(activeAlerts);

// Playbook metrics
const playbooksCreated = new client.Counter({
  name: 'cas_playbooks_created_total',
  help: 'Total number of playbooks created',
});
register.registerMetric(playbooksCreated);

const playbooksExecuted = new client.Counter({
  name: 'cas_playbooks_executed_total',
  help: 'Total number of playbook executions',
  labelNames: ['playbook_id'],
});
register.registerMetric(playbooksExecuted);

// Monitoring metrics
const monitoringKeywords = new client.Gauge({
  name: 'cas_monitoring_keywords',
  help: 'Number of active monitoring keywords',
  labelNames: ['type'],
});
register.registerMetric(monitoringKeywords);

// Notification metrics
const notificationsSent = new client.Counter({
  name: 'cas_notifications_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['channel'],
});
register.registerMetric(notificationsSent);

// Post-mortem metrics
const postMortemsCreated = new client.Counter({
  name: 'cas_post_mortems_created_total',
  help: 'Total number of post-mortems created',
});
register.registerMetric(postMortemsCreated);

// Export metrics utilities
export const crisisMetrics = {
  register,
  recordRequestDuration: (path: string, method: string, statusCode: number, durationMs: number) => {
    httpRequestDuration.observe({ method, path, status_code: statusCode.toString() }, durationMs / 1000);
  },
  incrementAlertsCreated: (severity: string, type: string) => {
    alertsCreated.inc({ severity, type });
  },
  incrementAlertsAcknowledged: () => {
    alertsAcknowledged.inc();
  },
  incrementAlertsEscalated: () => {
    alertsEscalated.inc();
  },
  incrementAlertsResolved: () => {
    alertsResolved.inc();
  },
  setActiveAlerts: (severity: string, type: string, count: number) => {
    activeAlerts.set({ severity, type }, count);
  },
  incrementPlaybooksCreated: () => {
    playbooksCreated.inc();
  },
  incrementPlaybooksExecuted: (playbookId: string) => {
    playbooksExecuted.inc({ playbook_id: playbookId });
  },
  setMonitoringKeywords: (type: string, count: number) => {
    monitoringKeywords.set({ type }, count);
  },
  incrementNotificationsSent: (channel: string) => {
    notificationsSent.inc({ channel });
  },
  incrementPostMortemsCreated: () => {
    postMortemsCreated.inc();
  },
};

export default crisisMetrics;
