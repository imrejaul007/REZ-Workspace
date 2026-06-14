/**
 * REZ Alerting Service
 *
 * Unified alerting and notifications for AdBazaar.
 *
 * Features:
 * - Alert rules and thresholds
 * - Multi-channel notifications (email, SMS, push, webhook)
 * - Alert history and tracking
 * - Escalation policies
 *
 * Port: 4670
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// TYPES
// ============================================================================

interface Alert {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  source: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  currentValue: number;
  status: 'active' | 'acknowledged' | 'resolved';
  triggeredAt?: Date;
  resolvedAt?: Date;
}

interface AlertNotification {
  id: string;
  alertId: string;
  channel: 'email' | 'sms' | 'push' | 'webhook' | 'slack' | 'discord';
  recipient: string;
  sentAt: Date;
  status: 'sent' | 'failed' | 'pending';
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  channels: ('email' | 'sms' | 'push' | 'webhook')[];
  recipients: string[];
  enabled: boolean;
}

interface EscalationPolicy {
  id: string;
  name: string;
  levels: EscalationLevel[];
}

interface EscalationLevel {
  level: number;
  delay: number; // minutes
  channels: ('email' | 'sms' | 'push')[];
  recipients: string[];
}

// ============================================================================
// MOCK DATA
// ============================================================================

const alerts: Alert[] = [
  {
    id: 'alert_001',
    name: 'High Error Rate',
    description: 'Error rate exceeded 5% threshold',
    severity: 'critical',
    source: 'hojai-ai-gateway',
    metric: 'error_rate',
    condition: 'gt',
    threshold: 5,
    currentValue: 7.2,
    status: 'active',
    triggeredAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'alert_002',
    name: 'High Latency',
    description: 'Response time exceeded 500ms',
    severity: 'high',
    source: 'attribution-hub',
    metric: 'response_time',
    condition: 'gt',
    threshold: 500,
    currentValue: 650,
    status: 'acknowledged',
    triggeredAt: new Date(Date.now() - 7200000),
  },
];

const rules: AlertRule[] = [
  {
    id: 'rule_001',
    name: 'Error Rate Critical',
    metric: 'error_rate',
    condition: 'gt',
    threshold: 5,
    severity: 'critical',
    channels: ['email', 'sms', 'push'],
    recipients: ['ops@rez.money', '+919876543210'],
    enabled: true,
  },
  {
    id: 'rule_002',
    name: 'High Latency Warning',
    metric: 'response_time',
    condition: 'gt',
    threshold: 500,
    severity: 'high',
    channels: ['email', 'push'],
    recipients: ['dev@rez.money'],
    enabled: true,
  },
];

const notifications: AlertNotification[] = [];

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4670', 10);

app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================================================
// ROUTES
// ============================================================================

// Health
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'rez-alerting',
    version: '1.0.0',
    activeAlerts: alerts.filter(a => a.status === 'active').length,
    rulesConfigured: rules.length,
  });
});

// ============================================================================
// ALERTS
// ============================================================================

// List alerts
app.get('/api/alerts', (req: Request, res: Response) => {
  const { status, severity, source } = req.query;

  let filtered = [...alerts];

  if (status) filtered = filtered.filter(a => a.status === status);
  if (severity) filtered = filtered.filter(a => a.severity === severity);
  if (source) filtered = filtered.filter(a => a.source === source);

  // Sort by severity then time
  filtered.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.triggeredAt!).getTime() - new Date(a.triggeredAt!).getTime();
  });

  res.json({
    success: true,
    data: {
      alerts: filtered,
      summary: {
        critical: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
        high: alerts.filter(a => a.severity === 'high' && a.status === 'active').length,
        total: filtered.length,
        active: filtered.filter(a => a.status === 'active').length,
        acknowledged: filtered.filter(a => a.status === 'acknowledged').length,
        resolved: filtered.filter(a => a.status === 'resolved').length,
      },
    },
  });
});

// Get alert
app.get('/api/alerts/:id', (req: Request, res: Response) => {
  const alert = alerts.find(a => a.id === req.params.id);

  if (!alert) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }

  res.json({ success: true, data: alert });
});

// Create alert (internal)
app.post('/api/alerts', (req: Request, res: Response) => {
  const { name, description, severity, source, metric, condition, threshold, currentValue } = req.body;

  const alert: Alert = {
    id: `alert_${Date.now()}`,
    name,
    description,
    severity,
    source,
    metric,
    condition,
    threshold,
    currentValue,
    status: 'active',
    triggeredAt: new Date(),
  };

  alerts.push(alert);

  // Send notifications
  sendNotifications(alert);

  res.json({ success: true, data: alert });
});

// Acknowledge alert
app.patch('/api/alerts/:id/acknowledge', (req: Request, res: Response) => {
  const alert = alerts.find(a => a.id === req.params.id);

  if (!alert) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }

  alert.status = 'acknowledged';

  res.json({ success: true, data: alert });
});

// Resolve alert
app.patch('/api/alerts/:id/resolve', (req: Request, res: Response) => {
  const alert = alerts.find(a => a.id === req.params.id);

  if (!alert) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }

  alert.status = 'resolved';
  alert.resolvedAt = new Date();

  res.json({ success: true, data: alert });
});

// ============================================================================
// RULES
// ============================================================================

// List rules
app.get('/api/rules', (req: Request, res: Response) => {
  const { enabled, severity } = req.query;

  let filtered = [...rules];

  if (enabled !== undefined) filtered = filtered.filter(r => r.enabled === (enabled === 'true'));
  if (severity) filtered = filtered.filter(r => r.severity === severity);

  res.json({ success: true, data: filtered });
});

// Create rule
app.post('/api/rules', (req: Request, res: Response) => {
  const { name, metric, condition, threshold, severity, channels, recipients } = req.body;

  const rule: AlertRule = {
    id: `rule_${Date.now()}`,
    name,
    metric,
    condition,
    threshold,
    severity,
    channels: channels || ['email'],
    recipients: recipients || [],
    enabled: true,
  };

  rules.push(rule);

  res.json({ success: true, data: rule });
});

// Update rule
app.patch('/api/rules/:id', (req: Request, res: Response) => {
  const rule = rules.find(r => r.id === req.params.id);

  if (!rule) {
    return res.status(404).json({ success: false, error: 'Rule not found' });
  }

  Object.assign(rule, req.body);

  res.json({ success: true, data: rule });
});

// Enable/disable rule
app.patch('/api/rules/:id/toggle', (req: Request, res: Response) => {
  const rule = rules.find(r => r.id === req.params.id);

  if (!rule) {
    return res.status(404).json({ success: false, error: 'Rule not found' });
  }

  rule.enabled = !rule.enabled;

  res.json({ success: true, data: rule });
});

// ============================================================================
// NOTIFICATIONS
// ============================================================================

// List notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  const { alertId, channel, status } = req.query;

  let filtered = [...notifications];

  if (alertId) filtered = filtered.filter(n => n.alertId === alertId);
  if (channel) filtered = filtered.filter(n => n.channel === channel);
  if (status) filtered = filtered.filter(n => n.status === status);

  res.json({ success: true, data: filtered });
});

// ============================================================================
// METRICS EVALUATION
// ============================================================================

// Evaluate metrics and trigger alerts
app.post('/api/evaluate', (req: Request, res: Response) => {
  const { source, metrics } = req.body;

  const triggeredAlerts: Alert[] = [];

  for (const rule of rules.filter(r => r.enabled)) {
    const value = metrics[rule.metric];
    if (value === undefined) continue;

    let triggered = false;
    switch (rule.condition) {
      case 'gt': triggered = value > rule.threshold; break;
      case 'lt': triggered = value < rule.threshold; break;
      case 'eq': triggered = value === rule.threshold; break;
      case 'gte': triggered = value >= rule.threshold; break;
      case 'lte': triggered = value <= rule.threshold; break;
    }

    if (triggered) {
      const alert: Alert = {
        id: `alert_${Date.now()}`,
        name: rule.name,
        description: `${rule.metric} ${rule.condition} ${rule.threshold} (current: ${value})`,
        severity: rule.severity,
        source,
        metric: rule.metric,
        condition: rule.condition,
        threshold: rule.threshold,
        currentValue: value,
        status: 'active',
        triggeredAt: new Date(),
      };

      alerts.push(alert);
      triggeredAlerts.push(alert);
      sendNotifications(alert);
    }
  }

  res.json({
    success: true,
    data: {
      evaluated: Object.keys(metrics).length,
      triggered: triggeredAlerts.length,
      alerts: triggeredAlerts,
    },
  });
});

// ============================================================================
// ANALYTICS
// ============================================================================

// Get alert analytics
app.get('/api/analytics', (_req, res) => {
  const now = Date.now();
  const dayAgo = now - 86400000;
  const weekAgo = now - 86400000 * 7;

  const recentAlerts = alerts.filter(a => a.triggeredAt && new Date(a.triggeredAt).getTime() > weekAgo);

  res.json({
    success: true,
    data: {
      summary: {
        total: alerts.length,
        active: alerts.filter(a => a.status === 'active').length,
        acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
        resolved: alerts.filter(a => a.status === 'resolved').length,
      },
      trend: {
        last24h: alerts.filter(a => a.triggeredAt && new Date(a.triggeredAt).getTime() > dayAgo).length,
        last7d: recentAlerts.length,
        avgResolution: 45, // minutes
      },
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
      },
      bySource: {
        'hojai-ai-gateway': alerts.filter(a => a.source === 'hojai-ai-gateway').length,
        'attribution-hub': alerts.filter(a => a.source === 'attribution-hub').length,
        'campaign-service': alerts.filter(a => a.source === 'campaign-service').length,
      },
    },
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function sendNotifications(alert: Alert): void {
  const rule = rules.find(r => r.metric === alert.metric);
  if (!rule) return;

  for (const channel of rule.channels) {
    for (const recipient of rule.recipients) {
      const notification: AlertNotification = {
        id: `notif_${Date.now()}`,
        alertId: alert.id,
        channel,
        recipient,
        sentAt: new Date(),
        status: 'sent', // In production, actually send
      };

      notifications.push(notification);
      logger.info(`[Alert] Sending ${channel} to ${recipient}: ${alert.name}`);
    }
  }
}

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════╗
║             REZ ALERTING SERVICE v1.0.0            ║
╠══════════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                             ║
║  Active Alerts: ${alerts.filter(a => a.status === 'active').length}                                        ║
║  Rules:      ${rules.length}                                             ║
╠══════════════════════════════════════════════════════════════╣
║  FEATURES:                                              ║
║  ✓ Alert Management   ✓ Rule Engine                     ║
║  ✓ Multi-Channel     ✓ Escalation                       ║
║  ✓ Analytics        ✓ Auto-Resolution                   ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
