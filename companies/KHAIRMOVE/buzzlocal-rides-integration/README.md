# KHAIRMOVE BuzzLocal

Community rides and carpooling with movement analytics.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Pool Types

| Type | Description |
|------|-------------|
| Carpool | Regular commuters sharing rides |
| Shuttle | Fixed route scheduled rides |
| Subscription | Monthly commitment rides |

## Features

- Community-based rides
- Movement pattern analysis
- Route matching
- Reputation system

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pools` | List ride pools |
| POST | `/api/pools` | Create pool |
| GET | `/api/pools/:id` | Get pool details |
| POST | `/api/pools/:id/join` | Join pool |
| GET | `/api/movement/patterns` | Get movement patterns |
| POST | `/api/movement/predict` | Predict movement |

## Integrations

- REZ Intelligence (Location, Memory, Predictive)
