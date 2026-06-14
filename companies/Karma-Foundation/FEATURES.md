# Karma Foundation - Loyalty & Rewards OS

**Location:** `companies/Karma-Foundation/`  
**Purpose:** Universal loyalty points, rewards, and gamification across the RTMN ecosystem  
**Status:** ✅ **BUILT** | **June 14, 2026**

---

## Karma Foundation Overview

Karma Foundation provides a universal loyalty and rewards system that works across all RTMN ecosystem companies, enabling seamless point earning, redemption, and gamification.

### Karma Foundation vs Traditional Loyalty

| Feature | Traditional Loyalty | Karma Foundation |
|---------|-------------------|------------------|
| Cross-company Points | ❌ | ✅ |
| Unified Wallet | ❌ | ✅ |
| Gamification | Basic | ✅ Advanced |
| AI Recommendations | ❌ | ✅ |
| Real-time Rewards | ❌ | ✅ |
| Multi-tier Status | ❌ | ✅ |
| Behavioral Insights | ❌ | ✅ |

---

## Core Services

| Category | Services | Description |
|----------|----------|-------------|
| **Points** | Karma Service, Earning, Redemption | Point management |
| **Gamification** | Challenges, Badges, Leaderboards | Engagement |
| **Wallet** | Mobile, Web, API | Point wallets |
| **Bridge** | Loyalty Bridge | Cross-platform sync |

---

## Key Features

### Points Management
| Feature | Description |
|---------|-------------|
| Earning | Points for purchases, actions, referrals |
| Redemption | Points for rewards, discounts, gifts |
| Expiry | Configurable point expiration |
| Transfer | Point transfers between users |
| Conversion | Convert to/from partner currencies |

### Gamification
| Feature | Description |
|---------|-------------|
| Challenges | Daily, weekly, monthly challenges |
| Badges | Achievement badges, tier badges |
| Leaderboards | Rankings, competitions |
| Streaks | Consecutive action tracking |
| Levels | User progression system |

### AI Features
| Feature | Description |
|---------|-------------|
| Personalized Offers | AI-recommended rewards |
| Churn Prevention | At-risk user detection |
| A/B Testing | Offer optimization |
| Prediction | Engagement forecasting |

---

## API Endpoints

```
# Points
GET    /api/karma/:userId           # Get balance
POST   /api/karma/earn             # Earn points
POST   /api/karma/redeem          # Redeem points
POST   /api/karma/transfer         # Transfer points

# Gamification
GET    /api/challenges            # List challenges
POST   /api/challenges/:id/claim  # Claim challenge
GET    /api/badges/:userId        # Get badges
GET    /api/leaderboard           # Get leaderboard

# Offers
GET    /api/offers               # Get offers
POST   /api/offers/redeem         # Redeem offer
```

---

## Integration with RTMN

| Service | Integration | Purpose |
|---------|-------------|---------|
| REZ-Consumer | DO App | User karma balance |
| REZ-Merchant | Restaurant, Hotel | Earn on purchase |
| AdBazaar | Campaigns | Karma rewards |
| BuzzLocal | Community | Neighborhood challenges |

---

## Quick Start

```bash
# Install
cd companies/Karma-Foundation && npm install

# Start services
npm start

# Health check
curl http://localhost:5000/health
```
