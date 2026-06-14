# Mobile SSP SDK

Backend service for the AdBazaar Supply-Side Platform (SSP) mobile SDK that enables app publishers to integrate advertising into their mobile applications.

## Overview

The Mobile SSP SDK service provides a comprehensive backend for:
- SDK configuration management
- App publisher registration and authentication
- Ad request handling and fill optimization
- Impression and click tracking
- Publisher earnings reporting

## Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Cache:** Redis (ioredis)
- **Validation:** Zod
- **Authentication:** JWT
- **Monitoring:** Prometheus metrics

## Port

**Port: 4851**

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB
- Redis

### Installation

```bash
cd mobile-ssp-sdk
npm install
```

### Configuration

Create a `.env` file or set environment variables:

```bash
PORT=4851
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/mobile-ssp-sdk
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

### Running

```bash
# Development
npm run dev

# Production
npm run build
npm start

# Run tests
npm test
```

## API Endpoints

### Health Check

```
GET /health              - Basic health check
GET /health/detailed     - Detailed health with dependencies
GET /health/ready        - Readiness probe
GET /health/live        - Liveness probe
```

### SDK Configuration

```
GET /api/mobile/config/:appId   - Get SDK configuration for an app
```

### Authentication

```
POST /api/mobile/register       - Register new publisher
POST /api/mobile/login          - Login publisher
```

### Placement Management

```
GET  /api/mobile/placement/:placementId      - Get placement config
POST /api/mobile/placement                   - Create placement (auth)
GET  /api/mobile/placement/app/:appId       - Get placements by app
```

### Ad Serving

```
POST /api/mobile/ad-request    - Request ad for placement
```

### Tracking

```
POST /api/mobile/impression     - Track ad impression
POST /api/mobile/click          - Track ad click
```

### Publisher Dashboard

```
GET /api/mobile/publisher/:id/earnings   - Get publisher earnings
GET /api/mobile/publisher/profile         - Get publisher profile (auth)
PATCH /api/mobile/publisher/settings      - Update settings (auth)
```

### App Management

```
POST /api/mobile/apps           - Add new app (auth)
GET  /api/mobile/apps           - List publisher apps (auth)
```

### Metrics

```
GET /metrics                    - Prometheus metrics endpoint
```

## Data Models

### AppPublisher

```typescript
interface AppPublisher {
  publisherId: string;
  name: string;
  email: string;
  company?: string;
  apps: App[];
  settings: PublisherSettings;
  stats: PublisherStats;
  status: 'active' | 'pending' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}
```

### App

```typescript
interface App {
  appId: string;
  name: string;
  platform: 'ios' | 'android' | 'react-native' | 'flutter';
  bundleId: string;
  category: string;
  status: 'active' | 'pending' | 'suspended';
}
```

### Placement

```typescript
interface Placement {
  placementId: string;
  appId: string;
  name: string;
  adFormat: 'banner' | 'interstitial' | 'native' | 'rewarded' | 'app-open';
  width?: number;
  height?: number;
  position: 'top' | 'bottom' | 'center' | 'interstitial';
  refreshInterval: number;
  ecpm: number;
  status: 'active' | 'paused' | 'disabled';
  targeting?: PlacementTargeting;
}
```

## Ad Formats

| Format | Description | Typical Size |
|--------|-------------|--------------|
| banner | Standard banner ads | 320x50, 320x100 |
| interstitial | Full-screen ads between content | 320x480, 480x320 |
| native | Native content ads | Variable |
| rewarded | User opt-in video ads | 480x320 |
| app-open | Ads shown on app launch | Full screen |

## Platform Support

- iOS
- Android
- React Native
- Flutter

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| ssp_http_requests_total | Counter | Total HTTP requests |
| ssp_http_request_duration_seconds | Histogram | Request duration |
| ssp_ad_requests_total | Counter | Total ad requests |
| ssp_ad_fill_rate | Gauge | Ad fill rate |
| ssp_impressions_total | Counter | Total impressions |
| ssp_clicks_total | Counter | Total clicks |
| ssp_ctr | Gauge | Click-through rate |
| ssp_active_publishers | Gauge | Active publishers count |
| ssp_active_apps | Gauge | Active apps count |
| ssp_revenue_total | Counter | Total revenue |
| ssp_ad_response_time_seconds | Histogram | Ad response time |

## Error Handling

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

## Rate Limiting

- General API: 100 requests per minute per IP
- Ad requests: 100 requests per minute per app

## Authentication

The API uses JWT for authenticated endpoints. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Project Structure

```
mobile-ssp-sdk/
├── src/
│   ├── config/           # Configuration files
│   │   ├── index.ts
│   │   ├── database.ts
│   │   └── redis.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── metrics.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── models/          # MongoDB models
│   │   ├── AppPublisher.ts
│   │   ├── Placement.ts
│   │   ├── AdRequest.ts
│   │   ├── Impression.ts
│   │   └── Click.ts
│   ├── routes/          # Express routes
│   │   ├── mobileRoutes.ts
│   │   └── healthRoutes.ts
│   ├── services/         # Business logic
│   │   ├── publisherService.ts
│   │   ├── placementService.ts
│   │   ├── adRequestService.ts
│   │   ├── trackingService.ts
│   │   └── sdkConfigService.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── tests/            # Test files
│   │   ├── mocks.ts
│   │   ├── validation.test.ts
│   │   └── types.test.ts
│   └── index.ts          # Entry point
├── package.json
├── tsconfig.json
├── jest.config.js
├── .env.example
└── README.md
```

## License

MIT

## Company

**AdBazaar** - Marketing + DOOH + Creator Economy Platform