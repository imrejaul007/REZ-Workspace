# REZ Observability Stack - Prometheus + Grafana + Loki + Tempo

## Overview

This is Day 3-4 of the world-class plan. We need observability for all services.

## Components

1. **Prometheus** - Metrics collection
2. **Grafana** - Dashboards & alerting
3. **Loki** - Log aggregation
4. **Tempo** - Distributed tracing

## Quick Start

```bash
# Start locally
docker-compose -f docker-compose.observability.yml up -d

# Access
# Grafana: http://localhost:3000 (admin/admin)
# Prometheus: http://localhost:9090
# Loki: http://localhost:3100
# Tempo: http://localhost:3200
```

## Environment Variables

Add to each service .env:

```bash
# Metrics
METRICS_ENABLED=true
METRICS_PORT=9090

# Tracing
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=your-service-name

# Logs
LOKI_URL=http://localhost:3100
```

## Prometheus Config

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'rez-auth-service'
    static_configs:
      - targets: ['auth-service:9090']
  - job_name: 'rez-payment-service'
    static_configs:
      - targets: ['payment-service:9090']
```

## Grafana Dashboard

Import `grafana/dashboards/services.json`

## Alert Rules

```yaml
# alerts/services.yml
groups:
  - name: rez-services
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected
```

## Next: Setup per service
