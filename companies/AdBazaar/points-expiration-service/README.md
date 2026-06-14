# Points Expiration Service

Automated points expiration handling for AdBazaar.

## Overview

This service manages the automated expiration of loyalty points. It provides customizable expiration rules, grace periods, notification scheduling, and forgiveness capabilities.

## Features

- Configurable expiration rules per company/tier
- Automatic expiration processing via cron jobs
- Multi-channel notifications (email, SMS, push, in-app)
- Grace period support
- Auto-forgiveness for small amounts
- Expiration statistics and reporting

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/expiration` | Create expiration record |
| GET | `/api/expiration/:memberId` | Get member expirations |
| PUT | `/api/expiration/rules` | Update/create expiration rules |
| GET | `/api/expiration/pending` | Get pending expirations |
| GET | `/api/expiration/expiring` | Get expiring soon |
| POST | `/api/expiration/process` | Process all expirations |
| POST | `/api/expiration/:id/forgive` | Forgive an expiration |
| GET | `/api/expiration/stats` | Get expiration statistics |

## Models

### Expiration
```typescript
{
  expirationId: string;
  memberId: string;
  pointsAmount: number;
  earnedDate: Date;
  expirationDate: Date;
  status: 'pending' | 'expiring_soon' | 'expired' | 'used' | 'forgiven';
  notificationSent: boolean;
  forgivenBy?: string;
  forgivenReason?: string;
}
```

### Rule
```typescript
{
  ruleId: string;
  name: string;
  expirationMonths: number;
  gracePeriodDays: number;
  notificationDays: number[];
  autoForgive: boolean;
  maxForgiveAmount?: number;
  conditions: {
    minPoints?: number;
    maxPoints?: number;
    excludeTiers?: string[];
  };
}
```

### Notification
```typescript
{
  notificationId: string;
  expirationId: string;
  type: 'expiring_soon' | 'last_reminder' | 'expired' | 'forgiven';
  channel: 'email' | 'sms' | 'push' | 'in_app';
  pointsAmount: number;
}
```

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 5104 |
| MONGODB_URI | MongoDB URI | mongodb://localhost:27017/points-expiration |

## Port

**5104**