# REZ Intelligence Experience Framework

## Executive Summary

The REZ Consumer App has transformed from a feature-rich platform into an **intelligent experience orchestration system**.

**Core Principle:** "Don't make users learn REZ. Make REZ learn users."

---

## The Complete Experience Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER EXPERIENCE LAYER                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐    │
│  │  Smart Onboard  │  │ For You Today   │  │   Weekly Digest    │    │
│  │  "REZ Learns"   │  │ "3 Daily Cards" │  │   "Your Week"      │    │
│  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘    │
│           │                     │                      │                │
│           └──────────┬─────────┘                      │                │
│                      │                                │                │
│                      ▼                                ▼                │
│            ┌─────────────────────────────────────────────────┐       │
│            │          MEMORY CONTINUITY                       │       │
│            │   "REZ Remembers So You Don't Have To"         │       │
│            │                                                   │       │
│            │   • Preferences    • Behaviors                   │       │
│            │   • Savings        • Patterns                    │       │
│            │   • Milestones     • Social                     │       │
│            └───────────────────────┬─────────────────────────┘       │
│                                    │                                     │
│                                    ▼                                     │
│            ┌─────────────────────────────────────────────────┐       │
│            │        AMBIENT INTELLIGENCE                      │       │
│            │   "Intelligence Should Find Users"                 │       │
│            │                                                   │       │
│            │   • Time-aware      • Location-aware             │       │
│            │   • Behavior-aware   • Savings-aware              │       │
│            │   • Social-aware    • Context-aware             │       │
│            └───────────────────────┬─────────────────────────┘       │
│                                    │                                     │
│                                    ▼                                     │
│            ┌─────────────────────────────────────────────────┐       │
│            │          REZ PROFILE                              │       │
│            │   "What REZ Knows About You"                    │       │
│            │                                                   │       │
│            │   • Transparency    • Control                     │       │
│            │   • Data Sources   • Memory Management           │       │
│            └─────────────────────────────────────────────────┘       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       INFRASTRUCTURE LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ Intelligence │ │     CDP      │ │   Signal     │ │    Fraud    │  │
│  │    Graph     │ │   Service    │ │  Aggregator  │ │  Detection  │  │
│  │   (4050)    │ │   (4056)    │ │   (4121)    │ │   (3007)    │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │Prediction   │ │  Personalize │ │ Loyalty     │ │   Care      │  │
│  │  Engine     │ │   Engine     │ │  Insights   │ │   Service   │  │
│  │   (4123)   │ │   (4024)    │ │   (4060)    │ │   (4055)   │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Screen Architecture

### New Screens (9 Total)

| Screen | Route | Purpose |
|--------|-------|---------|
| `smart-onboarding.tsx` | `/smart-onboarding` | "REZ Learns You" - 6 questions, instant savings map |
| `for-you-today-v2.tsx` | `/for-you-today-v2` | 3 intelligent daily actions |
| `weekly-digest.tsx` | `/weekly-digest` | Weekly progress summary |
| `rez-profile.tsx` | `/rez-profile` | Transparency & memory control |
| `for-you-today.tsx` | `/for-you-today` | Original AI feed |
| `ai-assistant.tsx` | `/ai-assistant` | Voice-first shopping assistant |
| `friends.tsx` | `/friends` | Social commerce hub |

---

## Hook Architecture

### Intelligence Hooks (15 Total)

| Hook | File | Purpose |
|------|------|---------|
| **useIntelligenceMetrics** | `useIntelligenceMetrics.ts` | New KPI framework |
| **useMemoryContinuity** | `useMemoryContinuity.ts` | Longitudinal memory |
| **useAmbientIntelligence** | `useAmbientIntelligence.ts` | Proactive triggers |

### Memory Types

| Type | Example |
|------|--------|
| **Preference** | "You prefer casual dining" |
| **Behavior** | "You usually order lunch at 1pm" |
| **Savings** | "You saved ₹840 on food this month" |
| **Pattern** | "You usually shop on Friday evenings" |
| **Milestone** | "You've checked savings 12 times" |

---

## Ambient Intelligence Triggers

| Trigger | Condition | Message |
|---------|-----------|---------|
| **Lunchtime** | Weekdays 12-2pm | "You usually order around now. Save ₹80 nearby?" |
| **Friday Shopping** | Friday 6-9pm | "Your usual shopping time! Deals active." |
| **Peak Activity** | Weekday 7-9pm | "Most active on REZ around now." |
| **Streak at Risk** | No check-in today | "Check in to keep your streak going." |
| **Rewards Expiring** | Within 7 days | "Rewards expiring soon. Use them!" |
| **Great Week** | More savings | "You saved ₹X this week! More than last!" |
| **Nearby Partner** | Near partner | "You're near a partner. 20% cashback." |
| **Friend Nearby** | Friend at same place | "Friend is here. Split a deal?" |

---

## New KPI Framework

### Intelligence Metrics

| Category | Metric | Target |
|----------|--------|--------|
| **Time-to-Value** | Time-to-first-value | <30s |
| **Time-to-Value** | Time-to-first-insight | <15s |
| **Engagement** | Smart action rate | >40% |
| **Engagement** | Recommendation interaction | >60% |
| **Engagement** | Daily insight views | >5 |
| **Trust** | Perceived intelligence | >80 |
| **Trust** | Weekly savings viewed | >7 |
| **Trust** | AI confidence rate | >70% |
| **Habit** | Daily active streak | >14 days |
| **Habit** | Return intent | >85% |
| **Habit** | Weekly sessions | >10 |
| **Emotional** | Frustration signals | <2/session |
| **Emotional** | Delight signals | >10/session |
| **Emotional** | Premium willingness | >30% |

---

## REZ Profile: Transparency System

```
┌─────────────────────────────────────────────────────────┐
│ 🧠 What REZ Learned About You                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  💾 Memories: 13    ✅ High Confidence: 9    📅 Today │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ AI Personalization                   [ON]      │   │
│  │ Power all intelligent features                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🍽️ Food & Dining (3 memories)                         │
│  🛍️ Shopping (2 memories)                             │
│  💰 Savings & Finance (2 memories)                     │
│  💆 Wellness (2 memories)                              │
│  ✈️ Travel (1 memory)                                 │
│  👥 Social (1 memory)                                  │
│                                                         │
│  📊 Data Sources                                      │
│  • Location Data [ON]                                 │
│  • Shopping Behavior [ON]                              │
│  • Social Connections [ON]                              │
│  • Transaction History [ON]                             │
│  • Dining Preferences [ON]                              │
│  • Push Notifications [ON]                               │
│                                                         │
│  🔄 Retake Preferences   🗑️ Reset REZ Memory          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Weekly Digest Components

```
┌─────────────────────────────────────────────────────────┐
│ 🏆 Your Week in REZ                                   │
│    Week 21: May 13 - May 19                           │
├─────────────────────────────────────────────────────────┤
│ 💰 Total Saved This Week                               │
│    ₹1,240              +23% vs last week             │
│    18 transactions                                    │
│    Top: food delivery                                 │
├─────────────────────────────────────────────────────────┤
│ 📍 What You Discovered                                 │
│    3 new places  •  2 new products  •  1 friend    │
├─────────────────────────────────────────────────────────┤
│ 🔥 Your Engagement                                     │
│    7 day streak  •  6/7 days active  •  Smart recs  │
├─────────────────────────────────────────────────────────┤
│ 📈 Your Habits                                        │
│    Improved: Dining cashback, Smart ordering           │
│    New: Friday evening shopping                        │
├─────────────────────────────────────────────────────────┤
│ 🔮 Coming Up                                          │
│    • Weekend deals active                             │
│    • New restaurant partners                          │
│    To explore: Korean cuisine, Fitness               │
├─────────────────────────────────────────────────────────┤
│ 📤 Share Progress                    See you next week! │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Files

### Screens
```
app/smart-onboarding.tsx       - "REZ Learns You" onboarding
app/for-you-today-v2.tsx       - Simplified daily briefing
app/weekly-digest.tsx           - Weekly REZ summary
app/rez-profile.tsx             - Transparency + control
```

### Hooks
```
hooks/useIntelligenceMetrics.ts  - KPI framework
hooks/useMemoryContinuity.ts     - Longitudinal memory
hooks/useAmbientIntelligence.ts   - Proactive triggers
```

### Components
```
components/SmartActionsPanel.tsx   - Reusable smart actions
components/social/MemoryContinuityCard.tsx - Memory display
components/social/WeeklyDigestCard.tsx - Weekly digest
```

### Documentation
```
docs/EXPERIENCE-ORCHESTRATION-STRATEGY.md - Full strategy
docs/INTELLIGENCE-EXPERIENCE-FRAMEWORK.md - This document
```

---

## Experience Philosophy

### The REZ Way

| Traditional | REZ Way |
|-------------|----------|
| Users search for deals | REZ surfaces relevant savings |
| Users browse products | REZ shows personalized picks |
| Users track rewards | REZ reminds of expiring points |
| Users find restaurants | REZ recommends based on habits |
| Users manage finances | REZ provides spending insights |

### Behavioral Shift

```
BEFORE: User → searches → browses → decides → purchases
         ↑_________________________________↓
                   (repetitive)

AFTER:  REZ → learns → remembers → surfaces → user acts
        ↑_________________________________↓
               (intelligent loop)
```

---

## Success Metrics

### 4-Week Targets

| Metric | Current | Target |
|--------|---------|--------|
| Day-7 retention | ~25% | >40% |
| Onboarding completion | Unknown | >60% |
| Smart action rate | Unknown | >40% |
| Perceived intelligence | Unknown | >80 |
| Weekly digest views | Unknown | >60% |

### 12-Week Targets

| Metric | Target |
|--------|--------|
| DAU/MAU ratio | >25% |
| Daily active streak | >14 days |
| Premium conversion | >5% |
| NPS score | >40 |
| Referral rate | >1.1x |

---

## Trust-Building Behaviors

1. **Transparency** - Show users what REZ knows
2. **Control** - Let users manage their data
3. **Value** - Always show real monetary value
4. **Timing** - Surface at the right moment
5. **Honesty** - No dark patterns, no manipulation

## Dark Patterns Removed

1. ~~Points expiry urgency~~ → 30+ day warnings
2. ~~Karma decay anxiety~~ → Explain clearly if exists
3. ~~Streak lock-in~~ → Allow streak freeze
4. ~~Flash sale pulsing~~ → Real-time only
5. ~~Pre-checked marketing~~ → Opt-in default

---

*"The best intelligence is invisible intelligence."*

*"REZ doesn't show you more options. REZ shows you smarter options."*
