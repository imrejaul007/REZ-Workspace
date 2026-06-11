# 🎤 VOICE & COMMUNICATION ECOSYSTEM - COMPLETE GUIDE

**Version:** 3.0 | **Date:** June 11, 2026

---

## THE COMPLETE ECOSYSTEM

### 3 Core Voice Products

| Product | For | Who Uses It | Port |
|---------|-----|-------------|------|
| **Genie Voice** | Personal AI | End users (you) | 4760 |
| **VoiceOS** | Enterprise | Businesses | 4850 |
| **HOJAI Voice Studio** | Training | Developers | - |

### Communication Services

| Service | Port | Purpose |
|---------|------|---------|
| **REZ-chat** | 4103 | Live chat, chatbot |
| **genie-call-service** | 4707 | Personal AI calls |
| **Customer Support** | - | Support tickets |
| **hojai-staybot** | - | Hotel chatbot |
| **CRM Services** | - | Customer data |

---

## THE CONTINUOUS LEARNING LOOP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VOICE ECOSYSTEM - CONTINUOUS LEARNING                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   DATA INPUT SOURCES                                                          │
│   ─────────────────                                                           │
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│   │ Genie Voice │  │  VoiceOS   │  │  REZ Chat  │  │  Support   │   │
│   │  (Voice)   │  │  (Voice)   │  │   (Chat)   │  │  (Tickets) │   │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
│          │                 │                 │                 │                │
│          └─────────────────┼─────────────────┼─────────────────┘                │
│                            │                 │                                │
│                            ▼                 ▼                                │
│   ┌───────────────────────────────────────────────────────────────┐        │
│   │                  TRAINING DATA COLLECTION                        │        │
│   │                                                                │        │
│   │  • Transcripts  • Intents  • Sentiment  • Feedback          │        │
│   │  • Resolutions  • Categories  • Outcomes                     │        │
│   │                                                                │        │
│   └─────────────────────────────┬──────────────────────────────────┘        │
│                                 │                                          │
│                                 ▼                                          │
│   ┌───────────────────────────────────────────────────────────────┐        │
│   │                 HOJAI VOICE STUDIO                            │        │
│   │                 (Training Pipeline)                           │        │
│   │                                                                │        │
│   │  1. Collect data from all sources                          │        │
│   │  2. Generate training datasets                              │        │
│   │  3. Fine-tune Whisper models                              │        │
│   │  4. Train intent classifiers                                │        │
│   │  5. Deploy improved models                                │        │
│   │                                                                │        │
│   └─────────────────────────────┬──────────────────────────────────┘        │
│                                 │                                          │
│                                 ▼                                          │
│   ┌───────────────────────────────────────────────────────────────┐        │
│   │                   MODEL DEPLOYMENT                             │        │
│   │                                                                │        │
│   │  Better models ──► Edge STT ──► Genie Voice                 │        │
│   │  Better models ──► Cloud STT ──► VoiceOS                   │        │
│   │  Better models ──► Chatbot ──► Better responses            │        │
│   │  Better models ──► Support AI ──► Better automation        │        │
│   │                                                                │        │
│   └───────────────────────────────────────────────────────────────┘        │
│                                                                              │
│   Loop continues: More data → Better training → Better AI                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## COMMUNICATION SERVICES AUDIT

### All Communication Services Found

| Service | Port | Type | Company |
|---------|------|------|---------|
| **VoiceOS** | 4850 | Voice | HOJAI AI |
| **Genie Voice** | 4760 | Voice | HOJAI AI |
| **genie-call-service** | 4707 | Voice | HOJAI AI |
| **hojai-staybot** | - | Voice | StayOwn |
| **REZ-chat-service** | 4103 | Chat | RABTUL |
| **REZ-live-chat-widget** | - | Chat | AdBazaar |
| **rez-chatbot-builder-ui** | - | Chat | AdBazaar |
| **customer-support-service** | - | Support | AdBazaar |
| **rez-support-dashboard** | - | Support | RTNM Group |
| **support-portal** | - | Support | CorpPerks |
| **corp-crm-service** | - | CRM | CorpPerks |
| **rez-retail-crm-service** | - | CRM | REZ Merchant |
| **hojai-communications** | - | SDK | packages |

### Data Collection Status

| Service | Status | Training Data |
|---------|--------|---------------|
| VoiceOS (4850) | ✅ Ready | Voice, intents, sentiment |
| Genie Voice (4760) | ✅ Ready | Voice, memory, preferences |
| REZ-chat (4103) | 📋 Need to add | Chat, resolutions |
| Customer Support | 📋 Need to add | Tickets, feedback |
| CRM Services | 📋 Need to add | Profiles, history |

---

## @hojai/communications-sdk

**SDK for collecting all communication data**

```typescript
import { CommunicationTrainingCollector } from '@hojai/communications-sdk';

// For VoiceOS
const voiceCollector = new CommunicationTrainingCollector({ source: 'voiceos' });
await voiceCollector.collectVoice({ transcript: 'Order pizza', intent: 'order' });

// For REZ Chat
const chatCollector = new CommunicationTrainingCollector({ source: 'rez-chat' });
await chatCollector.collectChat({ conversationId: '123', transcript: 'Help!' });

// For Customer Support
const supportCollector = new CommunicationTrainingCollector({ source: 'support' });
await supportCollector.collectSupport({ ticketId: 'T123', category: 'billing' });
```

---

## 🧞 GENIE VOICE (Port 4760)

**Personal AI Voice Assistant**

> "Your personal AI that remembers, understands, and helps you"

### Who Uses It?
- End users of DO App
- Anyone wanting personal voice AI
- People who want AI to remember things for them

### What It Does?
| Feature | Example |
|---------|---------|
| Voice commands | "Hey Genie, add milk to my list" |
| Voice notes | "Remember my meeting with Rahul at 3" |
| Personal memory | "What's my usual coffee order?" |
| Daily briefing | "Give me my morning briefing" |
| Personal tasks | "Call mom", "Set reminder" |

### Key APIs
```
POST /api/voice/process     # Full pipeline
POST /api/notes            # Create voice note
GET  /api/briefing         # Daily briefing
POST /api/memory           # Remember something
GET  /api/memory           # Recall memories
```

### Architecture
```
User speaks → Genie Voice (4760) → HOJAI AI (4500)
                                    ↓
                              Memory, Intent
                                    ↓
                              TTS Response
```

### Use Case
- "Hey Genie, I need to remember that my doctor's appointment is on Friday at 2 PM"
- Genie: "Got it! I've added your doctor's appointment on Friday at 2 PM to your calendar."

---

## 🏢 VOICEOS (Port 4850)

**Enterprise Voice AI Platform**

> "Voice AI for businesses - call centers, customer service, sales"

### Who Uses It?
- Businesses with call centers
- Customer service teams
- E-commerce companies
- Restaurants with phone orders
- Any business wanting AI to handle calls

### What It Does?
| Feature | Example |
|---------|---------|
| AI Call Center | AI answers customer calls 24/7 |
| Sales Agent | AI qualifies leads, schedules demos |
| Support Agent | AI handles FAQs, creates tickets |
| Appointment Booking | AI books appointments, tables |
| Order Taking | AI takes food orders by phone |

### Key APIs
```
POST /api/agents           # Create AI agent
POST /api/calls            # Make/receive calls
POST /api/sessions         # Start conversation
GET  /api/analytics        # Call metrics
POST /api/webhooks/twilio  # Phone integration
```

### Architecture
```
Phone Call → Twilio/Exotel → VoiceOS (4850)
                                       ↓
                              AI Agent (Sales/Support)
                                       ↓
                              RABTUL (Payments/Wallet)
```

### Use Cases
- Restaurant: "Call to order pizza" → AI takes order
- Hotel: "Call to book room" → AI handles booking
- Clinic: "Call to book appointment" → AI schedules
- Business: "Call for support" → AI handles FAQ

---

## 🎓 HOJAI VOICE STUDIO

**Voice Model Training**

> "Train custom Whisper models for Indian languages"

### Who Uses It?
- Developers
- ML engineers
- Data scientists

### What It Does?
| Feature | Purpose |
|---------|---------|
| Whisper Fine-tuning | Train on Indian languages |
| Dataset Generation | Create training data |
| Model Export | Export to ONNX/WASM for edge |

### Key Scripts
```bash
# Generate dataset
python scripts/indian_dataset_generator.py --language hi

# Train model
bash TRAIN_INDIAN_MODELS.sh base hi

# Export for edge
python scripts/export_models.py --model ./models/whisper-hi
```

### Use Case
- Train Whisper to understand "bhai", "yaar", Hindi accent
- Result: Better STT for Indian users

---

## 📊 COMPARISON

| Feature | Genie Voice | VoiceOS |
|---------|-------------|----------|
| **Audience** | Personal | Enterprise |
| **Use Case** | My daily life | Business operations |
| **Example** | "Order my usual" | "Handle customer call" |
| **Memory** | Personal memories | Customer data |
| **Integration** | DO App | Call centers |
| **Port** | 4760 | 4850 |
| **Pricing** | Free (in app) | Rs 9,999+/month |

---

## 🔗 HOW THEY CONNECT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VOICE ECOSYSTEM                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   👤 PERSONAL                          🏢 ENTERPRISE                        │
│   ──────────                          ────────────                         │
│                                                                              │
│   ┌─────────────────┐                    ┌─────────────────┐                 │
│   │   Genie Voice  │                    │    VoiceOS      │                 │
│   │    (4760)      │                    │    (4850)       │                 │
│   │                 │                    │                 │                 │
│   │  • Remember    │                    │  • Call center │                 │
│   │  • Voice notes │                    │  • AI agents   │                 │
│   │  • Briefing   │                    │  • Sales       │                 │
│   │  • Personal   │                    │  • Support     │                 │
│   └────────┬───────┘                    └────────┬────────┘                 │
│            │                                    │                           │
│            └────────────────┬─────────────────┘                           │
│                              │                                            │
│                              ▼                                            │
│                   ┌─────────────────────┐                               │
│                   │     HOJAI AI        │                               │
│                   │     (4500)          │                               │
│                   │                     │                               │
│                   │  • Intent           │                               │
│                   │  • Memory (L1-L5)  │                               │
│                   │  • Agents          │                               │
│                   └─────────┬───────────┘                               │
│                             │                                             │
│                             ▼                                             │
│                   ┌─────────────────────┐                               │
│                   │ HOJAI Voice Studio │                               │
│                   │    (Training)       │                               │
│                   │                     │                               │
│                   │  • Whisper fine-tune│                               │
│                   │  • Indian languages│                               │
│                   │  • Edge models    │                               │
│                   └─────────────────────┘                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 WHICH PRODUCT TO USE?

| Scenario | Product |
|----------|---------|
| I want AI to remember my things | Genie Voice |
| I want to talk to my AI assistant | Genie Voice |
| I want voice notes | Genie Voice |
| I want AI to answer business calls | VoiceOS |
| I want AI to take food orders | VoiceOS |
| I want AI sales agent | VoiceOS |
| I want to train custom STT model | HOJAI Voice Studio |
| I want offline voice recognition | Edge STT |

---

## 🚀 QUICK START

### Genie Voice
```bash
cd genie-voice
npm install
npm run dev
# Port 4760
```

### VoiceOS
```bash
cd HOJAI-VOICE-PLATFORM
npm install
npm run dev
# Port 4850
```

### Train Model
```bash
cd voice-training
bash TRAIN_INDIAN_MODELS.sh base hi
```

---

## 📁 FILE STRUCTURE

```
voice-ecosystem/
│
├── genie-voice/                    # Personal AI
│   ├── src/
│   │   ├── index.ts             # Main service (4760)
│   │   └── services/            # STT, TTS, Memory, etc.
│   ├── README.md
│   └── package.json
│
├── HOJAI-VOICE-PLATFORM/         # Enterprise
│   ├── src/
│   │   ├── index.ts             # Main service (4850)
│   │   ├── agents/              # AI agents
│   │   └── telecom/             # Twilio, etc.
│   ├── README.md
│   └── package.json
│
├── hojai-edge-stt/                # Edge STT
│   ├── src/
│   │   └── index.ts             # ONNX Whisper (4035)
│   └── README.md
│
├── voice-training/                # Training
│   ├── scripts/
│   │   ├── indian_dataset_generator.py
│   │   └── fine_tune_models.py
│   └── README.md
│
└── VOICE-PRODUCTS-GUIDE.md       # This file
```

---

## 🔧 SERVICES SUMMARY

| Service | Port | Type | Product |
|---------|------|------|---------|
| **Genie Voice** | 4760 | Personal AI | Genie Voice |
| **VoiceOS** | 4850 | Enterprise | VoiceOS |
| **Voice Commerce** | 4880 | Enterprise Feature | VoiceOS |
| **Voice Ecosystem** | 4620-4631 | Personal Features | Genie Voice |
| **Edge STT** | 4035 | Infrastructure | Shared |
| **Cloud STT** | 4033 | Infrastructure | Shared |
| **Voice Studio** | - | Training | HOJAI Voice Studio |

---

**Last Updated:** June 11, 2026
