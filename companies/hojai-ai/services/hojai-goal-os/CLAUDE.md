# HOJAI Goal-OS Service

## Overview

HOJAI Goal-OS is a goal management and OKR tracking microservice for HOJAI AI's CoPilot product. It provides comprehensive goal lifecycle management including creation, tracking, progress monitoring, and AI-powered risk alerting.

**Port:** 4242
**MongoDB Database:** `hojai-goal-os`
**MongoDB Collections:**
- `goals` - Goal definitions and metadata
- `o krs` - Objectives and Key Results
- `milestones` - Goal milestones
- `goaldependencies` - Goal dependency mappings
- `goalprogresses` - Progress history records
- `goalalerts` - Risk and status alerts

## API Routes Summary

### Health (No auth required)
- `GET /health` - Service health check
- `GET /health/live` - Kubernetes liveness probe
- `GET /health/ready` - Kubernetes readiness probe (checks MongoDB)

### Goals (`/goals`)
- `GET /` - List goals with filtering (status, category, owner, type, priority)
- `POST /` - Create goal
- `GET /:id` - Get goal by ID
- `PATCH /:id` - Update goal
- `DELETE /:id` - Delete goal
- `POST /:id/progress` - Record progress update
- `GET /:id/progress` - Get progress history and snapshot
- `GET /:id/risks` - Get risk assessment for goal
- `GET /:id/dependencies` - Get dependency mapping
- `POST /:id/dependencies` - Add dependency
- `GET /:id/milestones` - Get milestones for goal
- `POST /:id/milestones` - Add milestone
- `PATCH /:id/milestones/:milestoneId` - Update milestone

### OKRs (`/okrs`)
- `GET /` - List OKRs with filtering (goal, period, year)
- `POST /` - Create OKR
- `GET /:id` - Get OKR with calculated progress
- `PATCH /:id` - Update OKR
- `POST /:id/key-results/:krId/progress` - Update key result progress

### Milestones (`/milestones`)
- `GET /` - List all milestones with filtering
- `GET /:id` - Get milestone by ID
- `PATCH /:id` - Update milestone

### Alerts (`/alerts`)
- `GET /` - List alerts with filtering (goal, severity, read status)
- `PATCH /:id/read` - Mark alert as read
- `POST /read-all` - Mark all alerts as read

### Analytics (`/analytics`)
- `GET /dashboard` - Dashboard statistics
- `GET /` - Detailed analytics
- `GET /dependencies` - Dependency graph
- `GET /cascade/:goalId` - Cascade impact analysis
- `POST /suggest` - AI-generated OKR suggestions

## AI Features

### Progress Monitoring
- Track progress over time with history
- Calculate velocity (progress per day/week)
- Predict completion date based on current velocity
- Identify at-risk goals (falling behind by >20%)

### Risk Alerts
- **Off-track alerts** - Triggered when progress falls >20% behind expected
- **Deadline approaching alerts** - Triggered 7 days before deadline
- **Milestone missed alerts** - Triggered when milestones pass their target date
- **Dependency risk alerts** - Triggered when a dependent goal is at risk

### Dependency Mapping
- Visualize goal dependencies (blocks/enables/related)
- Detect circular dependencies
- Cascade impact analysis (what breaks if this goal fails)
- Identify at-risk dependents

### OKR Suggestions
- Generate OKRs based on category (revenue, growth, product, team, operational)
- Suggest key results with targets
- Score ambition level (conservative, moderate, ambitious)
- Provide reasoning for suggestions

### Goal Analytics
- Completion rate by category, owner, and period
- Average time to achieve goals
- Goal-setting patterns analysis
- Team performance comparison

## Integration Points

### hojai-board (AI C-Suite Integration)
Goal-OS integrates with hojai-board for:
- C-Suite dashboard visibility into organizational goals
- Executive-level goal status reporting
- Strategic alignment verification

### hojai-twin (What-If Scenarios)
Goal-OS can leverage hojai-twin for:
- Simulating goal achievement scenarios
- Testing resource allocation impact on goals
- Predicting goal outcomes under different conditions

## Service Patterns

All services in this codebase follow consistent patterns:
- Tenant isolation via `X-Tenant-Id` header
- Zod validation for all request bodies
- Structured JSON logging with `createLogger`
- MongoDB connection with graceful shutdown
- Standard API response format (`success`, `data`, `error`, `meta`)
- Compound indexes for query performance

## Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Run in development (tsx watch)
npm run build      # Build for production
npm start          # Run production build
```