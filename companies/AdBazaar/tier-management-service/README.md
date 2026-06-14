# Tier Management Service

VIP tier management and benefits service for AdBazaar.

## Overview

This service manages VIP tiers, member benefits, and tier upgrades for the AdBazaar ecosystem. It provides a complete loyalty tier system with customizable benefits and automated tier management.

## Features

- Create and manage VIP tiers (Bronze, Silver, Gold, Platinum, etc.)
- Define tier-specific benefits and perks
- Track member points and lifetime value
- Automated tier upgrades based on points
- Manual tier upgrades for campaigns
- Upgrade history tracking
- Member statistics and analytics

## API Endpoints

### Tiers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tiers` | Create a new tier |
| GET | `/api/tiers` | Get all tiers |
| GET | `/api/tiers/:id` | Get tier by ID |
| PUT | `/api/tiers/:id` | Update tier |
| GET | `/api/tiers/:id/benefits` | Get tier benefits |

### Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/members/:id` | Get member by ID |
| GET | `/api/members/user/:userId` | Get member by user ID |
| POST | `/api/members/:id/upgrade` | Upgrade member to new tier |
| GET | `/api/members/:id/upgrade-history` | Get member upgrade history |

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/all` | Get tier statistics |

## Models

### Tier
```typescript
{
  tierId: string;
  name: string;
  level: number;
  minPoints: number;
  maxPoints?: number;
  benefits: string[];
  perks: {
    discountPercent: number;
    cashbackPercent: number;
    prioritySupport: boolean;
    exclusiveAccess: boolean;
    freeDelivery: boolean;
    extendedWarranty: boolean;
  };
  color: string;
  icon: string;
  isActive: boolean;
}
```

### Benefit
```typescript
{
  benefitId: string;
  tierId: string;
  name: string;
  type: 'discount' | 'cashback' | 'access' | 'service' | 'product';
  value: number;
  maxUsage?: number;
  validFrom?: Date;
  validUntil?: Date;
}
```

### Member
```typescript
{
  memberId: string;
  userId: string;
  companyId: string;
  currentTierId: string;
  totalPoints: number;
  lifetimePoints: number;
  pointsToNextTier: number;
  upgradeCount: number;
  status: 'active' | 'inactive' | 'suspended';
}
```

### Upgrade
```typescript
{
  upgradeId: string;
  memberId: string;
  fromTierId: string;
  toTierId: string;
  triggeredBy: 'points' | 'manual' | 'campaign' | 'system';
  effectiveDate: Date;
}
```

## Quick Start

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 5103 |
| MONGODB_URI | MongoDB connection URI | mongodb://localhost:27017/tier-management |
| LOG_LEVEL | Logging level | info |

## Health Check

```bash
curl http://localhost:5103/health
```

## Metrics

```bash
curl http://localhost:5103/metrics
```

## Port

**5103**
