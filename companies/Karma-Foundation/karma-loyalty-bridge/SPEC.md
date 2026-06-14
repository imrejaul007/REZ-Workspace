# Karma Foundation - karma-loyalty-bridge

**Version:** 1.0.0
**Port:** 4098
**Company:** Karma Foundation
**Category:** Loyalty Integration

---

## Overview

The Karma-Loyalty Bridge connects Karma Foundation's social impact system with the RABTUL ecosystem, enabling conversion of Karma points to REZ coins.

---

## Tech Stack

- Node.js, Express, TypeScript
- MongoDB for persistence
- Redis for caching

---

## Conversion Flow

```
Karma Earned (Event Complete)
         ↓
Earn Record Created
         ↓
Weekly Batch Created
         ↓
Admin Preview & Approve
         ↓
Karma-Loyalty Bridge
         ↓
Convert Karma → REZ Coins
         ↓
Credit User Wallet
```

---

## Conversion Rates

| Action | Base Rate | Description |
|--------|-----------|-------------|
| Check-in | 10 KP = 1 coin | QR/GPS verification |
| Donation | 10 KP = 1.5 coins | Charitable donations |
| Share | 20 KP = 1 coin | Social sharing |
| Review | 10 KP = 1 coin | Event reviews |
| Mission | 10 KP = 2 coins | Mission completion |
| Streak | 10 KP = 2.5 coins | Streak bonus |

---

## Tier Multipliers

| Tier | Multiplier | Threshold |
|------|------------|-----------|
| Bronze | 1.0x | 0 |
| Silver | 1.25x | 450 KP |
| Gold | 1.5x | 600 KP |
| Platinum | 2.0x | 750 KP |

---

## Score Bonus

Every 100 karma points above 450 = +5% bonus (max 50%)

---

## API Endpoints

### POST /api/v1/convert/preview
Preview conversion before committing.

```json
Request:
{
  "karmaPoints": 100,
  "actionType": "checkin",
  "karmaScore": 500
}

Response:
{
  "karmaPoints": 100,
  "actionType": "checkin",
  "karmaScore": 500,
  "tier": "SILVER",
  "baseRate": 0.1,
  "tierMultiplier": 1.25,
  "scoreBonus": 5,
  "rezCoins": 13.13,
  "breakdown": {...}
}
```

### POST /api/v1/convert
Convert karma to REZ coins.

```json
Request:
{
  "userId": "user_123",
  "karmaUserId": "karma_456",
  "karmaPoints": 100,
  "actionType": "checkin",
  "karmaScore": 500,
  "description": "Event check-in"
}

Response:
{
  "success": true,
  "conversion": {
    "id": "conv_xxx",
    "userId": "user_123",
    "karmaPoints": 100,
    "rezCoins": 13.13,
    "timestamp": "2026-05-27T..."
  }
}
```

### GET /api/v1/conversions/:userId
Get conversion history for a user.

### GET /api/v1/config/rates
Get current conversion rates.

### PUT /api/v1/config/rates
Update conversion rates (admin).

### POST /api/v1/convert/batch
Bulk conversion for batch processing.

---

## Environment Variables

```env
PORT=4098
MONGODB_URI=mongodb://localhost:27017/karma_loyalty
RABTUL_URL=http://localhost:4004
KARMA_URL=http://localhost:3009
```

---

## Integration Points

### RABTUL Services
- **RABTUL Wallet** - Coin storage
- **RABTUL Auth** - User verification

### Karma Foundation
- **karma-service** - Karma points
- **Earn Records** - Conversion source

---

## Security

- ✅ Service token authentication
- ✅ Input validation
- ✅ Rate limiting
- ✅ Audit logging

### Audit Findings (To Fix)
- ❌ In-memory storage → MongoDB
- ❌ Math.random() → crypto.randomUUID()

---

## Brand Colors

| Element | Value |
|---------|-------|
| **Primary** | `#22C55E` Fresh Green |
| **Secondary** | `#FACC15` Warm Gold |
| **Trust** | `#3B82F6` Sky Blue |

---

**Last Updated:** May 27, 2026
