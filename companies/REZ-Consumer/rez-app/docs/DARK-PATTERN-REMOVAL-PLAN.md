# Dark Pattern Removal Plan - 30 Days

## Strategic Principle

> "Show reality honestly. Never manufacture pressure."

### The Correct Balance

| Type | Action | Why |
|------|--------|-----|
| **Fake scarcity** | REMOVE | Breaks trust when discovered |
| **Manufactured urgency** | REMOVE | Creates resentment |
| **Real scarcity** | KEEP | Honest information |
| **Real deadlines** | KEEP | Users appreciate knowing |
| **Positive streaks** | KEEP | Drives habit formation |
| **Anxiety streaks** | REMOVE | Creates negative association |
| **Pre-checked permissions** | REMOVE | Consent violation |

### The Rule: Real = Show | Fake = Remove

| Is it real? | Action |
|-------------|--------|
| Actual limited stock | Show actual quantity |
| Actual end time | Show the time |
| Actual streak | Celebrate positively |
| Fake/inflated stock | Remove count |
| Resetting countdown | Remove |
| "At risk" language | Replace with positive |

---

## Phase 1: Remove Manipulation (Days 1-7)

### 1.1 Fake Scarcity → Show Real Scarcity Only

**Files to Modify:**
- `components/product/StockBadge.tsx`
- `components/product/StockIndicator.tsx`
- `components/offers/SmartBadge.tsx`
- `components/offers/FlashSaleTimer.tsx`
- `components/loyalty/RewardCard.tsx`
- `components/homepage/cards/ProductCard.tsx`

**Rule:** Only show scarcity if verified real data exists.

| Scenario | Action |
|----------|--------|
| Verified low stock from API | ✅ Show "Only 3 left" |
| Unknown/unverified stock | ❌ Don't show scarcity |
| Flash sale with real limits | ✅ Show actual remaining |
| Default/simulated scarcity | ❌ Remove |

---

### 1.2 Artificial Urgency → Honest Time Display

**Files to Modify:**
- `components/offers/FlashSaleTimer.tsx`
- `app/missions.tsx`
- `app/campaigns.tsx`
- `app/deals/[campaignId].tsx`

**Rule:** Keep real countdown timers. Remove theatrical urgency.

| Element | Before | After |
|---------|--------|-------|
| Label | "🔥 ENDING NOW 🔥" | "Available until 9:00 PM" |
| Colors | Red when <5 min | Calm purple/green always |
| Stock text | "Hurry! Only X left!" | "In Stock" |
| Progress bar | Red at 80% | Neutral green |

**Keep:**
- Actual countdown for real flash sales
- Factual end times
- Verified stock levels

---

### 1.3 Pre-Checked Notifications → Explicit Opt-In

**Files to Modify:**
- `app/settings.tsx`
- `contexts/ProfileContext.tsx`

**Replace:**
```typescript
// BEFORE (Dark)
pushNotifications: true, // Default ENABLED

// AFTER (Trust)
pushNotifications: false, // Default DISABLED - let users choose
```

**Add Onboarding:**
- First-time permission request with clear value proposition
- "What would you like REZ to help with?" choices
- Demo notification showing actual benefit

---

## Phase 2: Redesign Anxiety Patterns (Days 8-14)

### 2.1 Streak Anxiety → Progress Celebration

**Files to Modify:**
- `components/wallet/SavingsWidget.tsx`
- `components/SmartActionsPanel.tsx`
- `app/savings/index.tsx`
- `app/explore/daily-checkin/index.tsx`

**Replace:**
| OLD (Dark) | NEW (Trust) |
|------------|-------------|
| "Streak at risk!" | "You're building great savings habits" |
| "Don't lose your streak!" | "1 day away from your longest streak" |
| "Keep the streak going!" | "Your consistency is paying off" |
| "At Risk" badge | "Active" badge |

**Rule:** Streaks should feel like celebration, not anxiety.

---

### 2.2 Trial Pressure → Respectful Renewal

**Files to Modify:**
- `app/subscription/trial.tsx`

**Replace:**
| OLD (Dark) | NEW (Trust) |
|------------|-------------|
| Red "URGENT" trial ending banner | Clear, calm subscription management |
| "Your trial ends in X days!" | "Your trial is active. Renew anytime." |
| Auto-subscribe prompts | Easy, frictionless renewal when ready |
| Cancellation friction | One-tap cancellation, no guilt |

**Rule:** Trust that users will renew when they see value.

---

## Phase 3: Verify & Soften (Days 15-30)

### 3.1 Limited-Time → Real Only

**Files to Review:**
- `app/vouchers/index.tsx`
- `app/lock-deals/my-locks.tsx`
- `app/cash-store/trending.tsx`

**Action:**
- Verify all "limited time" claims have real deadlines
- Remove theatrical language
- Show factual end dates only

---

### 3.2 Referral Softening

**Files to Modify:**
- `app/referral/dashboard.tsx`
- `app/referral/share.tsx`
- `app/explore/friends.tsx`

**Replace:**
| OLD (Dark) | NEW (Trust) |
|------------|-------------|
| "Invite friends. Earn ₹500!" | "Share REZ with friends" |
| "Both get bonus coins" | "Friends get started with ₹50" |
| Aggressive share prompts | Subtle, value-first invitations |

---

## Implementation Checklist

### Week 1: Core Removal ✅
- [x] Remove fake scarcity from StockBadge ✅
- [x] Remove fake scarcity from StockIndicator ✅
- [x] Keep real scarcity in SmartBadge ✅
- [x] Calm countdowns in FlashSaleTimer ✅
- [x] Change pre-checked notifications to default OFF ✅
- [x] Calm urgency in missions.tsx ✅
- [x] Calm urgency in campaigns.tsx ✅
- [x] Calm urgency in deals/[campaignId].tsx ✅
- [x] Calm stock urgency in flash-sales/[id].tsx ✅
- [x] Calm urgency in lock-deals/[id].tsx ✅

### Week 2: Anxiety Redesign ✅
- [x] Redesign streak in SavingsWidget ✅
- [x] Calm streak in SmartActionsPanel ✅
- [x] Calm trial pressure banner ✅
- [ ] Update savings/index.tsx streak messaging

### Week 3: Verification
- [ ] Audit all "limited time" claims
- [ ] Verify countdown timers have real deadlines
- [ ] Remove unverifiable time claims

### Week 4: Softening
- [ ] Redesign referral prompts
- [ ] Update friends invitation flow
- [ ] Final trust audit

---

## Changes Made (May 20, 2026)

### Fake Scarcity → Show Real Only
| File | Change |
|------|--------|
| `components/product/StockBadge.tsx` | Shows real low stock if verified |
| `components/product/StockIndicator.tsx` | Shows honest stock status |
| `components/offers/SmartBadge.tsx` | Shows scarcity from verified data |

### Artificial Urgency → Calm Display
| File | Change |
|------|--------|
| `components/offers/FlashSaleTimer.tsx` | "Available until X PM" (calm, factual) |
| `app/missions.tsx` | "Ends today" badge (calm) |
| `app/campaigns.tsx` | "This week" label (factual) |
| `app/deals/[campaignId].tsx` | "Last days" badge (calm) |
| `app/flash-sales/[id].tsx` | Calm stock status (factual) |
| `app/lock-deals/[id].tsx` | Calm expiry reminder |

### Pre-Checked Notifications → Explicit Opt-In
| File | Change |
|------|--------|
| `app/settings.tsx` | `pushNotifications: false` (was `true`) |
| `contexts/ProfileContext.tsx` | All notifications default to OFF |

### Streak Anxiety → Positive Encouragement
| File | Change |
|------|--------|
| `components/wallet/SavingsWidget.tsx` | "Building momentum" (positive) |
| `components/SmartActionsPanel.tsx` | "Come back tomorrow to continue" (encouraging) |

### Trial Pressure → Respectful
| File | Change |
|------|--------|
| `app/subscription/trial.tsx` | Calm purple banner, "subscribe when ready"

---

## Success Metrics

| Metric | Before | After Target |
|--------|--------|--------------|
| App Store Rating | 3.5 | 4.2+ |
| Trust Score | 45 | 75+ |
| Notification Opt-in Rate | 85% | 60% (but quality) |
| Subscription Cancellation Rate | 40% | 15% |
| Referral Quality | Low | High |

---

## Trust Audit Questions

After implementation, verify:

1. **Honesty:** Are all scarcity claims real?
2. **Respect:** Does language assume user intelligence?
3. **Control:** Can users easily undo/change preferences?
4. **Value:** Does every prompt explain the benefit?
5. **Calm:** Is the interface peaceful, not anxious?

---

*"The best conversion is one where users feel they chose, not were pressured."*

*"Trust compounds. Manipulation has an expiration date."*
