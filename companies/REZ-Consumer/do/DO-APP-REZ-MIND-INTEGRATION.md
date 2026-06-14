# Do App ↔ REZ Intelligence: Complete Integration

**Date:** May 13, 2026
**Status:** ✅ FULLY IMPLEMENTED

---

## Executive Summary

The **Do App** has complete integration with **REZ Intelligence** enabling:
- ✅ Intent capture across ALL user actions
- ✅ AI-powered recommendations
- ✅ Dormant user detection & automated revival
- ✅ Behavioral profiling with 15 user agents
- ✅ Real-time nudge engine
- ✅ Attribution tracking
- ✅ Predictive scoring (churn, LTV, booking probability)

---

## What Was Built

### Services Created

| File | Purpose |
|------|---------|
| `src/services/rezMindService.ts` | REZ Mind API client |
| `src/services/eventTracking.ts` | Complete event tracking |
| `src/services/agentOrchestrator.ts` | Agent OS connection |
| `src/services/nudgeEngine.ts` | Real-time nudges |
| `src/services/attributionTracking.ts` | Conversion attribution |
| `src/hooks/useReZMind.ts` | All-in-one React hooks |
| `src/components/NudgeBanner.tsx` | Real-time nudge UI |
| `src/components/AgentInsights.tsx` | AI insights display |

### Components Added

| Component | Purpose |
|----------|---------|
| `NudgeBanner` | Shows AI nudges to users |
| `NudgeList` | List of all active nudges |
| `InlineNudgeCard` | Compact nudge card |
| `UserScores` | Churn risk & LTV display |
| `TrendIndicator` | Trend score visualization |
| `EngagementScore` | User engagement score |

---

## All Tracking Events

| Event | When | Sent To |
|-------|------|---------|
| `chat_message` | User sends message | Intent Graph |
| `discovery_view_entity` | User views venue | Intent Graph |
| `discovery_save_entity` | User saves venue | Intent Graph |
| `discovery_search` | User searches | Intent Graph |
| `booking_start` | User starts booking | Intent Graph |
| `booking_completed` | Booking confirmed | Intent Graph + Attribution |
| `booking_cancelled` | Booking cancelled | Intent Graph |
| `payment_success` | Payment completed | Intent Graph |
| `wallet_transaction` | Wallet change | Intent Graph |
| `profile_view` | User views profile | Intent Graph |
| `profile_update` | User updates profile | Intent Graph |
| `style_preferences_set` | Preferences saved | Intent Graph |
| `onboarding_complete` | Onboarding done | Intent Graph |
| `app_open` | App starts | Intent Graph |
| `app_close` | App closes | Intent Graph |

---

## Hooks Available

```typescript
// Import all hooks
import {
  // Intent tracking
  useIntentTracking,
  
  // Dormancy detection
  useDormancyDetection,
  
  // ML recommendations
  useRecommendations,
  
  // Behavioral profiling
  useBehavioralProfile,
  
  // Predictive scoring
  usePredictiveScoring,
  
  // Nudge engine
  useNudgeEngine,
  
  // Attribution
  useAttribution,
  
  // App lifecycle
  useAppLifecycle,
  
  // Setup (call once)
  useReZMindSetup,
} from '@/hooks/useReZMind';
```

---

## Usage Examples

### Track All Events
```typescript
const {
  trackChatIntent,
  trackEntityView,
  trackSearch,
  trackBookingStart,
  trackBookingCompleted,
} = useIntentTracking();

// In your components:
await trackChatIntent("I'm looking for Italian food");
await trackEntityView(entity.id, 'restaurant', entity.name, position);
await trackSearch(query, resultsCount);
await trackBookingCompleted(booking.id, entity.id, 'restaurant', entity.name, amount, karmaEarned);
```

### Dormancy & Revival
```typescript
const { checkDormantStatus, triggerRevival } = useDormancyDetection();

const status = await checkDormantStatus();
if (status.isDormant) {
  await triggerRevival({
    channel: 'push',
    offer: { coins: 50, discountPercent: 20 }
  });
}
```

### Get Recommendations
```typescript
const { getRecommendations, getIntentScores } = useRecommendations();

const recs = await getRecommendations({ types: ['restaurants', 'spa'], limit: 10 });
const scores = await getIntentScores(['restaurants', 'events']);
```

### Predictive Scoring
```typescript
const { getChurnRisk, getLTV, getBookingProbability } = usePredictiveScoring();

const churn = await getChurnRisk();
// { score: 0.3, level: 'low', factors: [...] }

const ltv = await getLTV();
// { ltv: 5000, tier: 'premium', confidence: 0.85 }

const prob = await getBookingProbability(entityId);
// { probability: 0.72, factors: [...] }
```

### Show Nudges
```typescript
const { nudges, dismissNudge } = useNudgeEngine();

// Auto-generated nudges from agents
nudges.map(nudge => (
  <NudgeBanner
    key={nudge.id}
    nudge={nudge}
    onDismiss={() => dismissNudge(nudge.id)}
  />
))
```

### Attribution Tracking
```typescript
const { trackConversion, getSummary } = useAttribution();

// Track booking as conversion
await trackConversion(bookingId, amount);

// Get attribution summary
const summary = getSummary();
// { impressions: 12, clicks: 3, conversions: 1, revenue: 500 }
```

---

## UI Components

### NudgeBanner
```tsx
import { NudgeBanner } from '@/components/NudgeBanner';

<View>
  <NudgeBanner maxVisible={3} />
</View>
```

### AgentInsights
```tsx
import { UserScores, TrendIndicator, EngagementScore } from '@/components/AgentInsights';

<View>
  <UserScores />
  <TrendIndicator category="Restaurants" score={0.85} />
  <EngagementScore score={0.72} />
</View>
```

---

## Environment Variables

```bash
# REZ Intelligence
EXPO_PUBLIC_REZ_INTENT_URL=https://rez-intent-graph.onrender.com
EXPO_PUBLIC_REZ_USER_INTELLIGENCE_URL=https://REZ-user-intelligence.onrender.com
EXPO_PUBLIC_REZ_AGENT_ORCHESTRATOR_URL=https://rez-agent-orchestrator.onrender.com
EXPO_PUBLIC_REZ_CAMPAIGN_URL=https://rez-campaign-service.onrender.com

# API Keys (backend only - not in frontend)
REZ_API_KEY=your-api-key
REZ_INTERNAL_TOKEN=your-internal-token
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         DO APP                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │  Chat  │  │ Explore │  │ Bookings│  │ Profile │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │
│       │             │             │             │          │
│       └─────────────┴──────┬──────┴─────────────┘          │
│                           │                                │
│                  ┌─────────▼──────────┐                     │
│                  │  eventTracking.ts │  ← ALL events         │
│                  └─────────┬──────────┘                     │
└──────────────────────────────┼────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│    Intent      │  │     Agent      │  │     Nudge     │
│    Graph      │  │  Orchestrator  │  │     Engine    │
│                │  │                │  │                │
│ • Capture     │  │ • Dormancy    │  │ • Real-time  │
│ • Dormancy   │  │ • Trends      │  │   alerts     │
│ • ML Scoring │  │ • Scoring    │  │ • Personal-  │
│ • Recs       │  │ • Predictive │  │   ized      │
└────────────────┘  └────────────────┘  └────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                    ┌──────────▼─────────┐
                    │    REZ Mind       │
                    │   (38 Agents)    │
                    │ • User Agents    │
                    │ • Commerce       │
                    │ • Autonomous     │
                    └──────────────────┘
```

---

## 38 AI Agents Connected

### User Intelligence (15)
| Agent | Schedule | Purpose |
|-------|----------|---------|
| PersonalizationAgent | Hourly | User preferences |
| SegmentClassifierAgent | Daily | User segments |
| RecommendationQualityAgent | Hourly | Rec quality |
| EngagementScoreAgent | Daily | Engagement RFM |
| SessionAnalyzerAgent | Hourly | Session patterns |
| SearchIntentAgent | 5 min | Search parsing |
| BrowsePatternAgent | 15 min | Browse behavior |
| PurchasePredictorAgent | Hourly | Purchase probability |
| AbandonmentDetectorAgent | 10 min | Drop-off detection |
| RetentionTriggerAgent | Daily | Retention offers |
| WinBackAgent | Weekly | Dormant revival |
| ReferralPotentialAgent | Daily | Viral scoring |
| SurveyTriggerAgent | Daily | NPS timing |
| FeedbackAnalyzerAgent | Hourly | Sentiment |
| NPSPredictorAgent | Daily | NPS prediction |

### Commerce (15)
| Agent | Schedule | Purpose |
|-------|----------|---------|
| DemandSignalAgent | Real-time | Demand patterns |
| ScarcityAgent | Real-time | Inventory scarcity |
| PriceElasticityAgent | Hourly | Price sensitivity |
| ReorderPredictorAgent | Daily | Return prediction |
| TasteEvolutionAgent | Daily | Taste tracking |
| ChurnRiskAgent | Daily | Churn detection |
| LTVPredictorAgent | Daily | LTV scoring |
| InventoryAlertAgent | Real-time | Stock alerts |
| DemandForecastAgent | Daily | Demand forecasting |
| CompetitorMonitorAgent | Daily | Market trends |
| TrendDetectorAgent | Daily | Trend detection |
| PriceOptimizerAgent | Daily | Price optimization |
| OfferMatcherAgent | Daily | Offer matching |
| CrossSellAgent | Daily | Cross-category |
| UrgencyTriggerAgent | Real-time | Urgency creation |

### Autonomous (8)
| Agent | Purpose |
|-------|---------|
| DemandSignal | Booking patterns |
| Scarcity | Capacity tracking |
| Personalization | User experience |
| Attribution | Conversion tracking |
| AdaptiveScoring | Dynamic scoring |
| FeedbackLoop | Continuous improvement |
| NetworkEffect | Viral growth |
| RevenueAttribution | Revenue tracking |

---

## Auto-Initialization

REZ Mind initializes automatically:

```tsx
// app/_layout.tsx
function REZMindInitializer() {
  useReZMindSetup(); // Syncs profile, generates nudges
  return null;
}

<RootLayout>
  <REZMindInitializer />
  <RootLayoutNav />
</RootLayout>
```

---

## Next Steps

### Already Done ✅
- [x] Intent capture (all events)
- [x] Dormancy detection
- [x] Revival triggers
- [x] ML recommendations
- [x] Behavioral profiling
- [x] Real-time nudges
- [x] Attribution tracking
- [x] Predictive scoring
- [x] UI components

### Optional Enhancements
- [ ] A/B testing integration
- [ ] Custom agent creation
- [ ] Advanced segmentation
- [ ] Custom nudge templates

---

*Last Updated: May 13, 2026*
