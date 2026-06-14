# Content Calendar Service

**Port:** 5092  
**Company:** AdBazaar  
**Purpose:** Visual drag-drop content calendar for social media scheduling

## Overview

The Content Calendar Service provides a comprehensive scheduling and calendar management system for social media content. It supports monthly, weekly, and daily views with drag-drop scheduling, conflict detection, and team collaboration features.

## Features

- **Multiple Calendar Views:** Monthly, weekly, and daily views
- **Drag-Drop Scheduling:** Via PATCH endpoint for visual calendar integrations
- **Color-Coded Platforms:** Platform-specific colors for easy identification
- **Content Type Filtering:** Filter by platform and status
- **Quick Reschedule:** Easy event date/time updates
- **Bulk Operations:** Move multiple events at once
- **Conflict Detection:** Warns if multiple posts are scheduled at the same time
- **Team Assignments:** Assign events to team members
- **Approval Status:** Draft, scheduled, published, failed statuses
- **Best Time Suggestions:** AI-powered scheduling suggestions based on historical performance
- **Overdue Alerts:** Track events past their scheduled date
- **Export:** PDF, CSV, and iCal formats
- **Import:** CSV import for bulk event creation
- **Statistics:** Calendar analytics and reporting

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Language:** TypeScript
- **Validation:** Zod
- **Logging:** Winston
- **Metrics:** Prometheus (prom-client)
- **Security:** Helmet, CORS, Rate Limiting

## Quick Start

```bash
# Install dependencies
cd content-calendar-service
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Update MONGODB_URI and INTERNAL_SERVICE_TOKEN

# Start development server
npm run dev

# Or build and start production
npm run build
npm start
```

## Health Check

```bash
curl http://localhost:5092/health
```

## API Endpoints

### Calendar Views

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar` | Month view (default) |
| GET | `/api/calendar/week` | Week view |
| GET | `/api/calendar/day` | Day view |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/calendar/events` | Create event |
| GET | `/api/calendar/events/:id` | Get event |
| PATCH | `/api/calendar/events/:id` | Update event (drag-drop) |
| DELETE | `/api/calendar/events/:id` | Delete event |
| POST | `/api/calendar/bulk-move` | Bulk reschedule |

### Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/conflicts` | Check scheduling conflicts |
| GET | `/api/calendar/export` | Export calendar |
| POST | `/api/calendar/import` | Import calendar |
| GET | `/api/calendar/stats` | Calendar statistics |
| GET | `/api/calendar/suggestions` | Best time suggestions |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/settings` | Get user settings |
| PATCH | `/api/calendar/settings` | Update settings |
| POST | `/api/calendar/settings/blackout-dates` | Add blackout date |
| DELETE | `/api/calendar/settings/blackout-dates/:date` | Remove blackout date |
| PATCH | `/api/calendar/settings/platform-colors/:platform` | Update platform color |
| POST | `/api/calendar/settings/reset` | Reset to defaults |

## Data Models

### CalendarEvent

```typescript
interface ICalendarEvent {
  id: string;
  postId: string;
  platform: string;
  accountId: string;
  date: Date;
  time: string;
  content: string;
  mediaPreview?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  assignee?: string;
  color: string;
  createdBy: string;
}
```

### CalendarView

```typescript
interface ICalendarView {
  startDate: Date;
  endDate: Date;
  view: 'month' | 'week' | 'day';
  events: ICalendarEvent[];
  stats: {
    total: number;
    published: number;
    scheduled: number;
    draft: number;
  };
}
```

### CalendarSettings

```typescript
interface ICalendarSettings {
  userId: string;
  defaultView: 'month' | 'week' | 'day';
  workingHours: { start: string; end: string };
  blackoutDates: Date[];
  colorScheme: { [platform: string]: string };
}
```

## Platform Colors

| Platform | Color |
|----------|-------|
| Instagram | #E4405F |
| Facebook | #1877F2 |
| Twitter | #1DA1F2 |
| LinkedIn | #0A66C2 |
| YouTube | #FF0000 |
| TikTok | #000000 |
| Pinterest | #E60023 |
| Snapchat | #FFFC00 |
| Reddit | #FF4500 |

## Authentication

All API endpoints (except health and metrics) require authentication via Bearer token:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:5092/api/calendar
```

For internal service-to-service calls, use:

```bash
curl -H "X-Internal-Token: <internal-token>" \
     -H "X-User-Id: <user-id>" \
     http://localhost:5092/api/calendar
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 5092 | Service port |
| NODE_ENV | No | development | Environment |
| MONGODB_URI | Yes | - | MongoDB connection string |
| INTERNAL_SERVICE_TOKEN | Yes | - | Internal auth token |
| JWT_SECRET | No | default-secret | JWT verification secret |
| REZ_AUTH_SERVICE_URL | No | http://localhost:4002 | RABTUL Auth service |
| LOG_LEVEL | No | info | Logging level |

## Metrics

Prometheus metrics available at `/metrics`:

- `http_request_duration_seconds` - Request duration histogram
- `http_requests_total` - Total requests counter
- `calendar_events_total` - Total events by status

## Directory Structure

```
content-calendar-service/
├── src/
│   ├── config/
│   │   ├── index.ts         # Configuration
│   │   └── database.ts      # MongoDB connection
│   ├── models/
│   │   ├── CalendarEvent.ts  # Event model
│   │   ├── CalendarView.ts   # View model
│   │   ├── CalendarSettings.ts # Settings model
│   │   └── index.ts
│   ├── services/
│   │   ├── calendarService.ts  # Calendar logic
│   │   ├── settingsService.ts  # Settings logic
│   │   └── index.ts
│   ├── middleware/
│   │   ├── auth.ts           # Authentication
│   │   ├── validation.ts     # Request validation
│   │   ├── metrics.ts        # Prometheus metrics
│   │   ├── rateLimit.ts      # Rate limiting
│   │   └── index.ts
│   ├── routes/
│   │   ├── calendarRoutes.ts  # Calendar endpoints
│   │   ├── settingsRoutes.ts  # Settings endpoints
│   │   └── index.ts
│   ├── utils/
│   │   ├── logger.ts         # Winston logger
│   │   └── errors.ts         # Error handling
│   └── index.ts              # Entry point
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Related Services

- **RABTUL Auth Service** (Port 4002) - User authentication
- **RABTUL Notification Service** (Port 4011) - Push notifications
