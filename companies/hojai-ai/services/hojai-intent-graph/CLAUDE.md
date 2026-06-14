# CLAUDE.md - Intent Graph

## Project Overview

**Name:** hojai-intent-graph
**Type:** SUTAR OS - Intent Processing
**Port:** 4018
**Company:** HOJAI AI
**Part of:** SUTAR OS Phase 6 - Intent Graph

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript
- MongoDB/Mongoose

## Architecture

```
Intent Graph (4018)
    │
    ├── Intent Capture
    ├── Pattern Recognition
    ├── Context Enrichment
    └── Intent Routing
            │
            └──► SUTAR Agent Network
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
| PORT | No | 4018 | Service port |
| MONGODB_URI | Yes | - | MongoDB connection |

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| src/index.ts | ~352 | Main server |

## Intent Types

- PROCUREMENT
- SALES
- SERVICE
- PARTNERSHIP
- SUPPORT
- FEEDBACK

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/intents` | Capture new intent |
| GET | `/api/intents` | List intents |
| GET | `/api/intents/:id` | Get intent |
| POST | `/api/intents/:id/enrich` | Enrich intent |
| POST | `/api/intents/:id/route` | Route intent |
| GET | `/api/patterns` | List patterns |

## Health Endpoints

- `GET /health` - Health check
- `GET /health/ready` - Readiness probe

## Notes

- Captures and classifies all intents
- Learns patterns from intents
- Enriches with context
- Routes to appropriate agents/services
