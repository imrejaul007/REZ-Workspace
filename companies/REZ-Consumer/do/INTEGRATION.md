# Do App + ReZ Mind Integration Blueprint

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DO APP                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    CHAT      │  │   EXPLORE    │  │   WALLET     │       │
│  │  Interface   │  │  Discovery   │  │   & Karma    │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
│                   ┌─────────▼─────────┐                          │
│                   │   SALES AGENT    │                          │
│                   │  (Local AI)     │                          │
│                   │ 1000+ patterns   │                          │
│                   └─────────┬─────────┘                          │
│                             │                                     │
│         ┌──────────────────┼──────────────────┐                  │
│         │                  │                  │                  │
│  ┌─────▼─────┐   ┌──────▼──────┐  ┌──────▼──────┐         │
│  │   DO       │   │   REZ       │  │   EXTERNAL   │         │
│  │  BACKEND   │──▶│  SERVICES   │  │   SERVICES   │         │
│  │  Express   │   │  (API)      │  │   Twilio     │         │
│  └────────────┘   └─────────────┘  └──────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Target Architecture (With ReZ Mind)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              REZ MIND                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                    INTENT GRAPH                                     │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │       │
│  │  │ Intent   │ │ Dormant  │ │ Revival  │ │ Scoring  │        │       │
│  │  │ Capture  │ │ Detect   │ │ Engine   │ │ Engine   │        │       │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘        │       │
│  │       │             │             │             │                │       │
│  │       └─────────────┴─────────────┴─────────────┘                │       │
│  └────────────────────────────────┬────────────────────────────────────┘       │
│                                   │                                          │
│                                   ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                      AGENT SWARM                                   │       │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │       │
│  │  │Personal │ │ Demand  │ │ Scarcity│ │Revenue  │          │       │
│  │  │Agent    │ │ Signal  │ │ Agent   │ │Attrib   │          │       │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │       │
│  └────────────────────────────────┬────────────────────────────────┘       │
│                                   │                                          │
│                                   ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                       NUDGE ENGINE                                │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │       │
│  │  │  Push    │ │   SMS    │ │  Email   │ │WhatsApp  │     │       │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │       │
│  └────────────────────────────────┬────────────────────────────────┘       │
│                                   │                                          │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DO APP                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                    DO SALES AGENT (Enhanced)                       │       │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │       │
│  │  │ Local ML     │ │ ReZ Mind    │ │ Unified     │          │       │
│  │  │ Patterns     │◄│ Intelligence │◄│ Profiles    │          │       │
│  │  └──────────────┘ └──────────────┘ └──────────────┘          │       │
│  └────────────────────────────────┬────────────────────────────────┘       │
│                                   │                                          │
│         ┌─────────────────────────┼─────────────────────────┐              │
│         │                         │                         │              │
│  ┌──────▼──────┐         ┌──────▼──────┐         ┌──────▼──────┐     │
│  │    CHAT      │         │   EXPLORE    │         │   WALLET     │     │
│  │  + Real-time │         │  + Personal  │         │  + Coins    │     │
│  │    Nudges    │         │   Discovery  │         │  + Rewards  │     │
│  └──────────────┘         └─────────────┘         └─────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Integration Points

### 1. Intent Capture
```typescript
// When user searches
POST /api/intent/capture
{
  userId: "user_123",
  intent: "restaurant_booking",
  entities: { category: "italian", location: "mumbai" },
  context: { mood: "date_night", budget: 2000 }
}
```

### 2. Dormant Detection
```typescript
// Automatic trigger when user inactive 7+ days
GET /api/intent/dormant/user_123
{
  dormantScore: 0.85,
  lastIntent: "restaurant_booking",
  daysInactive: 12,
  recommendedNudge: "miss_restaurant"
}
```

### 3. Trigger Nudge
```typescript
// Send nudge via Do app
POST /api/intent/revive
{
  userId: "user_123",
  nudgeType: "push",
  template: "miss_restaurant",
  channel: "do_app"
}
```

## Data Flow

### Real-time
```
User Action → Do App → ReZ Mind Intent Graph → Agent Swarm → Nudge Engine
                │                                              │
                │◄──────────── Response ───────────────────────┘
```

### Batch Processing
```
Daily Cron → Dormant Detection → Scoring → Queue Nudges → Delivery
                     │                                      │
                     └────────────── Report ────────────────┘
```

## API Mapping

| Do App Action | ReZ Mind Endpoint | Response |
|--------------|-------------------|----------|
| User searches | POST /intent/capture | Intent recorded |
| User books | POST /intent/capture | Transaction logged |
| User inactive | GET /intent/dormant/:id | Revival score |
| Send nudge | POST /intent/revive | Nudge queued |
| Get profile | GET /intent/active/:id | User intents |

## Feature Parity Checklist

| ReZ Mind Feature | Do App Status | Integration |
|------------------|---------------|-------------|
| Intent Detection | ✅ Pattern matching | Connect to /capture |
| Dormant Detection | ❌ Not implemented | Connect to /dormant |
| Revival Engine | ❌ Not implemented | Connect to /revive |
| Agent Swarm | ✅ Local agent | Share context |
| Nudge Engine | ✅ Chat nudges | Add push/email |
| User Profiles | ✅ Basic | Sync with Mind |
| Analytics | ❌ Basic | Connect dashboards |

---

## Implementation Guide

### Step 1: Connect Intent Graph
```typescript
// src/services/rezMindClient.ts
import { REZ_MIND_URL } from '@env';

export const intentService = {
  async capture(userId: string, intent: string, entities: any) {
    const response = await fetch(`${REZ_MIND_URL}/api/intent/capture`, {
      method: 'POST',
      body: JSON.stringify({ userId, intent, entities, source: 'do-app' })
    });
    return response.json();
  },

  async getDormant(userId: string) {
    const response = await fetch(`${REZ_MIND_URL}/api/intent/dormant/${userId}`);
    return response.json();
  },

  async triggerRevival(userId: string, nudgeType: string) {
    const response = await fetch(`${REZ_MIND_URL}/api/intent/revive`, {
      method: 'POST',
      body: JSON.stringify({ userId, nudgeType, source: 'do-app' })
    });
    return response.json();
  }
};
```

### Step 2: Enable Real-time Sync
```typescript
// WebSocket connection
const ws = new WebSocket(`${REZ_MIND_WS_URL}/ws?app=do-app`);

ws.onmessage = (event) => {
  const nudge = JSON.parse(event.data);
  if (nudge.type === 'revival') {
    // Show in-app notification
    showNudge(nudge.message);
  }
};
```

### Step 3: Update Chat Interface
```typescript
// On message sent
await intentService.capture(userId, 'chat_message', {
  message: text,
  location: userLocation
});

// On booking completed
await intentService.capture(userId, 'booking_complete', {
  entityId: booking.id,
  amount: booking.amount
});
```

---

*Integration ready - connect to ReZ Mind!*
