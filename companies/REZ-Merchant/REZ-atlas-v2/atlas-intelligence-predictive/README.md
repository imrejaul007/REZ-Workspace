# Atlas Intelligence Predictive

**Port:** 5395 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

Predictive analytics for churn, revenue, and risk. ML models predict future outcomes.

## Features

- **Churn Prediction** - Identify at-risk customers
- **Revenue Prediction** - Forecast revenue
- **Risk Scoring** - Score operational risks
- **Anomaly Detection** - Spot unusual patterns

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predict/churn` | Predict churn risk |
| POST | `/api/predict/revenue` | Predict revenue |
| POST | `/api/predict/risk` | Score operational risk |

## Quick Start

```bash
cd atlas-intelligence-predictive
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5395/health
```

## Example Request

```bash
curl -X POST http://localhost:5395/api/predict/churn \
  -H "Content-Type: application/json" \
  -d '{"merchantId": "merch-123"}'
```
