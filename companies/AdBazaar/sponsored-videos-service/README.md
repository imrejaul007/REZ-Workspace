# Sponsored Videos Service

**Port:** 4992

AdBazaar's Sponsored Videos Service is a comprehensive video ad serving platform that enables advertisers to upload, manage, and optimize video advertisements with sponsor integration, campaign management, and detailed analytics.

## Features

### Video Management
- Upload and manage video metadata (title, description, URL, duration, thumbnail)
- Support for multiple video formats (mp4, webm, mov, avi, mkv)
- Video status management (draft, active, paused, archived)
- Visibility controls (public, private, unlisted)
- Category and tag-based organization

### Sponsor Integration
- Multiple sponsor placements per video (pre-roll, mid-roll, post-roll, overlay, banner)
- Flexible bidding models (CPM, CPC, CPV)
- Sponsor status tracking (active, paused, completed, rejected)
- Impression and click tracking
- CTR and effective CPC calculations

### Campaign Management
- Create and manage video ad campaigns
- Advanced targeting options:
  - Demographics (age range, gender, location, interests)
  - Device targeting (mobile, tablet, desktop, TV, smartwatch)
  - Platform targeting (iOS, Android, Web, tvOS, Roku, FireTV)
  - Time slot targeting
  - Custom rules
- Budget management with daily limits
- Campaign scheduling with start/end dates
- Priority-based campaign ordering
- Automatic campaign pausing when budget exhausted

### Video Analytics
- View tracking (total views, unique views)
- Watch time metrics (total, average, completion rate)
- Engagement tracking (likes, comments, shares, saves)
- CTR analysis (impressions, clicks, rate)
- Retention analysis with drop-off points
- Device and geographic breakdowns
- Daily/date-range aggregations
- Platform-wide analytics

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Sponsored Videos Service                      │
├─────────────────────────────────────────────────────────────────┤
│  Express.js + TypeScript + MongoDB + Redis                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Routes     │  │  Middleware  │  │   Services   │          │
│  │  - Videos    │  │  - Auth      │  │  - Video     │          │
│  │  - Sponsors  │  │  - Validate  │  │  - Sponsor   │          │
│  │  - Campaigns │  │  - Metrics   │  │  - Campaign  │          │
│  │  - Analytics │  │  - Logging   │  │  - Analytics │          │
│  │  - Targeting │  │              │  │  - Targeting │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Models (Mongoose)                      │   │
│  │  Video │ Sponsor │ VideoCampaign │ VideoAnalytics         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js with TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Cache:** Redis
- **Validation:** Zod
- **Logging:** Winston
- **Metrics:** Prometheus (prom-client)
- **Utilities:** UUID, Axios

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (running on localhost:27017)
- Redis (optional, for caching)

### Installation

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/sponsored-videos-service

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start development server
npm run dev

# Or start production server
npm start
```

### Environment Variables

```bash
# Server
PORT=4992
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/sponsored_videos

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Auth
INTERNAL_SERVICE_TOKEN=sponsored-videos-service-token

# Metrics
METRICS_ENABLED=true
LOG_LEVEL=info
```

## API Endpoints

### Health Check

```bash
GET /health
```

Returns service health status and dependency connectivity.

### Metrics

```bash
GET /metrics
```

Returns Prometheus metrics.

### Videos

```bash
# Create video
POST /api/videos
Content-Type: application/json
X-Internal-Token: sponsored-videos-service-token

{
  "title": "Summer Sale 2026",
  "description": "Amazing deals on summer collection",
  "url": "https://cdn.example.com/videos/summer-sale.mp4",
  "thumbnail": "https://cdn.example.com/thumbnails/summer-sale.jpg",
  "duration": 30,
  "format": "mp4",
  "resolution": "1080p",
  "visibility": "public",
  "category": "shopping",
  "tags": ["sale", "fashion", "summer"],
  "createdBy": "user_123"
}

# List videos
GET /api/videos?page=1&limit=20&status=active&category=shopping

# Get video
GET /api/videos/:id

# Update video
PUT /api/videos/:id
{
  "title": "Updated Title",
  "status": "active"
}

# Delete video (archive)
DELETE /api/videos/:id
```

### Sponsors

```bash
# Add sponsor to video
POST /api/videos/:id/sponsor
{
  "advertiserId": "adv_456",
  "placement": "pre_roll",
  "bid": {
    "amount": 15,
    "currency": "INR",
    "type": "cpm"
  },
  "startDate": "2026-06-01T00:00:00Z",
  "endDate": "2026-07-01T00:00:00Z"
}

# List sponsors for video
GET /api/videos/:id/sponsors?status=active&placement=pre_roll
```

### Campaigns

```bash
# Create campaign
POST /api/campaigns
{
  "name": "Summer Sale Campaign",
  "advertiserId": "adv_456",
  "videoId": "video_789",
  "targeting": {
    "demographics": {
      "ageRange": { "min": 18, "max": 45 },
      "gender": ["male", "female"],
      "location": ["Mumbai", "Delhi", "Bangalore"],
      "interests": ["shopping", "fashion"]
    },
    "devices": ["mobile", "tablet"],
    "platforms": ["android", "ios"],
    "timeSlots": [
      { "start": "09:00", "end": "12:00" },
      { "start": "18:00", "end": "22:00" }
    ]
  },
  "budget": {
    "total": 100000,
    "daily": 5000,
    "currency": "INR"
  },
  "schedule": {
    "startDate": "2026-06-01T00:00:00Z",
    "endDate": "2026-07-31T23:59:59Z"
  },
  "priority": 8
}

# Get campaign
GET /api/campaigns/:id

# Get campaign performance
GET /api/campaigns/:id/performance

# Set campaign targeting
POST /api/campaigns/:id/target
{
  "demographics": {
    "ageRange": { "min": 25, "max": 40 }
  },
  "devices": ["mobile"]
}

# Get campaign analytics
GET /api/campaigns/:id/analytics

# Update campaign status
PUT /api/campaigns/:id/status
{ "status": "active" }
```

### Analytics

```bash
# Get view analytics
GET /api/analytics/views?videoId=video_123&startDate=2026-06-01&endDate=2026-06-30

# Get engagement metrics
GET /api/analytics/engagement?videoId=video_123

# Record video view
POST /api/analytics/views
{
  "videoId": "video_123",
  "views": 1,
  "uniqueViews": 1,
  "source": "website",
  "device": "mobile",
  "geo": "Mumbai",
  "watchTime": 25,
  "campaignId": "campaign_789"
}

# Record engagement
POST /api/analytics/engagement
{
  "videoId": "video_123",
  "type": "like"
}

# Get video analytics summary
GET /api/analytics/video/:id

# Get retention analysis
GET /api/analytics/retention/:videoId

# Get platform analytics
GET /api/analytics/platform
```

### Targeting

```bash
# Validate targeting configuration
POST /api/targeting/validate
{
  "demographics": {
    "ageRange": { "min": 18, "max": 35 }
  },
  "devices": ["mobile", "desktop"],
  "platforms": ["android", "ios", "web"]
}

# Estimate audience size
POST /api/targeting/estimate
{
  "demographics": {
    "ageRange": { "min": 18, "max": 45 },
    "location": ["Mumbai", "Delhi"]
  },
  "devices": ["mobile"],
  "platforms": ["android"]
}

# Check targeting match
POST /api/targeting/match
{
  "campaignId": "campaign_789",
  "userData": {
    "age": 28,
    "gender": "female",
    "location": "Mumbai",
    "interests": ["fashion", "shopping"],
    "device": "mobile",
    "platform": "android"
  }
}
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_1234567890",
    "timestamp": "2026-06-07T12:00:00.000Z"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [...]
  },
  "meta": {
    "requestId": "req_1234567890",
    "timestamp": "2026-06-07T12:00:00.000Z"
  }
}
```

## Authentication

All API endpoints (except `/health` and `/metrics`) require internal service authentication:

```
X-Internal-Token: sponsored-videos-service-token
X-Service-Id: calling-service-name
```

## Metrics

The service exposes Prometheus metrics at `/metrics`:

- `sponsored_videos_http_requests_total` - Total HTTP requests
- `sponsored_videos_http_request_duration_seconds` - Request duration
- `sponsored_videos_created_total` - Videos created
- `sponsored_videos_active` - Active videos count
- `sponsored_videos_sponsors_total` - Sponsors added
- `sponsored_videos_sponsor_impressions_total` - Sponsor impressions
- `sponsored_videos_sponsor_clicks_total` - Sponsor clicks
- `sponsored_videos_campaigns_total` - Campaigns created
- `sponsored_videos_campaigns_active` - Active campaigns
- `sponsored_videos_campaign_budget_spent_total` - Budget spent
- `sponsored_videos_views_total` - Total views
- `sponsored_videos_watch_time_seconds_total` - Total watch time
- `sponsored_videos_engagement_total` - Engagement actions

## Health Check

```bash
curl http://localhost:4992/health
```

Response:

```json
{
  "status": "healthy",
  "service": "sponsored-videos-service",
  "version": "1.0.0",
  "port": 4992,
  "timestamp": "2026-06-07T12:00:00.000Z",
  "dependencies": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

## Project Structure

```
sponsored-videos-service/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts              # Main entry point
    ├── config/
    │   └── index.ts          # Configuration
    ├── models/
    │   ├── Video.ts          # Video schema
    │   ├── Sponsor.ts        # Sponsor schema
    │   ├── VideoCampaign.ts  # Campaign schema
    │   ├── VideoAnalytics.ts # Analytics schema
    │   └── index.ts
    ├── services/
    │   ├── videoService.ts   # Video business logic
    │   ├── sponsorService.ts # Sponsor business logic
    │   ├── campaignService.ts# Campaign business logic
    │   ├── analyticsService.ts# Analytics business logic
    │   ├── targetingService.ts# Targeting business logic
    │   └── index.ts
    ├── middleware/
    │   ├── auth.ts           # Authentication
    │   ├── validation.ts     # Zod validation
    │   └── index.ts
    ├── utils/
    │   ├── logger.ts         # Winston logger
    │   └── metrics.ts        # Prometheus metrics
    └── types/
        └── index.ts          # TypeScript types
```

## Testing

```bash
# Run tests
npm test

# With coverage
npm run test:coverage
```

## License

Internal AdBazaar Service