# Franchise Twin Engine
Port: 5430

Predicts franchisee decisions and behavior.

## Features

- Franchisee profiling
- Decision prediction
- Performance forecasting
- Growth propensity

## Quick Start

```bash
cd franchise-twin
npm install
npx tsx src/index.ts
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/franchisees` | GET | List franchisees |
| `/predict` | POST | Predict decisions |
| `/franchisee/:id` | GET | Get franchisee |

## Example

```bash
curl -X POST http://localhost:5430/predict \
  -H "Content-Type: application/json" \
  -d '{"eventType": "new_territory"}'
```