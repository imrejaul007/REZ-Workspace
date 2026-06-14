# ReZ Ride - Cross-Service Integration Architecture

**Version:** 1.0.0
**Date:** May 18, 2026

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        REZ RIDE CORE                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  Rides  │ │ Drivers │ │  Fares  │ │ Safety  │ │  Pool  │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
└────────┼────────┼────────┼────────┼────────┼───────────────────────────┘
         │        │        │        │
         └────────┼────────┼────────┼────────┘
                  │        │        │
    ┌─────────────▼─────────▼─────────▼───────────────────┐
    │            INTEGRATION HUB                        │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
    │  │ RABTUL  │ │   AI/ML  │ │  Media  │           │
    │  │ Client  │ │  Client  │ │  Client  │           │
    │  └────┬────┘ └────┬────┘ └────┬────┘           │
    └───────┼──────────┼─────────┼───────────────────┘
            │          │          │
    ┌───────▼────┐ ┌──▼─────────▼──┐ ┌─────▼─────────┐
    │  RABTUL  │ │ REZ INTELLIGENCE│ │  REZ MEDIA  │
    │  Services │ │    Services   │ │   Services  │
    ├───────────┤ ├──────────────┤ ├────────────┤
    │ Auth      │ │ Intent Graph │ │ AdsBazaar │
    │ Wallet    │ │ Predictive   │ │ DOOH     │
    │ Payments  │ │ Sentiment   │ │ Karma    │
    │ Notifs    │ │ Attribution │ │ Campaigns │
    │ Profile   │ │ Identity    │ │           │
    └───────────┘ └─────────────┘ └───────────┘
            │          │          │
            └──────────┼──────────┘
                       │
              ┌────────▼────────┐
              │  CORPPARKS   │
              ├───────────────┤
              │ Employee Mgmt │
              │ Billing      │
              │ Benefits     │
              │ Expenses     │
              └─────────────┘
```

---

## RABTUL Integration

### Core Services Used

| Service | Port | Purpose | Integration Type |
|---------|------|---------|-----------------|
| `rez-auth-service` | 4002 | JWT/OTP auth | Sync |
| `rez-wallet-service` | 4004 | Payments | Sync |
| `rez-notifications-service` | 4011 | Push/SMS/WhatsApp | Event |
| `rez-profile-service` | 4013 | User profiles | Query |
| `rez-order-service` | 4006 | Order lifecycle | Pattern |

### Auth Flow
```
User Login → RABTUL Auth (OTP) → JWT Token → ReZ Ride
                                    ↓
                           Token stored in wallet
```

### Wallet Flow
```
Ride Complete → Calculate fare → Debit wallet → Credit driver
                     ↓              ↓            ↓
               FareService    RABTUL     RABTUL Wallet
                             (user)     (driver payout)
```

### Notification Flow
```
Event → NotificationService → RABTUL Notifs → Push/SMS/WhatsApp
                             ↓
                      Campaign triggers
                             ↓
                        ReZ Media
```

---

## REZ INTELLIGENCE Integration

### Core Services Used

| Service | Purpose | Integration Type |
|---------|----------|-------------------|
| `REZ-autonomous-agents` | Orchestration | Event |
| `REZ-intent-predictor` | User intent | Query |
| `REZ-predictive-engine` | Churn/LTV | Batch |
| `REZ-identity-graph` | User identity | Query |
| `REZ-care-service` | Support tickets | Event |
| `REZ-attribution-platform` | Marketing attribution | Event |

### AI Matching Flow
```
Ride Request → ReZ Intelligence → Intent Prediction → Match Driver
                 ↓
            User segment + history + context
```

### Churn Prediction Flow
```
Batch Job → REZ Predictive Engine → Churn Score → Retention Campaign
                                         ↓
                                    RABTUL Notifications (offer)
```

### Attribution Flow
```
Ride → Attribution Event → REZ Attribution Platform → Campaign ROI
                                       ↓
                              Optimize spending
```

---

## REZ MEDIA Integration

### Core Services Used

| Service | Purpose | Integration Type |
|---------|----------|-------------------|
| `AdsBazaar` | Ad campaigns | Event |
| `REZ-dooh-service` | Vehicle screens | Event |
| `REZ-gamification-service` | Karma points | Sync |
| `REZ-engagement-platform` | Campaigns | Event |

### Ad Serving Flow
```
Ride Start → Check Campaigns → Match User → Serve Ad
                              ↓
                      ReZ Media (AdsBazaar)
                              ↓
                        Vehicle Screen
```

### Cross-Promotion Flow
```
Restaurant Campaign → Trigger → Ride Voucher → User Offer
                                     ↓
                              ReZ Media (AdsBazaar)
```

---

## CORPPARKS Integration

### Core Services Used

| Service | Purpose | Integration Type |
|---------|----------|-------------------|
| Employee Management | Employee data | Sync |
| Corporate Billing | Company accounts | Sync |
| Expense Management | Ride expenses | Sync |
| Benefits Platform | Employee benefits | Query |

### Corporate Flow
```
Employee books ride → Verify company → Apply billing → Invoice company
                     ↓
               CorpPerks (verify)
                                        ↓
                              GST invoice generated
```

---

## Integration Patterns

### 1. Event-Driven (Async)
```
Service A emits event → RabbitMQ/Kafka → Service B consumes
```

### 2. Query (Sync)
```
Service A queries Service B → HTTP/REST → Response
```

### 3. Data Sync (Batch)
```
Schedule → Extract → Transform → Load
```

### 4. Shared Database
```
MongoDB collections → Replica sets → Cross-service access
```

---

## Environment Variables

```bash
# RABTUL Services
REZ_AUTH_SERVICE_URL=http://localhost:4002
REZ_WALLET_SERVICE_URL=http://localhost:4004
REZ_NOTIFICATIONS_URL=http://localhost:4011

# REZ Intelligence
REZ_INTELLIGENCE_URL=http://localhost:4062
REZ_INTENT_URL=http://localhost:4018
REZ_ATTRIBUTION_URL=http://localhost:3000

# REZ Media
REZ_MEDIA_URL=http://localhost:4000

# CorpPerks
CORPPARKS_URL=http://localhost:4000
```

---

## Next Steps

1. Build integration services
2. Set up event streams
3. Configure webhooks
4. Test cross-service flows
