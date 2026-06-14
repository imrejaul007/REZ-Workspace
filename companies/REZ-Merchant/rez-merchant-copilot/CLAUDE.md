# REZ Merchant Copilot - Documentation

---

## Service Discovery

This service is registered in REZ-Master/services.json.

To discover related services:
```bash
# From REZ-Master directory
node rez-cli find <service-name>  # Find specific service
node rez-cli list --category <category>  # List by category
node rez-cli stats  # Platform statistics
```

Quick search:
- `node rez-cli list --search payment` - Find payment services
- `node rez-cli list --search auth` - Find auth services
- `node rez-cli list --search kds` - Find KDS services
- `node rez-cli list --search ai` - Find AI services

---



**Version:** 2.0.0
**Last Updated:** 2026-05-02

---

## Overview

`REZ Merchant Copilot` is an AI-powered business intelligence service for merchants. It provides real health scores, recommendations, competitor analysis, and operational decisions.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Merchant Copilot                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐     │
│  │  Health Scorer  │    │  Recommendation  │    │  Decision Engine │     │
│  │                 │    │     Engine       │    │                  │     │
│  │ • Order scoring │    │ • Marketing     │    │ • Inventory      │     │
│  │ • Revenue score │    │ • Pricing       │    │ • Reorder      │     │
│  │ • Review score  │    │ • Operations    │    │ • Staffing      │     │
│  │ • Inventory     │    │ • Customer      │    │ • Pricing       │     │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘     │
│           │                         │                       │                  │
│  ┌────────▼─────────────────────────▼───────────────────────▼─────────┐     │
│  │                        Routes & API                                  │     │
│  └──────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────┐
                         │  Merchant Service │
                         │  Order Service   │
                         │  Catalog Service │
                         │  Ad Service     │
                         └──────────────────┘
```

---

## Services

### 1. Health Scorer

Calculates comprehensive health scores based on:
- Order volume trends
- Revenue vs. targets
- Customer retention
- Review ratings
- Inventory health

**Score Components:**
| Component | Weight | Description |
|-----------|--------|-------------|
| Revenue Health | 30% | Revenue vs. target |
| Order Health | 25% | Order volume trends |
| Customer Health | 20% | Retention rate |
| Review Health | 15% | Ratings and feedback |
| Inventory Health | 10% | Stockout rate |

### 2. Recommendation Engine

Generates actionable recommendations based on:
- Real-time metrics
- Market trends
- Competitor analysis
- Customer behavior

**Recommendation Types:**
- **Marketing:** Promotions, campaigns, ads
- **Pricing:** Price optimization, bundling
- **Inventory:** Reorder suggestions, stock alerts
- **Operations:** Staffing, peak hours
- **Customer:** Retention, win-back

### 3. Competitor Analyzer

Provides competitive intelligence:
- Nearby competitors analysis
- Price gap calculation
- Rating comparison
- Market share estimation

### 4. Decision Engine

Generates actionable decisions:
- Inventory reorder quantities
- Pricing suggestions
- Staffing recommendations
- Demand forecasting

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merchant/:id/profile` | Merchant profile with metrics |
| GET | `/api/merchant/:id/insights` | AI-generated insights |
| GET | `/api/merchant/:id/recommendations` | Actionable recommendations |
| GET | `/api/merchant/:id/health-score` | Comprehensive health score |
| GET | `/api/merchant/:id/decisions` | Operational decisions |
| GET | `/api/merchant/:id/competitors` | Competitor analysis |
| GET | `/api/merchant/:id/trends` | Market trends |
| POST | `/api/merchant/:id/feedback` | Submit decision feedback |

---

## Health Score Response

```json
{
  "merchant_id": "merchant123",
  "health_score": {
    "overall": 85,
    "metrics": {
      "revenue": { "score": 88, "trend": "up", "change": "+12%" },
      "orders": { "score": 82, "trend": "up", "change": "+8%" },
      "retention": { "score": 79, "trend": "stable", "change": "0%" },
      "stockouts": { "score": 91, "trend": "down", "change": "-5%" }
    },
    "risk_level": "low",
    "alerts": []
  }
}
```

---

## Recommendation Response

```json
{
  "merchant_id": "merchant123",
  "recommendations": [
    {
      "id": "rec_123",
      "type": "inventory",
      "title": "Increase chicken stock",
      "description": "Demand up 20% this week",
      "priority": "high",
      "action": "reorder_chicken",
      "expected_impact": "+15% sales"
    }
  ]
}
```

---

## Deployment

```yaml
# render.yaml
services:
  - type: web
    name: rez-merchant-copilot
    env: node
    region: singapore
    buildCommand: npm install
    startCommand: node src/index.js
    healthCheckPath: /health
```

---

## Environment Variables

See `.env.example` for all required service URLs.

---

**Maintained by:** REZ Team
**Repository:** imrejaul007/REZ-merchant-copilot
