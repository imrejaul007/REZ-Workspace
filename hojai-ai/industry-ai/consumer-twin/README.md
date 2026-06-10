# Consumer Twin Engine
Port: 5400

Aiphrodite-style consumer behavior prediction.

## Overview

Predicts consumer reactions to events using digital twin technology.

## Features

- Consumer segment modeling
- Sentiment prediction
- Engagement scoring
- Conversion likelihood
- Persona-based predictions

## Consumer Segments

| Segment | Demographics | Behavior |
|---------|-------------|----------|
| Early Adopters | 18-34, Urban | High purchase, Low loyalty |
| Mainstream Users | 25-45, Suburban | Medium purchase, Medium loyalty |
| Value Seekers | 30-55, Mixed | Low purchase, High loyalty |
| Luxury Buyers | 35-60, Urban | Low purchase, High loyalty |
| Enterprise Buyers | 30-50, Urban | Medium purchase, High loyalty |

## Quick Start

```bash
cd consumer-twin
npm install
npx tsx src/index.ts
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/segments` | GET | List segments |
| `/predict` | POST | Predict reactions |
| `/segment/:id` | POST | Single segment |

## Example

```bash
curl -X POST http://localhost:5400/predict \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "product_launch",
    "description": "New AI-powered smartphone launch"
  }'
```

## Response

```json
{
  "eventId": "evt-123",
  "eventType": "product_launch",
  "overallSentiment": 0.45,
  "overallEngagement": 65,
  "overallConversion": 0.35,
  "topSegments": ["Early Adopters", "Mainstream Users", "Enterprise Buyers"],
  "reactions": [...]
}
```