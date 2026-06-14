# Social Post Scheduler

Schedule and manage social media posts across multiple platforms.

## Features

- Create, schedule, and track posts across Facebook, Instagram, Twitter, LinkedIn, YouTube, and TikTok
- Calendar view for managing scheduled content
- Recurrence scheduling (daily, weekly, monthly)
- Analytics tracking for published posts

## Quick Start

```bash
cd social-post-scheduler
npm install
npm run dev
```

## Environment Variables

```env
PORT=5050
MONGODB_URI=mongodb://localhost:27017/social-post-scheduler
REDIS_URL=redis://localhost:6379
```

## API Endpoints

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/posts | Create a new post |
| GET | /api/posts | List all posts |
| GET | /api/posts/:id | Get post by ID |
| PUT | /api/posts/:id | Update a post |
| DELETE | /api/posts/:id | Delete a post |

### Schedules

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/posts/:id/schedule | Schedule a post |
| GET | /api/schedules | List all schedules |
| GET | /api/schedules/:id | Get schedule by ID |
| DELETE | /api/schedules/:id | Cancel a schedule |

### Calendar

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/calendar | Get calendar events (month view) |
| GET | /api/calendar/week | Get week view |
| POST | /api/calendar | Create calendar event |

## Health Check

```bash
curl http://localhost:5050/health
```

## Metrics

```bash
curl http://localhost:5050/metrics
```