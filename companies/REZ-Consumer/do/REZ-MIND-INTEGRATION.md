# Do App - ReZ Mind Integration Guide

**Version:** 1.0 | **Date:** May 13, 2026

---

## Overview

This document describes how to integrate the Do App with ReZ Mind (Intent Graph) for AI-powered user context and personalization.

---

## What is ReZ Mind?

ReZ Mind is the AI intelligence layer that captures user intents, predicts behavior, and enables personalization across the ReZ platform.

### Key Capabilities

| Capability | Description |
|-----------|-------------|
| **Intent Capture** | Track user actions and conversations |
| **Dormant Detection** | Identify users at risk of churn |
| **Revival Engine** | Re-engage dormant users |
| **ML Scoring** | Dynamic intent scoring |
| **Behavioral Insights** | User personality and LTV |

---

## Integration Points

### 1. Intent Capture

Capture user intents from chat conversations:

```typescript
// When user sends a chat message
await intentService.capture(userId, 'chat_message', {
  message: text,
  location: userLocation,
  sessionId: sessionId,
});

// When booking is completed
await intentService.capture(userId, 'booking_complete', {
  entityId: booking.id,
  entityType: 'restaurant',
  amount: booking.amount,
  karmaEarned: coinsEarned,
});

// When user views an entity
await intentService.capture(userId, 'entity_view', {
  entityId: entity.id,
  entityType: entity.type,
  distance: entity.distance,
});
```

### 2. Dormant Detection

Check if user is becoming dormant:

```typescript
// GET /dormant/:userId
const dormancyStatus = await intentService.getDormancyStatus(userId);

if (dormancyStatus.isDormant) {
  // Show re-engagement notification
  showRevivalNotification(dormancyStatus.reason);
}
```

### 3. Revival Engine

Trigger revival campaigns for dormant users:

```typescript
// POST /revive
const revivalResult = await intentService.triggerRevival(userId, {
  channel: 'push',      // 'push' | 'sms' | 'email'
  campaignType: 'winback',
  offer: {
    coins: 50,
    discountPercent: 20,
  },
});
```

### 4. ML Intent Scoring

Get dynamic intent scores for recommendations:

```typescript
// GET /score/:userId
const scores = await intentService.getIntentScores(userId, {
  categories: ['restaurants', 'spa', 'events'],
  location: { lat: 28.6139, lng: 77.2090 },
});

// scores = {
//   'restaurants': 0.85,
//   'spa': 0.62,
//   'events': 0.41,
// }

// Use scores to rank recommendations
```

### 5. User Intelligence

Get behavioral insights:

```typescript
// GET /user-intelligence/:userId
const intelligence = await userIntelligenceService.getInsights(userId);

// intelligence = {
//   personality: 'explorer',      // 'explorer' | 'loyalist' | 'bargain_hunter'
//   engagement: 'high',           // 'low' | 'medium' | 'high'
//   lifetimeValue: 'premium',     // 'standard' | 'premium' | 'vip'
//   riskLevel: 'low',            // 'low' | 'medium' | 'high'
//   preferredChannels: ['push', 'in_app'],
// }
```

---

## API Integration

### Backend Routes to Add

```typescript
// src/integrations/rezMindIntegration.ts

import axios from 'axios';

const INTENT_URL = process.env.REZ_INTENT_CAPTURE_URL || 'https://rez-intent-graph.onrender.com';
const USER_INTELLIGENCE_URL = process.env.REZ_USER_INTELLIGENCE_URL || 'https://REZ-user-intelligence.onrender.com';

export const intentService = {
  async capture(userId: string, intent: string, data: Record<string, any>) {
    const response = await axios.post(`${INTENT_URL}/capture`, {
      userId,
      intent,
      data,
      timestamp: new Date().toISOString(),
    });
    return response.data;
  },

  async getDormancyStatus(userId: string) {
    const response = await axios.get(`${INTENT_URL}/dormant/${userId}`);
    return response.data;
  },

  async triggerRevival(userId: string, params: Record<string, any>) {
    const response = await axios.post(`${INTENT_URL}/revive`, {
      userId,
      ...params,
    });
    return response.data;
  },

  async getIntentScores(userId: string, params: Record<string, any>) {
    const response = await axios.get(`${INTENT_URL}/score/${userId}`, { params });
    return response.data;
  },
};

export const userIntelligenceService = {
  async getInsights(userId: string) {
    const response = await axios.get(`${USER_INTELLIGENCE_URL}/user/${userId}`);
    return response.data;
  },

  async updatePreferences(userId: string, token: string, preferences: any) {
    const response = await axios.patch(
      `${USER_INTELLIGENCE_URL}/user/${userId}/preferences`,
      preferences,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
};
```

### Register Routes in Backend

```typescript
// src/index.ts
import { intentService } from './integrations/rezMindIntegration.ts';

app.post('/do/chat/message', async (req, res) => {
  // ... existing chat logic ...

  // Capture intent
  await intentService.capture(userId, 'chat_intent', {
    message: req.body.message,
    detectedIntent: result.intent,
    confidence: result.confidence,
  });
});
```

---

## Chat Enhancement

### Personality-Aware Responses

Use user intelligence to personalize chat:

```typescript
// In workflowEngine.ts
const userProfile = await userIntelligenceService.getInsights(userId);

let responseStyle = 'friendly';
if (userProfile.personality === 'bargain_hunter') {
  responseStyle = 'value_focused';
  // Add savings info to responses
} else if (userProfile.personality === 'explorer') {
  responseStyle = 'discovery_focused';
  // Suggest new/trending venues
}
```

### Dormant User Recovery

```typescript
// In chat session start
const dormancy = await intentService.getDormancyStatus(userId);

if (dormancy.isDormant && dormancy.daysSinceActive > 14) {
  // Add special greeting
  const revivalMessage = getRevivalMessage(dormancy.reason);
  addSystemMessage(revivalMessage);
}
```

---

## Implementation Checklist

- [ ] Add ReZ Mind integration credentials
- [ ] Implement intent capture on key actions
- [ ] Connect dormant detection
- [ ] Add revival engine triggers
- [ ] Wire ML intent scores to recommendations
- [ ] Update chat responses based on personality
- [ ] Add analytics tracking

---

## Environment Variables

```bash
# ReZ Mind
REZ_INTENT_CAPTURE_URL=https://rez-intent-graph.onrender.com
REZ_USER_INTELLIGENCE_URL=https://REZ-user-intelligence.onrender.com
```

---

## Testing

```bash
# Test intent capture
curl -X POST https://rez-intent-graph.onrender.com/capture \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","intent":"chat_message","data":{"text":"hello"}}'

# Test dormant detection
curl https://rez-intent-graph.onrender.com/dormant/test-user
```

---

## Monitoring

Track these metrics after integration:

| Metric | Target |
|--------|--------|
| Intent capture rate | > 90% |
| Dormancy detection accuracy | > 80% |
| Revival campaign success | > 15% |
| Recommendation CTR | > 10% |

---

*Last Updated: May 13, 2026*
