# CLAUDE.md - SUTAR Orchestrator

## Project Overview

**Name:** SUTAR Orchestrator
**Company:** StayOwn-Hospitality
**Type:** Orchestration Service
**Port:** 4902
**Status:** ✅ Built (June 14, 2026)

## Description

Cross-service orchestration for StayOwn through SUTAR (Self-organizing Trustworthy Autonomous Relations).

## Tech Stack

- Node.js 18+
- Express.js
- TypeScript
- Axios

## SUTAR Services Connected

| Service | Port | Purpose |
|---------|------|---------|
| Gateway | 4244 | API gateway |
| Contract | 4518 | Contract generation |
| Decision | 4240 | Decision engine |
| Negotiation | 4191 | Negotiation engine |
| Trust | 4518 | Trust validation |
| Memory | 4520 | Memory bridge |
| Flow | 4244 | Workflow |
| Reputation | 4190 | Reputation |

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server (port 4902) |
| `npm run build` | Build for production |
| `npm start` | Production server |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 4902 | Service port |
| SUTAR_GATEWAY_URL | No | http://localhost:4244 | SUTAR Gateway |
| SUTAR_CONTRACT_URL | No | http://localhost:4518 | SUTAR Contract |
| SUTAR_DECISION_URL | No | http://localhost:4240 | SUTAR Decision |

## API Endpoints

### Orchestration
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orchestrate/procurement` | Procure orchestration |
| POST | `/api/orchestrate/pricing` | Pricing orchestration |
| POST | `/api/orchestrate/guest-experience` | Guest orchestration |

### Monitoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orchestrations` | List all |
| GET | `/api/orchestrations/:id` | Get details |
| GET | `/api/contracts` | List contracts |
| GET | `/api/trust/:entityId` | Trust score |

## File Structure

```
stayown-sutar-orchestrator/
├── src/
│   └── index.ts           # Main server
├── package.json
├── tsconfig.json
├── README.md
└── CLAUDE.md
```

## Story Coverage

| Chapter | Description | Status |
|---------|------------|--------|
| Ch 18 | "Sutar orchestrates everything" | ✅ Working |

---

**Last Updated:** June 14, 2026
