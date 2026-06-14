# karma-loyalty-bridge - Features & Endpoints

**Package:** karma-loyalty-bridge  
**Port:** 4098  
**Purpose:** Karma → REZ Coins conversion service  
**Tech Stack:** Node.js, Express, TypeScript, MongoDB  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Service Overview](#1-service-overview)
2. [Service Components](#2-service-components)
3. [API Endpoints](#3-api-endpoints)
4. [Conversion Rates](#4-conversion-rates)
5. [Tier System](#5-tier-system)
6. [Request/Response Examples](#6-requestresponse-examples)
7. [Database Models](#7-database-models)
8. [Environment Variables](#8-environment-variables)
9. [Security Features](#9-security-features)
10. [Quick Start](#10-quick-start)

---

## 1. Service Overview

The karma-loyalty-bridge is a microservice that handles the conversion of Karma points earned through social impact activities into REZ coins. This service bridges the social impact ecosystem with the broader RABTUL loyalty platform.

### Purpose

- Convert accumulated karma points to redeemable REZ coins
- Apply tier-based multipliers based on user karma scores
- Track conversion history for audit and transparency
- Maintain conversion rate configurations
- Prevent duplicate conversions through idempotency

---

## 2. Service Components

| Component | Purpose | Status |
|-----------|---------|--------|
| **Conversion Engine** | Karma → REZ conversion | ✅ |
| **Tier Management** | Bronze/Silver/Gold/Platinum | ✅ |
| **Rate Calculator** | Dynamic rate calculation | ✅ |
| **Idempotency Handler** | Duplicate prevention | ✅ |
| **Health Monitor** | Service health checks | ✅ |

---

## 3. API Endpoints

### Conversion (Core)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| POST | `/api/v1/convert/preview` | Preview conversion | Public | ✅ |
| POST | `/api/v1/convert` | Execute conversion | Public | ✅ |
| GET | `/api/v1/conversions/:userId` | Conversion history | Public | ✅ |

### Configuration

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/v1/config/rates` | Get conversion rates | Public | ✅ |
| PUT | `/api/v1/config/rates` | Update conversion rates | Admin | ✅ |

### Health

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/health` | Health check | Public | ✅ |
| GET | `/ready` | Readiness probe | Public | ✅ |

---

## 4. Conversion Rates

### Base Rates by Action

| Action | Base Rate | Karma Multiplier | Description |
|--------|-----------|-----------------|-------------|
| Check-in | 10% | 1.0x | Event check-in |
| Donation | 15% | 1.5x | Donation activities |
| Share | 5% | 0.5x | Social sharing |
| Review | 10% | 1.0x | Event reviews |
| Mission | 20% | 2.0x | Mission completion |
| Streak | 25% | 2.5x | Consecutive participation |

### Score Bonus

Every 100 karma score points above 450 grants +5% bonus (max 50%)

### Final Conversion Formula

```
REZ Coins = Karma Points × Base Rate × Tier Multiplier × Score Bonus
```

---

## 5. Tier System

### Tier Definitions

| Tier | Multiplier | Karma Score Threshold | Badge Color |
|------|-----------|---------------------|-------------|
| Bronze | 1.0x | 0 | `#CD7F32` |
| Silver | 1.25x | 450 | `#C0C0C0` |
| Gold | 1.5x | 600 | `#FFD700` |
| Platinum | 2.0x | 750 | `#E5E4E2` |

### Tier Thresholds

| Tier | Min Score | Max Score | Bonus Rate |
|------|-----------|-----------|------------|
| Bronze | 0 | 449 | Base rate only |
| Silver | 450 | 599 | +5% per 100 pts |
| Gold | 600 | 749 | +10% per 100 pts |
| Platinum | 750+ | - | +15% per 100 pts (max 50%) |

---

## 6. Request/Response Examples

### Preview Conversion

**Request:**
```http
POST /api/v1/convert/preview
Content-Type: application/json

{
  "karmaPoints": 100,
  "actionType": "checkin",
  "karmaScore": 500
}
```

**Response:**
```json
{
  "karmaPoints": 100,
  "actionType": "checkin",
  "karmaScore": 500,
  "tier": "SILVER",
  "baseRate": 0.1,
  "tierMultiplier": 1.25,
  "scoreBonus": 5,
  "totalMultiplier": 1.3125,
  "rezCoins": 13.125
}
```

### Execute Conversion

**Request:**
```http
POST /api/v1/convert
Content-Type: application/json

{
  "userId": "user_123",
  "karmaUserId": "karma_user_456",
  "karmaPoints": 100,
  "actionType": "checkin",
  "karmaScore": 500,
  "description": "Beach cleanup event",
  "idempotencyKey": "unique_key_123"
}
```

**Response:**
```json
{
  "success": true,
  "conversion": {
    "id": "conv_789",
    "userId": "user_123",
    "karmaPoints": 100,
    "rezCoins": 13.125,
    "tier": "SILVER",
    "status": "completed",
    "timestamp": "2026-06-12T10:30:00Z"
  },
  "idempotent": false
}
```

### Idempotent Response (Duplicate Request)

```json
{
  "success": true,
  "conversion": {
    "id": "conv_789",
    "userId": "user_123",
    "karmaPoints": 100,
    "rezCoins": 13.125,
    "status": "completed"
  },
  "idempotent": true
}
```

### Get Conversion History

**Request:**
```http
GET /api/v1/conversions/user_123?limit=50&offset=0
```

**Response:**
```json
{
  "success": true,
  "conversions": [
    {
      "id": "conv_789",
      "karmaPoints": 100,
      "rezCoins": 13.125,
      "tier": "SILVER",
      "status": "completed",
      "createdAt": "2026-06-12T10:30:00Z"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

---

## 7. Database Models

### ConversionRecord

```typescript
interface ConversionRecord {
  _id: ObjectId;
  userId: string;                    // RABTUL user ID
  karmaUserId: string;              // Karma Foundation user ID
  karmaPoints: number;              // Points converted
  rezCoins: number;                 // Coins received
  action: string;                   // Action type
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  karmaScore: number;               // User's karma score
  status: 'completed' | 'pending' | 'failed';
  idempotencyKey: string;           // Unique key for idempotency
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 8. Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | Yes | 4098 | Service port |
| NODE_ENV | Yes | development | Environment |
| MONGODB_URI | Yes | - | MongoDB connection |
| CORS_ORIGIN | Yes | * | Allowed origins |
| ADMIN_TOKEN | Yes | - | Admin operations |
| RABTUL_URL | No | http://localhost:4004 | RABTUL platform URL |
| KARMA_URL | No | http://localhost:3009 | Karma service URL |

---

## 9. Security Features

| Feature | Status | Description |
|---------|--------|-------------|
| Request Body Limit | ✅ | 10kb max |
| Zod Validation | ✅ | All inputs validated |
| Timing-Safe Comparison | ✅ | Admin token comparison |
| Atomic Upsert | ✅ | Idempotency handling |
| Rate Limiting | ✅ | 100 req/15min per IP |
| CORS Configuration | ✅ | Explicit origin |
| Helmet Security | ✅ | Security headers |

---

## 10. Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Start
npm start

# Development
npm run dev
```

### Docker

```bash
# Build image
docker build -t karma-loyalty-bridge:latest .

# Run container
docker run -d -p 4098:4098 \
  -e MONGODB_URI=mongodb://host:27017/karma_loyalty \
  -e ADMIN_TOKEN=your-token \
  karma-loyalty-bridge:latest
```

---

## Dependencies

| Service | Purpose |
|---------|---------|
| MongoDB | Conversion records |
| RABTUL Wallet | Coin credits |
| Karma Service | Karma verification |

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| VAL_001 | Invalid karmaPoints | Points must be positive |
| VAL_002 | Invalid actionType | Unknown action type |
| VAL_003 | Invalid userId | userId format invalid |
| VAL_004 | Invalid karmaScore | Score must be non-negative |
| SYS_001 | Conversion failed | Internal conversion error |
| SYS_002 | Database error | MongoDB operation failed |

---

**Last Updated:** June 12, 2026