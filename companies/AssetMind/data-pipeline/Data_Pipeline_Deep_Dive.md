# AssetMind — Data Pipeline Architecture

**Version:** 1.0  
**Date:** June 5, 2026

---

## Overview

```
Data Pipeline Architecture
═══════════════════════════════════════════════════════════════════════

                    ┌─────────────────────────────────────────────┐
                    │          DATA SOURCES (20+)                 │
                    │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
                    │  │ Yahoo   │ │ SEC     │ │ Coin-   │       │
                    │  │ Finance │ │ EDGAR   │ │ Gecko   │       │
                    │  └────┬────┘ └────┬────┘ └────┬────┘       │
                    │       │           │           │             │
                    └───────┼───────────┼───────────┼─────────────┘
                            │           │           │
                            ▼           ▼           ▼
                    ┌─────────────────────────────────────────────┐
                    │         DATA INGESTION LAYER               │
                    │  ┌─────────────────────────────────────┐   │
                    │  │  Connectors (Source-specific)        │   │
                    │  │  • yfinance_connector              │   │
                    │  │  • sec_edgar_connector             │   │
                    │  │  • coingecko_connector             │   │
                    │  │  • fred_connector                  │   │
                    │  │  • reddit_connector                │   │
                    │  └─────────────────────────────────────┘   │
                    └────────────────────┬────────────────────────┘
                                         │
                                         ▼
                    ┌─────────────────────────────────────────────┐
                    │         STREAM PROCESSING LAYER             │
                    │  ┌─────────────────────────────────────┐   │
                    │  │  Apache Kafka / Redis Streams        │   │
                    │  │                                      │   │
                    │  │  Topics:                             │   │
                    │  │  • price-updates                     │   │
                    │  │  • news-articles                     │   │
                    │  │  • earnings-events                   │   │
                    │  │  • social-sentiment                  │   │
                    │  │  • regulatory-filings               │   │
                    │  └─────────────────────────────────────┘   │
                    └────────────────────┬────────────────────────┘
                                         │
                         ┌───────────────┼───────────────┐
                         │               │               │
                         ▼               ▼               ▼
               ┌─────────────────┐ ┌───────────┐ ┌───────────────┐
               │   INTELLIGENCE  │ │   TWIN   │ │   KNOWLEDGE   │
               │    ENGINES      │ │  ENGINES │ │    GRAPH      │
               │                 │ │           │ │               │
               │ • Financial IE  │ │ • Asset   │ │ • Neo4j       │
               │ • News IE       │ │   Twin   │ │ • Relations   │
               │ • Sentiment IE  │ │ • Market  │ │ • Graph       │
               │ • Risk IE       │ │   Twin   │ │   Queries     │
               │ • Macro IE      │ │ • Portfolio│ │               │
               │                 │ │   Twin   │ │               │
               └────────┬────────┘ └─────┬─────┘ └───────┬───────┘
                        │                │               │
                        └────────────────┼───────────────┘
                                         │
                                         ▼
               ┌─────────────────────────────────────────────┐
               │              STORAGE LAYER                   │
               │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
               │  │PostgreSQL│ │Timescale │ │  Neo4j  │       │
               │  │(Twins)  │ │   DB    │ │  (Graph)│       │
               │  └─────────┘ │(Prices) │ └─────────┘       │
               │              └─────────┘                    │
               │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
               │  │Pinecone │ │ClickHouse│ │  HOJAI  │       │
               │  │(Vectors)│ │(Analytics)│ │ Memory  │       │
               │  └─────────┘ └─────────┘ └─────────┘       │
               └─────────────────────────────────────────────┘
```

---

## Phase 1 Data Sources (Free)

### Market Data

```
┌─────────────────────────────────────────────────────────────────┐
│ YAHOO FINANCE CONNECTOR                                         │
│ Source: yfinance (Python library)                               │
│ Cost: FREE                                                      │
│ Rate Limit: ~2,000 requests/hour                                │
│ Data: OHLCV, fundamentals, splits, dividends                     │
└─────────────────────────────────────────────────────────────────┘

Capabilities:
├── Historical prices (up to 20 years)
├── Real-time quotes (15-min delay)
├── Fundamental data (income, balance, cash flow)
├── Key statistics (PE, EPS, market cap)
├── Splits and dividends
└── Options chains (basic)

Usage Pattern:
├── 250 US stocks → Poll every 5 minutes during market hours
├── 100 crypto → Poll every 1 minute (24/7)
└── 20 indices → Poll every 5 minutes

Implementation:
import yfinance as yf

ticker = yf.Ticker("NVDA")
hist = ticker.history(period="1d")  # Today's OHLCV
info = ticker.info  # Fundamental data
```

```
┌─────────────────────────────────────────────────────────────────┐
│ COINGECKO API CONNECTOR                                          │
│ Source: CoinGecko API                                           │
│ Cost: FREE (Rate limited: 10-50 calls/minute)                   │
│ Data: Crypto prices, market data, historical                    │
└─────────────────────────────────────────────────────────────────┘

Capabilities:
├── Current prices for top 10,000 coins
├── Historical OHLCV
├── Market data (volume, market cap, dominance)
├── Coin metadata (description, links, categories)
├── Historical market data (up to 365 days)

Usage Pattern:
├── Top 100 crypto → Poll every 1 minute
├── Price updates → WebSocket for real-time
└── Metadata → Update daily

Free Tier Limits:
├── 10-50 requests/minute
├── 100-600 requests/hour
└── Historical data limited to 1 year
```

```
┌─────────────────────────────────────────────────────────────────┐
│ ALPHA VANTAGE API                                               │
│ Source: Alpha Vantage                                          │
│ Cost: FREE (5 API calls/minute, 500/day)                       │
│ Data: Stocks, forex, commodities                               │
└─────────────────────────────────────────────────────────────────┘

Capabilities:
├── Intraday data
├── Daily, weekly, monthly prices
├── FX rates
├── Technical indicators
└── Sector performance

Usage Pattern:
├── Real-time quotes (limited free)
├── Daily data for backfill
└── Technical indicators for quant agent
```

### Financial Data

```
┌─────────────────────────────────────────────────────────────────┐
│ SEC EDGAR CONNECTOR                                             │
│ Source: SEC EDGAR (sec.gov/cgi-bin/browse-edgar)               │
│ Cost: FREE                                                      │
│ Rate Limit: 10 requests/second                                  │
│ Data: 10-K, 10-Q, 8-K, proxies, 13F filings                   │
└─────────────────────────────────────────────────────────────────┘

Capabilities:
├── Annual reports (10-K)
├── Quarterly reports (10-Q)
├── Current reports (8-K)
├── Proxy statements (DEF 14A)
├── 13F institutional holdings
├── S-1 filings (IPOs)
└── All SEC filings

Usage Pattern:
├── 10-K/10-Q → Download daily for earnings
├── 8-K → Real-time alerts for material events
├── 13F → Update quarterly for institutional holdings
└── All filings → Index and store in memory

Implementation:
├── Use SEC's full-text search (EFTS)
├── Parse XBRL for structured financial data
├── Store raw filings in S3/HOJAI Memory
└── Extract key metrics to PostgreSQL
```

```
┌─────────────────────────────────────────────────────────────────┐
│ FRED (FEDERAL RESERVE ECONOMIC DATA)                           │
│ Source: FRED API (fred.stlouisfed.org)                         │
│ Cost: FREE                                                      │
│ Data: Macro indicators, interest rates, GDP, employment         │
└─────────────────────────────────────────────────────────────────┘

Key Indicators:
├── Interest Rates
│   ├── Federal Funds Rate
│   ├── 10-Year Treasury Yield
│   ├── 2-Year Treasury Yield
│   ├── Mortgage Rates
│   └── Corporate Bond Rates
├── Inflation
│   ├── CPI (Consumer Price Index)
│   ├── Core CPI
│   ├── PPI (Producer Price Index)
│   └── PCE (Personal Consumption Expenditures)
├── GDP
│   ├── Real GDP
│   ├── GDP Growth Rate
│   └── GDP Components
├── Employment
│   ├── Unemployment Rate
│   ├── Non-Farm Payrolls
│   ├── Labor Force Participation
│   └── Job Openings (JOLTS)
└── Consumer
    ├── Consumer Confidence
    ├── Retail Sales
    └── Consumer Sentiment
```

### News Data

```
┌─────────────────────────────────────────────────────────────────┐
│ NEWS API CONNECTOR                                              │
│ Source: NewsAPI.org / GDELT / RSS Feeds                       │
│ Cost: FREE (limited)                                            │
│ Data: Financial news headlines and articles                     │
└─────────────────────────────────────────────────────────────────┘

Sources:
├── NewsAPI.org (free tier: 100 requests/day)
│   ├── Major news sources
│   └── Full-text search
├── GDELT Project (FREE, unlimited)
│   ├── Real-time news monitoring
│   ├── Global coverage
│   └── Sentiment analysis included
└── RSS Feeds (FREE)
    ├── Reuters
    ├── Bloomberg
    ├── CNBC
    └── Financial Times

Usage Pattern:
├── GDELT → Primary news source (free, unlimited)
├── NewsAPI → Supplement for specific queries
└── RSS → Direct source feeds
```

### Social/Sentiment Data

```
┌─────────────────────────────────────────────────────────────────┐
│ REDDIT API CONNECTOR                                            │
│ Source: Reddit API (praw)                                       │
│ Cost: FREE                                                      │
│ Data: Posts, comments, upvotes, sentiment                        │
└─────────────────────────────────────────────────────────────────┘

Key Subreddits:
├── r/wallstreetbets (retail sentiment)
├── r/investing (general investing)
├── r/stocks (stock discussion)
├── r/CryptoCurrency (crypto sentiment)
├── r/Bitcoin (Bitcoin specific)
├── r/ethereum (Ethereum specific)
└── r/ETF (ETF discussion)

Data Points:
├── Post titles and content
├── Upvotes/downvotes (sentiment proxy)
├── Number of comments
├── User awards
├── Post sentiment (NLP)
└── Comment sentiment (NLP)

Usage Pattern:
├── Top posts → Poll every 15 minutes
├── Sentiment analysis → Real-time
└── Viral posts → Immediate alert
```

```
┌─────────────────────────────────────────────────────────────────┐
│ CRYPTOCOMPARE API                                              │
│ Source: CryptoCompare                                          │
│ Cost: FREE (limited)                                           │
│ Data: Crypto social metrics, prices                            │
└─────────────────────────────────────────────────────────────────┘

Social Data:
├── Twitter/X mentions
├── Reddit posts and comments
├── Code repository activity (GitHub)
├── Telegram members
├── Facebook likes
└── Social sentiment scores

Usage Pattern:
├── Social metrics → Update hourly
├── Sentiment → Real-time scoring
└── Whale alerts → Immediate notification
```

### Alternative Data

```
┌─────────────────────────────────────────────────────────────────┐
│ DUNE ANALYTICS (FREE TIER)                                     │
│ Source: Dune.com                                               │
│ Cost: FREE (community queries)                                  │
│ Data: On-chain metrics, whale activity, DeFi TVL               │
└─────────────────────────────────────────────────────────────────┘

Free Queries Available:
├── Bitcoin whale transactions (>100 BTC)
├── Stablecoin flows
├── DEX volumes
├── NFT marketplace volumes
├── Ethereum gas prices
├── DeFi TVL tracking
└── Exchange flows

Usage Pattern:
├── Whale alerts → Real-time monitoring
├── TVL tracking → Daily updates
└── DEX volumes → Hourly aggregation
```

```
┌─────────────────────────────────────────────────────────────────┐
│ DEFILAMA                                                       │
│ Source: DeFiLlama API                                          │
│ Cost: FREE                                                      │
│ Data: DeFi protocols TVL, yields, volume                        │
└─────────────────────────────────────────────────────────────────┘

Data Points:
├── Protocol TVL (Total Value Locked)
├── Chain TVL breakdown
├── Yield rates by protocol
├── Stablecoin supplies
└── DEX volumes by chain
```

### Economic Data

```
┌─────────────────────────────────────────────────────────────────┐
│ WORLD BANK API                                                 │
│ Source: World Bank Open Data                                    │
│ Cost: FREE                                                      │
│ Data: Country GDP, development indicators                        │
└─────────────────────────────────────────────────────────────────┘

Data Points:
├── GDP per capita
├── GDP growth rates
├── Population
├── Trade balances
├── FDI flows
└── Development indicators
```

```
┌─────────────────────────────────────────────────────────────────┐
│ TRADING ECONOMICS API                                          │
│ Source: Trading Economics                                       │
│ Cost: FREE (limited: 5指标/天)                                   │
│ Data: Economic indicators for 200+ countries                    │
└─────────────────────────────────────────────────────────────────┘

Data Points:
├── Interest rates (central banks)
├── Consumer price indices
├── GDP figures
├── Unemployment
├── Trade balances
└── Bond yields
```

---

## Phase 2 Data Sources (Premium)

```
Phase 2 additions (~$5K-$20K/month):
─────────────────────────────────────────────────────────────

Market Data:
├── Polygon.io (~200/month)
│   ├── Real-time US stocks
│   ├── Historical data
│   └── WebSocket streaming
└── Tiingo (~50/month)
    └── Enhanced US stock data

News Data:
├── Bloomberg (~$25K/month) ← Enterprise only
├── Refinitiv (enterprise)
└── Alpha Sense (enterprise)

Sentiment Data:
├── LunarCrush (~50/month)
│   ├── Social sentiment
│   ├── Galaxy scores
│   └── Social engagement
├── Santiment (~150/month)
│   ├── Social metrics
│   ├── Development activity
│   └── Market metrics
└── IntoTheBlock (~100/month)
    ├── On-chain metrics
    └── In/Out of Money

Crypto Data:
├── Glassnode (~50/month)
│   ├── Advanced on-chain metrics
│   ├── Institutional metrics
│   └── Real-time alerts
└── Nansen (~150/month) ← Enterprise only
    └── Institutional tracking

Options Data:
├── CBOE (pricing varies)
└── Options industry data
```

---

## Phase 3 Data Sources (Institutional)

```
Phase 3 additions ($50K-$500K/year):
─────────────────────────────────────────────────────────────

Bloomberg Terminal (~$30K/year/seat):
├── Everything financial
├── Real-time data
├── News terminal
├── Research
└── Trading (future)

Refinitiv Eikon (~$20K/year/seat):
├── Alternative data
├── Research
└── News

FactSet (~$25K/year/seat):
├── Research
├── Analytics
└── Financial data

Visible Alpha (enterprise):
├── Sell-side research
├── Estimate data
└── Model comparison

AlphaSense (enterprise):
├── NLP search
├── Transcripts
└── Research

S&P Capital IQ (enterprise):
├── Financial data
├── Estimates
└── Analytics
```

---

## Data Pipeline Implementation

### Connector Architecture

```
Connectors/
├── base_connector.py          # Abstract base class
├── yahoo_finance_connector.py
├── coingecko_connector.py
├── sec_edgar_connector.py
├── fred_connector.py
├── news_connector.py
├── reddit_connector.py
├── dune_connector.py
├── defillama_connector.py
└── world_bank_connector.py
```

```python
# Base Connector Pattern
from abc import ABC, abstractmethod
from typing import Dict, List, Any
from datetime import datetime
import asyncio
import logging

class BaseConnector(ABC):
    """Abstract base class for all data connectors"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.rate_limit = config.get('rate_limit', 60)  # seconds
        self.last_fetch = datetime.min
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    async def fetch(self, **kwargs) -> List[Dict[str, Any]]:
        """Fetch data from source"""
        pass

    @abstractmethod
    async def transform(self, raw_data: Any) -> List[Dict[str, Any]]:
        """Transform raw data to standard format"""
        pass

    async def fetch_with_rate_limit(self, **kwargs) -> List[Dict[str, Any]]:
        """Fetch with rate limiting"""
        now = datetime.utcnow()
        elapsed = (now - self.last_fetch).total_seconds()

        if elapsed < self.rate_limit:
            await asyncio.sleep(self.rate_limit - elapsed)

        raw_data = await self.fetch(**kwargs)
        self.last_fetch = datetime.utcnow()

        return await self.transform(raw_data)

    async def stream(self, callback, interval: int = 60):
        """Stream data at regular intervals"""
        while True:
            try:
                data = await self.fetch_with_rate_limit()
                await callback(data)
            except Exception as e:
                self.logger.error(f"Stream error: {e}")

            await asyncio.sleep(interval)
```

### Stream Processing

```
Redis Streams Configuration:
─────────────────────────────────────────────────────────────

STREAMS:
├── price-updates
│   ├── symbol (string)
│   ├── price (float)
│   ├── volume (float)
│   ├── timestamp (int)
│   └── source (string)
│
├── news-articles
│   ├── title (string)
│   ├── content (string)
│   ├── source (string)
│   ├── url (string)
│   ├── published_at (int)
│   ├── sentiment_score (float)
│   └── asset_symbols (array)
│
├── earnings-events
│   ├── symbol (string)
│   ├── event_type (string: "earnings" | "dividend" | "split")
│   ├── date (int)
│   ├── estimate (float, optional)
│   └── actual (float, optional)
│
├── social-sentiment
│   ├── platform (string)
│   ├── symbol (string)
│   ├── sentiment (float)
│   ├── volume (int)
│   └── timestamp (int)
│
└── regulatory-filings
    ├── cik (string)
    ├── form_type (string)
    ├── filed_date (int)
    └── content_url (string)
```

### Data Quality

```
Data Quality Framework:
─────────────────────────────────────────────────────────────

Validation Rules:
├── Schema validation (Pydantic)
├── Range checks (price > 0, sentiment 0-100)
├── Anomaly detection (3σ deviation)
├── Staleness checks (data age)
└── Completeness checks (required fields)

Quality Metrics:
├── Accuracy (% of data passing validation)
├── Latency (time from source to platform)
├── Coverage (% of assets with fresh data)
└── Freshness (age of data by source)

Quality Alerts:
├── Slack/Discord alerts for quality drops
├── Dashboard for monitoring
└── Auto-remediation for common issues
```

---

## Data Storage Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│ STORAGE ARCHITECTURE                                            │
└─────────────────────────────────────────────────────────────────┘

PostgreSQL (Business Data)
─────────────────────────────────────────────────────────────────
├── assets                      # Asset universe
├── asset_twins               # Digital twins
├── users                      # User accounts
├── watchlists                 # User watchlists
├── predictions                # All predictions
├── prediction_outcomes        # Actual outcomes
└── briefs                     # Daily briefings

TimescaleDB (Time-Series)
─────────────────────────────────────────────────────────────────
├── price_history              # OHLCV data
│   ├── symbol
│   ├── timestamp
│   ├── open, high, low, close
│   └── volume
├── score_history             # Score history
│   ├── symbol
│   ├── timestamp
│   ├── score_type
│   └── value
├── sentiment_history         # Sentiment trends
│   ├── symbol
│   ├── timestamp
│   ├── sentiment_type
│   └── value
└── prediction_history         # Prediction time-series
    ├── symbol
    ├── timestamp
    ├── prediction_type
    └── probability

Neo4j (Knowledge Graph)
─────────────────────────────────────────────────────────────────
Nodes: Company, Person, Sector, Country, Commodity, Currency,
       Index, ETF, Crypto, Theme, Event, Regulation

Relationships: 25+ relationship types

Pinecone (Vector Embeddings)
─────────────────────────────────────────────────────────────────
├── news_embeddings
│   ├── vector (1536 dims)
│   ├── article_id
│   ├── published_at
│   └── asset_symbols
├── report_embeddings
│   ├── vector
│   ├── report_id
│   └── asset_symbols
└── transcript_embeddings
    ├── vector
    ├── transcript_id
    └── company_symbol

ClickHouse (Analytics)
─────────────────────────────────────────────────────────────────
├── prediction_analytics
│   ├── prediction_count
│   ├── accuracy_rate
│   ├── avg_confidence
│   └── by_asset_class
├── user_behavior_analytics
│   ├── daily_active_users
│   ├── queries_per_day
│   └── feature_usage
└── market_analytics
    ├── assets_with_updates
    ├── data_freshness
    └── quality_scores

HOJAI Memory Platform (Long-Term Memory)
─────────────────────────────────────────────────────────────────
├── Asset Memory
│   ├── remember(event) → Store
│   ├── recall(query) → Retrieve
│   └── profile(asset_id) → Full history
├── News Memory
│   └── Every article, ever, searchable
├── Earnings Memory
│   └── Every earnings call, transcribed
└── Prediction Memory
    └── Every prediction with outcome
```

---

## Cost Estimation

```
Phase 1 Monthly Costs (Free Tier):
─────────────────────────────────────────────────────────────────
Yahoo Finance:       $0
CoinGecko API:       $0
SEC EDGAR:           $0
FRED:                $0
GDELT:               $0
Reddit API:          $0
Dune Analytics:      $0
DeFiLlama:          $0
World Bank:          $0

Total Phase 1:      $0/month

─────────────────────────────────────────────────────────────────

Phase 2 Monthly Costs (Premium):
─────────────────────────────────────────────────────────────────
Polygon.io:          ~$200
LunarCrush:          ~$50
Glassnode:           ~$50
IntoTheBlock:        ~$100
Santiment:           ~$150
NewsAPI Pro:         ~$50

Total Phase 2:      ~$600/month

─────────────────────────────────────────────────────────────────

Phase 3 Annual Costs (Institutional):
─────────────────────────────────────────────────────────────────
Bloomberg:           ~$30,000/year/seat
Refinitiv:          ~$20,000/year/seat
FactSet:            ~$25,000/year/seat
AlphaSense:          ~$15,000/year
Visible Alpha:       ~$20,000/year

Total Phase 3:      ~$110,000/year (starting)
```

---

## Next Steps

1. **Week 1-2**: Implement Yahoo Finance + CoinGecko connectors
2. **Week 3-4**: Implement SEC EDGAR + FRED connectors
3. **Week 5-6**: Implement News + Social connectors
4. **Week 7-8**: Set up Redis Streams
5. **Week 9-10**: Connect to intelligence engines
6. **Week 11-12**: Add data quality framework

---

**Document Version:** 1.0  
**Last Updated:** June 5, 2026
