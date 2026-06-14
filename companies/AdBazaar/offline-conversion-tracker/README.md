# Offline Conversion Tracker

**Port:** 4975

AdBazaar's Offline Conversion Tracker service for tracking and attributing offline conversions to online ad campaigns.

## Overview

The Offline Conversion Tracker enables advertisers to measure the impact of their digital advertising on offline actions like purchases, phone calls, and store visits. It bridges the gap between online ad exposure and offline conversions through various matching techniques.

## Features

- **Conversion Recording** - Track offline conversions with rich metadata
- **Online/Offline Matching** - Match conversions via email, phone, device ID, or fingerprint
- **Batch Import** - Bulk import conversions from CSV, XLSX, or JSON files
- **Attribution Models** - Support for first-click, last-click, linear, time-decay, and position-based attribution
- **Analytics Dashboard** - Comprehensive reporting on conversion performance
- **Multi-Campaign Support** - Track conversions across multiple ad campaigns

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    OFFLINE CONVERSION TRACKER                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ Conversion  │  │    Match    │  │   Import    │           │
│  │   Service   │  │   Service   │  │   Service   │           │
│  │  (Port 4975)│  │             │  │             │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│  ┌─────────────┐  ┌─────────────┐                             │
│  │ Analytics  │  │ Attribution │                             │
│  │   Service  │  │   Service   │                             │
│  └─────────────┘  └─────────────┘                             │
├─────────────────────────────────────────────────────────────────┤
│                    MONGODB + REDIS                              │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/offline-conversion-tracker

# Install dependencies
npm install

# Start the service
npm run dev

# Or build and run production
npm run build
npm start
```

## Environment Variables

```env
PORT=4975
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/adbazaar_offline_conversions
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_TOKEN=adbazaar-internal-token-2024
SERVICE_TOKEN_SECRET=adbazaar-service-secret
ALLOWED_ORIGINS=*
LOG_LEVEL=info
```

## API Endpoints

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

### Conversions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/conversions` | Record a conversion |
| GET | `/api/conversions/:id` | Get conversion by ID |
| POST | `/api/conversions/batch` | Batch upload conversions |
| GET | `/api/conversions/campaign/:campaignId` | Campaign conversions |
| DELETE | `/api/conversions/:id` | Delete conversion |
| PATCH | `/api/conversions/:id/status` | Update status |
| GET | `/api/conversions/statistics` | Get statistics |

### Attribution & Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversions/attribution` | Attribution report |
| GET | `/api/conversions/analytics` | Conversion analytics |
| GET | `/api/conversions/dashboard` | Dashboard data |

### Import & Matching

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/conversions/import` | Import from file |
| POST | `/api/conversions/match` | Match to online |

## API Usage Examples

### Record a Conversion

```bash
curl -X POST http://localhost:4975/api/conversions \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: adbazaar-internal-token-2024" \
  -d '{
    "campaignId": "camp_123",
    "userId": "user_456",
    "type": "purchase",
    "value": 2999,
    "currency": "INR",
    "date": "2026-06-07T10:30:00Z",
    "source": "google",
    "medium": "cpc",
    "device": "mobile",
    "location": {
      "country": "India",
      "city": "Mumbai"
    }
  }'
```

### Batch Upload

```bash
curl -X POST http://localhost:4975/api/conversions/batch \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: adbazaar-internal-token-2024" \
  -d '{
    "campaignId": "camp_123",
    "conversions": [
      {
        "type": "purchase",
        "value": 1500,
        "date": "2026-06-07T09:00:00Z"
      },
      {
        "type": "visit",
        "date": "2026-06-07T10:00:00Z"
      }
    ]
  }'
```

### Match to Online

```bash
curl -X POST http://localhost:4975/api/conversions/match \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: adbazaar-internal-token-2024" \
  -d '{
    "offlineId": "conversion_id_here",
    "matchType": "email",
    "matchData": {
      "onlineId": "online_conversion_id",
      "email": "user@example.com"
    },
    "attributionWindow": 30
  }'
```

### Get Attribution Report

```bash
curl -X GET "http://localhost:4975/api/conversions/attribution?campaignId=camp_123&model=last_click&window=30" \
  -H "X-Internal-Token: adbazaar-internal-token-2024"
```

### Get Analytics

```bash
curl -X GET "http://localhost:4975/api/conversions/analytics?campaignId=camp_123&startDate=2026-06-01&endDate=2026-06-30&groupBy=day" \
  -H "X-Internal-Token: adbazaar-internal-token-2024"
```

### Get Dashboard

```bash
curl -X GET "http://localhost:4975/api/conversions/dashboard?campaignId=camp_123" \
  -H "X-Internal-Token: adbazaar-internal-token-2024"
```

## Data Models

### OfflineConversion

| Field | Type | Description |
|-------|------|-------------|
| campaignId | String | Ad campaign identifier |
| userId | String | User identifier (optional) |
| type | Enum | purchase, visit, call, form, install, other |
| value | Number | Conversion value |
| currency | String | Currency code (default: INR) |
| date | Date | Conversion date |
| source | String | Traffic source |
| medium | String | Traffic medium |
| device | String | Device type |
| location | Object | Geographic data |
| matchedOnlineId | String | Matched online conversion ID |
| matchConfidence | Number | Match confidence (0-100) |
| status | Enum | pending, matched, confirmed, rejected |

### ConversionMatch

| Field | Type | Description |
|-------|------|-------------|
| offlineId | String | Offline conversion ID |
| onlineId | String | Online conversion ID |
| matchType | Enum | email, phone, device_id, fingerprint, probability |
| confidence | Number | Match confidence (0-100) |
| matchData | Object | Matching data used |
| attributionWindow | Number | Attribution window in days |
| status | Enum | pending, confirmed, rejected, disputed |

## Attribution Models

| Model | Description |
|-------|-------------|
| first_click | All credit to first touchpoint |
| last_click | All credit to last touchpoint |
| linear | Equal credit to all touchpoints |
| time_decay | More credit to recent touchpoints |
| position_based | 40% first, 40% last, 20% distributed |

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| offline_conversions_total | Counter | Total conversions recorded |
| offline_conversions_value_total | Gauge | Total conversion value |
| offline_conversion_match_rate | Gauge | Match rate percentage |
| offline_conversion_imports_total | Counter | Total imports |
| http_request_duration_seconds | Histogram | Request latency |
| database_operation_duration_seconds | Histogram | DB operation latency |

## Authentication

Internal services authenticate using:
- `X-Internal-Token` header for service-to-service calls
- `X-Service-Token` header for specific service authentication
- `X-API-Key` header for external API access

## Integration with AdBazaar Ecosystem

This service integrates with:
- **AdBazaar Backend** - Core ad management
- **AdBazaar Analytics** - Analytics platform
- **HOJAI Intelligence** - AI/ML services
- **REZ Intent Graph** - Intent tracking
- **REZ Notification Service** - Notifications

## Health Check

```bash
curl http://localhost:4975/health
```

Response:
```json
{
  "status": "ok",
  "service": "offline-conversion-tracker",
  "port": 4975,
  "timestamp": "2026-06-07T10:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

## Error Handling

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human readable message",
  "details": [] // Optional validation details
}
```

## License

Internal - AdBazaar