# REZ App - Ecosystem Integration Guide

## Overview

The REZ App integrates with 4 major ecosystems:
- **REZ Intelligence** - AI/ML predictions and personalization
- **RABTUL** - Shared infrastructure services
- **REZ Media** - Advertising, engagement, and DOOH
- **CorpPerks** - Corporate expense management

---

## REZ Intelligence Integration

### Services Available

| Service | Port | Features |
|---------|------|----------|
| `REZ-predictive-engine` | 4123 | Churn, LTV, Revisit, Conversion predictions |
| `REZ-identity-graph` | 4050 | Identity resolution |
| `REZ-autonomous-agents` | 4062 | 8 AI agents |
| `rez-intent-predictor` | 4018 | Intent prediction |

### Hooks

```typescript
// Churn Prediction
import { useChurnPrediction } from '@/hooks/usePredictive';
const { prediction, needsAttention } = useChurnPrediction();

// LTV Prediction
import { useLTVPrediction } from '@/hooks/usePredictive';
const { prediction, tierColor } = useLTVPrediction();

// All Predictions Dashboard
import { useAllPredictions } from '@/hooks/usePredictive';
const { churn, ltv, insights } = useAllPredictions();
```

### Usage Example

```typescript
function CustomerDashboard() {
  const { churn, ltv, segment, insights } = useAllPredictions();

  if (needsAttention) {
    return <RetentionOfferBanner />;
  }

  return (
    <View>
      <LTNBadge tier={ltv?.tier} />
      <InsightCard insights={insights} />
    </View>
  );
}
```

---

## RABTUL Integration

### Services Available

| Service | Port | Purpose |
|---------|------|---------|
| `api-gateway` | 4000 | Routing, rate limiting |
| `rez-auth-service` | 4002 | JWT, OTP, MFA |
| `rez-payment-service` | 4001 | Payments |
| `rez-wallet-service` | 4004 | Coins, balance |
| `REZ-circuit-breaker` | 4030 | Fault tolerance |

### Already Integrated

- ✅ Auth (JWT)
- ✅ Payment (Razorpay)
- ✅ Wallet (Coins)

### Add Circuit Breaker

```typescript
import { CircuitBreaker } from '@/utils/retryWithBackoff';

const paymentBreaker = new CircuitBreaker(5, 60000, 'payment');

async function payWithBreaker() {
  return paymentBreaker.execute(() => paymentService.process());
}
```

---

## REZ Media Integration

### Services Available

| Service | Port | Features |
|---------|------|----------|
| `rez-dooh-service` | 4018 | DOOH screen management |
| `REZ-engagement-platform` | 4017 | Loyalty, offers, streaks |
| `REZ-journey-service` | 4019 | Lifecycle automation |
| `REZ-attribution-platform` | 4023 | Multi-touch attribution |
| `REZ-communications-platform` | 4022 | Email, SMS, WhatsApp |

### Hooks

```typescript
// Loyalty & Points
import { useLoyalty, usePointsHistory } from '@/hooks/useEngagement';
const { profile, pointsFormatted } = useLoyalty();

// Badges
import { useBadges } from '@/hooks/useEngagement';
const { earnedBadges, lockedBadges } = useBadges();

// Streaks
import { useStreaks } from '@/hooks/useEngagement';
const { activeStreaks } = useStreaks();

// Offers
import { useOffers } from '@/hooks/useEngagement';
const { offers, claimOffer } = useOffers();

// Nearby DOOH Screens
import { useNearbyScreens, useProximityTracking } from '@/hooks/useDooh';
const { screens } = useNearbyScreens();
const { isTracking, startTracking } = useProximityTracking();
```

### DOOH Integration Example

```typescript
function DOOHRewards() {
  const { screens, distanceToScreen } = useNearbyScreens();
  const { triggerImpression } = useProximityTracking();

  return (
    <View>
      {screens.map(screen => (
        <ScreenCard
          key={screen.id}
          screen={screen}
          distance={distanceToScreen(screen)}
          onView={(adId) => triggerImpression(screen.id, adId)}
        />
      ))}
    </View>
  );
}
```

---

## CorpPerks Integration

### Services Available

| Service | Port | Features |
|---------|------|----------|
| `rez-corporate-service` | 4056 | Employee benefits, GST invoices |

### Usage

```typescript
import { corporateService } from '@/services/corporateService';

// Get employee benefits
const benefits = await corporateService.getEmployeeBenefits(userId);

// Generate GST invoice
const invoice = await corporateService.generateGSTInvoice(orderId);
```

---

## Environment Variables

Add to `.env`:

```bash
# REZ Intelligence
EXPO_PUBLIC_PREDICTIVE_URL=https://REZ-predictive-engine.onrender.com
EXPO_PUBLIC_IDENTITY_GRAPH_URL=https://REZ-identity-graph.onrender.com

# REZ Media
EXPO_PUBLIC_DOOH_SERVICE_URL=https://rez-dooh-service.onrender.com
EXPO_PUBLIC_ENGAGEMENT_SERVICE_URL=https://REZ-engagement-platform.onrender.com

# RABTUL
EXPO_PUBLIC_CIRCUIT_BREAKER_URL=https://REZ-circuit-breaker.onrender.com
```

---

## Implementation Checklist

- [x] Predictive Engine Hooks
- [x] Engagement Hooks
- [x] DOOH Hooks
- [ ] Circuit Breaker Service Integration
- [ ] Referral System Integration
- [ ] Email Service Integration
- [ ] Corporate Card Integration
