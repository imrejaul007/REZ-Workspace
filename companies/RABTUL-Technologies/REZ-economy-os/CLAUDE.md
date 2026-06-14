# CLAUDE.md - Economy OS

## Project Overview

**Name:** REZ-economy-os
**Type:** SUTAR OS - Economy Layer
**Port:** 4251
**Company:** RABTUL Technologies
**Part of:** SUTAR OS Phase 6 - EconomyOS
**Lines:** 310
**Status:** ✅ PRODUCTION READY

## What is Economy OS?

Economy OS manages the economic layer of SUTAR OS, including karma points, platform fees, settlements, and transaction tracking.

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript
- MongoDB/Mongoose

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server |
| `npm run build` | Build for production |
| `npm start` | Production server |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 4251 | Service port |
| MONGODB_URI | Yes | - | MongoDB connection |

## Features

### 1. Karma Points System

| Feature | Description |
|---------|-------------|
| **Point System** | Award/deduct karma points |
| **Point History** | Full history of point changes |
| **Reason Tracking** | Track why points changed |
| **Tier System** | Automatic tier based on points |

### 2. Karma Tiers

| Points | Tier | Benefits |
|--------|------|----------|
| 10000+ | **Diamond** | Premium benefits, highest visibility |
| 5000-9999 | **Platinum** | Priority support, enhanced features |
| 2000-4999 | **Gold** | Enhanced features, badges |
| 500-1999 | **Silver** | Standard features |
| 0-499 | **Bronze** | Basic features |

### 3. Platform Fees

| Feature | Description |
|---------|-------------|
| **Fee Types** | transaction, subscription, listing, withdrawal |
| **Percentage Fees** | Configurable percentage rate |
| **Fixed Fees** | Fixed amount fees |
| **Min/Max** | Set fee limits |
| **Fee Calculation** | Calculate fees automatically |

### 4. Settlement Engine

| Feature | Description |
|---------|-------------|
| **Gross Amount** | Total transaction amount |
| **Fee Calculation** | Calculate all applicable fees |
| **Net Amount** | Amount after fees |
| **Fee Breakdown** | Detailed fee breakdown |
| **Settlement Calculation** | Calculate settlement amounts |

### 5. Transaction Management

| Feature | Description |
|---------|-------------|
| **Transaction Types** | payment, refund, fee, reward, karma |
| **From/To Tracking** | Track sender and receiver |
| **Status Tracking** | pending, completed, failed, refunded |
| **Currency** | Multi-currency support |
| **Reference Tracking** | Link to external references |

### 6. Balance Management

| Feature | Description |
|---------|-------------|
| **Balance Tracking** | Track account balances |
| **Auto-completion** | Auto-complete small transactions |
| **Transaction History** | Full history |

## API Endpoints

### Karma

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/karma/:entityId` | Get karma and tier |
| POST | `/api/karma/:entityId/points` | Add/remove points |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transactions` | Create transaction |
| GET | `/api/transactions` | List transactions |
| GET | `/api/transactions/:id` | Get transaction |
| POST | `/api/transactions/:id/complete` | Complete transaction |
| POST | `/api/transactions/:id/refund` | Refund transaction |

### Fees

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fees` | Create/update fee |
| GET | `/api/fees` | List fees |
| DELETE | `/api/fees/:id` | Delete fee |

### Settlement

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/settlement` | Calculate settlement |

## Settlement Calculation

```typescript
interface Settlement {
  grossAmount: number;
  totalFee: number;
  netAmount: number;
  feeBreakdown: FeeBreakdown[];
}

interface FeeBreakdown {
  type: string;
  rate: number;
  amount: number;
}

// Calculation:
// totalFee = (grossAmount × rate%) + fixed
// netAmount = grossAmount - totalFee
```

## Karma Point Actions

| Action | Points | Example |
|--------|--------|---------|
| Successful delivery | +10 | Completed on time |
| Positive feedback | +5 | 5-star review |
| Fast payment | +3 | Paid within 24h |
| Dispute lost | -20 | Ruled against |
| Late delivery | -10 | Missed deadline |
| Payment default | -50 | Failed to pay |

## Integration

### Upstream
- ContractOS
- NegotiationOS
- Payment systems

### Downstream
- Trust Scorer
- Dashboard

## Health Endpoints

- `GET /health` - Health check
- `GET /health/ready` - Readiness probe

## File Structure

```
REZ-economy-os/
├── src/
│   └── index.ts                    # Main server (all-in-one)
├── package.json
├── tsconfig.json
└── CLAUDE.md (this file)
```

## Notes

- Economy OS manages karma, fees, settlements
- Karma tiers unlock benefits
- Settlement calculates net after fees
- Small transactions auto-complete
