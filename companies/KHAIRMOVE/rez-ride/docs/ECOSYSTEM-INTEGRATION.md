# ReZ Ride - Ecosystem Integration Architecture

## Overview

ReZ Ride integrates with 4 major ecosystem components:
1. **ReZ Intelligence** - AI/ML for predictions, recommendations, personalization
2. **RABTUL Technologies** - Shared infrastructure services
3. **ReZ Media** - Ads, gamification, DOOH advertising
4. **CorpPerks** - Corporate billing and employee management

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ReZ Ride                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   User App   │  │  Driver App  │  │  Admin Panel │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│         └────────────┬────┴─────────────────┘                       │
│                      │                                              │
│              ┌───────▼────────┐                                     │
│              │   API Gateway   │  :4000                            │
│              └───────┬────────┘                                     │
│                      │                                              │
└──────────────────────┼──────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌───────────────┐ ┌──────────┐ ┌───────────────┐
│  RABTUL       │ │  ReZ     │ │   ReZ        │
│  Technologies  │ │ Intelligence│ │   Media     │
├───────────────┤ ├──────────┤ ├───────────────┤
│ Auth (4002)  │ │ Intent   │ │ Ads           │
│ Wallet (4004)│ │ Predict  │ │ Campaigns     │
│ Payment (4001)│ │ Churn    │ │ Gamification  │
│ Profile (4013)│ │ LTV      │ │ DOOH          │
│ Notify (4011)│ │ Segments │ │ Karma         │
│ Analytics     │ │ Unified  │ │               │
│ (4016)       │ │ Profile  │ │               │
└───────────────┘ └──────────┘ └───────────────┘
                       │
              ┌────────┴────────┐
              │   CorpPerks     │
              ├──────────────────┤
              │ Corporate Billing│
              │ Employee Mgmt   │
              │ GST Invoicing   │
              │ Expense Track   │
              └──────────────────┘
```

---

## 1. ReZ Intelligence Integration

### 1.1 Intent Prediction
**Service:** `REZ-intent-predictor` (:4018)

| Use Case | How It Works |
|----------|-------------|
| Predict ride destination | Based on time, location, history |
| Predict vehicle preference | Based on past bookings |
| Dynamic pricing signals | Demand prediction |
| User propensity to cancel | Pre-emptive offers |

### 1.2 Churn Prediction
**Service:** `REZ-predictive-engine` (:4123)

| Use Case | Action |
|----------|--------|
| Identify at-risk users | Send retention offers |
| Inactive drivers | Incentivize to go online |
| Low-rated drivers | Training recommendations |

### 1.3 LTV Attribution
**Service:** `REZ-predictive-engine` (:4123)

| Use Case | Action |
|----------|--------|
| High-value users | Premium features, priority support |
| Frequent users | Loyalty rewards |
| Occasional users | Promotional campaigns |

### 1.4 Real-time Segments
**Service:** `REZ-realtime-segments` (:4126)

| Segment | Characteristics | Experience |
|---------|----------------|------------|
| Champions | Daily users, 4.8+ rating | Exclusive perks |
| Active | Weekly users | Cashback offers |
| At Risk | 14+ days inactive | Re-engagement |
| Churning | 30+ days inactive | Aggressive retention |

### 1.5 Unified Profile
**Service:** `REZ-unified-profile` (:4120)

Unified view of user across all ReZ products:
- Ride history
- Spending patterns
- Preferences
- Cross-product behavior

### 1.6 Recommendation Engine
**Service:** `REZ-recommendation-engine` (:4017)

| Recommendation | Trigger | Action |
|----------------|---------|--------|
| Best time to ride | Peak hours approaching | "Save 20% if you leave now" |
| Preferred routes | Frequent destinations | Quick select |
| Pool partners | Same route, same time | Pool invitation |
| Driver match | Rating + distance + history | Better matching |

---

## 2. RABTUL Technologies Integration

### 2.1 Authentication
**Service:** `rez-auth-service` (:4002)

| Use Case | Implementation |
|----------|----------------|
| Single sign-on | JWT verification via RABTUL |
| Social auth | OAuth via RABTUL |
| OTP service | Shared SMS gateway |
| Session management | Redis-backed sessions |

### 2.2 Wallet
**Service:** `rez-wallet-service` (:4004)

| Use Case | Implementation |
|----------|----------------|
| Unified wallet | Same balance across apps |
| Cashback | Centralized loyalty engine |
| Recharges | Multiple payment methods |
| P2P transfers | User to user payments |

### 2.3 Payments
**Service:** `rez-payment-service` (:4001)

| Use Case | Implementation |
|----------|----------------|
| Ride payments | Razorpay via RABTUL |
| Driver payouts | Automatic via RABTUL |
| Refunds | Automated refund flow |
| Corporate billing | CorpPerks integration |

### 2.4 Notifications
**Service:** `rez-notifications-service` (:4011)

| Channel | Use Case |
|---------|----------|
| Push | Ride updates |
| SMS | OTP, receipts |
| Email | Monthly statements |
| WhatsApp | Booking confirmations |

### 2.5 Analytics
**Service:** `rez-analytics-service` (:4016)

| Dashboard | Metrics |
|-----------|---------|
| Executive | GMV, rides, users |
| Operations | Demand/supply ratio |
| Finance | Revenue, payouts |
| Marketing | CAC, LTV, churn |

---

## 3. ReZ Media Integration

### 3.1 In-App Advertising
**Service:** `adsqr` (ReZ Media)

| Ad Type | Placement | Revenue Share |
|---------|-----------|---------------|
| Splash | On app open | 70/30 |
| Interstitial | Between screens | 70/30 |
| Banner | Bottom of screens | 70/30 |
| Rewarded | Before ride | 60/40 |

### 3.2 Gamification (Karma)
**Service:** `REZ-gamification-service` (:4041)

| Feature | Implementation |
|---------|----------------|
| Karma Points | Earn on every ride |
| Badges | Distance, rides, streaks |
| Leaderboard | Weekly top riders |
| Rewards | Free rides, discounts |

### 3.3 DOOH Advertising
**Service:** `rez-dooh-service` (:4018)

| Screen Type | Ad Revenue | Location |
|------------|------------|----------|
| Vehicle screens | ₹15-25 CPM | Taxis, cabs |
| Mall kiosks | ₹10-20 CPM | Retail |
| Elevator | ₹8-15 CPM | Buildings |

### 3.4 Campaign Targeting
**Service:** `REZ-qr-campaigns`

| Campaign Type | Targeting | Objective |
|--------------|-----------|-----------|
| New city launch | Location-based | Acquisition |
| Holiday promo | High-value users | Retention |
| Competitor capture | Recent switchers | Win-back |

---

## 4. CorpPerks Integration

### 4.1 Corporate Billing
**Service:** CorpPerks Corporate Portal

| Feature | Implementation |
|---------|----------------|
| Employee verification | CorpPerks employee ID |
| GST invoicing | Auto-generated invoices |
| Expense management | Per-employee limits |
| Policy enforcement | Budget limits per trip type |

### 4.2 Employee Management
**Service:** CorpPerks HR Module

| Integration | Data Shared |
|------------|-------------|
| Employee list | Sync to ReZ Ride |
| Department | Policy assignment |
| Designation | Tier-based limits |
| Approval workflow | Manager approvals |

### 4.3 Expense Tracking
**Service:** CorpPerks Expense Module

| Feature | Description |
|---------|-------------|
| Real-time tracking | Per-employee expenses |
| Receipt capture | Auto-upload |
| Policy violations | Alerts + approval |
| Monthly reports | CFO dashboards |

### 4.4 Policy Engine
**Service:** CorpPerks Policy Service

| Policy | Rules |
|--------|-------|
| Allowed vehicle | Based on designation |
| Max fare | Daily/monthly limits |
| Time restrictions | Office hours only |
| Route restrictions | Approved routes only |

---

## 5. Data Flows

### 5.1 User Journey with Intelligence
```
1. User opens app
   → ReZ Intelligence: Get user segment
   → ReZ Intelligence: Get intent prediction
   → ReZ Media: Check for relevant ads
   → Show personalized home screen

2. User searches destination
   → ReZ Intelligence: Predict destination
   → ReZ Intelligence: Recommend vehicle type
   → Show quick-select options

3. User books ride
   → RABTUL: Auth verify
   → RABTUL: Wallet check
   → ReZ Intelligence: Get dynamic price
   → ReZ Media: Show ad/cashback offer

4. Ride in progress
   → RABTUL: Send notifications
   → ReZ Intelligence: Track satisfaction signals
   → ReZ Media: Show relevant content

5. Ride completes
   → RABTUL: Process payment
   → ReZ Intelligence: Update LTV/churn
   → ReZ Media: Award karma points
   → RABTUL: Send receipt
```

### 5.2 Corporate Ride Flow
```
1. Employee requests ride
   → CorpPerks: Verify employee
   → CorpPerks: Check policy
   → CorpPerks: Get approval if needed

2. Ride booked
   → CorpPerks: Log expense
   → RABTUL: Process payment from corporate wallet

3. Ride completes
   → CorpPerks: Generate GST invoice
   → CorpPerks: Update expense report
   → CorpPerks: Notify manager
```

---

## 6. Revenue Model

### 6.1 ReZ Ride Revenue
| Source | Amount |
|--------|--------|
| Surge pricing | Dynamic |
| Corporate markup | 5-10% |
| Ad revenue share | 30% |
| Premium subscriptions | ₹99-299/month |

### 6.2 Ecosystem Revenue Share
| Service | ReZ Ride Pays |
|---------|---------------|
| RABTUL Auth | Free (infrastructure) |
| RABTUL Wallet | 0.5% transaction fee |
| RABTUL Payments | 2% payment processing |
| ReZ Intelligence | Free (owned service) |
| ReZ Media | Revenue share on ads |

---

## 7. Technical Implementation

### 7.1 Service Mesh
```
ReZ Ride (:4000)
    │
    ├── RABTUL (:4002-4030)
    │   └── Internal service tokens
    │
    ├── REZ-Intelligence (:4018-4140)
    │   └── AI/ML predictions
    │
    ├── REZ-Media (:4068+)
    │   └── Ads & Karma
    │
    └── CorpPerks (:4000+)
        └── Corporate API
```

### 7.2 Event-Driven Architecture
```
User Action → Event Bus → Services
    │
    ├── ReZ Intelligence: Update models
    ├── RABTUL: Process payments
    ├── ReZ Media: Track impressions
    └── CorpPerks: Log expenses
```

### 7.3 Data Synchronization
| Data | Sync Frequency | Method |
|------|---------------|--------|
| User profiles | Real-time | Webhooks |
| Corporate employees | Daily | Batch API |
| Karma points | Real-time | Event |
| Analytics | Real-time | Event |

---

## 8. Success Metrics

### 8.1 ReZ Intelligence Impact
| Metric | Baseline | Target | Service |
|--------|----------|--------|---------|
| Intent prediction accuracy | N/A | 85% | Intent Predictor |
| Churn reduction | N/A | 20% | Predictive Engine |
| LTV improvement | N/A | 15% | LTV Attribution |
| Segment accuracy | N/A | 90% | Realtime Segments |

### 8.2 RABTUL Efficiency
| Metric | Target |
|--------|--------|
| Auth latency | <50ms |
| Payment success | 99.9% |
| Notification delivery | 98% |
| Wallet consistency | 100% |

### 8.3 ReZ Media Revenue
| Metric | Target |
|--------|--------|
| Ad impressions | 10M/month |
| CPM rate | ₹20 |
| Karma engagement | 50% |
| DOOH screens | 1000+ |

### 8.4 CorpPerks Growth
| Metric | Target |
|--------|--------|
| Corporate accounts | 100+ |
| Active employees | 10,000+ |
| Monthly GMV | ₹5Cr+ |
| Retention rate | 95% |
