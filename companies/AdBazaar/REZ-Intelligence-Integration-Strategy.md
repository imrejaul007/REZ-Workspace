# REZ Intelligence vs Hojai AI Gateway - Research & Recommendation

**Date:** 2026-05-27

---

## Executive Summary

We have **two AI/intelligence options** for AdBazaar:
1. **REZ Intelligence** - Existing production services
2. **Hojai AI Gateway** - New gateway we built

**Recommendation:** Use **BOTH** with REZ Intelligence as the backend and Hojai AI Gateway as the unified interface.

---

## Option 1: REZ Intelligence (Existing)

### Services Available

| Service | Port | AI Capability |
|---------|------|--------------|
| **REZ Intent Predictor** | 4018 | User intent classification |
| **REZ Predictive Engine** | 4141 | Churn, LTV, Conversion predictions |
| **REZ Identity Graph** | 4050 | Cross-device identity resolution |
| **REZ Signal Aggregator** | 4142 | Behavioral signal collection |
| **REZ Segmentation Service** | 4126 | Real-time user segments |
| **REZ Commerce Graph** | 4129 | Commerce relationships |
| **REZ Bootstrap Intelligence** | 4065 | Cold-start ML |

### REZ Intelligence Capabilities

#### 1. Intent Predictor (Port 4018)

**Purpose:** Real-time user intent classification

**Intent Categories:**
```
- ready_to_buy (high priority)
- just_browsing (low priority)
- research_mode (medium priority)
- deal_hunting (medium priority)
- cart_abandonment_risk (high priority)
- reactivation_needed (medium priority)
- high_value_opportunity (high priority)
```

**Signals Used:**
- Search queries
- Browse history
- Cart behavior
- Time on page
- Scroll depth
- Device type
- Session context
- Price sensitivity

#### 2. Predictive Engine (Port 4141)

**Purpose:** ML predictions for user behavior

**Predictions Available:**
```
- Churn probability
- LTV score
- Revisit probability
- Conversion probability
- Propensity scoring
- Risk segmentation
- Segment-based ML
```

**Segments:**
- At-risk users
- High-value users
- Loyal users
- Dormant users
- Win-back candidates

#### 3. Identity Graph (Port 4050)

**Purpose:** Cross-device user identification

**Capabilities:**
- Phone number linking
- Device fingerprinting
- Session stitching
- Identity resolution
- Profile unification

#### 4. Signal Aggregator (Port 4142)

**Purpose:** Collect and aggregate behavioral signals

**Event Types:**
- commerce.* (orders, payments, refunds)
- identity.* (logins, registrations)
- loyalty.* (points, tiers)
- engagement.* (views, scans)
- intelligence.* (intent, churn, predictions)
- support.* (tickets, CSAT)

---

## Option 2: Hojai AI Gateway (New)

### What We Built

**Location:** `REZ-Media/hojai-ai-gateway/`
**Port:** 4560

### Endpoints

| Endpoint | Capability |
|----------|-------------|
| `/api/intent/predict` | User intent |
| `/api/recommendations` | Product recommendations |
| `/api/behavior/predict` | Churn, LTV, purchase probability |
| `/api/audience/segments` | Audience segmentation |
| `/api/targeting/optimize` | Ad targeting parameters |
| `/api/campaign/predict` | Campaign performance forecast |
| `/api/creative/generate` | Ad copy generation |
| `/api/leads/score` | Lead scoring |
| `/api/fraud/detect` | Click fraud detection |
| `/api/content/personalize` | Content personalization |
| `/api/action/next-best` | Next best action |

### Current Status

**ALL METHODS ARE STUBS** - Returns mock/randomized data.

```typescript
// Example: predictIntent returns random data
async predictIntent(params) {
  return {
    intent: 'browse',  // Random from fixed list
    confidence: 0.85,  // Random
    recommendations: ['personalized_deals', 'loyalty_prompt'],
  };
}
```

---

## Comparison Matrix

| Capability | REZ Intelligence | Hojai AI Gateway | Winner |
|------------|-----------------|-----------------|--------|
| **Intent Prediction** | ✅ Real ML | ❌ Stub | REZ Intelligence |
| **Churn Prediction** | ✅ Real ML | ❌ Stub | REZ Intelligence |
| **LTV Scoring** | ✅ Real ML | ❌ Stub | REZ Intelligence |
| **Identity Resolution** | ✅ Real | ❌ Not implemented | REZ Intelligence |
| **Signal Collection** | ✅ Real | ❌ Not implemented | REZ Intelligence |
| **Cross-platform** | ⚠️ Fragmented | ⚠️ Gateway only | Tie |
| **Unified Interface** | ❌ Separate services | ✅ Single gateway | Hojai AI |
| **Ad Targeting** | ⚠️ Basic | ⚠️ Optimized | Hojai AI |
| **Creative Generation** | ❌ None | ✅ Mock | Hojai AI |
| **Fraud Detection** | ⚠️ Basic | ⚠️ Mock | Tie |
| **Lead Scoring** | ❌ None | ⚠️ Mock | Hojai AI |
| **Production Ready** | ✅ Yes | ❌ No (stubs) | REZ Intelligence |

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ADA BAZAAR APPS                                    │
│  AdBazaar Dashboard │ Merchant Portal │ Creator Studio │ Admin Panel        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  HOJAI AI GATEWAY (Port 4560)                             │
│                  (Unified AI Interface for AdBazaar)                        │
│  • Intent Prediction     • Audience Segments   • Campaign Optimization         │
│  • Lead Scoring        • Fraud Detection    • Creative Generation           │
└─────────────────────────────────────────────────────────────────────────────┘
                │                                           │
                ▼                                           ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│    REZ INTELLIGENCE          │       │     ADBAZAAR SERVICES           │
│    (Real ML Services)        │       │     (Real Business Logic)       │
├───────────────────────────────┤       ├───────────────────────────────┤
│ Port 4018: Intent Predictor │       │ Port 4500: Unified Campaign    │
│ Port 4141: Predictive Eng.  │       │ Port 4510: Tenant Registry   │
│ Port 4050: Identity Graph  │       │ Port 4515: Inventory        │
│ Port 4142: Signal Aggreg. │       │ Port 4520: Attribution     │
│ Port 4126: Segmentation  │       │ Port 4530: ReZ Ride Intel│
│ Port 4129: Commerce Graph│       │ Port 4545: BuzzLocal     │
│ Port 4120: Profile Svc  │       │ Port 4555: CorpPerks    │
│ Port 4127: Feature Store│       │ Port 4540: Commerce Graph │
└───────────────────────────────┘       └───────────────────────────────┘
                │                                           │
                ▼                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RABTUL SERVICES                                     │
│  Auth (4002) │ Wallet (4004) │ Payment (4001) │ Notifications (4011) │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Connect Hojai AI to REZ Intelligence

```typescript
// hojai-ai-gateway/src/services/hojaiAIService.ts

// BEFORE (Mock)
async predictIntent(params) {
  return { intent: 'browse', confidence: 0.8 };
}

// AFTER (Real)
async predictIntent(params) {
  // Call REZ Intelligence Intent Predictor
  const response = await axios.post('http://localhost:4018/api/intent/score', {
    userId: params.userId,
    signals: params.context,
  });
  return response.data;
}
```

### Phase 2: Add Missing Capabilities

| Gap | Solution |
|-----|----------|
| Creative Generation | Connect to REZ-marketing AI service |
| Lead Scoring | Connect to REZ-lead-intelligence |
| Fraud Detection | Connect to REZ-fraud-service |
| Real Targeting | Connect REZ-decision-service |

### Phase 3: Production Readiness

1. Deploy Hojai AI Gateway with REZ Intelligence connections
2. Add circuit breakers
3. Add caching
4. Add monitoring

---

## Integration Code

### Connect to REZ Intent Predictor

```typescript
// hojai-ai-gateway/src/services/hojaiAIService.ts

import axios from 'axios';

const INTENT_SERVICE_URL = process.env.REZ_INTENT_SERVICE_URL || 'http://localhost:4018';
const PREDICTIVE_SERVICE_URL = process.env.REZ_PREDICTIVE_URL || 'http://localhost:4141';
const IDENTITY_SERVICE_URL = process.env.REZ_IDENTITY_URL || 'http://localhost:4050';

export class HojaiAIService {
  /**
   * Predict user intent (connect to REZ Intelligence)
   */
  async predictIntent(params: {
    userId?: string;
    context?: Record<string, unknown>;
  }): Promise<{
    intent: string;
    confidence: number;
    recommendations: string[];
    nextBestAction: string;
  }> {
    try {
      // Call REZ Intelligence Intent Predictor
      const response = await axios.post(`${INTENT_SERVICE_URL}/api/intent/score`, {
        userId: params.userId,
        context: params.context,
        signals: this.buildSignals(params.context),
      });

      return {
        intent: response.data.intent || 'browse',
        confidence: response.data.confidence || 0.5,
        recommendations: response.data.recommendedActions || [],
        nextBestAction: this.determineNextAction(response.data.intent),
      };
    } catch (error) {
      console.error('Intent prediction failed:', error);
      // Fallback to basic prediction
      return this.basicPrediction(params);
    }
  }

  /**
   * Predict behavior (connect to REZ Predictive Engine)
   */
  async predictBehavior(params: {
    userId?: string;
    context?: Record<string, unknown>;
  }): Promise<{
    churnRisk: 'low' | 'medium' | 'high';
    ltvScore: number;
    purchaseProbability: number;
    nextPurchaseCategory?: string;
  }> {
    try {
      const [churnRes, ltvRes] = await Promise.all([
        axios.get(`${PREDICTIVE_SERVICE_URL}/predict/${params.userId}/churn`),
        axios.get(`${PREDICTIVE_SERVICE_URL}/predict/${params.userId}/ltv`),
      ]);

      return {
        churnRisk: this.mapChurnRisk(churnRes.data.probability),
        ltvScore: ltvRes.data.score || 0.5,
        purchaseProbability: ltvRes.data.purchaseProbability || 0.3,
        nextPurchaseCategory: ltvRes.data.nextCategory,
      };
    } catch (error) {
      console.error('Behavior prediction failed:', error);
      return this.basicBehaviorPrediction();
    }
  }

  /**
   * Generate audience segments (connect to REZ Segmentation)
   */
  async generateAudienceSegments(params: {
    criteria?: Record<string, unknown>;
  }): Promise<{
    segments: Array<{ id: string; name: string; size: number; matchScore: number }>;
    totalReach: number;
  }> {
    try {
      const response = await axios.post(`${INTENT_SERVICE_URL}/api/segments/generate`, params.criteria);

      return {
        segments: response.data.segments.map((s: { id: string; name: string; userCount: number; matchScore: number }) => ({
          id: s.id,
          name: s.name,
          size: s.userCount,
          matchScore: s.matchScore,
        })),
        totalReach: response.data.totalReach || 0,
      };
    } catch (error) {
      console.error('Audience segments failed:', error);
      return this.basicSegments();
    }
  }
}
```

---

## Environment Variables

```bash
# REZ Intelligence Services
REZ_INTENT_SERVICE_URL=http://localhost:4018
REZ_PREDICTIVE_URL=http://localhost:4141
REZ_IDENTITY_SERVICE_URL=http://localhost:4050
REZ_SIGNAL_AGGREGATOR_URL=http://localhost:4142
REZ_SEGMENTATION_URL=http://localhost:4126
REZ_COMMERCE_GRAPH_URL=http://localhost:4129

# AdBazaar Services
CAMPAIGN_SERVICE_URL=http://localhost:4500
INVENTORY_SERVICE_URL=http://localhost:4515
ATTRIBUTION_SERVICE_URL=http://localhost:4520

# RABTUL
AUTH_SERVICE_URL=http://localhost:4002
WALLET_SERVICE_URL=http://localhost:4004
```

---

## Decision

### Use REZ Intelligence for:

1. **Real ML predictions** - Churn, LTV, Conversion
2. **Intent classification** - User behavior analysis
3. **Identity resolution** - Cross-device linking
4. **Signal collection** - Event tracking

### Use Hojai AI Gateway for:

1. **Unified interface** - Single API for all AI
2. **Ad-specific logic** - Creative generation, targeting optimization
3. **Fallback handling** - Circuit breakers
4. **Caching** - Reduce REZ Intelligence load

### Architecture Decision: **HYBRID**

```
Hojai AI Gateway (Port 4560)
        │
        ├─► REZ Intent Predictor (4018)
        ├─► REZ Predictive Engine (4141)
        ├─► REZ Identity Graph (4050)
        ├─► REZ Signal Aggregator (4142)
        │
        └─► Fallback to mock if services unavailable
```

---

## Next Steps

| Step | Task | Status |
|------|-------|--------|
| 1 | Update Hojai AI Gateway to call REZ Intelligence | ⏳ TODO |
| 2 | Add environment variables | ⏳ TODO |
| 3 | Add circuit breakers | ⏳ TODO |
| 4 | Add caching layer | ⏳ TODO |
| 5 | Test end-to-end | ⏳ TODO |
| 6 | Deploy and monitor | ⏳ TODO |

---

## Conclusion

**Recommendation: Use BOTH**

- **REZ Intelligence** = Real ML models, production-ready
- **Hojai AI Gateway** = Unified interface, ad-specific logic

The gateway becomes the **ad-targeting layer** that wraps and optimizes access to REZ Intelligence services.

This gives us:
- ✅ Real ML predictions (REZ Intelligence)
- ✅ Unified API (Hojai Gateway)
- ✅ Ad-specific logic (Hojai Gateway)
- ✅ Production-ready (REZ Intelligence)
- ✅ Extensible (gateway can add more endpoints)
