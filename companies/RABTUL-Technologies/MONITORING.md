# RABTUL-Technologies Monitoring Guide

**Last Updated:** 2026-05-16

---

## Monitoring Stack

| Tool | Purpose | URL |
|------|---------|-----|
| Sentry | Error Tracking | sentry.io |
| Render | Hosting & Logs | render.com |
| MongoDB Atlas | Database Monitoring | cloud.mongodb.com |
| Redis Cloud | Cache Monitoring | app.redislabs.com |

---

## Sentry Setup

### 1. Create Project

1. Go to [sentry.io](https://sentry.io)
2. Create new project for each service
3. Note the DSN URL

### 2. Environment Variables

```bash
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### 3. SDK Integration

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

---

## Health Checks

### Endpoint: `/health`

```typescript
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    service: process.env.SERVICE_NAME,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      cache: await checkRedis(),
    },
  };

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

### Response

```json
{
  "status": "healthy",
  "service": "rez-auth-service",
  "timestamp": "2026-05-16T00:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": "connected",
    "cache": "connected"
  }
}
```

---

## Metrics

### Key Metrics to Monitor

| Metric | Alert Threshold | Description |
|--------|----------------|-------------|
| Response Time | > 500ms | Average API response time |
| Error Rate | > 1% | Percentage of 5xx errors |
| CPU Usage | > 80% | Server CPU utilization |
| Memory Usage | > 85% | Server memory utilization |
| Request Count | > 10000/min | Total requests per minute |
| Database Connections | > 80% | Connection pool utilization |

---

## Alerts

### Sentry Alerts

```yaml
# .sentryclirc
[alerts]
enabled = true

[[rule]]
name = "High Error Rate"
match_level = "error"
times = 5
window = 60  # minutes
```

### Render Alerts

1. Go to Render Dashboard
2. Select Service
3. Click Alerts
4. Add alert for:
   - Error rate > 1%
   - Response time > 1s
   - Memory > 85%

---

## Logging

### Log Levels

| Level | Usage |
|-------|-------|
| ERROR | Failed operations, exceptions |
| WARN | Deprecations, slow queries |
| INFO | Requests, business events |
| DEBUG | Detailed debugging info |

### Structured Logging

```typescript
logger.info('Payment processed', {
  orderId: 'order_123',
  amount: 999,
  currency: 'INR',
  userId: 'user_456',
});
```

---

## Dashboards

### Grafana Dashboard

Import dashboard ID: `12556` (Node.js)

```yaml
datasources:
  - name: Prometheus
    type: prometheus
    url: http://localhost:9090
```

---

## Incident Response

### 1. Detect
- Check Sentry for errors
- Check Render logs
- Check MongoDB Atlas metrics

### 2. Assess
- Identify affected services
- Determine severity
- Check recent deployments

### 3. Mitigate
- Rollback if needed
- Scale up instances
- Clear cache if needed

### 4. Resolve
- Fix root cause
- Deploy fix
- Verify resolution

### 5. Post-mortem
- Document timeline
- Identify improvements
- Update runbooks
