# B2B Revenue OS - Service Architecture

**Version:** 1.0.0
**Date:** June 2, 2026
**Status:** Complete

---

## Overview

The B2B Revenue OS provides enterprise-grade sales and marketing intelligence services for the REZ ecosystem. It enables:
- Intent signal detection and analysis
- Deal tracking and management
- Outreach automation
- Activity tracking
- Account-based marketing

---

## Core Services

### Service Inventory (26 Services)

| Service | Purpose | Status |
|---------|---------|--------|
| **REZ-activity-service** | Track user/company activities | ✅ Built |
| **REZ-outbound-service** | Outreach automation | ✅ Built |
| **REZ-signal-service** | Intent signal detection | ✅ Built |
| **REZ-deal-service** | Deal pipeline management | ✅ Built |
| **REZ-buyer-mapping-service** | Buyer persona mapping | ✅ Built |
| **REZ-bnpl-service** | Buy Now Pay Later | ✅ Built |
| **REZ-cross-company-service** | Cross-company data | ✅ Built |
| **REZ-data-enrichment-service** | Data enrichment | ✅ Built |
| **REZ-flagship-service** | Flagship account management | ✅ Built |
| **REZ-governance-service** | Compliance & governance | ✅ Built |
| **REZ-graph-service** | Knowledge graph | ✅ Built |
| **REZ-healthcare-service** | Healthcare vertical | ✅ Built |
| **REZ-home-services** | Home services vertical | ✅ Built |
| **REZ-idempotency-service** | Request idempotency | ✅ Built |
| **REZ-inventory-service** | Inventory management | ✅ Built |
| **REZ-kds-service** | Kitchen display | ✅ Built |
| **REZ-meeting-notes-service** | Meeting intelligence | ✅ Built |
| **REZ-mfa-service** | Multi-factor auth | ✅ Built |
| **REZ-professional-services** | Professional services | ✅ Built |
| **REZ-restaurant-service** | Restaurant vertical | ✅ Built |
| **REZ-retry-service** | Retry handling | ✅ Built |
| **REZ-returns-service** | Returns management | ✅ Built |
| **REZ-reviews-service** | Review management | ✅ Built |
| **REZ-schedule-service** | Scheduling | ✅ Built |
| **REZ-shipping-service** | Shipping integration | ✅ Built |
| **REZ-subscription-service** | Subscriptions | ✅ Built |
| **REZ-sso-service** | Single sign-on | ✅ Built |
| **REZ-table-qr-service** | Table QR management | ✅ Built |

---

## Intent Graph Integration

### REZ-intent-graph (Port 4150)

**Location:** `REZ-Intelligence/rez-intent-graph/`

**Services:**
- `IntentScoringService.ts` - Weighted scoring algorithm
- `IntentCaptureService.ts` - Signal capture
- `IntentCacheService.ts` - Redis caching
- `DormantIntentService.ts` - Dormant account detection
- `VectorSimilarityService.ts` - Semantic similarity
- `CrossAppAggregationService.ts` - Cross-app data

### Intent Signal Flow

```
Signal Sources → Signal Aggregator → Intent Graph → Scoring → Action
     ↓              ↓                   ↓           ↓
  Website     REZ-Signals      REZ-intent-    Intent Score
  Social      REZ-Activity      graph          (0-100)
  CRM         REZ-Outreach     (Port 4150)
  Email       REZ-Deal
```

---

## Architecture

```
                    ┌─────────────────┐
                    │  API Gateway    │
                    │  (RABTUL-B2B)   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ↓                   ↓                   ↓
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Signals   │    │   Deals     │    │  Outreach   │
│   Service   │    │   Service   │    │   Service   │
│   (4129)    │    │   (4131)    │    │   (4130)    │
└─────────────┘    └─────────────┘    └─────────────┘
         ↓                   ↓                   ↓
┌─────────────────────────────────────────────────────┐
│              REZ-Intent-Graph (4150)                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ Scoring │ │ Capture │ │  Cache  │ │  Dormant│ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Activity  │    │  Buyer      │    │   Cross-    │
│  Service   │    │  Mapping    │    │   Company   │
│  (4132)    │    │  Service    │    │   Service   │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## Intent Scoring Algorithm

### Weighted Components

| Component | Weight | Description |
|-----------|--------|-------------|
| Signal Strength | 30% | Quality of intent signals |
| Activity Frequency | 25% | Engagement frequency |
| Content Engagement | 20% | Content consumption |
| Recency | 15% | Time since last activity |
| Outreach Response | 10% | Response to outreach |

### Intent Levels

| Level | Score Range | Action |
|-------|-------------|--------|
| COLD | 0-39 | Nurture |
| WARM | 40-69 | Engage |
| HOT | 70-100 | Prioritize |

### Intent Stages

| Stage | Score Range | Pipeline Stage |
|-------|-------------|----------------|
| NONE | 0-19 | Prospecting |
| AWARENESS | 20-49 | Lead |
| CONSIDERATION | 50-74 | MQL |
| DECISION | 75-89 | SQL |
| PURCHASE | 90-100 | Opportunity |

---

## Signal Types & Weights

| Signal Type | Weight | Source |
|-------------|--------|--------|
| Funding | 0.18 | News/Press |
| Merger | 0.17 | News/Press |
| Executive Change | 0.16 | LinkedIn |
| Job Posting | 0.15 | Company Site |
| Expansion | 0.14 | News |
| Partnership | 0.13 | Press |
| Technology Change | 0.12 | Tech News |
| Regulatory | 0.11 | Government |
| New Hire | 0.10 | LinkedIn |
| Product Launch | 0.09 | Press |

---

## Commands

```bash
# Build all B2B services
cd RABTUL-Technologies
npm run build:services

# Start individual service
cd REZ-signal-service && npm start

# Deploy
npm run deploy:b2b
```

---

**Last Updated:** June 2, 2026
