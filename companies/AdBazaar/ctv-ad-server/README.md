# CTV Ad Server

Connected TV / OTT Video Ad Server - SpringServe equivalent for connected TV advertising.

## Overview

CTV Ad Server is a comprehensive ad serving platform designed for connected TV (CTV) and over-the-top (OTT) environments. It provides:

- **VAST 4.2 compliant** ad serving
- **Real-time ad decisioning** with sub-100ms response times
- **Pod serving** for multiple ads in ad breaks
- **Skip ad support** with configurable skip offsets
- **Companion ads** for enhanced brand experiences
- **Frequency capping** per device
- **Campaign pacing** (even, ASAP, frontloaded)
- **Nielsen/Comscore** measurement integration ready
- **Prometheus metrics** for monitoring

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB (mongoose ODM)
- **Cache:** Redis (frequency capping, pacing)
- **Validation:** Zod
- **Auth:** JWT
- **Metrics:** Prometheus (prom-client)
- **Language:** TypeScript

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6.0+
- Redis 7.0+

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start MongoDB and Redis (using Docker)
docker run -d -p 27017:27017 --name mongodb mongo:6
docker run -d -p 6379:6379 --name redis redis:7

# Start the server
npm run dev
```

### Configuration

Environment variables (see `.env.example`):

```env
PORT=4702
MONGODB_URI=mongodb://localhost:27017/ctv-ad-server
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secure-jwt-secret
VAST_VERSION=4.2
NODE_ENV=development
```

## API Endpoints

### VAST Ad Serving

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vast/:placementId` | GET | Get VAST XML for CTV placement |
| `/api/vast/:placementId/pod` | GET | Get VAST XML for ad pod |

### Ad Decisioning

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/decision` | POST | Real-time ad decision request |
| `/api/decision/pod` | POST | Pod ad decision request |

### Event Tracking

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/track/:eventType` | POST | Track ad events |
| `/api/track/:campaignId/:creativeId/:eventName` | GET | VAST tracking pixel |

### Campaign Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/campaigns` | GET | List active campaigns |
| `/api/campaigns` | POST | Create CTV campaign |
| `/api/campaigns/:id` | GET | Get campaign details |
| `/api/campaigns/:id` | PUT | Update campaign |
| `/api/campaigns/:id` | DELETE | Delete campaign |
| `/api/campaigns/:id/status` | PATCH | Update campaign status |

### Pacing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pacing/:campaignId` | GET | Get pacing status |
| `/api/pacing/:campaignId/pace` | POST | Adjust pacing |
| `/api/pacing/:campaignId/analytics` | GET | Get pacing analytics |

### Health & Metrics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/health/live` | GET | Liveness probe |
| `/health/ready` | GET | Readiness probe |
| `/metrics` | GET | Prometheus metrics |

## VAST API Usage

### Request VAST XML

```bash
curl "http://localhost:4702/api/vast/preroll_001?deviceType=smarttv&geo=IN&appId=streaming-app"
```

Query parameters:
- `deviceType`: smarttv, settop, gaming, streaming
- `deviceId`: Unique device identifier
- `appId`: Application ID
- `geo`: Geographic location code
- `contentCategory`: Content category
- `videoDuration`: Video duration in seconds
- `skipOffset`: Skip offset in seconds
- `podPosition`: Pod position (1, 2, 3...)
- `maxAds`: Maximum ads in pod

### Response

Returns XML content with Content-Type: application/xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<VAST version="4.2" xmlns="http://www.iab.com/VAST/4.2">
  <Ad id="campaign-123">
    <InLine>
      <AdTitle>Test Ad</AdTitle>
      <Creatives>
        <Creative id="creative-001">
          <Linear>
            <Duration>00:00:30</Duration>
            <VideoClicks>
              <ClickThrough id="clickThrough">https://example.com/click</ClickThrough>
            </VideoClicks>
            <MediaFiles>
              <MediaFile type="video/mp4">https://cdn.example.com/video.mp4</MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>
      </Creatives>
    </InLine>
  </Ad>
</VAST>
```

## Campaign Management

### Create Campaign

```bash
curl -X POST http://localhost:4702/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Summer Sale Campaign",
    "format": "preroll",
    "budget": {
      "daily": 1000,
      "total": 30000
    },
    "bid": {
      "type": "cpm",
      "amount": 10,
      "maxBid": 15
    },
    "targeting": {
      "geo": ["IN", "US"],
      "deviceTypes": ["smarttv"]
    },
    "creatives": [{
      "name": "Summer Sale 30s",
      "videoUrl": "https://cdn.example.com/video.mp4",
      "duration": 30,
      "clickUrl": "https://example.com/click"
    }],
    "pacing": {
      "type": "even"
    },
    "frequency": {
      "maxImpressions": 4,
      "windowHours": 24
    },
    "startDate": "2024-06-01T00:00:00Z"
  }'
```

### Get Pacing Status

```bash
curl http://localhost:4702/api/pacing/campaign-123
```

Response:

```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-123",
    "currentPacing": 45.2,
    "expectedPacing": 50,
    "dailyBudget": 1000,
    "dailySpent": 452,
    "dailyRemaining": 548,
    "pacingType": "even",
    "recommendations": []
  }
}
```

### Adjust Pacing

```bash
curl -X POST http://localhost:4702/api/pacing/campaign-123/pace \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "type": "increase",
    "percent": 20,
    "reason": "Good performance, increase budget"
  }'
```

## CTV Campaign Schema

```typescript
interface CTVCampaign {
  campaignId: string;
  advertiserId: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  format: 'preroll' | 'midroll' | 'postroll' | 'pod';
  budget: {
    daily: number;
    total: number;
    spent: number;
  };
  bid: {
    type: 'cpm' | 'cpv' | 'cpa';
    amount: number;
    maxBid: number;
  };
  targeting: {
    geo?: string[];
    deviceTypes?: string[];
    apps?: string[];
    contentCategories?: string[];
  };
  creatives: CTVCreative[];
  pacing: {
    type: 'even' | 'asap' | 'frontloaded';
    dailyPacingPercent?: number;
  };
  frequency: {
    maxImpressions: number;
    windowHours: number;
  };
  metrics: CTVMetrics;
  startDate: Date;
  endDate?: Date;
}
```

## Development

```bash
# Start in development mode with hot reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Project Structure

```
ctv-ad-server/
├── src/
│   ├── config/         # Configuration
│   ├── models/         # MongoDB models
│   ├── services/       # Business logic
│   ├── routes/         # API routes
│   ├── middleware/     # Express middleware
│   ├── types/          # TypeScript types & Zod schemas
│   ├── utils/          # Utilities
│   ├── tests/          # Test files
│   └── index.ts        # Entry point
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Metrics

Prometheus metrics available at `/metrics`:

- `ctv_ad_server_http_requests_total` - Total HTTP requests
- `ctv_ad_server_http_request_duration_seconds` - Request duration
- `ctv_ad_server_ad_requests_total` - Ad requests by placement
- `ctv_ad_server_ad_impressions_total` - Ad impressions
- `ctv_ad_server_ad_revenue_total` - Ad revenue
- `ctv_ad_server_active_campaigns` - Active campaign count
- `ctv_ad_server_ad_events_total` - Ad events by type
- `ctv_ad_server_vast_generations_total` - VAST generations

## License

Proprietary - REZ Ecosystem