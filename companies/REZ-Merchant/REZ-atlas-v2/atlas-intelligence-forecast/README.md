# Atlas Intelligence Forecast

**Port:** 5310 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

Revenue forecasting with ML predictions. Provides accurate revenue predictions with confidence intervals.

## Features

- **ML Predictions** - Machine learning-based forecasting
- **Trend Analysis** - Identify trends and patterns
- **Scenario Planning** - What-if analysis
- **Confidence Intervals** - Prediction accuracy

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/forecast` | Get revenue forecast |
| GET | `/api/forecast/:period` | Forecast for specific period |

## Quick Start

```bash
cd atlas-intelligence-forecast
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5310/health
```

## Response Example

```json
{
  "period": "Q2 2026",
  "revenue": {
    "actual": 5000000,
    "predicted": 5500000,
    "confidence": 0.92
  },
  "growth": {
    "monthly": [12, 15, 18, 22, 19, 25]
  }
}
```
