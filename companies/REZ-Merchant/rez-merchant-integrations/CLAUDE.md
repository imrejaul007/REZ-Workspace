# REZ Merchant Integrations - Documentation

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



**Version:** 1.0.0
**Last Updated:** 2026-05-02

---

## Overview

`rez-merchant-integrations` provides integrations between the ReZ platform and external services:
- **AdBazaar ROI Tracking** - Attribution and campaign performance
- **Aggregator Sync** - Swiggy/Zomato order synchronization
- **Delivery Partners** - Dunzo/Shadowfax integration

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Merchant Integrations Service                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐     │
│  │  AdBazaar ROI   │    │   Aggregator     │    │    Delivery     │     │
│  │    Tracking     │    │   Channel Mgr    │    │    Partners     │     │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘     │
│           │                         │                       │                  │
│  ┌────────▼─────────┐    ┌────────▼─────────┐    ┌────────▼─────────┐     │
│  │  Click/View/    │    │ Swiggy │ Zomato │    │ Dunzo│Shadowfax│     │
│  │  Conversion    │    │   Adapters      │    │    Adapters      │     │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### AdBazaar ROI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ads/track/click` | Track ad click |
| POST | `/api/ads/track/view` | Track ad view |
| POST | `/api/ads/track/conversion` | Track order conversion |
| GET | `/api/ads/campaign/:id/roi` | Get campaign ROI metrics |
| GET | `/api/ads/merchant/:id/performance` | Merchant ad performance |
| POST | `/api/ads/sync` | Sync campaigns from AdBazaar |

### Aggregators

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/aggregators/register` | Register aggregator |
| GET | `/api/aggregators/orders` | Fetch new orders |
| POST | `/api/aggregators/:id/status` | Update order status |
| POST | `/api/aggregators/menu` | Push menu to all |

### Delivery

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/delivery/quotes` | Get delivery quotes |
| POST | `/api/delivery/book` | Book delivery |
| GET | `/api/delivery/:id/track` | Track delivery |
| POST | `/api/delivery/:id/cancel` | Cancel delivery |
| POST | `/api/delivery/webhook/:partner` | Status webhook |

---

## Attribution Flow

```
Ad Impression/Click
       ↓
Track to Device → Store in Redis (7 days for clicks, 24h for views)
       ↓
Order Placed
       ↓
Find Attribution → Click-through (7 days) → View-through (24h)
       ↓
Update Campaign Metrics → Update Merchant Performance → Clear Attribution
```

---

## Aggregator Sync

```
Channel Manager
      ↓
Swiggy Adapter ←→ Zomato Adapter
      ↓
Fetch New Orders (every 60s)
      ↓
Transform to Unified Format
      ↓
Create Local Order → Merchant KDS
```

---

## Deployment

```yaml
services:
  - type: web
    name: rez-merchant-integrations
    env: node
    region: singapore
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /health
```

---

## Environment Variables

See `.env.example` for all required variables.

---

**Maintained by:** REZ Team
