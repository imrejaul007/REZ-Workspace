# REZ Engagement Platform

**Version:** 1.0.0
**Date:** June 2026
**Company:** AdBazaar
**Port:** 3000

## Overview
Unified customer engagement platform combining loyalty programs, offers/coupons, gamification (badges and streaks), and referral marketing. Orchestrates multi-engine campaigns for comprehensive user engagement across REZ ecosystem.

## Tech Stack
- Framework: Express.js (Node.js)
- Engines: Loyalty, Offer, Gamification, Referral, Campaign
- Logging: Winston (console + file)
- Security: Helmet, Rate Limiting, Internal Auth

## Key Features
1. **Loyalty Engine** - Points system with tiered membership (Bronze/Silver/Gold/Platinum)
2. **Offer Engine** - Discounts, cashback, BOGO, free shipping offers
3. **Gamification Engine** - Badges, streaks, and achievements
4. **Referral Engine** - Referral code generation and tracking
5. **Campaign Manager** - Multi-engine campaign orchestration
6. **Point Expiration** - Automatic point expiration after configurable days
7. **Auto-Upgrade** - Automatic tier upgrades based on points

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/loyalty/:userId | Get user loyalty profile |
| POST | /api/loyalty/:userId/points | Credit/debit points |
| GET | /api/offers | Get active offers |
| POST | /api/offers/:offerId/redeem | Redeem an offer |
| GET | /api/gamification/:userId/badges | Get user badges |
| GET | /api/gamification/:userId/streak | Get user streak info |
| POST | /api/referrals/generate | Generate referral code |
| POST | /api/referrals/track | Track referral |
| POST | /api/campaigns | Create engagement campaign |
| POST | /api/campaigns/:campaignId/execute | Execute campaign |

## Loyalty Tiers
| Tier | Min Points | Multiplier |
|------|------------|------------|
| Bronze | 0 | 1.0x |
| Silver | 1000 | 1.25x |
| Gold | 5000 | 1.5x |
| Platinum | 15000 | 2.0x |

## Quick Start

```bash
cd REZ-engagement-platform
npm install
npm run dev
```

## Environment Variables
- PORT (default: 3000)
- INTERNAL_SERVICE_TOKEN

## Related Services
- REZ-wallet-service - Points/coins storage
- REZ-marketing-backend - Campaign management
- REZ-unified-offer-brain - Offer optimization
- RABTUL - Payment processing