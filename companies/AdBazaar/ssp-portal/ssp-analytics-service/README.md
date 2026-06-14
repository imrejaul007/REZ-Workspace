# SSP Analytics Service

DOOH (Digital Out of Home) Advertising Analytics Service for AdBazaar Supply Side Platform.

## Overview

This service provides comprehensive analytics tracking and reporting for digital out-of-home advertising campaigns across screens, advertisers, and campaigns.

## Features

- **Event Tracking**: Track impressions, views, clicks, and engagements
- **Batch Processing**: Support for bulk event ingestion
- **Real-time Analytics**: Overview statistics and trends
- **Screen Analytics**: Per-screen performance metrics
- **Campaign Analytics**: Campaign-level performance tracking
- **Advertiser Analytics**: Advertiser-level insights
- **Engagement Metrics**: View rates, click rates, engagement rates
- **Performance Dashboard**: Hourly and venue-based performance
- **Data Cleanup**: Automatic retention policy management

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Health Checks
- `GET /health` - Service health status
- `GET /ready` - Readiness check

### Event Tracking
- `POST /api/analytics/events` - Track single event
- `POST /api/analytics/events/batch` - Track multiple events
- `GET /api/analytics/events` - List events with filters
- `DELETE /api/analytics/events/cleanup` - Cleanup old events

### Statistics
- `GET /api/analytics/stats/overview` - Overview statistics
- `GET /api/analytics/stats/screen/:screenId` - Screen analytics
- `GET /api/analytics/stats/campaign/:campaignId` - Campaign analytics
- `GET /api/analytics/stats/advertiser/:advertiserId` - Advertiser analytics
- `GET /api/analytics/stats/impressions/daily` - Daily impressions
- `GET /api/analytics/stats/engagement/rate` - Engagement rates
- `GET /api/analytics/stats/performance` - Performance metrics

## Event Types

| Type | Description |
|------|-------------|
| `impression` | Ad was displayed on screen |
| `view` | User viewed the ad |
| `click` | User clicked on the ad |
| `engagement` | User engaged with the ad |

## Example Event Payload

```json
{
  "eventType": "impression",
  "screenId": "screen_001",
  "advertiserId": "adv_001",
  "campaignId": "camp_001",
  "creativeId": "cre_001",
  "timestamp": "2026-06-06T10:00:00Z",
  "metadata": {
    "duration": 5000,
    "viewTime": 3.5,
    "deviceType": "digital-signage",
    "visibilityPercentage": 100,
    "contextData": {
      "venueType": "mall",
      "dayOfWeek": "Saturday"
    }
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 4525 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/ssp_analytics |
| `LOG_LEVEL` | Logging level | info |

## License

MIT