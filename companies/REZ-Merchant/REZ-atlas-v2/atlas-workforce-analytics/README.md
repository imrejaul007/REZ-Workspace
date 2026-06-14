# Atlas Workforce Analytics

**Port:** 5240 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

Performance analytics for field sales teams. Track employee productivity, conversion rates, and team performance with real-time dashboards.

## Features

- **Leaderboards** - Competitive rankings
- **Productivity Metrics** - Visits, conversions, revenue per employee
- **Trend Analysis** - Track performance over time
- **Team Comparisons** - Compare team performance

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/performance` | Get performance metrics |
| GET | `/api/analytics/leaderboard` | Get employee rankings |
| GET | `/api/analytics/trends` | Get performance trends |

## Quick Start

```bash
cd atlas-workforce-analytics
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5240/health
```

## Response Example

```json
{
  "period": "month",
  "topPerformers": [
    {"name": "Rahul Sharma", "score": 95, "visits": 145, "conversions": 42}
  ],
  "metrics": {
    "avgVisits": 125,
    "avgConversion": 32,
    "teamProductivity": 87
  }
}
```

## Ecosystem Integration

- **atlas-workforce-core** - Employee data
- **atlas-revenue-core** - Revenue data
