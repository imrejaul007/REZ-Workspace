# BuzzLocal → Karma Foundation Bridge

> **Note:** Karma has moved to [Karma Foundation](https://github.com/imrejaul007/Karma-Foundation)

Earn Karma Foundation points for BuzzLocal activities and redeem for merchant offers.

## Karma Earning

| BuzzLocal Action | Karma Points |
|------------------|--------------|
| Check-in | 5 |
| Ask question | 2 |
| Answer question | 10 |
| Helpful answer (marked) | 25 |
| Report safety alert | 30 |
| Verified safety alert | 50 |
| Local purchase (per ₹100) | 1 |
| Local sale (per ₹100) | 2 |
| Community contribution | 15 |

## Integration

This bridge connects BuzzLocal with **Karma Foundation** service at `karma-foundation-service:3009`

## Usage

```typescript
import { buzzLocalKarmaBridge } from './bridge';

// Earn karma for check-in
await buzzLocalKarmaBridge.earnForCheckin(userId, buzzUserId, 'Koramangala');

// Earn karma for helpful answer
await buzzLocalKarmaBridge.earnForHelpfulAnswer(userId, buzzUserId, queryId);

// Get offers to redeem
const offers = await buzzLocalKarmaBridge.getAvailableOffers(userId);

// Redeem karma for offer
const result = await buzzLocalKarmaBridge.redeemForOffer({
  userId,
  buzzUserId,
  offerId,
  points: 100,
  merchantId
});
```

## Integration Points

- BuzzLocal → Karma Foundation: Earn for activities
- Karma Foundation → BuzzLocal Offers: Redeem for discounts
