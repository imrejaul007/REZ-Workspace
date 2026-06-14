# Atlas Intelligence Opportunity

**Port:** 5380 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

ML-powered lead scoring and opportunity identification. Score leads based on engagement, intent, and fit.

## Features

- **ML Scoring** - Machine learning-based scoring
- **Intent Detection** - Identify buying signals
- **Prioritization** - Rank leads by potential
- **Pipeline Intelligence** - Forecast conversions

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/score` | Score a lead |
| POST | `/api/score/batch` | Batch scoring |
| GET | `/api/opportunities` | List opportunities |

## Quick Start

```bash
cd atlas-intelligence-opportunity
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5380/health
```

## Example Request

```bash
curl -X POST http://localhost:5380/api/score \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "lead-123",
    "features": {
      "visits": 5,
      "engagement": 80
    }
  }'
```

## Response

```json
{
  "leadId": "lead-123",
  "score": 85,
  "grade": "B",
  "recommendation": "Prioritize"
}
```
