# REZ Try Service

**Status:** Ready for Deployment
**Port:** 3001
**Company:** RABTUL Technologies (Shared Infrastructure)

---

## Overview

REZ Try is a product trial booking and gamified exploration platform. Users can discover trials, book slots, complete trials, and earn explorer scores.

## Features

- **Trial Discovery**: Browse trials by category and location
- **Booking Management**: Reserve and manage trial slots
- **Explorer Score**: Gamified engagement scoring system
- **Campaigns**: Brand-sponsored trial campaigns
- **Leaderboard**: Ranked explorer rankings
- **Coins**: Earn coins on trial completions

## Explorer Tiers

| Tier | Score | Benefits |
|------|-------|----------|
| Curious | 0-99 | Basic access |
| Explorer | 100-499 | Standard rewards |
| Adventurer | 500-999 | Premium rewards |
| Conqueror | 1000+ | Exclusive trials |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trials` | Get all trials |
| GET | `/api/trials/:id` | Get trial by ID |
| GET | `/api/trials/nearby/:lat/:lng` | Get nearby trials |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/user/:userId` | Get user bookings |
| PATCH | `/api/bookings/:id/complete` | Complete booking |
| GET | `/api/explorer/score/:userId` | Get explorer score |
| GET | `/api/explorer/leaderboard` | Get leaderboard |
| GET | `/api/campaigns` | Get active campaigns |
| GET | `/api/coins/balance/:userId` | Get coin balance |

## Integrations

### REZ Go
```typescript
// Check if product has trial
import { checkProductTrial, getTrialRecommendations, recordTrialConversion } from './integrations/tryIntegration';

// Check if cart item has trial
const trial = await checkProductTrial(productId);

// Get trial recommendations based on cart
const recommendations = await getTrialRecommendations(userId, cartItems);

// Record trial completion
await recordTrialConversion(userId, trialId, sessionId);
```

### RABTUL Services
- Wallet (4004): Coin credits
- Auth (4002): JWT verification

## Environment Variables

```bash
PORT=3001
MONGODB_URI=mongodb://localhost:27017/rez_try
INTERNAL_SERVICE_TOKEN=<secret>

# Integration URLs
WALLET_SERVICE_URL=http://localhost:4004
AUTH_SERVICE_URL=http://localhost:4002
```

## Commands

```bash
npm install
npm run dev    # Development (port 3001)
npm run build  # Production build
npm start      # Start production
npm test       # Run tests (9 passing)
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  REZ TRY SERVICE (3001)                           │
├─────────────────────────────────────────────────────────────────┤
│  Routes: trials | bookings | explorer | campaigns | coins      │
├─────────────────────────────────────────────────────────────────┤
│  Models: Trial | Booking | ExplorerScore | Campaign             │
├─────────────────────────────────────────────────────────────────┤
│  Services:                                                       │
│  • TrialService (trial CRUD)                                     │
│  • BookingService (booking management)                          │
│  • ExplorerService (score calculation)                           │
│  • CoinService (coin rewards)                                  │
├─────────────────────────────────────────────────────────────────┤
│  Integrations:                                                   │
│  • Wallet (4004) - Coin credits                                 │
│  • Auth (4002) - JWT verification                               │
└─────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REZ APP MOBILE                                │
├─────────────────────────────────────────────────────────────────┤
│  Screens: app/try/ (14 screens)                                │
│  Services: services/tryApi.ts                                    │
└─────────────────────────────────────────────────────────────────┘
```
