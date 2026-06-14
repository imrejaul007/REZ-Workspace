# AssetMind - REZ Ecosystem Integration

**AssetMind** is a product of the **RTNM Digital / REZ Ecosystem** that leverages **REZ Intelligence** which is powered by **HOJAI AI**.

## Architecture

```
RTNM DIGITAL (Parent Company)
│
├── REZ ECOSYSTEM
│   │
│   ├── AssetMind (Financial Intelligence Platform)
│   │   │
│   │   └── Uses REZ Intelligence
│   │       │
│   │       └── Powered by HOJAI AI
│   │
│   ├── REZ Consumer (Consumer App)
│   ├── REZ Merchant (Merchant Platform)
│   ├── Nexha (Commerce Network)
│   ├── CorpPerks (Workforce OS)
│   ├── RisaCare (Healthcare OS)
│   └── ...
│
└── HOJAI AI (AI Infrastructure)
    ├── MemoryOS (Multi-tier Memory)
    ├── TwinOS (Digital Twins)
    ├── Agent Platform (AI Agents)
    ├── VoiceOS (Voice AI)
    └── FlowOS (Workflow Automation)
```

## Service Dependencies

### AssetMind Dependencies
| Service | Provider | Purpose |
|---------|-----------|---------|
| **REZ Intelligence** | REZ Ecosystem | Core AI reasoning& analysis |
| **HOJAI Memory** | HOJAI AI | Persistent memory (GENIE) |
| **HOJAI Agents** | HOJAI AI | Autonomous task execution |
| **HOJAI Voice** | HOJAI AI | Voice commands & synthesis |
| **HOJAI Twins** | HOJAI AI | Digital twin infrastructure |

### REZ Intelligence Dependencies
| Service | Provider | Purpose |
|---------|-----------|---------|
| **HOJAI AI Core** | HOJAI AI | LLM, embeddings, reasoning |
| **HOJAI Memory** | HOJAI AI | Knowledge storage |
| **HOJAI Agents** | HOJAI AI | Agent orchestration |
| **HOJAI Flow** | HOJAI AI | Workflow automation |

## Integration Layers

### Layer 1: HOJAI AI (Foundation)
- **HOJAI Core**: LLM, embeddings, reasoning engine
- **GENIE Memory**: Persistent memory across sessions
- **Agent Platform**: AI agents for tasks
- **Voice OS**: Speech-to-text, text-to-speech
- **Twin OS**: Digital twin infrastructure

### Layer 2: REZ Intelligence (Intelligence Layer)
- **REZ Reasoning**: Chain-of-thought financial reasoning
- **REZ Memory**: Financial domain memory
- **REZ Agents**: Financial domain agents
- **REZ Twins**: Financial digital twins
- **REZ Voice**: Financial voice commands

### Layer 3: AssetMind (Application Layer)
- **Financial Twins**: Asset, Portfolio, Investor, Market
- **Intelligence**: Kronos, RexMind, Copilot
- **Trading**: Order management, broker API
- **Private Markets**: Deal room, underwriting, diligence
- **Reporting**: PDF, Excel, dashboards

## Port Mapping

### HOJAI AI (Ports 4500-4899)
| Port | Service | Purpose |
|------|---------|---------|
| 4703 | GENIE Memory | Memory storage |
| 4704 | GENIE Relationship | Entity relationships |
| 4706 | GENIE Briefing | Daily briefings |
| 4850 | Voice OS | Voice commands |
| 4851 | Voice Agents | Voice agent execution |

### REZ Intelligence (Ports 4000-4100)
| Port | Service | Purpose |
|------|---------|---------|
| 4018 | REZ Intent Predictor | Intent analysis |
| 4123 | REZ Predictive Engine | Predictions |
| 4201 | REZ Memory Layer | Financial memory |

### AssetMind (Ports 5000-5310)
| Port | Service | Purpose |
|------|---------|---------|
| 5002 | Asset Twin | Company analysis |
| 5004 | Portfolio Twin | Holdings tracking |
| 5005 | Investor Twin | Investor profile |
| 5040 | Knowledge Graph | Entity relationships |
| 5041 | Economic Twin | Macro indicators |
| 5160 | Intelligence | AI analysis |
| 5165 | Kronos | Forecasting |
| 5250 | Decision Twin | What-if scenarios |
| 5252 | Twin Hub | Twin orchestration |
| 5280 | Deal Room | Data room analysis |
| 5295 | Copilot | Conversational AI |

## Data Flow

```
User Query (Voice/Text)
    ↓
AssetMind Copilot (5295)
    ↓
REZ Intelligence (via API)
    ↓
HOJAI AI Core (via REZ Intelligence)
    ↓
HOJAI Memory (GENIE) ← Persistent context
    ↓
HOJAI Agents ← Task execution
    ↓
Response back through layers
    ↓
AssetMind UI/Trading
```

## Quick Start

```bash
# Start HOJAI AI (Foundation)
cd HOJAI-AI
docker-compose up -d

# Start REZ Intelligence (Middle Layer)
cd REZ-Intelligence
docker-compose up -d

# Start AssetMind (Application Layer)
cd AssetMind
docker-compose up -d
```

## Environment Variables

```bash
# HOJAI AI
HOJAI_API_KEY=your-key
HOJAI_MEMORY_URL=http://localhost:4703

# REZ Intelligence
REZ_INTELLIGENCE_URL=http://localhost:4018
REZ_MEMORY_URL=http://localhost:4201

# AssetMind
ASSETMIND_MODE=production
REZ_INTELLIGENCE_ENDPOINT=http://rez-intelligence:4018
```

## Service Health Check

```bash
# Check HOJAI AI
curl http://localhost:4703/health

# Check REZ Intelligence
curl http://localhost:4018/health

# Check AssetMind
curl http://localhost:5252/health
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      RTNM DIGITAL                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  ASSETMIND                               │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │Twin Hub │ │Copilot  │ │ Kronos  │ │ Deal Rm │       │   │
│  │  │ (5252)  │ │ (5295)  │ │ (5165)  │ │ (5280)  │       │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │   │
│  └───────┼───────────┼───────────┼───────────┼──────────────┘   │
│          │           │           │           │                    │
│          └───────────┴───────────┴───────────┘                    │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 REZ INTELLIGENCE                         │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │   │
│  │  │Intent Pred  │ │Predictive    │ │Memory Layer  │     │   │
│  │  │ (4018)      │ │ (4123)       │ │ (4201)       │     │   │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘     │   │
│  └─────────┼───────────────┼───────────────┼─────────────┘   │
│            │               │               │                   │
│            └───────────────┴───────────────┘                   │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    HOJAI AI                              │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │ Memory  │ │ Agents  │ │ Voice   │ │ Twin OS │       │   │
│  │  │ (4703) │ │ Platform│ │ (4850)  │ │         │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Points

1. **AssetMind** is the **application layer** - end-user facing
2. **REZ Intelligence** is the **intelligence layer** - AI reasoning
3. **HOJAI AI** is the **foundation layer** - infrastructure

AssetMind does NOT directly call HOJAI AI. It goes through REZ Intelligence.
