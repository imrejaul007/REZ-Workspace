# 🎯 QR SERVICES - COMPLETE INTEGRATION AUDIT

**Date:** June 11, 2026

---

## ✅ QR SERVICES ALREADY HAVE COMMUNICATION & TRANSACTIONS

### What's Already Built

| QR Type | Chat | Order/Book | Voice AI | Support |
|---------|------|------------|---------|---------|
| **safe-qr** | ✅ Session Messages | ❌ | ❌ | ❌ |
| **menu-qr** | ❌ | ✅ Order | ❌ | ❌ |
| **table-qr** | ❌ | ✅ Order | ❌ | ❌ |
| **room-hub** | ❌ | ✅ Room Service | ✅ hojai-staybot | ❌ |
| **rez-now** | ✅ | ✅ Order | ❌ | ❌ |

---

## DETAILED INTEGRATION STATUS

### 1. SAFE QR - Emergency & Security

**Location:** `REZ-Consumer/safe-qr/`, `REZ-Consumer/safe-qr-service/`

**Current Features:**
- QR code generation & scanning (15 emergency modes)
- Session management with owner
- **Chat/Messages** ✅ - `MessageScreen.tsx` + `sessionRoutes.ts`
- Karma system
- Lost mode

**Code Evidence:**
```typescript
// sessions.ts - Chat routes
router.get('/:sessionId/messages', asyncHandler(...))
router.post('/:sessionId/messages', asyncHandler(...))

// MessageScreen.tsx
const response = await api.getSessionMessages(sessionId);
const response = await api.sendSessionMessage(sessionId, {...});
```

**Communication Built:**
| Feature | File | Status |
|---------|------|--------|
| Session Chat | `sessions.ts` | ✅ |
| Message Send | `sessions.ts` | ✅ |
| Message List | `MessageScreen.tsx` | ✅ |
| Relay Service | `shared/services/relay` | ✅ |

**What it needs:**
- Voice emergency calls (Genie Voice)
- Support ticket integration
- Training data collection

---

### 2. MENU QR - Restaurant Ordering

**Location:** `REZ-Consumer/REZ-menu-qr/`

**Current Features:**
- QR code generation for tables
- Digital menu display
- **Order Placement** ✅
- Table management
- **Table Booking** ✅ - `REZScheduleService.ts`

**Code Evidence:**
```typescript
// REZScheduleService.ts - Booking
export async function bookTableViaMenu(params: {
  restaurantSlug: string;
  bookingType: keyof typeof MENU_BOOKING_TYPES;
  date: string;
  time: string;
  partySize: number;
  guestName: string;
  // ...
}): Promise<{ success: boolean; bookingUid?: string; ... }>

// MENU_BOOKING_TYPES
const MENU_BOOKING_TYPES = {
  'table-reservation': { duration: 90, name: 'Table Reservation' },
  'chef-table': { duration: 120, name: "Chef's Table" },
  'private-dining': { duration: 180, name: 'Private Dining' },
  'special-event': { duration: 60, name: 'Special Event' }
};
```

**Built:**
| Feature | File | Status |
|---------|------|--------|
| Menu Display | `index.ts` | ✅ |
| Order Placement | `index.ts` | ✅ |
| Table Booking | `REZScheduleService.ts` | ✅ |
| Schedule API | `REZ_SCHEDULE_CONFIG` | ✅ |

**What it needs:**
- Voice ordering (connect to Voice QR 4096)
- Chat with restaurant
- Support ticket
- Training data collection

---

### 3. TABLE QR - Restaurant Table Management

**Location:** `RABTUL-Technologies/REZ-table-qr-service/`

**Current Features:**
- QR code generation for tables
- Table management
- **Order Management** ✅
- Bill splitting

**Code Evidence:**
```typescript
// tableQRService.ts
async generateTableQR(data: CreateTableQR): Promise<TableQR> {
  const menuUrl = `${MENU_BASE_URL}/${restaurantSlug}?table=${tableNumber}`;
  const qrPayload = JSON.stringify({
    v: 1, id: qrId, r: restaurantId, s: restaurantSlug, t: tableNumber,
  });
  const qrCodeDataUrl = await QRCode.toDataURL(qrPayload);
}

// routes.ts
router.post('/tables/:restaurantId/generate')
router.post('/tables/:restaurantId/generate-batch')
```

**Built:**
| Feature | File | Status |
|---------|------|--------|
| QR Generation | `tableQRService.ts` | ✅ |
| Batch Generation | `routes.ts` | ✅ |
| Order Links | `menuUrl` | ✅ |
| Menu Base URL | `MENU_BASE_URL` | ✅ |

**What it needs:**
- **VOICE ORDERING** - Connect to `REZ-voice-qr-service` (Port 4096)
- Chat with restaurant
- Support ticket
- Training data collection

---

### 4. ROOM HUB - Hotel Room Service

**Location:** `StayOwn-Hospitality/hojai-staybot/`

**Current Features:**
- **Voice AI** ✅ - `hojai-staybot` (Port 4840)
- Room service ordering
- Housekeeping requests
- Checkout
- **Concierge Chat** ✅

**Code Evidence:**
```typescript
// hojai-staybot/src/index.ts
const INTENT_PATTERNS: Record<string, string[]> = {
  'room_service': ['room service', 'food', 'dinner', 'lunch', 'breakfast', 'order'],
  'housekeeping': ['housekeeping', 'clean', 'towels', 'extra', 'pillow', 'bed'],
  'checkout': ['checkout', 'check out', 'leaving', 'bill'],
  'restaurant': ['restaurant', 'dining', 'table', 'book'],
  'spa': ['spa', 'massage', 'relax', 'wellness'],
  'emergency': ['emergency', 'help', 'police', 'ambulance']
};

// Chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const response = generateResponse(intent, query, language);
  res.json({ success: true, intent, response });
});
```

**Built:**
| Feature | File | Status |
|---------|------|--------|
| Voice AI | `hojai-staybot` (4840) | ✅ |
| Room Service Intent | `INTENT_PATTERNS` | ✅ |
| Restaurant Booking Intent | `INTENT_PATTERNS` | ✅ |
| Emergency Intent | `INTENT_PATTERNS` | ✅ |
| Chat Endpoint | `/api/chat` | ✅ |
| Hotel Genie | `hojai-genie` (Port 4841) | ✅ |

**What it needs:**
- Connect to Genie Voice (4760) for better AI
- Connect to REZ-voice-qr-service (4096) for unified voice
- Support ticket integration
- Training data collection

---

### 5. REZ NOW - Digital Mini Store

**Location:** `REZ-Consumer/rez-now/`

**Current Features:**
- Business profile
- Products/services catalog
- **Online ordering** ✅
- Direct payments (UPI, Razorpay)
- **Chat** ✅
- Analytics

**Built:**
| Feature | Status |
|---------|--------|
| Product Catalog | ✅ |
| Cart & Checkout | ✅ |
| Payments | ✅ |
| Business Profile | ✅ |
| Basic Chat | ✅ |

**What it needs:**
- Voice product search
- Voice checkout
- Support ticket
- Training data collection

---

## USE CASE BY QR TYPE

### 1. SAFE QR
```
Use Case: Emergency & Security
- Scan QR → Session Created → Message Owner (Chat)
- Emergency? → Alert Emergency Services
- Lost? → Track via GPS
```

### 2. MENU QR
```
Use Case: Restaurant Ordering
- Scan QR → View Menu → Order Food
- Book Table (Booking)
- View Reviews
```

### 3. TABLE QR
```
Use Case: Table Service
- Scan QR → View Menu → Order
- Split Bill
- Call Waiter
```

### 4. ROOM QR (StayOwn)
```
Use Case: Hotel Service
- Scan QR → Voice AI (hojai-staybot)
- "Order room service"
- "Book spa appointment"
- "Checkout"
```

### 5. REZ NOW
```
Use Case: Any Business
- Scan QR → View Store → Order/Book
- Pay Directly
- Chat with Business
```

---

## INTEGRATION FLOWS ALREADY WORKING

### SAFE QR - Chat Flow
```
safe-qr (App)
    │
    ├──► Scan QR ──► Session Created
    │
    └──► Message Owner
              │
              ▼
        safe-qr-service (4001)
              │
              ├──► GET /sessions/:id/messages
              ├──► POST /sessions/:id/messages
              │
              ▼
        RelayMessage (MongoDB)
              │
              ▼
        ✅ Messages stored
```

### MENU QR - Order & Booking Flow
```
menu-qr (App)
    │
    ├──► Scan Table QR ──► Menu URL
    │
    ├──► Browse Menu ──► View Items
    │
    ├──► Order Food ──► Place Order ✅
    │
    └──► Book Table
              │
              ▼
        REZScheduleService.ts
              │
              ├──► bookTableViaMenu()
              ├──► Booking Types: table-reservation, chef-table, private-dining, special-event
              │
              ▼
        Schedule API (4090)
              │
              ▼
        ✅ Booking confirmed
```

### ROOM HUB - Voice AI Flow
```
room-hub (App)
    │
    ├──► Scan Room QR ──► Voice AI
    │
    └──► "Order room service"
              │
              ▼
        hojai-staybot (4840)
              │
              ├──► Intent Detection
              │     ├──► room_service
              │     ├──► housekeeping
              │     ├──► checkout
              │     ├──► restaurant
              │     ├──► spa
              │     └──► emergency
              │
              ▼
        ✅ Intent detected → Response generated
```

---

## WHAT NEEDS TO BE CONNECTED

### Priority 1: Connect QR Services to Voice AI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VOICE INTEGRATION NEEDED                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   QR SERVICE ────────────────────► VOICE QR SERVICE (4096)                  │
│   │                                                                        │
│   ├──► safe-qr ─────────────────► Genie Voice (4760)                         │
│   │                             Voice emergency calls                       │
│   │                                                                        │
│   ├──► menu-qr ────────────────► REZ-voice-qr-service (4096)               │
│   │                             Voice ordering                             │
│   │                                                                        │
│   ├──► table-qr ───────────────► REZ-voice-qr-service (4096)               │
│   │                             Voice ordering                             │
│   │                                                                        │
│   └──► room-hub ───────────────► hojai-staybot (4840)                        │
│                                 Already has voice ✅                         │
│                                 Connect to Genie Voice for better AI        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Priority 2: Connect QR Services to Support

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SUPPORT INTEGRATION NEEDED                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   QR SERVICE ───────────────────► SUPPORT HUB (4057)                          │
│   │                                                                        │
│   ├──► safe-qr ───────────────► Support Ticket                              │
│   │                             Issue with session                          │
│   │                                                                        │
│   ├──► menu-qr ───────────────► Support Ticket                              │
│   │                             Issue with order/booking                    │
│   │                                                                        │
│   ├──► table-qr ───────────────► Support Ticket                              │
│   │                             Issue with table/order                      │
│   │                                                                        │
│   └──► room-hub ───────────────► Support Ticket                              │
│                                 Issue with room/hotel                       │
│                                                                              │
│   USE: @rez/unified-support-sdk                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Priority 3: Training Data Collection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TRAINING DATA COLLECTION NEEDED                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   QR SERVICE ───────────────────► HOJAI VOICE STUDIO                        │
│   │                                                                        │
│   ├──► safe-qr ───────────────► Emergency patterns                          │
│   │                                                                        │
│   ├──► menu-qr ───────────────► Order language                              │
│   │                                                                        │
│   ├──► table-qr ───────────────► Ordering patterns                          │
│   │                                                                        │
│   └──► room-hub ───────────────► Hotel service patterns                     │
│                                                                              │
│   USE: @hojai/communications-sdk                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CODE CHANGES NEEDED

### 1. Connect MENU QR to Voice QR Service

```typescript
// Add to REZ-menu-qr/src/service.ts

import { voiceQRCollector } from '@hojai/communications-sdk';

// Voice command
app.post('/api/voice/order', async (req, res) => {
  const { audio, tableQR } = req.body;

  // Transcribe
  const transcript = await transcribe(audio);

  // Process
  const intent = await processIntent(transcript);

  // Collect training
  await voiceQRCollector.collectVoice({
    source: 'menu-qr',
    transcript,
    intent,
    qrCode: tableQR,
  });

  // Execute order
  const order = await placeVoiceOrder(intent, tableQR);

  res.json({ order });
});
```

### 2. Connect ROOM HUB to Genie Voice

```typescript
// Update hojai-staybot to use Genie Voice

import { genieVoice } from '@hojai/voice-sdk';

app.post('/api/chat', async (req, res) => {
  const { query, guestId } = req.body;

  // Use Genie Voice for better AI
  const response = await genieVoice.process({
    text: query,
    context: { hotel: true }
  });

  // Collect training
  await voiceCollector.collectVoice({
    source: 'room-hub',
    transcript: query,
    intent: response.intent,
  });

  res.json(response);
});
```

### 3. Add Support to SAFE QR

```typescript
// Add to safe-qr-service

import { SupportSDK } from '@rez/unified-support-sdk';

const support = new SupportSDK({
  apiUrl: 'http://localhost:4057',
  tenantId: 'rez',
});

// Issue with session → Support ticket
app.post('/api/sessions/:id/escalate', async (req, res) => {
  const { issue, sessionId } = req.body;

  await support.createTicket({
    channel: 'qr',
    subject: 'Safe QR Issue',
    description: issue,
    qrCode: sessionId,
    priority: 'high',
    metadata: { qrType: 'safe-qr' }
  });

  res.json({ success: true });
});
```

---

## COMPLETE PORT REFERENCE

| QR Service | Port | Chat | Order | Voice | Support | Training |
|-----------|------|------|-------|-------|---------|----------|
| safe-qr | 4001 | ✅ | ❌ | ❌ | ❌ | ❌ |
| menu-qr | 3014 | ❌ | ✅ | ❌ | ❌ | ❌ |
| table-qr | 4081 | ❌ | ✅ | ❌ | ❌ | ❌ |
| room-hub | 4840 | ✅ | ✅ | ✅ | ❌ | ❌ |
| rez-now | - | ✅ | ✅ | ❌ | ❌ | ❌ |

### Related Services
| Service | Port | Used By |
|--------|------|---------|
| Genie Voice | 4760 | All QR → Connect |
| Voice QR | 4096 | menu-qr, table-qr → Connect |
| hojai-staybot | 4840 | room-hub → Already connected |
| Support Hub | 4057 | All QR → Add |
| REZ Chat | 4103 | All QR → Add |
| HOJAI Voice Studio | - | All QR → Add |

---

## SUMMARY

### Already Built ✅

| QR Type | Chat | Order | Booking | Voice | Support |
|---------|------|--------|---------|-------|---------|
| safe-qr | ✅ | ❌ | ❌ | ❌ | ❌ |
| menu-qr | ❌ | ✅ | ✅ | ❌ | ❌ |
| table-qr | ❌ | ✅ | ❌ | ❌ | ❌ |
| room-hub | ✅ | ✅ | ✅ | ✅ | ❌ |
| rez-now | ✅ | ✅ | ❌ | ❌ | ❌ |

### What Needs to Be Built

| QR Type | Connect Voice | Connect Support | Collect Training |
|---------|---------------|----------------|-----------------|
| safe-qr | Genie Voice (4760) | Support Hub (4057) | @hojai/comm-sdk |
| menu-qr | Voice QR (4096) | Support Hub (4057) | @hojai/comm-sdk |
| table-qr | Voice QR (4096) | Support Hub (4057) | @hojai/comm-sdk |
| room-hub | Genie Voice (4760) | Support Hub (4057) | @hojai/comm-sdk |
| rez-now | Genie Voice (4760) | Support Hub (4057) | @hojai/comm-sdk |

---

**All QR services already have communication and transactions built!**
**Just need to connect them to Voice AI, Support Hub, and Training.**

Last Updated: June 11, 2026
