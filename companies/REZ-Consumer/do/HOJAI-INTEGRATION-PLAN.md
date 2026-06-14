# 🎯 HOJAI AI Integration Plan for DO App

**Version:** 1.0 | **Date:** June 7, 2026  
**Purpose:** Integrate HOJAI Flow (Voice) + Genie (Memory) into DO App

---

## 📋 EXECUTIVE SUMMARY

### Current State
```
DO App (REZ-Consumer)
├── Voice: expo-av (MOCK - not working)
├── Memory: None (no persistence)
├── Intent: unifiedIntentDetector (basic patterns)
└── AI: REZ Mind (external)
```

### Target State
```
DO App (REZ-Consumer)
├── Voice: HOJAI Flow (Real STT/TTS) ✅
├── Memory: Genie (Personal preferences) ✅
├── Intent: Flow Intent Detection (advanced) ✅
└── AI: REZ Mind + HOJAI Brain ✅
```

---

## 🎯 INTEGRATION GOALS

### Goal 1: Replace Mock Voice with HOJAI Flow
```
Current: expo-av mock (fake STT/TTS)
Target: Real voice with Whisper STT + 11 voice layers

User: "Book my usual"
     │
     ▼
Flow captures voice → Whisper STT → Intent detected → Task executed
     │
     ▼
Flow speaks response → TTS (voice layer) → User hears confirmation
```

### Goal 2: Add Genie Memory to DO App
```
Current: No memory (preferences lost each session)
Target: Persistent memory (remembers everything)

User: "Book my usual coffee"
     │
     ▼
Genie recalls: "Usual = Starbucks Grande Cold Coffee ₹250"
     │
     ▼
DO shows: "Your usual: Starbucks, Grande Cold Coffee, ₹250"
     │
     ▼
User confirms → Order placed
     │
     ▼
Genie remembers: "User ordered Starbucks today"
```

### Goal 3: Enhanced Intent Detection
```
Current: Pattern matching (100 patterns)
Target: ML-based intent + Genie context + Flow understanding

User: "Same as last time"
     │
     ▼
Flow understands context + Genie recalls + REZ Mind predicts
     │
     ▼
"Do you mean La Pinoz, Italian, Friday, 7 PM for 2?"
```

---

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DO APP (REZ-Consumer)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                        FRONTEND                              │   │
│   │                                                               │   │
│   │   Chat ──► Voice ──► Explore ──► Wallet ──► Profile         │   │
│   │                                                               │   │
│   │   ┌─────────────────────────────────────────────────────┐   │   │
│   │   │                  HOOKS                                │   │   │
│   │   │                                                     │   │   │
│   │   │   useAuth ──► useReZMind ──► useFlowVoice ──► useGenie│   │   │
│   │   │                                                     │   │   │
│   │   │   useFlowVoice:  Real STT/TTS via HOJAI Flow        │   │   │
│   │   │   useGenieMemory: Remember/Recall via Genie          │   │   │
│   │   │                                                     │   │   │
│   │   └─────────────────────────────────────────────────────┘   │   │
│   │                                                               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌─────────────────┐    ┌─────────────┐
│   RABTUL     │    │   HOJAI AI     │    │REZ-Intelligence
│ (Payments)   │    │ (Infrastructure)│    │ (Mind/Intent)
│              │    │                 │    │
│ • Auth      │    │ • Flow Voice   │    │ • Intent
│ • Wallet    │    │   SDK (NEW!)   │    │ • Prediction
│ • Payments  │    │ • Genie SDK   │    │ • Behavioral
└───────────────┘    │   (NEW!)      │    └─────────────┘
                    │ • Memory API  │           │
                    │   (Port 4703) │           │
                    │ • Voice STT   │           │
                    │   (Whisper)    │           │
                    │ • Voice TTS   │           │
                    │   (11 layers) │           │
                    └───────┬───────┘           │
                            │                   │
                            └────────┬──────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────┐
                    │         DO APP BACKEND       │
                    │        (Express.js)         │
                    │                             │
                    │  • WorkflowEngine          │
                    │  • SalesAgent              │
                    │  • UnifiedIntentDetector   │
                    │  • ComplaintHandler        │
                    │                             │
                    │  ┌─────────────────────┐  │
                    │  │  NEW: Integration   │  │
                    │  │  Service Layer      │  │
                    │  │                     │  │
                    │  │  • flowClient      │  │
                    │  │  • genieClient      │  │
                    │  │  • intentFusion     │  │
                    │  └─────────────────────┘  │
                    └─────────────────────────────┘
```

---

## 📦 PHASE 1: Create HOJAI SDK Packages

### SDK 1: @hojai/flow-sdk
```
hojai-ai/packages/flow-sdk/
├── package.json
├── src/
│   ├── index.ts           # Main export
│   ├── VoiceService.ts    # Voice capture, STT, TTS
│   ├── IntentDetector.ts  # Intent detection
│   ├── MemoryService.ts   # Memory tiers (L1-L5)
│   ├── PersonaService.ts  # Persona management
│   └── types.ts           # TypeScript types
├── README.md
└── LICENSE
```

### SDK 2: @hojai/genie-sdk
```
hojai-ai/packages/genie-sdk/
├── package.json
├── src/
│   ├── index.ts             # Main export
│   ├── MemoryClient.ts      # Remember/Recall
│   ├── RelationshipClient.ts # Contacts
│   ├── BriefingClient.ts    # Daily briefings
│   ├── PreferenceClient.ts  # User preferences
│   └── types.ts            # TypeScript types
├── README.md
└── LICENSE
```

---

## 📦 PHASE 2: Create DO App Integration Hooks

### New Hooks to Create
```
do-app/src/hooks/
├── useFlowVoice.ts      # Voice (STT/TTS) via HOJAI Flow
├── useGenieMemory.ts    # Memory (Remember/Recall)
├── useFlowIntent.ts     # Intent detection
├── useGeniePreferences.ts # User preferences
└── useHybridIntelligence.ts # Combined AI
```

---

## 📦 PHASE 3: Update DO App Backend

### New Integration Services
```
do-app/do-backend/src/services/
├── hojaiFlowClient.ts    # Connect to Flow services
├── genieMemoryClient.ts  # Connect to Genie services
├── intentFusion.ts      # Combine Flow + REZ Mind intent
└── memorySync.ts        # Sync preferences
```

---

## 🔄 DETAILED INTEGRATION FLOW

### Voice Integration Flow
```
USER PRESSES MIC
      │
      ▼
useFlowVoice.startListening()
      │
      ▼
Flow Voice Service (via SDK)
      │
      ▼
Audio → Whisper (STT) → "Book a table for 2 tonight"
      │
      ▼
Flow Intent Detection → BOOK_TABLE
      │
      ▼
Genie Memory Check → "User prefers Italian restaurants"
      │
      ▼
REZ Mind Prediction → "High intent, show Italian venues"
      │
      ▼
WorkflowEngine.handleBooking()
      │
      ▼
Response → Flow TTS → "Found 3 Italian restaurants!"
```

---

## 📋 TASK BREAKDOWN

### Week 1: SDK Creation

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Create flow-sdk package | `packages/flow-sdk/package.json` |
| 2 | Implement VoiceService | STT/TTS client |
| 3 | Implement IntentDetector | Pattern + ML |
| 4 | Create genie-sdk package | `packages/genie-sdk/package.json` |
| 5 | Implement MemoryClient | Remember/Recall |
| 6 | Test SDKs locally | Unit tests |
| 7 | Document SDKs | README files |

### Week 2: DO App Frontend

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Install @hojai/flow-sdk | npm package |
| 2 | Install @hojai/genie-sdk | npm package |
| 3 | Create useFlowVoice hook | Real voice |
| 4 | Create useGenieMemory hook | Persistence |
| 5 | Update ChatScreen | Use new hooks |
| 6 | Update ProfileScreen | Preferences section |
| 7 | Test voice integration | Manual test |

### Week 3: DO App Backend

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Create hojaiFlowClient | Service client |
| 2 | Create genieMemoryClient | Service client |
| 3 | Update chat routes | Use new clients |
| 4 | Update workflow engine | Use Genie memory |
| 5 | Add intent fusion | Flow + REZ Mind |
| 6 | Add memory sync | Sync preferences |
| 7 | Integration testing | E2E test |

### Week 4: Documentation & Polish

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Document integration | INTEGRATION-GUIDE.md |
| 2 | Document hooks | Hooks documentation |
| 3 | Document architecture | Architecture diagram |
| 4 | Update CLAUDE.md | DO App docs |
| 5 | Create examples | Usage examples |
| 6 | Performance testing | Load test |
| 7 | Final review | Ready for deploy |

---

## 📁 FILES TO CREATE

### SDK Packages
```
hojai-ai/packages/
├── flow-sdk/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── VoiceService.ts
│   │   ├── IntentDetector.ts
│   │   ├── MemoryService.ts
│   │   ├── PersonaService.ts
│   │   └── types.ts
│   ├── README.md
│   └── LICENSE
│
└── genie-sdk/
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   ├── index.ts
    │   ├── MemoryClient.ts
    │   ├── RelationshipClient.ts
    │   ├── BriefingClient.ts
    │   ├── PreferenceClient.ts
    │   └── types.ts
    ├── README.md
    └── LICENSE
```

### DO App Updates
```
REZ-Consumer/do/
├── src/hooks/
│   ├── useFlowVoice.ts      [NEW]
│   ├── useGenieMemory.ts    [NEW]
│   ├── useFlowIntent.ts     [NEW]
│   ├── useGeniePreferences.ts [NEW]
│   └── useHybridIntelligence.ts [NEW]
│
├── do-backend/src/services/
│   ├── hojaiFlowClient.ts   [NEW]
│   ├── genieMemoryClient.ts [NEW]
│   ├── intentFusion.ts      [NEW]
│   └── memorySync.ts        [NEW]
│
├── docs/
│   ├── HOJAI-INTEGRATION.md [NEW]
│   ├── VOICE-GUIDE.md      [NEW]
│   └── MEMORY-GUIDE.md     [NEW]
│
└── [EXISTING UPDATES]
    ├── src/hooks/useVoiceInput.ts [UPDATE - use Flow]
    └── src/screens/ChatScreen.tsx [UPDATE - use Genie]
```

---

## 🧪 TESTING PLAN

### Unit Tests
- VoiceService: STT accuracy
- MemoryClient: Remember/Recall
- IntentDetector: Pattern matching

### Integration Tests
- Flow voice → DO App chat
- Genie memory → DO App preferences
- End-to-end: Voice command → Task execution

### Performance Tests
- Voice latency < 2 seconds
- Memory recall < 500ms
- Concurrent users: 1000

---

## 📊 SUCCESS METRICS

| Metric | Target | Current |
|--------|--------|---------|
| Voice accuracy | >95% | N/A (mock) |
| Memory recall | >90% | 0% (none) |
| Intent confidence | >85% | ~70% |
| User engagement | +20% | baseline |
| Session length | +30% | baseline |

---

## 🔴 RISKS & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|------------|
| API latency | High | Caching, offline mode |
| Service downtime | Medium | Fallback to mock |
| Data privacy | High | Consent, encryption |
| Integration complexity | Medium | Phased rollout |

---

## 🚀 DEPLOYMENT PHASES

### Phase A: MVP (Week 1-2)
- Flow SDK integrated
- Basic voice working
- No memory yet

### Phase B: Memory (Week 3)
- Genie SDK integrated
- Preferences saved
- Context recall

### Phase C: Full AI (Week 4)
- Intent fusion
- Personalized responses
- Full agentic system

---

## 📞 SUPPORT

For questions:
- Technical: See `docs/HOJAI-INTEGRATION.md`
- SDK: See `packages/*/README.md`
- DO App: See `AGENTIC-SYSTEM.md`

---

**Next Step:** Start implementing SDK packages