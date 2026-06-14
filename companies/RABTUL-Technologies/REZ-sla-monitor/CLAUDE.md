# CLAUDE.md - SLA Monitor

## Project Overview

**Name:** REZ-sla-monitor
**Type:** SUTAR OS - Contract Layer
**Port:** 4195
**Company:** RABTUL Technologies
**Part of:** SUTAR OS Phase 6 - ContractOS

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript
- MongoDB/Mongoose

## Architecture

```
SLA Monitor (4195)
    │
    ├── SLA Definitions
    ├── Compliance Tracking
    └── Alert Generation
            │
            └──► Breach Detector (4196)
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
| PORT | No | 4195 | Service port |
| MONGODB_URI | Yes | - | MongoDB connection |

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| src/index.ts | ~209 | Main server |

## SLA Types

- delivery
- response
- resolution
- quality

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/slas` | Create SLA |
| GET | `/api/slas` | List SLAs |
| GET | `/api/slas/:id` | Get SLA |
| POST | `/api/slas/:id/metric` | Record metric |
| GET | `/api/slas/:id/report` | Get compliance report |

## Health Endpoints

- `GET /health` - Health check
- `GET /health/ready` - Readiness probe

## Notes

- Monitors SLA compliance
- Generates alerts on breach
- Tracks compliance percentage
- Reports on SLA health
