# HOJAI AI - Complete Platform Documentation

**Version:** 3.0 | **Date:** June 1, 2026

---

## VoiceOS Platform - Complete

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VOICE GATEWAY                              │
├─────────────────────────────────────────────────────────────┤
│  📞 Phone (Twilio, Exotel, Knowlarity)                      │
│  💬 WhatsApp Voice                                        │
│  🌐 Web Voice Widget                                     │
│  📱 Mobile Voice                                        │
│  📹 Video Agent                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SPEECH ENGINE                            │
├─────────────────────────────────────────────────────────────┤
│  🎤 STT: Whisper, Sarvam, Google                        │
│  🔊 TTS: ElevenLabs, Cartesia, Sarvam                     │
│  🌐 Translate: 10+ Indian Languages                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    VOICE BRAIN                             │
├─────────────────────────────────────────────────────────────┤
│  🧠 Intent Engine (detect what user wants)                │
│  📋 Context Engine (understand the situation)           │
│  💾 Memory Engine (remember everything)                 │
│  😊 Emotion Engine (detect sentiment)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    ACTION ENGINE                            │
├─────────────────────────────────────────────────────────────┤
│  🛒 Voice Commerce (order, checkout, pay)                │
│  📅 Voice Bookings (appointments, reservations)          │
│  💳 Voice Payments (UPI, Card, COD)                     │
│  📞 Voice Support (complaints, refunds)                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    AI EMPLOYEES                            │
├─────────────────────────────────────────────────────────────┤
│  🤖 Receptionist (answer calls, book appointments)        │
│  🤖 SDR (qualify leads, schedule demos)                  │
│  🤖 Support Agent (handle complaints, refunds)            │
│  🤖 Booking Agent (tables, services, rides)              │
│  🤖 Collections Agent (payment follow-ups)               │
│  🤖 CFO Agent (financial queries)                       │
│  🤖 HR Agent (employee queries)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Services

### VoiceOS Services (NEW)

| Port | Service | Purpose |
|------|---------|---------|
| **3000** | VoiceOS Dashboard | Unified merchant dashboard |
| **4112** | rez-ai-voice | Voice agents (Sales, Support, Info) |
| **4860** | Telecom Bridge | Twilio, Exotel, Knowlarity |
| **4870** | Multilingual | Hindi, Tamil, Telugu, 7 more |
| **4880** | Voice Commerce | Orders, Bookings, Payments |
| **4850** | Unified Platform | WhatsApp + Support + Commerce |

### HOJAI Core

| Port | Service | Purpose |
|------|---------|---------|
| 4500 | API Gateway | Routing, auth, rate limiting |
| 4501 | Governance | RBAC, audit, permissions |
| 4510 | Event Bus | Pub/sub, streaming |
| 4520 | Memory | Vector store, timeline |
| 4530 | Intelligence | ML predictions |
| 4550 | Agents | Agent orchestration |
| 4560 | Workflows | Automation |
| 4570 | Communications | WhatsApp, SMS, Email |
| 4580 | Hyperlocal | Geo intelligence |
| 4590 | Data | Feature store |

---

## Quick Start

```bash
# VoiceOS
cd hojai-voice-os && npm install && npm run dev

# Telecom Bridge
cd hojai-telecom-bridge && npm install && npm run dev

# Multilingual
cd hojai-multilingual && npm install && npm run dev

# Voice Commerce
cd hojai-voice-commerce && npm install && npm run dev
```

---

## Integration

### India Telecom

| Provider | Status | Features |
|----------|--------|----------|
| Twilio | ✅ | International |
| Exotel | ✅ | India, IVR |
| Knowlarity | ✅ | Bulk calling |
| Ozonetel | 🔜 | Coming |

### Languages

| Language | Status |
|----------|--------|
| English | ✅ |
| Hindi | ✅ |
| Tamil | ✅ |
| Telugu | ✅ |
| Bengali | ✅ |
| Kannada | ✅ |
| Malayalam | 🔜 |
| Marathi | 🔜 |
| Gujarati | 🔜 |
| Punjabi | 🔜 |

---

## License

Proprietary - HOJAI AI
