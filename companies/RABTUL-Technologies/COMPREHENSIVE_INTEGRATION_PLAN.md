# REZ Ecosystem - Comprehensive Integration Plan

**Date:** May 18, 2026
**Status:** Implementation Started

---

## EXECUTIVE SUMMARY

### Current State
- **RABTUL Services:** 19 services built, 3 running, **NEW: Cross-Company Bridge**
- **REZ Intelligence:** 30+ AI services, **NEW: Intelligence Hub**
- **REZ-Media:** Ad platform, **NEW: Media Integration Service**
- **CorpPerks:** Enterprise SaaS, **NEW: Corp Integration Service**
- **REZ-Consumer:** Mobile apps

### Vision
Connect ALL services for unified intelligence, automation, and cross-company synergies.

---

## INTEGRATION SERVICES BUILT

### 1. Cross-Company Bridge (RABTUL)
**Port:** 4099
- Unified events across all companies
- Shared analytics
- Customer360 across companies
- Cross-company loyalty points
- Shared offers

### 2. Media Integration (REZ-Media)
**Port:** 4105
- Ad payments → RABTUL Payment
- Campaign analytics → RABTUL Analytics
- User targeting → Intent Graph
- Creator earnings → RABTUL Wallet
- Corporate campaigns → CorpPerks

### 3. Corp Integration (CorpPerks)
**Port:** 4100
- Employee benefits → Wallet credits
- Travel bookings → Order + Payment
- Expense tracking → Analytics

---

## PART 1: REZ INTELLIGENCE CONNECTIONS

### 1.1 Intent Graph → All Services

```
REZ-Intelligence/re z-intent-graph/
├── → RABTUL (payment-service, order-service, wallet-service
├── → REZ-Media (campaigns, targeting
├── → REZ-Consumer (apps, personalization
└── → CorpPerks (enterprise features

```

| Intelligence Service | Connects To | Benefit |
|--------------------|--------------|---------|
| **Intent Graph** | All services | Unified user understanding |
| **RFM++** | All services | Customer segmentation |
| **Churn Prediction** | All services | Retention automation |
| **Lead Intelligence** | Sales teams | Prioritization |
| **Taste Graph** | Recommendation systems | Personalization |

### 1.2 AI Agents → All Platforms

| Agent Type | Used By | Actions |
|-----------|--------|----------|
| **Support Agent | All apps | Auto-resolve tickets |
| **Sales Agent | CorpPerks, REZ-Media | Lead qualification |
| **Marketing Agent | REZ-Media | Campaign optimization |
| **Operations Agent | RABTUL | Service monitoring |
| **Fraud Agent | Payment, Wallet | Risk assessment |

---

## PART 2: RABTUL SERVICE CONNECTIONS

### 2.1 Core → All Companies

```
RABTUL Services
├── Auth → All apps (SSO, profiles)
├── Payment → E-commerce, CorpPerks, StayOwn
├── Wallet → Loyalty, Rewards, CorpPerks
├── Order → Inventory, Fulfillment, Analytics
└── Notifications → All apps (unified messaging)
```

| RABTUL Service | Primary Users | Integration Point |
|----------------|-------------|-------------------|
| **Auth** | All apps | OAuth 2.0, SSO |
| **Payment** | All commerce | Webhooks |
| **Wallet** | Loyalty apps | Events |
| **Order** | E-commerce | Real-time sync |
| **Catalog** | Marketplaces | API |
| **Search** | All apps | Embeddable widget |
| **Notifications** | All apps | Push, SMS, WhatsApp |

### 2.2 RABTUL → REZ-Media

```
REZ-Media
├── Ad Campaigns → Uses Auth for targeting
├── Ad Network → Uses Payment for billing
├── CRM Hub → Uses Order for revenue tracking
└── Journey Service → Uses Notification for sends
```

### 2.3 RABTUL → CorpPerks

```
CorpPerks
├── Uses Auth (employee login)
├── Uses Payment (benefits, payroll)
├── Uses Wallet (rewards, points
├── Uses Order (procurement
└── Uses Notification (alerts
```

---

## PART 3: REZ-MEDIA CONNECTIONS

### 3.1 Ad Platform → All Apps

```
REZ-Media
├── AdBazaar → Creator marketplace
├── Ad Network → All apps serve ads
├── CRM Hub → All companies
├── Automation → Triggers from RABTUL events
└── Journey Service → Cross-company campaigns
```

### 3.2 Attribution Flow

```
User Action
├── App event → Intent Graph
├── Purchase → Payment Service
├── Engagement → Ad Platform
├── Retention → Journey Service
└── Revenue → Analytics
```

---

## PART 4: CORPPERKS CONNECTIONS

### 4.1 CorpPerks Architecture

```
CorpPerks
├── nextaBizz (B2B procurement)
├── RestoPapa (Restaurant OS)
├── Insight Campus (EdTech)
├── HR App (Workforce OS)
└── Talent Platform (Careers)
```

### 4.2 CorpPerks → RABTUL

| Service | CorpPerks Use | Integration |
|---------|---------------|-------------|
| Auth | Employee SSO | OAuth |
| Payment | Expense claims | Webhooks |
| Wallet | Perks distribution | Events |
| Order | Procurement | API |
| Notification | Alerts | Push/SMS |

---

## PART 5: IMPLEMENTATION PRIORITIES

### P1 - Revenue

| Integration | Status | Owner |
|-------------|--------|--------|
| RABTUL Auth → CorpPerks | Plan | CorpPerks team |
| Payment → All commerce | Running | Payment team |
| Ad Platform → All apps | Planning | Media team |

### P2 - Intelligence

| Integration | Status | Owner |
|--------------|--------|--------|
| Intent Graph → User 360 | Planning | Intelligence |
| RFM++ → All companies | Planning | Intelligence |
| Churn Model → Retention | Planning | Intelligence |

### P3 - Automation

| Integration | Status | Owner |
|-------------|--------|--------|
| Journey Service → Cross-company | Planning | Media |
| Automation → All apps | Planning | Automation |

---

## PART 6: CROSS-COMPANY EVENTS

### Event Bus Schema

```typescript
interface REZEvent {
  type: string;
  company: string;
  app: string;
  userId: string;
  timestamp: Date;
  data: Record<string, unknown>;
}
```

### Event Types

| Event | Source | Consumers |
|-------|--------|------------|
| `user.signup` | Auth | All platforms |
| `purchase.completed` | Payment | Analytics, Attribution |
| `subscription.created` | CorpPerks | RABTUL, REZ-Media |
| `order.shipped` | Order | Notification, Intent |
| `content.published` | REZ-Media | All apps |
| `employee.onboarded` | CorpPerks | RABTUL, Analytics |

---

## PART 7: DEPLOYMENT STATUS

### Running Services

| Service | URL | Company |
|---------|-----|---------|
| rez-auth-service | render.com | RABTUL |
| rez-wallet-service | render.com | RABTUL |
| rez-payment-service | render.com | RABTUL |

### Pending Deployment

| Service | Company | Priority |
|---------|---------|----------|
| REZ Intelligence services | REZ-Intelligence | P1 |
| Ad Platform | REZ-Media | P1 |
| CorpPerks backend | CorpPerks | P2 |
| All mobile apps | REZ-Consumer | P2 |

---

## PART 8: NEXT ACTIONS

### Immediate (This Week)

1. Deploy REZ Intelligence services
2. Connect CorpPerks → RABTUL Auth
3. Set up event bus between companies

### Short-term (This Month)

4. Connect REZ-Media → RABTUL Payment
5. Deploy all CorpPerks apps
6. Set up shared analytics dashboard

### Medium-term (This Quarter)

7. Unified user profile across companies
8. Cross-company loyalty program
9. Shared ML models
