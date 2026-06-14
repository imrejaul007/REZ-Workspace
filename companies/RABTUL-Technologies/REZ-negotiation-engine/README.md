# REZ Negotiation Engine

**Part of SUTAR OS - Autonomous Economic Infrastructure**

**Port:** 4191
**Company:** RABTUL Technologies

---

## Overview

Negotiation Engine handles RFQ, Quotes, Counter-offers, and Deal acceptance for SUTAR OS.

## Features

- ✅ RFQ (Request for Quote) management
- ✅ Quote creation and tracking
- ✅ Counter-offer workflow
- ✅ Deal acceptance/rejection
- ✅ Multi-party negotiations
- ✅ Event publishing to Event Bus
- ✅ Audit trail
- ✅ Tenant isolation

## API Endpoints

### Negotiations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/negotiations` | Create negotiation |
| GET | `/api/negotiations` | List negotiations |
| GET | `/api/negotiations/:id` | Get negotiation |
| POST | `/api/negotiations/:id/rfq` | Send RFQ |
| POST | `/api/negotiations/:id/quote` | Submit quote |
| POST | `/api/negotiations/:id/counter` | Counter offer |
| POST | `/api/negotiations/:id/accept` | Accept deal |
| POST | `/api/negotiations/:id/reject` | Reject |
| POST | `/api/negotiations/:id/cancel` | Cancel |

### RFQ

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rfq` | Create RFQ |
| GET | `/api/rfq` | List RFQs |
| GET | `/api/rfq/:id` | Get RFQ |
| POST | `/api/rfq/:id/send` | Send RFQ |
| POST | `/api/rfq/:id/respond` | Receive quote |

### Quotes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quotes` | Create quote |
| GET | `/api/quotes` | List quotes |
| GET | `/api/quotes/:id` | Get quote |
| POST | `/api/quotes/:id/send` | Send quote |
| POST | `/api/quotes/:id/accept` | Accept |
| POST | `/api/quotes/:id/reject` | Reject |

## Quick Start

```bash
cd companies/RABTUL-Technologies/REZ-negotiation-engine
npm install
npm run dev
# Port: 4191
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4191 | Service port |
| MONGODB_URI | mongodb://localhost:27017/REZ-negotiation-engine | MongoDB URI |
| NODE_ENV | development | Environment |
| EVENT_BUS_URL | http://localhost:4025 | Event Bus URL |

## Health Endpoints

- `GET /health` - Health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

## Events Published

| Event | Trigger |
|-------|---------|
| negotiation.created | New negotiation |
| negotiation.rfq_sent | RFQ sent |
| negotiation.quote_received | Quote received |
| negotiation.counter_offer | Counter offer |
| negotiation.accepted | Deal accepted |
| negotiation.rejected | Negotiation rejected |

## Architecture

```
NegotiationOS (4191)
    │
    ├── RFQ Service - Request for Quote
    ├── Quote Service - Quote management
    └── Negotiation Service - Full workflow
            │
            └──► Event Bus (4025)
                    │
                    └──► Trust Engine (4050)
                    └──► ContractOS (4190)
```

## Connected Services

| Service | Port | Purpose |
|---------|------|---------|
| Event Bus | 4025 | Messaging |
| Trust Engine | 4050 | Trust verification |
| ContractOS | 4190 | Contract creation |

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
