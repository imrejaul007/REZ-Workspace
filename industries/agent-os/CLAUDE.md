# Agent OS - Cross-Industry AI Agent Orchestration

**Status:** ✅ BUILT - June 14, 2026  
**Port:** 4003  
**Location:** `industries/agent-os/`

## Overview

AgentOS Hub orchestrates 121+ AI agents across 24 industries, enabling intelligent automation and cross-industry workflows. Each industry has specialized agents trained on domain-specific knowledge and workflows.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AgentOS Hub - Cross-Industry Orchestration              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    CROSS-INDUSTRY AGENTS (16)                       │   │
│   │   UniversalSearch │ CrossSell │ Customer360 │ Anomaly │ Trend │ ...  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                        │                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     PER-INDUSTRY AGENTS (105)                        │   │
│   │                                                                              │   │
│   │   Hotel (6) │ Restaurant (6) │ Retail (6) │ Healthcare (6) │ ...     │   │
│   │   RealEstate (5) │ Financial (5) │ Transport (5) │ Legal (5) │ ...   │   │
│   │   Education (5) │ Fitness (5) │ Beauty (5) │ Professional (5) │ ...  │   │
│   │   Manufacturing (5) │ Travel (5) │ Government (5) │ NonProfit (5) │...  │   │
│   │   Fashion (5) │ Sports (5) │ Gaming (5) │ Construction (5) │ ...    │   │
│   │   Agriculture (5) │ Entertainment (5) │ Automotive (5) │ HomeServices (5) │ │
│   │                                                                              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Agent Registry (121 Total)

### Per-Industry Agents

| Industry | Agents | Count |
|----------|--------|-------|
| **Hotel** | Concierge, Housekeeping, Upsell, Revenue, GuestFeedback, StaffScheduling | 6 |
| **Restaurant** | Host, Order, Kitchen, Upsell, Delivery, Inventory | 6 |
| **Retail** | Shopping, Checkout, Loyalty, Inventory, VisualSearch, Recommendation | 6 |
| **Healthcare** | Intake, Triage, Scheduling, Followup, Prescription, Claims | 6 |
| **Real Estate** | LeadQualify, PropertyMatch, TourSchedule, OfferNegotiate, ClosingPrep | 5 |
| **Financial** | FraudDetect, CreditAssess, InvestmentAdvisor, ComplianceCheck, KYC | 5 |
| **Transport** | RouteOptimizer, DriverMatch, DynamicPricing, CustomerSupport, SafetyMonitor | 5 |
| **Legal** | CaseResearch, DocumentDraft, Billing, Compliance, CourtRemind | 5 |
| **Education** | Enrollment, Grading, Attendance, LearningAnalytics, Tutoring | 5 |
| **Fitness** | Membership, ClassBooking, FitnessCoach, CheckIn, Retention | 5 |
| **Beauty** | Booking, Consultation, ProductRec, Reminder, Satisfaction | 5 |
| **Professional** | ProjectMgmt, ResourceAlloc, ClientOnboard, ProposalGen, TimeTrack | 5 |
| **Manufacturing** | ProductionSched, QualityCtrl, MaintenancePred, SupplyChain, SafetyInsp | 5 |
| **Travel** | TripPlanner, Booking, Concierge, ExpenseTrack, TravelPolicy | 5 |
| **Government** | ServiceNav, AppProcessor, ComplianceChk, Notification, BenefitCalc | 5 |
| **Non-Profit** | Fundraising, VolunteerMatch, ImpactReport, DonorRel, GrantWriter | 5 |
| **Fashion** | StyleAdvisor, SizeAdvisor, TrendAnalyst, InventoryMgmt, VisualMerch | 5 |
| **Sports** | Scout, FanEngage, TicketMgmt, ScheduleOpt, MediaManage | 5 |
| **Gaming** | Matchmaker, AntiCheat, Monetization, Engagement, SupportBot | 5 |
| **Construction** | ProjectMgmt, SafetyInsp, ResourceAlloc, ProgressTrack, CostEst | 5 |
| **Agriculture** | YieldPredict, IrrigationSched, PestDetect, MarketAdv, EquipmentMon | 5 |
| **Entertainment** | TalentMgmt, EventCoord, TicketSales, Marketing, FanEngage | 5 |
| **Automotive** | VehicleRec, PricingAnalyst, ServiceSched, InventoryMgmt, LeadQualify | 5 |
| **Home Services** | Dispatcher, QuoteGen, Scheduling, CustomerRet, InventoryMgmt | 5 |

### Cross-Industry Agents (16)

| Agent | Purpose | Industries |
|-------|---------|-------------|
| UniversalSearch | Search across all industries | All |
| CrossSellEngine | Recommend cross-industry products | All |
| Customer360 | Unified customer view | All |
| AnomalyDetect | Detect unusual patterns | All |
| TrendAnalyzer | Industry trend analysis | All |
| SentimentAnalyzer | Analyze feedback | All |
| PredictiveAnalytics | ML predictions | All |
| ReportGenerator | Generate reports | All |
| NotificationHub | Send notifications | All |
| WorkflowOrchestrator | Orchestrate workflows | All |
| DataEnricher | Enrich data from sources | All |
| ComplianceMonitor | Monitor regulations | All |
| CostOptimizer | Optimize costs | All |
| RevenueMaximizer | Maximize revenue | All |
| CustomerJourney | Track journey | All |
| PersonalizationEngine | Personalize experiences | All |

## API Endpoints

### Agent Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/agents` | GET | List all agents |
| `GET /api/agents/:industry` | GET | List agents by industry |
| `GET /api/agents/:id` | GET | Get agent details |
| `POST /api/agents/:id/invoke` | POST | Invoke agent |
| `GET /api/agents/:id/status` | GET | Get agent status |
| `POST /api/agents/:id/config` | POST | Update agent config |

### Cross-Industry Workflows
| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/workflows` | POST | Create workflow |
| `GET /api/workflows/:id` | GET | Get workflow status |
| `POST /api/workflows/:id/execute` | POST | Execute workflow |
| `GET /api/workflows/:id/results` | GET | Get workflow results |

### Agent Communication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/agents/:id/message` | POST | Send message to agent |
| `GET /api/agents/:id/conversations` | GET | Get agent conversations |
| `POST /api/agents/collaborate` | POST | Multi-agent collaboration |

## Quick Start

```bash
# Install and start
cd industries/agent-os && npm install && node src/index.js

# Access AgentOS
curl http://localhost:4003/health

# List all agents
curl http://localhost:4003/api/agents

# List hotel agents
curl http://localhost:4003/api/agents/hotel

# Invoke hotel concierge agent
curl -X POST http://localhost:4003/api/agents/hotel-concierge/invoke \
  -H "Content-Type: application/json" \
  -d '{"action": "recommend_upgrade", "guestId": "guest_123"}'

# Create cross-industry workflow
curl -X POST http://localhost:4003/api/workflows \
  -H "Content-Type: application/json" \
  -d '{"name": "Customer Onboarding", "agents": ["retail-checkout", "financial-kyc"]}'
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4003 | Agent OS port |
| TWIN_OS_URL | http://localhost:3011 | TwinOS Hub URL |
| MEMORY_OS_URL | http://localhost:4703 | Memory OS URL |
| RTMN_HUB_URL | http://localhost:8000 | RTMN Hub URL |

## Key Files

```
industries/agent-os/
├── package.json
├── INTEGRATION-SPEC.md           # Full integration specification
└── src/
    ├── index.js                  # Main entry
    └── routes/
        ├── agents.js           # Agent management
        ├── workflows.js        # Cross-industry workflows
        ├── invoke.js           # Agent invocation
        └── collaboration.js    # Multi-agent collaboration
```
