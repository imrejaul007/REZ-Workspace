# CLAUDE.md - BOA OS

## Project Overview

**Name:** boa-os
**Type:** SUTAR OS - Strategy Layer
**Port:** 4100
**Company:** RTNM-Group
**Part of:** SUTAR OS Phase 6 - Strategic Planning

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript
- MongoDB/Mongoose
- Axios (for SUTAR integration)

## Architecture

```
BOA OS (4100)
    │
    ├── Strategic Goals
    ├── Portfolio Management
    └── Opportunities
            │
            └──► BOA-SUTAR Bridge (4110)
                    │
                    └──► SUTAR GoalOS (4242)
```

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server |
| `npm run build` | Build for production |
| `npm start` | Production server |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 4100 | Service port |
| MONGODB_URI | Yes | - | MongoDB connection |
| NODE_ENV | No | development | Environment |
| SUTAR_GOAL_OS_URL | No | http://localhost:4242 | SUTAR GoalOS URL |

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| src/index.ts | ~150 | Main server |
| src/models/Strategy.ts | ~300 | MongoDB models |
| src/services/strategyService.ts | ~300 | Business logic |
| src/routes/goals.ts | ~200 | API routes |
| src/routes/opportunities.ts | ~150 | Opportunity routes |

## API Endpoints

### Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/goals` | Create strategic goal |
| GET | `/api/goals` | List goals |
| GET | `/api/goals/:id` | Get goal |
| PUT | `/api/goals/:id` | Update goal |
| POST | `/api/goals/:id/approve` | Approve goal |
| POST | `/api/goals/:id/execute` | Start execution (sync to SUTAR) |
| POST | `/api/goals/:id/sync` | Sync progress from SUTAR |
| POST | `/api/goals/:id/cancel` | Cancel goal |
| GET | `/api/goals/stats/dashboard` | Dashboard stats |

### Opportunities

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/opportunities` | Create opportunity |
| GET | `/api/opportunities` | List opportunities |
| GET | `/api/opportunities/:id` | Get opportunity |
| PUT | `/api/opportunities/:id` | Update opportunity |
| POST | `/api/opportunities/:id/approve` | Approve |
| POST | `/api/opportunities/:id/pursue` | Pursue |

## Integration

### Upstream
- Human input (goals from leadership)
- Analytics services

### Downstream
- SUTAR GoalOS (4242) - Goal execution
- BOA-SUTAR Bridge (4110) - Sync

## Events Published

- `boa.goal.created`
- `boa.goal.approved`
- `boa.goal.execution_started`
- `boa.goal.progress_synced`
- `boa.goal.cancelled`

## Health Endpoints

- `GET /health` - Health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

## Notes

- BOA OS is the STRATEGY LAYER above SUTAR OS
- Goals approved in BOA are synced to SUTAR for execution
- Progress syncs back from SUTAR to BOA
