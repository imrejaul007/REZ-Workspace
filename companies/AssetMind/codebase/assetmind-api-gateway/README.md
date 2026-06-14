# AssetMind API Gateway

**Version:** 1.0.0  
**Port:** 5260 (TypeScript/Express) / 8000 (Python)  
**Type:** API Gateway / Reverse Proxy

## Overview

The API Gateway is the central entry point for all AssetMind services. It handles:
- Request routing to backend services
- Authentication and authorization
- Rate limiting
- Request/response transformation
- Load balancing
- Service discovery

## Quick Start

### TypeScript (Primary)

```bash
# Install dependencies
npm install

# Start in development
npm run dev

# Start in production
npm start

# Run tests
npm test
```

### Python (Alternative)

```bash
# Install dependencies
pip install -r requirements.txt

# Start server
python src/__init__.py
```

## Environment Variables

### Service URLs

All service URLs are configurable via environment variables:

```bash
# Core Tier
SVC_ASSET_UNIVERSE=http://localhost:5001
SVC_TWIN_ENGINE=http://localhost:5002
SVC_MARKET_TWIN=http://localhost:5003
SVC_PORTFOLIO_TWIN=http://localhost:5004
SVC_INVESTOR_TWIN=http://localhost:5005
SVC_INTELLIGENCE_TWIN=http://localhost:5006

# Data Tier
SVC_MARKET_DATA=http://localhost:5010
SVC_NEWS=http://localhost:5012
SVC_SOCIAL=http://localhost:5013
SVC_MACRO=http://localhost:5014
SVC_CRYPTO=http://localhost:5018
SVC_FOREX=http://localhost:5019

# Intelligence
SVC_INTELLIGENCE=http://localhost:5050
SVC_SENTIMENT=http://localhost:5052
SVC_RISK=http://localhost:5053
SVC_EVENTS=http://localhost:5054

# Agents
SVC_AGENTS=http://localhost:5090
SVC_PORTFOLIO_OPTIMIZER=http://localhost:5091
SVC_RISK_MANAGER=http://localhost:5092
```

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5260 | Server port |
| `NODE_ENV` | development | Environment mode |
| `LOG_LEVEL` | info | Logging level |
| `CORS_ORIGINS` | * | CORS allowed origins |

## API Endpoints

### Health Check

```bash
curl http://localhost:5260/health
```

Response:
```json
{
  "status": "healthy",
  "service": "assetmind-api-gateway",
  "version": "1.0.0",
  "timestamp": "2026-06-12T10:00:00Z"
}
```

### Service Routes

```bash
curl http://localhost:5260/api/routes
```

Response:
```json
{
  "success": true,
  "data": [
    {"path": "/api/assets", "target": "http://localhost:5001"},
    {"path": "/api/twin", "target": "http://localhost:5002"}
  ],
  "count": 40
}
```

### Service Health Check

```bash
curl http://localhost:5260/api/health
```

Response:
```json
{
  "success": true,
  "data": {
    "services": {
      "/api/assets": "healthy",
      "/api/twin": "healthy"
    },
    "summary": {
      "healthy": 35,
      "total": 40
    }
  }
}
```

## Architecture

```
                    ┌─────────────┐
                    │   Client    │
                    └──────┬──────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │   API Gateway   │
                 │    (Port 5260) │
                 └────────┬─────────┘
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
 ┌─────────┐      ┌───────────┐      ┌─────────┐
  │  Data   │      │   Twin    │      │  AI    │
  │  Tier   │      │   Engine  │      │Agents  │
  │(5010+)  │      │ (5002+)   │      │(5090+) │
  └─────────┘      └───────────┘      └─────────┘
```

## Routing

The gateway routes requests based on path:

| Path Prefix | Target Service | Port |
|------------|---------------|------|
| `/api/assets` | Asset Universe | 5001 |
| `/api/twin` | Twin Engine | 5002 |
| `/api/market-twin` | Market Twin | 5003 |
| `/api/portfolio-twin` | Portfolio Twin | 5004 |
| `/api/investor-twin` | Investor Twin | 5005 |
| `/api/intelligence-twin` | Intelligence Twin | 5006 |
| `/api/market-data` | Market Data | 5010 |
| `/api/news` | News Service | 5012 |
| `/api/intelligence` | Financial Intelligence | 5050 |
| `/api/agents` | Agent Orchestrator | 5090 |

## Security

- **CORS**: Configurable via `CORS_ORIGINS` env var
- **Rate Limiting**: 100 requests/minute (configurable)
- **JWT Validation**: Token validation on protected routes
- **Security Headers**: HSTS, CSP, X-Frame-Options
- **Error Handling**: Sanitized error responses

## Monitoring

### Prometheus Metrics

```bash
curl http://localhost:5260/metrics
```

Metrics include:
- `http_requests_total` - Total requests by method, endpoint, status
- `http_request_duration_seconds` - Request latency histogram
- `upstream_health` - Upstream service health status

### Health Check

```bash
# Overall health
curl http://localhost:5260/health

# All services health
curl http://localhost:5260/api/health
```

## Docker

```bash
# Build
docker build -t assetmind-api-gateway .

# Run
docker run -p 5260:5260 \
  -e SVC_ASSET_UNIVERSE=http://asset-universe:5001 \
  -e SVC_TWIN_ENGINE=http://asset-twin:5002 \
  -e CORS_ORIGINS=https://app.assetmind.ai \
  assetmind-api-gateway
```

## Kubernetes

```bash
# Deploy
kubectl apply -f k8s/core-services.yaml

# Check status
kubectl get pods -n assetmind -l component=gateway

# View logs
kubectl logs -n assetmind -l component=gateway -f
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- --grep "health"
```

## Troubleshooting

### Service unavailable

Check if the target service is running:
```bash
curl http://localhost:5001/health
```

### CORS errors

Ensure `CORS_ORIGINS` includes your frontend URL:
```bash
CORS_ORIGINS=https://app.assetmind.ai,https://dashboard.assetmind.ai
```

### High latency

Check upstream service health:
```bash
curl http://localhost:5260/api/health
```

---

## See Also

- [DEPLOYMENT.md](../DEPLOYMENT.md) - Deployment guide
- [MONITORING.md](../MONITORING.md) - Monitoring setup
- [SECURITY.md](../SECURITY.md) - Security hardening

---

*Part of the AssetMind Financial Intelligence Platform*