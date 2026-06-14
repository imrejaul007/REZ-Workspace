# AssetMind — Tech Stack & Infrastructure

**Version:** 1.0  
**Date:** June 5, 2026

---

## Architecture Overview

```
AssetMind Technology Stack
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                               │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  Next.js 14 (App Router)                                   │  │
│   │  ├── React 18 with Server Components                       │  │
│   │  ├── TypeScript                                             │  │
│   │  ├── Tailwind CSS + shadcn/ui                             │  │
│   │  ├── Recharts ( charting )                                 │  │
│   │  ├── TradingView (embedded charts)                        │  │
│   │  ├── Zustand (state management)                           │  │
│   │  ├── Socket.IO Client (real-time)                        │  │
│   │  └── Framer Motion (animations)                          │  │
│   │                                                             │  │
│   │  Mobile: React Native (future)                            │  │
│   └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                           │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  API Gateway (Port 5260)                                  │  │
│   │  ├── Rate limiting                                        │  │
│   │  ├── Authentication (RABTUL Auth)                        │  │
│   │  ├── Request routing                                      │  │
│   │  ├── Response caching                                    │  │
│   │  └── API versioning                                      │  │
│   │                                                             │  │
│   │  WebSocket Gateway (Port 5261)                            │  │
│   │  ├── Real-time price updates                              │  │
│   │  ├── Alert notifications                                  │  │
│   │  └── Live briefings                                       │  │
│   └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER (30+ Services)                    │
│                                                                     │
│   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│   │  CORE     │ │  TWIN     │ │   DATA     │ │INTELLIGENCE│      │
│   │  TIER     │ │  TIER     │ │   TIER     │ │   TIER     │      │
│   │  5001-29  │ │ 5002-06  │ │ 5010-69   │ │ 5050-99   │      │
│   └────────────┘ └────────────┘ └────────────┘ └────────────┘      │
│                                                                     │
│   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│   │  AGENT    │ │  USER     │ │SIMULATION │ │ENTERPRISE │      │
│   │  TIER     │ │  FACING   │ │   TIER     │ │   TIER     │      │
│   │ 5100-149 │ │ 5150-199 │ │ 5200-219  │ │ 5220-299  │      │
│   └────────────┘ └────────────┘ └────────────┘ └────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        AI LAYER                                    │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  AI Model Router                                            │  │
│   │  ├── Claude 3.5 Sonnet (Reasoning, Reports)               │  │
│   │  ├── GPT-4o (Fast queries, Classification)                 │  │
│   │  ├── DeepSeek R1 (Cost-effective reasoning)               │  │
│   │  └── HOJAI (Memory, Knowledge Graph, Agents)                │  │
│   │                                                             │  │
│   │  ┌─────────────────────────────────────────────────────┐  │  │
│   │  │  Agent Orchestrator (5090)                          │  │  │
│   │  │  13 Specialized Agents (5100-5112)                 │  │  │
│   │  └─────────────────────────────────────────────────────┘  │  │
│   └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                   │
│                                                                     │
│   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│   │ PostgreSQL │ │ TimescaleDB │ │   Neo4j   │ │  Pinecone  │      │
│   │            │ │            │ │           │ │            │      │
│   │ Business   │ │ Time-series│ │ Knowledge │ │  Vector    │      │
│   │ Logic      │ │ Prices     │ │  Graph    │ │ Embeddings │      │
│   │ Twins      │ │ Scores     │ │ Relations │ │  Semantic  │      │
│   │ Users      │ │ History    │ │           │ │   Search   │      │
│   └────────────┘ └────────────┘ └────────────┘ └────────────┘      │
│                                                                     │
│   ┌────────────┐ ┌────────────┐ ┌────────────┐                      │
│   │ ClickHouse │ │    S3     │ │    Redis   │                      │
│   │            │ │            │ │            │                      │
│   │ Analytics  │ │ File Store │ │  Caching   │                      │
│   │ Dashboards │ │ Raw Data   │ │  Streams   │                      │
│   │ Reports    │ │ Backups    │ │   Queue    │                      │
│   └────────────┘ └────────────┘ └────────────┘                      │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  HOJAI Memory Platform (Licensed - Port 4540)              │  │
│   │  ├── remember() — Store                                    │  │
│   │  ├── recall() — Retrieve                                  │  │
│   │  ├── profile() — Build profiles                           │  │
│   │  └── reason() — Connect memories                          │  │
│   └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Complete Service Registry

```
AssetMind Service Registry (Ports 5000-5299)
═══════════════════════════════════════════════════════════════════════

CORE TIER (5000-5029)
─────────────────────────────────────────────────────────────────
5001  Asset Universe Service          — Asset registry
5002  Asset Twin Service             — Asset Digital Twin
5003  Market Twin Service            — Market conditions
5004  Portfolio Twin Service         — User portfolios
5005  Investor Twin Service           — Investor behavior
5006  Intelligence Twin Service       — Prediction learning

DATA TIER (5030-5069)
─────────────────────────────────────────────────────────────────
5010  Market Data Service            — Prices, OHLCV
5011  Financial Data Service         — SEC EDGAR, filings
5012  Earnings Service               — Earnings, transcripts
5013  News Service                   — Financial news
5014  Social Sentiment Service       — Reddit, social
5015  Macro Data Service             — FRED, economic
5016  Regulatory Service             — SEC, compliance
5017  On-Chain Service               — Crypto blockchain
5018  Institutional Service           — 13F, whale tracking
5019  Options Service               — Options chains
5020  Fund Flow Service              — ETF flows
5021  Analyst Service                — Ratings, targets
5022  Geopolitical Service           — Events, news
5023  Economic Calendar Service       — GDP, CPI, rates
5030  Asset Memory Service           — Memory connector
5031  Event Memory Service           — Event storage
5032  News Memory Service            — News archive
5033  Prediction Memory Service       — Prediction history
5040  Knowledge Graph Service        — Graph DB connector
5041  Relationship Service           — Relationship mapping
5042  Graph Query Service           — Graph queries

INTELLIGENCE TIER (5050-5099)
─────────────────────────────────────────────────────────────────
5050  Financial Intelligence Engine   — DCF, ratios, scoring
5051  News Intelligence Engine       — Summarization, impact
5052  Sentiment Intelligence Engine  — Social, news sentiment
5053  Risk Intelligence Engine       — Risk scoring
5054  Event Intelligence Engine      — Earnings, macro events
5055  Institutional Intelligence     — 13F, whale activity
5056  Analyst Intelligence Engine    — Ratings, estimates
5057  Macro Intelligence Engine      — Rates, inflation, GDP
5058  Theme Intelligence Engine      — AI, EV, defense themes
5059  Sector Intelligence Engine     — Sector analysis
5060  Country Intelligence Engine    — Country risk/opportunity

SCORING TIER (5070-5099)
─────────────────────────────────────────────────────────────────
5070  Health Score Service           — Overall health
5071  Opportunity Score Service       — Bullish potential
5072  Risk Score Service             — Downside risk
5073  Sentiment Score Service         — Sentiment bias
5074  Conviction Score Service        — Thesis strength
5075  Institutional Score Service     — Institutional interest
5076  Financial Score Service         — Fundamental health
5077  Technical Score Service         — Technical health
5078  Momentum Score Service          — Trend strength

AGENT TIER (5100-5149)
─────────────────────────────────────────────────────────────────
5090  Agent Orchestrator             — Central router
5091  Multi-Agent Router             — Model routing
5100  Asset Agent                    — Asset specialist
5101  News Agent                     — News intelligence
5102  Sentiment Agent               — Sentiment analysis
5103  Quant Agent                    — Technical analysis
5104  Macro Agent                   — Macro intelligence
5105  Risk Agent                    — Risk assessment
5106  Portfolio Agent               — Portfolio management
5107  Earnings Agent                — Earnings intelligence
5108  Options Agent                 — Options analytics
5109  Research Agent                — Report generation
5110  Compliance Agent              — Regulatory watch
5111  Discovery Agent               — Opportunity finding
5112  Learning Agent               — System improvement

USER-FACING TIER (5150-5199)
─────────────────────────────────────────────────────────────────
5150  Decision Engine Service        — What to do
5151  Answer Generation Service       — AI responses
5152  Reasoning Chain Service        — Explainability
5160  Prediction Service             — Probability engine
5161  Probability Engine             — Probabilities
5162  Confidence Engine              — Confidence scoring
5163  Learning Service               — Outcome tracking
5164  Outcome Tracker               — Prediction results
5170  Morning Briefing Service       — Daily briefing
5171  Watchlist Briefing Service     — Watchlist updates
5172  Portfolio Briefing Service     — Portfolio changes
5173  Market Briefing Service       — Market overview
5174  Theme Briefing Service        — Theme intelligence
5175  Risk Briefing Service         — Risk alerts
5176  Opportunity Briefing Service  — Opportunity alerts
5180  Opportunity Discovery Service — Proactive ideas
5181  Risk Discovery Service        — Proactive risks
5182  Theme Discovery Service       — Emerging themes
5183  Capital Flow Service           — Money rotation
5184  Institutional Discovery        — Whale tracking
5185  Hidden Opportunity Service    — "You might be missing"
5190  Report Generation Service     — AI research committee
5191  Company Report Service        — Company research
5192  Sector Report Service         — Sector research
5193  Country Report Service        — Country research
5194  Theme Report Service          — Theme research
5195  Comparative Report Service    — Comparison reports

SIMULATION TIER (5200-5219)
─────────────────────────────────────────────────────────────────
5200  Scenario Simulator Service    — What-if analysis
5201  Monte Carlo Service           — Probability simulation
5202  Backtest Service              — Strategy testing
5210  Trade Journal Service         — User journals
5211  Mistake Detection Service     — Behavior analysis
5212  Behavior Analysis Service     — Pattern detection
5213  Performance Review Service   — Performance tracking
5214  Strategy Analysis Service    — Strategy analysis

ENTERPRISE TIER (5220-5229)
─────────────────────────────────────────────────────────────────
5220  Team Service                  — Team management
5221  Collaboration Service         — Shared workspaces
5222  Permissions Service          — Access control
5223  Audit Service                 — Activity logs
5224  Custom Agent Service          — Bespoke agents

MARKETPLACE TIER (5230-5239)
─────────────────────────────────────────────────────────────────
5230  Research Marketplace Service  — Research reports
5231  Model Marketplace Service     — Trained models
5232  Strategy Marketplace Service  — Trading strategies
5233  Data Marketplace Service      — Premium datasets
5234  Agent Marketplace Service     — Agent templates

API TIER (5240-5249)
─────────────────────────────────────────────────────────────────
5240  Asset API Service              — Asset endpoints
5241  Prediction API Service         — Prediction endpoints
5242  News API Service              — News endpoints
5243  Sentiment API Service         — Sentiment endpoints
5244  Risk API Service              — Risk endpoints
5245  Knowledge Graph API Service   — Graph endpoints
5246  Research API Service          — Research endpoints

EXECUTION TIER (5250-5259)
─────────────────────────────────────────────────────────────────
5250  Broker Integration Service    — Broker connections
5251  Paper Trading Service        — Paper trading
5252  Trade Automation Service      — Automated execution

GATEWAY TIER (5260-5279)
─────────────────────────────────────────────────────────────────
5260  API Gateway                   — Main API gateway
5261  WebSocket Gateway             — Real-time connections
5262  Webhook Service               — Outbound webhooks
5263  Auth Service                  — RABTUL Auth (licensed)
5264  Payment Service               — RABTUL Payment (licensed)
5265  Notification Service          — RABTUL Notification (licensed)
5266  Analytics Service             — HOJAI Analytics (licensed)

ADMIN TIER (5280-5299)
─────────────────────────────────────────────────────────────────
5280  Admin Dashboard               — Admin interface
5281  User Management               — User administration
5282  Data Management               — Data administration
5283  System Health                 — Health monitoring
5284  Billing Service               — Billing management
5285  Subscription Service          — Subscription management
```

---

## Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

PostgreSQL 16 (Business Logic & Twins)
─────────────────────────────────────────────────────────────────

SCHEMAS:

public
├── assets
│   ├── id (UUID, PK)
│   ├── symbol (VARCHAR)
│   ├── name (VARCHAR)
│   ├── asset_class (ENUM)
│   ├── exchange (VARCHAR)
│   ├── country (VARCHAR)
│   ├── currency (VARCHAR)
│   ├── status (ENUM)
│   ├── metadata (JSONB)
│   └── timestamps
│
├── asset_twins
│   ├── asset_id (UUID, FK → assets)
│   ├── financial_score (JSONB)
│   ├── sentiment (JSONB)
│   ├── risk_assessment (JSONB)
│   ├── prediction (JSONB)
│   ├── health_scores (JSONB)
│   └── last_updated
│
├── market_twins
│   ├── id (UUID, PK)
│   ├── regime (ENUM)
│   ├── global_score (FLOAT)
│   ├── regional_scores (JSONB)
│   ├── sector_rankings (JSONB)
│   └── timestamps
│
├── portfolio_twins
│   ├── user_id (UUID, FK → users)
│   ├── holdings (JSONB)
│   ├── analytics (JSONB)
│   ├── risk_analytics (JSONB)
│   ├── exposure (JSONB)
│   └── last_updated
│
├── investor_twins
│   ├── user_id (UUID, FK → users)
│   ├── profile (JSONB)
│   ├── behavior (JSONB)
│   ├── mistakes (JSONB)
│   ├── coaching (JSONB)
│   └── last_updated
│
├── predictions
│   ├── id (UUID, PK)
│   ├── asset_id (UUID, FK → assets)
│   ├── prediction_type (VARCHAR)
│   ├── prediction_value (JSONB)
│   ├── confidence (FLOAT)
│   ├── reasoning (JSONB)
│   ├── model_used (VARCHAR)
│   ├── outcome (JSONB)
│   └── timestamp
│
├── users
│   ├── id (UUID, PK)
│   ├── email (VARCHAR)
│   ├── password_hash (VARCHAR)
│   ├── subscription_tier (ENUM)
│   └── timestamps
│
└── watchlists
    ├── user_id (UUID, FK → users)
    ├── assets (UUID[])
    └── last_updated


TimescaleDB (Time-Series)
─────────────────────────────────────────────────────────────────

price_history
├── time (TIMESTAMPTZ)
├── symbol (VARCHAR)
├── open (FLOAT)
├── high (FLOAT)
├── low (FLOAT)
├── close (FLOAT)
├── volume (FLOAT)
└── metadata (JSONB)
→ Continuous aggregate: price_stats_1d (daily OHLCV)
→ Continuous aggregate: price_stats_1h (hourly OHLCV)

score_history
├── time (TIMESTAMPTZ)
├── symbol (VARCHAR)
├── score_type (VARCHAR) — 'opportunity', 'risk', 'sentiment', etc.
├── value (FLOAT)
└── metadata (JSONB)
→ Continuous aggregate: score_avg_7d (7-day rolling average)
→ Continuous aggregate: score_avg_30d (30-day rolling average)

sentiment_history
├── time (TIMESTAMPTZ)
├── symbol (VARCHAR)
├── source (VARCHAR) — 'social', 'news', 'analyst'
├── sentiment_value (FLOAT) — -100 to 100
└── volume (INT)
→ Continuous aggregate: sentiment_agg_1d

prediction_history
├── time (TIMESTAMPTZ)
├── symbol (VARCHAR)
├── prediction_type (VARCHAR)
├── probability (FLOAT)
├── confidence (FLOAT)
├── actual_outcome (FLOAT)
├── correct (BOOLEAN)
└── error (FLOAT)


Neo4j (Knowledge Graph)
─────────────────────────────────────────────────────────────────

NODE TYPES:

:Company
  ├── symbol (String)
  ├── name (String)
  ├── sector (String)
  ├── industry (String)
  └── properties...

:Country
  ├── code (String)
  ├── name (String)
  └── properties...

:Sector
  ├── name (String)
  └── properties...

:Theme
  ├── name (String)
  └── properties...

:Event
  ├── type (String)
  ├── date (Date)
  └── properties...

:Regulation
  ├── name (String)
  └── properties...


RELATIONSHIP TYPES:

(Company)-[:SUPPLIES_TO]->(Company)
(Company)-[:CUSTOMER_OF]->(Company)
(Company)-[:COMPETES_WITH]->(Company)
(Company)-[:PARTNERED_WITH]->(Company)
(Company)-[:ACQUIRED]->(Company)
(Company)-[:LOCATED_IN]->(Country)
(Company)-[:AFFECTED_BY_RATE]->(Event)
(Company)-[:AFFECTED_BY_GEO]->(Event)
(Company)-[:LEADS_THEME]->(Theme)
(Company)-[:BELONGS_TO_SECTOR]->(Sector)
(Company)-[:SIMILAR_TO]->(Company)
(Sector)-[:AFFECTED_BY_RATE]->(Event)
(Country)-[:AFFECTS]->(Company)
(Theme)-[:CONTAINS]->(Company)


Pinecone (Vector Embeddings)
─────────────────────────────────────────────────────────────────

NAMESPACES:

news-embeddings
├── id (String)
├── vector (float[1536])
├── article_id (String)
├── title (String)
├── published_at (Timestamp)
├── asset_symbols (String[])
└── source (String)

report-embeddings
├── id (String)
├── vector (float[1536])
├── report_id (String)
├── report_type (String) — 'company', 'sector', 'theme'
└── asset_symbols (String[])

transcript-embeddings
├── id (String)
├── vector (float[1536])
├── transcript_id (String)
├── company_symbol (String)
└── earnings_date (Date)


ClickHouse (Analytics)
─────────────────────────────────────────────────────────────────

prediction_analytics
├── date (Date)
├── asset_class (String)
├── prediction_count (UInt64)
├── accuracy_rate (Float64)
├── avg_confidence (Float64)
└── by_time_horizon (JSONB)

user_behavior_analytics
├── date (Date)
├── daily_active_users (UInt64)
├── queries_per_day (UInt64)
├── feature_usage (JSONB)
└── subscription_tier (String)

market_analytics
├── date (Date)
├── assets_with_updates (UInt64)
├── data_freshness_avg (Float64)
├── quality_score (Float64)
└── by_asset_class (JSONB)
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────┘

Phase 1-2 (Current): Docker Compose on AWS EC2
─────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   AWS EC2 Instance (t3.large)                              │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                                                     │  │
│   │   Docker Compose                                    │  │
│   │                                                     │  │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐              │  │
│   │   │Service 1│ │Service 2│ │Service 3│              │  │
│   │   │  :5001  │ │  :5002  │ │  :5003  │              │  │
│   │   └─────────┘ └─────────┘ └─────────┘              │  │
│   │                                                     │  │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐              │  │
│   │   │Service 4│ │Service 5│ │Service 6│              │  │
│   │   │  :5004  │ │  :5005  │ │  :5006  │              │  │
│   │   └─────────┘ └─────────┘ └─────────┘              │  │
│   │                                                     │  │
│   │   ┌─────────────────────────────────────────────┐  │  │
│   │   │              PostgreSQL + Redis              │  │  │
│   │   └─────────────────────────────────────────────┘  │  │
│   │                                                     │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                │
                │ Port 80/443
                ▼
┌─────────────────────────────────────────────────────────────┐
│                    CloudFlare CDN                            │
│                 (SSL, DDoS protection)                       │
└─────────────────────────────────────────────────────────────┘


Phase 3-4 (Growth): Kubernetes on AWS EKS
─────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   AWS EKS (Elastic Kubernetes Service)                      │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                                                     │   │
│   │   Services (Auto-scaling pods)                     │   │
│   │                                                     │   │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐        │   │
│   │   │Twin Pods │  │Data Pods │  │Agent Pods│        │   │
│   │   └──────────┘  └──────────┘  └──────────┘        │   │
│   │                                                     │   │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐        │   │
│   │   │ UI Pods  │  │API Pods  │  │Worker Pods│       │   │
│   │   └──────────┘  └──────────┘  └──────────┘        │   │
│   │                                                     │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │         Managed Services                            │   │
│   │                                                     │   │
│   │   AWS RDS (PostgreSQL)  │  AWS ElastiCache (Redis) │   │
│   │   AWS Neptune (Graph)    │  Pinecone (Vectors)      │   │
│   │   ClickHouse Cloud       │  S3 (File storage)       │   │
│   │                                                     │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                │
                │ Global CDN
                ▼
┌─────────────────────────────────────────────────────────────┐
│                    CloudFlare CDN                            │
│                                                             │
│   • Global edge caching                                     │
│   • DDoS protection                                         │
│   • SSL termination                                         │
│   • Load balancing                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                        CI/CD PIPELINE                           │
└─────────────────────────────────────────────────────────────────┘

GitHub Actions Workflows:
─────────────────────────────────────────────────────────────────

1. PR Workflow (.github/workflows/pr.yml)
   ────────────────────────────────────────
   Trigger: Pull Request
   Jobs:
   ├── lint
   │   └── ESLint, Prettier, Black
   ├── type-check
   │   └── TypeScript, mypy
   ├── test
   │   └── pytest (unit tests)
   ├── build
   │   └── Docker build
   └── security
       └── Snyk, Bandit

2. Main Workflow (.github/workflows/main.yml)
   ────────────────────────────────────────────
   Trigger: Push to main
   Jobs:
   ├── test
   ├── build
   ├── deploy-staging
   │   └── Deploy to staging environment
   └── notify
       └── Slack notification

3. Release Workflow (.github/workflows/release.yml)
   ────────────────────────────────────────────────
   Trigger: New tag (v*)
   Jobs:
   ├── build-production
   │   └── Multi-arch Docker build
   ├── deploy-production
   │   └── Rolling deployment to production
   ├── run-migrations
   │   └── Database migrations
   └── notify
       └── GitHub release, Slack


Docker Configuration:
─────────────────────────────────────────────────────────────────

FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]

# Multi-stage build for smaller image
# Build stage → Production stage


Docker Compose (Development):
─────────────────────────────────────────────────────────────────

version: '3.8'

services:
  api:
    build: .
    ports:
      - "5001:5001"
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://...
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  neo4j:
    image: neo4j:5
    ports:
      - "7474:7474"
      - "7687:7687"

volumes:
  postgres_data:
  redis_data:
```

---

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────────┐
│                     MONITORING STACK                             │
└─────────────────────────────────────────────────────────────────┘

Metrics: Prometheus + Grafana
─────────────────────────────────────────────────────────────────

Prometheus Metrics Exposed by Each Service:
├── http_requests_total (counter)
├── http_request_duration_seconds (histogram)
├── active_connections (gauge)
├── prediction_accuracy (gauge)
├── cache_hit_ratio (gauge)
└── queue_depth (gauge)

Grafana Dashboards:
├── System Overview (CPU, Memory, Network)
├── Service Health (latency, error rate)
├── Business Metrics (users, predictions, revenue)
└── AI Metrics (model latency, token usage)


Logging: Loki + Grafana
─────────────────────────────────────────────────────────────────

Log Format (JSON):
{
  "timestamp": "ISO8601",
  "level": "INFO|WARN|ERROR",
  "service": "service-name",
  "message": "...",
  "trace_id": "uuid",
  "user_id": "uuid",
  "metadata": {...}
}


Tracing: OpenTelemetry
─────────────────────────────────────────────────────────────────

Traces captured:
├── HTTP requests (incoming)
├── Database queries
├── External API calls
├── AI model inference
└── Agent orchestration

Trace context propagated through:
├── HTTP headers
├── Redis pub/sub
└── Message queues


Alerting: Grafana Alerting
─────────────────────────────────────────────────────────────────

Alerts:
├── Service Down (immediate)
├── High Error Rate (>5% for 5 min)
├── High Latency (>2s for 5 min)
├── Disk Space (>80%)
├── Database Connection Pool (>80%)
└── Prediction Accuracy Drop (<50%)

Notification Channels:
├── Slack (#alerts)
├── PagerDuty (critical)
└── Email (digest)
```

---

## Security

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY                                  │
└─────────────────────────────────────────────────────────────────┘

Infrastructure Security:
─────────────────────────────────────────────────────────────────

• AWS VPC with private subnets
• Security groups (least privilege)
• IAM roles (no access keys)
• Secrets managed in AWS Secrets Manager
• SSL/TLS (CloudFlare + AWS ACM)


Application Security:
─────────────────────────────────────────────────────────────────

Authentication:
├── RABTUL Auth (licensed) for user auth
├── API keys for API access
├── JWT tokens with refresh
└── 2FA support (future)

Authorization:
├── Role-based access control (RBAC)
├── Subscription tier permissions
├── API rate limiting
└── Resource-level permissions

Data Protection:
├── Encryption at rest (AES-256)
├── Encryption in transit (TLS 1.3)
├── PII handling compliance (GDPR ready)
└── Data retention policies


Code Security:
─────────────────────────────────────────────────────────────────

• Dependency scanning (Snyk, npm audit)
• SAST (Bandit for Python)
• DAST (OWASP ZAP in CI)
• Container scanning
• Secret scanning in git
```

---

## Cost Summary

```
Phase 1 Monthly Costs (MVP)
─────────────────────────────────────────────────────────────────

Infrastructure:
├── AWS EC2 (t3.large):           $70/month
├── AWS RDS (db.t3.micro):        $30/month
├── AWS ElastiCache (cache):      $25/month
├── S3 (storage):                 $10/month
└── CloudFlare (CDN):             $20/month

Services:
├── HOJAI License:                TBD (usage-based)
├── RABTUL Services:              Market rate
├── Pinecone:                     $70/month (starter)
├── Neo4j (cloud):                $65/month
└── ClickHouse Cloud:              $40/month

Total Phase 1:                    ~$330-500/month
─────────────────────────────────────────────────────────────────

Phase 3 Costs (Growth - 10K users)
─────────────────────────────────────────────────────────────────

Infrastructure:
├── AWS EKS (3 nodes):            $300/month
├── AWS RDS (db.r6g.large):       $150/month
├── AWS ElastiCache:               $100/month
├── S3:                            $50/month
└── CloudFlare:                    $100/month

Services:
├── HOJAI License:                ~$2,000/month
├── RABTUL Services:              ~$500/month
├── Pinecone:                     $400/month
├── Neo4j:                        $200/month
├── ClickHouse Cloud:              $200/month
└── AI Model Costs:               ~$5,000/month

Total Phase 3:                    ~$9,000-12,000/month
```

---

## Document Version

**Version:** 1.0  
**Last Updated:** June 5, 2026
