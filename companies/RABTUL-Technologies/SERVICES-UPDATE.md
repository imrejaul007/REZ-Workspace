# RABTUL - Existing Services + Upgrade Plan

**Date:** May 15, 2026

---

## EXISTING SERVICES AUDIT

### ✅ Already Built

| Service | Status | What It Does |
|---------|---------|--------------|
| `rez-auth-service` | ✅ Production | JWT, OTP, TOTP, OAuth |
| `REZ-ab-testing` | ✅ Basic | Feature flags, experiments |
| `REZ-observability-platform` | ⚠️ Basic | Needs upgrade |
| `REZ-workflow-builder` | ⚠️ Basic | Needs integrations |
| `api-gateway` | ✅ Good | Rate limiting, routing |
| `rez-profile-service` | ✅ Good | User profiles, features |
| `REZ-cod-intelligence` | ✅ Good | Fraud detection |
| `REZ-circuit-breaker` | ✅ Good | Fault tolerance |
| `REZ-retry-service` | ✅ Good | Retry logic |
| `REZ-idempotency-service` | ✅ Good | Deduplication |
| `REZ-policy-engine` | ✅ Basic | RBAC |

---

## UPGRADE PLAN

### Phase 1: Use Existing + Integrate

#### 1. Connect REZ-ab-testing → All Services

```typescript
// Use existing feature flags across services
import { checkFeature } from '@rez/ab-testing';

// Before creating new flag service
const enabled = await checkFeature('new-checkout', userId);
```

#### 2. Connect REZ-workflow-builder → Notifications

```typescript
// Use existing workflow builder for journeys
import { WorkflowClient } from '@rez/workflow-builder';
const workflow = new WorkflowClient({ url: process.env.WORKFLOW_BUILDER_URL });
await workflow.trigger('welcome_series', { userId });
```

#### 3. Connect REZ-observability → Prometheus/Grafana

```typescript
// Upgrade basic observability
import { metricsClient } from '@rez/observability';
metricsClient.increment('checkout.success', { userId });
```

---

## INTEGRATION CHECKLIST

### Services Already Built

| Service | Port | Use Instead Of |
|---------|------|---------------|
| REZ-ab-testing | 4045 | Feature flags |
| REZ-workflow-builder | 4045 | Journey automation |
| REZ-observability | 4025 | Metrics, logs |
| REZ-cod-intelligence | 4044 | Fraud ML |
| REZ-ai-agent-studio | 4046 | AI workflows |
| REZ-data-aggregator | 4058 | ETL pipelines |

---

## GAPS TO FILL

### What We Need (Not Built Yet)

| Gap | Priority | Use Existing |
|-----|----------|-------------|
| Multi-currency | High | - |
| Social login | Done | Google OAuth |
| Subscription billing | Medium | - |
| Vector search | High | - |
| Journey builder | Done | REZ-workflow-builder |
| Feature flags | Done | REZ-ab-testing |
| Observability | Done | Prometheus/Grafana |

---

## NEXT STEPS

1. **Use REZ-workflow-builder** for notifications journey
2. **Use REZ-ab-testing** for feature flags
3. **Use REZ-observability** for metrics
4. **Build multi-currency wallet
5. **Build subscription billing
6. **Build vector search
