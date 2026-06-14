# Measurement Cloud Service

**Port: 4970**

AdBazaar's Measurement Cloud - A comprehensive TV/streaming measurement platform that competes with Nielsen, iSpot, and Conviva.

## Overview

The Measurement Cloud Service provides enterprise-grade advertising measurement capabilities including:

- **Impression Tracking** - Real-time impression measurement across all devices and formats
- **Attribution Modeling** - Multi-touch attribution with 6 different models
- **Brand Safety** - Content safety checks and competitor adjacency detection
- **Viewability Measurement** - IAB, MRC, and OMID standard compliance
- **Campaign Analytics** - Full-funnel analytics with demographic and geographic breakdowns

## Competitor Comparison

| Feature | Nielsen | iSpot | Conviva | AdBazaar Measurement |
|---------|---------|-------|---------|---------------------|
| TV Measurement | ✅ | ✅ | ✅ | ✅ |
| Streaming Analytics | ✅ | ✅ | ✅ | ✅ |
| Real-time Impressions | ⚠️ | ✅ | ✅ | ✅ |
| Multi-touch Attribution | ⚠️ | ⚠️ | ❌ | ✅ |
| Brand Safety | ✅ | ✅ | ⚠️ | ✅ |
| Viewability (IAB/MRC/OMID) | ✅ | ✅ | ✅ | ✅ |
| Incrementality Testing | ⚠️ | ✅ | ❌ | ✅ |
| Geo Experiments | ⚠️ | ⚠️ | ❌ | ✅ |
| Custom Attribution Models | ❌ | ❌ | ❌ | ✅ |
| Cross-device Tracking | ✅ | ✅ | ✅ | ✅ |

## Quick Start

```bash
# Install dependencies
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/measurement-cloud-service
npm install

# Start development server
npm run dev

# Health check
curl http://localhost:4970/health

# View metrics
curl http://localhost:4970/metrics
```

## Environment Variables

```bash
# Server Configuration
PORT=4970
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/measurement-cloud

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
INTERNAL_SERVICE_TOKEN=your-internal-token
MEASUREMENT_API_KEY=your-api-key

# Logging
LOG_LEVEL=info
```

## API Endpoints

### Health & Metrics

```
GET /health              - Health check
GET /metrics             - Prometheus metrics
```

### Campaign Measurement

```
POST /api/measurements/campaign       - Record campaign measurement
GET  /api/measurements/campaign/:id   - Get campaign measurements
```

### Impressions

```
POST /api/measurements/impression      - Record impression event
```

### Attribution

```
POST /api/measurements/attribution              - Record attribution
GET  /api/measurements/attribution/:campaignId  - Get attribution data
```

### Brand Safety

```
POST /api/measurements/brand-safety               - Perform brand safety check
GET  /api/measurements/brand-safety/:campaignId    - Get brand safety results
```

### Viewability

```
POST /api/measurements/viewability               - Track viewability
GET  /api/measurements/viewability/:campaignId   - Get viewability metrics
```

### Analytics

```
GET /api/measurements/analytics/:campaignId      - Full campaign analytics
```

## Authentication

All API endpoints (except `/health` and `/metrics`) require authentication:

### Internal Services
```bash
curl -X POST http://localhost:4970/api/measurements/campaign \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-internal-token" \
  -H "X-Service-Name: adbazaar-backend" \
  -d '{"campaignId": "camp_123", ...}'
```

### External API
```bash
curl -X POST http://localhost:4970/api/measurements/campaign \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"campaignId": "camp_123", ...}'
```

## API Examples

### Record Campaign Measurement

```bash
curl -X POST http://localhost:4970/api/measurements/campaign \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-internal-token" \
  -d '{
    "campaignId": "camp_123",
    "type": "campaign",
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    },
    "metrics": {
      "impressions": 1000000,
      "clicks": 50000,
      "conversions": 2500,
      "spend": 50000
    },
    "demographics": {
      "ageGroups": {
        "18-24": 0.2,
        "25-34": 0.35,
        "35-44": 0.25,
        "45-54": 0.15,
        "55+": 0.05
      },
      "gender": {
        "male": 0.55,
        "female": 0.45
      }
    },
    "geoDistribution": [
      {"country": "US", "impressions": 600000},
      {"country": "UK", "impressions": 200000},
      {"country": "IN", "impressions": 200000}
    ],
    "deviceBreakdown": {
      "desktop": 0.4,
      "mobile": 0.45,
      "ctv": 0.15
    },
    "brandLift": {
      "awareness": 15,
      "consideration": 8,
      "purchaseIntent": 5
    }
  }'
```

### Record Impression

```bash
curl -X POST http://localhost:4970/api/measurements/impression \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-internal-token" \
  -d '{
    "campaignId": "camp_123",
    "impressionId": "imp_456",
    "deviceType": "mobile",
    "placementType": "in-feed",
    "viewerInfo": {
      "country": "US",
      "state": "CA",
      "deviceType": "mobile",
      "browser": "Chrome",
      "os": "iOS"
    },
    "viewabilityData": {
      "visibleArea": 75,
      "viewableTime": 2500
    }
  }'
```

### Record Attribution (Multi-touch)

```bash
curl -X POST http://localhost:4970/api/measurements/attribution \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-internal-token" \
  -d '{
    "campaignId": "camp_123",
    "model": "linear",
    "conversionId": "conv_789",
    "customerId": "cust_001",
    "conversionValue": 150,
    "conversionTimestamp": "2024-01-15T14:30:00Z",
    "touchpoints": [
      {
        "type": "impression",
        "channel": "display",
        "timestamp": "2024-01-10T10:00:00Z",
        "campaignId": "camp_123"
      },
      {
        "type": "click",
        "channel": "search",
        "timestamp": "2024-01-14T09:00:00Z",
        "campaignId": "camp_456"
      },
      {
        "type": "conversion",
        "channel": "direct",
        "timestamp": "2024-01-15T14:30:00Z"
      }
    ],
    "windowDays": 30
  }'
```

### Brand Safety Check

```bash
curl -X POST http://localhost:4970/api/measurements/brand-safety \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-internal-token" \
  -d '{
    "campaignId": "camp_123",
    "contentUrl": "https://example.com/article",
    "contentText": "Article content for brand safety analysis...",
    "contentCategories": ["news", "technology"],
    "competitorDomains": ["competitor.com", "rival.com"],
    "customKeywords": {
      "positive": ["innovation", "sustainability"],
      "negative": ["scandal", "controversy"]
    }
  }'
```

### Track Viewability

```bash
curl -X POST http://localhost:4970/api/measurements/viewability \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-internal-token" \
  -d '{
    "campaignId": "camp_123",
    "impressionId": "imp_456",
    "standard": "iab",
    "viewableTime": 2500,
    "visibleArea": 75,
    "inViewStart": "2024-01-15T10:00:00Z",
    "inViewEnd": "2024-01-15T10:02:30Z",
    "deviceType": "ctv",
    "format": "video",
    "placementType": "midRoll",
    "playerState": {
      "paused": false,
      "muted": true,
      "fullscreen": true,
      "autoplay": false
    }
  }'
```

### Get Full Analytics

```bash
curl http://localhost:4970/api/measurements/analytics/camp_123 \
  -H "X-Internal-Token: your-internal-token"
```

## Attribution Models

The service supports 6 attribution models:

| Model | Description | Best For |
|-------|-------------|----------|
| **First Touch** | 100% credit to first touchpoint | Brand awareness campaigns |
| **Last Touch** | 100% credit to last touchpoint | Direct response campaigns |
| **Linear** | Equal credit to all touchpoints | Balanced view of customer journey |
| **Time Decay** | More credit to recent touchpoints (7-day half-life) | Urgency-driven campaigns |
| **Position Based** | 40% first, 40% last, 20% distributed | Full-funnel campaigns |
| **Data Driven** | ML-based credit allocation | Advanced optimization |

## Viewability Standards

| Standard | Description | Thresholds |
|----------|-------------|------------|
| **IAB** | Interactive Advertising Bureau | Display: 50% visible for 1s<br>Video: 50% visible for 2s |
| **MRC** | Media Rating Council | Display: 50% visible for 1s<br>Video: 50% visible for 2s |
| **OMID** | Open Measurement Interface Definition | 50% visible area for 1+ second |
| **Custom** | Configurable thresholds | User-defined |

## Brand Safety Checks

| Check Type | Description | Violations Detected |
|------------|-------------|---------------------|
| Content Category | Analyzes content categories | Explicit, Hate, Violence, Drugs |
| Keyword Filtering | Scans for blocked keywords | Custom negative keywords |
| Competitor Adjacency | Detects competitor domains | Domain-based exclusions |
| Contextual Analysis | Analyzes content context | Negative topics, crises |
| Sentiment Analysis | Evaluates content sentiment | Predominantly negative content |

## Data Models

### Measurement
```typescript
{
  campaignId: string;
  type: 'campaign' | 'impression' | 'conversion' | 'engagement';
  timestamp: Date;
  period: { start: Date; end: Date };
  metrics: {
    impressions: number;
    uniqueImpressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    cpm: number;
    ctr: number;
    conversionRate: number;
    roas: number;
  };
  demographics?: IDemographics;
  geoDistribution?: IGeoDistribution[];
  deviceBreakdown?: Record<string, number>;
  channelBreakdown?: Record<string, number>;
  brandLift?: IBrandLift;
  incrementality?: IIncrementality;
}
```

### Attribution
```typescript
{
  campaignId: string;
  model: AttributionModel;
  conversionId: string;
  customerId?: string;
  conversionValue: number;
  conversionTimestamp: Date;
  touchpoints: ITouchpoint[];
  creditAllocation: ICreditAllocation[];
  windowStart: Date;
  windowEnd: Date;
}
```

### Brand Safety
```typescript
{
  campaignId: string;
  timestamp: Date;
  overallScore: number; // 0-100
  overallStatus: 'passed' | 'failed' | 'warning' | 'pending';
  checks: IBrandSafetyCheck[];
  contentCategories: { category: string; risk: number }[];
  contextualAnalysis: { topic: string; sentiment: string }[];
  recommendations?: string[];
}
```

### Viewability
```typescript
{
  campaignId: string;
  timestamp: Date;
  period: { start: Date; end: Date };
  viewableImpressions: number;
  totalImpressions: number;
  viewabilityRate: number;
  standard: ViewabilityStandard;
  metrics: {
    avgViewableTime: number;
    medianViewableTime: number;
    pctFullyOnScreen: number;
    pct50OnScreen: number;
    pct100OnScreen: number;
  };
  breakdown: {
    device: Record<string, number>;
    format: Record<string, number>;
    placement: Record<string, number>;
  };
}
```

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `measurement_http_request_duration_seconds` | Histogram | HTTP request duration |
| `measurement_http_requests_total` | Counter | Total HTTP requests |
| `measurement_recorded_total` | Counter | Total measurements recorded |
| `measurement_processing_duration_seconds` | Histogram | Measurement processing time |
| `measurement_impressions_total` | Counter | Total impressions |
| `measurement_impression_viewability_rate` | Gauge | Viewability rate |
| `measurement_attribution_conversions_total` | Counter | Attributed conversions |
| `measurement_brand_safety_checks_total` | Counter | Brand safety checks |
| `measurement_brand_safety_score` | Gauge | Brand safety score |
| `measurement_viewability_rate` | Gauge | Viewability rate |
| `measurement_cache_hits_total` | Counter | Cache hits |
| `measurement_cache_misses_total` | Counter | Cache misses |
| `measurement_db_operation_duration_seconds` | Histogram | DB operation duration |
| `measurement_errors_total` | Counter | Total errors |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Measurement Cloud Service                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Campaign   │  │  Impression  │  │  Attribution │      │
│  │  Measurement │  │   Tracking  │  │    Modeling  │      │
│  │  (Service)   │  │  (Service)   │  │   (Service)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Brand     │  │  Viewability  │  │  Analytics   │      │
│  │    Safety    │  │  Measurement  │  │   Engine     │      │
│  │  (Service)   │  │  (Service)   │  │  (Service)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                        Models                                 │
│  Measurement | Attribution | BrandSafety | Viewability       │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                                │
│           MongoDB + Redis Cache                              │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling

All API errors return a consistent format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": [...] // Optional validation errors
}
```

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Authentication required |
| 403 | Forbidden |
| 404 | Not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Rate Limiting

Internal services are rate-limited:
- Default: 1000 requests per minute
- Configurable via `X-RateLimit-*` headers

## Logs

Logs are written to:
- `logs/error.log` - Error-level logs
- `logs/combined.log` - All logs

Log format:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "service": "measurement-cloud-service",
  "version": "1.0.0",
  "message": "Event description",
  "traceId": "uuid",
  "context": {...}
}
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Building

```bash
# TypeScript build
npm run build

# Start production
npm start
```

## Ecosystem Integration

The service integrates with:
- **RABTUL Auth** - Authentication via internal service token
- **RABTUL Wallet** - Payment tracking
- **REZ Intelligence** - ML-based attribution
- **HOJAI Memory** - Historical measurement data
- **HOJAI Analytics** - Cross-service insights

## Support

For issues or questions:
- Documentation: `/docs`
- Health check: `/health`
- Metrics: `/metrics`