# Conference Graph Service

**AdBazaar Conference Graph - Event intelligence for conferences and business events**

Port: **4884**

## Overview

The Conference Graph Service is AdBazaar's centralized platform for managing conference data, speaker information, session scheduling, and analytics. It provides comprehensive event intelligence that powers targeted advertising and marketing campaigns for business events.

## Features

- **Conference Management** - Register, update, and manage conferences with full venue, organizer, and sponsor details
- **Speaker Management** - Track speakers with social media followers, expertise, and ratings
- **Session Scheduling** - Manage conference sessions with rooms, times, and capacity tracking
- **Analytics** - Track impressions, registrations, attendance, and engagement metrics
- **Ad Targeting** - Get targeted audience data for conference-related advertising campaigns
- **Cross-Conference Intelligence** - Compare performance across multiple events

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONFERENCE GRAPH SERVICE                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Express │  │   Routes │  │ Middleware │ │
│  │ Server   │  │             │  │   (Auth)    │             │
│  │   (4884)   │  │             │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│ │                │                │                      │
│         ▼ ▼                ▼                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    SERVICES LAYER                       │    │
│  │  Conference │ Speaker │ Session │ Analytics │ Targeting│    │
│  └─────────────────────────────────────────────────────────┘    │
│         │                │                │                      │
│         ▼                ▼                ▼                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    DATA LAYER                            │    │
│  │  Conference │ Speaker │ Session │ ConferenceAnalytics   │    │
│  │                 (MongoDB)                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│ │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 CACHE LAYER (Redis)                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js with TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Cache:** Redis with ioredis
- **Logging:** Winston with file rotation
- **Metrics:** Prometheus client (prom-client)
- **Validation:** Zod schema validation
- **HTTP Client:** Axios

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6.0+
- Redis7.0+ (optional, for caching)

### Installation

```bash
cd conference-graph-service
npm install
```

### Configuration

Create a `.env` file:

```env
PORT=4884
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/conference-graph
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_TOKEN=your-service-token
CORS_ORIGIN=*
LOG_LEVEL=info
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

## API Reference

### Health& Monitoring

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with MongoDB and Redis status |
| `/ready` | GET | Readiness probe |
| `/metrics` | GET | Prometheus metrics |

### Conferences

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conferences` | POST | Register a new conference |
| `/api/conferences` | GET | List conferences with filters |
| `/api/conferences/:id` | GET | Get conference by ID |
| `/api/conferences/:id` | PUT | Update conference |
| `/api/conferences/:id` | DELETE | Delete conference |
| `/api/conferences/upcoming` | GET | Get upcoming conferences |

### Speakers

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conferences/:id/speakers` | POST | Add speaker to conference |
| `/api/conferences/:id/speakers` | GET | List speakers for conference |

### Sessions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conferences/:id/sessions` | POST | Add session to conference |
| `/api/conferences/:id/sessions` | GET | Get sessions for conference |

### Analytics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conferences/:id/analytics` | GET | Get conference analytics |
| `/api/targeting` | GET | Get ad targeting data |
| `/api/targeting/reach` | GET | Get estimated reach |

## API Examples

### Create Conference

```bash
curl -X POST http://localhost:4884/api/conferences \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: internal-service-token-dev" \
  -d '{
    "name": "Tech Summit 2026",
    "description": "Annual technology conference",
    "date": {
      "start": "2026-09-15T09:00:00Z",
      "end": "2026-09-17T18:00:00Z"
    },
    "venue": {
      "name": "Convention Center",
      "address": "123 Tech Avenue",
      "city": "San Francisco",
      "country": "USA",
      "capacity": 5000
    },
    "industry": "Technology",
    "expectedAttendance": 3000,
    "topics": ["AI", "Cloud", "Security"],
    "tags": ["tech", "innovation"],
    "organizer": {
      "name": "Tech Events Inc",
      "email": "events@techevents.com",
      "company": "Tech Events Inc"
    }
  }'
```

### Add Speaker

```bash
curl -X POST http://localhost:4884/api/conferences/{id}/speakers \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: internal-service-token-dev" \
  -d '{
    "name": "Jane Smith",
    "title": "Chief AI Officer",
    "company": "TechCorp",
    "bio": "Leading AI researcher with 15 years experience",
    "topic": "The Future of AI",
    "expertise": ["AI", "Machine Learning", "NLP"],
    "followers": {
      "linkedin": 50000,
      "twitter": 25000
    }
  }'
```

### Add Session

```bash
curl -X POST http://localhost:4884/api/conferences/{id}/sessions \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: internal-service-token-dev" \
  -d '{
    "title": "Keynote: AI Revolution",
    "description": "Opening keynote on AI advancements",
    "type": "keynote",
    "speakerIds": ["{speakerId}"],
    "room": "Main Hall",
    "date": "2026-09-15T09:00:00Z",
    "startTime": "09:00",
    "endTime": "10:00",
    "capacity": 5000,
    "tags": ["AI", "Keynote"],
    "level": "beginner"
  }'
```

### Get Analytics

```bash
curl http://localhost:4884/api/conferences/{id}/analytics \
  -H "X-Service-Token: internal-service-token-dev"
```

### Get Ad Targeting Data

```bash
curl "http://localhost:4884/api/targeting?industry=Technology&topics=AI,Cloud" \
  -H "X-Service-Token: internal-service-token-dev"
```

## Data Models

### Conference

```typescript
interface IConference {
  name: string;
  description: string;
  date: { start: Date; end: Date };
  venue: {
    name: string;
    address: string;
    city: string;
    country: string;
    capacity: number;
  };
  industry: string;
  expectedAttendance: number;
  topics: string[];
  tags: string[];
  organizer: { name: string; email: string; company: string };
  sponsors?: Array<{ name: string; tier: string; logo?: string }>;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  registrationUrl?: string;
  website?: string;
  socialMedia?: { twitter?: string; linkedin?: string; facebook?: string };
  targetAudience: string[];
  priceRange?: { min: number; max: number; currency: string };
}
```

### Speaker

```typescript
interface ISpeaker {
  conferenceId: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  topic: string;
  expertise: string[];
  followers?: { twitter?: number; linkedin?: number; instagram?: number };
  photo?: string;
  socialLinks?: { twitter?: string; linkedin?: string; website?: string };
  rating?: number;
  sessions?: string[];
}
```

### Session

```typescript
interface ISession {
  conferenceId: string;
  title: string;
  description: string;
  type: 'keynote' | 'panel' | 'workshop' | 'networking' | 'breakout' | 'other';
  speakerIds: string[];
  room: string;
  date: Date;
  startTime: string;
  endTime: string;
  capacity?: number;
  registeredCount?: number;
  tags: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  materials?: Array<{ name: string; url: string; type: string }>;
  feedback?: { rating: number; count: number };
}
```

### ConferenceAnalytics

```typescript
interface IConferenceAnalytics {
  conferenceId: string;
  impressions: number;
  registrations: number;
  attendance: number;
  checkIns: number;
  sessions: Array<{
    sessionId: string;
    impressions: number;
    attendance: number;
    feedback: { rating: number; count: number };
  }>;
  engagement: {
    websiteVisits: number;
    socialShares: number;
    hashtagMentions: number;
    pressMentions: number;
  };
  conversions: {
    registrations: number;
    ticketSales: number;
    sponsorMeetings: number;
    leadCaptures: number;
  };
  demographics: {
    industries: Record<string, number>;
    jobTitles: Record<string, number>;
    companySizes: Record<string, number>;
    countries: Record<string, number>;
  };
}
```

## Authentication

Internal services authenticate using the `X-Service-Token` header:

```bash
curl -H "X-Service-Token: internal-service-token-dev" ...
```

In development mode (`NODE_ENV=development`), authentication is bypassed.

## Caching

Redis caching is used for:
- Conference data (5 min TTL)
- Speaker lists (10 min TTL)
- Session data (5 min TTL)
- Analytics (1 min TTL)
- Targeting data (2 min TTL)

Cache is automatically invalidated on updates.

## Metrics

Prometheus metrics available at `/metrics`:

- `http_request_duration_seconds` - Request latency
- `http_requests_total` - Total requests
- `conferences_created_total` - Conferences created
- `speakers_added_total` - Speakers added
- `sessions_created_total` - Sessions created
- `conference_registrations_total` - Registrations
- `active_conferences_count` - Active conferences by status
- `upcoming_conferences_count` - Upcoming conferences
- `analytics_queries_total` - Analytics queries
- `targeting_queries_total` - Targeting queries
- `db_operation_duration_seconds` - Database latency
- `cache_hits_total` / `cache_misses_total` - Cache performance

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4884 | Service port |
| `NODE_ENV` | development | Environment |
| `MONGODB_URI` | mongodb://localhost:27017/conference-graph | MongoDB connection string |
| `REDIS_URL` | redis://localhost:6379 | Redis connection string |
| `INTERNAL_SERVICE_TOKEN` | internal-service-token-dev | Service authentication token |
| `CORS_ORIGIN` | * | CORS origin |
| `LOG_LEVEL` | info | Log level |

## Project Structure

```
conference-graph-service/
├── src/
│   ├── index.ts              # Main entry point
│   ├── models/               # Mongoose models
│   │   ├── Conference.ts
│   │   ├── Speaker.ts
│   │   ├── Session.ts
│   │   ├── ConferenceAnalytics.ts
│   │   └── index.ts
│   ├── services/            # Business logic
│   │   ├── conferenceService.ts
│   │   ├── speakerService.ts
│   │   ├── sessionService.ts
│   │   ├── analyticsService.ts
│   │   ├── targetingService.ts
│   │   └── index.ts
│   ├── routes/              # API routes
│   │   ├── conferenceRoutes.ts
│   │   ├── targetingRoutes.ts
│   │   └── index.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── index.ts
│   ├── utils/               # Utilities
│   │   ├── logger.ts
│   │   ├── metrics.ts
│   │   ├── redis.ts
│   │   └── index.ts
│   └── types/               # TypeScript types
│       └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Ecosystem Integration

This service connects to other AdBazaar and REZ ecosystem services:

- **RABTUL Auth** - Service authentication
- **AdBazaar Dashboard** - Admin interface
- **REZ Intelligence** - Intent prediction
- **HOJAI AI** - AI-powered recommendations

## License

Proprietary - AdBazaar
