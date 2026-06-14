# REZ Observability Platform

Centralized metrics, logging, and tracing.

## Quick Start

```bash
npm install
npm run dev
```

## Endpoints

| Type | Endpoint | Description |
|------|----------|-------------|
| Metrics | POST/GET /api/metrics | Record/query metrics |
| Logs | POST/GET /api/logs | Ingest/query logs |
| Traces | POST/GET /api/traces | Record/query traces |

## Metrics Format

```json
{
  "name": "http_requests_total",
  "type": "counter",
  "value": 1,
  "labels": { "service": "api-gateway" }
}
```

## Health Check

```bash
curl http://localhost:4025/health
```
