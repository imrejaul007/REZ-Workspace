# RABTUL Technologies

## "Internal AWS + Stripe" - Shared Infrastructure Platform

**Purpose:** Provides shared infrastructure services to ALL companies in the RTNM ecosystem.

**Note:** Part of **RTNM Group** | Division: **RABTUL Technologies**

---

## RABTUL SaaS (Sub-division)

Selling non-REZ merchant software to external businesses:

| Product | Description |
|---------|-------------|
| **tally-integration** | Tally accounting software integration |
| **axomi-bpo** | BPO services |
| **axomi-help** | Help platform |

These products are sold via **RABTUL SaaS** to non-REZ businesses.

---

## RABTUL Economic Layer ⭐ NEW

**6 OS Layers for Complete Commerce Infrastructure:**

| OS | Features | Port | Status |
|----|----------|------|--------|
| **WalletOS** | Multi-currency, Escrow, Transfers | 4004 | ✅ Built |
| **LoyaltyOS** | Points, Tiers, Cross-brand | 4040 | ✅ Built |
| **RewardsOS** | Incentives, Gamification, Badges | 4043 | ✅ Built |
| **ReferralOS** | Tracking, Commission, Payouts | 4041 | ✅ Built |
| **TreasuryOS** | Cash Mgmt, Investments, Forecasting | **4055** | ✅ **NEW** |
| **ReputationOS** | Trust Scores, Reviews | 4050 | ✅ Built |

### TreasuryOS (NEW) Features

```typescript
// Cash Management
POST /api/v1/accounts              // Create account
POST /api/v1/accounts/:id/deposit  // Deposit
POST /api/v1/accounts/:id/withdraw  // Withdraw
POST /api/v1/transfers             // Transfer

// Investments
POST /api/v1/investments           // Create FD/MF/Bonds
POST /api/v1/investments/:id/redeem // Redeem

// Forecasting
POST /api/v1/forecast/:businessId  // 13-week forecast
GET  /api/v1/forecast/:businessId/shortfall  // Predict shortfall
```

### Quick Start - TreasuryOS
```bash
cd REZ-treasury-os
npm install
cp .env.example .env
npm run dev
# Port: 4055
```

---

## ⚠️ IMPORTANT: Read These First

| Document | Purpose | Priority |
|----------|---------|----------|
| **[SOT.md](SOT.md)** | Master reference - complete RTMN ecosystem | READ FIRST |
| **[RAP.md](RAP.md)** | Service registry - what services are available | READ BEFORE CREATING SERVICES |
| **[SERVICE-GOVERNANCE.md](SERVICE-GOVERNANCE.md)** | Rules for using RABTUL services | READ BEFORE CREATING SERVICES |
| **[MIGRATION-GUIDE.md](MIGRATION-GUIDE.md)** | How to migrate existing services | IF MIGRATING |

---

## Core Rule

> **"If RABTUL has it → Use RABTUL. If RABTUL doesn't have it → Request RABTUL to create it."**

---

## Quick Start

### Using RABTUL Services

```typescript
// Payment Example
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com';

const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/initiate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
  },
  body: JSON.stringify({ amount: 1000, currency: 'INR' })
});

// Auth Example
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';

const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
  },
  body: JSON.stringify({ token })
});
```

### Environment Variables

```bash
# Required
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com
INTERNAL_SERVICE_TOKEN=<get-from-rabtul>

# As needed
WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
ORDER_SERVICE_URL=https://rez-order-service-hz18.onrender.com
CATALOG_SERVICE_URL=https://rez-catalog-service-1.onrender.com
SEARCH_SERVICE_URL=https://rez-search-service.onrender.com
NOTIFICATION_SERVICE_URL=https://rez-notifications-service.onrender.com
BOOKING_SERVICE_URL=https://rez-booking-service.onrender.com
DELIVERY_SERVICE_URL=https://rez-delivery-service.onrender.com
PROFILE_SERVICE_URL=https://rez-profile-service.onrender.com
ANALYTICS_SERVICE_URL=https://rez-analytics-service.onrender.com
INSIGHTS_SERVICE_URL=https://rez-insights-service.onrender.com
```

---

## Core Services (10)

| Service | Port | Features | Use Instead Of |
|---------|------|----------|----------------|
| **Auth Service** | 4002 | JWT, OTP, TOTP, MFA, OAuth | Local auth |
| **Payment Service** | 4001 | Razorpay, UPI, Webhooks | Local payments |
| **Wallet Service** | 4004 | Coins, Balance, Loyalty | Local wallet |
| **Order Service** | 4006 | Order Lifecycle, State Machine | Local order |
| **Catalog Service** | 4007 | Products, Inventory | Local catalog |
| **Search Service** | 4008 | Full-text, Autocomplete | Local search |
| **Notifications** | 4011 | Push, SMS, Email, WhatsApp | Local notifications |
| **Booking Service** | 4020 | Reservations | Local booking |
| **Delivery Service** | 4009 | Driver tracking | Local delivery |
| **Profile Service** | 4013 | User profiles | Local profile |

---

## Infrastructure Services (10)

| Service | Port | Features |
|---------|------|----------|
| **API Gateway** | 4000 | Routing, Rate limiting |
| **Circuit Breaker** | 4030 | Fault tolerance |
| **Retry Service** | 4031 | Exponential backoff |
| **DLQ Service** | 4032 | Dead letter queue |
| **Idempotency** | 4033 | Deduplication |
| **Policy Engine** | 4034 | Access control |
| **Secrets Manager** | 4035 | Encryption |
| **Scheduler** | 4038 | Cron jobs |
| **Analytics** | 4016 | Dashboards |
| **Insights** | 4017 | BI |

---

## Companies Using RABTUL

| Company | Git Repo | Services Used |
|---------|----------|--------------|
| REZ Commerce | `REZ-Commerce/` | All 10 |
| REZ Intelligence | `REZ-Intelligence/` | Auth, Analytics |
| REZ Media | `REZ-Media/` | Payment, Notifications |
| StayOwn | `StayOwn-Hospitality/` | All services |
| CorpPerks | `CorpPerks/` | Payment, Auth |
| REZ Merchant | `REZ-Merchant/` | All services |
| RTMN Finance | `RTNM-Group/` | All services |

---

## Documentation

| Document | Purpose |
|----------|---------|
| **SOT.md** | Master reference - complete ecosystem |
| **RAP.md** | Service registry |
| **SERVICE-GOVERNANCE.md** | Governance rules |
| **MIGRATION-GUIDE.md** | Migration instructions |
| **COMPANIES-AUDIT.md** | Company audit results |
| **COMPREHENSIVE-AUDIT.md** | Full audit report |
| **FINAL-AUDIT-REPORT.md** | Final results |
| **COMPLETION-REPORT.md** | Current status |

---

## Support

- **Slack:** `#rabtul-support`
- **GitHub Issues:** `RABTUL-Technologies/issues`
- **On-Call:** 24/7 for production issues

---

## Metrics

| Metric | Value |
|--------|-------|
| Companies | 8 |
| RABTUL Services | 20 |
| Files Migrated | 40+ |
| RABTUL Connections | 161 |
| Compliance | 100% |

---

**Last Updated:** May 13, 2026
**Owner:** RABTUL Technologies
