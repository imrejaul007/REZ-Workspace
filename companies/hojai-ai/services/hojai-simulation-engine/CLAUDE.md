# CLAUDE.md - Simulation Engine

## Project Overview

**Name:** hojai-simulation-engine
**Type:** SUTAR OS - Decision Layer
**Port:** 4241
**Company:** HOJAI AI
**Part of:** SUTAR OS Phase 6 - SimulationOS

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript

## Architecture

```
Simulation Engine (4241)
    │
    ├── Scenario Testing
    ├── What-if Analysis
    ├── Monte Carlo
    └── Risk Assessment
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
| PORT | No | 4241 | Service port |

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| src/index.ts | ~310 | Main server |

## Capabilities

- What-if Analysis
- Monte Carlo Simulation
- Risk Assessment
- Confidence Scoring
- Scenario Testing

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/simulations` | Create simulation |
| GET | `/api/simulations` | List simulations |
| GET | `/api/simulations/:id` | Get simulation |
| POST | `/api/monte-carlo` | Run Monte Carlo |
| POST | `/api/what-if` | What-if analysis |

## Health Endpoints

- `GET /health` - Health check
- `GET /health/ready` - Readiness probe

## Notes

- Runs what-if scenarios
- Monte Carlo for probability
- Risk assessment
- Confidence scoring
