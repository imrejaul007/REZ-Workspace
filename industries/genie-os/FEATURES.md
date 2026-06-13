# Genie OS - Features

**Status:** ✅ BUILT | **Port:** 4001 | **Updated:** June 14, 2026

---

## Overview

Genie is the Personal Intelligence Layer providing each user with a private AI companion that learns preferences, manages memory, and orchestrates their digital life.

**Tagline:** "You don't use Genie. You talk to Genie."

---

## 26 Services

### Memory Core
| Service | Port | Description |
|---------|------|-------------|
| genie-memory-service | 4703 | Long-term memory storage |
| genie-relationship-service | 4704 | Relationship graph |
| genie-personal-os-gateway | 4702 | Central gateway |

### Communication
| Service | Port | Description |
|---------|------|-------------|
| genie-voice-service | 4712 | Voice interaction |
| genie-calendar-service | 4709 | Calendar aggregation |
| genie-email-service | 4710 | Email management |
| genie-meeting-service | 4713 | Meeting coordination |
| genie-briefing-service | 4706 | Daily briefings |

### Integration
| Service | Port | Description |
|---------|------|-------------|
| genie-sync-service | 4707 | Cross-service sync |
| genie-browser-history-service | 4724 | Browser context |
| genie-drive-connector | 4726 | Drive integration |

### Notetaking
| Service | Port | Description |
|---------|------|-------------|
| genie-notion-service | 4709 | Notion sync |
| genie-obsidian-service | 4708 | Obsidian vault |

### Messaging
| Service | Port | Description |
|---------|------|-------------|
| genie-slack-service | 4710 | Slack integration |
| genie-telegram-service | 4711 | Telegram bot |
| genie-whatsapp-service | 4717 | WhatsApp |
| genie-discord-service | 4716 | Discord |

### Intelligence
| Service | Port | Description |
|---------|------|-------------|
| genie-privacy-service | 4720 | Privacy controls |
| genie-household-service | 4722 | Family context |
| genie-memory-review-service | 4723 | Memory consolidation |
| genie-project-service | 4721 | Project context |
| genie-business-intelligence | 4725 | Business analytics |

---

## Key Features

### Personal Memory
- Semantic search across memories
- Importance scoring
- Context recall
- Conversation history
- Preference storage

### Relationship Graph
- 100+ relationship types
- Social context
- Communication history
- Important dates
- Connection strength

### Daily Briefings
- Morning briefings (weather, tasks, reminders)
- Evening summaries
- On-demand generation
- Briefing history

### Voice Interaction
- Wake word: "Hey Genie"
- 33+ language support
- STT via HOJAI Voice
- TTS via ElevenLabs + Sarvam

### Multi-Messaging
- Unified inbox
- Slack, Telegram, WhatsApp, Discord
- Cross-platform sync
- Smart routing

### Notetaking Sync
- Notion integration
- Obsidian vault sync
- Bidirectional sync
- Template support

### Business Intelligence
- Sales analytics
- Customer insights
- Natural language queries
- Report generation

### Privacy Controls
- Granular consent
- Data export
- Memory deletion
- Sharing controls

---

## Personal Twins

| Twin | Purpose |
|------|---------|
| Identity Twin | User identity and profile |
| Preferences Twin | Likes, dislikes, settings |
| Memory Twin | Knowledge and experiences |
| Relationships Twin | Social connections |

---

## API Endpoints

### Core
- `GET /health` - Health check
- `POST /api/memory` - Store memory
- `GET /api/memory/search` - Search memories
- `GET /api/relationships` - List relationships
- `POST /api/relationships` - Add relationship

### Briefings
- `GET /api/briefings/today` - Today's briefing
- `GET /api/briefings/morning` - Morning briefing
- `GET /api/briefings/evening` - Evening briefing
- `POST /api/briefings/generate` - Generate briefing

### Communication
- `GET /api/calendar` - Get calendar
- `GET /api/email` - Get emails
- `POST /api/email/send` - Send email

### Business
- `POST /api/business/query` - NL query
- `GET /api/business/report` - Generate report

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Platform access |
| TwinOS | HTTP | Personal twin |
| Business Copilot | HTTP | Business context |
| External APIs | Various | Data aggregation |

---

## Quick Start

```bash
cd industries/genie-os
npm install
node src/index.js
# Runs on http://localhost:4001
```
