/**
 * BIZORA Monitoring Service
 * Health checks, metrics, and alerting
 */

const express = require('express');
const app = express();

const PORT = process.env.PORT || 4107;

// Service health status
const services = new Map();
const metrics = new Map();
const alerts = [];

// Service definitions
const SERVICE_DEFS = [
  { id: 'gst-filing', name: 'GST Filing', port: 4100, critical: true },
  { id: 'payment', name: 'Payment Service', port: 4101, critical: true },
  { id: 'vendor', name: 'Vendor Portal', port: 4102, critical: true },
  { id: 'invoice', name: 'Invoice Generator', port: 4103, critical: true },
  { id: 'quote', name: 'Quote Builder', port: 4104, critical: false },
  { id: 'contract', name: 'Contract Service', port: 4105, critical: false },
  { id: 'tally', name: 'Tally Sync', port: 4106, critical: false },
  { id: 'whatsapp', name: 'WhatsApp', port: 4098, critical: false },
  { id: 'health', name: 'Business Health', port: 4097, critical: false },
  { id: 'database', name: 'Database', port: 4096, critical: true },
];

// Check service health
async function checkService(service) {
  const startTime = Date.now();

  try {
    const response = await fetch(`http://localhost:${service.port}/health`, {
      method: 'GET',
      timeout: 5000,
    });

    const latency = Date.now() - startTime;
    const data = await response.json();

    services.set(service.id, {
      ...service,
      status: 'healthy',
      latency,
      uptime: data.uptime || 100,
      lastCheck: new Date().toISOString(),
      message: 'OK'
    });

    // Record metrics
    recordMetric(service.id, 'latency', latency);
    recordMetric(service.id, 'status', 1);

    return true;
  } catch (error) {
    const latency = Date.now() - startTime;

    services.set(service.id, {
      ...service,
      status: 'unhealthy',
      latency,
      lastCheck: new Date().toISOString(),
      message: error.message
    });

    recordMetric(service.id, 'status', 0);

    // Create alert for critical services
    if (service.critical) {
      createAlert('critical', service.name, `Service is down: ${error.message}`);
    }

    return false;
  }
}

function recordMetric(serviceId, metric, value) {
  const key = `${serviceId}_${metric}`;
  const existing = metrics.get(key) || [];

  existing.push({
    value,
    timestamp: Date.now()
  });

  // Keep last 100 data points
  if (existing.length > 100) existing.shift();

  metrics.set(key, existing);
}

function createAlert(severity, service, message) {
  const alert = {
    id: 'alert_' + Date.now(),
    severity,
    service,
    message,
    createdAt: new Date().toISOString(),
    acknowledged: false
  };

  alerts.push(alert);

  // Keep last 50 alerts
  if (alerts.length > 50) alerts.shift();

  console.log(`[ALERT] ${severity.toUpperCase()}: ${service} - ${message}`);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'monitoring',
    timestamp: new Date().toISOString()
  });
});

// Dashboard data
app.get('/api/dashboard', async (req, res) => {
  // Check all services
  await Promise.all(SERVICE_DEFS.map(service => checkService(service)));

  const allServices = Array.from(services.values());
  const healthyCount = allServices.filter(s => s.status === 'healthy').length;
  const criticalDown = allServices.filter(s => s.critical && s.status !== 'healthy').length;

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    summary: {
      total: allServices.length,
      healthy: healthyCount,
      unhealthy: allServices.length - healthyCount,
      criticalDown
    },
    services: allServices.map(s => ({
      id: s.id,
      name: s.name,
      status: s.status,
      latency: s.latency,
      critical: s.critical
    })),
    alerts: {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length,
      items: alerts.slice(-10).reverse()
    }
  });
});

// Individual service status
app.get('/api/services/:id', (req, res) => {
  const service = services.get(req.params.id);
  if (!service) {
    return res.status(404).json({ success: false, error: 'Service not found' });
  }

  // Get metrics
  const latencyMetrics = metrics.get(`${req.params.id}_latency`) || [];
  const statusMetrics = metrics.get(`${req.params.id}_status`) || [];

  res.json({
    success: true,
    service,
    metrics: {
      latency: {
        current: latencyMetrics[latencyMetrics.length - 1]?.value || 0,
        avg: latencyMetrics.length > 0
          ? latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length
          : 0,
        p95: percentile(latencyMetrics.map(m => m.value), 95),
        history: latencyMetrics.slice(-20)
      },
      uptime: calculateUptime(statusMetrics)
    }
  });
});

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(p / 100 * sorted.length) - 1;
  return sorted[index] || 0;
}

function calculateUptime(statusMetrics) {
  if (statusMetrics.length === 0) return 100;
  const healthy = statusMetrics.filter(m => m.value === 1).length;
  return Math.round((healthy / statusMetrics.length) * 100);
}

// Acknowledge alert
app.post('/api/alerts/:id/acknowledge', (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }

  alert.acknowledged = true;
  alert.acknowledgedAt = new Date().toISOString();
  alert.acknowledgedBy = req.body.by || 'system';

  res.json({ success: true, alert });
});

// Get metrics for a service
app.get('/api/metrics/:serviceId', (req, res) => {
  const { timeRange = '1h' } = req.query;
  const serviceId = req.params.serviceId;

  const latencyMetrics = metrics.get(`${serviceId}_latency`) || [];
  const statusMetrics = metrics.get(`${serviceId}_status`) || [];

  // Filter by time range
  const now = Date.now();
  const ranges = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };

  const cutoff = now - (ranges[timeRange] || ranges['1h']);

  const filteredLatency = latencyMetrics.filter(m => m.timestamp > cutoff);
  const filteredStatus = statusMetrics.filter(m => m.timestamp > cutoff);

  res.json({
    success: true,
    timeRange,
    latency: filteredLatency,
    status: filteredStatus,
    summary: {
      avgLatency: avg(filteredLatency.map(m => m.value)),
      maxLatency: Math.max(...filteredLatency.map(m => m.value), 0),
      uptime: calculateUptime(filteredStatus)
    }
  });
});

function avg(values) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

// Alerts list
app.get('/api/alerts', (req, res) => {
  const { severity, acknowledged } = req.query;
  let filtered = [...alerts];

  if (severity) filtered = filtered.filter(a => a.severity === severity);
  if (acknowledged !== undefined) {
    filtered = filtered.filter(a => a.acknowledged === (acknowledged === 'true'));
  }

  res.json({
    success: true,
    alerts: filtered.reverse(),
    total: filtered.length
  });
});

// Trigger health check manually
app.post('/api/check', async (req, res) => {
  const results = await Promise.all(SERVICE_DEFS.map(service => checkService(service)));

  res.json({
    success: true,
    checked: results.length,
    healthy: results.filter(r => r).length
  });
});

// Prometheus metrics endpoint
app.get('/metrics', (req, res) => {
  let output = '# HELP bizora_service_up Service is up\n';
  output += '# TYPE bizora_service_up gauge\n';

  for (const [id, service] of services) {
    output += `bizora_service_up{service="${service.name}"} ${service.status === 'healthy' ? 1 : 0}\n`;
  }

  output += '\n# HELP bizora_service_latency Service latency in ms\n';
  output += '# TYPE bizora_service_latency gauge\n';

  for (const [id, service] of services) {
    output += `bizora_service_latency{service="${service.name}"} ${service.latency || 0}\n`;
  }

  res.set('Content-Type', 'text/plain');
  res.send(output);
});

// Start monitoring
console.log(`
╔════════════════════════════════════════════════════════════╗
║  📊 BIZORA Monitoring Service                      ║
║  Port: ${PORT}                                      ║
║                                                      ║
║  Monitored Services:                               ║
${SERVICE_DEFS.map(s => `║  • ${s.name.padEnd(25)} ${s.critical ? '(Critical)' : ''}  ║`).join('\n')}
║                                                      ║
╚════════════════════════════════════════════════════════════╝
`);

// Periodic health checks
setInterval(async () => {
  await Promise.all(SERVICE_DEFS.map(service => checkService(service)));
}, 30000); // Check every 30 seconds

app.listen(PORT, () => {
  console.log(`Monitoring running on port ${PORT}`);
});
