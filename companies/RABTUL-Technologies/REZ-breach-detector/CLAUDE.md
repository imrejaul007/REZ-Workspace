# CLAUDE.md - Breach Detector

## Project Overview

**Name:** REZ-breach-detector
**Type:** SUTAR OS - Contract Layer
**Port:** 4196
**Company:** RABTUL Technologies
**Part of:** SUTAR OS Phase 6 - ContractOS

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript
- MongoDB/Mongoose

## Architecture

```
Breach Detector (4196)
    │
    ├── Breach Detection
    ├── Severity Assessment
    ├── Escalation
    └── Resolution Tracking
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
| PORT | No | 4196 | Service port |
| MONGODB_URI | Yes | - | MongoDB connection |

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| src/index.ts | ~230 | Main server |

## Breach Types

- delivery
- payment
- quality
- terms
- sla

## Severity Levels

- critical
- high
- medium
- low

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/breaches` | Detect breach |
| GET | `/api/breaches` | List breaches |
| GET | `/api/breaches/:id` | Get breach |
| PUT | `/api/breaches/:id` | Update breach |
| POST | `/api/breaches/:id/escalate` | Escalate |
| GET | `/api/breaches/analytics` | Analytics |

## Health Endpoints

- `GET /health` - Health check
- `GET /health/ready` - Readiness probe

## Notes

- Detects contract breaches
- Auto-escalates critical breaches
- Tracks resolution
- Provides analytics
