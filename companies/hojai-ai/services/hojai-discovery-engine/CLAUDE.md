# CLAUDE.md - Discovery Engine

## Project Overview

**Name:** hojai-discovery-engine
**Type:** SUTAR OS - Discovery Layer
**Port:** 4256
**Company:** HOJAI AI
**Part of:** SUTAR OS Phase 6 - Discovery

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript
- MongoDB/Mongoose

## Architecture

```
Discovery Engine (4256)
    │
    ├── Category Match
    ├── Capability Match
    ├── Location Match
    ├── Trust Match
    └── Price Match
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
| PORT | No | 4256 | Service port |
| MONGODB_URI | Yes | - | MongoDB connection |

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| src/index.ts | ~382 | Main server |

## Agent Types

- supplier
- buyer
- service
- logistics
- manufacturer
- distributor

## API Endpoints

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents` | Register agent |
| GET | `/api/agents` | List agents |
| GET | `/api/agents/:id` | Get agent |
| PUT | `/api/agents/:id` | Update agent |

### Discovery

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/discover` | Search agents |
| POST | `/api/match/capability` | Match by capability |
| POST | `/api/match/location` | Match by location |
| POST | `/api/match/trust` | Match by trust |
| POST | `/api/match/price` | Match by price |

## Health Endpoints

- `GET /health` - Health check
- `GET /health/ready` - Readiness probe

## Notes

- Agent registry and discovery
- Multi-criteria matching
- Trust-based filtering
- Capability matching
- Location matching
- Price matching