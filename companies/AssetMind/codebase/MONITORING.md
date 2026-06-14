# AssetMind Monitoring Setup

## Overview

This guide covers setting up monitoring for the AssetMind platform using Prometheus and Grafana.

## Components

- **Prometheus** - Metrics collection and alerting
- **Grafana** - Visualization and dashboards
- **Alertmanager** - Alert routing and notification
- **Node Exporter** - System metrics
- **cAdvisor** - Container metrics

## Quick Start

### Local Development

```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Access services
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
```

### Kubernetes

```bash
# Install Prometheus Operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace

# Port forward for access
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

## Dashboards

### Import Dashboard

1. Open Grafana at http://localhost:3000
2. Login with admin/admin
3. Go to Dashboards → Import
4. Upload `k8s/dashboards/assetmind-dashboard.json`
5. Select Prometheus data source
6. Click Import

### Pre-built Dashboards

| Dashboard | Description |
|-----------|-------------|
| AssetMind Main | Overview of all services |
| API Gateway | Gateway metrics |
| Twin Engines | Digital twin performance |
| AI Services | ML model metrics |
| Database | PostgreSQL/Redis/Neo4j |

## Metrics

### Application Metrics

Add these to your services:

```python
from prometheus_client import Counter, Histogram, Gauge

# Request metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

# Business metrics
ACTIVE_USERS = Gauge(
    'active_users_total',
    'Number of active users'
)

TWINS_PROCESSED = Counter(
    'twins_processed_total',
    'Total twins processed',
    ['twin_type']
)
```

### Endpoint Format

Prometheus metrics endpoint: `/metrics`

```python
from fastapi import FastAPI
from prometheus_client import make_asgi_app

app = FastAPI()

# Mount metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
```

## Alerts

### Critical Alerts

```yaml
# alerts.yaml
groups:
  - name: assetmind
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: ServiceDown
        expr: up{job="assetmind-services"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.instance }} is down"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
          > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "p95 latency is {{ $value }}s"
```

## Service Level Objectives

| Service | Availability | Latency (p95) | Error Rate |
|---------|--------------|---------------|------------|
| API Gateway | 99.9% | < 200ms | < 0.1% |
| Twin Engines | 99.5% | < 500ms | < 1% |
| Data Services | 99.5% | < 1s | < 1% |
| AI Services | 99.0% | < 5s | < 2% |

## Notification Channels

### Slack

```yaml
# alertmanager-config.yaml
route:
  receiver: 'slack-notifications'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/XXX/YYY/ZZZ'
        channel: '#alerts'
        send_resolved: true
```

### PagerDuty

```yaml
receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_SERVICE_KEY'
        severity: critical
```

## Troubleshooting

### Prometheus not scraping

```bash
# Check targets
kubectl exec -it prometheus-0 -n monitoring -- wget -qO- localhost:9090/api/v1/targets

# Check service monitors
kubectl get servicemonitor -n assetmind
```

### Grafana dashboard not loading

```bash
# Check datasource
kubectl get grafanadatasource -n monitoring

# Check logs
kubectl logs -n monitoring deployment/grafana
```

## Metrics Reference

### Key Metrics to Monitor

| Metric | Description | Alert Threshold |
|-------|-------------|----------------|
| `http_requests_total` | Total HTTP requests | - |
| `http_request_duration_seconds` | Request latency | p95 > 1s |
| `active_connections` | Active connections | > 1000 |
| `error_rate` | Error rate | > 1% |
| `cpu_usage` | CPU usage | > 80% |
| `memory_usage` | Memory usage | > 85% |
| `disk_usage` | Disk usage | > 90% |
| `response_queue_size` | Response queue | > 100 |

---

*Generated by Claude Code*  
*Last updated: June 12, 2026*
