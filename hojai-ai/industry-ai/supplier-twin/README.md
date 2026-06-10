# Supplier Twin Engine
Port: 5420

Predicts supplier behavior and negotiations.

## Features

- Supplier profiling
- Negotiation prediction
- Risk assessment
- Pricing behavior

## Quick Start

```bash
cd supplier-twin
npm install
npx tsx src/index.ts
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/suppliers` | GET | List suppliers |
| `/predict` | POST | Predict reactions |
| `/supplier/:id` | GET | Get supplier |

## Example

```bash
curl -X POST http://localhost:5420/predict \
  -H "Content-Type: application/json" \
  -d '{"eventType": "price_pressure", "description": "Request 10% price reduction"}'
```