# AssetMind — Complete Technical Architecture

**Version:** 1.0  
**Status:** Production Architecture  
**Date:** June 5, 2026  
**Architecture:** 10-Year, Phased Implementation

---

## Company Definition

```
AssetMind is a Financial Intelligence Infrastructure company.

NOT a trading app. NOT a data platform. NOT an AI chatbot.

The company builds and owns the world's largest network of
Financial Asset Digital Twins — continuously learning from data,
events, predictions, and outcomes to power better financial decisions.

The five permanent assets that cannot be replicated:
1. Asset Twin Network
2. Financial Knowledge Graph
3. Financial Memory System
4. Prediction Learning Network
5. Investor/Trader Twin

Revenue streams:
1. Subscriptions (Free → Institutional $1K–$50K/mo)
2. API Revenue (Asset Intelligence APIs)
3. White Label (Banks, Brokers, Fintechs)
4. Data Marketplace
5. Research Marketplace
6. AI Model Licensing
```

---

## The 20-Layer Architecture

```
AssetMind Platform
├── Layer 1:  Asset Universe
├── Layer 2:  Twin Engine
├── Layer 3:  Data Layer
├── Layer 4:  Financial Memory
├── Layer 5:  Knowledge Graph
├── Layer 6:  Intelligence Engines
├── Layer 7:  Scoring Engines
├── Layer 8:  AI Agent Layer
├── Layer 9:  Decision Layer
├── Layer 10: Prediction Layer
├── Layer 11: Learning Layer
├── Layer 12: Daily Intelligence
├── Layer 13: Discovery Layer
├── Layer 14: Research Layer
├── Layer 15: Simulation Layer
├── Layer 16: Trader Layer
├── Layer 17: Enterprise Layer
├── Layer 18: Marketplace Layer
├── Layer 19: API Platform
└── Layer 20: Execution Layer
    + Capital Allocation Engine
```

---

## Layer 1: Asset Universe

**Service:** `assetmind-asset-universe`  
**Port:** 5001

```
Asset
├── id (UUID)
├── symbol (AAPL, BTC, EURUSD)
├── name (Apple Inc, Bitcoin)
├── asset_class (STOCK, CRYPTO, FOREX, COMMODITY, BOND, ETF, INDEX)
├── exchange (NYSE, NASDAQ, COINBASE)
├── country (US, GB, JP, IN)
├── currency (USD, EUR, GBP)
├── status (ACTIVE, SUSPENDED, DELISTED)
├── metadata (CIK, contract address, ISIN)
├── twin_id (UUID → links to Asset Twin)
└── created_at, updated_at

Asset Classes Supported:
├── STOCK (COMMON, PREFERRED, ADR, OTC)
├── CRYPTO (SPOT, FUTURES, DEFI, STABLECOIN)
├── FOREX (MAJOR, MINOR, EXOTIC)
├── COMMODITY (METALS, ENERGY, AGRICULTURE)
├── BOND (GOVERNMENT, CORPORATE)
├── ETF
└── INDEX
```

**Phase 1 Coverage:** ~455 assets
- 250 US stocks
- 100 crypto
- 20 indices
- 15 commodities
- 20 forex pairs
- 50 ETFs

---

## Layer 2: Twin Engine

### Asset Twin Service (Port 5002)

```
AssetTwin
├── asset_id (FK → Asset)
├── identity (name, sector, industry, HQ)
├── market_layer (price, volume, market_cap)
├── financial_layer (income, balance sheet, cash flow, ratios)
├── news_layer (articles, summaries, sentiment)
├── sentiment_layer (social, news, institutional)
├── event_layer (earnings, regulatory, product, management)
├── relationship_layer (suppliers, customers, competitors)
├── risk_layer (financial, market, operational, regulatory, geo)
├── prediction_layer (bullish/neutral/bearish probabilities)
├── health_layer (9 health scores)
├── memory_layer (→ HOJAI Memory Platform)
└── updated_at
```

### Market Twin Service (Port 5003)

```
MarketTwin
├── global_market (bull/bear/volatility regime)
├── regional_markets (US, EU, Asia, EM, India)
├── sector_rotation (rankings, capital flow direction)
├── sentiment_overview (fear/greed, retail, institutional)
├── macro_overview (rates, inflation, GDP, employment)
└── regime_classification
```

### Portfolio Twin Service (Port 5004)

```
PortfolioTwin
├── user_id
├── holdings (asset, quantity, avg_entry, current_value)
├── analytics (total_value, return, day_pnl)
├── risk_analytics (beta, volatility, sharpe, VaR)
├── exposure_analytics (sector, geo, currency, theme)
├── diversification_score
└── risk_score
```

### Investor Twin Service (Port 5005)

```
InvestorTwin
├── profile (goals, risk_tolerance, horizon, sectors)
├── behavior (holding_period, position_size, win_rate)
├── mistakes (revenge_trading, overtrading, FOMO, panic)
├── best_strategies
├── worst_strategies
├── coaching_recommendations
└── personality_score
```

### Intelligence Twin Service (Port 5006)

```
IntelligenceTwin
├── prediction_history
├── confidence_calibration
├── model_performance (technical, fundamental, sentiment, macro)
├── learning_events
├── reasoning_chains
└── intellectual_property
```

---

## Layer 3: Data Layer (Ports 5010-5023)

| Service | Port | Data Type |
|---------|------|-----------|
| Market Data | 5010 | Prices, OHLCV, volume |
| Financial Data | 5011 | SEC EDGAR, filings |
| Earnings | 5012 | Transcripts, guidance |
| News | 5013 | Financial news |
| Social Sentiment | 5014 | Reddit, Telegram |
| Macro Data | 5015 | FRED, World Bank |
| Regulatory | 5016 | SEC, exchanges |
| On-Chain | 5017 | Dune, DeFiLlama |
| Institutional | 5018 | 13F filings |
| Options | 5019 | CBOE, chains |
| Fund Flow | 5020 | ETF flows |
| Analyst | 5021 | Ratings, targets |
| Geopolitical | 5022 | Events, news |
| Economic Calendar | 5023 | GDP, CPI, rates |

---

## Layer 4: Financial Memory

**Service:** `assetmind-memory` (Ports 5030-5033)

Uses HOJAI Memory Platform (Port 4540) as licensed infrastructure.

```
AssetMind Financial Memory
├── remember() — Store new data
├── recall()   — Retrieve historical data
├── profile()  — Build asset profiles
└── reason()   — Connect memories

Memory Types:
├── Event Memory (Earnings, M&A, regulatory)
├── News Memory (Every article, ever)
├── Price Memory (Patterns, movements)
├── Prediction Memory (Every prediction)
├── Outcome Memory (Every outcome)
└── Learning Memory (Lessons learned)
```

---

## Layer 5: Knowledge Graph

**Service:** `assetmind-knowledge-graph` (Ports 5040-5042)

Uses Neo4j + HOJAI Knowledge Graph (Port 4786).

```
Node Types: Company, Person, Sector, Country, Commodity,
            Currency, Index, ETF, Crypto, Theme, Event, Regulation

Relationship Types:
├── SUPPLIES_TO
├── CUSTOMER_OF
├── COMPETES_WITH
├── PARTNERED_WITH
├── ACQUIRED
├── AFFECTED_BY_RATE
├── AFFECTED_BY_INFLATION
├── LOCATED_IN
├── AFFECTED_BY_GEO
├── LEADS_THEME
├── SIMILAR_TO
├── BELONGS_TO_SECTOR
├── BELONGS_TO_INDEX
├── SECTOR_ROTATION
└── ... (25+ total)
```

---

## Layer 6: Intelligence Engines (Ports 5050-5060)

| Engine | Port | Purpose |
|--------|------|---------|
| Financial | 5050 | DCF, ratios, scoring |
| News | 5051 | Summarization, impact |
| Sentiment | 5052 | Social, news analysis |
| Risk | 5053 | Risk scoring, scenarios |
| Event | 5054 | Earnings, macro events |
| Institutional | 5055 | 13F, whale tracking |
| Analyst | 5056 | Ratings, price targets |
| Macro | 5057 | Rates, inflation, GDP |
| Theme | 5058 | AI, EV, defense themes |
| Sector | 5059 | Sector analysis |
| Country | 5060 | Country risk/opportunity |

---

## Layer 7: Scoring Engines (Ports 5070-5078)

Every asset gets all 9 scores (0-100):

| Score | Port | Description |
|-------|------|-------------|
| Health | 5070 | Overall health composite |
| Opportunity | 5071 | Bullish potential |
| Risk | 5072 | Downside risk |
| Sentiment | 5073 | Sentiment bias |
| Conviction | 5074 | Thesis strength |
| Institutional | 5075 | Institutional interest |
| Financial | 5076 | Fundamental health |
| Technical | 5077 | Technical health |
| Momentum | 5078 | Trend strength |

---

## Layer 8: AI Agent Layer (Ports 5090-5112)

```
Agent Orchestrator (5090) — Routes queries to specialized agents

13 Specialized Agents:
├── Asset Agent (5100)      — Asset profile, relationships
├── News Agent (5101)      — News intelligence
├── Sentiment Agent (5102) — Social/news analysis
├── Quant Agent (5103)     — Technical analysis
├── Macro Agent (5104)     — Macro intelligence
├── Risk Agent (5105)      — Risk assessment
├── Portfolio Agent (5106)  — Portfolio management
├── Earnings Agent (5107)  — Earnings intelligence
├── Options Agent (5108)    — Options analytics
├── Research Agent (5109)  — Report generation
├── Compliance Agent (5110) — Regulatory watch
├── Discovery Agent (5111)  — Opportunity finding
└── Learning Agent (5112)  — System improvement
```

**Multi-Agent Collaboration:**
```
User Query: "Analyze NVIDIA"

Orchestrator → Routes to:
├── Asset Agent (profile, history)
├── Financial Agent (fundamentals)
├── News Agent (recent news)
├── Sentiment Agent (social sentiment)
├── Earnings Agent (earnings history)
├── Risk Agent (risk factors)
├── Macro Agent (semiconductor sector)
└── Research Agent (synthesizes report)
```

---

## Layer 9: Decision Layer (Ports 5150-5152)

```
Decision Engine (5150)

NOT: "What happened?"
YES: "What should I do?"

Questions Answered:
├── What should I watch today?
├── What changed overnight?
├── What is becoming risky?
├── What opportunities emerged?
├── What am I missing?
├── What affects my portfolio?
├── Should I add, reduce, or hold?
└── What is most likely to happen next?
```

---

## Layer 10-11: Prediction + Learning Layer (Ports 5160-5164)

```
Prediction Service (5160)

NEVER predict exact prices.
ALWAYS predict probabilities.

Output:
{
  "bullish_probability": 62,
  "neutral_probability": 24,
  "bearish_probability": 14,
  "confidence": 78,
  "reasoning_chain": [...],
  "supporting_factors": [...],
  "contradicting_factors": [...]
}

Learning Loop:
Prediction → Outcome → Analysis → Learning → Better Prediction
```

---

## Layer 12: Daily Intelligence (Ports 5170-5176)

```
Morning Briefings (6 AM UTC)

├── Market Briefing (5173)
│   ├── Overnight moves
│   ├── Pre-market futures
│   └── Market sentiment
├── Watchlist Briefing (5171)
│   ├── Earnings today
│   ├── Economic data
│   └── Key events
├── Portfolio Briefing (5172)
│   ├── Overnight changes
│   ├── New risks
│   └── Rebalancing suggestions
├── Opportunity Briefing (5176)
│   ├── Top opportunities
│   ├── Reasoning
│   └── Conviction
├── Risk Briefing (5175)
│   ├── Top risks
│   ├── Severity
│   └── Mitigation
└── Theme Briefing (5174)
    ├── Theme momentum
    └── Capital rotation
```

---

## Layer 13: Discovery Layer (Ports 5180-5185)

```
The platform NEVER waits for users to search.

Proactively Discovers:
├── Top 10 Opportunities (5180)
├── Top 10 Risks (5181)
├── Emerging Themes (5182)
├── Capital Rotation Signals (5183)
├── Institutional Accumulation (5184)
└── Hidden Opportunities (5185)
    "You follow NVIDIA. You may be missing:
     - Vertiv (power infrastructure)
     - Eaton (electrical systems)
     - Data Center REITs"
```

---

## Layer 14: Research Layer (Ports 5190-5195)

```
AI Investment Committee (5190)

Committee Members:
├── Fundamental Analyst
├── Technical Analyst
├── Macro Analyst
├── Risk Manager
├── Quant Analyst
└── Sentiment Analyst

Output: Institutional-grade research reports
```

---

## Layer 15: Simulation Layer (Ports 5200-5202)

```
Scenario Simulator (5200)

User: "What if oil reaches $150?"

Simulates:
├── Sector impacts (Airlines -15%, Energy +20%)
├── Index impacts (S&P -5%, NASDAQ -6%)
├── Crypto impacts (BTC -3%, ETH -4%)
├── Forex impacts (USD strengthens)
├── Bond impacts (inflation fears)
└── Portfolio-specific impact
```

---

## Layer 16: Trader Layer (Ports 5210-5214)

```
Mistake Detection Engine (5211)

Detects:
├── Revenge Trading
├── Overtrading
├── Position Sizing Errors
├── FOMO Entries
├── Panic Selling
├── Confirmation Bias
└── Average Down Mistakes
```

---

## Layers 17-20: Enterprise + Marketplace + API + Execution

| Layer | Ports | Purpose |
|-------|-------|---------|
| Enterprise | 5220-5224 | Teams, collaboration, permissions |
| Marketplace | 5230-5234 | Research, models, strategies, data |
| API Platform | 5240-5246 | External API access |
| Execution | 5250-5252 | Broker integration, paper trading |

---

## Complete Service Port Registry

```
CORE TIER (5000-5029)
5001  Asset Universe Service
5002  Asset Twin Service
5003  Market Twin Service
5004  Portfolio Twin Service
5005  Investor/Trader Twin Service
5006  Intelligence Twin Service

DATA TIER (5030-5069)
5010  Market Data Service
5011  Financial Data Service
5012  Earnings Service
5013  News Service
5014  Social Sentiment Service
5015  Macro Data Service
5016  Regulatory Service
5017  On-Chain Data Service
5018  Institutional Data Service
5019  Options Data Service
5020  Fund Flow Service
5021  Analyst Data Service
5022  Geopolitical Data Service
5023  Economic Calendar Service
5030  Asset Memory Service
5031  Event Memory Service
5032  News Memory Service
5033  Prediction Memory Service
5040  Knowledge Graph Service
5041  Relationship Service
5042  Graph Query Service

INTELLIGENCE TIER (5050-5099)
5050  Financial Intelligence Engine
5051  News Intelligence Engine
5052  Sentiment Intelligence Engine
5053  Risk Intelligence Engine
5054  Event Intelligence Engine
5055  Institutional Intelligence Engine
5056  Analyst Intelligence Engine
5057  Macro Intelligence Engine
5058  Theme Intelligence Engine
5059  Sector Intelligence Engine
5060  Country Intelligence Engine

SCORING TIER (5070-5099)
5070  Health Score Service
5071  Opportunity Score Service
5072  Risk Score Service
5073  Sentiment Score Service
5074  Conviction Score Service
5075  Institutional Score Service
5076  Financial Score Service
5077  Technical Score Service
5078  Momentum Score Service

AGENT TIER (5100-5149)
5090  Agent Orchestrator
5091  Multi-Agent Router
5100  Asset Agent
5101  News Agent
5102  Sentiment Agent
5103  Quant Agent
5104  Macro Agent
5105  Risk Agent
5106  Portfolio Agent
5107  Earnings Agent
5108  Options Agent
5109  Research Agent
5110  Compliance Agent
5111  Discovery Agent
5112  Learning Agent

USER-FACING TIER (5150-5199)
5150  Decision Engine Service
5151  Answer Generation Service
5152  Reasoning Chain Service
5160  Prediction Service
5161  Probability Engine
5162  Confidence Engine
5163  Learning Service
5164  Outcome Tracker
5170  Morning Briefing Service
5171  Watchlist Briefing Service
5172  Portfolio Briefing Service
5173  Market Briefing Service
5174  Theme Briefing Service
5175  Risk Briefing Service
5176  Opportunity Briefing Service
5180  Opportunity Discovery Service
5181  Risk Discovery Service
5182  Theme Discovery Service
5183  Capital Flow Service
5184  Institutional Discovery Service
5185  Hidden Opportunity Service
5190  Report Generation Service
5191  Company Report Service
5192  Sector Report Service
5193  Country Report Service
5194  Theme Report Service
5195  Comparative Report Service

SIMULATION TIER (5200-5219)
5200  Scenario Simulator Service
5201  Monte Carlo Service
5202  Backtest Service
5210  Trade Journal Service
5211  Mistake Detection Service
5212  Behavior Analysis Service
5213  Performance Review Service
5214  Strategy Analysis Service

ENTERPRISE TIER (5220-5229)
5220  Team Service
5221  Collaboration Service
5222  Permissions Service
5223  Audit Service
5224  Custom Agent Service

MARKETPLACE TIER (5230-5239)
5230  Research Marketplace Service
5231  Model Marketplace Service
5232  Strategy Marketplace Service
5233  Data Marketplace Service
5234  Agent Marketplace Service

API TIER (5240-5249)
5240  Asset API Service
5241  Prediction API Service
5242  News API Service
5243  Sentiment API Service
5244  Risk API Service
5245  Knowledge Graph API Service
5246  Research API Service

EXECUTION TIER (5250-5259)
5250  Broker Integration Service
5251  Paper Trading Service
5252  Trade Automation Service

GATEWAY TIER (5260-5279)
5260  API Gateway
5261  WebSocket Gateway
5262  Webhook Service
5263  Auth Service (RABTUL)
5264  Payment Service (RABTUL)
5265  Notification Service (RABTUL)
5266  Analytics Service (HOJAI)

ADMIN TIER (5280-5299)
5280  Admin Dashboard
5281  User Management
5282  Data Management
5283  System Health
5284  Billing Service
5285  Subscription Service
```

---

## REZ Ecosystem Integration

```
AssetMind uses REZ ecosystem as LICENSED INFRASTRUCTURE

LICENSED FROM HOJAI-AI:
├── Memory Platform (4540) → Asset Memory Engine
├── Knowledge Graph (4786) → Financial Knowledge Graph
├── Digital Twin (4924) → Asset Twin Engine ref
├── CFO Brain (4920) → Financial Analysis ref
├── NL Interface (4925) → Natural Language Query
├── Explainability (4911) → Prediction explainability
├── Policy Learning (4921) → Prediction learning
├── Enterprise Brain (4600) → Central orchestration
├── API Gateway (4605) → API infrastructure
└── Analytics (4604) → Usage analytics

LICENSED FROM RABTUL-TECHNOLOGIES:
├── Auth Service → User authentication
├── Wallet Service → Credits, subscriptions
├── Payment Service → Transaction processing
└── Notification → Email, SMS, push

AssetMind BUILDS ITS OWN (100% owned IP):
├── All Twin Services
├── All Intelligence Engines
├── All AI Agents
├── All User-Facing Services
├── All Frontend Applications
├── Asset Twin Data
├── Knowledge Graph Data
├── Prediction History
└── All trained models
```

---

## Tech Stack

```
AI LAYER
├── Claude 3.5 Sonnet (reasoning, reports)
├── GPT-4o (fast classification)
├── DeepSeek (cost-effective)
└── HOJAI (licensed infrastructure)

BACKEND
├── Python 3.12
├── FastAPI
├── Celery + Redis
└── WebSockets

DATABASES
├── PostgreSQL 16 (business logic)
├── TimescaleDB (time-series)
├── Neo4j (knowledge graph)
├── Pinecone (vector embeddings)
└── ClickHouse (analytics)

FRONTEND
├── Next.js 14
├── Tailwind CSS + shadcn/ui
├── TradingView (charts)
├── Zustand (state)
└── Socket.IO (real-time)

INFRASTRUCTURE
├── AWS (primary)
├── Docker + Docker Compose
├── CloudFlare (CDN)
├── Grafana + Prometheus
└── GitHub Actions (CI/CD)
```

---

## 10-Year Phased Roadmap

```
Phase 1: Foundation (Months 1-12)
─────────────────────────────────
Goal: Working platform with 455 assets
25 core services built
First 1,000 users

Phase 2: Intelligence Expansion (Months 13-24)
─────────────────────────────────
Goal: Global coverage, Pro tier revenue
API platform beta
First paying customers

Phase 3: Institutional Features (Months 25-36)
─────────────────────────────────
Goal: Enterprise customers, white-label
Prediction learning network operational
API revenue begins

Phase 4: Scale + Moat (Years 4-5)
─────────────────────────────────
Goal: Market leader
50,000+ assets
100,000+ subscribers

Phase 5: Infrastructure Platform (Years 6-10)
─────────────────────────────────
Goal: Become the infrastructure layer
Power Bloomberg, TradingView, banks, fintechs
IPO or strategic acquisition at $1B+
```

---

## Team Structure

```
Phase 1 (Year 1): 4 people
─────────────────────────────────
• Founder (you) — Product, vision, strategy
• AI/ML Engineer — Agent layer, prediction, learning
• Full-Stack Engineer — Web app, API, pipelines
• Data Engineer — Data pipelines, sources

Phase 2 (Year 2): 8-12 people
─────────────────────────────────
Add: Financial Domain Expert, PM, Designer, Customer Success

Phase 3 (Year 3): 20-30 people
─────────────────────────────────
Engineering, Research, Sales, Enterprise teams

Phase 4+ (Year 4+): Scale to 100+
─────────────────────────────────
Standard growth structure
```

---

## The Five Permanent Moats

```
1. Asset Twin Network
   Every asset, fully understood forever.

2. Financial Knowledge Graph
   Every relationship, mapped and updated.

3. Financial Memory System
   Everything remembered, forever.

4. Prediction Learning Network
   Predictions improve with age.

5. Investor/Trader Twin
   Personalized intelligence for every user.
```

---

**AssetMind: The world's most advanced Financial Intelligence Infrastructure.**

*Even if OpenAI, Anthropic, Google, and Bloomberg all try to build this, they cannot copy our Asset Twin Network, Financial Memory, and Prediction Learning Network — because these are built from millions of data points collected over years.*
