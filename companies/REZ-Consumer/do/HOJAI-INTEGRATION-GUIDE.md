# 🎯 HOJAI-DO Integration Guide

**Version:** 1.0 | **Date:** June 7, 2026  
**Purpose:** Complete guide to HOJAI AI integration with DO App

---

## 📋 OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                           DO APP                                     │
│                   "AI Commerce Super App"                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   User: "Order my usual coffee"                                      │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  🎤 FLOW (Voice)                                           │   │
│   │  • STT: "Order my usual coffee"                        │   │
│   │  • TTS: "Ordered! ₹250, earn 12 karma"                │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  🧠 GENIE (Memory)                                        │   │
│   │  • "Usual = Starbucks Cold Coffee Grande ₹250"           │   │
│   │  • "Orders every Tuesday"                               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  🛒 DO (Commerce)                                         │   │
│   │  • Place order                                           │   │
│   │  • Process payment (RABTUL)                               │   │
│   │  • Add karma coins                                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ ARCHITECTURE

### Product Relationships

| Product | Company | Role | What It Does |
|---------|---------|------|--------------|
| **DO App** | REZ-Consumer | **Action Layer** | Commerce: Book, Order, Pay, Karma |
| **Genie** | HOJAI-AI | **Intelligence Layer** | Memory: Remember preferences, recall "usual" |
| **Flow** | HOJAI-AI | **Voice Layer** | Voice: STT, TTS, intent detection |

---

## 📦 WHAT WAS BUILT

### SDK Packages
```
hojai-ai/packages/
├── flow-sdk/           # @hojai/flow-sdk
│   ├── src/
│   │   ├── index.ts          # Main export
│   │   ├── types.ts          # TypeScript types
│   │   ├── VoiceService.ts   # STT/TTS
│   │   └── IntentDetector.ts # Intent detection
│   └── README.md
│
└── genie-sdk/         # @hojai/genie-sdk
    ├── src/
    │   ├── index.ts          # Main export
    │   ├── types.ts          # TypeScript types
    │   └── MemoryClient.ts   # Remember/Recall
    └── README.md
```

### DO App Hooks
```
REZ-Consumer/do/src/hooks/
├── useFlowVoice.ts       # Real voice (STT/TTS)
├── useGenieMemory.ts     # Personal memory
├── useHybridAI.ts        # Combined Flow + Genie + REZ Mind
├── useAI.ts             # Convenience hook
└── index.ts             # Exports
```

### DO App Backend Services
```
REZ-Consumer/do/do-backend/src/services/
├── hojaiFlowClient.ts     # Flow API client
└── genieMemoryClient.ts   # Genie API client
```

---

## 🚀 QUICK START

### 1. Install Dependencies

```bash
# In DO App
cd REZ-Consumer/do
npm install @hojai/flow-sdk @hojai/genie-sdk
```

### 2. Configure Environment

```bash
# .env
HOJAI_FLOW_API_KEY=your-flow-api-key
HOJAI_FLOW_URL=https://api.hojai.ai
HOJAI_GENIE_API_KEY=your-genie-api-key
HOJAI_GENIE_URL=https://api.hojai.ai
```

### 3. Use in Components

```typescript
// Any component
import { useAI } from '@/hooks';

function MyComponent() {
  const { flow, genie, hybrid } = useAI();

  // Voice
  await flow.speak('Hello!');

  // Memory
  await genie.rememberCuisine('Italian');

  // Hybrid
  const response = await hybrid.handleTextCommand("Book my usual");
}
```

---

## 📱 USE CASES

### Use Case 1: Voice Command

```typescript
// User presses mic and says "Book my usual"
const { flow } = useAI();

await flow.startListening();
const transcript = await flow.stopListening();
await flow.speak("Got it! Your usual is Starbucks Cold Coffee.");
```

### Use Case 2: Remember Preference

```typescript
// After booking
const { genie } = useAI();

await genie.rememberBooking({
  merchantName: 'La Pinoz',
  cuisine: 'Italian',
  amount: 1200,
  partySize: 2,
});
```

### Use Case 3: Recall "Usual"

```typescript
// User says "Order my usual"
const { genie } = useAI();

const usual = await genie.getUsual();
if (usual) {
  // "Your usual is La Pinoz, Italian, ₹1200"
  // Book it!
}
```

### Use Case 4: Full Hybrid Command

```typescript
// Text command with AI
const { hybrid } = useAI();

const response = await hybrid.handleTextCommand("Book my usual");
// Automatically:
// 1. Detects intent (usual/order)
// 2. Recalls from Genie
// 3. Generates response
// 4. Speaks response
```

### Use Case 5: Learn from Booking

```typescript
// After successful booking
const { hybrid } = useAI();

await hybrid.handleBookingComplete({
  merchantName: 'La Pinoz',
  cuisine: 'Italian',
  amount: 1200,
  time: '7 PM',
  partySize: 2,
});
// Genie remembers all this for next time
```

---

## 🎤 VOICE (Flow SDK)

### Features
- **STT**: Speech to text (Whisper)
- **TTS**: Text to speech (11 voice layers)
- **Intent**: Auto intent detection

### Usage
```typescript
const { flow } = useAI();

// Speech to text
const { text } = await flow.speechToText(audioUri);

// Text to speech
await flow.speak('Your order has been placed!');

// Voice recording
await flow.startListening();
const transcript = await flow.stopListening();
```

### Voice Layers
| Layer | Type |
|-------|------|
| shimmer | Female (default) |
| alloy | Neutral |
| echo | Male |
| fable | British |
| onyx | Deep male |
| nova | Energetic |

---

## 🧠 MEMORY (Genie SDK)

### Features
- **Remember**: Store preferences, transactions, bookings
- **Recall**: Get "usual", preferences, history
- **Learn**: Automatically learn from interactions

### Usage
```typescript
const { genie } = useAI();

// Remember
await genie.rememberCuisine('Italian');
await genie.rememberFavoriteRestaurant('La Pinoz', {
  cuisine: 'Italian',
  averageBill: 1200,
});
await genie.rememberTransaction({
  merchantName: 'La Pinoz',
  amount: 1200,
  category: 'restaurant',
});

// Recall
const usual = await genie.getUsual();
const pattern = await genie.getBookingPattern();
const preferences = await genie.getFoodPreferences();

// Learn
await genie.learnFromBooking(booking);
await genie.learnFromTransaction(transaction);
```

### Memory Types
| Type | Example |
|------|---------|
| preference | "Likes Italian food" |
| transaction | "Spent ₹1200 at La Pinoz" |
| booking | "Booked La Pinoz for 2 at 7 PM" |

---

## 🤖 HYBRID AI (Combined)

### Features
- Combines Flow + Genie + REZ Mind
- Automatic intent detection
- Context-aware responses
- Memory integration

### Usage
```typescript
const { hybrid } = useAI();

// Voice command
await hybrid.handleVoiceCommand(audioUri);

// Text command
const response = await hybrid.handleTextCommand("Book my usual");

// Handle booking
await hybrid.handleBookingComplete(booking);

// Handle transaction
await hybrid.handleTransactionComplete(transaction);

// Refresh context
await hybrid.refreshContext();
```

### Intent Detection
| Pattern | Intent | Example |
|---------|-------|---------|
| "usual", "same", "again" | usual | "Book my usual" |
| "book", "order", "reserve" | book | "Book a table for 2" |
| "find", "show", "search" | search | "Find Italian restaurants" |
| "balance", "karma", "coins" | check_balance | "Show my karma" |

---

## 🔧 CONFIGURATION

### Environment Variables

```bash
# DO App (.env)
EXPO_PUBLIC_HOJAI_FLOW_API_KEY=your-key
EXPO_PUBLIC_HOJAI_FLOW_URL=https://api.hojai.ai
EXPO_PUBLIC_HOJAI_GENIE_API_KEY=your-key
EXPO_PUBLIC_HOJAI_GENIE_URL=https://api.hojai.ai

# DO Backend
HOJAI_FLOW_API_KEY=your-key
HOJAI_FLOW_URL=http://localhost:4580
HOJAI_GENIE_API_KEY=your-key
HOJAI_GENIE_URL=http://localhost:4540
```

### Feature Flags
```typescript
// In useHybridAI options
const hybrid = useHybridAI({
  userId: 'user-123',
  enableVoice: true,       // Flow
  enableMemory: true,     // Genie
  enablePrediction: true,  // REZ Mind
});
```

---

## 📁 FILES CREATED

### SDKs
- `hojai-ai/packages/flow-sdk/` - @hojai/flow-sdk
- `hojai-ai/packages/genie-sdk/` - @hojai/genie-sdk

### DO App Frontend
- `REZ-Consumer/do/src/hooks/useFlowVoice.ts`
- `REZ-Consumer/do/src/hooks/useGenieMemory.ts`
- `REZ-Consumer/do/src/hooks/useHybridAI.ts`
- `REZ-Consumer/do/src/hooks/useAI.ts`
- `REZ-Consumer/do/src/hooks/index.ts`
- `REZ-Consumer/do/src/screens/ChatScreen.tsx` (updated)

### DO App Backend
- `REZ-Consumer/do/do-backend/src/services/hojaiFlowClient.ts`
- `REZ-Consumer/do/do-backend/src/services/genieMemoryClient.ts`

### Documentation
- `REZ-Consumer/do/HOJAI-INTEGRATION-PLAN.md`
- `REZ-Consumer/do/HOJAI-DO-INTEGRATION-PLAN.md`
- `REZ-Consumer/do/HOJAI-INTEGRATION-GUIDE.md` (this file)
- `REZ-Consumer/do/AGENTIC-SYSTEM.md`
- `hojai-ai/DO-FLOW-GENIE-COPILOT-AUDIT.md`
- `hojai-ai/DO-FLOW-GENIE-AUDIT.md`
- `hojai-ai/HOJAI-PRODUCTS.md`

---

## 🧪 TESTING

### Manual Test
```bash
# Start DO App
cd REZ-Consumer/do
npm run start

# Try voice
1. Press mic button
2. Say "Book my usual"
3. Should see Genie recall and book

# Try text
1. Type "Order my usual"
2. Should show "Your usual is..."
```

### API Test
```bash
# Test Flow STT
curl -X POST http://localhost:4033/api/stt \
  -F "audio=@recording.m4a"

# Test Genie recall
curl http://localhost:4540/api/memory/recall?userId=user-123&query=Italian

# Test Flow TTS
curl -X POST http://localhost:4033/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello!","voice":"shimmer"}'
```

---

## 🚨 TROUBLESHOOTING

### Voice not working
1. Check microphone permissions
2. Check HOJAI_FLOW_API_KEY
3. Check network connectivity

### Memory not working
1. Check HOJAI_GENIE_API_KEY
2. Check Genie service is running
3. Check userId is set

### Hybrid not detecting "usual"
1. Ensure bookings have been remembered
2. Check genie.getUsual() returns data
3. Check pattern matching in detectIntent()

---

## 📈 METRICS TO TRACK

| Metric | Target | Current |
|--------|--------|---------|
| Voice accuracy | >95% | TBD |
| Memory recall | >90% | TBD |
| "Usual" detection | >85% | TBD |
| User engagement | +20% | TBD |
| Session length | +30% | TBD |

---

## 🔮 FUTURE ENHANCEMENTS

### Phase 2
- [ ] Voice clone (custom voice)
- [ ] Multi-language support (Hindi, regional)
- [ ] Offline mode
- [ ] Predictive ordering

### Phase 3
- [ ] Multi-device sync (watch, earbuds)
- [ ] Voice commerce (buy with voice)
- [ ] Social features (share orders)
- [ ] AR/VR integration

---

**Last Updated:** June 7, 2026
**Version:** 1.0
**Status:** Integration Complete ✅