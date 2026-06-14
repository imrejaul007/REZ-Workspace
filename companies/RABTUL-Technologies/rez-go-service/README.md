# REZ Go Service

**Tagline:** "Smart Savings + Fast Checkout"
**Positioning:** "India's Offline Commerce Operating Layer"
**Port:** 4075
**Company:** RABTUL Technologies

## Overview

REZ Go is an intelligent offline commerce layer that enables Scan & Go shopping for retail stores. It integrates seamlessly with the existing REZ App's universal scanner.

## Key Features

### Core Checkout (Layer 1)
- Smart Store Entry - QR scan to start shopping
- Live Cart - Real-time updates via WebSocket
- Barcode Scanner - EAN/UPC/QR support
- Exit Verification - HMAC-signed exit QR (5-min expiry)
- Checkout Recovery - "Move to Counter" transfer

### Product Intelligence (Layer 2)
- Product Intelligence - Ingredients, nutrition, health insights
- Universal Scan - Scan ANY barcode anywhere
- Product Timeline - Price history, predictions, best time to buy

### Commerce Intelligence (Layer 3)
- Savings Meter - "You saved ₹XXX today" - killer feature
- Smart Cashback - Product/brand/time/streak bonuses
- Sponsored Commerce - Brand campaigns, featured products
- Combo Suggestions - AI-powered product combos

### User Intelligence (Layer 4)
- Smart Receipts - Searchable, natural language queries
- Shopping Lists - AI-generated lists
- Receipt Intelligence - Expiry tracking, reorder suggestions

## Quick Start

```bash
# Install dependencies
npm install

# Start MongoDB and Redis (or use docker-compose)
docker-compose up -d

# Seed demo data
npm run seed          # Basic seed
npm run seed:extended # Extended (product intelligence)
npm run seed:all      # Both seeds

# Start service
npm run dev

# Run tests
npm test
npm run test:coverage
```

## Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f rez-go-service
```

## API Endpoints

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions/start` | Start shopping session |
| GET | `/api/sessions/:sessionId` | Get session details |
| DELETE | `/api/sessions/:sessionId` | Cancel session |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions/:sessionId/items` | Add item |
| PATCH | `/api/sessions/:sessionId/items/:itemId` | Update quantity |
| DELETE | `/api/sessions/:sessionId/items/:itemId` | Remove item |

### Checkout
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions/:sessionId/checkout` | Complete checkout |
| POST | `/api/sessions/:sessionId/exit-verify` | Verify exit QR |
| POST | `/api/sessions/:sessionId/recover` | Move to counter |

### Product Intelligence
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/:barcode` | Get product info |
| GET | `/api/products/:barcode/intelligence` | Full intelligence |
| GET | `/api/timeline/:productId` | Price timeline |

### Receipts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/receipts/:sessionId` | Get receipt |
| GET | `/api/receipts/search` | Search receipts |
| GET | `/api/receipts/user/:userId` | User receipts |

### QR
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/qr/store` | Generate store QR |
| POST | `/api/qr/exit/:sessionId` | Generate exit QR |
| POST | `/api/verify` | Verify any QR |

## Architecture

```
REZ Go (:4075)
├── API Service (4075)              # Express + WebSocket
├── Session Service                  # Shopping sessions
├── Cart Service                    # Real-time cart
├── Checkout Service                # Payment + exit
├── Fraud Engine                   # 6-factor detection
├── Cashback Service               # Smart rewards
├── Product Service                # Intelligence
├── QR Service                     # Generation + verification
└── Sync Service                   # Offline queue
```

## Cashback Rules

| Type | Example |
|------|---------|
| Product | +5% on Amul |
| Brand | +3% on Nestle |
| Store | +2% base |
| Time | +1% happy hour (2-5 PM) |
| Streak | +1% (3-day), +2% (5-day), +3% (7-day) |

## Fraud Detection (6 Factors)

1. Cart Value - Unusually high
2. Velocity - Too many items quickly
3. Duration - Session too short/long
4. Items - Suspicious product mix
5. Quantity - Excessive amounts
6. History - Previous fraud score

## QR Types

| Type | Format |
|------|--------|
| Store Entry | `{"intent":"go-session","v":1,"storeId":"..."}` |
| Product | `{"intent":"go-product","v":1,"sessionId":"...","barcode":"..."}` |
| Recovery | `{"intent":"go-recovery","v":1,"transferId":"RCV-xxx"}` |
| Exit Token | `REZG:{base64(sessionId:expiresAt:hmac)}` |

## Integrations

| Service | Port | Purpose |
|---------|------|---------|
| RABTUL Wallet | 4004 | Cashback credit |
| RABTUL Payment | 4001 | UPI/Card payments |
| RABTUL Auth | 4002 | JWT authentication |
| REZ Intelligence | 4018 | AI recommendations |

## Environment Variables

See `.env.example` for all configuration options.

## Documentation

- [Full Docs](../../docs/REZ-GO.md)
- [SOT.md](../../SOT.md)

## License

Proprietary - RABTUL Technologies
