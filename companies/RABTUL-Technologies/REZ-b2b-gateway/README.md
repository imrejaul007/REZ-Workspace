# REZ B2B Gateway

**Port:** 4138  
**Status:** Complete

## Overview

Unified API gateway for all REZ B2B Sales services. Provides single entry point with aggregated data and cross-service queries.

## Features

- **Unified API** - Single endpoint for all B2B services
- **Cross-Service Queries** - Aggregate data from multiple services
- **Service Health Monitoring** - Real-time health checks
- **Request Routing** - Dynamic routing to underlying services
- **Caching** - Redis-based response caching

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    B2B Gateway (4138)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Unified Endpoints:                                         │
│  ├── /api/unified/account/:id   → Account + Signals + Deals│
│  ├── /api/unified/deal/:id      → Deal + Activities + Notes │
│  ├── /api/unified/pipeline      → Pipeline + Forecasts     │
│  └── /api/unified/outreach/:id  → Prospect + Sequences     │
│                                                             │
│  Service Routes:                                            │
│  ├── /api/b2b/tam/*        → TAM Builder (4128)           │
│  ├── /api/b2b/signals/*    → Signal Service (4129)       │
│  ├── /api/b2b/sequences/*  → Outbound Service (4130)     │
│  ├── /api/b2b/deals/*      → Deal Intelligence (4131)    │
│  ├── /api/b2b/activities/* → Activity Service (4132)      │
│  ├── /api/b2b/notes/*      → Meeting Notes (4133)        │
│  ├── /api/b2b/mapping/*    → Buyer Mapping (4134)         │
│  ├── /api/b2b/templates/*  → Personalization (4135)      │
│  ├── /api/b2b/ai-updates/* → AI CRM Updates (4136)       │
│  └── /api/b2b/pipelines/* → Pipeline Suggestions (4137)   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Unified Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/unified/account/:id` | Complete account view |
| GET | `/api/unified/deal/:id` | Deal with all context |
| GET | `/api/unified/pipeline` | Pipeline overview |
| GET | `/api/unified/outreach/:id` | Outreach summary |

### Service Routes

All B2B service routes are available under `/api/b2b/` prefix:

```
/api/b2b/icps/*
/api/b2b/companies/*
/api/b2b/signals/*
/api/b2b/alerts/*
/api/b2b/sequences/*
/api/b2b/prospects/*
/api/b2b/deals/*
/api/b2b/activities/*
/api/b2b/notes/*
/api/b2b/personas/*
/api/b2b/matrix/*
/api/b2b/templates/*
/api/b2b/pipelines/*
/api/b2b/forecasts/*
```

### Health Checks

| Endpoint | Description |
|----------|-------------|
| GET `/health` | Overall gateway health |
| GET `/health/:service` | Individual service health |

## Response Format

### Unified Account View
```json
{
  "success": true,
  "data": {
    "account": { ... },
    "signals": [...],
    "deals": [...],
    "activities": [...],
    "contacts": [...],
    "insights": {
      "intentLevel": "high",
      "engagementScore": 75,
      "riskLevel": "low",
      "recommendations": [...]
    }
  }
}
```

### Health Response
```json
{
  "status": "healthy",
  "timestamp": "2026-06-02T12:00:00Z",
  "services": [
    { "service": "TAM Builder", "status": "up", "latency": 45 },
    { "service": "Signal Service", "status": "up", "latency": 32 }
  ]
}
```

## Environment Variables

```bash
PORT=4138
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=*

# Service URLs (defaults shown)
TAM_BUILDER_URL=http://localhost:4128
SIGNAL_SERVICE_URL=http://localhost:4129
OUTBOUND_SERVICE_URL=http://localhost:4130
DEAL_INTELLIGENCE_URL=http://localhost:4131
ACTIVITY_SERVICE_URL=http://localhost:4132
MEETING_NOTES_URL=http://localhost:4133
BUYER_MAPPING_URL=http://localhost:4134
PERSONALIZATION_URL=http://localhost:4135
AI_CRM_UPDATES_URL=http://localhost:4136
PIPELINE_SUGGESTIONS_URL=http://localhost:4137
```

## Installation

```bash
cd REZ-b2b-gateway
npm install
npm run dev
```

## Usage Example

```bash
# Get account with all data
curl http://localhost:4138/api/unified/account/acme-123 \
  -H "x-tenant-id: tenant-456"

# Search companies via TAM Builder
curl http://localhost:4138/api/b2b/companies/search?q=acme \
  -H "x-tenant-id: tenant-456"

# Get deal with context
curl http://localhost:4138/api/unified/deal/deal-789 \
  -H "x-tenant-id: tenant-456"
```

## Rate Limits

- Gateway: 1000 requests/minute
- Per-service limits inherited from upstream services

## Integration with Monaco

This gateway provides equivalent functionality to Monaco's unified API:

| Monaco | REZ Gateway |
|--------|-------------|
| Account API | `/api/unified/account/:id` |
| Deal API | `/api/unified/deal/:id` |
| Pipeline API | `/api/unified/pipeline` |
| Health API | `/health` |
