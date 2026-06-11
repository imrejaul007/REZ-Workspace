# 🎯 CUSTOMER SUPPORT, BPO & VOICE INTEGRATION - COMPLETE AUDIT

**Date:** June 11, 2026

---

## 1. CUSTOMER SUPPORT - UNIFIED OR SCATTERED?

### Current State: **SCATTERED** ⚠️

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CUSTOMER SUPPORT - CURRENT STATE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   REZ-Consumer ────────────────────────────────────────────────────────┐   │
│   ├── do-app/               # Genie support                           │   │
│   ├── genie-voice/          # Personal support                       │   │
│   └── REZ-app/              # Consumer app                           │   │
│                                                                        │   │
│   RABTUL-Technologies ───────────────────────────────────────────────┐   │
│   ├── REZ-chat-service/     # Live chat (4103)                      │   │
│   ├── REZ-support-tools-hub/ # Zendesk/Freshdesk/Intercom (4057) │   │
│   └── REZ-qr-unified/       # QR support (4090)                    │   │
│                                                                        │   │
│   AdBazaar ───────────────────────────────────────────────────────┐   │
│   ├── customer-support-service/  # Basic support                       │   │
│   ├── support-sla-service/      # SLA tracking                       │   │
│   ├── REZ-crm-hub/            # CRM (4056)                         │   │
│   ├── customer-graph-360/      # Customer 360                        │   │
│   └── REZ-live-chat-widget/    # Chat widget                        │   │
│                                                                        │   │
│   RTNM-Group ─────────────────────────────────────────────────────┐   │
│   └── rez-support-dashboard/    # Support dashboard                   │   │
│                                                                        │   │
│   CorpPerks ──────────────────────────────────────────────────────┐   │
│   └── support-portal/          # Employee support                     │   │
│                                                                        │   │
│   Axom ──────────────────────────────────────────────────────────┐   │
│   └── agent-governance-service/ # Agent management                   │   │
│                                                                        │   │
└────────────────────────────────────────────────────────────────────────┘   │
```

### Support Services Found

| Company | Service | Port | Status |
|---------|---------|------|---------|
| **RABTUL** | REZ-support-tools-hub | 4057 | ✅ Unified (Zendesk/Freshdesk/Intercom) |
| **RABTUL** | REZ-chat-service | 4103 | ✅ Live chat |
| **RABTUL** | REZ-qr-unified | 4090 | ✅ QR support |
| **AdBazaar** | customer-support-service | - | ❌ Basic |
| **AdBazaar** | support-sla-service | - | ✅ SLA tracking |
| **AdBazaar** | REZ-crm-hub | 4056 | ✅ CRM (HubSpot/Zoho) |
| **RTNM Group** | rez-support-dashboard | - | ✅ Dashboard |
| **CorpPerks** | support-portal | - | ✅ Employee support |
| **Axom** | agent-governance-service | - | ✅ Agent management |

### What's Good ✅

| Service | What It Does |
|---------|--------------|
| REZ-support-tools-hub | Unifies Zendesk, Freshdesk, Intercom |
| REZ-chat-service | Live chat + chatbot |
| REZ-crm-hub | HubSpot + Zoho CRM |
| agent-governance-service | Agent management |

### What's Missing ❌

| Gap | What It Means |
|-----|---------------|
| **No unified ticket system** | Each company has its own |
| **No unified agent pool** | Agents siloed by company |
| **No unified analytics** | No cross-company reporting |
| **No unified training data** | Support data not flowing to HOJAI |

---

## 2. BPO (AXOM) - HOW IT WORKS

### Axom BPO Services

```
Axom/
├── axomi-bpo-voice-bpo/         # ✅ Built (Port 4980)
│   ├── Inbound/outbound calls
│   ├── Agent routing
│   └── Training data collection
├── agent-governance-service/      # ✅ Exists
├── audit-trail-service/          # ✅ Exists
├── scam-call-detection/           # ✅ Exists
├── communication-compliance/      # ✅ Exists
└── buzzlocal/                   # ✅ Social platform
```

### BPO Flow

```
Customer Call
    │
    ▼
Axomi BPO Voice (4980)
    │
    ├──► Queue
    │
    ├──► Agent Routing
    │
    └──► VoiceAI (VoiceOS)
              │
              ├──► STT (Whisper)
              │
              ├──► Intent Detection
              │
              ├──► TTS Response
              │
              └──► Training Data ──► HOJAI Voice Studio
```

### What's Built

| Component | Port | Status |
|-----------|------|---------|
| axomi-bpo-voice-bpo | 4980 | ✅ Built |
| agent-governance-service | - | ✅ Exists |
| scam-call-detection | - | ✅ Exists |

### What's Missing ❌

| Component | Status |
|-----------|--------|
| BPO API Gateway | ❌ Empty |
| Agent dashboard | ❌ Need to build |
| BPO analytics | ❌ Need to build |
| Training data collection | ✅ Built into BPO Voice |

---

## 3. VOICE PRODUCTS IN APPS & QR

### Where Voice is Used

| App/Product | Voice Product | Integration |
|-------------|--------------|-------------|
| **DO App** | Genie Voice (4760) | ✅ Direct |
| **REZ Merchant** | VoiceOS (4850) | ❌ Not integrated |
| **REZ Consumer** | Genie Voice (4760) | ✅ Via Genie |
| **QR/POS** | None | ❌ Not integrated |
| **Restaurant QR** | None | ❌ Not integrated |
| **Table QR** | None | ❌ Not integrated |

### QR/POS Voice Status

| Product | Port | Voice Status |
|---------|------|--------------|
| REZ-qr-unified | 4090 | ❌ No voice |
| REZ-table-qr-service | - | ❌ No voice |
| REZ-pos-intelligence | - | ❌ No voice |
| REZ-qr-dashboard | - | ❌ No voice |

### What's Missing

Voice should be added to:
- QR ordering (voice order)
- POS (voice checkout)
- Restaurant apps (voice menu)
- Table service (voice call)

---

## 4. INPUT DEVICE HANDLING

### Who Handles Input Devices?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INPUT DEVICE LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   VOICE INPUT                                                              │
│   ───────────                                                              │
│   Genie Voice (4760) ──► Handles mic, wake word, STT                       │
│                                                                              │
│   TEXT INPUT                                                               │
│   ───────────                                                              │
│   REZ-chat-service (4103) ──► Handles keyboard, chat                        │
│                                                                              │
│   SCAN INPUT                                                              │
│   ───────────                                                              │
│   REZ-qr-unified (4090) ──► Handles camera, QR scanning                   │
│                                                                              │
│   TAP INPUT                                                               │
│   ───────────                                                              │
│   RABTUL Payment ──► Handles NFC, cards, UPI tap                          │
│                                                                              │
│   UNIFIED INPUT MANAGER                                                   │
│   ─────────────────────────                                              │
│   ??? ──► No unified input manager exists ❌                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Input Handling Services

| Input Type | Service | Port | Handler |
|------------|---------|------|---------|
| Voice | Genie Voice | 4760 | ✅ |
| Voice | VoiceOS | 4850 | ✅ |
| Chat | REZ-chat-service | 4103 | ✅ |
| QR Scan | REZ-qr-unified | 4090 | ✅ |
| Card Tap | RABTUL Payment | 4001 | ✅ |
| Biometric | Auth Service | 4002 | ✅ |
| **Unified Input** | ? | ? | ❌ Missing |

### What's Needed

A unified input manager that:
1. Detects input type (voice, text, scan, tap)
2. Routes to appropriate service
3. Handles device switching
4. Provides fallback

---

## 5. UNIFIED SDK - WHAT EXISTS

### Current SDKs

| SDK | Package | Purpose |
|-----|---------|---------|
| **@hojai/unified-sdk** | packages/ | Hojai AI services |
| **@hojai/voice-sdk** | packages/ | Voice services |
| **@hojai/communications-sdk** | packages/ | Training data |
| **@hojai/unified-gateway** | packages/ | API gateway |

### What's Missing in SDKs

| SDK | Missing |
|-----|---------|
| **Voice SDK** | Device handling (mic, speaker) |
| **Unified SDK** | Support services |
| **Communications SDK** | Chat integration |
| **Unified Gateway** | Complete coverage |

---

## 6. COMPLETE INTEGRATION MAP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         UNIFIED CUSTOMER EXPERIENCE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   CUSTOMER REACHES OUT                                                      │
│   ────────────────────                                                     │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                      UNIFIED INPUT LAYER                            │  │
│   │                                                                    │  │
│   │   Voice ───► Genie Voice (4760)                                  │  │
│   │   Chat ────► REZ-chat (4103)                                     │  │
│   │   QR ──────► REZ-qr-unified (4090)                              │  │
│   │   Call ────► Axomi BPO (4980)                                    │  │
│   │   Support ──► REZ-support-tools-hub (4057)                       │  │
│   │                                                                    │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                    UNIFIED SUPPORT HUB (4057)                   │  │
│   │                                                                    │  │
│   │   • Tickets from all channels                                    │  │
│   │   • Zendesk + Freshdesk + Intercom                             │  │
│   │   • CRM (HubSpot + Zoho)                                       │  │
│   │   • Agent routing                                              │  │
│   │                                                                    │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                    VOICE AI LAYER                                │  │
│   │                                                                    │  │
│   │   Genie Voice (4760) ───► Personal AI                          │  │
│   │   VoiceOS (4850) ───► Enterprise AI                            │  │
│   │   Axomi BPO (4980) ───► Call Center AI                         │  │
│   │                                                                    │  │
│   │   All connect to: HOJAI VOICE STUDIO (Training)                  │  │
│   │                                                                    │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. WHAT NEEDS TO BE BUILT

### Priority 1: UNIFIED SUPPORT

| Service | Purpose | Status |
|---------|---------|--------|
| **Unified Support Hub** | Centralize all support | ❌ Scattered |
| **Unified Agent Pool** | Shared agents across companies | ❌ Silos |
| **Unified Analytics** | Cross-company reporting | ❌ None |
| **Training Data Collection** | All support → Voice Studio | ❌ Partial |

### Priority 2: VOICE IN QR/POS

| Service | Purpose | Status |
|---------|---------|--------|
| **Voice QR Ordering** | Voice order via QR | ❌ Missing |
| **Voice POS** | Voice checkout | ❌ Missing |
| **Voice Menu** | Voice restaurant menu | ❌ Missing |

### Priority 3: UNIFIED INPUT MANAGER

| Service | Purpose | Status |
|---------|---------|--------|
| **Input Manager** | Detect + route input | ❌ Missing |
| **Device Switch Handler** | Handle mic/speaker changes | ❌ Missing |

---

## 8. ACTION ITEMS

### Build Now

1. **Unified Support SDK**
   ```typescript
   import { SupportSDK } from '@rez/unified-support-sdk';

   const support = new SupportSDK({ tenantId: 'company_123' });

   // All channels unified
   support.tickets.create({ channel: 'voice', issue: '...' });
   support.tickets.create({ channel: 'chat', issue: '...' });
   support.tickets.create({ channel: 'qr', issue: '...' });
   ```

2. **Voice QR Service**
   ```typescript
   // Add to REZ-qr-unified
   import { voiceQR } from '@hojai/voice-sdk';

   // Voice ordering
   await voiceQR.order('table_123', { voice: true });
   ```

3. **Unified Input Manager**
   ```typescript
   import { InputManager } from '@rez/input-manager';

   const input = new InputManager();

   // Automatically detects input type
   input.on('voice', (audio) => handleVoice(audio));
   input.on('text', (text) => handleText(text));
   input.on('qr', (code) => handleQR(code));
   ```

---

## 9. COMPLETE FILE LIST

### Support Services

```
Support/
├── RABTUL-Technologies/
│   ├── REZ-support-tools-hub/        # Port 4057 ✅
│   ├── REZ-chat-service/            # Port 4103 ✅
│   └── REZ-qr-unified/             # Port 4090 ✅
├── AdBazaar/
│   ├── customer-support-service/    # ❌ Basic
│   ├── support-sla-service/        # ✅
│   └── REZ-crm-hub/               # Port 4056 ✅
├── RTNM-Group/
│   └── rez-support-dashboard/      # ✅
├── CorpPerks/
│   └── support-portal/             # ✅
└── Axom/
    ├── axomi-bpo-voice-bpo/        # Port 4980 ✅
    └── agent-governance-service/    # ✅
```

### Voice Services

```
Voice/
├── genie-voice/                   # Port 4760 ✅
├── HOJAI-VOICE-PLATFORM/         # Port 4850 ✅
├── hojai-edge-stt/                # Port 4035 ✅
├── Axom/axomi-bpo-voice-bpo/      # Port 4980 ✅
├── voice-training/                 # Training ✅
└── packages/
    ├── @hojai/voice-sdk/         # ✅
    └── @hojai/communications-sdk/ # ✅
```

### Unified Services

```
Unified/
├── packages/
│   ├── @hojai/unified-sdk/        # ✅
│   └── @hojai/unified-gateway/   # ✅
├── RABTUL-Technologies/
│   ├── REZ-unified-hub/         # ❌ Empty
│   ├── REZ-qr-unified/         # Port 4090 ✅
│   └── REZ-unified-identity/    # ✅
└── AdBazaar/
    └── REZ-crm-hub/            # Port 4056 ✅
```

---

## 10. FINAL SUMMARY

### Current State

| Area | Status | Notes |
|------|--------|-------|
| **Support** | Scattered | 10+ services, not unified |
| **BPO** | Partial | Axomi BPO built, needs API gateway |
| **Voice in Apps** | Partial | Genie + VoiceOS, no QR/POS |
| **Input Handling** | Siloed | Each service handles its own |
| **Training Data** | Partial | Genie + VoiceOS + BPO |

### What's Good

- ✅ Genie Voice (personal AI)
- ✅ VoiceOS (enterprise AI)
- ✅ REZ-support-tools-hub (multi-platform support)
- ✅ REZ-chat-service (live chat)
- ✅ HOJAI Voice Studio (training)

### What's Missing

- ❌ Unified support ticket system
- ❌ Voice in QR/POS
- ❌ Unified input manager
- ❌ Complete training data from support
- ❌ BPO API gateway

### Recommended Actions

1. **Build Unified Support SDK**
2. **Add Voice to QR/POS**
3. **Build Input Manager**
4. **Add Training Data to Support**

---

**Last Updated:** June 11, 2026
