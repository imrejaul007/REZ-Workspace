# Atlas Intelligence Core

**Port:** 5300 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

Central AI analytics hub. Provides real-time dashboards, AI insights, natural language queries, and predictive alerts.

## Features

- **Real-Time Dashboards** - Live metrics and KPIs
- **AI Insights** - Automatic pattern detection
- **Natural Language Queries** - Ask questions in plain English
- **Predictive Alerts** - Proactive notifications

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get dashboard summary |
| GET | `/api/insights` | Get AI-generated insights |
| GET | `/api/predictions` | Get ML predictions |
| POST | `/api/query` | Natural language query |

## Quick Start

```bash
cd atlas-intelligence-core
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5300/health
```

## Example Request

```bash
# Natural language query
curl -X POST http://localhost:5300/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is our revenue growth this month?"}'
```

## Response Example

```json
{
  "answer": "Revenue is up 12.5% this month.",
  "sources": ["revenue_data", "sales"],
  "confidence": 0.95
}
```

## Ecosystem Integration

- **HOJAI AI** - Natural language processing
- **atlas-intelligence-*** - All intelligence services
- **atlas-revenue-core** - Revenue data
