# 🎧 Axomi BPO Voice Service

**Voice AI for BPO/Call Centers**

> Handle inbound/outbound calls with AI agents, automatic routing, and training data collection

**Port:** 4980

---

## Overview

Axomi BPO Voice Service provides AI-powered call center capabilities:

- 🤖 **AI Agents** - Handle calls with voice AI
- 📞 **Inbound Calls** - Queue and route calls
- 👤 **Agent Management** - Register, route, manage agents
- 📊 **Call Recording** - Record calls for training
- 📈 **Training Data** - Collect data for HOJAI Voice Studio

---

## Features

| Feature | Description |
|---------|-------------|
| **Inbound Calls** | Queue and route calls to agents |
| **Agent Routing** | Smart routing based on skills |
| **STT/TTS** | Speech-to-text and text-to-speech |
| **Intent Detection** | Understand customer needs |
| **Training Data** | Collect calls for model training |

---

## Quick Start

```bash
cd Axom/axomi-bpo-voice-bpo
npm install
cp .env.example .env
npm run dev
```

---

## API Endpoints

### Calls

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/calls/inbound` | Handle inbound call |
| POST | `/api/calls/:id/start` | Start call |
| POST | `/api/calls/:id/transcribe` | Transcribe call |
| POST | `/api/calls/:id/complete` | Complete call |
| GET | `/api/calls` | List all calls |

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents` | Register agent |
| GET | `/api/agents` | List agents |
| PUT | `/api/agents/:id/status` | Update status |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AXOMI BPO VOICE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Inbound Call                                                              │
│       │                                                                    │
│       ▼                                                                    │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐                            │
│  │  Queue │ ──► │ Router  │ ──► │ Agent  │                            │
│  └─────────┘     └─────────┘     └─────────┘                            │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────┐                 │
│  │                  VoiceAI                             │                 │
│  │                                                      │                 │
│  │  STT ──► Intent ──► TTS                           │                 │
│  │                                                      │                 │
│  │  VoiceOS (4850)                                     │                 │
│  └─────────────────────────────────────────────────────┘                 │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────┐                 │
│  │            Training Data Collection                   │                 │
│  │                                                      │                 │
│  │  • Transcript  • Intent  • Sentiment  • Outcome   │                 │
│  │                                                      │                 │
│  │  ──► HOJAI Voice Studio ──► Better Models     │                 │
│  └─────────────────────────────────────────────────────┘                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Training Data

Every call is collected for training:

```typescript
{
  transcript: "I want to change my order",
  intent: "order_change",
  sentiment: "neutral",
  outcome: "resolved",
  duration: 180,
  channel: "phone"
}
```

This data flows to **HOJAI Voice Studio** for training better BPO models.

---

## Connected Services

| Service | URL | Purpose |
|---------|-----|---------|
| **VoiceOS** | localhost:4850 | STT/TTS/Intent |
| **Genie Voice** | localhost:4760 | Personal AI |
| **Training** | localhost:4760/api/training | Data collection |

---

**License:** Proprietary - Axom / RTNM Digital
