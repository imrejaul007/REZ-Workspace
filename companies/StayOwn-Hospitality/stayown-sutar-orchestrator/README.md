# SUTAR Orchestrator for StayOwn

**Company:** StayOwn-Hospitality
**Type:** Orchestration Service
**Port:** 4902
**Status:** ✅ Built (June 14, 2026)

---

## Overview

SUTAR = Self-organizing Trustworthy Autonomous Relations

This service orchestrates StayOwn operations through SUTAR.

### Tagline
> "Sutar orchestrates everything"

---

## Orchestration Types

### Procurement Orchestration
```
Procurement Agent → SUTAR Trust → Contract → Negotiation → Payment
```

### Pricing Orchestration
```
Dashboard → SUTAR Decision → StayBot → Booking → Room Twin
```

### Guest Experience Orchestration
```
Memory → Learning → Personalization → Service
```

---

## SUTAR Services Connected

| Service | Purpose |
|---------|---------|
| SUTAR Gateway | API gateway |
| SUTAR Contract | Contract generation |
| SUTAR Decision | Decision engine |
| SUTAR Negotiation | Negotiation engine |
| SUTAR Trust | Trust validation |
| SUTAR Memory | Memory bridge |
| SUTAR Flow | Workflow orchestration |
| SUTAR Reputation | Reputation tracking |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orchestrate/procurement` | Orchestrate procurement |
| POST | `/api/orchestrate/pricing` | Orchestrate pricing |
| POST | `/api/orchestrate/guest-experience` | Orchestrate guest experience |
| GET | `/api/orchestrations` | List all orchestrations |
| GET | `/api/orchestrations/:id` | Get orchestration details |
| GET | `/api/contracts` | List SUTAR contracts |
| GET | `/api/trust/:entityId` | Get trust score |

---

## Quick Start

```bash
cd stayown-sutar-orchestrator
npm install
npm run dev
```

---

## Story Coverage

| Chapter | Description | Status |
|---------|------------|--------|
| Ch 18 | "Sutar orchestrates everything" | ✅ Working |

---

**Last Updated:** June 14, 2026
