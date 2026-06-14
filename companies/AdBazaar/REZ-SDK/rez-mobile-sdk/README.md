# REZ AdBazaar Mobile SDK

React Native / Expo SDK for AdBazaar Intelligence Services.

## Installation

```bash
npm install @rez/adbazaar-mobile
```

## Usage

```typescript
import { AdIntelligenceMobile } from '@rez/adbazaar-mobile';

// Initialize with your API key
const ad = new AdIntelligenceMobile({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.adbazaar.rez.app',
});

// Validate email
const result = await ad.email.validate('user@example.com');

// Detect fraud
const fraud = await ad.fraud.detect({
  userId: user.id,
  ip: device.ip,
  eventType: 'click',
});

// Predict churn
const churn = await ad.analytics.churnPredict({
  customerId: user.id,
  features: {
    daysSinceLastPurchase: 45,
    totalOrders: user.orderCount,
    avgOrderValue: user.avgOrderValue,
    engagementScore: user.engagementScore,
  },
});

// Analyze sentiment
const sentiment = await ad.analytics.sentiment({
  text: 'I love this product!',
});
```

## Services Available

| Service | Method | Description |
|---------|--------|-------------|
| Email Validator | `email.validate()` | Verify email addresses |
| Fraud Detection | `fraud.detect()` | Detect bots and fraud |
| A/B Testing | `ab.getVariant()` | Get experiment variant |
| Brand Safety | `brandSafety.check()` | Content moderation |
| Viewability | `viewability.track()` | Track ad viewability |
| Attribution | `attribution.attribute()` | Multi-touch attribution |
| Audience Sync | `audience.create()` | Create audience segments |
| Creative Rotation | `creative.rotate()` | Get rotating creatives |
| Frequency | `frequency.check()` | Check impression caps |
| Budget | `budget.allocate()` | Allocate ad budget |
| Churn Predict | `analytics.churnPredict()` | Predict churn risk |
| LTV | `analytics.ltv()` | Calculate lifetime value |
| NBA | `analytics.nextBestAction()` | Get next action |
| Sentiment | `analytics.sentiment()` | Analyze text sentiment |
| Competitor | `competitor.list()` | Monitor competitors |

## API Configuration

```typescript
interface MobileConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  enableOffline?: boolean;
}
```

## Offline Support

The SDK caches responses for offline use:

```typescript
const ad = new AdIntelligenceMobile({
  apiKey: 'key',
  enableOffline: true,
  offlineCacheDuration: 3600, // 1 hour
});
```

## License

MIT
