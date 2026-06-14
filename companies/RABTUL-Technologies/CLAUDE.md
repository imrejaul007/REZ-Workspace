# RABTUL-Technologies - Developer Guide

**Version:** 6.0.0
**Updated:** June 13, 2026
**Status:** ✅ PRODUCTION READY - All Services Complete (178+ Services)

---

## OVERVIEW

RABTUL-Technologies provides core platform services for the entire REZ ecosystem. It is **INDEPENDENT** from HOJAI-AI, REZ-Intelligence, AdBazaar, Axom, and all other companies.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RABTUL Technologies                                        │
│                    (Core Platform Services)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┬─────────────────────┐
        ▼                     ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Core APIs   │   │Infrastructure │   │Economic Layer│   │Ecosystem Svcs│
│   4001-4030  │   │   4031-4060  │   │   4040-4060  │   │   4061+     │
└───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘
```

---

## ECONOMIC LAYER ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RABTUL Technologies - Economic Layer                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  WalletOS      │  LoyaltyOS      │  RewardsOS      │  ReferralOS           │
│  ───────────   │  ───────────    │  ───────────    │  ───────────          │
│  • Multi-curr  │  • Points       │  • Incentives   │  • Tracking           │
│  • Escrow      │  • Tiers        │  • Gamification  │  • Commission         │
│  • Transfers   │  • Cross-brand  │  • Badges       │  • Payouts            │
├────────────────┼─────────────────┼─────────────────┼───────────────────────┤
│  TreasuryOS ⭐  │  ReputationOS   │                 │                       │
│  ───────────   │  ───────────    │                 │                       │
│  • Cash Mgmt   │  • Trust Scores │                 │                       │
│  • Investments │  • Reviews      │                 │                       │
│  • Forecasting │  • Social Proof │                 │                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CORE SERVICES

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| 4000 | api-gateway | API Gateway | ✅ Built |
| 4001 | rez-payment-service | Payments, Razorpay, UPI | ✅ Built |
| 4002 | rez-auth-service | Auth, OTP, OAuth | ✅ Built |
| 4004 | rez-wallet-service | Coins, Balance | ✅ Built |
| 4006 | rez-order-service | Orders | ✅ Built |
| 4007 | rez-catalog-service | Products, Inventory | ✅ Built |
| 4008 | rez-search-service | Search | ✅ Built |
| 4009 | rez-delivery-service | Delivery | ✅ Built |
| 4011 | rez-notifications-service | Push, SMS | ✅ Built |
| 4013 | rez-profile-service | Profiles | ✅ Built |
| 4016 | rez-analytics-service | Analytics | ✅ Built |
| 4019 | rez-referral-os | Referrals | ✅ Built |
| 4020 | rez-booking-service | Bookings | ✅ Built |

---

## ECONOMIC LAYER SERVICES

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| **4055** | **REZ-treasury-os** | Cash Management, Investments, Forecasting | ✅ **NEW** |
| 4040 | REZ-unified-loyalty | Points, Tiers, Cross-brand | ✅ Built |
| 4041 | rez-referral-os | Commission, Payouts | ✅ Built |
| 4042 | REZ-multi-currency | Multi-currency support | ✅ Built |
| 4043 | rez-rewards | Gamification, Badges | ✅ Built |
| 4050 | rabtul-trust-engine | Trust scores | ✅ Built |

---

## INFRASTRUCTURE SERVICES

| Port | Service | Purpose |
|------|---------|---------|
| 4030 | REZ-circuit-breaker | Fault tolerance |
| 4031 | REZ-retry-service | Retry service |
| 4033 | REZ-idempotency-service | Idempotency |
| 4034 | REZ-rate-limiter | Rate limiting |
| 4035 | REZ-cache-service | Caching |
| 4036 | REZ-health-check | Health monitoring |
| 4037 | REZ-audit-log | Audit logging |

---

## STARTING SERVICES

### Start All Core Services
```bash
# From root directory
npm run dev --workspaces --if-present

# Or individually:
cd REZ-auth-service && npm run dev
cd REZ-wallet-service && npm run dev
cd REZ-payment-service && npm run dev
```

### Start Economic Layer
```bash
cd REZ-treasury-os && npm run dev    # Cash, Investments, Forecasting, ML, FX
cd REZ-unified-loyalty && npm run dev
cd rez-referral-os && npm run dev
```

---

## HEALTH CHECKS

| Service | URL |
|---------|-----|
| Auth | http://localhost:4002/health |
| Wallet | http://localhost:4004/health |
| Payment | http://localhost:4001/health |
| Treasury | http://localhost:4055/health |

---

## SECURITY AUDIT (June 13, 2026)

### All 84 Issues Fixed ✅

| Category | Issues | Status |
|----------|--------|--------|
| Critical | 22 → 0 | ✅ Fixed |
| Major | 31 → 0 | ✅ Fixed |
| Minor | 31 → 0 | ✅ Fixed |

### Key Fixes Applied

| Issue | Fix |
|-------|-----|
| Python syntax in TS | `os.getenv()` → `process.env` |
| XSS vulnerabilities | `innerHTML` → `textContent` |
| Hardcoded credentials | Grafana admin → env vars |
| Missing auth middleware | Added to buyer-mapping, home-services |
| Insecure CORS | `*` → explicit whitelist |
| Redis KEYS command | → Set-based approach |
| Infinite loops | Proper retry/failure limits |

---

## TREASURYOS - COMPLETE

### Features

#### Cash Management
- Multi-Account Management (master, operating, reserve, escrow)
- Cash Pooling & Sweeps
- Real-time Position Tracking
- Transaction Audit Trail
- Fund Reservations

#### Investment Tracking
- Fixed Deposits, Mutual Funds, Bonds
- Mark-to-Market Updates
- Auto-Renewal at Maturity
- TDS Tracking

#### Forecast Optimization
- 13-Week Rolling Forecast
- Shortfall Prediction (4-week lookahead)
- Recovery Action Recommendations
- Variance Analysis

#### ML Forecasting (HOJAI AI)
- Seasonal Pattern Detection
- Anomaly Detection
- AI-powered Insights
- Confidence Scoring

#### Bank Statement Import
- CSV Parsing (HDFC, ICICI, SBI, Axis, Yes Bank)
- Auto-Categorization
- Duplicate Detection

#### FX Hedging
- Forward Contracts
- FX Options
- VaR Calculation (95%, 99%)
- Auto-Hedging Strategies

### API Endpoints (50+)

```
# Cash Management (8 routes)
POST   /api/v1/accounts
GET    /api/v1/accounts/:businessId
GET    /api/v1/accounts/:businessId/position
POST   /api/v1/accounts/:id/deposit
POST   /api/v1/accounts/:id/withdraw
POST   /api/v1/transfers
GET    /api/v1/cash-flow/:businessId
POST   /api/v1/accounts/:id/reserve
POST   /api/v1/accounts/:id/release

# Investments (6 routes)
POST   /api/v1/investments
GET    /api/v1/investments/:businessId
GET    /api/v1/investments/:businessId/summary
PATCH  /api/v1/investments/:id/value
POST   /api/v1/investments/:id/redeem
GET    /api/v1/investments/:id/returns

# Forecasting (4 routes)
POST   /api/v1/forecast/:businessId
GET    /api/v1/forecast/:businessId/current
GET    /api/v1/forecast/:businessId/shortfall
PATCH  /api/v1/forecast/:id/actuals

# ML Forecasting (3 routes)
POST   /api/v1/forecast/:businessId/ml
GET    /api/v1/forecast/:businessId/ml/insights
POST   /api/v1/forecast/anomaly

# Alerts (3 routes)
GET    /api/v1/alerts/:businessId
POST   /api/v1/alerts/:id/acknowledge
POST   /api/v1/alerts/:id/resolve

# Bank Statement (2 routes)
POST   /api/v1/bank-statements/import
GET    /api/v1/bank-statements/banks

# FX Hedging (10 routes)
GET    /api/v1/fx/rate/:from/:to
GET    /api/v1/fx/spot/:from/:to
POST   /api/v1/fx/hedge/forward
POST   /api/v1/fx/hedge/option
GET    /api/v1/fx/exposure/:businessId
GET    /api/v1/fx/positions/:businessId
GET    /api/v1/fx/recommendations/:businessId
POST   /api/v1/fx/positions/:id/settle
POST   /api/v1/fx/auto-hedge/:businessId
GET    /api/v1/fx/currencies

# Webhooks (4 routes)
POST   /api/v1/webhooks
GET    /api/v1/webhooks/:businessId
GET    /api/v1/webhooks/:id/deliveries
DELETE /api/v1/webhooks/:id
```

### Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Matured Investments | Daily 1 AM | Process maturity, auto-renewals |
| Forecast Refresh | Weekly Mon 6 AM | 13-week forecast refresh |
| Alert Check | Every 4 hours | Critical alert monitoring |
| Investment Update | Daily Midnight | Mark-to-market |
| FX Position Update | Every 6 hours | Update unrealized P&L |
| Webhook Retry | Every 5 minutes | Retry failed deliveries |

### Unit Tests

| Test File | Coverage |
|-----------|----------|
| cashManagement.test.ts | Account ops, transfers, reservations, cash flow |
| investment.test.ts | Creation, redemption, M2M, portfolio |
| forecast.test.ts | 13-week forecast, shortfall, variance |
| integration.test.ts | Wallet, Payment, Notification integration |
| dashboard.spec.ts | E2E tests with Playwright |

### React Hooks (10+)

| Hook | Purpose |
|------|---------|
| useCashPosition | Cash position data |
| useAccounts | Account CRUD operations |
| useInvestments | Investment portfolio |
| useMLForecast | AI-powered forecast |
| useBankStatements | Bank statement import |
| useFXExposure | FX exposure tracking |
| useFXRate | Real-time FX rates |
| useWebhooks | Webhook subscriptions |

### Webhook Events

| Category | Events |
|----------|--------|
| Account | account.created, account.updated, account.deactivated |
| Transaction | transaction.deposit, transaction.withdrawal, transaction.transfer |
| Investment | investment.created, investment.matured, investment.renewed, investment.foreclosed |
| Forecast | forecast.generated, shortfall.predicted, shortfall.alert |
| Alert | alert.created, alert.acknowledged, alert.resolved, alert.escalated |

### Error Classes (25+)

| Category | Errors |
|----------|--------|
| Account | AccountNotFoundError, AccountInactiveError, InvalidAccountTypeError |
| Balance | InsufficientBalanceError, NegativeAmountError, ZeroAmountError |
| Transfer | TransferToSameAccountError, CrossBusinessTransferError, CurrencyMismatchError |
| Investment | InvestmentNotFoundError, InvestmentNotActiveError, InvalidInterestRateError |
| External | WalletServiceError, PaymentServiceError, DatabaseError, RedisError |

### Deployment

| File | Description |
|------|-------------|
| Dockerfile | Multi-stage build, production ready |
| docker-compose.yml | Full stack (MongoDB, Redis, Prometheus, Grafana) |
| docker-compose.dev.yml | Development with hot reload |
| nginx.conf | Production load balancer, rate limiting |
| k8s-deployment.yaml | Kubernetes deployment |

### Dashboard

| Feature | Tech Stack |
|---------|-----------|
| React Dashboard | React 18, Vite, Tailwind CSS |
| Charts | Recharts (Line, Bar, Pie charts) |
| API Client | React Query + Axios |
| Port | 3056 |
| Location | REZ-treasury-dashboard/ |

### CI/CD

| File | Description |
|------|-------------|
| .github/workflows/treasury-os.yml | Backend CI/CD |
| .github/workflows/treasury-dashboard.yml | Dashboard CI/CD |
| playwright.config.ts | E2E test config |

### Dashboard Pages

| Route | Page | Description |
|-------|------|-------------|
| / | Dashboard | Main overview with KPIs and charts |
| /accounts | Accounts | Treasury account management |
| /investments | Investments | Investment portfolio |
| /forecast | Forecast | 13-week cash flow forecast |
| /alerts | Alerts | Alert management |

---

## FILE STRUCTURE

```
RABTUL-Technologies/
├── REZ-auth-service/           # Authentication
├── REZ-wallet-service/          # Digital wallet
├── REZ-payment-service/        # Payments
├── REZ-treasury-os/            # Treasury (NEW)
│   ├── src/
│   │   ├── __tests__/          # Unit tests
│   │   │   ├── cashManagement.test.ts
│   │   │   ├── investment.test.ts
│   │   │   ├── forecast.test.ts
│   │   │   └── integration.test.ts
│   │   ├── services/
│   │   │   ├── webhookService.ts  # Webhooks
│   │   │   └── *.ts
│   │   └── utils/
│   │       └── errors.ts         # Error classes
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── docker-compose.dev.yml
├── REZ-treasury-dashboard/      # React Dashboard (NEW)
│   ├── src/
│   │   ├── pages/Dashboard.tsx
│   │   └── api/treasury.ts
│   └── package.json
├── REZ-unified-loyalty/         # Loyalty points
├── rez-referral-os/             # Referrals
├── rabtul-trust-engine/        # Trust/Reputation
├── REZ-multi-currency/          # Multi-currency
├── rez-rewards/                 # Gamification
├── REZ-*-service/              # Additional services
├── shared/                      # Shared utilities
├── config/                      # Shared config
└── RABTUL-connectors/           # Service connectors
```

---

## ENVIRONMENT VARIABLES

Required in `.env`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/service-db

# Redis
REDIS_URL=redis://localhost:6379

# Auth (REQUIRED)
INTERNAL_SERVICE_TOKEN=generate_with_openssl_rand_hex_32

# Grafana (REQUIRED for observability)
GRAFANA_ADMIN_PASSWORD=change_this_secure_password

# AI Services
OPENAI_API_KEY=sk-...
```

---

## DEPENDENCIES

- **Node.js:** 20+
- **MongoDB:** 6+
- **Redis:** 7+
- **Package Manager:** npm (with workspaces)

---

## ADDING NEW SERVICES

1. Create service directory: `REZ-my-service/`
2. Add to root `package.json` workspaces
3. Create `package.json`, `tsconfig.json`
4. Use shared config from `../config/`
5. Add health endpoints
6. Document in this file

---

## CONNECTORS

Use connectors for service-to-service communication:

```typescript
import { AuthConnector, authConnector } from './RABTUL-connectors/auth';
import { WalletConnector, walletConnector } from './RABTUL-connectors/wallet';
import { PaymentConnector, paymentConnector } from './RABTUL-connectors/payment';
```

---

## TROUBLESHOOTING

### Service won't start
- Check MongoDB connection: `mongodb://localhost:27017`
- Check Redis connection: `redis://localhost:6379`
- Verify environment variables are set

### Auth errors
- Ensure `INTERNAL_SERVICE_TOKEN` is set
- Check token matches across services

### XSS errors
- Never use `innerHTML` with user data
- Use `textContent` or DOM APIs

---

## DOCUMENTATION

| Document | Purpose |
|----------|---------|
| CLAUDE.md | This file - Developer guide |
| COMPLETE-FEATURES.md | Full feature inventory |
| API-REFERENCE.md | API documentation |
| SERVICES-UPDATE.md | Service changes |
| REZ-treasury-os/README.md | TreasuryOS guide |

---

## RTMN FOUNDATION SERVICES INTEGRATION

RABTUL Technologies connects to RTMN Foundation Services for universal identity and economy:

| Foundation Service | Port | RABTUL Integration |
|--------------------|------|-------------------|
| **CorpID** | 4702 | User identity, trust scores, agent registration |
| **MemoryOS** | 4703 | User preferences, transaction memory |
| **GoalOS** | 4242 | Business goals, financial targets |
| **Decision Engine** | 4240 | Payment authorization, risk assessment |
| **Agent Economy** | 4251 | Karma rewards, SLB staking, escrow |

### Connection Example

```javascript
// Trust score check before payment
const trustRes = await fetch('http://localhost:4702/api/trust/score/{userCorpId}');
const { trustScore } = await trustRes.json();

// Award karma for good payment
await fetch('http://localhost:4251/api/economy/karma/award', {
  method: 'POST',
  body: JSON.stringify({ corpId: userCorpId, amount: 10, reason: 'On-time payment' })
});

// Create escrow for large transaction
await fetch('http://localhost:4251/api/payments/escrow', {
  method: 'POST',
  body: JSON.stringify({
    fromCorpId: buyerCorpId,
    toCorpId: sellerCorpId,
    amount: 50000,
    currency: 'rez'
  })
});
```

### RABTUL Services Using Foundation

| RABTUL Service | Foundation Service | Purpose |
|----------------|-------------------|---------|
| **Auth Service** | CorpID | User identity verification |
| **Wallet Service** | Agent Economy | Multi-currency balance |
| **Payment Service** | Decision Engine | Authorization, risk |
| **Trust Engine** | CorpID | Trust score aggregation |
| **Gamification** | Agent Economy | Karma points, leaderboard |

---

*Foundation Services: `services/corpid-service/`, `services/memory-os/`, `services/goal-os/`, `services/decision-engine/`, `services/agent-economy/`*
