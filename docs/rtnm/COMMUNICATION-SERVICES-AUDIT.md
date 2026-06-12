# COMMUNICATION TRAINING COLLECTOR

**Service that collects all communication data for HOJAI Voice Studio**

---

## OVERVIEW

This module collects training data from all communication services:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│           COMMUNICATION TRAINING DATA COLLECTION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                        │
│  │  VoiceOS   │  │ REZ Chat   │  │  Support   │                        │
│  │  (4850)   │  │  (4103)    │  │  Service   │                        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                        │
│         │                 │                 │                               │
│         └─────────────────┼─────────────────┘                               │
│                           │                                                 │
│                           ▼                                                 │
│            ┌─────────────────────────┐                                   │
│            │  COMMUNICATION TRAINING  │                                   │
│            │       COLLECTOR           │                                   │
│            │    (This Module)          │                                   │
│            └────────────┬──────────────┘                                   │
│                         │                                                   │
│         ┌───────────────┼───────────────┐                               │
│         ▼               ▼               ▼                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                          │
│  │  Voice    │  │   Chat    │  │  Support  │                          │
│  │  Data     │  │   Data    │  │   Data    │                          │
│  └───────────┘  └───────────┘  └───────────┘                          │
│                           │                                                 │
│                           ▼                                                 │
│            ┌─────────────────────────┐                                   │
│            │   HOJAI VOICE STUDIO   │                                   │
│            │    (Training)          │                                   │
│            └─────────────────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## DATA TYPES COLLECTED

### Voice Data
```typescript
interface VoiceTrainingData {
  id: string;
  source: 'voiceos' | 'genie-call';
  audioUrl?: string;
  transcript: string;
  language: string;
  intent: string;
  entities: Record<string, any>;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  duration: number;
  outcome: 'resolved' | 'escalated' | 'failed';
  userId?: string;
  businessId?: string;
  timestamp: Date;
  metadata: {
    channel: 'phone' | 'whatsapp' | 'app';
    device: string;
    location?: string;
  };
}
```

### Chat Data
```typescript
interface ChatTrainingData {
  id: string;
  source: 'rez-chat' | 'chatbot' | 'widget';
  conversationId: string;
  messages: Array<{
    role: 'user' | 'agent' | 'bot';
    text: string;
    timestamp: Date;
  }>;
  transcript: string;
  language: string;
  intent: string;
  entities: Record<string, any>;
  sentiment: 'positive' | 'negative' | 'neutral';
  resolution: {
    resolved: boolean;
    timeToResolve: number;
    escalation: boolean;
    agentHandled: boolean;
  };
  feedback?: {
    rating: number;
    comment?: string;
  };
  userId?: string;
  businessId?: string;
  timestamp: Date;
}
```

### Support Data
```typescript
interface SupportTrainingData {
  id: string;
  source: 'customer-support' | 'ticket-system';
  ticketId: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  transcript?: string; // If chat-based
  resolution: {
    solution: string;
    timeToResolve: number;
    agentId?: string;
    autoResolved: boolean;
  };
  sentiment: 'positive' | 'negative' | 'neutral';
  feedback?: {
    rating: number;
    comment?: string;
    csat: number;
  };
  userId?: string;
  businessId?: string;
  timestamp: Date;
}
```

---

## INTEGRATION

### VoiceOS Integration

```typescript
// In VoiceOS (4850)
import { CommunicationTrainingCollector } from '@hojai/communications-sdk';

const collector = new CommunicationTrainingCollector({
  endpoint: 'http://localhost:4760/api/training',
  source: 'voiceos',
});

// After each call
await collector.collectVoice({
  transcript: 'I want to order a pizza',
  intent: 'order',
  sentiment: 'neutral',
  duration: 45,
  outcome: 'resolved',
  language: 'en-IN',
  confidence: 0.95,
});
```

### REZ Chat Integration

```typescript
// In REZ-chat-service (4103)
import { CommunicationTrainingCollector } from '@hojai/communications-sdk';

const collector = new CommunicationTrainingCollector({
  endpoint: 'http://localhost:4760/api/training',
  source: 'rez-chat',
});

// After conversation ends
await collector.collectChat({
  conversationId: 'conv_123',
  messages: conversation.messages,
  transcript: conversation.transcript,
  intent: 'query',
  resolution: {
    resolved: true,
    timeToResolve: 120,
    escalation: false,
  },
});
```

### Customer Support Integration

```typescript
// In customer-support-service
import { CommunicationTrainingCollector } from '@hojai/communications-sdk';

const collector = new CommunicationTrainingCollector({
  endpoint: 'http://localhost:4760/api/training',
  source: 'customer-support',
});

// When ticket is resolved
await collector.collectSupport({
  ticketId: 'TICKET_123',
  subject: ticket.subject,
  description: ticket.description,
  category: 'billing',
  resolution: {
    solution: 'Refunded Rs. 500',
    timeToResolve: 3600,
    agentId: 'agent_456',
  },
  feedback: { rating: 4, csat: 8 },
});
```

---

## API ENDPOINTS

Added to Genie Voice (4760):

### POST /api/training/collect/voice
```json
{
  "source": "voiceos",
  "transcript": "Order a pizza",
  "language": "en-IN",
  "intent": "order",
  "sentiment": "neutral",
  "confidence": 0.95,
  "duration": 45,
  "outcome": "resolved"
}
```

### POST /api/training/collect/chat
```json
{
  "source": "rez-chat",
  "conversationId": "conv_123",
  "transcript": "User: Order pizza\nBot: Which size?\nUser: Large",
  "intent": "order",
  "resolution": {
    "resolved": true,
    "timeToResolve": 120
  }
}
```

### POST /api/training/collect/support
```json
{
  "source": "customer-support",
  "ticketId": "TICKET_123",
  "category": "billing",
  "resolution": {
    "solution": "Refund processed",
    "timeToResolve": 3600
  }
}
```

### GET /api/training/export/all
Export all collected data for HOJAI Voice Studio training.

---

## PRIVACY COMPLIANCE

- [ ] User consent required before data collection
- [ ] PII should be anonymized
- [ ] Data retention policy: 90 days for training
- [ ] GDPR/CCPA compliant
- [ ] Opt-out mechanism

---

**Implementation:** Add `CommunicationTrainingCollector` to each communication service
