# CLAUDE.md - HOJAI Meeting Intelligence

## Project Overview

**Name:** HOJAI Meeting Intelligence
**Type:** HOJAI Core Service
**Purpose:** AI-Powered Meeting Management for CoPilot
**Port:** 4700

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript (ESM)
- **Database:** MongoDB with Mongoose
- **Validation:** Zod
- **Auth:** JWT

## Project Structure

```
hojai-meeting-intelligence/
├── src/
│   ├── index.ts              # Main entry point
│   ├── routes/
│   │   ├── meetings.ts       # Meeting CRUD routes
│   │   ├── notes.ts          # Note management routes
│   │   ├── actionItems.ts    # Action item routes
│   │   ├── decisions.ts      # Decision routes
│   │   ├── summaries.ts      # Summary routes
│   │   └── analytics.ts       # Analytics routes
│   ├── services/
│   │   ├── meetingService.ts
│   │   ├── noteService.ts
│   │   ├── actionItemService.ts
│   │   ├── decisionService.ts
│   │   ├── summaryService.ts
│   │   ├── contextService.ts
│   │   └── analyticsService.ts
│   ├── models/
│   │   └── index.ts          # Mongoose schemas
│   ├── types/
│   │   └── index.ts          # TypeScript types & Zod schemas
│   ├── middleware/
│   │   ├── tenant.ts         # Tenant isolation
│   │   └── auth.ts           # JWT authentication
│   └── utils/
│       └── logger.ts         # JSON logging utility
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
└── CLAUDE.md
```

## MongoDB Collections

| Collection | Purpose |
|------------|---------|
| meetings | Meeting records |
| meetingnotes | Meeting notes |
| actionitems | Action items |
| decisions | Decisions |
| meetingsummaries | AI-generated summaries |
| premeetingcontexts | Pre-meeting context |

## API Routes Summary

### Health Endpoints (No Auth)
- `GET /health` - Health check with features
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

### Meeting Endpoints
- `GET /api/meetings` - List meetings (paginated, filterable)
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/:id` - Get meeting
- `PATCH /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Cancel meeting
- `POST /api/meetings/:id/agenda` - Generate agenda

### Note Endpoints
- `POST /api/meetings/:id/notes` - Add note
- `GET /api/meetings/:id/notes` - List notes
- `PATCH /api/meetings/:id/notes/:noteId` - Update note
- `DELETE /api/meetings/:id/notes/:noteId` - Delete note

### Action Item Endpoints
- `GET /api/action-items` - List all (global)
- `POST /api/meetings/:id/action-items` - Add action item
- `GET /api/meetings/:id/action-items` - List meeting items
- `PATCH /api/meetings/:id/action-items/:itemId` - Update item
- `DELETE /api/meetings/:id/action-items/:itemId` - Delete item

### Decision Endpoints
- `GET /api/decisions` - List all (global)
- `POST /api/meetings/:id/decisions` - Capture decision
- `GET /api/meetings/:id/decisions` - List meeting decisions
- `PATCH /api/meetings/:id/decisions/:decisionId` - Update decision
- `DELETE /api/meetings/:id/decisions/:decisionId` - Delete decision

### Summary Endpoints
- `GET /api/meetings/:id/summary` - Get summary
- `POST /api/meetings/:id/summary` - Generate AI summary

### Context Endpoints
- `GET /api/meetings/:id/context` - Get pre-meeting context
- `POST /api/meetings/:id/context` - Generate context

### Analytics Endpoints
- `GET /api/analytics` - Full analytics
- `GET /api/analytics/frequency` - Meeting frequency
- `GET /api/analytics/action-item-trends` - Action item trends

## AI Features

### 1. Pre-Meeting Context
- Retrieves historical discussions with participants
- Gathers relevant documents and previous decisions
- Summarizes pending items and open questions
- Prepares participant context (background, role, concerns)

### 2. Agenda Generation
- Based on meeting type and participants
- Prioritizes topics by relevance and time sensitivity
- Allocates time per topic
- Includes pre-meeting context items

### 3. Live Notes Enhancement
- Auto-highlight action items and decisions
- Tag speakers
- Identify key moments
- Real-time sentiment tracking

### 4. Post-Meeting Summary
- **Quick Summary**: Bullet points format
- **Detailed Summary**: Full transcript analysis
- **Executive Summary**: Leadership format with key metrics

### 5. Follow-up Scheduling
- Suggests follow-up meetings based on open items
- Auto-schedule check-ins for pending action items
- Generate meeting recap emails

### 6. Meeting Analytics
- Meeting frequency by type
- Average meeting duration
- Action item completion rates
- Top decision topics
- Participant engagement metrics

## Integration Points

### HOJAI Board Service
- Board meeting management
- AI C-Suite integration
- Executive decision tracking

### Genie Project Service
- Action item tracking
- Project management integration
- Task assignment and follow-up

### Other HOJAI Services
- SkillNet (5120-5140): AI/ML capabilities
- BrandPulse (4770): Analytics
- Voice (4850): Voice transcription

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| PORT | No | Service port (default: 4700) |
| MONGODB_URI | Yes | MongoDB connection string |
| JWT_SECRET | Yes | JWT signing secret |
| CORS_ORIGIN | No | CORS allowed origin |

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |

## Tenant Isolation

All data is isolated by `tenantId` using the `X-Tenant-Id` header. Every model includes tenantId in indexes and queries.

## Response Format

All API responses follow this format:
```typescript
{
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, unknown> };
  meta: { timestamp: string; requestId: string; tenantId?: string; };
}
```

## Deployment Checklist

- [x] Codebase exists
- [x] Documentation complete
- [x] Health endpoints implemented
- [x] Docker support added
- [x] Environment variables documented
- [x] TypeScript strict mode
- [x] Tenant isolation implemented
- [x] Zod validation on all endpoints
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Monitoring configured
- [ ] Security audit passed

**Last Updated:** 2026-06-12
