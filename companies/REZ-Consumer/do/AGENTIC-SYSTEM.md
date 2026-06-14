# 🤖 DO APP - AGENTIC AI SYSTEM

**Version:** 1.0 | **Date:** June 7, 2026  
**Purpose:** Explain how DO App's AI agents handle user commands and execute tasks

---

## 📋 WHAT YOU ASKED

> *"We had one product which works as AI agents which do all task which merchant ask to do right - which one it is?"*
>
> *"In DO App how agentic is functioning, if user command to do any task how is it happening?"*

---

## 🎯 ANSWER: The AI Agent System in DO App

DO App has a **multi-layer agentic system** that handles user commands:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER COMMAND                                  │
│  "Book a table for 2 at Italian restaurant tonight"                  │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 1: INTENT DETECTION                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  UnifiedIntentDetector                                       │   │
│  │  • Pattern matching (100+ patterns)                         │   │
│  │  • Hinglish support                                        │   │
│  │  • Entity extraction (time, place, party size)            │   │
│  │  • Sentiment analysis                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  Detected: BOOK_TABLE                                             │
│  Entities: { type: "Italian", partySize: 2, time: "tonight" }    │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 2: WORKFLOW ENGINE                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  WorkflowEngine                                             │   │
│  │  Routes intent to appropriate handler:                     │   │
│  │                                                             │   │
│  │  • GREETING → handleGreeting()                            │   │
│  │  • BOOK/RESERVE → handleBooking()                         │   │
│  │  • SEARCH/DISCOVER → handleDiscovery()                    │   │
│  │  • WALLET/KARMA → handleWalletCheck()                    │   │
│  │  • COMPLAINT → handleComplaint()                         │   │
│  │  • PAY → handlePayment()                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 3: SPECIALIZED AGENTS                     │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │   SalesAgent    │  │ ComplaintHandler │  │ WorkflowEngine   │   │
│  │                  │  │                  │  │                  │   │
│  │ • Personality   │  │ • Complaints    │  │ • Multi-step    │   │
│  │   detection     │  │ • Refunds       │  │   workflows     │   │
│  │ • Upselling    │  │ • Tickets       │  │ • Routing       │   │
│  │ • Cross-sell   │  │ • Escalation   │  │ • Execution     │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐                         │
│  │ AgentOrchestrator│  │  REZ Mind API   │                         │
│  │                  │  │                  │                         │
│  │ • Dormancy      │  │ • Intent Graph  │                         │
│  │   detection      │  │ • Prediction    │                         │
│  │ • Trend alerts  │  │ • Behavioral    │                         │
│  │ • Churn risk    │  │   profiling    │                         │
│  └──────────────────┘  └──────────────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 4: EXTERNAL SERVICES                       │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   RABTUL   │  │REZ-Merchant│  │REZ-Intelligence
│  │             │  │             │  │                 │
│  │ • Wallet   │  │ • Venues   │  │ • Intent    │                 │
│  │ • Payments │  │ • Bookings │  │ • Prediction│                 │
│  │ • Karma    │  │ • Reviews  │  │             │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 HOW IT WORKS: User Command → Task Execution

### Example 1: "Book a table for 2 tonight"

```
USER INPUT: "Book a table for 2 at Italian restaurant tonight"
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Intent Detection (unifiedIntentDetector)              │
│                                                                  │
│ Pattern Match:                                                   │
│ • "book" + "table" = UnifiedIntent.BOOK_TABLE                  │
│ • Confidence: 0.92                                              │
│                                                                  │
│ Entity Extraction:                                              │
│ • cuisine: "Italian"                                           │
│ • partySize: 2                                                 │
│ • time: "tonight" → 7:00 PM (default dinner)                │
│ • sentiment: neutral                                            │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Workflow Routing (workflowEngine)                      │
│                                                                  │
│ Route: UnifiedIntent.BOOK_TABLE → handleBooking()               │
│                                                                  │
│ switch (parsedIntent.intent) {                                  │
│   case DoIntent.BOOK:                                           │
│   case DoIntent.RESERVE:                                        │
│     return this.handleBooking(parsedIntent, context);          │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Sales Agent (salesAgent)                              │
│                                                                  │
│ AnalyzeUser(userId):                                            │
│ • Personality: "foodie"                                        │
│ • Preferred price: "₹1000-2000"                               │
│ • Last booking: "Chinese, 2 weeks ago"                        │
│                                                                  │
│ GenerateOpportunities():                                        │
│ • "Upsell to premium Italian"                                   │
│ • "Add wine pairing"                                           │
│ • "Suggest romantic ambiance"                                   │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Discovery (mockDiscovery)                               │
│                                                                  │
│ Search: Italian restaurants                                      │
│ Filters: partySize=2, priceRange=mid, rating>4.0            │
│ Results: [                                                        │
│   { name: "La Pinoz", rating: 4.5, price: "₹1200" },        │
│   { name: "Prego", rating: 4.3, price: "₹1500" },           │
│   { name: "Italiano", rating: 4.1, price: "₹900" }          │
│ ]                                                               │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Response (responseGenerator)                           │
│                                                                  │
│ Messages:                                                        │
│ • "I found 3 Italian restaurants for you!"                     │
│ • [VenueCard: La Pinoz]                                        │
│ • [VenueCard: Prego]                                           │
│ • [VenueCard: Italiano]                                        │
│                                                                  │
│ Suggestions:                                                     │
│ • "Book La Pinoz"                                              │
│ • "Show menu"                                                  │
│ • "Get directions"                                             │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: User Selection                                          │
│                                                                  │
│ USER: "Book La Pinoz"                                          │
│          │
│          ▼
│ Confirmation + Payment via RABTUL                              │
│ Karma earned + Coins credited                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

### Example 2: "I want refund for my last order"

```
USER INPUT: "I want refund for my last order"
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Intent Detection                                        │
│                                                                  │
│ Pattern Match:                                                   │
│ • "refund" = UnifiedIntent.REFUND_REQUEST                     │
│ • "last order" = getMostRecentOrder()                          │
│                                                                  │
│ Confidence: 0.88                                                │
│ Sentiment: negative (user is upset)                            │
│ ShouldEscalate: true (negative sentiment)                       │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Complaint Handler (complaintRefundHandler)              │
│                                                                  │
│ registerComplaint({                                             │
│   userId: "user_123",                                          │
│   type: "other",                                                │
│   description: "User wants refund for last order"             │
│ })                                                               │
│                                                                  │
│ Creates: Complaint { id: "comp_abc123" }                       │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Refund Processing                                       │
│                                                                  │
│ GetOrderHistory → Find "last order"                            │
│ Order: { id: "order_456", amount: 450, status: "delivered" } │
│                                                                  │
│ CheckRefundEligibility:                                          │
│ • Within 7 days: YES                                           │
│ • Status: delivered: YES                                        │
│ • Refund eligible: YES                                         │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Response                                                │
│                                                                  │
│ Text: "I found your last order from [Restaurant Name].        │
│        Would you like to request a refund of ₹450?"            │
│                                                                  │
│ Suggestions:                                                     │
│ • "Yes, submit refund" → Creates RefundRequest               │
│ • "Talk to manager" → Escalates to human                     │
│ • "Keep order" → Closes ticket                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ ARCHITECTURE: Key Components

### 1. UnifiedIntentDetector

```typescript
// Located: do-backend/src/services/unifiedIntentDetector.ts

interface IntentResult {
  intent: UnifiedIntent;        // BOOK_TABLE, SEARCH, REFUND, etc.
  confidence: number;          // 0.0 - 1.0
  entities: ExtractedEntity[]; // cuisine, time, partySize, etc.
  sentiment: 'positive' | 'negative' | 'neutral';
  shouldEscalate: boolean;
  suggestedActions: QuickAction[];
}
```

**Supported Intents:**
```typescript
enum UnifiedIntent {
  GREETING = 'greeting',
  HELP_REQUEST = 'help_request',
  
  // Discovery
  SEARCH = 'search',
  BROWSE = 'browse',
  MOOD_DISCOVERY = 'mood_discovery',
  
  // Booking
  BOOK_TABLE = 'book_table',
  ORDER_FOOD = 'order_food',
  RESERVE = 'reserve',
  
  // Transactions
  CHECK_BALANCE = 'check_balance',
  CHECK_KARMA = 'check_karma',
  PAY = 'pay',
  
  // Support
  COMPLAINT = 'complaint',
  REFUND_REQUEST = 'refund_request',
  CANCEL_ORDER = 'cancel_order',
  CANCEL_BOOKING = 'cancel_booking',
  CHECK_STATUS = 'check_status',
  TRACK_ORDER = 'track_order',
  
  // Other
  DIRECTIONS = 'directions',
  REVIEW = 'review',
  OFFER = 'offer',
}
```

**Pattern Matching (100+ patterns):**
```typescript
// Examples
"book table" → BOOK_TABLE
"reserve" → RESERVE
"want refund" → REFUND_REQUEST
"cancel my order" → CANCEL_ORDER
"where is my food" → TRACK_ORDER
"show my coins" → CHECK_BALANCE
"italian food" → SEARCH (cuisine=Italian)
"romantic dinner" → MOOD_DISCOVERY (mood=romantic)
```

---

### 2. WorkflowEngine

```typescript
// Located: do-backend/src/services/workflowEngine.ts

class WorkflowEngine {
  async execute(input: string, context: Context): Promise<WorkflowResult> {
    // 1. Parse intent
    const parsedIntent = intentParser.parse(input);
    
    // 2. Route to handler
    switch (parsedIntent.intent) {
      case DoIntent.GREETING:
        return this.handleGreeting(parsedIntent, context);
      
      case DoIntent.BOOK:
      case DoIntent.RESERVE:
        return this.handleBooking(parsedIntent, context);
      
      case DoIntent.SEARCH:
      case DoIntent.MOOD_DISCOVERY:
        return this.handleDiscovery(parsedIntent, context);
      
      case DoIntent.CHECK_BALANCE:
      case DoIntent.CHECK_KARMA:
        return this.handleWalletCheck(parsedIntent, context);
      
      case DoIntent.REFUND_REQUEST:
      case DoIntent.COMPLAINT:
        return this.handleComplaint(parsedIntent, context);
      
      // ... more handlers
    }
  }
}
```

---

### 3. SalesAgent

```typescript
// Located: do-backend/src/services/salesAgent.ts

class SalesAgent {
  analyzeUser(userId: string): SalesOpportunity[] {
    // 1. Detect customer personality
    const personality = this.detectPersonality(profile, transactions);
    
    // 2. Generate time-based opportunities
    // 3. Generate category-specific opportunities
    // 4. Generate personality-based opportunities
    
    return opportunities;
  }
  
  private detectPersonality(profile, transactions) {
    // Foodie: Orders varied cuisines, high frequency
    // Bargain Hunter: Price-sensitive, uses coupons
    // Luxury Lover: Premium venues, high AOV
    // Social Diner: Large parties, weekend bookings
    // ...
  }
}
```

**Sales Triggers:**
```typescript
// Psychological triggers
SALES_TRIGGERS = {
  urgency: ["Only 2 tables left!", "Offer expires tonight"],
  social_proof: ["4.5 rating", "500+ bookings this month"],
  authority: ["Chef's recommendation", "Most popular"],
  reciprocity: ["Free dessert with this booking"],
}
```

---

### 4. AgentOrchestrator (Frontend)

```typescript
// Located: do-app/src/services/agentOrchestrator.ts

// Connects DO App to REZ Agent OS

class AgentOrchestratorService {
  // Task management
  async createTask(task: Partial<AgentTask>)
  async getTaskStatus(taskId: string)
  
  // Dormancy detection
  async checkDormancyAlerts(userId)
  async triggerRevival(alert)
  
  // Predictive analytics
  async getBookingProbability(userId, entityId)
  async getChurnRiskScore(userId)
  async getLTVPrediction(userId)
}
```

---

### 5. REZ Mind Integration

```typescript
// Located: do-app/src/hooks/useReZMind.ts

// Frontend hooks for AI features

export function useIntentTracking() {
  trackChatIntent(message, detectedIntent)
  trackEntityView(entityId, entityType)
  trackBookingCompleted(bookingId, amount)
}

export function useDormancy() {
  // Detect inactive users
  // Trigger revival campaigns
}

export function usePersonalization() {
  // Behavioral profiling
  // Style advisor
  // Mood-based discovery
}
```

---

## 📊 INTENT FLOW DIAGRAM

```
                        USER SPEAKS/TYPES
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React Native)                        │
│                                                                  │
│  useVoiceInput.ts ──────► ChatScreen.tsx                       │
│  │                              │                               │
│  │ Voice → STT                  │ Text input                    │
│  │                              │                               │
│  └──────────────────────────────┴──────────────────────────────┤
│                               │                                  │
│                               ▼                                  │
│  POST /do/chat/message ───────────────────────────────────────►  │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                          │
│                                                                  │
│  api/routes/chat.ts ───────────────────────────────────────────►  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. unifiedIntentDetector.detect(message)                   │ │
│  │    ↓                                                      │ │
│  │ 2. intent = "BOOK_TABLE", confidence = 0.92              │ │
│  │    ↓                                                      │ │
│  │ 3. Route to handler based on intent                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               │                                  │
│                               ▼                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ HANDLERS:                                                  │ │
│  │                                                             │ │
│  │ handleBooking() ──────► Find venues (mockDiscovery)        │ │
│  │                         ↓                                   │ │
│  │                      Apply SalesAgent logic                 │ │
│  │                         ↓                                   │ │
│  │                      Generate response                       │ │
│  │                                                             │ │
│  │ handleWalletCheck() ──► Get karma/coins (mockWallet)       │ │
│  │                                                             │ │
│  │ handleComplaint() ────► Create ticket (complaintHandler)  │ │
│  │                                                             │ │
│  │ handleDiscovery() ────► Search venues (mockDiscovery)       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               │                                  │
│                               ▼                                  │
│  RESPONSE ←─────────────────────────────────────────────────────  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔗 EXTERNAL SERVICE CONNECTIONS

```
DO App Backend
      │
      ├──────────────────────────────┐
      │                              │
      ▼                              ▼
┌──────────────────┐     ┌─────────────────────────┐
│  REZ Mind API   │     │  Agent Orchestrator     │
│                  │     │  (REZ Agent OS)        │
│ • Intent Graph  │     │                         │
│ • Prediction    │     │ • Dormancy alerts       │
│ • Behavioral   │     │ • Trend detection        │
│ • Recommendations│     │ • Churn risk           │
└──────────────────┘     │ • LTV prediction       │
                         └─────────────────────────┘
                                  │
                                  ▼
                         ┌─────────────────────────┐
                         │  HOJAI AI (Future)    │
                         │                        │
                         │ • Flow Voice (STT/TTS)│
                         │ • Genie Memory        │
                         │ • Advanced Intent     │
                         └─────────────────────────┘

┌──────────────────┐     ┌─────────────────────────┐
│    RABTUL       │     │    REZ-Merchant        │
│                  │     │                        │
│ • Wallet        │     │ • Venue catalog        │
│ • Payments      │     │ • Bookings             │
│ • Karma         │     │ • Reviews              │
│ • BNPL          │     │ • Availability         │
└──────────────────┘     └─────────────────────────┘
```

---

## 📱 FRONTEND HOOKS

### useReZMind.ts
```typescript
// AI hooks for DO App

export function useIntentTracking() {
  // Track what user browses, searches, books
  trackChatIntent(message, intent)
  trackEntityView(entityId, type)
  trackBookingCompleted(booking)
}

export function useDormancy() {
  // Detect inactive users
  checkDormancyAlerts(userId)
  // Send revival offers
  triggerRevival(alert)
}

export function usePersonalization() {
  // Style advisor
  // Mood-based discovery
  getPersonalizationInsights(userId)
}
```

### useVoiceInput.ts
```typescript
// Voice hooks

export const useVoiceInput = () => {
  startListening()     // Start mic
  stopListening()      // Stop mic
  speak(text)          // TTS output
  transcript           // Recognized text
}
```

---

## 🎯 KEY AI AGENTS IN DO APP

| Agent | Purpose | Features |
|-------|---------|----------|
| **UnifiedIntentDetector** | Understand user intent | 100+ patterns, Hinglish support |
| **WorkflowEngine** | Route and execute tasks | Multi-step workflows |
| **SalesAgent** | Upsell and cross-sell | Personality detection, triggers |
| **ComplaintRefundHandler** | Handle issues | Tickets, refunds, escalation |
| **AgentOrchestrator** | Connect to REZ Agent OS | Dormancy, churn, LTV |
| **REZ Mind** | Intent and prediction | Behavioral, recommendations |

---

## 🔮 FUTURE: Integration with HOJAI AI

### Phase 1: Add Flow Voice
```typescript
// Replace expo-av mock with Flow real STT/TTS
import { VoiceFlow } from '@hojai/flow-sdk';

const flow = new VoiceFlow({ apiKey: '...' });
flow.onIntent((intent) => {
  // Use Flow's advanced intent detection
});
```

### Phase 2: Add Genie Memory
```typescript
// Remember user preferences
import { GenieMemory } from '@hojai/genie-sdk';

await genie.remember({
  type: 'preference',
  content: 'User prefers Italian restaurants'
});
```

### Phase 3: Full Agentic
```
User: "Book my usual"
     │
     ▼
Intent: "BOOK_RESTAURANT" (via Flow)
     │
     ▼
Memory: "Usual = Italian, Friday, 7 PM, La Pinoz" (via Genie)
     │
     ▼
Execute: Book La Pinoz for Friday 7 PM
     │
     ▼
Payment: Deduct karma coins (via RABTUL)
     │
     ▼
Confirm: "Booked! See you Friday!"
```

---

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `do/src/services/agentOrchestrator.ts` | Frontend → REZ Agent OS |
| `do/do-backend/src/services/workflowEngine.ts` | Task routing & execution |
| `do/do-backend/src/services/salesAgent.ts` | Sales intelligence |
| `do/do-backend/src/services/unifiedIntentDetector.ts` | Intent understanding |
| `do/do-backend/src/services/complaintRefundHandler.ts` | Support handling |
| `do/do-backend/src/api/routes/chat.ts` | Chat API endpoint |
| `do/src/hooks/useReZMind.ts` | REZ Mind integration |

---

**Last Updated:** June 7, 2026
