# Financial OS Integration Specification

**Version:** 1.0.0  
**Last Updated:** 2026-06-12  
**Industry:** Financial Services

---

## Executive Summary

The Financial OS Integration Specification defines the technical architecture for connecting RTMN's financial products with TwinOS, enabling real-time digital twins of investors, portfolios, markets, assets, economics, analysts, competitors, decisions, and the Twin Hub itself. The integration creates a unified data layer where AssetMind Terminal serves as the primary data hub, feeding market and portfolio data to TwinOS while consuming AI-driven insights for investment decisions.

**Key Integration Point:** AssetMind ↔ TwinOS  
**Data Flow Direction:** Bidirectional - AssetMind produces market data, TwinOS orchestrates financial twins  
**Primary Protocol:** REST API with WebSocket for real-time market data  
**Authentication:** OAuth 2.0 + mTLS for trading systems

---

## Product Capability Matrix

### 1. AssetMind Terminal

| Attribute | Value |
|-----------|-------|
| **Port** | `8943` |
| **Capabilities** | Portfolio management, real-time quotes, charting, alerts, news aggregation, research tools |
| **Data Produced** | Portfolio snapshots, price updates, alert triggers, research notes |
| **Data Needed** | Investor Twin, Portfolio Twin, Market Twin, Asset Twin |
| **TwinOS Role** | PRIMARY PRODUCER - financial data hub |

### 2. RABTUL Pay

| Attribute | Value |
|-----------|-------|
| **Port** | `8944` |
| **Capabilities** | Business payments, batch processing, payroll, vendor management, international transfers |
| **Data Produced** | Payment transactions, batch status, vendor payments |
| **Data Needed** | Investor Twin, Portfolio Twin |

### 3. RABTUL Wallet

| Attribute | Value |
|-----------|-------|
| **Port** | `8945` |
| **Capabilities** | Digital wallet, balance management, peer-to-peer transfers, QR payments, card management |
| **Data Produced** | Wallet transactions, balances, transfer records |
| **Data Needed** | Investor Twin, Portfolio Twin |

### 4. RABTUL Lending

| Attribute | Value |
|-----------|-------|
| **Port** | `8946` |
| **Capabilities** | Loan origination, credit scoring, underwriting, repayment tracking, default prediction |
| **Data Produced** | Loan applications, credit scores, repayment records, default predictions |
| **Data Needed** | Investor Twin, Economic Twin |

### 5. RABTUL Connect

| Attribute | Value |
|-----------|-------|
| **Port** | `8947` |
| **Capabilities** | Open banking, account aggregation, data sharing, consent management, API marketplace |
| **Data Produced** | Aggregated account data, transaction categorization, consent records |
| **Data Needed** | Investor Twin, Portfolio Twin |

### 6. Finance CFO

| Attribute | Value |
|-----------|-------|
| **Port** | `8948` |
| **Capabilities** | Cash flow management, financial planning, variance analysis, forecasting, treasury |
| **Data Produced** | CF projections, variance reports, treasury positions |
| **Data Needed** | Portfolio Twin, Economic Twin, Market Twin |

### 7. Finance Accountant

| Attribute | Value |
|-----------|-------|
| **Port** | `8949` |
| **Capabilities** | Accounting, bookkeeping, reconciliation, audit trails, compliance reporting |
| **Data Produced** | Journal entries, ledgers, audit records, tax documents |
| **Data Needed** | Portfolio Twin, Investor Twin |

### 8. Portfolio Analysis

| Attribute | Value |
|-----------|-------|
| **Port** | `8950` |
| **Capabilities** | Performance attribution, risk analytics, factor analysis, benchmarking, optimization |
| **Data Produced** | Performance metrics, risk measures, attribution breakdowns |
| **Data Needed** | Portfolio Twin, Market Twin, Asset Twin |

### 9. Market Intelligence

| Attribute | Value |
|-----------|-------|
| **Port** | `8951` |
| **Capabilities** | Market data aggregation, sentiment analysis, sector analysis, thematic trends |
| **Data Produced** | Market data, sentiment scores, sector metrics, trend analysis |
| **Data Needed** | Market Twin, Economic Twin, Asset Twin |

### 10. RIDZA Islamic Finance

| Attribute | Value |
|-----------|-------|
| **Port** | `8952` |
| **Capabilities** | Sharia-compliant investing, sukuk analysis, Islamic screening, zakah calculation |
| **Data Produced** | Halal portfolios, sukuk data, compliance reports |
| **Data Needed** | Portfolio Twin, Asset Twin, Market Twin |

### 11. Finance CRM Service

| Attribute | Value |
|-----------|-------|
| **Port** | `TBD` |
| **Company** | REZ Merchant |
| **Capabilities** | Customer profiles, segmentation, campaigns, visit tracking |
| **Data Produced** | Customer segments, campaign results, churn risk |
| **Data Needed** | Customer Twin, Transaction Twin |
| **TwinOS Role** | CUSTOMER INTELLIGENCE |

---

## Digital Twin Definitions

### Investor Twin

**TwinOS Entity ID:** `twin.finance.investor.{investor_id}`

**Attributes:**
```json
{
  "investor_id": "string (UUID)",
  "profile": {
    "name": {
      "first": "string",
      "last": "string",
      "middle": "string|null"
    },
    "email": "string",
    "phone": "string",
    "investor_type": "individual|institutional|corporate|family_office",
    "accredited": "boolean",
    "tax_id": "string|null"
  },
  "kyc": {
    "status": "pending|verified|expired|rejected",
    "verification_date": "ISO8601 date|null",
    "risk_rating": "conservative|moderate|aggressive",
    "aml_check": "passed|pending|failed"
  },
  "preferences": {
    "investment_goals": ["string"],
    "risk_tolerance": "conservative|moderate|aggressive",
    "time_horizon": "short_term|medium_term|long_term",
    "liquidity_needs": "high|medium|low",
    "ethical_screening": ["string"],
    "preferred_asset_classes": ["string"],
    "geographic_focus": ["string"]
  },
  "financial_profile": {
    "net_worth": "number",
    "liquid_net_worth": "number",
    "annual_income": "number",
    "investment_capacity": "number",
    "debt_obligations": "number"
  },
  "portfolios": ["string (portfolio_ids)"],
  "connected_accounts": [
    {
      "account_id": "string",
      "institution": "string",
      "account_type": "string",
      "last_synced": "ISO8601 datetime"
    }
  ],
  "activity": {
    "last_login": "ISO8601 datetime",
    "last_trade": "ISO8601 datetime",
    "total_trades": "number",
    "avg_session_duration": "number (minutes)"
  },
  "permissions": {
    "can_trade": "boolean",
    "can_leverage": "boolean",
    "can_short": "boolean",
    "max_position_size": "number",
    "allowed_strategies": ["string"]
  }
}
```

**Relationships:**
- `OWNS` → Portfolio Twin (1:many)
- `LINKED_TO` → Connected Accounts
- `CONSENTS_TO` → Consent Twin
- `RECOMMENDED_BY` → Analyst Twin

**Managing Agent:** `agent.investor_intelligence`

### Portfolio Twin

**TwinOS Entity ID:** `twin.finance.portfolio.{portfolio_id}`

**Attributes:**
```json
{
  "portfolio_id": "string (UUID)",
  "investor_id": "string",
  "name": "string",
  "type": "equity|fixed_income|mixed|alternative|islamic|retirement|trust",
  "strategy": "string",
  "inception_date": "ISO8601 date",
  "status": "active|closed|archived",
  "holdings": [
    {
      "asset_id": "string",
      "quantity": "number",
      "cost_basis": "number",
      "current_value": "number",
      "weight": "number",
      "unrealized_gain_loss": "number",
      "unrealized_gain_loss_pct": "number"
    }
  ],
  "cash": {
    "available": "number",
    "pending": "number",
    "currency": "string"
  },
  "performance": {
    "total_value": "number",
    "total_cost": "number",
    "total_gain_loss": "number",
    "total_gain_loss_pct": "number",
    "day_change": "number",
    "day_change_pct": "number",
    "mtd_return": "number",
    "ytd_return": "number",
    "1yr_return": "number",
    "3yr_return": "number",
    "5yr_return": "number",
    "since_inception": "number"
  },
  "risk_metrics": {
    "volatility": "number",
    "sharpe_ratio": "number",
    "sortino_ratio": "number",
    "max_drawdown": "number",
    "var_95": "number",
    "beta": "number",
    "correlation_to_benchmark": "number"
  },
  "allocation": {
    "by_asset_class": {
      "equity": "number",
      "fixed_income": "number",
      "cash": "number",
      "alternatives": "number",
      "real_estate": "number"
    },
    "by_sector": "object",
    "by_geography": "object",
    "by_currency": "object"
  },
  "compliance": {
    "concentration_limit": "number",
    "largest_position_pct": "number",
    "sector_concentration_pct": "number",
    "compliant": "boolean",
    "violations": ["string"]
  },
  "benchmark": {
    "name": "string",
    "ytd_return": "number",
    "tracking_error": "number"
  }
}
```

**Relationships:**
- `OWNED_BY` → Investor Twin
- `CONTAINS` → Asset Twin (1:many)
- `BENCHMARKED_AGAINST` → Market Twin
- `ANALYZED_BY` → Analyst Twin

**Managing Agent:** `agent.portfolio_intelligence`

### Market Twin

**TwinOS Entity ID:** `twin.finance.market.{market_id}`

**Attributes:**
```json
{
  "market_id": "string (UUID)",
  "profile": {
    "name": "string",
    "type": "equity|fixed_income|commodity|crypto|forex|derivative",
    "exchange": "string",
    "country": "string",
    "timezone": "string"
  },
  "indices": [
    {
      "index_id": "string",
      "name": "string",
      "value": "number",
      "change": "number",
      "change_pct": "number",
      "updated_at": "ISO8601 datetime"
    }
  ],
  "session": {
    "status": "pre_market|open|after_hours|closed",
    "next_open": "ISO8601 datetime",
    "next_close": "ISO8601 datetime",
    "holiday": "string|null"
  },
  "data": {
    "advancing": "number",
    "declining": "number",
    "unchanged": "number",
    "new_highs": "number",
    "new_lows": "number",
    "volume": "number",
    "avg_volume": "number",
    "turnover": "number"
  },
  "sentiment": {
    "fear_greed_index": "number (0-100)",
    "put_call_ratio": "number",
    "vix": "number",
    "trend": "bullish|bearish|neutral"
  },
  "sectors": [
    {
      "sector_id": "string",
      "name": "string",
      "change_pct": "number",
      "volume": "number"
    }
  ],
  "correlations": {
    "sp500_correlation": "number",
    "bond_correlation": "number",
    "commodity_correlation": "number"
  }
}
```

**Relationships:**
- `TRACKS` → Asset Twin (1:many)
- `INFLUENCES` → Economic Twin
- `MONITORED_BY` → Analyst Twin

**Managing Agent:** `agent.market_intelligence`

### Asset Twin

**TwinOS Entity ID:** `twin.finance.asset.{asset_id}`

**Attributes:**
```json
{
  "asset_id": "string (UUID)",
  "profile": {
    "ticker": "string",
    "name": "string",
    "asset_class": "equity|fixed_income|etf|mutual_fund|commodity|crypto|forex",
    "exchange": "string",
    "cusip": "string|null",
    "isin": "string|null"
  },
  "pricing": {
    "last_price": "number",
    "bid": "number",
    "ask": "number",
    "bid_size": "number",
    "ask_size": "number",
    "volume": "number",
    "avg_volume_30d": "number",
    "updated_at": "ISO8601 datetime"
  },
  "fundamentals": {
    "market_cap": "number",
    "enterprise_value": "number",
    "pe_ratio": "number",
    "forward_pe": "number",
    "peg_ratio": "number",
    "pb_ratio": "number",
    "ps_ratio": "number",
    "dividend_yield": "number",
    "dividend_amount": "number",
    "beta": "number",
    "revenue": "number",
    "ebitda": "number",
    "eps": "number",
    "eps_growth": "number"
  },
  "technical": {
    "sma_50": "number",
    "sma_200": "number",
    "52w_high": "number",
    "52w_low": "number",
    "rsi_14": "number",
    "macd": "string",
    "trend": "bullish|bearish|neutral"
  },
  "ownership": {
    "institutions_pct": "number",
    "insiders_pct": "number",
    "public_float_pct": "number",
    "top_holders": [
      {
        "holder": "string",
        "shares": "number",
        "pct": "number"
      }
    ]
  },
  "islamic_compliance": {
    "screened": "boolean",
    "compliance_status": "compliant|non_compliant|review",
    "debt_ratio": "number",
    "interest_income_pct": "number",
    "cash_flow_operations": ["string"]
  },
  "news": [
    {
      "headline": "string",
      "source": "string",
      "sentiment": "positive|negative|neutral",
      "published_at": "ISO8601 datetime"
    }
  ]
}
```

**Relationships:**
- `TRADED_ON` → Market Twin
- `HELD_IN` → Portfolio Twin (1:many)
- `ANALYZED_BY` → Analyst Twin
- `COMPETES_WITH` → Competitor Twin (1:many)

**Managing Agent:** `agent.asset_intelligence`

### Economic Twin

**TwinOS Entity ID:** `twin.finance.economic.{region_id}`

**Attributes:**
```json
{
  "region_id": "string (UUID)",
  "profile": {
    "name": "string",
    "type": "country|region|bloc",
    "currency": "string",
    "timezone": "string"
  },
  "indicators": {
    "gdp": {
      "value": "number",
      "growth_yoy": "number",
      "growth_qoq": "number",
      "updated_at": "ISO8601 date"
    },
    "inflation": {
      "cpi": "number",
      "core_cpi": "number",
      "ppi": "number",
      "updated_at": "ISO8601 date"
    },
    "employment": {
      "unemployment_rate": "number",
      "labor_force_participation": "number",
      "jobless_claims": "number",
      "updated_at": "ISO8601 date"
    },
    "interest_rates": {
      "policy_rate": "number",
      "prime_rate": "number",
      "libor": "number|null",
      "sofr": "number|null",
      "updated_at": "ISO8601 date"
    },
    "housing": {
      "housing_starts": "number",
      "building_permits": "number",
      "home_price_index": "number",
      "updated_at": "ISO8601 date"
    },
    "consumer": {
      "consumer_confidence": "number",
      "retail_sales": "number",
      "personal_income": "number",
      "personal_spending": "number",
      "updated_at": "ISO8601 date"
    }
  },
  "central_bank": {
    "name": "string",
    "policy_stance": "accommodative|neutral|restrained",
    "next_meeting": "ISO8601 date",
    "rate_decision_probability": {
      "hike": "number",
      "hold": "number",
      "cut": "number"
    }
  },
  "government": {
    "debt_to_gdp": "number",
    "deficit_to_gdp": "number",
    "credit_rating": "string",
    "fiscal_stance": "string"
  },
  "trade": {
    "trade_balance": "number",
    "exports": "number",
    "imports": "number",
    "updated_at": "ISO8601 date"
  }
}
```

**Relationships:**
- `IMPACTS` → Market Twin (1:many)
- `MONITORED_BY` → Analyst Twin
- `RELEVANT_FOR` → Portfolio Twin (1:many)

**Managing Agent:** `agent.economic_intelligence`

### Analyst Twin

**TwinOS Entity ID:** `twin.finance.analyst.{analyst_id}`

**Attributes:**
```json
{
  "analyst_id": "string (UUID)",
  "profile": {
    "name": "string",
    "firm": "string",
    "credentials": ["string"],
    "coverage_start_date": "ISO8601 date"
  },
  "expertise": {
    "sectors": ["string"],
    "asset_classes": ["string"],
    "geographies": ["string"]
  },
  "ratings": {
    "strong_buy": "number",
    "buy": "number",
    "hold": "number",
    "sell": "number",
    "strong_sell": "number"
  },
  "performance": {
    "avg_return_1m": "number",
    "avg_return_3m": "number",
    "avg_return_1y": "number",
    "hit_rate": "number",
    "avg_hit_magnitude": "number"
  },
  "accuracy": {
    "earnings_estimate_accuracy": "number",
    "price_target_accuracy": "number",
    "rating_change_accuracy": "number"
  },
  "recent_calls": [
    {
      "asset_id": "string",
      "rating": "string",
      "target_price": "number",
      "current_price": "number",
      "date": "ISO8601 date"
    }
  ]
}
```

**Relationships:**
- `ANALYZES` → Asset Twin (1:many)
- `AFFILIATED_WITH` → Firm Twin
- `MONITORS` → Market Twin

**Managing Agent:** `agent.analyst_intelligence`

### Competitor Twin

**TwinOS Entity ID:** `twin.finance.competitor.{competitor_id}`

**Attributes:**
```json
{
  "competitor_id": "string (UUID)",
  "profile": {
    "name": "string",
    "ticker": "string",
    "sector": "string",
    "founded": "ISO8601 date"
  },
  "market_position": {
    "market_share": "number",
    "rank_in_sector": "number",
    "competitive_advantages": ["string"]
  },
  "products": [
    {
      "product_id": "string",
      "name": "string",
      "market_share": "number",
      "pricing": "string"
    }
  ],
  "financials": {
    "revenue": "number",
    "net_income": "number",
    "market_cap": "number",
    "growth_rate": "number"
  },
  "swot": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  }
}
```

**Relationships:**
- `COMPETES_WITH` → Asset Twin (1:many)
- `ANALYZED_BY` → Analyst Twin

**Managing Agent:** `agent.competitor_intelligence`

### Decision Twin

**TwinOS Entity ID:** `twin.finance.decision.{decision_id}`

**Attributes:**
```json
{
  "decision_id": "string (UUID)",
  "investor_id": "string",
  "portfolio_id": "string",
  "type": "buy|sell|hold|rebalance|adjust",
  "asset_id": "string|null",
  "status": "proposed|approved|executed|rejected|cancelled",
  "timestamp": "ISO8601 datetime",
  "input": {
    "current_state": "object",
    "recommendation": "string",
    "supporting_data": "object"
  },
  "analysis": {
    "rationale": "string",
    "risk_assessment": "string",
    "expected_outcome": "object",
    "alternative_considered": ["string"]
  },
  "approval": {
    "required": "boolean",
    "approver_id": "string|null",
    "approved_at": "ISO8601 datetime|null",
    "notes": "string|null"
  },
  "execution": {
    "executed_at": "ISO8601 datetime|null",
    "execution_price": "number|null",
    "execution_quantity": "number|null",
    "fees": "number|null"
  },
  "outcome": {
    "actual_result": "object",
    "performance_vs_expectation": "number",
    "lessons_learned": "string|null"
  }
}
```

**Relationships:**
- `PROPOSED_BY` → Investor Twin / Agent Twin
- `AFFECTS` → Portfolio Twin
- `RECORDED_IN` → Twin Hub

**Managing Agent:** `agent.decision_tracking`

### Twin Hub

**TwinOS Entity ID:** `twin.finance.hub.{hub_id}`

**Attributes:**
```json
{
  "hub_id": "string (UUID)",
  "name": "string",
  "owner_id": "string",
  "description": "string",
  "twin_references": [
    {
      "twin_type": "string",
      "twin_id": "string",
      "relationship": "string",
      "added_at": "ISO8601 datetime"
    }
  ],
  "views": [
    {
      "view_id": "string",
      "name": "string",
      "description": "string",
      "twin_filters": "object",
      "visualization_config": "object"
    }
  ],
  "permissions": {
    "owner": "string",
    "collaborators": ["string"],
    "public": "boolean"
  },
  "activity": {
    "created_at": "ISO8601 datetime",
    "last_updated": "ISO8601 datetime",
    "access_count": "number"
  }
}
```

**Relationships:**
- `CONNECTS` → All Twin Types (aggregation hub)
- `OWNED_BY` → Investor Twin

**Managing Agent:** `agent.hub_management`

---

## Integration Flows

### Flow 1: Portfolio Management

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  AssetMind  │────▶│   TwinOS    │────▶│ Portfolio  │────▶│  Finance    │
│  Terminal   │     │(Portfolio Twin)│  │  Analysis   │     │    CFO     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                    │                    │
                           ▼                    ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │   RABTUL    │     │   RIDZA     │     │  Market     │
                    │  Connect    │     │  Islamic    │     │Intelligence│
                    └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/portfolios` | Create portfolio |
| GET | `/api/v1/portfolios/{portfolio_id}` | Get portfolio |
| PATCH | `/api/v1/portfolios/{portfolio_id}` | Update portfolio |
| POST | `/api/v1/twins/portfolio` | Create Portfolio Twin |
| GET | `/api/v1/twins/portfolio/{portfolio_id}` | Get Portfolio Twin |
| PATCH | `/api/v1/twins/portfolio/{portfolio_id}` | Update Portfolio Twin |
| POST | `/api/v1/trades` | Execute trade |
| WS | `/ws/portfolio/{portfolio_id}/updates` | Real-time portfolio updates |

### Flow 2: Market Data Ingestion

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Market    │────▶│   TwinOS    │────▶│  AssetMind  │────▶│ Portfolio   │
│Intelligence │     │(Market Twin)│    │  Terminal   │     │  Analysis   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/market/quotes` | Submit market quotes |
| POST | `/api/v1/market/indices` | Update index values |
| GET | `/api/v1/twins/market/{market_id}` | Get Market Twin |
| GET | `/api/v1/twins/asset/{asset_id}` | Get Asset Twin |
| WS | `/ws/market/{market_id}/stream` | Real-time market stream |

### Flow 3: Investment Decision

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   AssetMind │────▶│   TwinOS    │────▶│  Decision   │────▶│  Twin Hub   │
│  Terminal   │     │(Investor Twin)│  │   Twin      │     │  (Record)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/decisions` | Create decision |
| GET | `/api/v1/decisions/{decision_id}` | Get decision |
| PATCH | `/api/v1/decisions/{decision_id}/status` | Update status |
| POST | `/api/v1/hubs` | Create Twin Hub |
| GET | `/api/v1/hubs/{hub_id}` | Get Twin Hub |
| POST | `/api/v1/hubs/{hub_id}/twins` | Add twin to hub |

---

## Agent Architecture

### Agent Registry

| Agent ID | Type | Responsibilities |
|----------|------|------------------|
| `agent.investor_intelligence` | CRM | Investor profiling, preferences, activity tracking |
| `agent.portfolio_intelligence` | Analytics | Portfolio optimization, rebalancing, risk management |
| `agent.market_intelligence` | Data | Market data aggregation, sentiment, trend analysis |
| `agent.asset_intelligence` | Analytics | Asset analysis, technicals, fundamentals |
| `agent.economic_intelligence` | Analytics | Economic indicator tracking, policy impact |
| `agent.analyst_intelligence` | Research | Analyst tracking, consensus estimates |
| `agent.competitor_intelligence` | Research | Competitive analysis, market positioning |
| `agent.decision_tracking` | Operations | Decision recording, outcome tracking |
| `agent.hub_management` | Operations | Twin Hub management, view creation |
| `agent.crm` | CRM | Customer profiles, segmentation, campaign management |
| `agent.twin_orchestrator` | TwinOS Core | Twin CRUD, relationship management |

### Agent Communication Patterns

**Pub/Sub Topics:**
- `finance.portfolio.updated` - Portfolio value changes
- `finance.asset.price_change` - Significant price moves
- `finance.market.open` - Market open/close
- `finance.decision.created` - New decisions
- `finance.decision.executed` - Decision execution
- `finance.alert.triggered` - Alert conditions
- `finance.economic.release` - Economic data releases
- `finance.risk.breach` - Risk limit breaches

**WebSocket Events:**
```json
{
  "event": "price_update",
  "asset_id": "string",
  "timestamp": "ISO8601 datetime",
  "data": {
    "price": "number",
    "change": "number",
    "change_pct": "number",
    "volume": "number"
  }
}
```

---

## Business Copilot Queries Supported

### Portfolio Queries

| Query | Description | Example |
|-------|-------------|---------|
| `portfolio_summary` | Get portfolio overview | "What's my portfolio's current performance?" |
| `holdings_analysis` | Analyze holdings | "What are my top 5 holdings by weight?" |
| `risk_assessment` | Assess portfolio risk | "What's my portfolio's risk profile?" |
| `rebalancing_suggestion` | Get rebalance advice | "Should I rebalance my portfolio?" |
| `performance_attribution` | Break down returns | "What's driving my returns?" |

### Market Queries

| Query | Description | Example |
|-------|-------------|---------|
| `market_overview` | Get market summary | "What's the market doing today?" |
| `sector_performance` | Check sectors | "Which sectors are outperforming?" |
| `market_sentiment` | Get sentiment | "What's the current market sentiment?" |
| `index_performance` | Check indices | "How are the major indices performing?" |
| `volume_analysis` | Analyze volume | "Any unusual volume today?" |

### Asset Queries

| Query | Description | Example |
|-------|-------------|---------|
| `asset_analysis` | Get asset info | "What's the outlook for AAPL?" |
| `technical_analysis` | Get technicals | "What's the technical picture for TSLA?" |
| `fundamental_analysis` | Get fundamentals | "How do MSFT's fundamentals look?" |
| `peer_comparison` | Compare peers | "How does NVDA compare to AMD?" |
| `news_sentiment` | Get news analysis | "What's the news saying about GOOGL?" |

### Economic Queries

| Query | Description | Example |
|-------|-------------|---------|
| `economic_overview` | Get economic summary | "What's the current economic picture?" |
| `interest_rate_outlook` | Rate predictions | "What are rate expectations?" |
| `inflation_analysis` | Analyze inflation | "What's inflation doing?" |
| `gdp_forecast` | GDP outlook | "What's the GDP forecast?" |
| `central_bank_policy` | CB stance | "What's the Fed's current stance?" |

### Example Copilot Interactions

```python
# Example: Portfolio risk assessment
{
  "query": "What's my portfolio's risk profile?",
  "agent": "agent.portfolio_intelligence",
  "context": {
    "portfolio_id": "PORT-123",
    "time_horizon": "1_year"
  },
  "response": {
    "risk_rating": "moderate",
    "risk_score": 58,
    "metrics": {
      "volatility": 14.2,
      "sharpe_ratio": 1.12,
      "max_drawdown": -8.5,
      "var_95": -2.3
    },
    "breakdown": {
      "equity_exposure": 65,
      "fixed_income": 25,
      "alternatives": 10
    },
    "recommendations": [
      {
        "action": "reduce_equity",
        "reason": "Equity exposure above target",
        "suggested_allocation": 60
      }
    ]
  }
}

# Example: Asset analysis
{
  "query": "What's the outlook for NVDA?",
  "agent": "agent.asset_intelligence",
  "context": {
    "asset_id": "NVDA",
    "analysis_type": "comprehensive"
  },
  "response": {
    "rating": "buy",
    "target_price": 950,
    "current_price": 820,
    "upside": 15.9,
    "fundamentals": {
      "pe_ratio": 65.2,
      "forward_pe": 42.1,
      "revenue_growth": 122,
      "eps_growth": 115
    },
    "technicals": {
      "trend": "bullish",
      "rsi": 68,
      "above_sma_200": true
    },
    "catalysts": [
      "AI chip demand continues strong",
      "Data center expansion",
      "New product launches"
    ],
    "risks": [
      "Valuation elevated",
      "Competition increasing",
      "Regulatory scrutiny"
    ]
  }
}
```

---

## Economic Integration

### Payment Flows

| Flow | Description | Integration |
|------|-------------|-------------|
| Trade Execution | Buy/sell securities | AssetMind → TwinOS → Broker |
| Portfolio Rebalancing | Auto-rebalance | Portfolio Analysis → TwinOS → Broker |
| Dividend Processing | Dividend reinvestment | AssetMind → TwinOS → Custodian |
| Fee Payment | Management fees | Finance CFO → TwinOS → Investor |

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/trades/execute` | Execute trade |
| POST | `/api/v1/payments/dividend` | Process dividend |
| POST | `/api/v1/payments/fee` | Process fee |
| GET | `/api/v1/portfolios/{portfolio_id}/cash-flow` | Get cash flows |

### Islamic Finance Integration

| Product | Sharia Compliance |
|---------|------------------|
| RIDZA Islamic | Full Sharia screening |
| Sukuk Analysis | Sukuk-specific metrics |
| Zakah Calculation | Automated zakah |
| Charitable Accounts | Zakat distribution |

**Sharia Screening Criteria:**
```json
{
  "screening_rules": {
    "debt_to_total_assets": "< 33%",
    "cash_to_total_assets": "< 33%",
    "interest_income_to_total_income": "< 5%",
    "prohibited_industries": ["gambling", "alcohol", "pork", "tobacco", "weapons"]
  },
  "purification": {
    "required": true,
    "calculation": "non_compliant_income / total_income"
  }
}
```

---

## Implementation Roadmap

### Week 1: Foundation

**Objective:** Set up TwinOS infrastructure and core financial twins

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 1.1 | Configure TwinOS tenant | DevOps | Secure tenant provisioned |
| 1.2 | Define twin schemas | Data Eng | JSON schemas for all 9 twins |
| 1.3 | Set up AssetMind API | Backend | AssetMind API live |
| 1.4 | Configure OAuth + mTLS | Security | Auth configured |
| 1.5 | Create test environment | DevOps | Isolated test environment |
| 1.6 | Document API contracts | API Team | OpenAPI specs |
| 1.7 | Set up WebSocket server | DevOps | Real-time streaming |
| 1.8 | Create twin provisioning scripts | Data Eng | Automated provisioning |

**Acceptance Criteria:**
- TwinOS tenant accessible
- All twin schemas validated
- AssetMind API responding
- mTLS auth working

### Week 2: Investor & Portfolio Twins

**Objective:** Implement Investor Twin and Portfolio Twin

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 2.1 | Implement Investor Twin CRUD | Backend | Investor Twin API |
| 2.2 | Implement Portfolio Twin CRUD | Backend | Portfolio Twin API |
| 2.3 | Build portfolio aggregation | Backend | Portfolio sync |
| 2.4 | Create AssetMind integration | Backend | AssetMind ↔ TwinOS |
| 2.5 | Build RABTUL Connect integration | Backend | Connect ↔ TwinOS |
| 2.6 | Implement holdings sync | Backend | Holdings tracking |
| 2.7 | Create WebSocket connections | Backend | Real-time streaming |
| 2.8 | Build test scenarios | QA | Integration tests |

**Acceptance Criteria:**
- Investor Twin complete
- Portfolio Twin complete
- Holdings sync working
- Real-time updates flowing

### Week 3: Market & Asset Twins

**Objective:** Implement Market Twin and Asset Twin

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 3.1 | Implement Market Twin CRUD | Backend | Market Twin API |
| 3.2 | Implement Asset Twin CRUD | Backend | Asset Twin API |
| 3.3 | Build market data ingestion | Data Eng | Real-time quotes |
| 3.4 | Create Market Intelligence integration | Backend | Market Intel ↔ TwinOS |
| 3.5 | Implement technical analysis | ML Team | Technical indicators |
| 3.6 | Deploy market_intelligence agent | ML Team | Agent operational |
| 3.7 | Deploy asset_intelligence agent | ML Team | Agent operational |
| 3.8 | Build sentiment analysis | ML Team | News sentiment |

**Acceptance Criteria:**
- Market Twin operational
- Asset Twin operational
- Real-time quotes flowing
- Sentiment analysis working

### Week 4: Economic & Analyst Twins

**Objective:** Implement Economic Twin and Analyst Twin

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 4.1 | Implement Economic Twin CRUD | Backend | Economic Twin API |
| 4.2 | Implement Analyst Twin CRUD | Backend | Analyst Twin API |
| 4.3 | Build economic data pipeline | Data Eng | Indicator sync |
| 4.4 | Create competitor tracking | Backend | Competitor Twin |
| 4.5 | Deploy economic_intelligence agent | ML Team | Agent operational |
| 4.6 | Deploy analyst_intelligence agent | ML Team | Agent operational |
| 4.7 | Build consensus estimates | ML Team | Estimate aggregation |
| 4.8 | Create forecasting models | ML Team | Economic forecasts |

**Acceptance Criteria:**
- Economic Twin operational
- Analyst Twin operational
- Economic indicators flowing
- Forecasts generating

### Week 5: Decision & Twin Hub

**Objective:** Implement Decision Twin and Twin Hub

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 5.1 | Implement Decision Twin CRUD | Backend | Decision Twin API |
| 5.2 | Implement Twin Hub CRUD | Backend | Twin Hub API |
| 5.3 | Build decision workflow | Backend | Decision process |
| 5.4 | Create approval workflow | Backend | Approval routing |
| 5.5 | Deploy decision_tracking agent | ML Team | Agent operational |
| 5.6 | Deploy hub_management agent | ML Team | Agent operational |
| 5.7 | Build view templates | Frontend | Hub views |
| 5.8 | Create Business Copilot queries | NLP Team | Query handlers |

**Acceptance Criteria:**
- Decision Twin operational
- Twin Hub operational
- Workflows working
- Copilot queries functional

### Week 6: Islamic Finance & Go-Live

**Objective:** Connect RIDZA and deploy to production

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 6.1 | Implement RIDZA Islamic Finance | Backend | Islamic Finance ↔ TwinOS |
| 6.2 | Build Sharia screening | Backend | Compliance engine |
| 6.3 | Implement zakah calculation | Backend | Zakah engine |
| 6.4 | End-to-end integration test | QA | Full flow testing |
| 6.5 | Performance testing | QA | Load testing |
| 6.6 | Security audit | Security | Penetration testing |
| 6.7 | Documentation | Tech Writing | All docs complete |
| 6.8 | Production deployment | DevOps | Go-live |

**Acceptance Criteria:**
- RIDZA operational
- Sharia screening working
- E2E tests passing
- Performance targets met
- Security audit clean
- Production deployed

---

## Appendix

### A. API Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Portfolio Operations | 2000 | per minute |
| Market Data | 10000 | per minute |
| Trade Execution | 500 | per minute |
| Asset Operations | 5000 | per minute |
| Business Copilot | 100 | per minute |
| WebSocket Connections | 1000 | per tenant |

### B. Data Retention

| Data Type | Retention Period |
|-----------|-----------------|
| Investor Profiles | Duration of relationship + 7 years |
| Portfolio History | Indefinite |
| Trade Records | 7 years (regulatory) |
| Market Data | 10 years |
| Economic Indicators | 20 years |
| Audit Logs | 7 years |

### C. Security Requirements

- All API calls over TLS 1.3
- OAuth 2.0 with PKCE
- mTLS for trading systems
- Hardware security modules (HSM) for keys
- PII encrypted at rest (AES-256)
- Comprehensive audit logging
- SEC/FINRA compliance
- GDPR compliant data handling

### D. Error Codes

| Code | Description |
|------|-------------|
| `INVESTOR_NOT_FOUND` | Investor does not exist |
| `PORTFOLIO_NOT_FOUND` | Portfolio does not exist |
| `ASSET_NOT_FOUND` | Asset does not exist |
| `INSUFFICIENT_FUNDS` | Insufficient cash |
| `RISK_LIMIT_EXCEEDED` | Risk limit breach |
| `TRADE_REJECTED` | Trade rejected |
| `AUTH_INVALID_TOKEN` | Invalid/expired token |
| `MARKET_CLOSED` | Market not open |

### E. Regulatory Compliance

| Regulation | Requirements |
|-------------|--------------|
| SEC Rule 17a-4 | Record retention |
| FINRA Rule 4511 | Books and records |
| MiFID II | Best execution |
| GDPR | Data protection |
| Basel III | Capital requirements |

---

**Document Control:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-06-12 | RTMN Architecture Team | Initial specification |
