# Employee Twin Engine
Port: 5410

Predicts employee behavior and reactions.

## Overview

Digital twin for predicting employee reactions to company events.

## Features

- Employee persona modeling
- Sentiment analysis
- Engagement prediction
- Retention risk assessment

## Employee Segments

| Segment | Description |
|---------|-------------|
| High Performers | L5-L7, 3+ years, Exceeds |
| Mid Performers | L3-L5, 1-3 years, Meets |
| New Hires | L1-L3, <1 year, Developing |
| Tenured | L5+, 5+ years, Variable |
| Leadership | L8+, Manager+ |

## Quick Start

```bash
cd employee-twin
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
curl -X POST http://localhost:5410/predict \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "compensation_change",
    "description": "Annual salary review"
  }'
```

## Response

```json
{
  "eventId": "evt-123",
  "eventType": "compensation_change",
  "overallSentiment": 0.45,
  "overallEngagement": 72,
  "retentionImpact": 0.35,
  "reactions": [...],
  "recommendations": [...]
}
```