# Social Content Publisher

**Port:** 5083

**Purpose:** Unified publishing engine for all social platforms

## Overview

The Social Content Publisher is a centralized service that enables businesses to create, schedule, and publish content across multiple social media platforms from a single interface. It provides a unified workflow for content creation, approval, and distribution.

## Features

- **Multi-Platform Publishing** - Publish to Instagram, Facebook, Twitter, LinkedIn, TikTok, YouTube, and Pinterest
- **Single Compose** - Create content once, publish everywhere
- **Platform-Specific Auto-Formatting** - Automatically adapts content for each platform's requirements
- **Bulk Scheduling** - Schedule multiple posts in advance
- **Content Queue Management** - Efficient queue processing with retry logic
- **Approval Workflows** - Draft → Review → Approve → Publish workflow
- **Team Collaboration** - Multiple users can collaborate on content
- **Version History** - Track all changes with version history
- **Conflict Detection** - Detect scheduling conflicts

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOCIAL CONTENT PUBLISHER                     │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │    POSTS    │  │   QUEUE    │  │  CALENDAR   │  │ PLATFORM │ │
│  │   ROUTES   │  │   ROUTES   │  │   ROUTES    │  │  ROUTES  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────┬─────┘ │
│         │                │                │               │      │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐ ┌───▼─────┐ │
│  │ POST     │  │   QUEUE     │  │   POST │  │ PLATFORM │ │
│  │   SERVICE   │  │   SERVICE   │  │   SERVICE │  │ SERVICE │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └───┬─────┘ │
│         │                │                │               │      │
│  ┌──────▼────────────────────────────────▼──────────────▼─────┐ │
│  │ PUBLISHING SERVICE                        │ │
│  │     (Instagram, Facebook, Twitter, LinkedIn, TikTok...) │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │ │
│  ┌───────────────────────────▼───────────────────────────────┐  │
│  │                    MONGODB + REDIS                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Cache:** Redis (optional)
- **Language:** TypeScript
- **Validation:** Zod
- **Logging:** Winston
- **Metrics:** Prometheus

## Quick Start

```bash
# Install dependencies
cd social-content-publisher
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Or build and start production
npm run build
npm start
```

## API Endpoints

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create unified post |
| GET | `/api/posts` | List all posts |
| GET | `/api/posts/:id` | Get post details |
| PATCH | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/publish` | Publish now |
| POST | `/api/posts/:id/schedule` | Schedule post |
| POST | `/api/posts/:id/submit-review` | Submit for review |
| POST | `/api/posts/:id/approve` | Approve post |
| POST | `/api/posts/:id/reject` | Reject post |
| GET | `/api/posts/:id/history` | Get version history |

### Queue

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/queue` | List queue items |
| GET | `/api/queue/pending` | Get pending items |
| POST | `/api/queue/reorder` | Reorder queue |
| GET | `/api/queue/stats` | Get queue statistics |
| POST | `/api/queue/:id/retry` | Retry failed item |

### Calendar

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar` | Get calendar data |
| GET | `/api/calendar/month/:year/:month` | Get month data |
| GET | `/api/calendar/upcoming` | Get upcoming posts |

### Platforms

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/platforms` | List connected platforms |
| GET | `/api/platforms/active` | Get active platforms |
| GET | `/api/platforms/stats` | Get platform statistics |
| POST | `/api/platforms/connect` | Connect new platform |
| DELETE | `/api/platforms/:id` | Disconnect platform |
| POST | `/api/platforms/:id/sync` | Sync platform |
| POST | `/api/platforms/sync-all` | Bulk sync platforms |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

## Data Models

### UnifiedPost

```typescript
interface IUnifiedPost {
  id: string;
  userId: string;
  companyId: string;
  title: string;
  content: {
    text: string;
    media: { url: string; type: 'image' | 'video' | 'gif'; alt?: string }[];
  };
  platforms: PlatformConfig[];
  scheduledTime?: Date;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  workflow: {
    status: 'pending' | 'review' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewedAt?: Date;
  };
  analytics?: {
    [platform: string]: {
      publishedId?: string;
      publishedAt?: Date;
      likes?: number;
      comments?: number;
      shares?: number;
      reach?: number;
    };
  };
  versionHistory?: VersionEntry[];
}
```

### ContentQueue

```typescript
interface IContentQueue {
  id: string;
  postId: string;
  platform: string;
  scheduledTime: Date;
  status: 'pending' | 'processing' | 'published' | 'failed';
  retryCount: number;
  error?: string;
}
```

### PlatformConfig

```typescript
interface PlatformConfig {
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest';
  accountId: string;
  adaptedContent?: string;
  enabled: boolean;
}
```

## Authentication

All API endpoints require authentication via the `X-Internal-Token` header:

```bash
curl -H "X-Internal-Token: your-token" \
     -H "X-User-Id: user123" \
     -H "X-Company-Id: company456" \
     http://localhost:5083/api/posts
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Service port | `5083` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/social-content-publisher` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `INTERNAL_SERVICE_TOKEN` | Service authentication token | - |
| `LOG_LEVEL` | Logging level | `info` |

## Platform Limits

| Platform | Character Limit | Media Limit |
|----------|---------------|-------------|
| Twitter | 280 | 4 images or 1 video |
| Instagram | 2,200 | 10 images or 1 video |
| Facebook | 63,206 | 10 images or1 video |
| LinkedIn | 3,000 | 9 images or 1 video |
| TikTok | 150 | 1 video |
| YouTube | 5,000 | 1 video (description) |
| Pinterest | 500 | 6 images |

## Workflow States

```
    ┌─────────┐
    │  DRAFT  │
    └────┬────┘
         │ submit-review
         ▼
    ┌─────────┐
    │ REVIEW  │◄────────┐
    └────┬────┘        │
         │             │ reject
    ┌────┴────┐        │
    │        │        │
 approve │        │
    │      │        │
    ▼      │ ▼
┌─────────┐│ ┌─────────┐
│APPROVED ││    │REJECTED │
└────┬────┘│    └─────────┘
     │     │
     │     └──────────────► (edit) ──► (submit-review)
     │
     │ publish
     ▼
┌───────────┐
│PUBLISHING │──────► (error) ──► FAILED
└─────┬─────┘
      │
      │ success
      ▼
┌───────────┐
│ PUBLISHED │
└───────────┘
```

## Error Handling

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "error": "Error message",
  "details": {}
}
```

## Monitoring

### Health Check

```bash
curl http://localhost:5083/health
```

### Prometheus Metrics

```bash
curl http://localhost:5083/metrics
```

Available metrics:
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration histogram
- `posts_created_total` - Total posts created
- `posts_published_total` - Total posts published
- `queue_processing_duration_seconds` - Queue processing duration

## Related Services

- **RABTUL Auth** - User authentication
- **RABTUL Notifications** - Push notifications
- **HOJAI AI** - Content adaptation and AI suggestions

## License

Proprietary - REZ Ecosystem
