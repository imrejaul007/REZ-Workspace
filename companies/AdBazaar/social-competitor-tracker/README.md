# Social Competitor Tracker

Track competitor social media activity across multiple platforms.

## Overview

This service provides comprehensive competitor tracking for social media platforms including Instagram, Facebook, Twitter, LinkedIn, YouTube, and TikTok.

## Features

- **Competitor Management**: Add, update, and track multiple competitors
- **Platform Tracking**: Monitor multiple social media platforms per competitor
- **Daily Snapshots**: Track follower changes, engagement metrics over time
- **Content Analysis**: Analyze competitor posts and content performance
- **Engagement Metrics**: Track likes, comments, shares, and engagement rates
- **Growth Tracking**: Monitor follower growth trends
- **Industry Benchmarks**: Compare against industry averages
- **Alert System**: Get notified of competitor activity (new posts, viral content)
- **Strategy Insights**: AI-powered recommendations based on competitor analysis
- **Best Content Identification**: Discover top-performing content types

## Quick Start

```bash
# Install dependencies
cd social-competitor-tracker
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Run in production
npm run build
npm start
```

## Health Check

```bash
curl http://localhost:5105/health
```

## Metrics

```bash
curl http://localhost:5105/metrics
```

## API Endpoints

### Competitor Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/competitors` | List all competitors |
| POST | `/api/competitors` | Add a new competitor |
| PATCH | `/api/competitors/:id` | Update competitor |
| DELETE | `/api/competitors/:id` | Remove competitor |
| GET | `/api/competitors/:id/overview` | Get competitor overview |
| POST | `/api/competitors/:id/sync` | Force sync competitor data |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/competitors/:id/content` | Get competitor content |
| GET | `/api/competitors/:id/engagement` | Get engagement metrics |
| GET | `/api/competitors/:id/growth` | Get follower growth |
| GET | `/api/competitors/:id/posts` | Get recent posts |
| GET | `/api/competitors/compare` | Compare competitors |
| GET | `/api/competitors/benchmarks` | Get industry benchmarks |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/competitors/alerts` | Get all alerts |
| GET | `/api/competitors/:id/alerts` | Get competitor alerts |
| POST | `/api/competitors/alerts/mark-read` | Mark alerts as read |

### Insights

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/insights/best-content` | Best performing content |
| GET | `/api/insights/strategy` | Strategy insights |
| GET | `/api/insights/competitor/:id` | Competitor SWOT analysis |
| GET | `/api/insights/trends` | Overall trends |
| GET | `/api/insights/content-analysis` | Content analysis |

## Data Models

### Competitor

```typescript
{
  name: string;
  industry: string;
  platforms: [{
    platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';
    handle: string;
    accountId?: string;
    linked: boolean;
    lastSync?: Date;
  }];
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  addedBy: string;
}
```

### CompetitorSnapshot

Daily metrics snapshot for tracking changes over time.

### CompetitorPost

Individual posts from competitors with engagement metrics.

### BenchmarkData

Industry benchmarks for comparison.

## Authentication

All API endpoints (except `/health` and `/metrics`) require authentication via Bearer token:

```
Authorization: Bearer <INTERNAL_SERVICE_TOKEN>
```

## Environment Variables

See `.env.example` for all configuration options.

## Port

**Port: 5105**

## Tech Stack

- Express.js
- MongoDB (Mongoose)
- TypeScript
- Winston (Logging)
- Prometheus (Metrics)
- Zod (Validation)

## Related Services

- AdBazaar Dashboard
- AdBazaar Analytics
- AdBazaar Creator Platform
