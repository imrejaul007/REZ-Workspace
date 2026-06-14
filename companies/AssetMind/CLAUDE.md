# AssetMind - Developer Guide

**Version:** 8.0
**Date:** June 9, 2026
**Status:** ✅ COMPLETE - PRODUCTION READY

---

## OVERVIEW

**AssetMind** is "The World's Financial Intelligence Infrastructure" — Bloomberg + TradingView competitor.

**Tagline:** "Every asset deserves a brain."

**NOT a trading app. NOT a chatbot with finance data.**

AssetMind is **Financial Intelligence Infrastructure** — the AI layer that powers every financial decision. Creates Digital Twins for every financial asset: stocks, crypto, forex, commodities, ETFs, and indices.

---

## 🎯 THE FIVE TWINS

| Twin | Purpose |
|------|---------|
| **Asset Twin** | Every asset, fully understood forever |
| **Market Twin** | Global market conditions, regimes |
| **Portfolio Twin** | Your portfolio, fully analyzed |
| **Investor Twin** | Your behavior, mistakes, coaching |
| **Intelligence Twin** | Predictions improve with age |

---

## 🛡️ THE FIVE MOATS (10x Defensibility)

1. **Asset Twin Network** — Every asset develops deeper intelligence over time
2. **Financial Knowledge Graph** — Every relationship mapped (NVIDIA → TSMC → Taiwan → China)
3. **Financial Memory** — Everything known, stored forever
4. **Prediction Learning Network** — Predictions improve because every outcome is tracked
5. **Investor Twin** — Platform learns YOUR strategy and behavior

---

## 🏗️ ARCHITECTURE (20-Layer, 75+ Services)

```
AssetMind Platform (Ports 5001-5299)
├── Layer 1: Asset Universe (5001)
├── Layer 2: Twin Engine (5002-5006)
├── Layer 3: Data Layer (5010-5023) - 10 data connectors
├── Layer 4: Financial Memory (5030-5033)
├── Layer 5: Knowledge Graph (5040-5042)
├── Layer 6: Intelligence Engines (5050-5060)
├── Layer 7: Scoring Engines (5070-5078)
├── Layer 8: AI Agents (5090-5112) - 13 agents
├── Layer 9-12: Decision & Prediction Layers
├── Layer 13-16: Discovery, Research, Simulation, Trader
├── Layer 17-20: Enterprise, Marketplace, API, Execution
```

---

## 📦 COMPLETE SERVICE REGISTRY (75+ Services)

### Core Tier (5001-5006)

| Port | Service | Purpose |
|------|---------|---------|
| 5001 | assetmind-asset-universe | Global asset registry (stocks, crypto, forex, ETFs, commodities) |
| 5002 | assetmind-asset-twin | Digital twin for every asset |
| 5003 | assetmind-market-twin | Market conditions & regimes |
| 5004 | assetmind-portfolio-twin | Portfolio analytics |
| 5005 | assetmind-investor-twin | Behavior & coaching |
| 5006 | assetmind-intelligence-twin | Prediction learning |

### Data Connectors (5010-5023) - 10 Connectors

| Port | Service | Source |
|------|---------|--------|
| 5010 | market-data-connector | Yahoo Finance, Alpha Vantage |
| 5011 | financial-data-connector | SEC EDGAR, Financial statements |
| 5012 | news-connector | News APIs, GDELT |
| 5013 | social-connector | Reddit, Twitter/X |
| 5014 | macro-connector | FRED, World Bank |
| 5015 | regulatory-connector | SEC, FCA, SEBI |
| 5016 | on-chain-connector | DeFiLlama, Dune Analytics |
| 5017 | alternative-data-connector | Custom datasets |
| 5018 | crypto-connector | CoinGecko, DEX data |
| 5019 | forex-connector | Exchange rates |

### Financial Memory (5030-5033)

| Port | Service | Purpose |
|------|---------|---------|
| 5030 | assetmind-memory | Store predictions, track outcomes, learn |
| 5031 | assetmind-learning-network | Prediction → Outcome → Learning loop |

### Knowledge Graph (5040-5043)

| Port | Service | Purpose |
|------|---------|---------|
| 5040 | financial-knowledge-graph | Neo4j graph database |
| 5041 | entity-resolution | Company relationships |
| 5042 | supply-chain-mapping | NVIDIA→TSMC→Taiwan→China |
| 5043 | correlation-engine | **10x FEATURE** - Dependency mapping |

### Intelligence Engines (5050-5060)

| Port | Service | Purpose |
|------|---------|---------|
| 5050 | financial-intelligence | Core financial analysis |
| 5051 | narrative-intelligence | Theme tracking (AI, Defense, Nuclear, EV, Cybersecurity) |
| 5052 | event-intelligence | Event impact analysis |
| 5053 | risk-engine | Real-time risk assessment |
| 5054 | sentiment-engine | Social sentiment analysis |
| 5055 | institutional-engine | Institutional flow tracking |
| 5056 | macro-intelligence | Macro regime detection |
| 5057 | theme-intelligence | Market theme identification |
| 5058 | sector-intelligence | Sector rotation |
| 5059 | country-intelligence | Country risk |

### Scoring Engines (5070-5078)

| Port | Service | Purpose |
|------|---------|---------|
| 5070 | health-score-engine | Company health scoring |
| 5071 | opportunity-score-engine | Opportunity identification |
| 5072 | risk-score-engine | Risk scoring |
| 5073 | momentum-score-engine | Price momentum |
| 5074 | sentiment-score-engine | Sentiment scoring |
| 5075 | analyst-score-engine | Analyst rating aggregation |
| 5076 | technical-score-engine | Technical analysis scoring |
| 5077 | fundamental-score-engine | Fundamental analysis scoring |
| 5078 | composite-score-engine | Multi-factor scoring |

### AI Agents (5090-5112) - 13 Agents

| Port | Agent | Purpose |
|------|-------|---------|
| 5090 | agent-orchestrator | Central AI coordination |
| 5091 | portfolio-optimizer | Portfolio optimization |
| 5092 | risk-manager | Risk management |
| 5093 | rebalancer | Portfolio rebalancing |
| 5094 | macro-strategist | Macro strategy |
| 5095 | earnings-analyzer | Earnings analysis |
| 5096 | technical-analyst | Technical analysis |
| 5097 | sector-rotation-agent | Sector rotation |
| 5098 | sentiment-analyzer | Sentiment analysis |
| 5099 | news-intelligence-agent | News intelligence |
| 5100 | thesis-tracker | Investment thesis tracking |
| 5101 | narrative-tracker | Narrative tracking |
| 5102 | capital-allocator | Capital allocation |

### Discovery & Research (5120-5140)

| Port | Service | Purpose |
|------|---------|---------|
| 5120 | assetmind-discovery | Thematic opportunities, screeners, trending |
| 5130 | assetmind-research | AI research reports, peer analysis, earnings |
| 5140 | assetmind-simulation | Monte Carlo, stress testing, what-if |

### Trading (5150-5161)

| Port | Service | Purpose |
|------|---------|---------|
| 5150 | assetmind-trader | Order management, positions, portfolio |
| 5160 | assetmind-kronos | **RexMind** - 75M params price forecasting |
| 5161 | assetmind-execution | Smart order routing, fills, algorithms |

### Briefing & Council (5195-5200)

| Port | Service | Purpose |
|------|---------|---------|
| 5200 | assetmind-briefing | Morning briefings, market regime, watchlists |
| 5195 | analyst-council | 10 analysts debate decisions |

### Copilot & Workflow (5290-5299)

| Port | Service | Purpose |
|------|---------|---------|
| 5290 | assetmind-workflow | Automation workflows |
| 5295 | assetmind-copilot | Personal AI financial assistant |
| 5298 | assetmind-intelligence-hub | Orchestration hub |
| 5299 | assetmind-realtime | WebSocket/SSE streaming |

### Enterprise & API (5250-5260)

| Port | Service | Purpose |
|------|---------|---------|
| 5250 | assetmind-enterprise | API access, white-label, enterprise |
| 5251 | assetmind-admin | User management, billing, metrics |
| 5260 | assetmind-api-gateway | TypeScript API gateway |
| 5270 | assetmind-marketplace | Data, models, reports marketplace |

### Capital Flow (5183)

| Port | Service | Purpose |
|------|---------|---------|
| 5183 | capital-flow-engine | ETF flows, institutional, whale tracking, sector rotation |

---

## 📱 MOBILE APP

| App | Platform | Purpose |
|-----|----------|---------|
| **assetmind-mobile** | Expo SDK | Portfolio tracking, watchlists, AI insights |

**Screens:** Home, Discover, Search, Watchlist, Portfolio

---

## 🔗 ECOSYSTEM CONNECTIONS

```
AssetMind → HOJAI AI (Memory, Agents, Knowledge Graph, Reasoning)
AssetMind → RABTUL (Auth, Wallet, Payment for financial transactions)
AssetMind → RIDZA (CFO Suite, Treasury, FP&A - financial decisions)
AssetMind → REZ-Intelligence (Mind, Intent Graph for predictions)
```

---

## 💰 BUSINESS MODEL

| Revenue Stream | Description |
|---------------|-------------|
| **Subscriptions** | $29-50K/month (Free → Institutional) |
| **API Revenue** | Asset intelligence APIs |
| **White Label** | $500K-5M/year to banks & brokers |
| **Data Marketplace** | Premium datasets |
| **Research Marketplace** | Analyst reports & models |
| **AI Models** | License to other apps |

---

## 🚀 QUICK START

```bash
cd AssetMind/codebase

# Start all services with Docker
docker-compose up -d

# Or individual services
cd assetmind-intelligence-hub && pip install -r requirements.txt && python src/__init__.py  # Port 5298
cd assetmind-realtime && pip install -r requirements.txt && python src/__init__.py  # Port 5299
cd assetmind-dashboard && pip install -r requirements.txt && python src/__init__.py  # Port 3000
cd assetmind-api-gateway && pip install -r requirements.txt && python src/__init__.py  # Port 5260

# Mobile app
cd assetmind-mobile && npm install && npx expo start
```

### Health Checks

```bash
curl http://localhost:5001/health  # Asset Universe
curl http://localhost:5160/health  # Kronos (RexMind)
curl http://localhost:5200/health  # Briefing
curl http://localhost:5260/health  # API Gateway
curl http://localhost:5298/health  # Intelligence Hub
```

---

## 🧪 API EXAMPLES

### Unified Query (Hub)
```bash
curl -X POST http://localhost:5298/query \
  -d '{"query": "Should I invest in NVIDIA?"}'
```

### WebSocket (Real-Time)
```javascript
ws = new WebSocket("ws://localhost:5299/ws")
ws.send(JSON.stringify({type: "subscribe_alerts"}))
```

### Dashboard
```bash
curl http://localhost:3000/api/portfolio
curl http://localhost:3000/api/recommendations
```

---

## 📊 PHASE 1 COVERAGE (455 Assets)

- 100 US Stocks
- 50 Crypto
- 50 ETFs
- 20 Indices
- 15 Commodities
- 20 Forex pairs

---

## 🛠️ TECH STACK

| Layer | Technology |
|-------|-----------|
| AI | Claude 3.5 Sonnet, GPT-4o, DeepSeek R1, HOJAI |
| Backend | Python 3.12, FastAPI, Celery |
| Databases | PostgreSQL, TimescaleDB, Neo4j, Pinecone, ClickHouse |
| Frontend | Next.js 14, React, TypeScript, Tailwind |
| Infrastructure | Docker, AWS, Redis, Kubernetes |

---

## 📚 DOCUMENTATION

| Document | Location | Purpose |
|----------|----------|---------|
| README | `README.md` | Company overview |
| Audit | `ASSETMIND-AUDIT-JUNE-2026.md` | Complete audit |
| Architecture | `docs/ARCHITECTURE.md` | Technical architecture |
| Service Index | `docs/SERVICE_INDEX.md` | All services |
| Kronos | `docs/KRONOS-INTEGRATION.md` | RexMind integration |

---

## 📈 STATS

| Metric | Count |
|--------|-------|
| Total Services | 75+ |
| Lines of Code | 75,000+ |
| Documentation | Complete |
| Docker | Ready |
| CI/CD | Ready |
| Auth | Ready |
| WebSocket | Ready |
| Dashboard | Ready |
| Mobile App | Ready |

---

**Last Updated:** June 12, 2026
**Version:** 8.1
**Status:** PRODUCTION READY - FULLY CONNECTED

---

## Integration Architecture (Updated June 12, 2026)

### RABTUL Services Integration

| Service | Port | Integration |
|---------|------|-------------|
| Auth | 4002 | JWT validation, OTP, MFA |
| Payment | 4001 | Investment transactions, Razorpay |
| Wallet | 4004 | Portfolio balance, REZ Coins |
| Notification | 4011 | Market alerts, Push, SMS |

### REZ Identity Integration

| Service | Port | Integration |
|---------|------|-------------|
| REZ Identity Hub | 6000 | Investor profile, 25-source research |

### HOJAI AI Integration

| Service | Port | Integration |
|---------|------|-------------|
| SkillNet | 5130 | Financial AI skills |
| Intelligence | 4530 | AI intelligence layer |
| Genie | 4760 | Personal finance AI |
| BrandPulse | 4770 | Market intelligence |
| Industry AI | Various | Finance vertical |

### SUTAR OS Integration Hub

| Service | Port | Integration |
|---------|------|-------------|
| SUTAR Gateway | 4142 | Central hub for goal/twin management |
| TwinOS | 4160 | Financial twin orchestration |
| Goal Engine | 4180 | Goal tracking and execution |

### Environment Variables for Integrations

```bash
# RABTUL Services
RABTUL_AUTH_URL=http://localhost:4002
RABTUL_PAYMENT_URL=http://localhost:4001
RABTUL_WALLET_URL=http://localhost:4004
RABTUL_NOTIFICATION_URL=http://localhost:4011

# REZ Identity
REZ_IDENTITY_URL=http://localhost:6000

# HOJAI AI
SKILLNET_URL=http://localhost:5130
INTELLIGENCE_URL=http://localhost:4530
GENIE_URL=http://localhost:4760
BRANDPULSE_URL=http://localhost:4770

# Industry AI
INDUSTRY_FINANCE_URL=http://localhost:5050

# SUTAR OS
SUTAR_GATEWAY_URL=http://localhost:4142
SUTAR_TWINOS_URL=http://localhost:4160
SUTAR_GOAL_URL=http://localhost:4180
```

### Shared Clients (hojai-shared)

For integration, use these shared clients from hojai-shared package:

| Client | Purpose |
|--------|---------|
| rabtul-client.ts | RABTUL Auth/Payment/Wallet/Notification |
| rez-identity-client.ts | REZ Identity Hub (25 sources) |
| skillnet-client.ts | SkillNet AI skills |
| industry-ai-client.ts | 28 Industry Verticals |

### Integration Flow

```
AssetMind
├── RABTUL (4002, 4001, 4004, 4011) - Auth, Payment, Wallet, Notification
├── REZ Identity (6000) - Investor profile
├── HOJAI AI
│   ├── SkillNet (5130) - Financial AI skills
│   ├── Genie (4760) - Personal finance AI
│   ├── BrandPulse (4770) - Market intelligence
│   └── Industry AI - Finance vertical
├── SUTAR OS
│   ├── SUTAR Gateway (4142)
│   ├── TwinOS (4160)
│   └── Goal Engine (4180)
└── RIDZA - CFO Suite, Treasury, FP&A
```

### Ecosystem Connections

```
AssetMind → HOJAI AI (Memory, Agents, Knowledge Graph, Reasoning)
AssetMind → RABTUL (Auth, Wallet, Payment for financial transactions)
AssetMind → RIDZA (CFO Suite, Treasury, FP&A - financial decisions)
AssetMind → REZ-Intelligence (Mind, Intent Graph for predictions)
```

---

## Status Checklist

- [x] Codebase exists
- [x] Documentation complete (75+ services)
- [x] Integration clients added (RABTUL, HOJAI, SUTAR)
- [x] Production ready
- [x] 75+ services built
- [x] 13 AI agents deployed
- [x] 10 data connectors active
- [x] RexMind (Kronos) operational

---

**Last Updated:** June 12, 2026
