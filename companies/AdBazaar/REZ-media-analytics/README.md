# REZ Media Analytics

Performance analytics service for all media services.

## Service Purpose

Central analytics engine for tracking, aggregating, and reporting advertising performance metrics across all REZ Media services. Provides real-time dashboards, campaign analytics, and business intelligence.

## Port

```
3007
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Platform analytics overview |
| GET | `/api/analytics/campaigns` | Campaign performance |
| GET | `/api/analytics/campaigns/:id` | Specific campaign analytics |
| GET | `/api/analytics/realtime` | Real-time metrics |
| GET | `/api/analytics/audiences` | Audience analytics |
| GET | `/api/analytics/attribution` | Attribution reports |
| GET | `/api/analytics/roi` | ROI analysis |
| POST | `/api/events/track` | Track analytics event |
| GET | `/api/reports` | Generate reports |
| GET | `/api/reports/:id` | Get report by ID |
| POST | `/api/reports/export` | Export report data |

## Configuration

Environment variables:

```env
PORT=3007
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez-media-analytics
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

## Setup Instructions

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build
npm start

# Run tests
npm run test:run
```

## Analytics Events

```typescript
interface AnalyticsEvent {
  eventType: 'impression' | 'click' | 'conversion' | 'video_view' | 'engagement';
  campaignId: string;
  adId: string;
  userId?: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'dooh';
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

## Tech Stack

- Express.js
- TypeScript
- Mongoose (MongoDB)
- Redis
- Winston (logging)
- Zod (validation)
- UUID (ID generation)
- Axios (HTTP client)
- CORS
- Helmet (security headers)
- Vitest (testing)
