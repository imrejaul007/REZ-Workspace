# HOJAI AI - Complete Documentation

**Version:** 1.1 | **Date:** June 1, 2026

---

## ARCHITECTURE

```
HOJAI AI (PARENT COMPANY)
│
├── HOJAI CORE (12 Platforms, 4500-4610)
├── HOJAI ML PLATFORM (10 Services, 4710-4742)
├── HOJAI INTELLIGENCE (Commercial, 4750-4754)
├── REZ INTELLIGENCE (Privileged Tenant, 3000-4300)
├── GENIE (Personal AI, 4702-4709)
├── AI EMPLOYEES (150+, 4755-4900)
├── UNIFIED PLATFORM (WhatsApp+Support+Commerce, 4850)
├── TRAINING PIPELINE (Continuous Learning, 4880)
└── AdBazaar INTEGRATION (4722)
```

---

## TWO INTELLIGENCE LAYERS

| Intelligence | Type | Target | Ports |
|-------------|------|--------|-------|
| **HOJAI Intelligence** | Commercial | External businesses | 4750-4754 |
| **REZ Intelligence** | Privileged Tenant | REZ ecosystem | 3000-4300 |
| Both built ON | HOJAI CORE | Infrastructure | 4500-4610 |

---

## PORT REGISTRY

### HOJAI CORE (4500-4610)

| Port | Service | Purpose |
|------|---------|---------|
| 4500 | API Gateway | Routing, auth, rate limiting |
| 4501 | Governance | RBAC, audit, permissions |
| 4510 | Event Bus | Event streaming |
| 4515 | Signal | Signal processing |
| 4517 | HITL | Human-in-the-loop |
| 4518 | Trust | Trust scoring |
| 4519 | Bridge | REZ integration |
| 4520 | Memory | Vector store, customer memory |
| 4530 | Intelligence | ML predictions |
| 4540 | ML | Model registry |
| 4550 | Agents | Autonomous agents |
| 4560 | Workflows | Automation |
| 4570 | Communications | WhatsApp, SMS, Email |
| 4580 | Hyperlocal | Geo intelligence |
| 4590 | Data | Data platform |
| 4600 | Identity | User identity |
| 4610 | Analytics | BI, dashboards |

### HOJAI INTELLIGENCE (4750-4754)

| Port | Service | Purpose |
|------|---------|---------|
| 4750 | Commerce Intelligence | E-commerce AI |
| 4751 | Merchant Intelligence | Business AI |
| 4752 | Customer Intelligence | Customer 360 |
| 4753 | Marketing Intelligence | Campaigns |
| 4754 | Financial Intelligence | Finance AI |

### GENIE (4702-4709)

| Port | Service | Purpose |
|------|---------|---------|
| 4702 | Relationship | Relationship tracking |
| 4703 | Memory Service | Personal memory |
| 4704 | Briefing | Daily briefings |
| 4706 | Privacy | Privacy controls |
| 4708 | Project Service | Project tracking |
| 4709 | Privacy Service | Data rights |

### UNIFIED PLATFORM (4850)

| Port | Service | Purpose |
|------|---------|---------|
| 4850 | Unified Platform | WhatsApp + Support + Commerce |

### AdBazaar INTEGRATION (4722)

| Port | Service | Purpose |
|------|---------|---------|
| 4721 | CorpPerks Bridge | CorpPerks ↔ AdBazaar |
| 4722 | HOJAI Bridge | AdBazaar ↔ HOJAI (NEW) |

### TRAINING (4880)

| Port | Service | Purpose |
|------|---------|---------|
| 4880 | Training Pipeline | Batch model training |
| 4881 | Self-Learning | Real-time memory updates |
| 4890 | Training Connector | REZ ↔ HOJAI bridge |
| 4891 | Continuous Learning | Learn from everything |

### AI EMPLOYEES (150+)

| Port Range | Count | Purpose |
|-----------|-------|---------|
| 4755-4799 | 50+ | Commercial employees |
| 4800-4899 | 100+ | Industry-specific employees |

---

## KEY SERVICES BUILT

### HOJAI Intelligence (5 services)

- hojai-commerce-intelligence
- hojai-merchant-intelligence
- hojai-customer-intelligence
- hojai-marketing-intelligence
- hojai-financial-intelligence

### GENIE (5 services)

- genie-memory-service
- genie-relationship-service
- genie-briefing-service
- genie-project-service
- genie-privacy-service

### UNIFIED PLATFORM

- WhatsApp + Web Chat
- Support Tickets
- Commerce (Products, Cart, Orders)
- AI Brain (Intent routing)

### TRAINING PIPELINE

- Learn from chat
- Learn from signals
- Learn from corrections
- Learn from feedback

---

## QUICK START

```bash
cd hojai-ai

# Deploy all services
./deploy/start-all.sh deploy

# Check health
./deploy/start-all.sh health

# View logs
./deploy/start-all.sh logs
```

---

## IMPORTANT CONCEPTS

1. **HOJAI CORE** = Infrastructure (don't duplicate)
2. **HOJAI Intelligence** = Commercial tenant
3. **REZ Intelligence** = Privileged tenant (built ON CORE)
4. **GENIE** = Personal AI for individuals
5. **AI Employees** = Commercial workers for businesses

---

## FILE PATTERNS

| Pattern | Use |
|---------|-----|
| `src/index.ts` | Service entry point |
| `src/routes/` | Express routes |
| `src/services/` | Business logic |
| `src/models/` | MongoDB/Mongoose |
| `src/types/` | TypeScript + Zod |
| `src/middleware/` | Auth, tenant, logging |
| `src/utils/` | Helpers, logger |
| `tests/*.test.ts` | Unit tests |

---

## TENANT ISOLATION

All services use `X-Tenant-Id` header for multi-tenant isolation.

```typescript
import { tenantMiddleware } from './middleware/tenant';
app.use(tenantMiddleware);
```

---

## LEARNING SYSTEM

```typescript
import { learn } from '@hojai/learning';

learn.fromChat({ query, response });
learn.fromSignal({ action, outcome });
learn.fromCorrection({ wrong, right });
```
