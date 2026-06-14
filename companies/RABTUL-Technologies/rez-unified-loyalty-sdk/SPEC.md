# REZ Unified Loyalty SDK - SPEC.md

**Version:** 1.0.0
**Company:** RABTUL-Technologies
**Category:** SDK

---

## Overview

Single SDK for all REZ loyalty features. Provides a unified interface to access loyalty points, rewards, tiers, and engagement tracking.

---

## Installation

```bash
npm install rez-unified-loyalty-sdk
```

---

## Usage

```typescript
import { LoyaltySDK } from 'rez-unified-loyalty-sdk';

const sdk = new LoyaltySDK({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.rez.money'
});

// Get user loyalty info
const account = await sdk.loyalty.getAccount('user_123');

// Earn points
await sdk.loyalty.earn({
  userId: 'user_123',
  points: 100,
  reason: 'purchase'
});

// Redeem reward
await sdk.loyalty.redeem({
  userId: 'user_123',
  rewardId: 'reward_456'
});
```

---

## API Reference

### Loyalty
```typescript
sdk.loyalty.getAccount(userId)
sdk.loyalty.earn({ userId, points, reason })
sdk.loyalty.redeem({ userId, rewardId })
sdk.loyalty.getTiers()
```

### Rewards
```typescript
sdk.rewards.list()
sdk.rewards.get(rewardId)
sdk.rewards.claim({ userId, rewardId })
```

### Engagement
```typescript
sdk.engagement.track({ userId, action, metadata })
sdk.engagement.getHistory(userId)
```

---

## Dependencies

```json
{
  "axios": "^1.6.0",
  "zod": "^3.22.4"
}
```

---

## Status

- [x] TypeScript SDK
- [x] Loyalty account
- [x] Points earning
- [x] Rewards redemption
- [x] Engagement tracking
