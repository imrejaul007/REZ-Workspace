# HOJAI-AI - Developer Guide

**Version:** 2.0.0
**Updated:** June 1, 2026

---

## OVERVIEW

HOJAI-AI is an AI company that provides AI infrastructure services.

HOJAI-AI is INDEPENDENT from other companies like RABTUL, REZ-Intelligence, AdBazaar, etc.

---

## HOJAI-AI SERVICES

HOJAI-AI provides AI infrastructure that any company can use:

### HOJAI CORE (4500-4599)

| Port | Service | Purpose |
|------|---------|---------|
| 4500 | hojai-api-gateway | API Gateway |
| 4501 | hojai-governance | RBAC, Audit, Policy |
| 4510 | hojai-event | Event Bus |
| 4520 | hojai-memory | Vector Store, Customer Memory |
| 4530 | hojai-intelligence | ML predictions |
| 4550 | hojai-agents | AI Agent Runtime |
| 4560 | hojai-workflow | Flow Builder |
| 4570 | hojai-communications | WhatsApp, SMS, Email |
| 4580 | hojai-hyperlocal | Geo Intelligence |
| 4580 | hojai-analytics | Insights |
| 4590 | hojai-data | Feature Store |

### HOJAI OTHER SERVICES

| Service | Purpose |
|---------|---------|
| hojai-mlops | MLOps platform |
| hojai-unified-platform | Unified platform |
| hojai-llm | LLM management |
| hojai-vector | Vector store |
| hojai-flow-app | Flow app |
| hojai-studio | AI studio |
| hojai-agent-marketplace | Agent marketplace |

---

## RELATIONSHIP WITH OTHER COMPANIES

HOJAI-AI is INDEPENDENT from:

- RABTUL-Technologies (core platform)
- REZ-Intelligence (AI/ML services)
- AdBazaar (advertising)
- Axom (life AI)
- All other companies

HOJAI-AI can be USED BY other companies for AI infrastructure, but is NOT their parent.

---

## INTEGRATION

### Use RABTUL Services

HOJAI-AI can integrate with RABTUL for core platform services:

```typescript
AUTH_SERVICE_URL=http://localhost:4002
PAYMENT_SERVICE_URL=http://localhost:4001
WALLET_SERVICE_URL=http://localhost:4004
```

---

## SECURITY

- Never commit `.env` files
- Use Zod for input validation
- All service-to-service calls require authentication

---

## LAST UPDATED

**Date:** June 1, 2026
**Version:** 2.0.0
