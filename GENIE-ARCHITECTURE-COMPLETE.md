# GENIE AI - Complete Architecture

**Version:** 1.0.0  
**Date:** June 15, 2026  
**Status:** ✅ COMPLETE

---

## Vision Statement

**"You don't use Genie. You talk to Genie."**

Genie is the Personal Intelligence OS that powers the entire RTNM consumer ecosystem.

---

## Complete Service Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  WhatsApp ──────────→ genie-whatsapp-bot (4718)                      │
│  DO App ─────────────→ genie-dashboard (4701)                         │
│  RAZO Keyboard ──────→ Genie Intelligence                              │
│  Voice Call ─────────→ HOJAI Voice Platform (4033)                     │
│  Web ────────────────→ genie-dashboard (4701)                         │
│  Telegram ────────────→ genie-telegram-service (4712)                   │
│  Slack ──────────────→ genie-slack-service (4711)                       │
│  Discord ────────────→ genie-discord-service (4716)                    │
│  WhatsApp ───────────→ genie-whatsapp-service (4717)                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GENIE GATEWAY (4702)                              │
│                    API Orchestrator & Entry Point                          │
└─────────────────────────────────────────────────────────────────────────────┘

                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PERSONAL INTELLIGENCE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │  Personal Twin   │  │ Relationship    │  │   Memory       │           │
│  │  (4708)         │  │    Twin (4705)  │  │   (4703)      │           │
│  │                 │  │                 │  │                │           │
│  │ • Identity      │  │ • Health Score  │  │ • Preferences  │           │
│  │ • Preferences   │  │ • Interactions  │  │ • Facts       │           │
│  │ • Goals         │  │ • Neglected     │  │ • Events      │           │
│  │ • Timeline      │  │ • Reminders     │  │ • Patterns    │           │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘           │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │  Health Twin     │  │  Financial Twin │  │  Founder Twin   │           │
│  │  (4730)         │  │  (4731)        │  │  (4709)        │           │
│  │                 │  │                 │  │                │           │
│  │ • Fitness       │  │ • Income       │  │ • Companies    │           │
│  │ • Conditions    │  │ • Expenses     │  │ • Investments │           │
│  │ • Goals        │  │ • Investments  │  │ • Decisions   │           │
│  │ • History      │  │ • Budgets     │  │ • Team        │           │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CORE SERVICES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  genie-briefing (4706)     │ Daily briefings                              │
│  genie-calendar (4709)     │ Calendar management                         │
│  genie-email (4710)        │ Email management                           │
│  genie-meeting (4713)      │ Meeting intelligence                       │
│  genie-sync (4707)          │ Cross-service sync                        │
│  genie-obsidian (4708)      │ Obsidian vault                            │
│  genie-notion (4719)        │ Notion integration                        │
│  genie-project (4721)        │ Project management                        │
│  genie-household (4722)     │ Household/family                          │
│  genie-privacy (4720)        │ Privacy controls                          │
│  genie-memory-review (4723)   │ Memory consolidation                      │
│  genie-browser-history (4724) │ Browser context                           │
│  genie-drive (4726)          │ Google Drive                              │
│  genie-business (4725)       │ Business intelligence                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      HOJAI INFRASTRUCTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  HOJAI Voice Platform (4033)  │ STT/TTS/Voice Agents                       │
│  HOJAI Memory (4520)         │ Vector Memory                             │
│  HOJAI Gateway (4500)        │ API Gateway                              │
│  HOJAI Twin (4860)           │ Digital Twin Platform                     │
│  HOJAI ExpertOS (4550)       │ Agent Runtime                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RTNM ECOSYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  DO App         │ Shopping, Food, Travel, Payments, Commerce             │
│  Nexha         │ B2B Marketplace & Procurement                        │
│  RABTUL        │ Wallet, Payments, Loyalty, Rewards                    │
│  RAZO          │ Communication OS                                      │
│  CorpPerks     │ Employee Benefits                                      │
│  AssetMind    │ Investment & Asset Management                         │
│  StayOwn       │ Hospitality                                           │
│  KhairMove     │ Transport & Logistics                                 │
│  LawGens       │ Legal Services                                        │
│  RisaCare      │ Healthcare                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## All Services

### Interfaces (Ports 4701-4718)

| Service | Port | Purpose |
|---------|------|---------|
| genie-dashboard | 4701 | Vellum-like dashboard |
| genie-gateway | 4702 | API orchestrator |
| genie-memory | 4703 | Personal memory |
| genie-relationship | 4704 | Relationships |
| genie-relationship-twin | 4705 | Relationship health |
| genie-briefing | 4706 | Daily briefings |
| genie-sync | 4707 | Cross-service sync |
| genie-personal-twin | 4708 | Personal digital twin |
| genie-obsidian | 4708 | Obsidian integration |
| genie-calendar | 4709 | Calendar |
| genie-founder-twin | 4709 | Founder intelligence |
| genie-email | 4710 | Email |
| genie-slack | 4711 | Slack integration |
| genie-telegram | 4712 | Telegram bot |
| genie-meeting | 4713 | Meetings |
| genie-discord | 4716 | Discord |
| genie-whatsapp | 4717 | WhatsApp |
| genie-whatsapp-bot | 4718 | WhatsApp Genie Bot |

### Twins (Ports 4708-4731)

| Service | Port | Purpose |
|---------|------|---------|
| genie-personal-twin | 4708 | Identity, preferences, goals |
| genie-founder-twin | 4709 | Business intelligence |
| genie-health-twin | 4730 | Health tracking |
| genie-financial-twin | 4731 | Financial intelligence |

### Business Services (Ports 4720-4726)

| Service | Port | Purpose |
|---------|------|---------|
| genie-privacy | 4720 | Privacy controls |
| genie-project | 4721 | Project management |
| genie-household | 4722 | Family context |
| genie-memory-review | 4723 | Memory consolidation |
| genie-browser-history | 4724 | Browsing context |
| genie-business | 4725 | Business intelligence |
| genie-drive | 4726 | Google Drive |

---

## Integration with HOJAI

| HOJAI Service | Port | Genie Connection |
|--------------|------|-----------------|
| HOJAI Voice Platform | 4033 | Voice STT/TTS |
| HOJAI Memory | 4520 | Vector memory |
| HOJAI Gateway | 4500 | API gateway |
| HOJAI Twin | 4860 | Digital twins |
| HOJAI ExpertOS | 4550 | Agent runtime |

---

## Docker Compose

```bash
cd docker
docker-compose -f docker-compose.genie.yml up -d
```

All services are configured and ready to deploy.

---

**End of Architecture**
