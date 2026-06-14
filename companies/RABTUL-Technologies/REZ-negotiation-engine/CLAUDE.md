# CLAUDE.md - REZ Negotiation Engine

## Project Overview

**Name:** REZ-negotiation-engine
**Type:** SUTAR OS Service - Negotiation Layer
**Port:** 4191
**Company:** RABTUL Technologies
**Part of:** SUTAR OS Phase 6

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript
- MongoDB/Mongoose
- Axios (event publishing)

## Architecture

```
NegotiationOS (4191)
    │
    ├── Negotiation Routes (/api/negotiations)
    ├── RFQ Routes (/api/rfq)
    └── Quote Routes (/api/quotes)
            │
            └──► Event Bus (4025)
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
| PORT | No | 4191 | Service port |
| MONGODB_URI | Yes | - | MongoDB connection |
| NODE_ENV | No | development | Environment |
| EVENT_BUS_URL | No | http://localhost:4025 | Event Bus URL |

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| index.ts | ~120 | Main server |
| models/Negotiation.ts | ~400 | MongoDB models |
| services/negotiationService.ts | ~350 | Business logic |
| routes/negotiations.ts | ~250 | API routes |
| services/eventBus.ts | ~30 | Event publishing |

## Integration Points

### Upstream
- SUTAR Gateway (4140)
- GoalOS (4242)
- Decision Engine

### Downstream
- Event Bus (4025)
- Trust Engine (4050)
- ContractOS (4190)

## Events Published

- `negotiation.created`
- `negotiation.rfq_sent`
- `negotiation.quote_received`
- `negotiation.counter_offer`
- `negotiation.accepted`
- `negotiation.rejected`
- `negotiation.cancelled`
- `rfq.sent`
- `rfq.quote_received`
- `quote.sent`
- `quote.accepted`
- `quote.rejected`

## API Headers

All requests require:
- `X-Tenant-Id` - Tenant identifier
- `X-User-Id` - User identifier (optional)

## Notes

- Follows SUTAR OS canonical architecture
- Implements NegotiationOS layer
- Supports RFQ → Quote → Counter → Accept workflow
- Publishes all events to Event Bus
