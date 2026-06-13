# Business Copilot OS - Universal AI Assistant

**Status:** ✅ BUILT - June 14, 2026  
**Port:** 4002 (core), 4600 (HOJAI CoPilot)  
**Location:** `industries/business-copilot-os/`

## Overview

Business Copilot OS is a universal AI assistant that serves all 24 industries through industry-specific skill packs. It provides natural language interfaces to all product data, enabling operators to query their business through conversational interactions.

**Tagline:** "One Copilot, Many Skills"

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HOJAI BUSINESS COPILOT                               │
│                         Port: 4600                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    INDUSTRY SKILL PACKS (24)                        │   │
│   │                                                                              │   │
│   │   Hotel │ Restaurant │ Retail │ Healthcare │ Financial │ ...         │   │
│   │   (120+ skills across all industries)                               │   │
│   │                                                                              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                        │                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     CORE SERVICES                                      │   │
│   │   hojai-business-copilot (4600) │ hojai-graph (4810) │ hojai-twin   │   │
│   │   hojai-board (4870) │ hojai-command-center (4801)                    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

## Industry Coverage (24 Industries)

| # | Industry | Primary Skill Focus | Key Twins |
|---|----------|---------------------|-----------|
| 1 | Hotel | Revenue optimization, guest experience | GuestMemory, RoomTwin |
| 2 | Restaurant | Menu optimization, kitchen efficiency | OrderTwin, TableTwin |
| 3 | Retail | Inventory optimization, shopper insights | ShopperTwin |
| 4 | Healthcare | Patient flow, clinical decision support | PatientTwin |
| 5 | Financial | Portfolio management, risk analysis | PortfolioTwin |
| 6 | Automotive | Fleet management, predictive maintenance | VehicleTwin |
| 7 | Legal | Matter management, document review | MatterTwin |
| 8 | Construction | Project status, cost control | ProjectTwin |
| 9 | Education | Student tracking, course optimization | StudentTwin |
| 10 | Real Estate | Property matching, market analysis | PropertyTwin |
| 11 | Manufacturing | Production optimization, supply chain | ProductionTwin |
| 12 | Professional | Client management, billing | ClientTwin |
| 13 | Transport | Fleet tracking, route optimization | FleetTwin |
| 14 | Travel | Trip planning, booking optimization | TravelerTwin |
| 15 | Government | Citizen services, compliance | CitizenTwin |
| 16 | Nonprofit | Donor management, program impact | DonorTwin |
| 17 | Agriculture | Farm planning, market timing | FarmTwin |
| 18 | Beauty | Client lifetime value, inventory | ClientTwin |
| 19 | Entertainment | Fan engagement, brand sentiment | FanTwin |
| 20 | Fashion | Trend analysis, inventory optimization | FashionTwin |
| 21 | Fitness | Member tracking, class optimization | MemberTwin |
| 22 | Gaming | Player engagement, monetization | PlayerTwin |
| 23 | Home Services | Job scheduling, technician dispatch | JobTwin |
| 24 | Sports | Fan engagement, brand sentiment | FanTwin |

## Core Principles

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| **One Copilot, Many Skills** | Single AI engine with pluggable industry skill packs | ✅ hojai-business-copilot (Port 4600) |
| **TwinOS-Native** | Queries directly against the TwinOS graph database | ✅ hojai-graph (Port 4810) |
| **Actionable Intelligence** | Not just answers, but recommendations and actions | ✅ hojai-board (Port 4870) + AgentOS |
| **Omni-Channel Access** | Available via API, dashboard widgets, and mobile | ✅ hojai-command-center (Port 4801) |
| **Compliance-First** | Built-in compliance awareness per industry | ✅ hojai-workforce + TrustOS |

## Key Services

| Service | Port | Description |
|---------|------|-------------|
| hojai-business-copilot | 4600 | Main copilot service |
| hojai-graph | 4810 | Graph database for queries |
| hojai-twin | 4860 | TwinOS integration |
| hojai-board | 4870 | Executive dashboard |
| hojai-command-center | 4801 | Command interface |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | - | Health check |
| `POST /api/query` | POST | Natural language query |
| `GET /api/industries` | GET | List supported industries |
| `GET /api/skills/:industry` | GET | Get industry skills |
| `POST /api/actions` | POST | Execute action |

## Quick Start

```bash
cd industries/business-copilot-os && npm install && node src/index.js

# Health check
curl http://localhost:4002/health

# Query natural language
curl -X POST http://localhost:4002/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What were my sales today?", "industry": "retail"}'

# Get industry skills
curl http://localhost:4002/api/skills/restaurant
```

## Integration

- Connected to RTMN Hub at `http://localhost:8000`
- TwinOS Hub integration
- AgentOS for automation
- HOJAI AI for natural language
- Genie OS for personal context
