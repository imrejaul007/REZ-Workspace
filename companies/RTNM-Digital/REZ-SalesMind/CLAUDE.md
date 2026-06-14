# CLAUDE.md - REZ SalesMind

## Project Overview

**Name:** REZ SalesMind
**Company:** RTNM-Digital
**Type:** AI Sales Intelligence Platform (Formerly REZ Atlas)
**Port:** 5150
**Version:** 2.1.0

## Purpose

REZ SalesMind is an AI-powered sales intelligence platform that connects to the entire RTNM ecosystem. It leverages existing services for prospecting, communication, intelligence, identity, and CRM - no duplication of functionality.

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript
- WebSocket
- Axios (HTTP client)

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server (tsx watch) |
| `npm run build` | TypeScript compilation |
| `npm start` | Production server |

## Project Structure

```
REZ-SalesMind/
├── src/
│   ├── index.ts              # Main entry point
│   ├── routes/
│   │   ├── sales.ts          # Sales intelligence routes
│   │   ├── insights.ts       # Market insights routes
│   │   ├── leads.ts          # Lead management routes
│   │   ├── ai.ts             # AI capabilities (Email, Proposal, Forecast)
│   │   ├── integrations.ts   # External integrations (Slack, LinkedIn, Gmail, Zoom)
│   │   ├── dashboard.ts      # Dashboard data routes
│   │   └── ecosystem.ts      # RTNM ecosystem connector routes
│   ├── services/
│   │   ├── hojaiClient.ts        # HOJAI AI integration
│   │   ├── adbazaarClient.ts     # AdBazaar integration
│   │   ├── rezCRMClient.ts       # REZ CRM Hub integration
│   │   ├── intelligenceEngine.ts  # Sales intelligence engine
│   │   ├── twinService.ts        # Prospect twins service
│   │   ├── signalAggregator.ts    # Signal aggregation
│   │   ├── websocketHandler.ts    # WebSocket real-time
│   │   ├── ecosystemConnector.ts  # RTNM ecosystem connector
│   │   ├── salesWorkflow.ts       # AI Sales Agent workflow
│   │   ├── ai/
│   │   │   ├── emailWriter.ts        # AI email generation
│   │   │   ├── proposalGenerator.ts  # Proposal auto-generation
│   │   │   └── salesForecasting.ts   # Deal closure prediction
│   │   ├── integrations/
│   │   │   ├── slackClient.ts      # Slack notifications
│   │   │   ├── linkedinClient.ts   # LinkedIn enrichment
│   │   │   ├── gmailClient.ts     # Gmail integration
│   │   │   └── zoomClient.ts      # Zoom meeting scheduling
│   │   └── automation/
│   │       └── followUpEngine.ts   # Auto follow-up sequences
│   └── dashboard/
│       └── pipelineDashboard.ts    # Pipeline visualization
├── dashboard.html              # Dashboard UI
├── README.md                   # Full documentation
└── package.json
```

## Ecosystem Connections

### HOJAI AI Services
| Service | Port | Purpose |
|---------|------|---------|
| Web Intelligence | 4595 | Market signals, competitor analysis |
| Merchant Intel | 4751 | Business intelligence, sales insights |
| Lead Service | 4752 | Lead scoring and enrichment |
| Knowledge Graph | 4786 | Entity relationships |
| TwinOS | 4521 | Conversation intelligence |

### Genie Voice
| Service | Port | Purpose |
|---------|------|---------|
| Genie Voice | 4760 | Email, SMS, WhatsApp, Calls, Meeting scheduling |

### REZ Services
| Service | Port | Purpose |
|---------|------|---------|
| REZ Identity Hub | 6000 | Unified identity, conversation memory, pre-call briefs |
| REZ CRM Hub | 6100 | Leads, deals, pipeline management |
| REZ Merchant | 4100 | Business data |
| REZ Consumer | 4200 | Consumer profiles |
| REZ Booking | 4020 | Reservations, scheduling |

### Other Services
| Service | Port | Purpose |
|---------|------|---------|
| AssetMind | 5000 | Revenue twins, financial forecasting |
| AdBazaar CRM | 4303 | Marketing attribution |
| AdBazaar Campaigns | 4300 | Campaign management |

## Environment Variables

```env
# HOJAI AI
HOJAI_WEB_INTEL=http://localhost:4595
HOJAI_MERCHANT_INTEL=http://localhost:4751
HOJAI_LEAD_SERVICE=http://localhost:4752
HOJAI_KG=http://localhost:4786
HOJAI_TWIN_OS=http://localhost:4521

# Genie Voice
GENIE_VOICE=http://localhost:4760

# REZ Services
REZ_IDENTITY_HUB=http://localhost:6000
REZ_CRM_HUB=http://localhost:6100
REZ_MERCHANT=http://localhost:4100
REZ_CONSUMER=http://localhost:4200
REZ_BOOKING=http://localhost:4020

# AssetMind
ASSETMIND=http://localhost:5000

# AdBazaar
ADBAZAAR_CAMPAIGNS=http://localhost:4300
ADBAZAAR_CRM=http://localhost:4303
```

## Key Features

1. **AI Sales Agent** - Complete workflow orchestration
2. **Pre-Call Intelligence** - Company intel, market signals, talking points
3. **Prospect Twins** - Personality profiling, communication preferences
4. **Signal Aggregation** - Intent detection, engagement tracking
5. **Pipeline Intelligence** - Stage analysis, conversion rates
6. **Email Writer** - AI-generated personalized emails
7. **Proposal Generator** - Auto-generate proposals with HTML
8. **Sales Forecasting** - Predict deal closure probability
9. **Auto Follow-up** - Sequences and task automation
10. **Conversation Memory** - Cross-channel history

## Comparison with Outplay

| Feature | Outplay | REZ SalesMind |
|---------|---------|---------------|
| Prospecting | B2B Database | HOJAI Lead Service |
| Multi-channel | Email, LinkedIn, SMS, Phone | Genie Voice + All Channels |
| AI SDR | Basic | Full Ecosystem |
| Conversation Intelligence | Call Recording | TwinOS + Memory |
| Identity | ❌ | REZ Identity Hub |
| Memory | ❌ | Full History |
| Knowledge Graph | ❌ | HOJAI Knowledge Graph |
| Business Twin | ❌ | AssetMind |

---

**Last Updated:** 2026-06-12
