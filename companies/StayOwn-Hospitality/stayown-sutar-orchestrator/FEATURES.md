# SUTAR Orchestrator - Features

**Company:** StayOwn-Hospitality
**Type:** Orchestration Service
**Port:** 4902
**Status:** ✅ Built

---

## Core Features

### 1. Procurement Orchestration
- [x] Trust validation
- [x] Contract generation
- [x] Negotiation handling
- [x] Payment orchestration
- [x] Multi-step tracking

### 2. Pricing Orchestration
- [x] Decision engine integration
- [x] StayBot notification
- [x] Booking system update
- [x] Room Twin update
- [x] Revenue tracking

### 3. Guest Experience Orchestration
- [x] Memory storage
- [x] Learning patterns
- [x] Personalization
- [x] Service enhancement
- [x] Reputation tracking

---

## Orchestration Flow

### Procurement
```
Procurement Agent → Trust → Contract → Negotiation → Payment
     ↓              ↓           ↓           ↓            ↓
   RFQ sent    Score check  Generate   Terms       Settlement
```

### Pricing
```
Dashboard → Decision → StayBot → Booking → Room Twin
    ↓          ↓          ↓        ↓          ↓
  Approve   Auto-eval  Execute  Update    Revenue
                                rates    updated
```

### Guest
```
Guest Event → Memory → Learning → Personalization → Service
     ↓           ↓         ↓            ↓              ↓
   Stay/Order  Store   Patterns    Next visit    Enhanced
                          detected   prepared      experience
```

---

## SUTAR Services

| Service | Purpose |
|---------|---------|
| Gateway | API gateway |
| Contract | Contract generation |
| Decision | Decision engine |
| Negotiation | Negotiation engine |
| Trust | Trust validation |
| Memory | Memory bridge |
| Flow | Workflow orchestration |
| Reputation | Reputation tracking |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orchestrate/procurement` | Procure |
| POST | `/api/orchestrate/pricing` | Pricing |
| POST | `/api/orchestrate/guest-experience` | Guest |
| GET | `/api/orchestrations` | List all |
| GET | `/api/orchestrations/:id` | Details |
| GET | `/api/contracts` | Contracts |
| GET | `/api/trust/:entityId` | Trust |

---

## Story Coverage

| Chapter | Description | Status |
|---------|------------|--------|
| Ch 18 | "Sutar orchestrates everything" | ✅ |

---

**Last Updated:** June 14, 2026
