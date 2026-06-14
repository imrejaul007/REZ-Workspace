# UGC Management Service

**Port:** 5101  
**Company:** AdBazaar  
**Purpose:** User Generated Content collection and management

## Overview

The UGC Management Service handles the complete lifecycle of user-generated content collection, moderation, rights management, and display across social media platforms.

## Features

- **Multi-Platform Collection:** Collect UGC from Instagram, Twitter/X, Facebook, and TikTok via hashtag and mention-based search
- **Content Moderation:** Auto-moderation with configurable rules (followers, hashtags, sentiment)
- **Rights Management:** Request, grant, and track content licensing rights
- **Display Generation:** Generate embed codes for UGC walls, tickers, grids, and carousels
- **Campaign Management:** Create and manage UGC campaigns with full analytics

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Language:** TypeScript
- **Validation:** Zod
- **Logging:** Winston
- **Metrics:** Prometheus (prom-client)

## Quick Start

```bash
# Install dependencies
cd ugc-management-service
npm install

# Copy environment file
cp .env.example .env

# Start in development
npm run dev

# Build for production
npm run build
npm start
```

## Environment Variables

```env
PORT=5101
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ugc_management
LOG_LEVEL=info

# Platform API Credentials
INSTAGRAM_ACCESS_TOKEN=your_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_id
TWITTER_BEARER_TOKEN=your_token
FACEBOOK_ACCESS_TOKEN=your_token
TIKTOK_ACCESS_TOKEN=your_token

# Internal Services
INTERNAL_SERVICE_TOKEN=your_token
REZ_AUTH_SERVICE_URL=http://localhost:4002
REZ_NOTIFICATION_SERVICE_URL=http://localhost:4011
```

## API Endpoints

### UGC Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ugc/collect` | Collect UGC from platforms |
| POST | `/api/ugc/moderate` | Bulk moderate content |
| POST | `/api/ugc/approve` | Approve UGC content |
| POST | `/api/ugc/reject` | Reject UGC content |
| GET | `/api/ugc/approved` | List approved UGC |
| GET | `/api/ugc/pending` | List pending UGC |
| GET | `/api/ugc/:id` | Get single UGC |
| DELETE | `/api/ugc/:id` | Delete UGC |

### Rights Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ugc/rights` | Request rights |
| POST | `/api/ugc/rights/:id/respond` | Respond to rights request |
| GET | `/api/ugc/rights` | List all rights |

### Display

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ugc/display` | Generate display embed |
| GET | `/api/ugc/embed/:campaignId` | Get embed HTML |
| GET | `/api/ugc/feed/:campaignId` | Get JSON feed |

### Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ugc/campaigns` | List campaigns |
| POST | `/api/ugc/campaigns` | Create campaign |
| GET | `/api/ugc/campaigns/:id` | Get campaign |
| PATCH | `/api/ugc/campaigns/:id` | Update campaign |
| GET | `/api/ugc/campaigns/:id/stats` | Campaign stats |
| POST | `/api/ugc/campaigns/:id/pause` | Pause campaign |
| POST | `/api/ugc/campaigns/:id/resume` | Resume campaign |
| POST | `/api/ugc/campaigns/:id/complete` | Complete campaign |
| DELETE | `/api/ugc/campaigns/:id` | Delete campaign |

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/metrics` | Prometheus metrics |

## Data Models

### UGCContent

```typescript
{
  platform: 'instagram' | 'twitter' | 'facebook' | 'tiktok',
  originalUrl: string,
  mediaUrl: string,
  mediaType: 'image' | 'video',
  caption: string,
  author: {
    platformUserId: string,
    username: string,
    displayName: string,
    followerCount: number,
    profileImage?: string
  },
  hashtags: string[],
  engagement: { likes: number, comments: number, shares: number },
  campaignId?: string,
  status: 'collected' | 'pending_review' | 'approved' | 'rejected' | 'displayed',
  rightsStatus: 'none' | 'requested' | 'granted' | 'denied'
}
```

### UGCCampaign

```typescript
{
  name: string,
  brandId: string,
  hashtags: string[],
  mentions: string[],
  startDate: Date,
  endDate: Date,
  status: 'active' | 'paused' | 'completed',
  autoModeration: boolean,
  moderationRules: { minFollowers, excludeHashtags, ... },
  displaySettings: { autoDisplay, displayDuration, rotationSpeed },
  stats: { collected, approved, displayed, rightsGranted }
}
```

### UGCRights

```typescript
{
  ugcId: string,
  requestedBy: string,
  status: 'pending' | 'approved' | 'denied' | 'expired',
  rightsType: 'display' | 'repost' | 'commercial' | 'all',
  usageTerms?: string,
  expiresAt?: Date
}
```

## Authentication

The service supports two authentication methods:

1. **Internal Token:** For service-to-service communication
   - Header: `X-Internal-Token: <token>`

2. **User Auth:** For user-facing operations
   - Header: `Authorization: Bearer <jwt_token>`

## Monitoring

### Prometheus Metrics

- `http_request_duration_seconds` - Request duration histogram
- `http_requests_total` - Total requests counter
- `ugc_content_total` - Content items by status/platform
- `ugc_campaigns_active` - Active campaigns gauge
- `ugc_rights_pending` - Pending rights requests gauge

### Health Checks

```bash
# Health check
curl http://localhost:5101/health

# Readiness check
curl http://localhost:5101/ready

# Metrics
curl http://localhost:5101/metrics
```

## Project Structure

```
ugc-management-service/
├── src/
│   ├── config/           # Configuration (database, logger, config)
│   ├── models/           # Mongoose models (UGCContent, UGCCampaign, UGCRights)
│   ├── services/         # Business logic
│   │   ├── ugcCollector.ts
│   │   ├── moderationService.ts
│   │   ├── rightsService.ts
│   │   ├── campaignService.ts
│   │   └── displayService.ts
│   ├── routes/           # Express routes
│   ├── middleware/       # Auth, error handling, metrics
│   ├── utils/            # Helper functions
│   └── index.ts          # Entry point
├── .env.example
├── package.json
└── tsconfig.json
```

## License

Internal - AdBazaar
