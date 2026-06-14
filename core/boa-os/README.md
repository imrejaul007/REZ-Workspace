# BOA Multi-Executive Runtime

**Service:** BOA OS  
**Port:** 3017  
**Type:** Multi-Executive Intelligence Platform

---

## Overview

BOA OS (Board of Advisors Operating System) provides a multi-executive intelligence platform with specialized AI engines for each C-suite function. It coordinates decisions across CEO, CFO, COO, CMO, CHRO, and CRO perspectives.

## Executive Engines

| Executive | Focus | Capabilities |
|-----------|-------|-------------|
| **CEO** | Strategy, Vision | Competitive position, risk assessment, board topics |
| **CFO** | Finance, Compliance | Revenue, costs, cash flow, tax optimization |
| **COO** | Operations | Supply chain, process optimization, capacity |
| **CMO** | Marketing | CAC, LTV, channel performance, brand |
| **CHRO** | People | Talent, compensation, culture, workforce planning |
| **CRO** | Revenue | Sales pipeline, forecast, territory analysis |

## Quick Start

```bash
# Install dependencies
cd core/boa-os
npm install

# Start service
npm start

# Health check
curl http://localhost:3017/health

# Create session
curl -X POST http://localhost:3017/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"companyId": "company_123"}'

# Full analysis
curl -X POST http://localhost:3017/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"data": {"revenue": {"growth": 15}, "financial": {}}}'

# Query specific executive
curl -X POST http://localhost:3017/api/query/ceo \
  -H "Content-Type: application/json" \
  -d '{"data": {}}'
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/sessions` | Create analysis session |
| GET | `/api/sessions/:id` | Get session |
| POST | `/api/analyze` | Full multi-executive analysis |
| POST | `/api/query/:executive` | Query specific executive |
| GET | `/api/insights/:id` | Get stored insight |
| POST | `/api/priorities` | Get priority actions |
| POST | `/api/risks` | Get consolidated risks |
| GET | `/api/metrics` | Service metrics |

## Docker

```bash
# Build and run
docker build -t rtmn/boa-os .
docker run -p 3017:3017 rtmn/boa-os
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3017 | Service port |

---

*Part of RTMN Core Platform*
