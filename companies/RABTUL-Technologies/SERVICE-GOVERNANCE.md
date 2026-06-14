# RTMN Service Governance Rules
## Rules for Service Creation and RABTUL Integration

**Version:** 1.0
**Effective Date:** May 12, 2026
**Owner:** RTMN Digital / RABTUL Technologies

---

## CORE PRINCIPLES

### 1. Don't Repeat Yourself (DRY) for Infrastructure

> **"Every service in RTMN ecosystem should exist exactly once."**

- RABTUL Technologies owns ALL shared infrastructure
- Individual companies own business logic only
- If RABTUL has it → Use it. Don't recreate it.

### 2. Service Ownership Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│ SERVICE OWNERSHIP                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐         ┌─────────────────┐                │
│  │    RABTUL       │         │   Individual     │                │
│  │  TECHNOLOGIES   │         │   COMPANIES      │                │
│  ├─────────────────┤         ├─────────────────┤                │
│  │ Infrastructure  │         │ Business Logic  │                │
│  │ - Auth          │         │ - Domain Rules  │                │
│  │ - Payments      │         │ - UI/UX         │                │
│  │ - Wallet        │         │ - Industry Feat │                │
│  │ - Order         │         │ - Integration    │                │
│  │ - Search        │         │                 │                │
│  │ - Notifications │         │                 │                │
│  │ - Analytics     │         │                 │                │
│  │ - Delivery      │         │                 │                │
│  │ - Booking       │         │                 │                │
│  │ - Catalog       │         │                 │                │
│  │ - Profile       │         │                 │                │
│  └────────┬────────┘         └────────┬────────┘                │
│           │                           │                           │
│           │    RABTUL PROVIDES       │                           │
│           └──────────┬──────────────┘                           │
│                      │                                           │
│                      ▼                                           │
│           ┌─────────────────────┐                               │
│           │  ALL 8 COMPANIES   │                               │
│           │  CONSUME FROM RABTUL │                               │
│           └─────────────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## MANDATORY RULES

### Rule 1: Check RAP Before Creating ANY Service

**Before creating a new service:**

1. Open [RAP.md](RAP.md)
2. Search for the service you need
3. If found → Use RABTUL's service
4. If NOT found → Request RABTUL to create it

**Penalty for violation:** Service must be migrated to RABTUL within 30 days

---

### Rule 2: All External APIs Must Route Through RABTUL

```
❌ WRONG: Company creates own payment integration
   Company → Razorpay Direct

✅ CORRECT: Company uses RABTUL Payment Service
   Company → RABTUL Payment Service → Razorpay
```

**Benefits:**
- Single point of payment compliance
- Unified webhook handling
- Consistent audit logging
- Centralized fraud detection

---

### Rule 3: Service-to-Service Communication

All inter-company and company-to-RABTUL communication MUST use:

```
Header: X-Internal-Token: <shared-token>
Header: X-Service-Name: <company-service>
```

---

## SERVICE CATEGORIES

### Category A: RABTUL Owned (Infrastructure)

Companies MUST use these from RABTUL:

| Service | Purpose | Companies Can Create? |
|---------|---------|----------------------|
| `rez-auth-service` | User authentication | ❌ NO |
| `rez-payment-service` | Payment processing | ❌ NO |
| `rez-wallet-service` | Coin/balance management | ❌ NO |
| `rez-order-service` | Order lifecycle | ❌ NO |
| `rez-catalog-service` | Product catalog | ❌ NO |
| `rez-search-service` | Full-text search | ❌ NO |
| `rez-notifications-service` | Push/SMS/Email | ❌ NO |
| `rez-analytics-service` | Dashboards/reports | ❌ NO |
| `rez-insights-service` | BI/Analytics | ❌ NO |
| `rez-profile-service` | User profiles | ❌ NO |
| `rez-booking-service` | Reservations | ❌ NO |
| `rez-delivery-service` | Delivery tracking | ❌ NO |
| `REZ-circuit-breaker` | Fault tolerance | ❌ NO |
| `REZ-dlq-service` | Dead letter queue | ❌ NO |
| `REZ-idempotency-service` | Deduplication | ❌ NO |
| `REZ-retry-service` | Retry logic | ❌ NO |
| `REZ-policy-engine` | Access control | ❌ NO |
| `REZ-secrets-manager` | Secrets storage | ❌ NO |
| `REZ-scheduler-service` | Cron jobs | ❌ NO |
| `REZ-flagship-service` | Feature flags | ❌ NO |

### Category B: Company Owned (Business Logic)

Companies CAN create these for their specific domain:

| Company | Can Create | Examples |
|---------|------------|----------|
| REZ Commerce | Industry features | Food delivery app, QR ordering |
| REZ Media | Ad features | Campaign manager, Targeting engine |
| StayOwn | Hotel features | PMS integration, Channel manager |
| CorpPerks | Enterprise features | HR integration, Procurement workflow |
| REZ Intelligence | AI features | ML models, Intent prediction |
| RTMN Finance | Financial products | BNPL logic, Credit scoring |

### Category C: Shared Ownership

These require RABTUL approval:

| Service | When Allowed |
|---------|-------------|
| Industry-specific auth | Only if RABTUL auth doesn't support domain requirement |
| Specialized payments | Only if RABTUL payment doesn't support payment type |
| Custom analytics | Only if RABTUL analytics doesn't meet reporting needs |

---

## SERVICE REQUEST WORKFLOW

### For New RABTUL Services

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Check RAP.md                                                │
│    Does the service exist?                                      │
└────────────────────────┬──────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │                      │
             YES                     NO
              │                      │
              ▼                      ▼
┌─────────────────────┐    ┌─────────────────────────────────┐
│ 2. Use RABTUL      │    │ 2. Submit Service Request       │
│    Service          │    │    to RABTUL Platform Team     │
└─────────────────────┘    └──────────────┬──────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────────┐
                              │ 3. RABTUL Review        │
                              │    - Technical review   │
                              │    - Architecture check  │
                              │    - SLA definition      │
                              └───────────┬─────────────┘
                                          │
                              ┌───────────┴───────────┐
                              │                       │
                           APPROVED                REJECTED
                              │                       │
                              ▼                       ▼
                 ┌─────────────────────┐    ┌────────────────────┐
                 │ 4. RABTUL Creates  │    │ 4. Explain why    │
                 │    Service         │    │    and suggest    │
                 │    and adds to RAP │    │    alternatives   │
                 └─────────────────────┘    └────────────────────┘
```

---

## EXCEPTION PROCESS

### When to Request Exception

Only for:
1. **Regulatory Requirements** - Specific compliance needs
2. **Latency-Critical Paths** - Microseconds matter
3. **Unique Domain Logic** - Not general infrastructure

### Exception Request Template

```markdown
## Exception Request: [Service Name]

### Company
[Company Name]

### Proposed Service
[Service Description]

### Why RABTUL Cannot Support
[Technical justification]

### Proposed Integration
[How it will still connect to RABTUL]

### Timeline
[Expected duration]

### Approval Required From
- [ ] RABTUL CTO
- [ ] RTMN Digital CTO
```

---

## AUDIT PROCESS

### Weekly: RABTUL Service Usage Audit

```bash
# Check for duplicate services
grep -r "authService\|paymentService\|walletService" \
  --include="*.ts" \
  --include="*.js" \
  REZ-Commerce/ REZ-Intelligence/ REZ-Media/ \
  StayOwn-Hospitality/ CorpPerks/ 2>/dev/null | \
  grep -v node_modules | \
  grep -v RABTUL-Technologies
```

### Monthly: Architecture Review

RABTUL reviews:
1. All new service creations
2. Exception requests
3. Service usage patterns
4. Performance metrics

### Quarterly: Full Ecosystem Audit

Complete review of:
1. Service ownership boundaries
2. RAP accuracy
3. Governance rule compliance
4. Cost allocation

---

## VIOLATIONS & PENALTIES

### Level 1: Warning
- **Cause:** Creating Category A service without approval
- **Action:** Immediate migration required
- **Timeline:** 30 days

### Level 2: Governance Review
- **Cause:** Repeated Level 1 violations
- **Action:** Team review with RTMN Digital
- **Timeline:** 14 days

### Level 3: Compliance Block
- **Cause:** Refusing to migrate after Level 1
- **Action:** Service blocked from deployment
- **Timeline:** Immediate

---

## GOVERNANCE CONTACTS

| Role | Name | Responsibility |
|------|------|----------------|
| RABTUL CTO | - | Service architecture decisions |
| RTMN Digital CTO | - | Cross-company governance |
| Service Registry Owner | - | RAP.md maintenance |
| Compliance Officer | - | Violation tracking |

---

## APPENDIX: CURRENT VIOLATIONS

### Companies with Duplicate Services (Must Migrate)

| Company | Duplicate Service | RAP Equivalent | Deadline |
|---------|-------------------|----------------|----------|
| StayOwn | `auth.service.ts` | `rez-auth-service` | Jun 12, 2026 |
| StayOwn | `razorpay.service.ts` | `rez-payment-service` | Jun 12, 2026 |
| REZ-Media | `adBazaar/src/lib/razorpay.ts` | `rez-payment-service` | Jun 12, 2026 |
| CorpPerks | `razorpayCardService.ts` | `rez-payment-service` | Jun 12, 2026 |
| REZ-Merchant | `authServiceClient.ts` | `rez-auth-service` | Jun 12, 2026 |
| REZ-Commerce | Local auth in apps | `rez-auth-service` | Jun 12, 2026 |

---

## APPROVAL

This governance document requires approval from:
- [ ] RABTUL Technologies CTO
- [ ] RTMN Digital CTO
- [ ] All 8 Company CEOs

**Effective Date:** Upon all approvals

---

*Last Updated: May 12, 2026*
*Next Review: August 12, 2026*
