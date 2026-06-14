# REZ Merchant Trust Bridge

A microservice for syncing merchant trust/risk data and managing trust-based credit limits.

## Overview

The Merchant Trust Bridge service integrates with external trust sources to:

- Sync merchant risk scores from fraud, identity, and credit bureau services
- Calculate and apply trust-based credit limits
- Block high-risk merchants automatically
- Generate alerts on trust degradation
- Provide trust dashboard data for merchants

## Features

| Feature | Description |
|---------|-------------|
| **Trust Sync** | Sync risk scores from multiple external sources |
| **Limit Engine** | Calculate credit limits based on trust scores |
| **Auto-Block** | Automatically block merchants with critical risk |
| **Alerts** | Generate alerts on trust drops, risk increases, and limit thresholds |
| **Dashboard** | Unified trust dashboard data for each merchant |
| **History** | Track trust score and limit changes over time |

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

```bash
# Clone and install dependencies
cd REZ-merchant-trust-bridge
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your configuration

# Build TypeScript
npm run build

# Start the service
npm start
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `4041` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/rez-merchant-trust-bridge` |
| `INTERNAL_SERVICE_TOKEN` | Authentication token | Required |
| `LOG_LEVEL` | Logging level | `info` |
| `FRAUD_SERVICE_URL` | REZ Fraud Service endpoint | `http://localhost:4022` |
| `IDENTITY_SERVICE_URL` | REZ Identity Service endpoint | `http://localhost:4001` |
| `TRUST_DROP_THRESHOLD` | Alert threshold for trust drops (%) | `10` |
| `CRITICAL_SCORE_THRESHOLD` | Score below which merchant is blocked | `40` |

## API Reference

All endpoints require `X-Internal-Token` header.

### Trust Score Endpoints

```bash
# Get trust score for a merchant
GET /api/bridge/trust/:merchantId

# Get trust score history
GET /api/bridge/trust/:merchantId/history
```

### Sync Endpoints

```bash
# Sync trust data for a merchant
POST /api/bridge/sync/:merchantId?forceSync=true

# Batch sync multiple merchants
POST /api/bridge/sync/batch
{
  "merchantIds": ["merchant1", "merchant2"],
  "forceSync": false
}

# Get sync status for all sources
GET /api/bridge/sync/status
```

### Credit Limit Endpoints

```bash
# Get current credit limit
GET /api/bridge/limit/:merchantId

# Calculate credit limit
POST /api/bridge/limit/:merchantId/calculate
{
  "currentVolume": 500000,
  "businessAge": 3,
  "requestedLimit": 100000
}

# Check if transaction can proceed
POST /api/bridge/limit/:merchantId/check
{
  "amount": 50000
}

# Update used limit
PUT /api/bridge/limit/:merchantId/used
{
  "amount": 50000,
  "operation": "ADD"
}

# Recalculate all limits
POST /api/bridge/limit/recalculate-all

# Unblock a merchant
POST /api/bridge/limit/:merchantId/unblock
{
  "reason": "Manual review completed"
}
```

### Alert Endpoints

```bash
# Get alerts with filtering
GET /api/bridge/alerts?merchantId=x&severity=CRITICAL&page=1&limit=50

# Get unacknowledged alerts
GET /api/bridge/alerts/unacknowledged?merchantId=x&severity=WARNING

# Acknowledge alerts
POST /api/bridge/alerts/acknowledge
{
  "alertIds": ["id1", "id2"],
  "acknowledgedBy": "admin@company.com"
}

# Get alert statistics
GET /api/bridge/alerts/stats?startDate=2024-01-01&endDate=2024-12-31
```

### Dashboard Endpoint

```bash
# Get trust dashboard data
GET /api/bridge/dashboard/:merchantId
```

### Health Endpoints

```bash
# Basic health check
GET /health

# Readiness check (includes DB status)
GET /ready
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Trust score not found",
    "details": {}
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Trust Score Ranges

| Score Range | Risk Level | Description |
|-------------|------------|-------------|
| 90-100 | LOW | Excellent trust, full access |
| 75-89 | LOW | Good trust, standard limits |
| 60-74 | MEDIUM | Moderate risk, reduced limits |
| 40-59 | HIGH | Elevated risk, minimal limits |
| 0-39 | CRITICAL | Blocked, manual review required |

## Credit Limit Calculation

Limits are calculated based on:

1. **Base limit** from trust score tier
2. **Volume multiplier** (based on transaction volume)
3. **Business age bonus** (for established businesses)
4. **Risk level multiplier** (lower risk = higher multiplier)

Maximum limits are capped by tier to prevent excessive exposure.

## Alert Types

| Type | Trigger | Severity |
|------|---------|----------|
| `TRUST_DROP` | Trust score drops by threshold % | WARNING/CRITICAL |
| `RISK_INCREASE` | Risk level increases | WARNING/CRITICAL |
| `LIMIT_THRESHOLD` | Limit changes significantly | INFO/WARNING |
| `BLOCK_TRIGGERED` | Merchant blocked | CRITICAL |
| `COMPLIANCE_ISSUE` | Compliance score drops | WARNING |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   REZ Merchant Trust Bridge                  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Trust Sync  │  │ Limit Engine │  │ Alert Service│      │
│  │   Service    │  │              │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │             │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │                    MongoDB                           │    │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐  │    │
│  │  │ Trust   │ │ Credit   │ │ Alerts │ │ Sync Log │  │    │
│  │  │ Scores  │ │ Limits   │ │        │ │          │  │    │
│  │  └─────────┘ └──────────┘ └────────┘ └──────────┘  │    │
│  └──────────────────────────────────────────────────────┘    │
│                            │                                 │
│  ┌────────────────────────▼────────────────────────────┐    │
│  │                   API Routes                         │    │
│  │  /trust /sync /limit /alerts /dashboard             │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐        ┌────▼────┐        ┌─────▼─────┐
   │  Fraud  │        │Identity │        │  Credit   │
   │ Service │        │ Service │        │  Bureau   │
   └─────────┘        └─────────┘        └───────────┘
```

## Rate Limiting

Default: 100 requests per minute per IP

Headers returned:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SYNC_FAILED` | 500 | Trust sync failed |
| `INTERNAL_ERROR` | 500 | Unexpected error |

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/services/trustSync.test.ts
```

## Monitoring

The service logs:
- All API requests (method, path, status, duration)
- Trust sync operations (start, complete, errors)
- Alert triggers
- Rate limit violations

For production, integrate with:
- Sentry for error tracking
- Prometheus metrics endpoint
- Grafana dashboards

## License

Proprietary - All rights reserved
