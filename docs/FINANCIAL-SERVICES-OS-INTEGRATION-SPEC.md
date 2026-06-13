# Financial Services Industry OS - Integration Specification

**Version:** 1.0  
**Date:** June 12, 2026  
**Status:** Ready for Implementation  
**Owner:** RTNM Digital

---

## Table of Contents

1. [Industry Overview](#1-industry-overview)
2. [Product Capability Matrix](#2-product-capability-matrix)
3. [Twin Architecture](#3-twin-architecture)
4. [Integration Flows](#4-integration-flows)
5. [Agent Architecture](#5-agent-architecture)
6. [Business Copilot Integration](#6-business-copilot-integration)
7. [Economic Integration](#7-economic-integration)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Industry Overview

### 1.1 Industry Challenges

The Financial Services industry in target markets faces significant challenges:

| Challenge | Impact | Solution via Financial OS |
|-----------|--------|--------------------------|
| **Fragmented Financial Data** | Investors manage portfolios across multiple platforms | Unified Portfolio Twin provides single source of truth |
| **Manual Reconciliation** | CFOs spend 40% time on manual financial close | AI-powered Finance CFO automates reconciliation |
| **Regulatory Compliance** | Increasing requirements (Basel III, IFRS 17, Sharia) | RIDZA Islamic Finance with built-in compliance |
| **Payment Complexity** | Multiple payment rails, currencies, reconciliation | RABTUL Pay with unified payment orchestration |
| **Islamic Finance Gaps** | Limited Sharia-compliant options | RIDZA Islamic Finance with Murabaha, Ijara, Musharaka |
| **Real-time Intelligence** | Market opportunities missed due to delayed data | AssetMind Terminal with live market feeds |
| **Cross-border Payments** | High fees, slow settlements | RABTUL Connect with banking API integrations |
| **Credit Access** | SMEs and consumers underserved by traditional banking | RABTUL Lending with BNPL, EMI capabilities |

### 1.2 Current Product Landscape

```
FINANCIAL SERVICES ECOSYSTEM
├── AssetMind Terminal (5001+)
│   ├── Portfolio Analysis
│   ├── Market Intelligence
│   ├── Investor Relations
│   └── Digital Twins (Investor, Portfolio, Market, Asset, Analyst, Competitor, Decision, Economic)
│
├── RABTUL Technologies
│   ├── RABTUL Pay (4001) - Payment Gateway
│   ├── RABTUL Wallet (4004) - Digital Wallet with REZ Coins
│   ├── RABTUL Auth (4002) - Authentication
│   ├── RABTUL Connect (4003) - Banking API Integrations
│   └── RABTUL Lending - BNPL, EMI, Credit Lines
│
├── RIDZA Finance OS (5200)
│   ├── Finance CFO - AI CFO Assistant
│   ├── Finance Accountant - AI-powered Accounting
│   └── RIDZA Islamic Finance (4530) - Sharia-compliant Products
│
└── TwinOS Hub (5250)
    └── Central orchestration for all digital twins
```

### 1.3 Integration Opportunity

**Key Integration Point:** AssetMind Terminal ↔ TwinOS (Investor Twin, Portfolio Twin)

This integration enables:
- Real-time investor profile synchronization
- Portfolio performance mirroring across systems
- AI-driven insights through unified data model
- Cross-product analytics and recommendations

---

## 2. Product Capability Matrix

### 2.1 AssetMind Terminal

| Attribute | Details |
|-----------|---------|
| **Company** | AssetMind |
| **Port Range** | 5001-5112 (83 microservices) |
| **Tech Stack** | Python (FastAPI), TypeScript, PostgreSQL, Redis, Neo4j, TimescaleDB |
| **Core Capabilities** | Bloomberg-like financial terminal, portfolio analysis, market intelligence |
| **Data Produced** | Market prices, portfolio analytics, investor profiles, risk metrics, analyst ratings |
| **Data Needed** | Real-time market feeds, investor preferences, transaction history |
| **Current Integration** | RABTUL Connect (market data), Twin Engine (5002) |

### 2.2 RABTUL Pay

| Attribute | Details |
|-----------|---------|
| **Company** | RABTUL Technologies |
| **Port** | 4001 |
| **Tech Stack** | Node.js, Express, Razorpay, UPI |
| **Core Capabilities** | Multi-method payments (Cards, UPI, Wallets, Net Banking) |
| **Data Produced** | Transaction records, payment status, settlement data |
| **Data Needed** | Order details, customer info, merchant credentials |
| **Current Integration** | RABTUL Wallet, RABTUL Auth, Webhook integrations |

### 2.3 RABTUL Wallet

| Attribute | Details |
|-----------|---------|
| **Company** | RABTUL Technologies |
| **Port** | 4004 |
| **Tech Stack** | Node.js, Express, Redis, MongoDB |
| **Core Capabilities** | Digital wallet, REZ Coins, balance management, loyalty rewards |
| **Data Produced** | Wallet balances, transaction history, coin transactions |
| **Data Needed** | User identity, payment confirmations, loyalty events |
| **Current Integration** | RABTUL Pay (payments), RABTUL Auth (identity) |

### 2.4 RABTUL Lending

| Attribute | Details |
|-----------|---------|
| **Company** | RABTUL Technologies |
| **Port** | 4300 |
| **Tech Stack** | Node.js, Express, MongoDB |
| **Core Capabilities** | BNPL, EMI calculator, credit lines, instant loans |
| **Data Produced** | Loan applications, credit assessments, repayment schedules |
| **Data Needed** | User credit history, income verification, merchant partnerships |
| **Current Integration** | RABTUL Pay (disbursements), RABTUL Wallet (repayments) |

### 2.5 RABTUL Connect

| Attribute | Details |
|-----------|---------|
| **Company** | RABTUL Technologies |
| **Port** | 4003 |
| **Tech Stack** | Node.js, Express, Banking APIs |
| **Core Capabilities** | Banking API integrations, account aggregation, fund transfers |
| **Data Produced** | Account balances, transaction lists, bank statements |
| **Data Needed** | User authorization (OAuth/Plaid-like), bank credentials |
| **Current Integration** | AssetMind (market data), Multiple bank APIs |

### 2.6 Finance CFO

| Attribute | Details |
|-----------|---------|
| **Company** | RIDZA |
| **Port** | 5200 |
| **Tech Stack** | Node.js, Express, TypeScript, MongoDB |
| **Core Capabilities** | AI-powered financial planning, cash flow forecasting, budget analysis |
| **Data Produced** | Financial forecasts, budget recommendations, variance analysis |
| **Data Needed** | Accounting data, transaction history, business metrics |
| **Current Integration** | RIDZA Islamic Finance, StayOwn (hotel finance) |

### 2.7 Finance Accountant

| Attribute | Details |
|-----------|---------|
| **Company** | RIDZA |
| **Port** | 5200 |
| **Tech Stack** | Node.js, Express, TypeScript, MongoDB |
| **Core Capabilities** | Automated bookkeeping, invoice processing, expense categorization |
| **Data Produced** | Ledgers, balance sheets, P&L statements, tax reports |
| **Data Needed** | Bank transactions, invoices, receipts, expense claims |
| **Current Integration** | RABTUL Pay (transaction data), Tally integration |

### 2.8 Portfolio Analysis

| Attribute | Details |
|-----------|---------|
| **Company** | AssetMind |
| **Port** | 5091, 5210 |
| **Tech Stack** | Python, FastAPI, TimescaleDB |
| **Core Capabilities** | Portfolio optimization, risk-adjusted returns, asset allocation |
| **Data Produced** | Portfolio summaries, allocation breakdowns, performance metrics |
| **Data Needed** | Holdings data, market prices, investor risk profiles |
| **Current Integration** | Portfolio Twin (5004), Market Twin (5003) |

### 2.9 Market Intelligence

| Attribute | Details |
|-----------|---------|
| **Company** | AssetMind |
| **Port** | 5050, 5052 |
| **Tech Stack** | Python, FastAPI, Neo4j |
| **Core Capabilities** | Sentiment analysis, news monitoring, technical analysis |
| **Data Produced** | Sentiment scores, news impact analysis, technical indicators |
| **Data Needed** | News feeds, social media data, price charts |
| **Current Integration** | AssetMind Intelligence, News Service (5012) |

### 2.10 RIDZA Islamic Finance

| Attribute | Details |
|-----------|---------|
| **Company** | RidZa |
| **Port** | 4530 |
| **Tech Stack** | Node.js, Express, TypeScript, MongoDB |
| **Core Capabilities** | Sharia-compliant products (Murabaha, Ijara, Musharaka), Zakat calculator, Takaful |
| **Data Produced** | Islamic finance agreements, Zakat calculations, Takaful policies |
| **Data Needed** | User wealth data, gold prices (Nisab threshold), business financials |
| **Current Integration** | RABTUL Pay, RABTUL Wallet, Gold price APIs |

### 2.11 Product Integration Status Summary

| Product | Integration Status | Key Integration Points |
|---------|-------------------|----------------------|
| AssetMind Terminal | PARTIAL | TwinOS (5002), RABTUL Connect |
| RABTUL Pay | FULL | RABTUL Wallet, RABTUL Auth |
| RABTUL Wallet | FULL | RABTUL Pay, REZ Coins, Loyalty |
| RABTUL Lending | PARTIAL | RABTUL Pay, RABTUL Wallet |
| RABTUL Connect | PARTIAL | Banking APIs, AssetMind |
| Finance CFO | PARTIAL | RIDZA Finance OS |
| Finance Accountant | PARTIAL | RABTUL Pay, Tally |
| Portfolio Analysis | PARTIAL | Portfolio Twin, Market Twin |
| Market Intelligence | PARTIAL | News Service, Social Service |
| RIDZA Islamic Finance | PARTIAL | RABTUL Pay, RABTUL Wallet |

---

## 3. Twin Architecture

### 3.1 Core Financial Twins

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FINANCIAL SERVICES TWINOS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │  INVESTOR   │◄───►│  PORTFOLIO   │◄───►│    ASSET     │                │
│  │    TWIN     │     │    TWIN      │     │    TWIN      │                │
│  │   (5005)    │     │   (5004)     │     │   (5006)     │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                    │                    │                        │
│         │                    │                    │                        │
│         ▼                    ▼                    ▼                        │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   MARKET    │     │  ANALYST    │     │ COMPETITOR   │                │
│  │    TWIN     │◄───►│    TWIN     │     │    TWIN      │                │
│  │   (5003)    │     │   (5007)    │     │   (5008)     │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                    │                    │                        │
│         │                    │                    │                        │
│         ▼                    ▼                    ▼                        │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │  ECONOMIC   │     │  DECISION   │     │    TWIN     │                │
│  │    TWIN     │     │    TWIN     │     │     HUB      │                │
│  │   (5009)    │     │   (5010)    │     │   (5250)     │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│                                                           │                  │
│  ┌─────────────────────────────────────────────────────────┘                  │
│  │                                                                          │
│  └──────────────────────────► TWIN HUB (5250) ◄──────────────────────────────│
│                               Central Orchestration                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Twin Definitions

#### 3.2.1 Investor Twin

| Attribute | Specification |
|-----------|---------------|
| **Service** | assetmind-investor-twin |
| **Port** | 5005 |
| **Type** | Profile & Behavior Twin |
| **Data Model** | See Section 3.2.1.1 |
| **Twins It Relates To** | Portfolio Twin, Market Twin |
| **Agents That Interact** | Investor Profile Agent, Risk Assessment Agent, Compliance Agent |

##### 3.2.1.1 Investor Twin Data Model

```json
{
  "investorId": "string (UUID)",
  "profile": {
    "type": "individual | institutional | corporate",
    "kycStatus": "pending | verified | rejected",
    "riskProfile": "conservative | moderate | aggressive",
    "investmentHorizon": "short | medium | long",
    "liquidityNeeds": "low | medium | high",
    "shariaPreference": "conventional | islamic | hybrid",
    "taxResidency": "string (country code)",
    "accreditedInvestor": "boolean"
  },
  "financialData": {
    "totalInvestableAssets": "number (INR)",
    "annualIncome": "number (INR)",
    "netWorth": "number (INR)",
    "debtObligations": "number (INR)",
    "monthlyExpenses": "number (INR)"
  },
  "preferences": {
    "assetClasses": ["equity", "debt", "real_estate", "commodities", "crypto"],
    "sectors": ["technology", "healthcare", "finance", "energy"],
    "geographies": ["domestic", "emerging_markets", "developed_markets"],
    "esgPreference": "boolean",
    "exclusionList": ["tobacco", "gambling", "alcohol"]
  },
  "behavior": {
    "tradingFrequency": "daily | weekly | monthly | quarterly",
    "avgHoldingPeriod": "number (days)",
    "lastActivity": "ISO8601 datetime",
    "engagementScore": "number (0-100)"
  },
  "connectedAccounts": {
    "bankAccounts": ["accountId"],
    "brokerageAccounts": ["accountId"],
    "walletAccounts": ["accountId"]
  },
  "permissions": {
    "dataSharing": ["productIds"],
    "thirdPartyAccess": ["providerIds"]
  },
  "createdAt": "ISO8601 datetime",
  "updatedAt": "ISO8601 datetime"
}
```

#### 3.2.2 Portfolio Twin

| Attribute | Specification |
|-----------|---------------|
| **Service** | assetmind-portfolio-twin |
| **Port** | 5004 |
| **Type** | Aggregation & Analytics Twin |
| **Data Model** | See Section 3.2.2.1 |
| **Twins It Relates To** | Investor Twin, Asset Twin, Market Twin |
| **Agents That Interact** | Portfolio Optimization Agent, Rebalancing Agent, Performance Agent |

##### 3.2.2.1 Portfolio Twin Data Model

```json
{
  "portfolioId": "string (UUID)",
  "investorId": "string (UUID) - links to Investor Twin",
  "name": "string",
  "portfolioType": "retirement | education | wealth_build | trading | islamic",
  "baseCurrency": "INR | USD | AED",
  "holdings": [
    {
      "assetId": "string",
      "assetType": "equity | debt | mutual_fund | etf | commodity | real_estate | crypto",
      "quantity": "number",
      "avgCostPrice": "number",
      "currentPrice": "number",
      "marketValue": "number",
      "unrealizedPnL": "number",
      "weight": "number (percentage)",
      "acquisitionDate": "ISO8601 datetime",
      "lastUpdated": "ISO8601 datetime"
    }
  ],
  "analytics": {
    "totalValue": "number",
    "totalCost": "number",
    "totalPnL": "number",
    "totalPnLPercent": "number",
    "dayChange": "number",
    "dayChangePercent": "number",
    "beta": "number",
    "sharpeRatio": "number",
    "volatility": "number",
    "maxDrawdown": "number",
    "var95": "number (Value at Risk 95%)"
  },
  "allocation": {
    "byAssetClass": {
      "equity": "number (percentage)",
      "debt": "number (percentage)",
      "commodities": "number (percentage)",
      "real_estate": "number (percentage)",
      "cash": "number (percentage)"
    },
    "bySector": {
      "technology": "number (percentage)",
      "healthcare": "number (percentage)",
      "finance": "number (percentage)",
      "energy": "number (percentage)",
      "other": "number (percentage)"
    },
    "byGeography": {
      "domestic": "number (percentage)",
      "international": "number (percentage)"
    }
  },
  "riskMetrics": {
    "riskScore": "number (0-100)",
    "riskLevel": "low | medium | high | very_high",
    "concentrationRisk": "number (HHI index)",
    "liquidityRisk": "low | medium | high"
  },
  "performance": {
    "1d": "number (percentage)",
    "1w": "number (percentage)",
    "1m": "number (percentage)",
    "3m": "number (percentage)",
    "6m": "number (percentage)",
    "1y": "number (percentage)",
    "ytd": "number (percentage)",
    "sinceInception": "number (percentage)"
  },
  "benchmark": {
    "name": "string (e.g., NIFTY 50, S&P 500)",
    "1yCorrelation": "number"
  },
  "rebalancing": {
    "lastRebalanced": "ISO8601 datetime",
    "nextRebalanceDate": "ISO8601 datetime",
    "autoRebalance": "boolean",
    "rebalanceThreshold": "number (percentage)"
  },
  "createdAt": "ISO8601 datetime",
  "updatedAt": "ISO8601 datetime"
}
```

#### 3.2.3 Market Twin

| Attribute | Specification |
|-----------|---------------|
| **Service** | assetmind-market-twin |
| **Port** | 5003 |
| **Type** | Market Data & Sentiment Twin |
| **Data Model** | See Section 3.2.3.1 |
| **Twins It Relates To** | Portfolio Twin, Economic Twin, Asset Twin |
| **Agents That Interact** | Market Analysis Agent, Sentiment Agent, Event Intelligence Agent |

##### 3.2.3.1 Market Twin Data Model

```json
{
  "marketId": "string (market identifier)",
  "marketType": "equity | debt | commodity | forex | crypto",
  "region": "india | us | europe | asia | global",
  "indices": [
    {
      "symbol": "string",
      "name": "string",
      "value": "number",
      "change": "number",
      "changePercent": "number",
      "volume": "number",
      "timestamp": "ISO8601 datetime"
    }
  ],
  "sentiment": {
    "overall": "bullish | bearish | neutral",
    "fearGreedIndex": "number (0-100)",
    "putCallRatio": "number",
    "vix": "number",
    "trend": "accelerating_bull | decelerating_bull | accumulating | distributing | accelerating_bear"
  },
  "sectors": [
    {
      "name": "string",
      "performance": "number (percentage)",
      "leadingStocks": ["symbol"],
      "trailingStocks": ["symbol"]
    }
  ],
  "macroIndicators": {
    "gdpGrowth": "number (percentage)",
    "inflation": "number (percentage)",
    "unemployment": "number (percentage)",
    "interestRates": {
      "centralBank": "number",
      "marketRate": "number",
      "trend": "rising | falling | stable"
    },
    "currencyStrength": "number (index)",
    "commodityIndex": "number"
  },
  "liquidityMetrics": {
    "avgDailyVolume": "number",
    "volumeSpike": "number (multiplier)",
    "bidAskSpread": "number",
    "marketDepth": "number"
  },
  "events": [
    {
      "type": "earnings | regulatory | geopolitical | macroeconomic",
      "impact": "high | medium | low",
      "description": "string",
      "affectedAssets": ["symbol"],
      "timestamp": "ISO8601 datetime"
    }
  ],
  "lastUpdated": "ISO8601 datetime"
}
```

#### 3.2.4 Asset Twin

| Attribute | Specification |
|-----------|---------------|
| **Service** | assetmind-asset-twin |
| **Port** | 5006 |
| **Type** | Individual Asset Twin |
| **Data Model** | See Section 3.2.4.1 |
| **Twins It Relates To** | Portfolio Twin, Market Twin, Competitor Twin |
| **Agents That Interact** | Asset Research Agent, Valuation Agent, News Agent |

##### 3.2.4.1 Asset Twin Data Model

```json
{
  "assetId": "string (symbol or UUID)",
  "assetType": "stock | bond | etf | mutual_fund | commodity | currency",
  "basicInfo": {
    "name": "string",
    "shortName": "string",
    "exchange": "string",
    "isin": "string (for securities)",
    "sector": "string",
    "industry": "string",
    "marketCap": "number",
    "sharesOutstanding": "number"
  },
  "pricing": {
    "currentPrice": "number",
    "previousClose": "number",
    "open": "number",
    "high": "number",
    "low": "number",
    "volume": "number",
    "avgVolume": "number",
    "priceChange": "number",
    "priceChangePercent": "number",
    "timestamp": "ISO8601 datetime"
  },
  "fundamentals": {
    "pe": "number",
    "pb": "number",
    "ps": "number",
    "dividendYield": "number",
    "eps": "number",
    "revenue": "number",
    "profit": "number",
    "debtToEquity": "number",
    "currentRatio": "number",
    "quickRatio": "number",
    "roe": "number",
    "roa": "number",
    "operatingMargin": "number",
    "netMargin": "number"
  },
  "technicalIndicators": {
    "sma20": "number",
    "sma50": "number",
    "sma200": "number",
    "rsi": "number",
    "macd": {
      "value": "number",
      "signal": "number",
      "histogram": "number"
    },
    "bollingerBands": {
      "upper": "number",
      "middle": "number",
      "lower": "number"
    },
    "atr": "number",
    "adx": "number"
  },
  "ownership": {
    "promoterHolding": "number (percentage)",
    "fiHolding": "number (percentage)",
    "diiHolding": "number (percentage)",
    "publicHolding": "number (percentage)",
    "topPromoters": ["name"],
    "topFIs": ["name"]
  },
  "news": [
    {
      "headline": "string",
      "sentiment": "positive | negative | neutral",
      "source": "string",
      "url": "string",
      "publishedAt": "ISO8601 datetime"
    }
  ],
  "events": [
    {
      "type": "dividend | split | bonus | board_meeting | earnings | regulatory",
      "description": "string",
      "recordDate": "ISO8601 datetime",
      "exDate": "ISO8601 datetime"
    }
  ],
  "analystCoverage": [
    {
      "firm": "string",
      "rating": "buy | hold | sell",
      "targetPrice": "number",
      "rationale": "string",
      "analystName": "string",
      "updatedAt": "ISO8601 datetime"
    }
  ],
  "shariaCompliance": {
    "compliant": "boolean",
    "sectorClassification": "permissible | musharakah | restricted",
    "debtRatio": "number",
    "cashRatio": "number",
    "reasons": ["string"]
  },
  "lastUpdated": "ISO8601 datetime"
}
```

#### 3.2.5 Economic Twin

| Attribute | Specification |
|-----------|---------------|
| **Service** | assetmind-economic-twin |
| **Port** | 5009 |
| **Type** | Macro-Economic Intelligence Twin |
| **Data Model** | See Section 3.2.5.1 |
| **Twins It Relates To** | Market Twin, Portfolio Twin |
| **Agents That Interact** | Economic Research Agent, Forecasting Agent |

##### 3.2.5.1 Economic Twin Data Model

```json
{
  "region": "string (country/region code)",
  "timestamp": "ISO8601 datetime",
  "indicators": {
    "gdp": {
      "value": "number (in billions)",
      "growthRate": "number (percentage YoY)",
      "quarterly": [
        {
          "period": "string",
          "value": "number",
          "growthRate": "number"
        }
      ]
    },
    "inflation": {
      "cpi": "number (percentage)",
      "wpi": "number (percentage)",
      "core": "number (percentage)",
      "trend": "string"
    },
    "employment": {
      "unemploymentRate": "number (percentage)",
      "laborForceParticipation": "number (percentage)",
      "joblessClaims": "number",
      "sectorEmployment": {
        "manufacturing": "number",
        "services": "number",
        "agriculture": "number"
      }
    },
    "trade": {
      "exports": "number (in millions)",
      "imports": "number (in millions)",
      "tradeBalance": "number",
      "currentAccount": "number"
    },
    "fiscal": {
      "governmentRevenue": "number",
      "governmentExpenses": "number",
      "fiscalDeficit": "number",
      "debtToGDP": "number (percentage)"
    },
    "monetary": {
      "policyRate": "number",
      "reverseRepoRate": "number",
      "cashReserveRatio": "number",
      "statutoryLiquidityRatio": "number",
      "moneySupply": {
        "m0": "number",
        "m1": "number",
        "m2": "number",
        "m3": "number"
      }
    },
    "banking": {
      "repoRate": "number",
      "msfRate": "number",
      "bankRate": "number",
      "depositGrowth": "number (percentage)",
      "creditGrowth": "number (percentage)"
    }
  },
  "forecasts": {
    "gdpGrowth": {
      "nextQuarter": "number",
      "nextYear": "number",
      "confidence": "number (0-100)"
    },
    "inflation": {
      "nextQuarter": "number",
      "nextYear": "number",
      "confidence": "number (0-100)"
    },
    "interestRates": {
      "nextMeeting": "ISO8601 datetime",
      "expectedChange": "number",
      "probability": "number (0-100)"
    }
  },
  "riskFactors": [
    {
      "type": "geopolitical | regulatory | environmental | financial",
      "severity": "low | medium | high | critical",
      "description": "string",
      "potentialImpact": "string",
      "likelihood": "number (0-100)"
    }
  ],
  "opportunities": [
    {
      "type": "reform | investment | export | digitization",
      "description": "string",
      "timeline": "string",
      "sectors": ["string"]
    }
  ]
}
```

#### 3.2.6 Analyst Twin

| Attribute | Specification |
|-----------|---------------|
| **Service** | assetmind-analyst-twin |
| **Port** | 5007 |
| **Type** | Analyst Research & Opinion Twin |
| **Data Model** | See Section 3.2.6.1 |
| **Twins It Relates To** | Asset Twin, Market Twin |
| **Agents That Interact** | Research Agent, Rating Agent |

##### 3.2.6.1 Analyst Twin Data Model

```json
{
  "analystId": "string (UUID)",
  "firm": {
    "id": "string",
    "name": "string",
    "type": "investment_bank | research_firm | rating_agency | independent",
    "accreditation": ["string"],
    "coverage": ["sectors"]
  },
  "analyst": {
    "name": "string",
    "title": "string",
    "experience": "number (years)",
    "certifications": ["string"],
    "specialization": ["string"]
  },
  "coverage": [
    {
      "assetId": "string",
      "rating": "strong_buy | buy | hold | underperform | sell",
      "targetPrice": "number",
      "currentPrice": "number",
      "upsidePercent": "number",
      "methodology": "string",
      "keyRisks": ["string"],
      "keyCatalysts": ["string"],
      "lastUpdated": "ISO8601 datetime"
    }
  ],
  "accuracy": {
    "totalRatings": "number",
    "successfulCalls": "number",
    "avgResponseTime": "number (days)",
    "beatRate": "number (percentage)"
  },
  "insights": [
    {
      "type": "initiation | update | flash | deep_dive",
      "assetId": "string",
      "headline": "string",
      "summary": "string",
      "keyPoints": ["string"],
      "publishedAt": "ISO8601 datetime"
    }
  ]
}
```

#### 3.2.7 Competitor Twin

| Attribute | Specification |
|-----------|---------------|
| **Service** | assetmind-competitor-twin |
| **Port** | 5008 |
| **Type** | Competitive Intelligence Twin |
| **Data Model** | See Section 3.2.7.1 |
| **Twins It Relates To** | Asset Twin, Market Twin |
| **Agents That Interact** | Competitive Analysis Agent, Benchmark Agent |

##### 3.2.7.1 Competitor Twin Data Model

```json
{
  "companyId": "string",
  "competitors": [
    {
      "competitorId": "string",
      "directCompetitors": ["companyId"],
      "indirectCompetitors": ["companyId"],
      "substitutes": ["companyId"]
    }
  ],
  "comparison": {
    "marketShare": {
      "company": "number (percentage)",
      "competitors": {
        "competitorId": "number"
      }
    },
    "financials": {
      "company": {
        "revenue": "number",
        "profit": "number",
        "margins": "number"
      },
      "competitors": {
        "competitorId": {
          "revenue": "number",
          "profit": "number",
          "margins": "number"
        }
      }
    },
    "products": {
      "company": ["productId"],
      "competitors": {
        "competitorId": ["productId"]
      }
    },
    "customers": {
      "company": {
        "totalCustomers": "number",
        "avgRevenuePerCustomer": "number",
        "retentionRate": "number"
      },
      "competitors": {
        "competitorId": {
          "totalCustomers": "number",
          "avgRevenuePerCustomer": "number",
          "retentionRate": "number"
        }
      }
    }
  },
  "swot": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  },
  "lastUpdated": "ISO8601 datetime"
}
```

#### 3.2.8 Decision Twin

| Attribute | Specification |
|-----------|---------------|
| **Service** | assetmind-decision-twin |
| **Port** | 5010 |
| **Type** | Investment Decision Support Twin |
| **Data Model** | See Section 3.2.8.1 |
| **Twins It Relates To** | Investor Twin, Portfolio Twin, Asset Twin |
| **Agents That Interact** | Investment Advisor Agent, Risk Advisor Agent |

##### 3.2.8.1 Decision Twin Data Model

```json
{
  "decisionId": "string (UUID)",
  "investorId": "string (UUID)",
  "decisionType": "buy | sell | hold | rebalance | switch",
  "assetId": "string",
  "recommendation": {
    "action": "string",
    "quantity": "number",
    "price": "number",
    "urgency": "immediate | short_term | medium_term",
    "confidence": "number (0-100)",
    "timeHorizon": "number (days)"
  },
  "rationale": {
    "primaryReason": "string",
    "supportingFactors": ["string"],
    "contrarianIndicators": ["string"],
    "riskFactors": ["string"]
  },
  "analysis": {
    "fundamentalScore": "number (0-100)",
    "technicalScore": "number (0-100)",
    "sentimentScore": "number (0-100)",
    "riskScore": "number (0-100)",
    "combinedScore": "number (0-100)"
  },
  "alternatives": [
    {
      "assetId": "string",
      "action": "string",
      "expectedReturn": "number",
      "riskLevel": "string",
      "suitability": "number (0-100)"
    }
  ],
  "approval": {
    "status": "pending | approved | rejected | needs_review",
    "approvedBy": "string (investorId or advisorId)",
    "approvedAt": "ISO8601 datetime",
    "rejectionReason": "string"
  },
  "execution": {
    "status": "pending | partial | filled | cancelled | failed",
    "filledQuantity": "number",
    "filledPrice": "number",
    "broker": "string",
    "executedAt": "ISO8601 datetime"
  },
  "createdAt": "ISO8601 datetime",
  "updatedAt": "ISO8601 datetime"
}
```

### 3.3 Twin Hub (Central Orchestration)

| Attribute | Specification |
|-----------|---------------|
| **Service** | assetmind-twin-hub |
| **Port** | 5250 |
| **Type** | Central Twin Orchestration |
| **Purpose** | Coordinate cross-twin queries, aggregate results |

#### 3.3.1 Twin Hub Data Model

```json
{
  "hubId": "string (UUID)",
  "registeredTwins": [
    {
      "twinId": "string",
      "twinName": "string",
      "port": "number",
      "health": "healthy | degraded | down",
      "lastHeartbeat": "ISO8601 datetime"
    }
  ],
  "queries": [
    {
      "queryId": "string",
      "type": "cross_twin | aggregate | federated",
      "twinTargets": ["twinId"],
      "query": "string",
      "results": "object",
      "executedAt": "ISO8601 datetime",
      "latency": "number (ms)"
    }
  ],
  "schemas": {
    "investorTwin": "json-schema-url",
    "portfolioTwin": "json-schema-url",
    "marketTwin": "json-schema-url",
    "assetTwin": "json-schema-url",
    "economicTwin": "json-schema-url"
  }
}
```

---

## 4. Integration Flows

### 4.1 Core Integration Flow: AssetMind Terminal ↔ TwinOS

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    INTEGRATION FLOW: AssetMind ↔ TwinOS                             │
└─────────────────────────────────────────────────────────────────────────────────────┘

  AssetMind Terminal                          TwinOS Hub
        │                                          │
        │  ┌─────────────────────────────────────┐│
        │  │     TWIN DATA SYNCHRONIZATION       ││
        │  └─────────────────────────────────────┘│
        │                                          │
        │                                          │
        ▼                                          ▼
┌─────────────────┐                     ┌─────────────────────┐
│ Investor Twin   │◄───────────────────►│  Twin Hub (5250)    │
│    (5005)       │    REST/WebSocket    │                     │
└─────────────────┘                     └─────────────────────┘
        │                                          │
        │                                          │
        ▼                                          ▼
┌─────────────────┐                     ┌─────────────────────┐
│ Portfolio Twin  │◄───────────────────►│  Portfolio Twin     │
│    (5004)       │    REST/WebSocket    │     (5004)         │
└─────────────────┘                     └─────────────────────┘
        │                                          │
        │                                          │
        ▼                                          ▼
┌─────────────────┐                     ┌─────────────────────┐
│  Market Twin    │◄───────────────────►│   Market Twin       │
│    (5003)       │    REST/WebSocket    │     (5003)         │
└─────────────────┘                     └─────────────────────┘
        │                                          │
        │                                          │
        ▼                                          ▼
┌─────────────────┐                     ┌─────────────────────┐
│   Asset Twin    │◄───────────────────►│    Asset Twin        │
│    (5006)       │    REST/WebSocket    │     (5006)         │
└─────────────────┘                     └─────────────────────┘


INTEGRATION DATA FLOWS:
─────────────────────

1. Investor Profile Sync
   ─────────────────────
   AssetMind ──investor.created──► Twin Hub ──investor.created──► TwinOS
   
   Payload:
   {
     "event": "investor.created",
     "investorId": "uuid",
     "profile": { ... },
     "timestamp": "ISO8601"
   }

2. Portfolio State Sync
   ─────────────────────
   AssetMind ──portfolio.updated──► Twin Hub ──portfolio.updated──► TwinOS
   
   Payload:
   {
     "event": "portfolio.updated",
     "portfolioId": "uuid",
     "investorId": "uuid",
     "holdings": [ ... ],
     "analytics": { ... },
     "timestamp": "ISO8601"
   }

3. Market Data Stream
   ───────────────────
   AssetMind ──market.tick──► Twin Hub ──market.tick──► TwinOS
   
   Payload:
   {
     "event": "market.tick",
     "symbol": "string",
     "price": "number",
     "volume": "number",
     "timestamp": "ISO8601"
   }

4. Cross-Twin Query
   ──────────────────
   TwinOS ──POST /api/hub/query──► Twin Hub ──fan-out──► Multiple Twins
                                              │
                                              ├──► Investor Twin
                                              ├──► Portfolio Twin
                                              └──► Market Twin
                                 Twin Hub ◄───aggregate──┘
   TwinOS ◄───combined response──┘
```

### 4.2 Payment Integration Flow: RABTUL ↔ Financial Products

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    PAYMENT INTEGRATION: RABTUL Financial Flow                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

  Investor/                    RABTUL Stack                   Financial Products
    User
      │
      │  ┌──────────────────────────────────────────────────────────────────┐
      │  │                    AUTHENTICATION LAYER                          │
      │  └──────────────────────────────────────────────────────────────────┘
      │
      │  POST /auth/login
      │  ─────────────────
      │  { phone, otp }
      │                │
      │                ▼
      │         ┌──────────────┐
      │         │  RABTUL Auth │
      │         │    (4002)    │
      │         └──────────────┘
      │              │
      │              │ JWT Token
      │              ▼
      │
      │  ┌──────────────────────────────────────────────────────────────────┐
      │  │                    PAYMENT INITIATION                             │
      │  └──────────────────────────────────────────────────────────────────┘
      │
      │  POST /payments/initiate
      │  ──────────────────────
      │  { amount, method, orderId }
      │                │
      │                ▼
      │         ┌──────────────┐
      │         │ RABTUL Pay   │
      │         │   (4001)     │
      │         └──────────────┘
      │              │
      │    ┌────────┴────────┐
      │    │                 │
      │    ▼                 ▼
      │ ┌────────┐     ┌──────────────┐
      │ │ UPI    │     │ RABTUL Wallet│
      │ │ Gate   │     │   (4004)    │
      │ └────────┘     └──────────────┘
      │    │                 │
      │    │                 │ REZ Coins
      │    ▼                 ▼
      │  Settlement      Balance Update
      │    │                 │
      │    └────────┬────────┘
      │             │
      │             ▼
      │      ┌──────────────┐
      │      │ Webhook      │
      │      │ Notification │
      │      └──────────────┘
      │             │
      │             ▼
      │
      │  ┌──────────────────────────────────────────────────────────────────┐
      │  │               FINANCIAL PRODUCT INTEGRATIONS                      │
      │  └──────────────────────────────────────────────────────────────────┘
      │
      │  POST /lending/apply     POST /islamic/murabaha    POST /bnpl/apply
      │  ───────────────        ──────────────────        ──────────────
      │         │                       │                        │
      │         ▼                       ▼                        ▼
      │  ┌─────────────┐         ┌─────────────┐          ┌─────────────┐
      │  │ RABTUL      │         │ RIDZA       │          │ RABTUL      │
      │  │ Lending     │         │ Islamic     │          │ Lending     │
      │  │             │         │ Finance     │          │ (BNPL)      │
      │  └─────────────┘         └─────────────┘          └─────────────┘
      │         │                       │                        │
      │         │                       │                        │
      │         ▼                       ▼                        ▼
      │  ┌─────────────────────────────────────────────────────────────────┐
      │  │                    RABTUL PAY - DISBURSEMENT                      │
      │  │                                                                 │
      │  │  1. Credit assessment completed                                  │
      │  │  2. Disbursement request → RABTUL Pay                           │
      │  │  3. Funds transferred to wallet/account                         │
      │  │  4. Repayment schedule created                                   │
      │  │  5. Auto-debit on due date                                       │
      │  └─────────────────────────────────────────────────────────────────┘
      │
      ▼
```

### 4.3 Islamic Finance Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    ISLAMIC FINANCE INTEGRATION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

  Customer                    RIDZA Islamic Finance                RABTUL
      │                              (4530)                            │
      │                                                                       │
      │  ┌─────────────────────────────────────────────────────────────────┐
      │  │              MURABAHA (COST-PLUS FINANCING)                     │
      │  └─────────────────────────────────────────────────────────────────┘
      │                                                                       │
      │  POST /api/islamic/murabaha                                             
      │  ─────────────────────────────────
      │  { assetType, amount, tenure, profitRate }
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  1. Validate Sharia compliance                                  │
      │  │     - Asset must be permissible (not tobacco, alcohol, etc.)  │
      │  │     - Debt ratio check                                          │
      │  │     - Cash ratio check                                          │
      │  └────────────────────────────────────────────────────────────────┘
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  2. Calculate cost price and selling price                      │
      │  │     - Cost Price = Asset purchase cost                          │
      │  │     - Profit Margin = Cost * Profit Rate * Tenure               │
      │  │     - Selling Price = Cost + Profit                             │
      │  │     - EMI = Selling Price / Tenure                              │
      │  └────────────────────────────────────────────────────────────────┘
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  3. RABTUL Pay - Process Payment                                │
      │  │     - Purchase asset on behalf of customer                      │
      │  │     - Store in intermediary                                      │
      │  └────────────────────────────────────────────────────────────────┘
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  4. Create Murabaha Agreement                                   │
      │  │     - Document cost and markup                                  │
      │  │     - Store in database                                         │
      │  │     - Schedule EMIs                                             │
      │  └────────────────────────────────────────────────────────────────┘
      │
      │
      │  ┌─────────────────────────────────────────────────────────────────┐
      │  │              ZAKAT CALCULATION                                   │
      │  └─────────────────────────────────────────────────────────────────┘
      │
      │  POST /api/islamic/zakat
      │  ──────────────────────
      │  { assets: { gold, cash, investments, property } }
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  1. Fetch current gold price (Nisab threshold)                  │
      │  │     - Gold price per gram                                       │
      │  │     - Nisab = 85 grams * Gold price                              │
      │  └────────────────────────────────────────────────────────────────┘
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  2. Calculate total wealth above Nisab                          │
      │  │     - Cash + Gold + Investments + Property - Liabilities       │
      │  │     - If total < Nisab: Zakat = 0                              │
      │  │     - If total >= Nisab: Zakat = 2.5% of total                │
      │  └────────────────────────────────────────────────────────────────┘
      │
      │
      │  ┌─────────────────────────────────────────────────────────────────┐
      │  │              TAKAFUL (ISLAMIC INSURANCE)                         │
      │  └─────────────────────────────────────────────────────────────────┘
      │
      │  POST /api/islamic/takaful
      │  ─────────────────────
      │  { coverageType, sumAssured, tenure, participants }
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  1. Wakala Model Implementation                                 │
      │  │     - Tabarru (donation) = Contribution pool                   │
      │  │     - Wakala fee = Operational costs                            │
      │  │     - Surplus distribution (if any)                             │
      │  └────────────────────────────────────────────────────────────────┘
```

### 4.4 API Endpoints Specification

#### 4.4.1 TwinOS Hub API (Port 5250)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/health` | Service health | - | `{ status, twins }` |
| GET | `/api/hub/twins` | List registered twins | - | `{ twins: [] }` |
| GET | `/api/hub/twins/{twinId}` | Get twin status | - | `{ twin, health }` |
| POST | `/api/hub/query` | Cross-twin query | `{ targets, query, params }` | `{ results, latency }` |
| POST | `/api/hub/sync` | Trigger sync | `{ twinId, data }` | `{ syncId, status }` |
| GET | `/api/hub/sync/{syncId}` | Get sync status | - | `{ syncId, status, progress }` |
| WS | `/ws/twin/{twinId}` | Twin event stream | - | Event stream |

#### 4.4.2 Investor Twin API (Port 5005)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/health` | Service health | - | `{ status }` |
| GET | `/api/investor/{id}` | Get investor | - | `{ investor }` |
| POST | `/api/investor` | Create investor | `{ profile, financialData }` | `{ investorId }` |
| PUT | `/api/investor/{id}` | Update investor | `{ updates }` | `{ investor }` |
| DELETE | `/api/investor/{id}` | Delete investor | - | `{ success }` |
| GET | `/api/investor/{id}/portfolio` | Get linked portfolio | - | `{ portfolioId }` |
| POST | `/api/investor/{id}/connect` | Connect account | `{ accountType, credentials }` | `{ connectionId }` |
| GET | `/api/investor/{id}/risk-profile` | Get risk profile | - | `{ riskScore, profile }` |
| POST | `/api/investor/{id}/preferences` | Update preferences | `{ preferences }` | `{ investor }` |

#### 4.4.3 Portfolio Twin API (Port 5004)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/health` | Service health | - | `{ status }` |
| GET | `/api/portfolio/{id}` | Get portfolio | - | `{ portfolio }` |
| POST | `/api/portfolio` | Create portfolio | `{ name, investorId, type }` | `{ portfolioId }` |
| PUT | `/api/portfolio/{id}` | Update portfolio | `{ updates }` | `{ portfolio }` |
| POST | `/api/portfolio/{id}/holdings` | Add holding | `{ assetId, quantity, price }` | `{ holding }` |
| DELETE | `/api/portfolio/{id}/holdings/{holdingId}` | Remove holding | - | `{ success }` |
| GET | `/api/portfolio/{id}/analytics` | Get analytics | - | `{ analytics }` |
| GET | `/api/portfolio/{id}/performance` | Get performance | `{ period }` | `{ performance }` |
| POST | `/api/portfolio/{id}/rebalance` | Trigger rebalance | `{ threshold }` | `{ rebalanceId }` |
| GET | `/api/portfolio/{id}/allocation` | Get allocation | - | `{ allocation }` |

#### 4.4.4 RABTUL Pay API (Port 4001)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/payments/initiate` | Initiate payment | `{ amount, currency, orderId, method }` | `{ paymentId, amount }` |
| POST | `/api/payments/{paymentId}/verify` | Verify payment | `{ razorpaySignature }` | `{ verified, status }` |
| GET | `/api/payments/{paymentId}` | Get payment status | - | `{ payment }` |
| POST | `/api/payments/webhook` | Payment webhook | `{ event, payload }` | `{ received }` |
| POST | `/api/payments/refund` | Initiate refund | `{ paymentId, amount }` | `{ refundId }` |
| GET | `/api/payments/{paymentId}/refunds` | List refunds | - | `{ refunds }` |

#### 4.4.5 RABTUL Wallet API (Port 4004)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/wallet/balance` | Get balance | - | `{ balance, coins }` |
| POST | `/api/wallet/topup` | Top up wallet | `{ amount, source }` | `{ transactionId, balance }` |
| POST | `/api/wallet/pay` | Pay from wallet | `{ amount, to, orderId }` | `{ transactionId, balance }` |
| GET | `/api/wallet/transactions` | List transactions | `{ limit, offset }` | `{ transactions }` |
| POST | `/api/wallet/coins/earn` | Earn REZ Coins | `{ amount, reason }` | `{ coins, balance }` |
| POST | `/api/wallet/coins/redeem` | Redeem REZ Coins | `{ coins, rewardId }` | `{ redeemed, balance }` |
| GET | `/api/wallet/rewards` | List rewards | - | `{ rewards }` |

#### 4.4.6 RIDZA Islamic Finance API (Port 4530)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/islamic/murabaha` | Apply Murabaha | `{ amount, assetType, tenure }` | `{ murabahaId, schedule }` |
| POST | `/api/islamic/ijara` | Apply Ijara | `{ assetType, amount, tenure }` | `{ ijaraId, rentSchedule }` |
| POST | `/api/islamic/zakat` | Calculate Zakat | `{ assets, liabilities }` | `{ zakatAmount, breakdown }` |
| POST | `/api/islamic/takaful` | Get Takaful quote | `{ coverageType, sumAssured }` | `{ quoteId, contribution }` |
| GET | `/api/islamic/agreements` | List agreements | - | `{ agreements }` |
| GET | `/api/islamic/agreements/{id}` | Get agreement | - | `{ agreement }` |

#### 4.4.7 Finance CFO API (Port 5200)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/cfo/dashboard` | CFO dashboard | - | `{ summary, kpis }` |
| POST | `/api/cfo/forecast` | Generate forecast | `{ type, period }` | `{ forecast }` |
| GET | `/api/cfo/cashflow` | Cash flow analysis | `{ period }` | `{ cashflow }` |
| GET | `/api/cfo/budget` | Budget status | `{ period }` | `{ budget }` |
| POST | `/api/cfo/budget/recommend` | Budget recommendation | `{ context }` | `{ recommendations }` |
| GET | `/api/cfo/variance` | Variance analysis | `{ period }` | `{ variance }` |

### 4.5 Events/Messages Specification

#### 4.5.1 Event Bus Topics

| Topic | Publisher | Subscribers | Event Types |
|-------|-----------|-------------|-------------|
| `finance.investor.*` | Investor Twin | Portfolio Twin, Twin Hub | `created`, `updated`, `risk_changed` |
| `finance.portfolio.*` | Portfolio Twin | Investor Twin, Twin Hub | `created`, `updated`, `rebalanced`, `alert` |
| `finance.market.*` | Market Twin | Portfolio Twin, Twin Hub | `tick`, `alert`, `trend_change` |
| `finance.asset.*` | Asset Twin | Portfolio Twin, Twin Hub | `price_update`, `news`, `rating_change` |
| `finance.payment.*` | RABTUL Pay | All financial products | `success`, `failed`, `refund_initiated` |
| `finance.lending.*` | RABTUL Lending | Finance CFO, Twin Hub | `approved`, `disbursed`, `defaulted` |
| `finance.wallet.*` | RABTUL Wallet | All financial products | `balance_low`, `transaction`, `coins_earned` |

#### 4.5.2 Event Schema

```json
{
  "eventId": "string (UUID)",
  "eventType": "string (e.g., portfolio.updated)",
  "source": "string (service name)",
  "sourceId": "string (entity ID)",
  "timestamp": "ISO8601 datetime",
  "version": "string (1.0.0)",
  "payload": {
    "entityType": "string",
    "entityId": "string",
    "changes": {
      "field": { "old": "any", "new": "any" }
    }
  },
  "metadata": {
    "correlationId": "string",
    "causationId": "string",
    "userId": "string",
    "sessionId": "string"
  }
}
```

### 4.6 Error Handling

#### 4.6.1 Error Response Schema

```json
{
  "error": {
    "code": "string (e.g., TWIN_NOT_FOUND)",
    "message": "string (human readable)",
    "details": {
      "field": "string",
      "reason": "string"
    },
    "traceId": "string (for debugging)",
    "timestamp": "ISO8601 datetime"
  }
}
```

#### 4.6.2 Error Codes

| Code | HTTP Status | Description | Action |
|------|-------------|-------------|--------|
| `TWIN_NOT_FOUND` | 404 | Requested twin does not exist | Check twin ID |
| `TWIN_UNAVAILABLE` | 503 | Twin service is down | Retry with backoff |
| `INVALID_SYNC_STATE` | 409 | Sync conflict detected | Force refresh |
| `AUTH_FAILED` | 401 | Authentication failed | Re-authenticate |
| `PERMISSION_DENIED` | 403 | Insufficient permissions | Request access |
| `VALIDATION_ERROR` | 400 | Invalid request data | Fix request body |
| `RATE_LIMITED` | 429 | Too many requests | Wait and retry |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Report to support |

#### 4.6.3 Retry Strategy

```yaml
retry_policy:
  max_attempts: 3
  initial_delay_ms: 1000
  max_delay_ms: 10000
  backoff_multiplier: 2.0
  retryable_errors:
    - TWIN_UNAVAILABLE
    - RATE_LIMITED
    - INTERNAL_ERROR
  non_retryable_errors:
    - TWIN_NOT_FOUND
    - AUTH_FAILED
    - PERMISSION_DENIED
    - VALIDATION_ERROR
```

---

## 5. Agent Architecture

### 5.1 Financial Services Agents Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         FINANCIAL SERVICES AGENT ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │   AGENT ORCHESTRATOR   │
                              │      (5090)            │
                              │                        │
                              │  - Skill matching      │
                              │  - Workflow assembly   │
                              │  - Agent coordination  │
                              └──────────┬───────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│   INVESTOR      │            │   PORTFOLIO     │            │   MARKET        │
│   AGENTS       │            │   AGENTS        │            │   AGENTS        │
│                 │            │                 │            │                 │
│  - Profile      │            │  - Optimization │            │  - Analysis     │
│  - Onboarding   │            │  - Rebalancing  │            │  - Sentiment    │
│  - KYC          │            │  - Performance  │            │  - Event Intel  │
│  - Risk Assess  │            │  - Alert        │            │  - Prediction   │
└─────────────────┘            └─────────────────┘            └─────────────────┘
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│   PAYMENT      │            │   LENDING      │            │   ISLAMIC       │
│   AGENTS       │            │   AGENTS       │            │   FINANCE       │
│                 │            │                 │            │   AGENTS        │
│  - Processing   │            │  - Credit      │            │  - Compliance   │
│  - Settlement   │            │  - Underwriting│            │  - Murabaha     │
│  - Reconciliation│           │  - Collections │            │  - Zakat        │
│  - Fraud Detect │            │  - Recovery     │            │  - Takaful      │
└─────────────────┘            └─────────────────┘            └─────────────────┘
```

### 5.2 Agent Definitions

#### 5.2.1 Investor Profile Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `finance.investor.profile` |
| **Port** | 5090 |
| **Role** | Manage investor profile throughout lifecycle |
| **Twins Managed** | Investor Twin (5005) |
| **Skills** | KYC processing, Document verification, Risk profiling |
| **Capabilities** | Create investor profiles, Update preferences, Manage risk assessments |
| **Triggers** | New investor onboarding, Profile update request, Risk profile change |

**Actions:**
- `create_investor_profile`: Onboard new investor with KYC
- `update_preferences`: Modify investment preferences
- `assess_risk_profile`: Calculate risk tolerance
- `link_accounts`: Connect external accounts
- `request_kyc`: Initiate KYC verification

#### 5.2.2 Portfolio Optimization Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `finance.portfolio.optimizer` |
| **Port** | 5091 |
| **Role** | Optimize portfolio allocation and holdings |
| **Twins Managed** | Portfolio Twin (5004), Asset Twin (5006) |
| **Skills** | Modern Portfolio Theory, Risk optimization, Asset selection |
| **Capabilities** | Portfolio construction, Rebalancing, Tax-loss harvesting |
| **Triggers** | New investment, Rebalancing threshold breach, Market change |

**Actions:**
- `optimize_allocation`: Generate optimal allocation based on risk profile
- `rebalance_portfolio`: Execute rebalancing trades
- `tax_optimize`: Identify tax-loss harvesting opportunities
- `rebalance_trigger`: Check and trigger rebalancing
- `suggest_investments`: Recommend new holdings

#### 5.2.3 Market Analysis Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `finance.market.analysis` |
| **Port** | 5050 |
| **Role** | Analyze market conditions and generate insights |
| **Twins Managed** | Market Twin (5003), Economic Twin (5009) |
| **Skills** | Technical analysis, Fundamental analysis, Sentiment analysis |
| **Capabilities** | Trend identification, Support/resistance detection, Pattern recognition |
| **Triggers** | Market open/close, Significant price movement, News event |

**Actions:**
- `analyze_technical`: Perform technical analysis on assets
- `generate_signals`: Produce buy/sell signals
- `detect_patterns`: Identify chart patterns
- `monitor_market`: Track market conditions
- `report_sector`: Generate sector analysis

#### 5.2.4 Sentiment Analysis Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `finance.market.sentiment` |
| **Port** | 5052 |
| **Role** | Analyze market sentiment from news and social media |
| **Twins Managed** | Market Twin (5003), Asset Twin (5006) |
| **Skills** | NLP, Sentiment scoring, Trend detection |
| **Capabilities** | News aggregation, Sentiment scoring, Impact analysis |
| **Triggers** | News publication, Social media spike, Earnings announcement |

**Actions:**
- `analyze_news_sentiment`: Score news articles
- `track_social_buzz`: Monitor social media
- `detect_sentiment_shift`: Identify sentiment changes
- `generate_sentiment_report`: Produce sentiment summaries

#### 5.2.5 Risk Management Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `finance.portfolio.risk` |
| **Port** | 5092 |
| **Role** | Monitor and manage portfolio risk |
| **Twins Managed** | Portfolio Twin (5004), Decision Twin (5010) |
| **Skills** | VaR calculation, Stress testing, Risk scoring |
| **Capabilities** | Real-time risk monitoring, Drawdown alerts, Concentration analysis |
| **Triggers** | Risk threshold breach, Volatility spike, Market crash |

**Actions:**
- `calculate_var`: Compute Value at Risk
- `stress_test`: Run stress test scenarios
- `monitor_concentration`: Check concentration risk
- `generate_risk_report`: Produce risk summaries
- `trigger_hedge`: Suggest hedging strategies

#### 5.2.6 Payment Processing Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `finance.payment.processing` |
| **Port** | 4001 |
| **Role** | Process and reconcile payment transactions |
| **Twins Managed** | Transaction records (via Twin Hub) |
| **Skills** | Payment processing, Fraud detection, Settlement |
| **Capabilities** | Multi-method payments, Auto-reconciliation, Fraud scoring |
| **Triggers** | Payment initiation, Settlement deadline, Fraud alert |

**Actions:**
- `initiate_payment`: Process payment request
- `verify_payment`: Confirm payment status
- `reconcile_transactions`: Match payments with orders
- `detect_fraud`: Score transaction risk
- `process_refund`: Handle refund requests

#### 5.2.7 Credit Underwriting Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `finance.lending.underwriting` |
| **Port** | 4300 |
| **Role** | Assess creditworthiness and approve loans |
| **Twins Managed** | Investor Twin (credit profile), Decision Twin |
| **Skills** | Credit scoring, Income verification, Fraud detection |
| **Capabilities** | Application processing, Risk-based pricing, Approval workflow |
| **Triggers** | Loan application, Credit limit request, Default alert |

**Actions:**
- `assess_credit`: Evaluate creditworthiness
- `price_loan`: Determine interest rate
- `approve_loan`: Process approval decision
- `monitor_repayment`: Track payment schedule
- `trigger_collection`: Initiate default recovery

#### 5.2.8 Islamic Finance Compliance Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `finance.islamic.compliance` |
| **Port** | 4530 |
| **Role** | Ensure Sharia compliance for Islamic products |
| **Twins Managed** | Asset Twin (Sharia screening), Investor Twin |
| **Skills** | Sharia jurisprudence, Fatwa interpretation, Compliance review |
| **Capabilities** | Product screening, Compliance certification, Zakat calculation |
| **Triggers** | Islamic product application, Compliance audit, New fatwa |

**Actions:**
- `screen_product`: Check Sharia compliance
- `calculate_zakat`: Compute Zakat liability
- `structure_murabaha`: Create Murabaha agreement
- `structure_ijara`: Create Ijara agreement
- `certify_compliance`: Issue compliance certificate

#### 5.2.9 CFO Advisory Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `finance.cfo.advisory` |
| **Port** | 5200 |
| **Role** | Provide AI-powered financial advisory |
| **Twins Managed** | Economic Twin, Portfolio Twin (corporate treasury) |
| **Skills** | Financial planning, Cash flow forecasting, Budget optimization |
| **Capabilities** | Scenario modeling, Variance analysis, Cash flow prediction |
| **Triggers** | Month-end close, Budget cycle, Cash flow alert |

**Actions:**
- `generate_forecast`: Create financial forecasts
- `analyze_variance`: Compare actual vs budget
- `optimize_cash`: Recommend cash deployment
- `assess_liquidity`: Evaluate liquidity position
- `recommend_budget`: Suggest budget allocations

#### 5.2.10 Wealth Advisory Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `finance.wealth.advisory` |
| **Port** | 5090 |
| **Role** | Provide personalized wealth management advice |
| **Twins Managed** | Investor Twin, Portfolio Twin |
| **Skills** | Financial planning, Goal-based investing, Estate planning |
| **Capabilities** | Goal projection, Retirement planning, Education planning |
| **Triggers** | Life event, Goal deadline, Portfolio review request |

**Actions:**
- `create_financial_plan`: Build comprehensive financial plan
- `project_goals`: Calculate goal achievement probability
- `suggest_insurance`: Recommend protection products
- `plan_retirement`: Create retirement roadmap
- `review_portfolio`: Conduct periodic reviews

### 5.3 Agent Skills Registry

| Skill ID | Skill Name | Description | Required For |
|----------|------------|-------------|--------------|
| `skill.kyc.verify` | KYC Verification | Identity verification and document check | Investor Onboarding |
| `skill.risk.assess` | Risk Assessment | Risk profiling and tolerance analysis | Investor Profile, Credit |
| `skill.technical.analyze` | Technical Analysis | Chart pattern recognition, indicators | Market Analysis |
| `skill.fundamental.analyze` | Fundamental Analysis | Financial statement analysis | Asset Research |
| `skill.sentiment.analyze` | Sentiment Analysis | NLP-based sentiment scoring | Market Intelligence |
| `skill.portfolio.optimize` | Portfolio Optimization | Mean-variance optimization | Portfolio Agent |
| `skill.rebalance` | Portfolio Rebalancing | Trade execution for rebalancing | Portfolio Agent |
| `skill.credit.score` | Credit Scoring | Creditworthiness evaluation | Lending Agent |
| `skill.fraud.detect` | Fraud Detection | Transaction fraud scoring | Payment Agent |
| `skill.sharia.screen` | Sharia Screening | Islamic compliance verification | Islamic Finance |
| `skill.zakat.calculate` | Zakat Calculation | Islamic wealth tax computation | Islamic Finance |
| `skill.cashflow.forecast` | Cash Flow Forecasting | Predictive cash flow modeling | CFO Agent |
| `skill.budget.optimize` | Budget Optimization | Resource allocation optimization | CFO Agent |
| `skill.wealth.plan` | Wealth Planning | Comprehensive financial planning | Wealth Agent |

---

## 6. Business Copilot Integration

### 6.1 Business Copilot Overview

The Business Copilot serves as the natural language interface for the Financial Services OS, enabling users to query and interact with all financial products through conversational AI.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         BUSINESS COPILOT INTEGRATION                                │
└─────────────────────────────────────────────────────────────────────────────────────┘

                           ┌──────────────────────┐
                           │   BUSINESS COPILOT   │
                           │   (Natural Language) │
                           └──────────┬───────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
            │  INVESTOR    │   │   PORTFOLIO  │   │   PAYMENT    │
            │   COPILOT    │   │    COPILOT   │   │    COPILOT   │
            └──────────────┘   └──────────────┘   └──────────────┘
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
            │ Investor Twin│   │Portfolio Twin│   │ RABTUL Pay   │
            │   (5005)     │   │   (5004)     │   │   (4001)     │
            └──────────────┘   └──────────────┘   └──────────────┘
                    │                 │                 │
                    └─────────────────┼─────────────────┘
                                      │
                           ┌──────────┴───────────┐
                           │      TWIN HUB        │
                           │       (5250)         │
                           └──────────────────────┘
```

### 6.2 Natural Language Queries Supported

#### 6.2.1 Investor Queries

| Query Category | Example Queries | Data Source | Response Format |
|----------------|-----------------|-------------|-----------------|
| **Profile** | "What is my risk profile?" | Investor Twin | Risk level + factors |
| | "Show my investment preferences" | Investor Twin | Preferences list |
| | "Update my phone number" | Investor Twin | Confirmation |
| **Accounts** | "Link my bank account" | RABTUL Connect | Instructions |
| | "Show all my connected accounts" | Investor Twin | Account list |
| **KYC** | "What's my KYC status?" | Investor Twin | Status + checklist |
| | "Upload my PAN card" | Investor Twin | Upload confirmation |

#### 6.2.2 Portfolio Queries

| Query Category | Example Queries | Data Source | Response Format |
|----------------|-----------------|-------------|-----------------|
| **Value** | "What's my portfolio value?" | Portfolio Twin | Total value + change |
| | "Show today's gain/loss" | Portfolio Twin | P&L breakdown |
| | "Compare with last month" | Portfolio Twin | Comparison chart |
| **Holdings** | "Show my top holdings" | Portfolio Twin | Holdings list |
| | "What is my sector exposure?" | Portfolio Twin | Allocation chart |
| | "Show my worst performer" | Portfolio Twin | Asset + change |
| **Performance** | "What's my 1-year return?" | Portfolio Twin | Return + benchmark |
| | "How has my portfolio performed vs NIFTY?" | Portfolio Twin | Comparison |
| | "Calculate my XIRR" | Portfolio Twin | XIRR value |
| **Risk** | "What's my portfolio risk?" | Portfolio Twin | Risk score + metrics |
| | "Am I over-concentrated?" | Portfolio Twin | Concentration analysis |
| | "What's my VaR?" | Portfolio Twin | VaR value |

#### 6.2.3 Market Queries

| Query Category | Example Queries | Data Source | Response Format |
|----------------|-----------------|-------------|-----------------|
| **Prices** | "What's the price of RELIANCE?" | Market Twin | Current price + change |
| | "Show me HDFC Bank's 52-week range" | Market Twin | Range + current |
| **Analysis** | "Is INFOSYS in uptrend?" | Market Twin | Trend + indicators |
| | "Technical analysis of TCS" | Market Twin | Technical indicators |
| | "What's the market sentiment?" | Market Twin | Sentiment gauge |
| **News** | "Any news about RIL?" | Asset Twin | News headlines |
| | "Sector news for IT" | Market Twin | News summary |

#### 6.2.4 Payment Queries

| Query Category | Example Queries | Data Source | Response Format |
|----------------|-----------------|-------------|-----------------|
| **Balance** | "What's my wallet balance?" | RABTUL Wallet | Balance + coins |
| | "Show recent transactions" | RABTUL Wallet | Transaction list |
| **Payments** | "Pay 500 to merchant X" | RABTUL Pay | Payment confirmation |
| | "Check payment status" | RABTUL Pay | Status |
| **Rewards** | "How many REZ Coins do I have?" | RABTUL Wallet | Coin balance |
| | "Redeem coins for reward" | RABTUL Wallet | Redemption confirmation |

#### 6.2.5 Lending Queries

| Query Category | Example Queries | Data Source | Response Format |
|----------------|-----------------|-------------|-----------------|
| **Loans** | "Show my active loans" | RABTUL Lending | Loan list |
| | "What's my EMI amount?" | RABTUL Lending | EMI + schedule |
| | "Calculate loan eligibility" | RABTUL Lending | Eligibility + amount |
| **BNPL** | "My BNPL balance" | RABTUL Lending | Outstanding + limit |
| | "Pay BNPL bill" | RABTUL Lending | Payment confirmation |

#### 6.2.6 Islamic Finance Queries

| Query Category | Example Queries | Data Source | Response Format |
|----------------|-----------------|-------------|-----------------|
| **Zakat** | "Calculate my Zakat" | RIDZA Islamic | Zakat amount + breakdown |
| | "Am I eligible for Zakat?" | RIDZA Islamic | Eligibility + Nisab |
| **Murabaha** | "Apply for Murabaha financing" | RIDZA Islamic | Application form |
| | "What are Murabaha rates?" | RIDZA Islamic | Rate + tenure options |
| **Compliance** | "Is stock X Sharia compliant?" | Asset Twin | Compliance status |
| | "Show my Islamic portfolio" | Portfolio Twin | Sharia-filtered holdings |

#### 6.2.7 CFO Queries

| Query Category | Example Queries | Data Source | Response Format |
|----------------|-----------------|-------------|-----------------|
| **Dashboard** | "Show my CFO dashboard" | Finance CFO | KPI cards + charts |
| | "Cash flow summary" | Finance CFO | Summary + breakdown |
| **Forecasts** | "Forecast cash flow for next 3 months" | Finance CFO | Forecast + chart |
| | "Revenue projection" | Finance CFO | Projection + assumptions |
| **Analysis** | "Variance analysis for this month" | Finance CFO | Variance report |
| | "Budget vs actual" | Finance CFO | Comparison + alerts |

### 6.3 Dashboard Views

#### 6.3.1 Investor Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           INVESTOR DASHBOARD                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐          │
│  │    PORTFOLIO VALUE              │  │    TODAY'S CHANGE                │          │
│  │    ₹12,45,678                   │  │    +₹12,345 (+1.2%)             │          │
│  │    As of Jun 12, 2026           │  │    ▲ Up from yesterday           │          │
│  └─────────────────────────────────┘  └─────────────────────────────────┘          │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                         PORTFOLIO ALLOCATION                                    ││
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ ││
│  │  │                                                                          │ ││
│  │  │        Pie Chart: Equity 60%, Debt 25%, Commodities 10%, Cash 5%         │ ││
│  │  │                                                                          │ ││
│  │  └──────────────────────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐                    │
│  │      TOP HOLDINGS          │  │      PERFORMANCE            │                    │
│  │  1. HDFC Bank    +2.3%     │  │  1D    1W    1M    3M   1Y  │                    │
│  │  2. Infosys      +1.8%     │  │  +1.2  +3.4  +5.2  +8.1 +22 │                    │
│  │  3. TCS          +1.5%     │  │  ─────────────────────────── │                    │
│  │  4. RIL          -0.3%     │  │  [====vs Benchmark========] │                    │
│  │  5. Bajaj Fin    +2.1%     │  │                             │                    │
│  └─────────────────────────────┘  └─────────────────────────────┘                    │
│                                                                                      │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐                    │
│  │      RECENT ACTIVITY        │  │      ALERTS                 │                    │
│  │  • Bought 50 HDFC Bank      │  │  ⚠ Portfolio rebalancing    │                    │
│  │  • Received dividend: TCS   │  │    suggested (threshold)    │                    │
│  │  • Sold 100Infosys         │  │  ⚠ High volatility in       │                    │
│  │                             │  │    tech sector               │                    │
│  └─────────────────────────────┘  └─────────────────────────────┘                    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### 6.3.2 CFO Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           CFO DASHBOARD                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐          │
│  │    TOTAL REVENUE (MTD)          │  │    NET PROFIT (MTD)              │          │
│  │    ₹8.45 Cr                      │  │    ₹1.23 Cr                      │          │
│  │    ▲ 12% vs last month          │  │    ▲ 8% vs last month           │          │
│  └─────────────────────────────────┘  └─────────────────────────────────┘          │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                       │
│  │   CASH BALANCE  │  │  BURN RATE     │  │  RUNWAY         │                       │
│  │   ₹2.1 Cr       │  │  ₹15 Lak/Month │  │  14 Months      │                       │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                       │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                    CASH FLOW FORECAST (NEXT 3 MONTHS)                          ││
│  │                                                                                ││
│  │    Jun        Jul        Aug        Sep                                        ││
│  │   ┌───┐     ┌───┐     ┌───┐     ┌───┐                                        ││
│  │   │   │     │   │     │   │     │   │   Projected                           ││
│  │   │   │     │   │     │   │     │   │                                        ││
│  │   └───┘     └───┘     └───┘     └───┘                                        ││
│  │                                                                                ││
│  │   ████       ████       ████       ████    Inflows                           ││
│  │   ░░░░       ░░░░       ░░░░       ░░░░    Outflows                          ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐                    │
│  │      BUDGET VARIANCE        │  │      KPI ALERTS              │                    │
│  │  Marketing:  -15% (over)     │  │  🔴 AR aging > 60 days      │                    │
│  │  Ops:        +5% (under)     │  │  🟡 Revenue behind target   │                    │
│  │  Admin:      +2% (under)     │  │  🟢 Cash flow positive      │                    │
│  └─────────────────────────────┘  └─────────────────────────────┘                    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Insights Available via Business Copilot

| Category | Insights | Description |
|----------|----------|-------------|
| **Portfolio** | Rebalancing Alert | "Your equity allocation has drifted to 65% (target: 60%)" |
| | Underperformance | "Stock X is down 15% this month, lagging sector by 10%" |
| | Concentration Risk | "Stock Y comprises 25% of your portfolio (limit: 20%)" |
| | Tax Loss Harvesting | "Consider selling Stock Z to offset gains of ₹50,000" |
| **Market** | Sector Rotation | "Money flowing from tech to healthcare sector" |
| | Momentum Shift | "Stock X showing weakening momentum, RSI at 72" |
| | News Impact | "Negative news about company Y may impact stock price" |
| **Financial** | Cash Flow Trend | "Operating cash flow improved 20% vs last quarter" |
| | Working Capital | "DSO increased from 45 to 60 days, consider action" |
| | Forecast Variance | "Actual revenue 12% below forecast, investigate" |
| **Islamic** | Sharia Screening | "Stock X added to restricted list due to debt ratio" |
| | Zakat Reminder | "Zakat due date approaching, estimated liability: ₹X" |

---

## 7. Economic Integration

### 7.1 Payment Flows

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT FLOWS - FINANCIAL SERVICES                           │
└─────────────────────────────────────────────────────────────────────────────────────┘

INVESTMENT FLOW:
─────────────────

  Investor              RABTUL              AssetMind           Settlement
    │                     │                     │                   │
    │  1. Initiate        │                     │                   │
    │     Investment      │                     │                   │
    │────────────────────>│                     │                   │
    │                     │  2. Create Order    │                   │
    │                     │────────────────────>│                   │
    │                     │                     │  3. Hold Units    │
    │                     │                     │<───────────────────│
    │  4. Payment          │                     │                   │
    │     (UPI/Card)      │                     │                   │
    │────────────────────>│                     │                   │
    │                     │  5. Process         │                   │
    │                     │     Payment         │                   │
    │                     │───────────────────>│                   │
    │                     │                     │                   │
    │  6. Confirmation    │  7. Success         │                   │
    │<────────────────────│<────────────────────│                   │
    │                     │                     │                   │
    │                     │  8. Settle (T+2)    │                   │
    │                     │────────────────────────────────────────>│


DIVIDEND/RETURN FLOW:
────────────────────

  AssetMind           RABTUL              Investor              Bank
    │                     │                     │                   │
    │  1. Dividend        │                     │                   │
    │     Declared        │                     │                   │
    │<────────────────────│                     │                   │
    │                     │                     │                   │
    │  2. Transfer Units  │                     │                   │
    │────────────────────>│                     │                   │
    │                     │  3. Credit Wallet   │                   │
    │                     │────────────────────>│                   │
    │                     │                     │                   │
    │                     │  4. REZ Coins       │                   │
    │                     │     Awarded         │                   │
    │                     │     (0.5% bonus)   │                   │
    │                     │────────────────────>│                   │
    │                     │                     │                   │
    │                     │  5. Notify          │                   │
    │                     │────────────────────>│                   │
    │                     │                     │                   │


LOAN DISBURSEMENT FLOW:
───────────────────────

  Borrower            RABTUL              RIDZA              Beneficiary
    │                     │                     │                   │
    │  1. Loan Approved   │                     │                   │
    │<────────────────────│                     │                   │
    │                     │                     │                   │
    │  2. Initiate        │                     │                   │
    │     Disbursement    │                     │                   │
    │────────────────────>│                     │                   │
    │                     │  3. Disburse        │                   │
    │                     │     Funds           │                   │
    │                     │────────────────────>│                   │
    │                     │                     │                   │
    │  4. Funds Received  │                     │                   │
    │<────────────────────│                     │                   │
    │                     │                     │                   │
    │                     │  5. Link to EMI     │                   │
    │                     │     Schedule        │                   │
    │                     │────────────────────>│                   │
```

### 7.2 REZ Coins Integration

#### 7.2.1 REZ Coins Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         REZ COINS ECOSYSTEM                                          │
└─────────────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────────────────────────────────┐
                         │              REZ COINS FLOW                      │
                         └─────────────────────────────────────────────────┘

  EARN                                    TRANSFER                               REDEEM
    │                                       │                                      │
    │  Investment Made                      │  Send to Friend                      │  Exchange for Rewards
    │  ───────────────                      │  ──────────────                       │  ───────────────────
    │                                       │                                      │
    ▼                                       ▼                                      ▼
┌──────────┐                           ┌──────────┐                           ┌──────────┐
│ 0.5%    │                           │  1:1     │                           │ Rewards  │
│ Coins   │                           │  Transfer│                           │ Catalog  │
│ Earned  │                           │  Fee: 0% │                           │         │
└────┬────┘                           └────┬─────┘                           └────┬────┘
     │                                      │                                      │
     │  Monthly                           │  Business                            │  Merchants
     │  Cashback                           │  Payments                            │  Available
     │  ─────────                           │  ─────────                           │  ─────────
     │  • RABTUL Pay: 0.5%                 │  • Pay suppliers                     │  • REZ Mart
     │  • RABTUL Wallet: 1%                 │  • Pay employees                     │  • Partner brands
     │                                       │  • Pay taxes                         │  • Gift cards
     │                                       │                                      │
     │  Cross-Product                      │                                      │
     │  ──────────────                      │                                      │
     │  • Portfolio trade: 0.1%             │                                      │
     │  • Insurance premium: 2%              │                                      │
     │  • Loan repayment: 0.25%              │                                      │


COIN BALANCE TRACKING:
─────────────────────

┌──────────────────────────────────────────────────────────────────────────────────────┐
│                        COIN WALLET (RABTUL WALLET - PORT 4004)                       │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Balance: 12,500 REZ Coins = ₹1,250 (1 Coin = ₹0.10)                                │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                           COIN HISTORY                                        │  │
│  ├──────────────────────────────────────────────────────────────────────────────┤  │
│  │  Date       Description                    Earned    Redeemed    Balance      │  │
│  ├──────────────────────────────────────────────────────────────────────────────┤  │
│  │  Jun 12     Investment in MF               +500      -          12,500      │  │
│  │  Jun 10     RABTUL Pay transaction         +50       -          12,000      │  │
│  │  Jun 05     Redeemed for voucher           -          2,000      11,950      │  │
│  │  Jun 01     Monthly cashback               +1,500    -          13,950      │  │
│  │  May 28     Insurance premium              +200      -          12,450      │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

#### 7.2.2 Coin Earning Rates

| Transaction Type | Product | Coin Rate | Description |
|------------------|---------|-----------|-------------|
| Investment Purchase | AssetMind | 0.1% | Per transaction |
| SIP Investment | AssetMind | 0.2% | Monthly |
| Portfolio Value | AssetMind | 0.01%/month | On AUM |
| RABTUL Pay | Wallet | 0.5% | Per transaction |
| RABTUL Wallet | Wallet | 1.0% | Monthly cashback |
| Insurance Premium | RIDZA | 2.0% | Per payment |
| Loan Repayment | RIDZA | 0.25% | Per EMI |
| Islamic Finance | RIDZA | 1.0% | On Murabaha/Ijara |
| Referral | All | 500 coins | Per referred user |

#### 7.2.3 Coin Redemption Options

| Category | Redemption | Coin Cost | Value |
|----------|------------|-----------|-------|
| **Shopping** | REZ Mart voucher | 100 coins | ₹10 |
| | Partner brand voucher | Varies | ₹1/10 coins |
| **Investments** | Reduced brokerage | 1000 coins | ₹100 off |
| | Advisory fee waiver | 5000 coins | ₹500 off |
| **Financial** | Loan processing fee | 2000 coins | ₹200 off |
| | Insurance premium | 500 coins | ₹50 off |
| **Lifestyle** | Partner services | Varies | 1 coin = ₹0.10 |
| | Gold (Sharia) | 10000 coins | ₹1000 value |

### 7.3 Loyalty Integration

#### 7.3.1 Tier Structure

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         FINANCIAL SERVICES LOYALTY TIERS                            │
└─────────────────────────────────────────────────────────────────────────────────────┘

                           ┌──────────────────┐
                           │     PLATINUM     │
                           │  (₹50L+ AUM)     │
                           │                  │
                           │  • Priority support
                           │  • Free advisory
                           │  • Exclusive products
                           │  • 2x coin earning
                           └────────┬─────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      GOLD        │     │     SILVER       │     │     BRONZE       │
│   (₹10L+ AUM)    │     │   (₹2L+ AUM)    │     │   (All Users)   │
│                  │     │                  │     │                  │
│ • Priority access│     │ • Extended hours │     │ • Basic rewards  │
│ • Premium reports │     │ • Monthly report │     │ • Standard coins │
│ • 1.5x coins     │     │ • 1.25x coins    │     │ • 1x coins      │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

#### 7.3.2 Loyalty Benefits by Tier

| Benefit | Bronze | Silver | Gold | Platinum |
|---------|--------|--------|------|----------|
| Coin Earning | 1x | 1.25x | 1.5x | 2x |
| Advisory Fee | Full | 10% off | 25% off | Free |
| Research Reports | Basic | Monthly | Weekly | Daily + Exclusive |
| Transaction Fee | Standard | -5% | -15% | -30% |
| Priority Support | - | Yes | Yes | Dedicated RM |
| Islamic Products | Standard | -10% | -20% | -30% |
| Exclusive Events | - | - | Quarterly | Monthly |

---

## 8. Implementation Roadmap

### 8.1 Phase 1: Core Integration (Weeks 1-2)

**Objective:** Establish foundational integrations between AssetMind, TwinOS, and RABTUL services.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 1: CORE INTEGRATION (WEEKS 1-2)                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  WEEK 1: Foundation                                                                 │
│  ──────────────────                                                                  │
│                                                                                      │
│  Day 1-2: Twin Hub Setup                                                             │
│  ─────────────────────────                                                          │
│  • Deploy Twin Hub (Port 5250)                                                       │
│  • Register Investor Twin (5005)                                                    │
│  • Register Portfolio Twin (5004)                                                   │
│  • Health monitoring setup                                                          │
│                                                                                      │
│  Day 3-4: AssetMind Integration                                                     │
│  ─────────────────────────────────                                                  │
│  • Connect AssetMind API Gateway to Twin Hub                                         │
│  • Sync investor profiles                                                           │
│  • Sync portfolio holdings                                                         │
│  • Real-time update pipeline                                                        │
│                                                                                      │
│  Day 5: RABTUL Core Integration                                                     │
│  ───────────────────────────────                                                     │
│  • Connect RABTUL Pay (4001) to Twin Hub                                             │
│  • Connect RABTUL Wallet (4004) to Twin Hub                                         │
│  • Payment event publishing                                                          │
│                                                                                      │
│  WEEK 2: API Development                                                            │
│  ───────────────────────                                                             │
│                                                                                      │
│  Day 6-7: TwinOS API Development                                                    │
│  ─────────────────────────────────                                                   │
│  • Develop cross-twin query API                                                      │
│  • Implement sync endpoints                                                         │
│  • WebSocket event streaming                                                         │
│  • API documentation (OpenAPI)                                                       │
│                                                                                      │
│  Day 8-9: Business Copilot Integration                                               │
│  ─────────────────────────────────────                                               │
│  • Natural language query parser                                                     │
│  • Response formatter                                                                │
│  • Basic dashboard views                                                             │
│                                                                                      │
│  Day 10: Testing & Validation                                                        │
│  ───────────────────────────                                                         │
│  • Integration testing                                                               │
│  • Performance benchmarking                                                          │
│  • Error handling validation                                                         │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### Phase 1 Deliverables

| Deliverable | Description | Success Criteria |
|-------------|-------------|------------------|
| Twin Hub Deployed | Central orchestration service | Health checks pass |
| Investor Twin Sync | Bidirectional sync with AssetMind | < 5s sync latency |
| Portfolio Twin Sync | Holdings sync in real-time | < 1s update latency |
| Payment Integration | RABTUL Pay/Wallet connected | 100% transaction capture |
| Cross-Twin Query | Unified query API | < 500ms response |
| Basic Dashboard | Investor and portfolio views | 5 core metrics displayed |

#### Phase 1 Technical Tasks

```yaml
tasks:
  - id: "P1-T1"
    title: "Deploy Twin Hub Service"
    service: "assetmind-twin-hub"
    port: 5250
    effort: "1 day"
    
  - id: "P1-T2"
    title: "Register Twins with Hub"
    services: ["investor-twin", "portfolio-twin", "market-twin"]
    effort: "1 day"
    
  - id: "P1-T3"
    title: "Build Twin Sync API"
    endpoints: ["/api/hub/sync", "/api/hub/query"]
    effort: "2 days"
    
  - id: "P1-T4"
    title: "Integrate RABTUL Services"
    services: ["rabtul-pay", "rabtul-wallet"]
    effort: "1 day"
    
  - id: "P1-T5"
    title: "Implement WebSocket Events"
    events: ["portfolio.updated", "payment.success"]
    effort: "2 days"
    
  - id: "P1-T6"
    title: "Business Copilot Query Parser"
    nlp: true
    effort: "2 days"
```

### 8.2 Phase 2: Advanced Features (Weeks 3-4)

**Objective:** Add lending, Islamic finance, and CFO capabilities.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 2: ADVANCED FEATURES (WEEKS 3-4)                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  WEEK 3: Lending & Islamic Finance                                                  │
│  ────────────────────────────────────                                                │
│                                                                                      │
│  Day 11-12: RABTUL Lending Integration                                              │
│  ─────────────────────────────────────                                              │
│  • Connect RABTUL Lending to Twin Hub                                               │
│  • Credit profile synchronization                                                   │
│  • Loan portfolio views                                                             │
│  • EMI tracking                                                                     │
│                                                                                      │
│  Day 13-14: Islamic Finance Integration                                             │
│  ──────────────────────────────────────                                             │
│  • Connect RIDZA Islamic Finance (4530)                                             │
│  • Sharia compliance checker integration                                            │
│  • Zakat calculator integration                                                     │
│  • Islamic product catalog                                                          │
│                                                                                      │
│  WEEK 4: CFO & Analytics                                                            │
│  ──────────────────────────                                                         │
│                                                                                      │
│  Day 15-16: Finance CFO Integration                                                 │
│  ──────────────────────────────────                                                  │
│  • Connect Finance CFO (5200) to Twin Hub                                           │
│  • Cash flow dashboard integration                                                  │
│  • Budget vs actual views                                                           │
│  • Forecast API integration                                                         │
│                                                                                      │
│  Day 17-18: Advanced Analytics                                                      │
│  ────────────────────────────                                                       │
│  • Portfolio analytics (Sharpe, VaR, drawdown)                                     │
│  • Risk scoring integration                                                         │
│  • Performance attribution                                                           │
│  • Alert engine implementation                                                       │
│                                                                                      │
│  Day 19-20: Agent System                                                            │
│  ───────────────────────                                                             │
│  • Deploy Agent Orchestrator (5090)                                                 │
│  • Implement Portfolio Optimization Agent                                            │
│  • Implement Risk Management Agent                                                   │
│  • Agent skill registry                                                             │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### Phase 2 Deliverables

| Deliverable | Description | Success Criteria |
|-------------|-------------|------------------|
| Lending Integration | RABTUL Lending connected | Full loan lifecycle |
| Islamic Finance | RIDZA products integrated | 4 products available |
| CFO Dashboard | Finance CFO connected | 8 KPI widgets |
| Risk Analytics | Risk metrics calculated | VaR, Sharpe, drawdown |
| Agent System | Basic agents deployed | 3 agents operational |
| Alert Engine | Real-time alerts | < 10s delivery |

#### Phase 2 Technical Tasks

```yaml
tasks:
  - id: "P2-T1"
    title: "RABTUL Lending Integration"
    service: "rabtul-lending"
    effort: "2 days"
    
  - id: "P2-T2"
    title: "Islamic Finance Integration"
    service: "ridza-islamic-finance"
    effort: "2 days"
    
  - id: "P2-T3"
    title: "Finance CFO Integration"
    service: "finance-cfo"
    effort: "2 days"
    
  - id: "P2-T4"
    title: "Risk Analytics Engine"
    metrics: ["VaR", "Sharpe", "Drawdown", "Beta"]
    effort: "2 days"
    
  - id: "P2-T5"
    title: "Deploy Agent Orchestrator"
    service: "assetmind-agents"
    port: 5090
    effort: "2 days"
    
  - id: "P2-T6"
    title: "Implement Core Agents"
    agents: ["portfolio-optimizer", "risk-manager", "market-analysis"]
    effort: "2 days"
```

### 8.3 Phase 3: Optimization (Weeks 5-6)

**Objective:** Performance optimization, advanced copilot features, and production hardening.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 3: OPTIMIZATION (WEEKS 5-6)                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  WEEK 5: Performance & Reliability                                                   │
│  ────────────────────────────────────                                                │
│                                                                                      │
│  Day 21-22: Performance Optimization                                                │
│  ───────────────────────────────────                                                 │
│  • Query optimization (caching, indexing)                                           │
│  • Response time optimization (< 200ms P95)                                         │
│  • Load testing and capacity planning                                               │
│                                                                                      │
│  Day 23-24: Reliability Hardening                                                    │
│  ─────────────────────────────────                                                   │
│  • Circuit breaker implementation                                                    │
│  • Retry policies for all integrations                                              │
│  • Dead letter queue setup                                                          │
│  • Graceful degradation                                                             │
│                                                                                      │
│  Day 25: Security Hardening                                                          │
│  ──────────────────────────                                                         │
│  • Penetration testing                                                              │
│  • Compliance check (SOC 2, PCI DSS)                                                │
│  • Encryption audit                                                                 │
│  • Access control review                                                            │
│                                                                                      │
│  WEEK 6: Advanced Copilot & Launch                                                  │
│  ─────────────────────────────────                                                  │
│                                                                                      │
│  Day 26-27: Advanced Business Copilot                                               │
│  ────────────────────────────────────                                                │
│  • Advanced NLP queries                                                             │
│  • Predictive insights                                                              │
│  • Voice interface                                                                  │
│  • Mobile-optimized views                                                            │
│                                                                                      │
│  Day 28-29: Integration Testing                                                      │
│  ────────────────────────────                                                        │
│  • End-to-end scenario testing                                                      │
│  • Failover testing                                                                 │
│  • Disaster recovery drill                                                           │
│                                                                                      │
│  Day 30: Production Launch                                                           │
│  ─────────────────────                                                               │
│  • Go-live checklist completion                                                     │
│  • Monitoring dashboard deployment                                                  │
│  • Runbook documentation                                                            │
│  • Support handoff                                                                 │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### Phase 3 Deliverables

| Deliverable | Description | Success Criteria |
|-------------|-------------|------------------|
| Performance | Optimized response times | P95 < 200ms |
| Reliability | Circuit breakers, retries | 99.9% uptime |
| Security | Hardened security posture | PCI DSS compliant |
| Advanced Copilot | Voice + Predictive | 10 advanced queries |
| Monitoring | Full observability | 100% coverage |
| Documentation | Runbooks, API docs | Complete |

#### Phase 3 Technical Tasks

```yaml
tasks:
  - id: "P3-T1"
    title: "Performance Optimization"
    targets: ["cache", "index", "query"]
    effort: "2 days"
    
  - id: "P3-T2"
    title: "Circuit Breaker Implementation"
    pattern: "circuit-breaker"
    effort: "1 day"
    
  - id: "P3-T3"
    title: "Security Hardening"
    audits: ["pentest", "pci-dss", "encryption"]
    effort: "2 days"
    
  - id: "P3-T4"
    title: "Advanced Copilot Features"
    features: ["voice", "predictive", "mobile"]
    effort: "2 days"
    
  - id: "P3-T5"
    title: "Monitoring Dashboard"
    tools: ["prometheus", "grafana", "sentry"]
    effort: "2 days"
    
  - id: "P3-T6"
    title: "Documentation & Runbooks"
    docs: ["api", "runbooks", "troubleshooting"]
    effort: "1 day"
```

### 8.4 Resource Requirements

#### 8.4.1 Team Composition

| Role | Count | Phase 1 | Phase 2 | Phase 3 |
|------|-------|---------|---------|---------|
| Backend Engineer | 2 | Full | Full | Full |
| Frontend Engineer | 1 | 50% | 50% | 100% |
| AI/ML Engineer | 1 | 25% | 50% | 25% |
| DevOps Engineer | 1 | 50% | 50% | 100% |
| QA Engineer | 1 | 50% | 75% | 100% |
| Product Manager | 1 | 50% | 50% | 50% |

#### 8.4.2 Infrastructure Requirements

| Resource | Specification | Phase 1 | Phase 2 | Phase 3 |
|----------|---------------|---------|---------|---------|
| Compute | 4 vCPU, 8GB RAM | 2 instances | 4 instances | 6 instances |
| Database | PostgreSQL 16GB | 1 primary | 1 primary + 1 replica | 1 primary + 2 replicas |
| Cache | Redis 8GB | 1 cluster | 1 cluster | 2 clusters |
| Message Queue | RabbitMQ | 1 cluster | 1 cluster | 2 clusters |
| Monitoring | Grafana + Prometheus | Basic | Advanced | Full |

### 8.5 Success Metrics

| Metric | Baseline | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|--------|----------|----------------|----------------|----------------|
| API Response (P95) | N/A | < 500ms | < 300ms | < 200ms |
| Sync Latency | N/A | < 5s | < 2s | < 1s |
| Uptime | N/A | 99.5% | 99.7% | 99.9% |
| Test Coverage | N/A | 60% | 75% | 85% |
| Documentation | N/A | 70% | 85% | 95% |
| Active Users | 0 | 100 | 1,000 | 10,000 |
| Transactions/day | 0 | 1,000 | 10,000 | 100,000 |

### 8.6 Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data sync conflicts | Medium | High | Implement conflict resolution strategy |
| Third-party API failures | High | Medium | Circuit breakers + fallbacks |
| Performance bottlenecks | Medium | Medium | Load testing + optimization sprints |
| Security vulnerabilities | Low | Critical | Regular audits + penetration testing |
| User adoption challenges | Medium | Medium | User training + feedback loops |

---

## Appendix A: Service Port Registry

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Twin Hub | 5250 | REST/WS | Central orchestration |
| Investor Twin | 5005 | REST | Investor profiles |
| Portfolio Twin | 5004 | REST | Portfolio data |
| Market Twin | 5003 | REST | Market intelligence |
| Asset Twin | 5006 | REST | Asset data |
| Economic Twin | 5009 | REST | Macro data |
| Analyst Twin | 5007 | REST | Analyst coverage |
| Competitor Twin | 5008 | REST | Competitive intel |
| Decision Twin | 5010 | REST | Decision support |
| Twin Engine | 5002 | REST | Twin operations |
| RABTUL Pay | 4001 | REST | Payments |
| RABTUL Wallet | 4004 | REST | Wallet |
| RABTUL Auth | 4002 | REST | Authentication |
| RABTUL Lending | 4300 | REST | Lending |
| RIDZA Finance | 5200 | REST | CFO/Accounting |
| RIDZA Islamic | 4530 | REST | Islamic finance |
| Agent Orchestrator | 5090 | REST | Agent system |
| Business Copilot | 4600 | REST | NLP interface |

---

## Appendix B: API Response Time SLAs

| Endpoint Category | SLA | Priority |
|-------------------|-----|----------|
| Health checks | 50ms | Critical |
| Twin reads | 100ms | Critical |
| Twin writes | 200ms | Critical |
| Cross-twin queries | 300ms | High |
| Payment initiation | 500ms | Critical |
| Analytics | 1s | Medium |
| Reports | 5s | Low |

---

## Appendix C: Data Retention Policy

| Data Type | Retention Period | Storage |
|-----------|------------------|---------|
| Transaction logs | 7 years | Cold storage |
| Market data | 5 years | Cold storage |
| User profiles | Account lifetime + 2 years | Hot storage |
| Audit logs | 7 years | Cold storage |
| Analytics data | 2 years | Warm storage |
| Session data | 90 days | Hot storage |

---

**Document Version:** 1.0  
**Created:** June 12, 2026  
**Last Updated:** June 12, 2026  
**Author:** RTNM Digital Architecture Team  
**Status:** APPROVED FOR IMPLEMENTATION
