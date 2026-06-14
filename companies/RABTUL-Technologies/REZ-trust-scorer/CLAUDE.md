# CLAUDE.md - Trust Scorer

## Project Overview

**Name:** REZ-trust-scorer
**Type:** SUTAR OS - Trust Layer
**Port:** 4180
**Company:** RABTUL Technologies
**Part of:** SUTAR OS Phase 6 - Trust Engine

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript
- MongoDB/Mongoose

## Architecture

```
Trust Scorer (4180)
    │
    ├── Credit Score (25%)
    ├── Payment History (25%)
    ├── Dispute Rate (25%)
    └── Delivery Success (25%)
            │
            └──► Overall Trust Score (0-100)
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
| PORT | No | 4180 | Service port |
| MONGODB_URI | Yes | - | MongoDB connection |

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| src/index.ts | ~358 | Main server |

## Trust Metrics

| Metric | Weight | Description |
|--------|--------|-------------|
| Credit Score | 25% | Financial stability |
| Payment History | 25% | Timeliness of payments |
| Dispute Rate | 25% | Disputes filed |
| Delivery Success | 25% | On-time delivery rate |

## Tier System

| Score | Tier |
|-------|------|
| 90-100 | Enterprise |
| 80-89 | Verified |
| 70-79 | Conditional |
| 0-69 | Review |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trust/:entityId` | Get trust score |
| POST | `/api/trust/:entityId/calculate` | Recalculate score |
| PUT | `/api/trust/:entityId` | Update metrics |
| POST | `/api/trust/:entityId/flag` | Raise risk flag |
| POST | `/api/payments` | Record payment |
| GET | `/api/payments` | List payments |

## Health Endpoints

- `GET /health` - Health check
- `GET /health/ready` - Readiness probe

## Notes

- Trust score is 0-100
- Calculated from 4 weighted metrics
- Risk flags affect score
- Tier determines transaction limits
