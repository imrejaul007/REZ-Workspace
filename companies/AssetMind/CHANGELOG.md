# Changelog

## [2.0.0] - June 9, 2026

### Added

#### New Services (10 services)

- **assetmind-multiagent** (Port 5190)
  - 10 specialized AI agents (FinRobot-inspired)
  - Market, Fundamental, Technical, Sentiment, Risk, Portfolio, Research, Economic, Insider, Whale agents
  - Multi-agent collaboration and synthesis

- **assetmind-semantic-search** (Port 5170)
  - AlphaSense-style natural language search
  - Entity extraction and comparison
  - Trending topics and sector analysis

- **assetmind-rl-trading** (Port 5180)
  - FinRL-style deep reinforcement learning
  - 5 RL agents: DQN, PPO, A2C, SAC, TD3
  - Backtesting and trade signal generation

- **assetmind-memory** (Port 5030)
  - Financial memory service
  - Prediction storage and outcome tracking
  - Learning loop for model improvement

- **assetmind-briefing** (Port 5200)
  - Daily intelligence briefings
  - Market regime analysis
  - Economic calendar and earnings

- **assetmind-capital-flow** (Port 5183)
  - ETF flows tracking
  - Institutional and whale activity
  - Sector rotation detection

- **assetmind-research** (Port 5130)
  - AI-powered research reports
  - Peer analysis and earnings analysis

- **assetmind-execution** (Port 5161)
  - Smart order routing
  - Fill execution and tracking

- **assetmind-admin** (Port 5251)
  - User management
  - Billing and revenue analytics

- **assetmind-db** (Port 5432)
  - Database abstraction layer
  - PostgreSQL/TimescaleDB integration
  - Neo4j and Redis integration

#### New Features

- **RexMind AI Model** (Port 5160)
  - Proprietary 75M parameter financial model
  - Price, volatility, regime, sentiment prediction
  - Custom financial tokenizer
  - Multi-head transformer architecture

- **assetmind-mobile** (Expo React Native)
  - Home, Discover, Search, Watchlist, Portfolio screens

- **Competitive Analysis** (docs/COMPETITIVE-ANALYSIS.md)
  - Bloomberg, TradingView, AlphaSense, FinRobot, FinRL research

### Enhanced

- **assetmind-kronos** → RexMind
  - Integrated proprietary RexMind model

- **assetmind-knowledge-graph**
  - Supply chain mapping (NVIDIA→TSMC→Taiwan)

---

## [1.0.0] - June 5, 2026

### Added

- All 75+ microservices implemented
- 10 data connectors
- 9 scoring services
- 13 AI agents
- 4 memory services
- 3 knowledge graph services
- 11 intelligence engines
- CI/CD workflows
- Docker support for all services
- Python SDK and TypeScript SDK
- Complete API documentation