# Follower Growth Tracker

Track and analyze follower growth for Instagram accounts. Part of the AdBazaar ecosystem.

## Overview

This service provides comprehensive follower analytics including:
- Daily/Weekly/Monthly growth tracking
- Follower source breakdown
- Engagement correlation analysis
- Growth predictions using ML
- Milestone alerts
- Competitor comparison
- Unfollow tracking

## Quick Start

```bash
# Install dependencies
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/follower-growth-tracker
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Or build and run production
npm run build
npm start
```

## Health Check

```bash
curl http://localhost:5093/health
```

## Configuration

Create a `.env` file with:

```env
# Instagram API Configuration
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id_here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/follower_growth_tracker

# Service Configuration
PORT=5093
NODE_ENV=development

# Logging
LOG_LEVEL=info

# Internal Service Token
INTERNAL_SERVICE_TOKEN=your_internal_service_token_here
```

## API Endpoints

### Growth Data
- `GET /api/growth/:accountId` - Get overall growth data
- `GET /api/growth/:accountId/daily` - Daily snapshots
- `GET /api/growth/:accountId/weekly` - Weekly summary
- `GET /api/growth/:accountId/monthly` - Monthly summary

### Analytics
- `GET /api/growth/:accountId/analytics` - Deep analysis
- `GET /api/growth/:accountId/predictions` - Growth predictions
- `GET /api/growth/:accountId/sources` - Follower source breakdown
- `GET /api/growth/:accountId/engagement` - Engagement correlation

### Monitoring
- `GET /api/growth/:accountId/churn` - Unfollow tracking
- `POST /api/growth/:accountId/alerts` - Set milestone alerts
- `GET /api/growth/:accountId/alerts` - Get milestone alerts

### Competitor
- `GET /api/growth/:accountId/compare` - Competitor comparison

### Admin
- `POST /api/sync` - Sync from Instagram API
- `POST /api/snapshot` - Create manual snapshot
- `POST /api/unfollow` - Record unfollow event
- `POST /api/competitor` - Add competitor
- `GET /api/profile/:accountId` - Get Instagram profile

## Authentication

All API endpoints require authentication via:
- `X-Internal-Token` header (for internal services)
- `Authorization: Bearer <token>` header (for external clients)

## Metrics

Prometheus metrics available at `/metrics`:
- `http_request_duration_seconds`
- `http_requests_total`
- `follower_growth_current`
- `follower_change_daily`
- `growth_rate_percentage`
- `unfollow_events_total`
- `milestone_reached_total`

## Data Models

### FollowerSnapshot
```typescript
{
  accountId: string;
  date: Date;
  followers: number;
  following: number;
  posts: number;
  change: number;
  changePercentage: number;
  sources: { hashtag, explore, profile, suggested, other };
}
```

### GrowthAnalysis
```typescript
{
  accountId: string;
  period: 'day' | 'week' | 'month' | 'year';
  startFollowers: number;
  endFollowers: number;
  netGrowth: number;
  growthRate: number;
  engagementCorrelation: number;
  predictions: { nextWeek, nextMonth };
  insights: string[];
}
```

### MilestoneAlert
```typescript
{
  id: string;
  accountId: string;
  milestone: number;
  reached: boolean;
  reachedAt?: Date;
  notified: boolean;
}
```

## Features

1. **Growth Tracking** - Daily snapshots with change calculations
2. **Source Analysis** - Track where followers come from
3. **Predictions** - ML-based growth forecasting
4. **Milestones** - Alert at 1K, 10K, 100K followers
5. **Competitor Tracking** - Compare with competitors
6. **Churn Analysis** - Track unfollows and retention
7. **Engagement Correlation** - Link engagement to growth

## Project Structure

```
follower-growth-tracker/
├── src/
│   ├── config/
│   │   ├── index.ts          # Configuration
│   │   └── database.ts       # Database connection
│   ├── routes/
│   │   ├── growthRoutes.ts   # Growth API routes
│   │   └── adminRoutes.ts    # Admin API routes
│   ├── services/
│   │   ├── instagramService.ts  # Instagram API
│   │   └── growthService.ts    # Business logic
│   ├── models/
│   │   ├── followerSnapshot.ts
│   │   ├── growthAnalysis.ts
│   │   ├── milestoneAlert.ts
│   │   ├── unfollowEvent.ts
│   │   └── competitor.ts
│   ├── middleware/
│   │   ├── auth.ts           # Authentication
│   │   ├── errorHandler.ts  # Error handling
│   │   └── metricsMiddleware.ts
│   ├── utils/
│   │   ├── logger.ts        # Winston logger
│   │   └── metrics.ts       # Prometheus metrics
│   └── index.ts             # App entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## Version

1.0.0