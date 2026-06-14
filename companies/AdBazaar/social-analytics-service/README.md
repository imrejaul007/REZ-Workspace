# Social Analytics Service

Social media analytics and insights across multiple platforms.

## Features

- Platform-specific analytics (Facebook, Instagram, Twitter, LinkedIn, YouTube, TikTok)
- Overview dashboard with key metrics
- Platform comparison
- Time series data
- Top performing posts
- Engagement rate tracking

## Quick Start

```bash
cd social-analytics-service
npm install
npm run dev
```

## Environment Variables

```env
PORT=5051
MONGODB_URI=mongodb://localhost:27017/social-analytics-service
REDIS_URL=redis://localhost:6379
```

## API Endpoints

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/overview | Get overall analytics |
| GET | /api/analytics/:platform | Get platform-specific analytics |
| GET | /api/analytics/compare/platforms | Compare multiple platforms |
| GET | /api/analytics/timeseries/:granularity | Get time series data |
| GET | /api/analytics/posts/top | Get top performing posts |
| POST | /api/analytics/record | Record post analytics |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard | Get dashboard data |
| GET | /api/dashboard/:platform | Get platform-specific dashboard |

## Health Check

```bash
curl http://localhost:5051/health
```

## Metrics

```bash
curl http://localhost:5051/metrics
```