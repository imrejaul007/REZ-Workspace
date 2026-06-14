# Atlas Revenue Core

**Port:** 5350 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

Revenue operations hub for pipeline management, deal tracking, and commission management.

## Features

- **Pipeline Management** - Visual pipeline stages
- **Deal Tracking** - Track deals through lifecycle
- **Revenue Forecasting** - AI-powered forecasts
- **Commission Tracking** - Automate commissions

## API Endpoints

### Pipeline

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pipeline` | Get pipeline view |
| GET | `/api/pipeline/stages` | Get pipeline stages |

### Deals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deals` | List deals |
| GET | `/api/deals/:id` | Get deal details |
| POST | `/api/deals` | Create deal |
| PUT | `/api/deals/:id/stage` | Move deal to stage |

### Forecast

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/forecast` | Get revenue forecast |
| GET | `/api/analytics` | Get revenue analytics |

## Quick Start

```bash
cd atlas-revenue-core
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5350/health
```

## Response Example

```json
{
  "stages": [
    {"name": "prospect", "count": 45, "value": 2500000},
    {"name": "qualified", "count": 32, "value": 3200000}
  ],
  "total": {"count": 127, "value": 15000000}
}
```

## Ecosystem Integration

- **RABTUL Wallet** - Commission payouts
- **atlas-intelligence-forecast** - AI forecasting
- **atlas-workforce-core** - Employee data
