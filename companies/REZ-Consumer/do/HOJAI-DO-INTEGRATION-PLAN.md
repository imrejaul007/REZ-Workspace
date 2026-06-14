# 🎯 HOJAI-DO Integration Plan: Genie + Flow + DO App

**Version:** 1.0 | **Date:** June 7, 2026  
**Purpose:** Complete integration of HOJAI AI into DO App

---

## 📋 EXECUTIVE SUMMARY

```
┌─────────────────────────────────────────────────────────────────────┐
│                           DO APP                                     │
│                   "AI Commerce Super App"                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   User: "Order my usual coffee"                                      │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  🎤 FLOW (Voice) - Capture & Speak                         │   │
│   │  • STT: "Order my usual coffee"                          │   │
│   │  • TTS: "Ordered! ₹250, earn 12 karma"                  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  🧠 GENIE (Memory) - Remember & Recall                    │   │
│   │  • "Usual = Starbucks Cold Coffee Grande ₹250"            │   │
│   │  • "Orders every Tuesday"                               │   │
│   │  • "Last order: 3 days ago"                            │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  🛒 DO (Commerce) - Execute Actions                       │   │
│   │  • Place order                                           │   │
│   │  • Process payment (RABTUL)                               │   │
│   │  • Add karma coins                                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 PRODUCT RELATIONSHIPS

| Product | Company | Role | What It Does |
|---------|---------|------|--------------|
| **DO App** | REZ-Consumer | **Action Layer** | Commerce: Book, Order, Pay, Karma |
| **Genie** | HOJAI-AI | **Intelligence Layer** | Memory: Remember preferences, recall "usual" |
| **Flow** | HOJAI-AI | **Voice Layer** | Voice: STT, TTS, intent detection |

**Key Insight:** Genie + Flow power DO App's AI, they don't replace it.

---

## 📦 PHASE 1: SDK Packages (Already Built ✅)

### @hojai/flow-sdk
```
hojai-ai/packages/flow-sdk/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Main export (FlowSDK class)
│   ├── types.ts          # TypeScript types
│   ├── VoiceService.ts   # STT/TTS
│   └── IntentDetector.ts # Intent detection
└── README.md
```

### @hojai/genie-sdk
```
hojai-ai/packages/genie-sdk/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Main export (GenieSDK class)
│   ├── types.ts          # TypeScript types
│   └── MemoryClient.ts   # Remember/Recall
└── README.md
```

---

## 📦 PHASE 2: DO App Frontend Hooks (To Build)

### Target Files
```
REZ-Consumer/do/src/hooks/
├── useFlowVoice.ts       [NEW] - Voice via HOJAI Flow
├── useGenieMemory.ts     [NEW] - Memory via Genie
├── useFlowIntent.ts      [NEW] - Intent detection
├── useHybridAI.ts        [NEW] - Combined Flow + Genie + REZ Mind
└── [EXISTING]
    ├── useVoiceInput.ts  [UPDATE] - Replace mock with Flow
    └── useReZMind.ts     [UPDATE] - Add Genie integration
```

### Hook Specifications

#### 1. useFlowVoice.ts
```typescript
// Purpose: Real voice (STT/TTS) instead of mock
// Usage: replace useVoiceInput.ts

import { FlowSDK } from '@hojai/flow-sdk';

export function useFlowVoice() {
  const flow = new FlowSDK({ apiKey: process.env.HOJAI_FLOW_KEY });
  
  // Speech to text
  async function transcribe(audioUri: string) {
    return flow.voice.speechToText(audioUri);
  }
  
  // Text to speech
  async function speak(text: string) {
    return flow.voice.textToSpeech(text);
  }
  
  // Full voice interaction
  async function interact(audioUri: string) {
    const text = await transcribe(audioUri);
    const audio = await speak(text);
    return { text, audio };
  }
  
  return { transcribe, speak, interact, isListening };
}
```

#### 2. useGenieMemory.ts
```typescript
// Purpose: Personal memory for DO App
// Usage: Remember preferences, recall "usual"

import { GenieSDK } from '@hojai/genie-sdk';

export function useGenieMemory() {
  const genie = new GenieSDK({ 
    apiKey: process.env.HOJAI_GENIE_KEY,
    userId: user.id 
  });
  
  // Remember a preference
  async function remember(type, content, tags) {
    return genie.remember({ type, content, tags });
  }
  
  // Recall memories
  async function recall(query) {
    return genie.recall(query);
  }
  
  // Get user's "usual"
  async function getUsual() {
    return genie.getUsual();
  }
  
  // Remember food preference
  async function rememberFood(cuisine) {
    return genie.rememberFoodPreference(cuisine);
  }
  
  // Remember transaction
  async function rememberTransaction(merchant, amount) {
    return genie.rememberTransaction(merchant, amount);
  }
  
  return { remember, recall, getUsual, rememberFood, rememberTransaction };
}
```

#### 3. useHybridAI.ts (Combined)
```typescript
// Purpose: Combined AI (Flow + Genie + REZ Mind)

export function useHybridAI() {
  const flow = useFlowVoice();
  const genie = useGenieMemory();
  const rezMind = useReZMind();
  
  // Full conversation handler
  async function handleVoiceCommand(audioUri: string) {
    // 1. Speech to text
    const { text } = await flow.transcribe(audioUri);
    
    // 2. Detect intent
    const intent = flow.detectIntent(text);
    
    // 3. Check Genie for context
    const context = await genie.getContext(text);
    
    // 4. Process with REZ Mind
    const result = await rezMind.process(intent, context);
    
    // 5. Generate response
    const response = await flow.speak(result.text);
    
    // 6. Remember transaction
    if (result.success) {
      await genie.rememberTransaction(result.merchant, result.amount);
    }
    
    return { text, intent, result, response };
  }
  
  return { handleVoiceCommand };
}
```

---

## 📦 PHASE 3: DO App Backend Integration (To Build)

### Target Files
```
REZ-Consumer/do/do-backend/src/services/
├── hojaiFlowClient.ts     [NEW] - Connect to Flow services
├── genieMemoryClient.ts   [NEW] - Connect to Genie services
├── intentFusion.ts         [NEW] - Combine Flow + REZ Mind intent
└── memorySync.ts           [NEW] - Sync DO ↔ Genie
```

### Backend Services

#### hojaiFlowClient.ts
```typescript
// Connect DO backend to HOJAI Flow services

import axios from 'axios';

const FLOW_URL = process.env.HOJAI_FLOW_URL || 'http://localhost:4580';
const FLOW_API_KEY = process.env.HOJAI_FLOW_API_KEY;

export class HojaiFlowClient {
  private client = axios.create({
    baseURL: FLOW_URL,
    headers: { 'X-API-Key': FLOW_API_KEY }
  });
  
  // Speech to Text
  async speechToText(audioUri: string) {
    const formData = new FormData();
    formData.append('audio', audioUri);
    formData.append('language', 'en-IN');
    
    const response = await this.client.post('/api/stt', formData);
    return response.data;
  }
  
  // Text to Speech
  async textToSpeech(text: string, voice: string = 'shimmer') {
    const response = await this.client.post('/api/tts', {
      text,
      voice,
      language: 'en-IN'
    });
    return response.data;
  }
  
  // Detect Intent
  async detectIntent(text: string) {
    const response = await this.client.post('/api/intent/detect', { text });
    return response.data;
  }
}
```

#### genieMemoryClient.ts
```typescript
// Connect DO backend to Genie memory

import axios from 'axios';

const GENIE_URL = process.env.HOJAI_GENIE_URL || 'http://localhost:4540';
const GENIE_API_KEY = process.env.HOJAI_GENIE_API_KEY;

export class GenieMemoryClient {
  private client = axios.create({
    baseURL: GENIE_URL,
    headers: { 'X-API-Key': GENIE_API_KEY }
  });
  
  // Remember user preference
  async remember(userId: string, memory: any) {
    const response = await this.client.post('/api/memory/remember', {
      userId,
      ...memory
    });
    return response.data;
  }
  
  // Recall memories
  async recall(userId: string, query: string) {
    const response = await this.client.get('/api/memory/recall', {
      params: { userId, query }
    });
    return response.data;
  }
  
  // Get "usual" order
  async getUsualOrder(userId: string) {
    const response = await this.client.get('/api/memory/usual', {
      params: { userId, type: 'order' }
    });
    return response.data;
  }
  
  // Remember transaction
  async rememberTransaction(userId: string, transaction: any) {
    return this.remember(userId, {
      type: 'transaction',
      content: `Spent ₹${transaction.amount} at ${transaction.merchant}`,
      metadata: transaction
    });
  }
}
```

---

## 📦 PHASE 4: Update Existing Files (To Build)

### Update ChatScreen.tsx
```typescript
// Add Genie + Flow integration to chat

import { useFlowVoice, useGenieMemory } from '@/hooks';

export default function ChatScreen() {
  const flow = useFlowVoice();
  const genie = useGenieMemory();
  
  async function handleSend(message: string) {
    // 1. Check for "usual" or "same as" patterns
    if (message.includes('usual') || message.includes('same')) {
      const usual = await genie.getUsual();
      if (usual) {
        // Show "Your usual is..."
        showUsualOrder(usual);
      }
    }
    
    // 2. Process message normally
    const response = await workflowEngine.execute(message, context);
    
    // 3. Remember transaction if successful
    if (response.bookingCreated) {
      await genie.rememberTransaction(
        response.merchant,
        response.amount
      );
    }
    
    // 4. Speak response
    await flow.speak(response.text);
  }
}
```

### Update ProfileScreen.tsx
```typescript
// Add "Your Preferences" section powered by Genie

import { useGenieMemory } from '@/hooks';

export default function ProfileScreen() {
  const genie = useGenieMemory();
  
  // Get user's memories
  const { data: preferences } = useQuery(['preferences'], 
    () => genie.getFoodPreferences()
  );
  
  return (
    <View>
      {/* Existing profile */}
      
      {/* NEW: Preferences section */}
      <PreferencesSection 
        preferences={preferences}
        onRemember={genie.remember}
      />
    </View>
  );
}
```

---

## 📦 PHASE 5: Environment Variables

### DO App .env
```bash
# HOJAI AI Integration
HOJAI_FLOW_API_KEY=your-flow-api-key
HOJAI_FLOW_URL=https://api.hojai.ai
HOJAI_GENIE_API_KEY=your-genie-api-key
HOJAI_GENIE_URL=https://api.hojai.ai
HOJAI_INTENT_API_KEY=your-intent-api-key
HOJAI_INTENT_URL=https://api.hojai.ai

# Feature Flags
ENABLE_HOJAI_VOICE=true
ENABLE_HOJAI_MEMORY=true
```

---

## 📋 TASK BREAKDOWN (4 Weeks)

### Week 1: Hooks
| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Create useFlowVoice.ts | Voice hook with STT/TTS |
| 2 | Create useGenieMemory.ts | Memory hook with remember/recall |
| 3 | Create useHybridAI.ts | Combined AI hook |
| 4 | Update useVoiceInput.ts | Replace mock with Flow |
| 5 | Update useReZMind.ts | Add Genie integration |
| 6 | Test hooks | Manual testing |
| 7 | Document hooks | README |

### Week 2: Backend
| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Create hojaiFlowClient.ts | Flow service client |
| 2 | Create genieMemoryClient.ts | Genie service client |
| 3 | Create intentFusion.ts | Combined intent |
| 4 | Update chat routes | Use new clients |
| 5 | Update workflow engine | Add Genie context |
| 6 | Test backend | Integration test |
| 7 | Document backend | API docs |

### Week 3: UI Updates
| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Update ChatScreen.tsx | Use hooks |
| 2 | Update ProfileScreen.tsx | Add preferences |
| 3 | Add "Your Usual" UI | Usual order display |
| 4 | Add memory indicator | Show Genie is working |
| 5 | Test full flow | E2E testing |
| 6 | Fix bugs | Bug fixes |
| 7 | Polish UI | UI polish |

### Week 4: Documentation & Deploy
| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Create HOJAI-INTEGRATION.md | Full docs |
| 2 | Update CLAUDE.md | DO App docs |
| 3 | Create examples | Usage examples |
| 4 | Performance test | Load test |
| 5 | Deploy staging | Staging deploy |
| 6 | Deploy production | Production deploy |
| 7 | Final review | Complete |

---

## 📊 SUCCESS METRICS

| Metric | Target | Current |
|--------|--------|---------|
| Voice accuracy | >95% | N/A (mock) |
| Memory recall | >90% | 0% (none) |
| "Usual" detection | >85% | N/A |
| User engagement | +20% | baseline |
| Session length | +30% | baseline |

---

## 🔴 RISKS & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|------------|
| API latency | High | Cache, offline mode |
| Service downtime | Medium | Fallback to mock |
| Data privacy | High | Consent, encryption |
| Integration complexity | Medium | Phased rollout |

---

## 📁 FILES TO CREATE

```
REZ-Consumer/do/
├── src/hooks/
│   ├── useFlowVoice.ts       [NEW - 200 lines]
│   ├── useGenieMemory.ts    [NEW - 250 lines]
│   ├── useHybridAI.ts       [NEW - 150 lines]
│   └── index.ts             [NEW - export all]
│
├── do-backend/src/services/
│   ├── hojaiFlowClient.ts   [NEW - 150 lines]
│   ├── genieMemoryClient.ts  [NEW - 150 lines]
│   └── intentFusion.ts       [NEW - 100 lines]
│
├── docs/
│   ├── HOJAI-INTEGRATION.md [NEW - Full guide]
│   ├── HOJAI-SDK-EXAMPLES.md [NEW - Code examples]
│   └── ARCHITECTURE.md       [NEW - System design]
│
└── [UPDATED]
    ├── src/hooks/useVoiceInput.ts  [Replace mock]
    ├── src/hooks/useReZMind.ts    [Add Genie]
    └── src/screens/ChatScreen.tsx  [Use hooks]
```

---

## 🚀 DEPLOYMENT

### Phase A: MVP (Week 1-2)
- Flow SDK integrated (voice works)
- Genie SDK integrated (memory works)
- Basic "usual" detection

### Phase B: Full AI (Week 3-4)
- Hybrid AI (Flow + Genie + REZ Mind)
- Full "remember" experience
- Production deploy

---

## 📞 SUPPORT

- Technical: See `docs/HOJAI-INTEGRATION.md`
- SDK: See `packages/*/README.md`
- DO App: See `AGENTIC-SYSTEM.md`

---

**Status:** Plan Complete ✅  
**Next:** Start implementing hooks

---

## ✅ CHECKLIST

- [x] Integration Plan created
- [x] Flow SDK built
- [x] Genie SDK built
- [ ] useFlowVoice hook
- [ ] useGenieMemory hook
- [ ] useHybridAI hook
- [ ] Backend services
- [ ] ChatScreen update
- [ ] ProfileScreen update
- [ ] Documentation
- [ ] Deploy

---

**Last Updated:** June 7, 2026  
**Ready to Execute:** YES