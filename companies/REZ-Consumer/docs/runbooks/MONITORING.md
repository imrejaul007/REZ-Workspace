# Monitoring Guide

## Metrics

### Key Metrics to Monitor

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| CPU Usage | Service CPU | > 80% |
| Memory Usage | RAM usage | > 85% |
| Response Time | API latency | > 500ms |
| Error Rate | 5xx errors | > 1% |
| Request Rate | Requests/sec | < 10 or > 1000 |

---

## Health Checks

### Backend Services

```bash
# Check all services
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3010/health
curl http://localhost:4001/health
curl http://localhost:4003/health
```

### Expected Response

```json
{
  "status": "ok",
  "service": "service-name",
  "version": "1.0.0",
  "timestamp": "2026-06-05T00:00:00.000Z"
}
```

---

## Prometheus Metrics

Each service exposes metrics at `/metrics`:

```bash
# Get metrics
curl http://localhost:3002/metrics
```

### Key Metrics

```
# Request rate
http_requests_total{method="GET", status="200"}

# Response time
http_request_duration_seconds_bucket{le="0.5"}

# Error rate
http_errors_total{type="500"}
```

---

## Alerts

### Critical Alerts

```yaml
# alerts.yaml
groups:
  - name: rez-consumer
    rules:
      - alert: ServiceDown
        expr: up{job="rez-consumer"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.instance }} is down"

      - alert: HighErrorRate
        expr: rate(http_errors_total[5m]) > 0.01
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate on {{ $labels.service }}"
```

---

## Grafana Dashboard

Import dashboard JSON from: `grafana/dashboard.json`

### Dashboard Panels

1. **Overview** - Service health at a glance
2. **Request Rate** - Requests per second
3. **Latency** - P50, P95, P99
4. **Errors** - Error rate by type
5. **Resources** - CPU, Memory, Network

---

## Logging

### Log Levels

| Level | Usage |
|-------|-------|
| ERROR | Errors requiring attention |
| WARN | Warnings |
| INFO | General info |
| DEBUG | Debug info |

### Log Format

```json
{
  "timestamp": "2026-06-05T00:00:00.000Z",
  "level": "info",
  "service": "go4food-api",
  "message": "Request processed",
  "requestId": "abc-123",
  "duration": 150
}
```

---

## SLA Targets

| Service | Availability | Latency | Error Rate |
|---------|---------------|---------|------------|
| go4food-api | 99.9% | < 200ms | < 0.1% |
| REZ-inbox | 99.9% | < 300ms | < 0.1% |
| REZ-assistant | 99.5% | < 500ms | < 0.5% |
| safe-qr-service | 99.9% | < 100ms | < 0.1% |
| verify-qr-service | 99.9% | < 100ms | < 0.1% |
