# Instagram Insights Service

Deep analytics from Instagram Insights API for AdBazaar marketing platform.

**Port:** 5082

## Overview

This service provides comprehensive Instagram analytics by integrating with the Instagram Graph API. It fetches, stores, and serves insights data including account metrics, content performance, audience demographics, stories, reels, and hashtag analytics.

## Features

- **Account Insights:** Followers, reach, impressions, profile views, engagement metrics
- **Content Insights:** Likes, comments, saves, shares, reach, engagement rate per post
- **Audience Insights:** Demographics, location, age/gender split, active times
- **Story Analytics:** Impressions, reach, replies, exits, sticker interactions
- **Reels Performance:** Plays, views, watch time, engagement metrics
- **Hashtag Analytics:** Reach and usage tracking
- **Best Posting Times:** AI-calculated optimal posting schedules
- **Dashboard Summary:** Consolidated metrics view
- **Export:** JSON/CSV export capabilities

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Monitoring:** Prometheus metrics
- **Logging:** Winston

## Quick Start

### Prerequisites

1. MongoDB running on localhost:27017
2. Instagram Business Account
3. Facebook Developer App with Instagram Graph API access
4. Long-lived access token

### Installation

```bash
cd instagram-insights-service
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_account_id
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=instagram_insights
```

### Run Development

```bash
npm run dev
```

### Run Production

```bash
npm run build
npm start
```

## API Endpoints

### Health& Metrics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/metrics` | GET | Prometheus metrics |

### Insights API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/insights/account` | GET | Account-level insights |
| `/api/insights/account/refresh` | POST | Refresh from Instagram API |
| `/api/insights/content/:id` | GET | Single content insights |
| `/api/insights/content` | GET | All content insights |
| `/api/insights/content/sync` | POST | Sync all content |
| `/api/insights/audience` | GET | Audience demographics |
| `/api/insights/audience/active` | GET | Active times |
| `/api/insights/stories` | GET | Story insights |
| `/api/insights/reels` | GET | Reels performance |
| `/api/insights/hashtags` | GET | Hashtag performance |
| `/api/insights/best-times` | GET | Optimal posting times |
| `/api/insights/export` | POST | Export report |
| `/api/insights/dashboard` | GET | Dashboard summary |

## Authentication

All API endpoints require authentication via API key:

```bash
curl -H "X-API-Key: your_api_key" http://localhost:5082/api/insights/account
```

## Data Models

### AccountInsights

```typescript
{
  accountId: string;
  date: Date;
  followers: {
    total: number;
    change: number;
    byGender: { male: number; female: number };
    byAge: { [key: string]: number };
    byLocation: { [city: string]: number };
  };
  reach: number;
  impressions: number;
  profileViews: number;
  websiteClicks: number;
  emailContacts: number;
  engagement: number;
}
```

### ContentInsights

```typescript
{
  contentId: string;
  date: Date;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  watchTime?: number;
  interactions?: number;
}
```

### AudienceInsights

```typescript
{
  accountId: string;
  topLocations: { city: string; percentage: number }[];
  ageRanges: { range: string; male: number; female: number }[];
  genderSplit: { male: number; female: number };
  activeHours: number[];
  activeDays: string[];
  followerGrowth: { date: Date; count: number }[];
}
```

## Example Requests

### Get Account Insights

```bash
curl -X GET "http://localhost:5082/api/insights/account?days=7" \
  -H "X-API-Key: your_api_key"
```

### Get Content Insights

```bash
curl -X GET "http://localhost:5082/api/insights/content?limit=20&mediaType=REELS" \
  -H "X-API-Key: your_api_key"
```

### Get Dashboard Summary

```bash
curl -X GET "http://localhost:5082/api/insights/dashboard?days=30" \
  -H "X-API-Key: your_api_key"
```

### Export Report

```bash
curl -X POST "http://localhost:5082/api/insights/export" \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "account",
    "format": "csv",
    "days": 30
  }'
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "count": 10,
    "timestamp": "2026-06-08T10:00:00.000Z"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  },
  "meta": {
    "timestamp": "2026-06-08T10:00:00.000Z"
  }
}
```

## Monitoring

### Prometheus Metrics

Access metrics at `/metrics`:

- `http_request_duration_seconds` - Request latency histogram
- `http_requests_total` - Total requests counter
- `instagram_api_calls_total` - Instagram API calls
- `insights_cache_hits_total` - Cache hits
- `insights_cache_misses_total` - Cache misses

### Health Check

```bash
curl http://localhost:5082/health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2026-06-08T10:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "services": {
    "mongodb": "connected",
    "instagram_api": "healthy"
  }
}
```

## Directory Structure

```
instagram-insights-service/
├── src/
│   ├── config/          # Configuration files
│   │   ├── app.ts        # App configuration
│   │   ├── database.ts   # MongoDB connection
│   │   └── logger.ts     # Winston logger
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # API key authentication
│   │   └── errorHandler.ts
│   ├── models/           # Mongoose models
│   │   ├── AccountInsights.ts
│   │   ├── ContentInsights.ts
│   │   ├── AudienceInsights.ts
│   │   ├── StoryInsights.ts
│   │   ├── ReelsInsights.ts
│   │   └── HashtagInsights.ts
│   ├── routes/           # API routes
│   │   └── insights.ts
│   ├── services/         # Business logic
│   │   ├── instagramApi.ts
│   │   └── insightsService.ts
│   └── index.ts          # Entry point
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Instagram API Setup

1. Create a Facebook Developer App
2. Add Instagram Graph API product
3. Configure Instagram Business Account
4. Generate long-lived access token
5. Set permissions: `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`, `pages_read_engagement`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Your Instagram Business Account ID | Yes |
| `INSTAGRAM_ACCESS_TOKEN` | Long-lived Facebook access token | Yes |
| `MONGODB_HOST` | MongoDB host | No |
| `MONGODB_PORT` | MongoDB port | No |
| `MONGODB_DATABASE` | Database name | No |
| `PORT` | Service port | No |
| `LOG_LEVEL` | Logging level | No |

## License

Proprietary - AdBazaar
