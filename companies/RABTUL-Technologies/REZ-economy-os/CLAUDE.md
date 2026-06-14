# CLAUDE.md - Economy OS

## Project Overview

**Name:** REZ-economy-os
**Type:** SUTAR OS - Economy Layer
**Port:** 4251
**Company:** RABTUL Technologies
**Part of:** SUTAR OS Phase 6 - EconomyOS

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript
- MongoDB/Mongoose

## Architecture

```
Economy OS (4251)
    │
    ├── Karma Points
    ├── Platform Fees
    ├── Settlement
    └── Transaction Tracking
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
| PORT | No | 4251 | Service port |
| MONGODB_URI | Yes | - | MongoDB connection |

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| src/index.ts | ~310 | Main server |

## Karma Tiers

- bronze (0-499)
- silver (500-1999)
- gold (2000-4999)
- platinum (5000-9999)
- diamond (10000+)

## API Endpoints

### Karma

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/karma/:entityId` | Get karma |
| POST | `/api/karma/:entityId/points` | Add/remove points |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transactions` | Create transaction |
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions/:id/complete` | Complete |

### Fees

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fees` | Set fee |
| GET | `/api/fees` | Get fees |

### Settlement

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/settlement` | Calculate settlement |

## Health Endpoints

- `GET /health` - Health check
- `GET /health/ready` - Readiness probe

## Notes

- Karma points for agents/companies
- Platform fees calculation
- Settlement engine
- Transaction tracking
