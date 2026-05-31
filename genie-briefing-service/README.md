# GENIE Briefing Service

**GENIE Personal Intelligence OS** - Daily briefings (morning + evening)

> "You don't use Genie. You talk to Genie."

## Overview

The GENIE Briefing Service generates personalized daily briefings for users, including morning and evening summaries with calendar events, tasks, follow-ups, weather insights, and AI-powered recommendations.

## Quick Start

```bash
# Install dependencies
cd genie-briefing-service
npm install

# Build TypeScript
npm run build

# Start the service
npm run dev
```

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `PORT` | `4704` | Service port |
| `MONGODB_URI` | `mongodb://localhost:27017/genie-briefings` | MongoDB connection |
| `NODE_ENV` | `development` | Environment mode |
| `CORS_ORIGINS` | `*` | CORS allowed origins |
| `INTERNAL_SERVICE_TOKEN` | - | Service-to-service auth token |

## API Endpoints

### GET /api/briefings/today
Get today's briefing (morning or evening based on time).

**Headers:** `X-Tenant-Id`, `X-User-Id`

### GET /api/briefings/morning
Get morning briefing for today or specific date.

**Query:** `?date=2026-05-30`

### GET /api/briefings/evening
Get evening briefing for today or specific date.

**Query:** `?date=2026-05-30`

### POST /api/briefings/generate
Generate a new briefing.

**Body:**
```json
{
  "type": "morning",
  "user_id": "user_123",
  "date": "2026-05-30",
  "include_sections": ["calendar", "tasks", "insights"],
  "preferences": {
    "format": "detailed",
    "tone": "friendly"
  }
}
```

### GET /api/briefings/history
Get briefing history with pagination.

**Query:** `?page=1&pageSize=20&type=morning&startDate=2026-05-01&endDate=2026-05-30`

### PATCH /api/briefings/:id
Update a briefing.

### DELETE /api/briefings/:id
Delete a briefing.

### PATCH /api/briefings/:id/items/:sectionType/:itemId
Update a briefing item (e.g., mark task as completed).

## Briefing Structure

```typescript
interface Briefing {
  id: string;
  user_id: string;
  type: 'morning' | 'evening';
  date: string;
  sections: BriefingSection[];
  summary: string;
  created_at: string;
}

interface BriefingSection {
  type: 'calendar' | 'tasks' | 'followups' | 'weather' | 'insights' | 'reminders';
  title: string;
  items: BriefingItem[];
}

interface BriefingItem {
  id: string;
  title: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  completed?: boolean;
  action_url?: string;
}
```

## Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/health` | Basic health check |
| `/health/live` | Kubernetes liveness probe |
| `/health/ready` | Kubernetes readiness probe |

## Security

- Helmet security headers
- CORS configuration
- Rate limiting (100 req/min global, 30 req/min for writes)
- Tenant isolation via headers
- Input validation with Zod

## Directory Structure

```
genie-briefing-service/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types.ts              # TypeScript interfaces
│   ├── middleware/
│   │   └── tenant.ts         # Tenant context middleware
│   ├── models/
│   │   └── index.ts          # Mongoose models
│   ├── routes/
│   │   └── briefingRoutes.ts # API routes
│   ├── services/
│   │   └── briefingService.ts # Business logic
│   └── utils/
│       └── logger.ts         # Structured logging
├── dist/                     # Compiled output
├── package.json
└── tsconfig.json
```

## Version

- **Version:** 1.0.0
- **Date:** May 30, 2026
- **Port:** 4704
