# RAP - RABTUL Available Services
## Canonical Registry of All RABTUL Infrastructure Services

**Version:** 3.0
**Date:** May 28, 2026
**Owner:** RABTUL Technologies
**GitHub:** github.com/imrejaul007/RABTUL-Technologies

---

## PURPOSE

RAP is the **single source of truth** for all shared infrastructure services. Before creating ANY new service, ALL companies MUST check RAP first.

### Rule: If RAP has it → Use RAP. If RAP doesn't have it → Request RAP to create it.

---

## CORE SERVICES (Available Now)

### Authentication & Authorization

| Service | Port | URL | Status | Features |
|---------|------|-----|--------|----------|
| **rez-auth-service** | 4002 | `https://rez-auth-service.onrender.com` | ✅ Active | JWT, OTP, TOTP, MFA, OAuth, Session, RBAC |

### Payments & Finance

| Service | Port | URL | Status | Features |
|---------|------|-----|--------|----------|
| **rez-payment-service** | 4001 | `https://rez-payment-service.onrender.com` | ✅ Active | Razorpay, UPI, Webhooks, Refunds |
| **rez-wallet-service** | 4004 | `https://rez-wallet-service-36vo.onrender.com` | ✅ Active | Coins, Balance, Loyalty Points |

### Orders & Commerce

| Service | Port | URL | Status | Features |
|---------|------|-----|--------|----------|
| **rez-order-service** | 4006 | `https://rez-order-service-hz18.onrender.com` | ✅ Active | Order Lifecycle, State Machine |
| **rez-catalog-service** | 4007 | `https://rez-catalog-service-1.onrender.com` | ✅ Active | Products, Categories, Inventory |
| **rez-search-service** | 4008 | `https://rez-search-service.onrender.com` | ✅ Active | Full-text, Autocomplete, Fuzzy |

### Bookings & Reservations

| Service | Port | URL | Status | Features |
|---------|------|-----|--------|----------|
| **rez-booking-service** | 4020 | `https://rez-booking-service.onrender.com` | ✅ Active | Hotels, Travel, Events |

### Delivery & Logistics

| Service | Port | URL | Status | Features |
|---------|------|-----|--------|----------|
| **rez-delivery-service** | 4009 | `https://rez-delivery-service.onrender.com` | ✅ Active | Driver Tracking, Route Opt, WebSocket |

### Notifications & Messaging

| Service | Port | URL | Status | Features |
|---------|------|-----|--------|----------|
| **rez-notifications-service** | 4011 | `https://rez-notifications-service.onrender.com` | ✅ Active | Push, SMS, Email, WhatsApp |

### User Management

| Service | Port | URL | Status | Features |
|---------|------|-----|--------|----------|
| **rez-profile-service** | 4013 | `https://rez-profile-service.onrender.com` | ✅ Active | User Profiles, Preferences, Addresses |

### Analytics & Insights

| Service | Port | URL | Status | Features |
|---------|------|-----|--------|----------|
| **rez-analytics-service** | 4016 | `https://rez-analytics-service.onrender.com` | ✅ Active | Dashboards, Charts, Reports |

---

## BUSINESS SERVICES

| Service | Port | Status | Features |
|---------|------|--------|----------|
| **rez-gamification-service** | 4041 | ✅ Active | Karma points, achievements |
| **rez-cashback-service** | 4040 | ✅ Active | Cashback campaigns |
| **rez-bill-payments-service** | 4042 | ✅ Active | Bill fetch, pay |
| **rez-articles-service** | 4043 | ✅ Active | Editorial content |
| **rez-creator-earnings-service** | 4060 | ✅ Active | Creator dashboard |
| **rez-prive-service** | 4070 | ✅ Active | 6-Pillar loyalty, Prive coins |

---

## INFRASTRUCTURE SERVICES

### Resilience & Reliability

| Service | Port | Status | Features |
|---------|------|--------|----------|
| **REZ-circuit-breaker** | 4030 | ✅ Active | Fault Tolerance, Fallback |
| **REZ-retry-service** | 4031 | ✅ Active | Exponential Backoff, BullMQ |
| **REZ-dlq-service** | 4032 | ✅ Active | Dead Letter Queue, Replay |
| **REZ-idempotency-service** | 4033 | ✅ Active | Deduplication, TTL |

### Security & Compliance

| Service | Port | Status | Features |
|---------|------|--------|----------|
| **REZ-policy-engine** | 4034 | ✅ Active | Access Control, Compliance |
| **REZ-secrets-manager** | 4035 | ✅ Active | AES-256 Encryption, Rotation |
| **REZ-sso-service** | 4045 | ✅ Active | Single Sign-On |
| **REZ-mfa-service** | - | ✅ Active | Multi-factor authentication |

### Developer Experience

| Service | Port | Status | Features |
|---------|------|--------|----------|
| **REZ-developer-platform** | 4036 | ✅ Active | SDK Gen, API Docs, Sandbox |
| **rez-contracts** | 4037 | ✅ Active | OpenAPI, Schema Validation |
| **rez-scheduler-service** | 4038 | ✅ Active | Cron Jobs, Batch Processing |
| **@rez/sdk** | - | ✅ Active | TypeScript SDK |

### Feature Management

| Service | Port | Status | Features |
|---------|------|--------|----------|
| **REZ-flagship-service** | - | ✅ Active | Feature Flags, A/B Testing |

---

## INTELLIGENCE SERVICES

| Service | Port | Status | Features |
|---------|------|--------|----------|
| **REZ-unified-identity** | 4060 | ✅ Active | Identity resolution, Cross-device |
| **REZ-unified-attribution** | 4061 | ✅ Active | Multi-channel attribution, LTV |
| **REZ-unified-notifications** | 4063 | ✅ Active | Notification routing |
| **REZ-graph-service** | 4068 | ✅ Active | Commerce graph, relationships |
| **REZ-dooh-targeting-feed** | 4064 | ✅ Active | DOOH targeting |
| **REZ-autonomous-agents** | 4062 | ✅ Active | 8 AI agents |
| **REZ-event-bus** | 4082 | ✅ Active | Event streaming |
| **REZ-ai-agent-studio** | 4046 | ✅ Active | Conversational AI |
| **REZ-workflow-builder** | 4047 | ✅ Active | Journey automation |
| **REZ-cod-intelligence** | 4044 | ✅ Active | RTO prediction |
| **REZ-checkout-optimization** | 4050 | ✅ Active | 1-click checkout |
| **REZ-woocommerce-connector** | 4051 | ✅ Active | WooCommerce sync |
| **REZ-logistics-aggregator** | 4052 | ✅ Active | Multi-carrier rates |

---

## CROSS-CUTTING SERVICES

| Service | Port | Status | Features |
|---------|------|--------|----------|
| **REZ-cross-wallet-identity** | 4040 | ✅ Active | Multi-wallet linking |
| **REZ-cross-company-service** | 4099 | ✅ Active | Cross-company events |
| **REZ-unified-loyalty** | - | ✅ Active | Unified loyalty |
| **REZ-unified-hub** | - | ✅ Active | Central hub |

---

## BUZZLOCAL SERVICES

| Service | Status | Features |
|---------|--------|----------|
| **buzzlocal-feed-service** | ✅ Active | Feed & posts |
| **buzzlocal-community-service** | ✅ Active | Community features |
| **buzzlocal-intelligence-service** | ✅ Active | AI intelligence |
| **buzzlocal-notification-service** | ✅ Active | Push notifications |
| **buzzlocal-payment-service** | ✅ Active | Payments |
| **buzzlocal-realtime-service** | ✅ Active | WebSocket |
| **buzzlocal-vibe-service** | ✅ Active | Crowd intelligence |
| **buzzlocal-weather-service** | ✅ Active | Weather data |

---

## QR ECOSYSTEM

**Full Documentation:** [QR-ECOSYSTEM-RABTUL.md](QR-ECOSYSTEM-RABTUL.md)

### Complete QR Types (17+)

| Company | QR Types | Port | Status |
|---------|----------|------|--------|
| **REZ-Consumer** | Safe (15 modes), Verify, Creator, ReZ Now, ReZ Menu | 4003 | ✅ Complete |
| **REZ-Media** | Ads QR, Shelf QR | - | ✅ Complete |
| **StayOwn** | Room QR | 4016 | ✅ Complete |
| **REZ-Merchant** | Salon QR | - | ✅ Complete |
| **REZ-Intelligence** | QR Campaigns | 4130 | ✅ Complete |
| **RABTUL-Technologies** | QR Cloud (7 types) | 4300 | ⚠️ Partial |

### QR Cloud Service (v2.1 - Stabilized)

| Service | Port | Description | Status |
|---------|------|-------------|--------|
| **QR Cloud Service** | 4300 | Stabilized - MongoDB, Auth, WebSocket, Payments, Wallet, Offers | ✅ Stable v2.1 |
| **QR Cloud App** | - | Customer app + Dashboard + Landing | ✅ Stable v2.1 |
| **Table QR Service** | - | Restaurant table ordering | ✅ Available |
| **Verify QR** | 4003 | Product authenticity + warranty | ✅ Complete |
| **Room QR** | 4016 | Hotel guest services | ✅ Complete |
| **QR Campaigns** | 4130 | QR-triggered campaigns | ✅ Complete |

### QR Cloud v2.1 Features

```
✅ MongoDB Database
✅ API Key Authentication
✅ WebSocket (real-time orders & scans)
✅ Razorpay/UPI Payment Integration
✅ RABTUL Wallet Integration
✅ Event Bus
✅ Rate Limiting
✅ Offers/Coupons System
✅ QR Download & Print
✅ 7 QR Types (menu, table, payment, info, verify, creator, ads)
✅ Full Merchant Management
✅ Order Processing
✅ Analytics & Scan Tracking
✅ Landing Page for merchants
✅ Sales scripts & templates
```

### QR Cloud Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| README | rez-qr-cloud-service/README.md | Complete documentation |
| Deploy Steps | rez-qr-cloud-service/DEPLOY-STEPS.md | Step-by-step deployment |
| MongoDB Setup | rez-qr-cloud-service/MONGODB-ATLAS-SETUP.md | Database configuration |
| Sales Scripts | rez-qr-cloud-service/MERCHANT-ACQUISITION.md | Cold calls, WhatsApp, email |
| Landing Page | rez-qr-cloud-app/landing.html | Merchant signup page |
| Customer App | rez-qr-cloud-app/index.html | Customer ordering |
| Dashboard | rez-qr-cloud-app/dashboard.html | Merchant management |

---

## ENVIRONMENT VARIABLES

```bash
# Authentication
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
INTERNAL_SERVICE_TOKEN=<shared-token>

# Payments
PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com
WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com

# Commerce
ORDER_SERVICE_URL=https://rez-order-service-hz18.onrender.com
CATALOG_SERVICE_URL=https://rez-catalog-service-1.onrender.com
SEARCH_SERVICE_URL=https://rez-search-service.onrender.com

# Bookings
BOOKING_SERVICE_URL=https://rez-booking-service.onrender.com

# Delivery
DELIVERY_SERVICE_URL=https://rez-delivery-service.onrender.com

# Notifications
NOTIFICATION_SERVICE_URL=https://rez-notifications-service.onrender.com

# User Management
PROFILE_SERVICE_URL=https://rez-profile-service.onrender.com

# Analytics
ANALYTICS_SERVICE_URL=https://rez-analytics-service.onrender.com

# Infrastructure
CIRCUIT_BREAKER_URL=https://rez-circuit-breaker.onrender.com
DLQ_SERVICE_URL=https://rez-dlq-service.onrender.com
IDEMPOTENCY_SERVICE_URL=https://rez-idempotency-service.onrender.com
```

---

## REQUESTING NEW SERVICES

If a service you need is NOT in RAP:

### Step 1: Check RAP First
```bash
# Verify the service doesn't exist
grep -r "SERVICE_NAME" RAP.md
```

### Step 2: Submit Service Request
Create an issue in RABTUL-Technologies with:
- Service Name
- Purpose/Use Case
- Which company needs it
- Integration requirements
- SLA requirements

### Step 3: RAP Review Process
1. RABTUL reviews request (2 business days)
2. If approved, RABTUL creates service
3. Service added to RAP
4. All companies notified

---

## FORBIDDEN: No Service Duplication

### Companies CANNOT create these services independently:

| ❌ Forbidden | ✅ Use Instead |
|-------------|----------------|
| Local auth service | `rez-auth-service` |
| Local payment service | `rez-payment-service` |
| Local wallet service | `rez-wallet-service` |
| Local order service | `rez-order-service` |
| Local search service | `rez-search-service` |
| Local notifications | `rez-notifications-service` |
| Local analytics | `rez-analytics-service` |
| Local profile service | `rez-profile-service` |

### Violations

Any company creating duplicate services will be:
1. Flagged in weekly audit
2. Required to migrate to RABTUL services
3. Reported to RTMN Digital governance

---

## PRODUCT: QR CLOUD

### Quick Start

```typescript
import { REZ } from '@rez/sdk';

const rez = new REZ({ apiKey: 'your-api-key' });

// Create QR
const qr = await rez.qr.create({
  type: 'menu',
  merchantId: 'store_001'
});

// Get analytics
const analytics = await rez.qr.getAnalytics('qr_123');
```

### Pricing

| Tier | Price | Scans |
|------|-------|-------|
| Starter | ₹299/mo | 100/mo |
| Growth | ₹799/mo | 1,000/mo |
| Business | ₹1,999/mo | 5,000/mo |

---

## PRODUCT: SDK

### Installation

```bash
npm install @rez/sdk
```

### Usage

```typescript
import { REZ } from '@rez/sdk';

const rez = new REZ({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Auth
const user = await rez.auth.register({ email: 'user@example.com' });

// Payments
const payment = await rez.payments.initiate({
  amount: 99900,
  orderId: 'order_123'
});

// Wallet
await rez.wallet.credit({ userId: 'user_123', amount: 1000 });

// Notifications
await rez.notifications.send({
  userId: 'user_123',
  channel: 'whatsapp',
  title: 'Order Confirmed',
  body: 'Your order is ready!'
});
```

---

## CONTACT

- **RABTUL Platform Team:** [Create GitHub Issue](https://github.com/imrejaul007/RABTUL-Technologies/issues)
- **Service Desk:** Internal Slack `#rabtul-support`
- **On-Call:** 24/7 for production issues
- **Documentation:** docs.rez.money
- **Status:** status.rez.money

---

*RAP is maintained by RABTUL Technologies. Last updated: May 28, 2026*
