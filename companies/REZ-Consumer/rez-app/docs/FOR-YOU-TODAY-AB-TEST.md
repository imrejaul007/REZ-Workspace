# For You Today V2 - A/B Test Specification

## Test Overview

**Test Name:** For You Today V2 vs Home Feed
**Test ID:** `for-you-today-v2-test`
**Start Date:** TBD (post-development)
**Duration:** 4 weeks or until statistical significance

---

## Hypothesis

**Null Hypothesis (H0):** For You Today V2 has no effect on user engagement compared to the current Home feed.

**Alternative Hypothesis (H1):** For You Today V2 increases smart action rate by >10% compared to current Home feed.

---

## Variants

### Control (A)
- **Route:** `/` (current Home tab)
- **Experience:** Infinite scroll, 20+ cards, browsable feed
- **Navigation:** Users find what they search for

### Variant (B)
- **Route:** `/for-you-today-v2`
- **Experience:** 3 intelligent daily actions, memory integration, live data
- **Navigation:** REZ surfaces what matters to you

---

## Primary Metrics

| Metric | Baseline | Target | Min Detectable Effect |
|--------|----------|--------|----------------------|
| Smart Action Rate | TBD | >40% | +10% |
| Session Intelligence Score | N/A | >70 | +15 |
| Recommendation Interaction | TBD | >60% | +10% |
| Time-to-First-Value | N/A | <30s | -10s |

### Definition: Smart Action Rate
```
Smart Action Rate = (Smart Card Taps / Smart Card Views) × 100
```

### Definition: Session Intelligence Score
```
Score = Smart Card Views (max 10)
      + Smart Card Taps × 3 (max 15)
      + Memory Interactions × 2 (max 10)
      + Time-to-First-Action Bonus (max 10)
      + Live Data Refresh Bonus (max 5)
      + Trending Interaction Bonus (max 5)
      + Friends Activity View Bonus (max 5)

Normalized to 0-100 scale
```

---

## Secondary Metrics

| Category | Metric | Target |
|----------|--------|--------|
| **Engagement** | Daily Active Streak | >14 days |
| **Engagement** | Return Intent | >85% |
| **Engagement** | Weekly Sessions | >10 |
| **Trust** | Perceived Intelligence | >80 |
| **Trust** | Weekly Digest Views | >60% |
| **Retention** | Day-7 Retention | >40% |
| **Retention** | Day-30 Retention | >20% |
| **Emotional** | Frustration Signals | <2/session |
| **Emotional** | Delight Signals | >10/session |

---

## Event Tracking

### Smart Card Events
```typescript
// Viewed a smart card
{
  event: 'smart_card_view',
  cardId: string,
  cardType: 'savings' | 'insight' | 'action',
  testId: 'for-you-today-v2-test'
}

// Tapped a smart card
{
  event: 'smart_card_tap',
  cardId: string,
  cardType: 'savings' | 'insight' | 'action',
  testId: 'for-you-today-v2-test',
  timeToAction: number // ms
}

// Dismissed a smart card
{
  event: 'smart_card_dismiss',
  cardId: string,
  cardType: 'savings' | 'insight' | 'action',
  testId: 'for-you-today-v2-test'
}
```

### Memory Events
```typescript
// Interacted with memory reference
{
  event: 'memory_interaction',
  memoryId: string,
  memoryType: 'preference' | 'behavior' | 'savings' | 'pattern' | 'milestone',
  testId: 'for-you-today-v2-test'
}
```

### Live Data Events
```typescript
// Refreshed live data
{
  event: 'live_data_refresh',
  testId: 'for-you-today-v2-test',
  refreshCount: number
}

// Viewed trending items
{
  event: 'trending_view',
  itemId: string,
  testId: 'for-you-today-v2-test'
}
```

### Session Events
```typescript
// Session ended
{
  event: 'for_you_today_session_end',
  testId: 'for-you-today-v2-test',
  smartCardViews: number,
  smartCardTaps: number,
  memoryInteractions: number,
  timeToFirstAction: number | null,
  sessionIntelligenceScore: number,
  smartActionRate: number,
  sessionDuration: number
}
```

---

## Sample Size Calculation

**Parameters:**
- Baseline conversion rate: 30%
- Minimum detectable effect: 10% relative increase
- Statistical power: 80%
- Significance level: 0.05

**Required Sample Size:**
- Per variant: ~3,500 users
- Total: ~7,000 users

**Calculation:**
```
n = 2 × ((Zα/2 + Zβ)² × p × (1-p)) / (p1 - p2)²
n = 2 × ((1.96 + 0.84)² × 0.30 × 0.70) / (0.33 - 0.30)²
n ≈ 3,500 per variant
```

---

## Traffic Allocation

| Variant | Traffic % | Description |
|---------|-----------|-------------|
| Control (A) | 50% | Current Home feed |
| Variant (B) | 50% | For You Today V2 |

**Allocation Strategy:** Random assignment with 50/50 split

---

## Technical Implementation

### A/B Wrapper Component
**File:** `app/(tabs)/for-you-today-ab.tsx`

```typescript
// Routes users based on variant assignment
// Control → /
// Variant → /for-you-today-v2
```

### Analytics Hook
**File:** `hooks/useForYouTodayMetrics.ts`

Tracks all test-related events and computes session scores.

### AB Testing Hook
**File:** `hooks/useABTest.ts`

Connects to `REZ-ab-testing-service` (Port 4125) for variant assignment.

---

## Guardrail Metrics

If ANY guardrail metric degrades by >20% in the variant, pause the test and investigate:

| Guardrail | Metric | Threshold |
|-----------|--------|-----------|
| **Revenue** | Average Order Value | >-20% |
| **Engagement** | Sessions per User | >-20% |
| **Error Rate** | Crash-free Sessions | <95% |
| **Satisfaction** | App Store Rating | >3.5 |

---

## Decision Matrix

| Outcome | Action |
|---------|--------|
| Variant wins on primary metrics with statistical significance | Ship to 100% |
| Variant wins on primary metrics, but guardrails triggered | Investigate and iterate |
| No significant difference | Extend test or iterate |
| Control wins | Iterate on V2 or abandon |

---

## Rollout Plan

### Phase 1: Limited Rollout (Week 1)
- 10% traffic to variant
- Monitor for crashes and errors
- Check data pipeline integrity

### Phase 2: Increased Traffic (Week 2)
- 25% traffic to variant
- Begin primary metric monitoring
- Daily check-ins

### Phase 3: Full Rollout (Week 3-4)
- 50% traffic to variant
- Reach statistical significance
- Prepare decision report

### Phase 4: Decision (Week 4)
- Statistical analysis
- Business review
- Ship or iterate decision

---

## Files

| File | Purpose |
|------|---------|
| `app/(tabs)/for-you-today-ab.tsx` | A/B test wrapper |
| `hooks/useForYouTodayMetrics.ts` | Analytics tracking |
| `hooks/useABTest.ts` | Variant assignment |
| `app/for-you-today-v2.tsx` | Variant implementation |
| `docs/FOR-YOU-TODAY-AB-TEST.md` | This document |

---

## Success Criteria

**Minimum for Ship:**
- Smart Action Rate: >40% (target) or +10% vs control
- Statistical Significance: p < 0.05
- No guardrail violations

**Stretch Goals:**
- Session Intelligence Score: >70
- Day-7 Retention: >40%
- Perceived Intelligence: >80

---

*"The best intelligence is invisible intelligence. Let the data speak."*
