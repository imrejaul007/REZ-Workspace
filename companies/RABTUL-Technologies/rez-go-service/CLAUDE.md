# REZ Go Service

**Status:** Ready for Deployment
**Port:** 4075
**Company:** RABTUL Technologies (Shared Infrastructure)

---

## Overview

REZ Go is an intelligent offline commerce layer that enables Scan & Go shopping for retail stores, integrating into the existing ReZ App's universal scanner.

## Features

- **Smart Store Entry**: QR scan to start shopping
- **Live Cart**: Real-time WebSocket updates
- **Barcode Scanner**: EAN/UPC/QR support
- **Savings Meter**: "You saved ₹XXX today"
- **Smart Cashback**: Product/brand/time/streak bonuses
- **Fraud Detection**: 6-factor engine
- **Exit Verification**: HMAC-signed exit QR
- **Offline Mode**: SQLite storage, queue, sync
- **Product Intelligence**: Ingredients, nutrition, health insights
- **Voice Shopping**: "Add milk", voice commands
- **Universal Lookup**: Scan ANY barcode

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions/:id` | Get session details |
| POST | `/api/sessions/start` | Start shopping session |
| POST | `/api/cart/items` | Add item to cart |
| PATCH | `/api/cart/items/:id` | Update quantity |
| DELETE | `/api/cart/items/:id` | Remove item |
| POST | `/api/checkout` | Complete checkout |
| GET | `/api/stores/:id` | Get store info |
| POST | `/api/qr/exit-verify` | Verify exit QR |
| GET | `/api/universal/:barcode` | Universal barcode lookup |

## WebSocket

| Event | Description |
|-------|-------------|
| `cart.updated` | Cart item changed |
| `session.started` | New session created |
| `exit.verified` | Exit verified |
| `fraud.alert` | Fraud detected |

## Integrations

### REZ Prive
```typescript
// Get eligibility for bonus calculation
import { getPriveEligibility, calculatePriveBonus } from './integrations/priveIntegration';

// Check user tier for bonus multiplier
const eligibility = await getPriveEligibility(userId);
const bonus = calculatePriveBonus(amount, eligibility.tier);
```

### REZ Try
```typescript
// Check for product trials
import { checkProductTrial, recordTrialConversion } from './integrations/tryIntegration';

// Check if product has trial
const trial = await checkProductTrial(productId);

// Record conversion
await recordTrialConversion(userId, trialId, sessionId);
```

### RABTUL Services
- Wallet (4004): Cashback credits
- Payment (4001): UPI/Card payments
- Auth (4002): JWT verification

## Environment Variables

```bash
PORT=4075
MONGODB_URI=mongodb://localhost:27017/rez_go
JWT_SECRET=<secret>
INTERNAL_SERVICE_TOKEN=<secret>

# Integration URLs
WALLET_SERVICE_URL=http://localhost:4004
PAYMENT_SERVICE_URL=http://localhost:4001
PRIVE_SERVICE_URL=http://localhost:4070
TRY_SERVICE_URL=http://localhost:3001
```

## Commands

```bash
npm install
npm run dev    # Development (port 4075)
npm run build  # Production build
npm start      # Start production
npm test       # Run tests (31 passing)
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    REZ GO SERVICE (4075)                          │
├─────────────────────────────────────────────────────────────────┤
│  Routes: sessions | cart | checkout | merchant | sync | stores  │
├─────────────────────────────────────────────────────────────────┤
│  Services:                                                        │
│  • SessionService (session lifecycle)                             │
│  • CartService (cart management)                                │
│  • CheckoutService (payment flow)                                │
│  • FraudService (6-factor detection)                            │
│  • CashbackService (smart cashback engine)                      │
│  • ProductService (barcode lookup)                              │
├─────────────────────────────────────────────────────────────────┤
│  Integrations:                                                   │
│  • Wallet (4004) - Cashback credits                             │
│  • Payment (4001) - UPI/Card payments                           │
│  • Prive (4070) - Eligibility + bonus                          │
│  • Try (3001) - Product trials                                   │
└─────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REZ APP MOBILE                                │
├─────────────────────────────────────────────────────────────────┤
│  Screens: app/go/ (8 screens)                                   │
│  Components: components/go/ (12 components)                     │
│  WebSocket: Real-time cart updates                              │
└─────────────────────────────────────────────────────────────────┘
```
