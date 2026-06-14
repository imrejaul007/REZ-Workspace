# REZ AdBazaar SDK

**Version:** 1.0.0  
**Date:** June 2026

---

## Overview

Unified JavaScript/TypeScript SDK for REZ AdBazaar Intelligence Services.

## Installation

```bash
npm install @rez/adbazaar-sdk
```

## Services

This SDK provides access to all 15 AdBazaar intelligence services:

### Ports 4810-4819 (Ad Intelligence)

| Service | Port | Purpose |
|---------|------|---------|
| Email Validator | 4810 | Email verification, MX/SMTP validation |
| Fraud Detection | 4811 | Bot detection, click fraud |
| Creative A/B Testing | 4812 | Split testing, statistical significance |
| Brand Safety | 4813 | Content moderation, keyword filtering |
| Viewability Tracker | 4814 | IAB viewability measurement |
| Attribution Modeling | 4815 | Multi-touch attribution (6 models) |
| Audience Sync | 4816 | DMP integration (Liveramp, Segment) |
| Creative Rotation | 4817 | Epsilon-greedy, Thompson sampling |
| Frequency Capping | 4818 | Creative fatigue detection |
| Budget Allocator | 4819 | AI-powered budget optimization |

### Ports 4900-4904 (Analytics)

| Service | Port | Purpose |
|---------|------|---------|
| Churn Predictor | 4900 | Customer churn prediction |
| LTV Calculator | 4901 | Lifetime value scoring |
| Next Best Action | 4902 | Action recommendations |
| Sentiment Analyzer | 4903 | Social sentiment analysis |
| Competitor Monitor | 4904 | Competitor tracking |

---

## Quick Start

```javascript
import { AdIntelligence } from '@rez/adbazaar-sdk';

// Initialize
const ad = new AdIntelligence({
  baseUrl: 'http://localhost',
  timeout: 10000,
});

// Validate email
const result = await ad.email.validate('user@example.com');
console.log(result.isValid);

// Detect fraud
const fraudResult = await ad.fraud.detect({
  userId: 'user_123',
  ip: '192.168.1.1',
  eventType: 'click',
});
console.log(fraudResult.riskScore);

// Create A/B test
const experiment = await ad.ab.create({
  name: 'Homepage CTA Test',
  variants: ['control', 'variant_a'],
});

// Attribute conversion
const attribution = await ad.attribution.attribute({
  customerId: 'cust_123',
  touches: [
    { channel: 'facebook', timestamp: '2024-01-01T10:00:00Z' },
    { channel: 'google', timestamp: '2024-01-03T10:00:00Z' },
  ],
  model: 'linear',
});

// Predict churn
const churn = await ad.analytics.churnPredict({
  customerId: 'cust_123',
  features: {
    daysSinceLastPurchase: 45,
    totalOrders: 12,
    avgOrderValue: 150,
  },
});
console.log(churn.churnProbability);

// Calculate LTV
const ltv = await ad.analytics.ltv({
  customerId: 'cust_123',
  features: {
    totalRevenue: 5000,
    totalOrders: 25,
    customerAge: 365,
  },
});
console.log(ltv.predictedLTV);

// Get next best action
const action = await ad.analytics.nextBestAction({
  customerId: 'cust_123',
  context: { lastPurchase: '2024-01-15', cartValue: 500 },
});
console.log(action.recommendedAction);

// Analyze sentiment
const sentiment = await ad.analytics.sentiment({
  text: 'I love this product! Best purchase ever.',
});
console.log(sentiment.score, sentiment.label);

// Check brand safety
const safety = await ad.brandSafety.check({
  content: 'Check this product',
  type: 'text',
});
console.log(safety.isSafe);

// Track viewability
await ad.viewability.track({
  adId: 'ad_123',
  impressionId: 'imp_456',
  visible: true,
  duration: 2500,
});

// Get creative for rotation
const creative = await ad.creative.rotate({
  campaignId: 'camp_123',
  userId: 'user_456',
});
console.log(creative.adId);

// Check frequency cap
const cap = await ad.frequency.check({
  userId: 'user_123',
  campaignId: 'camp_456',
});
console.log(cap.canServe, cap.impressions);

// Allocate budget
const budget = await ad.budget.allocate({
  totalBudget: 10000,
  channels: ['facebook', 'google', 'tiktok'],
  historical: {
    facebook: { spend: 3000, conversions: 150 },
    google: { spend: 4000, conversions: 200 },
    tiktok: { spend: 3000, conversions: 100 },
  },
});
console.log(budget.allocation);

// Sync audience
const audience = await ad.audience.create({
  name: 'High Value Customers',
  segments: ['high_ltv', 'repeat_buyer'],
});
console.log(audience.id);

// Monitor competitors
const competitors = await ad.competitor.list();
console.log(competitors);
```

---

## Full API Reference

### AdIntelligence Class

```typescript
interface AdIntelligenceConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

class AdIntelligence {
  email: EmailValidatorService;
  fraud: FraudDetectionService;
  ab: ABTestingService;
  brandSafety: BrandSafetyService;
  viewability: ViewabilityService;
  attribution: AttributionService;
  audience: AudienceSyncService;
  creative: CreativeRotationService;
  frequency: FrequencyCappingService;
  budget: BudgetAllocatorService;
  analytics: AnalyticsService;
  competitor: CompetitorMonitorService;
}
```

### Email Validator (Port 4810)

```typescript
interface EmailValidatorService {
  validate(email: string): Promise<EmailValidationResult>;
  checkDisposable(email: string): Promise<boolean>;
  checkMx(email: string): Promise<boolean>;
}

interface EmailValidationResult {
  email: string;
  isValid: boolean;
  isDisposable: boolean;
  hasMx: boolean;
  riskScore: number;
}
```

### Fraud Detection (Port 4811)

```typescript
interface FraudDetectionService {
  detect(params: FraudDetectionParams): Promise<FraudResult>;
  getRiskScore(userId: string): Promise<RiskScore>;
}

interface FraudDetectionParams {
  userId: string;
  ip: string;
  deviceFingerprint?: string;
  eventType: 'click' | 'view' | 'conversion';
}

interface FraudResult {
  riskScore: number;
  isBot: boolean;
  isSuspicious: boolean;
  reasons: string[];
}
```

### A/B Testing (Port 4812)

```typescript
interface ABTestingService {
  create(params: ExperimentParams): Promise<Experiment>;
  getVariant(experimentId: string, userId: string): Promise<string>;
  trackConversion(experimentId: string, variant: string, userId: string): Promise<void>;
  getResults(experimentId: string): Promise<ExperimentResults>;
}
```

### Attribution Modeling (Port 4815)

```typescript
interface AttributionService {
  attribute(params: AttributionParams): Promise<AttributionResult>;
  getModelPerformance(model: AttributionModel): Promise<ModelPerformance>;
}

type AttributionModel = 'first-click' | 'last-click' | 'linear' | 'time-decay' | 'position-based' | 'data-driven';

interface AttributionParams {
  customerId: string;
  touches: Touchpoint[];
  conversionValue: number;
  model?: AttributionModel;
}
```

### Analytics (Ports 4900-4903)

```typescript
interface AnalyticsService {
  churnPredict(params: ChurnParams): Promise<ChurnResult>;
  ltv(params: LTVParams): Promise<LTVResult>;
  nextBestAction(params: NBAParams): Promise<NBAResult>;
  sentiment(params: SentimentParams): Promise<SentimentResult>;
}

interface ChurnParams {
  customerId: string;
  features: {
    daysSinceLastPurchase: number;
    totalOrders: number;
    avgOrderValue: number;
    engagementScore: number;
  };
}

interface ChurnResult {
  churnProbability: number;
  riskSegment: 'low' | 'medium' | 'high';
  recommendedActions: string[];
}
```

---

## Error Handling

```javascript
import { AdIntelligence, SDKError } from '@rez/adbazaar-sdk';

const ad = new AdIntelligence();

try {
  const result = await ad.email.validate('invalid');
} catch (error) {
  if (error instanceof SDKError) {
    console.error(`Error: ${error.message} (Code: ${error.code})`);
    if (error.retryable) {
      // Retry logic
    }
  }
}
```

---

## TypeScript Support

Full TypeScript types included:

```typescript
import { AdIntelligence, SDKConfig } from '@rez/adbazaar-sdk';

const config: SDKConfig = {
  baseUrl: 'https://api.example.com',
  timeout: 10000,
  retries: 3,
};

const ad = new AdIntelligence(config);
```

---

## License

MIT
