# Atlas Intelligence Competitor

**Port:** 5320 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

Competitor monitoring and market analysis. Track competitors, market share, and positioning.

## Features

- **Market Share Tracking** - Monitor market position
- **Feature Comparison** - Compare offerings
- **Pricing Analysis** - Track competitor pricing
- **SWOT Analysis** - Strengths, weaknesses, opportunities, threats

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/competitors` | List competitors |
| GET | `/api/competitors/:id` | Get competitor details |
| GET | `/api/market-share` | Get market share data |

## Quick Start

```bash
cd atlas-intelligence-competitor
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5320/health
```

## Response Example

```json
{
  "competitors": [
    {
      "name": "Competitor A",
      "marketShare": 35,
      "strengths": ["Pricing", "Reach"],
      "weaknesses": ["Technology"]
    }
  ]
}
```
