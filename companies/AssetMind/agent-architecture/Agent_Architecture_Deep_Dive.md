# AssetMind — AI Agent Architecture

**Version:** 1.0  
**Date:** June 5, 2026

---

## Agent System Overview

```
AssetMind Agent System
═══════════════════════════════════════════════════════════════════════

                          ┌─────────────────────────────────────┐
                          │       USER QUERY                     │
                          │  "Analyze NVIDIA for investment"    │
                          └──────────────┬──────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATOR (5090)                        │
│                                                                      │
│  • Decomposes query into sub-tasks                                  │
│  • Routes to appropriate agents                                     │
│  • Coordinates parallel execution                                   │
│  • Synthesizes final response                                       │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               │ Parallel execution
                               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   ASSET    │ │ FINANCIAL   │ │   NEWS     │ │ SENTIMENT   │
│   AGENT    │ │   AGENT     │ │   AGENT    │ │   AGENT     │
│  (5100)   │ │  (5050)    │ │  (5101)   │ │  (5102)   │
│            │ │            │ │            │ │            │
│ • Profile  │ │ • DCF      │ │ • Summarize│ │ • Social   │
│ • History  │ │ • Ratios   │ │ • Impact   │ │ • News     │
│ • Relations│ │ • Scoring  │ │ • Events   │ │ • Trend    │
└─────┬──────┘ └──────┬─────┘ └──────┬─────┘ └──────┬──────┘
      │                │              │              │
      └────────────────┼──────────────┼──────────────┘
                       │              │
                       ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│    RISK     │ │  EARNINGS  │ │   MACRO    │ │   QUANT    │
│   AGENT    │ │   AGENT    │ │   AGENT    │ │   AGENT    │
│  (5105)   │ │  (5107)   │ │  (5104)   │ │  (5103)   │
│            │ │            │ │            │ │            │
│ • Risks    │ │ • History  │ │ • Rates    │ │ • Charts   │
│ • Scenarios│ │ • Beat/Miss│ │ • Inflation│ │ • Patterns │
│ • Downside │ │ • Guidance │ │ • GDP      │ │ • Signals  │
└─────────────┘ └─────────────┘ └─────┬──────┘ └──────┬──────┘
                                     │              │
                                     └──────┬───────┘
                                            │
                                            ▼
                          ┌─────────────────────────────────────┐
                          │       RESEARCH AGENT (5109)          │
                          │                                      │
                          │  AI Investment Committee Synthesis    │
                          │                                      │
                          │  • Combines all agent responses      │
                          │  • Generates institutional report     │
                          │  • Bull/Bear/Neutral cases           │
                          │  • Conviction scoring                │
                          └──────────────┬──────────────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────────────┐
                          │    INTELLIGENCE TWIN (5006)         │
                          │                                      │
                          │  • Stores prediction                 │
                          │  • Updates confidence calibration    │
                          │  • Triggers learning                 │
                          └─────────────────────────────────────┘
```

---

## Agent Specifications

### 1. Asset Agent (Port 5100)

```
Asset Agent — The Asset Specialist
─────────────────────────────────────────────────────────────────

Responsibilities:
├── Asset profiling and identity
├── Historical data retrieval
├── Relationship mapping
├── Asset discovery
└── Asset comparison

Capabilities:

1. Profile Generation
   Input:  Asset symbol (NVDA)
   Output: Full asset profile
           ├── Basic info (name, sector, industry)
           ├── Exchange, country, currency
           ├── Description
           └── Key statistics

2. Historical Analysis
   ├── Price history
   ├── Performance history
   ├── Volatility patterns
   └── Seasonal patterns

3. Relationship Mapping
   ├── Suppliers (NVIDIA → TSMC)
   ├── Customers (TSMC → Apple, NVIDIA)
   ├── Competitors (NVIDIA → AMD, Intel)
   ├── Partners (NVIDIA → Microsoft, Google)
   └── Sector peers

4. Asset Comparison
   ├── Side-by-side metrics
   ├── Relative valuation
   └── Performance comparison

Data Sources:
├── Asset Universe Service (5001)
├── Asset Twin Service (5002)
├── Knowledge Graph Service (5040-5042)
└── Financial Data Service (5011)

Example Query:
─────────────────────────────────────────────────────────────────
User: "Compare NVIDIA and AMD"

Agent Response:
{
  "comparison": {
    "nvidia": { market_cap: 2.1T, pe: 45, revenue_growth: 122 },
    "amd": { market_cap: 280B, pe: 35, revenue_growth: 45 }
  },
  "differences": [
    "NVIDIA has 7x market cap advantage",
    "NVIDIA leads in AI GPU market (80% share)",
    "AMD gaining in data center"
  ],
  "similarities": [
    "Both depend on TSMC manufacturing",
    "Both in semiconductor sector",
    "Both GPU-focused"
  ],
  "recommendation": "NVIDIA for AI exposure, AMD for value"
}
```

### 2. News Agent (Port 5101)

```
News Agent — News Intelligence
─────────────────────────────────────────────────────────────────

Responsibilities:
├── Real-time news monitoring
├── News summarization
├── Impact scoring
├── Event detection
└── Narrative tracking

Capabilities:

1. Real-Time News Collection
   ├── Financial news sources (100+)
   ├── Company announcements
   ├── Regulatory updates
   ├── Economic releases
   └── Social media (X, Reddit)

2. Smart Summarization
   ├── 3-sentence summaries
   ├── Key points extraction
   ├── Sentiment extraction
   └── Relevance scoring

3. Impact Analysis
   ├── Short-term price impact (1-5%)
   ├── Medium-term impact (1-30 days)
   ├── Long-term impact (structural)
   └── Sector impact

4. Event Detection
   ├── Earnings announcements
   ├── M&A rumors
   ├── Product launches
   ├── Regulatory changes
   └── Management changes

5. Narrative Tracking
   ├── AI Boom narrative strength
   ├── Recession narrative
   ├── Interest rate narrative
   └── Custom narratives

Data Sources:
├── GDELT (free, unlimited)
├── NewsAPI
├── SEC EDGAR (8-K filings)
├── Reddit API
└── Company press releases

Example Query:
─────────────────────────────────────────────────────────────────
User: "What's the latest news on NVIDIA?"

Agent Response:
{
  "headlines": [
    {
      "title": "NVIDIA announces next-gen AI chips",
      "source": "Reuters",
      "time": "2 hours ago",
      "sentiment": "POSITIVE",
      "impact": "HIGH",
      "summary": "NVIDIA announced H200 chips with 2.4x performance..."
    }
  ],
  "sentiment_overall": 78,  // 0-100
  "sentiment_trend": "IMPROVING",
  "key_narratives": [
    "AI infrastructure spending accelerating",
    "Data center revenue growth"
  ],
  "upcoming_events": [
    { event: "GTC Conference", date: "2026-03-18", impact: "HIGH" }
  ]
}
```

### 3. Sentiment Agent (Port 5102)

```
Sentiment Agent — Social & Sentiment Analysis
─────────────────────────────────────────────────────────────────

Responsibilities:
├── Social media monitoring
├── Sentiment scoring
├── Trend detection
├── Extreme sentiment alerts
└── Sentiment-based signals

Capabilities:

1. Multi-Source Sentiment
   ├── Twitter/X (social sentiment)
   ├── Reddit (retail sentiment)
   ├── News (media sentiment)
   ├── YouTube (influencer sentiment)
   └── Glassdoor (company sentiment)

2. Sentiment Scoring (0-100)
   ├── Social Sentiment Score
   ├── News Sentiment Score
   ├── Institutional Sentiment Score
   ├── Analyst Sentiment Score
   └── Overall Composite

3. Trend Detection
   ├── Sentiment momentum (accelerating/decelerating)
   ├── Sentiment divergence from price
   ├── Extreme sentiment alerts
   └── Sentiment reversal signals

4. Retail vs Institutional
   ├── Retail positioning (Reddit, Twitter)
   ├── Institutional positioning (13F, whale)
   ├── Divergence analysis
   └── Smart money tracking

Data Sources:
├── Reddit API (r/wallstreetbets, r/investing)
├── CryptoCompare (social metrics)
├── LunarCrush (social scores)
├── Twitter/X API (if available)
└── News sentiment (NLP)

Example Query:
─────────────────────────────────────────────────────────────────
User: "What's the retail sentiment on Bitcoin?"

Agent Response:
{
  "overall_sentiment": 72,
  "sentiment_breakdown": {
    "social": 78,    // Twitter, Reddit
    "news": 65,      // Media coverage
    "search": 85     // Google Trends
  },
  "trend": "IMPROVING",
  "momentum": "ACCELERATING",
  "extreme_alert": false,
  "retail_indicators": {
    "reddit_mentions": "HIGH",
    "google_trends": "ABOVE_AVERAGE",
    "fear_greed_index": 68
  },
  "divergence": null,  // or { signal: "BULLISH", reason: "..." }
  "signals": [
    { signal: "BUY", confidence: 75, reason: "Sentiment improving, not extreme" }
  ]
}
```

### 4. Quant Agent (Port 5103)

```
Quant Agent — Technical Analysis & Quant Models
─────────────────────────────────────────────────────────────────

Responsibilities:
├── Technical pattern recognition
├── Indicator calculation
├── Backtesting
├── Signal generation
└── Chart analysis

Capabilities:

1. Technical Analysis
   ├── 100+ technical indicators
   │   ├── Moving Averages (SMA, EMA, WMA)
   │   ├── Momentum (RSI, MACD, Stochastic)
   │   ├── Volatility (Bollinger, ATR)
   │   ├── Volume (OBV, Volume Profile)
   │   └── Custom indicators
   ├── Chart patterns (head & shoulders, cups, flags)
   └── Support/resistance detection

2. Technical Scoring
   ├── Overall technical score (0-100)
   ├── Bullish signals count
   ├── Bearish signals count
   └── Neutral signals count

3. Backtesting Engine
   ├── Historical strategy testing
   ├── Performance metrics (Sharpe, max drawdown)
   ├── Walk-forward analysis
   └── Monte Carlo simulation

4. Signal Generation
   ├── Entry signals
   ├── Exit signals
   ├── Stop-loss levels
   └── Take-profit levels

Data Sources:
├── Yahoo Finance (price data)
├── TradingView (chart patterns)
└── Custom indicator library

Example Query:
─────────────────────────────────────────────────────────────────
User: "Technical analysis on Tesla"

Agent Response:
{
  "overall_technical_score": 65,
  "trend": "BULLISH",
  "momentum": "POSITIVE",
  "indicators": {
    "rsi": 62,        // Overbought/Oversold
    "macd": "BULLISH_CROSSOVER",
    "ma_50": "ABOVE_MA_200",  // Golden cross
    "bollinger": "NEAR_UPPER_BAND",
    "volume": "ABOVE_AVERAGE"
  },
  "patterns": [
    { pattern: "ASCENDING_TRIANGLE", type: "BULLISH", confidence: 75 }
  ],
  "support_levels": [180, 175, 170],
  "resistance_levels": [200, 215, 250],
  "signals": {
    "entry": { price: 185, confidence: 70 },
    "stop_loss": { price: 170, risk: "8%" },
    "take_profit": [200, 215]
  }
}
```

### 5. Risk Agent (Port 5105)

```
Risk Agent — Risk Assessment & Management
─────────────────────────────────────────────────────────────────

Responsibilities:
├── Risk scoring
├── Scenario analysis
├── Downside estimation
├── Risk factor identification
└── Correlation analysis

Capabilities:

1. Risk Scoring
   ├── Financial Risk Score
   ├── Market Risk Score
   ├── Operational Risk Score
   ├── Regulatory Risk Score
   ├── Geopolitical Risk Score
   ├── Liquidity Risk Score
   └── Overall Risk Score

2. Scenario Analysis
   ├── Bull case
   ├── Base case
   ├── Bear case
   ├── Crisis scenario
   └── Custom scenarios

3. Downside Analysis
   ├── Max drawdown estimation
   ├── Value at Risk (VaR)
   ├── Conditional VaR (CVaR)
   └── Tail risk analysis

4. Risk Factors
   ├── Company-specific risks
   ├── Sector risks
   ├── Macro risks
   ├── Regulatory risks
   └── Geopolitical risks

5. Correlation Analysis
   ├── Correlation to market
   ├── Correlation to sector
   ├── Portfolio correlation matrix
   └── Diversification score

Data Sources:
├── All Twin data
├── Macro Data Service (5015)
├── Geopolitical Data Service (5022)
└── Risk databases

Example Query:
─────────────────────────────────────────────────────────────────
User: "Risk analysis on holding NVIDIA"

Agent Response:
{
  "overall_risk_score": 35,  // 0-100, lower is safer
  "risk_breakdown": {
    "financial": 25,      // Low debt, strong balance sheet
    "market": 40,         // Volatile sector
    "operational": 30,   // TSMC dependency
    "regulatory": 50,     // Export restrictions
    "geopolitical": 55,   // Taiwan exposure
    "liquidity": 15       // Very liquid
  },
  "scenario_analysis": {
    "bull_case": { price: 1200, probability: 25, reason: "AI boom continues" },
    "base_case": { price: 900, probability: 55, reason: "Steady growth" },
    "bear_case": { price: 650, probability: 20, reason: "Competition, macro" }
  },
  "downside_risk": {
    "max_drawdown": "25-35%",
    "var_95": "12%",
    "cvar_95": "18%"
  },
  "key_risks": [
    { risk: "TSMC supply disruption", severity: "HIGH", probability: 15 },
    { risk: "China export restrictions", severity: "MEDIUM", probability: 30 },
    { risk: "AMD competition", severity: "LOW", probability: 40 }
  ]
}
```

### 6. Macro Agent (Port 5104)

```
Macro Agent — Macro Economic Intelligence
─────────────────────────────────────────────────────────────────

Responsibilities:
├── Economic indicator monitoring
├── Interest rate analysis
├── Inflation tracking
├── GDP analysis
├── Central bank monitoring
└── Macro regime classification

Capabilities:

1. Economic Indicators
   ├── Interest rates (Fed, ECB, BOJ, etc.)
   ├── Inflation (CPI, PPI, PCE)
   ├── GDP growth rates
   ├── Employment data
   ├── Consumer sentiment
   └── Manufacturing indices

2. Central Bank Analysis
   ├── Fed policy (hike/cut/hold)
   ├── ECB policy
   ├── BOJ policy
   ├── PBOC policy
   └── Rate impact on assets

3. Macro Regime Classification
   ├── Bull/Bear/Sideways market
   ├── High/Low volatility regime
   ├── Inflation regime (high/moderate/low)
   └── Growth regime (accelerating/decelerating)

4. Macro Impact Analysis
   ├── Which sectors benefit from environment
   ├── Which assets benefit from environment
   ├── Rotation signals
   └── Theme acceleration/deceleration

Data Sources:
├── FRED API (Federal Reserve)
├── Trading Economics
├── World Bank
├── Central bank websites
└── Bloomberg (Phase 3)

Example Query:
─────────────────────────────────────────────────────────────────
User: "How do rising interest rates affect tech stocks?"

Agent Response:
{
  "current_regime": {
    "rate_environment": "HIGH_AND_RISING",
    "inflation": "MODERATE_AND_FALLING",
    "growth": "SLOWING"
  },
  "impact_analysis": {
    "tech_stocks": {
      "direction": "NEGATIVE",
      "magnitude": "SIGNIFICANT",
      "mechanism": "Higher discount rates reduce future earnings value"
    },
    "sub_sectors": {
      "high_growth_tech": "MOST_NEGATIVE",
      "value_tech": "MODERATELY_NEGATIVE",
      "fintech": "MIXED"
    }
  },
  "historical_precedent": [
    { period: "2022 rate hikes", tech_return: "-33%", rate_change: "+4.5%" }
  ],
  "rotation_signals": [
    { from: "Growth", to: "Value", strength: "MODERATE" },
    { from: "Tech", to: "Energy", strength: "WEAK" }
  ]
}
```

### 7. Earnings Agent (Port 5107)

```
Earnings Agent — Earnings Intelligence
─────────────────────────────────────────────────────────────────

Responsibilities:
├── Earnings calendar
├── Beat/miss prediction
├── Guidance analysis
├── Historical earnings analysis
└── Post-earnings drift

Capabilities:

1. Earnings Calendar
   ├── Upcoming earnings (all tracked assets)
   ├── Earnings estimates
   ├── Historical beat/miss rate
   └── Revenue/EPS consensus

2. Pre-Earnings Analysis
   ├── Beat probability prediction
   ├── Key metrics to watch
   ├── Sentiment positioning
   └── Options market pricing

3. Guidance Analysis
   ├── Forward guidance extraction
   ├── Guidance surprise detection
   ├── Management tone analysis
   └── Consensus vs guidance

4. Historical Analysis
   ├── Past earnings reactions
   ├── Beat/miss history
   ├── Post-earnings drift
   └── Guidance track record

5. Real-Time Earnings
   ├── Live results comparison
   ├── Reaction analysis
   ├── Trading recommendations

Data Sources:
├── SEC EDGAR (10-K, 10-Q)
├── Earnings call transcripts
├── Estimize (crowd estimates)
├── Yahoo Finance
└── Bloomberg (estimates)

Example Query:
─────────────────────────────────────────────────────────────────
User: "What's the outlook for NVIDIA earnings?"

Agent Response:
{
  "upcoming_earnings": {
    "date": "2026-05-22",
    "estimate_eps": 6.50,
    "consensus_eps": 6.32,
    "beat_probability": 78,
    "last_beat": "YES (Q4: 33% beat)"
  },
  "key_metrics": {
    "revenue_estimate": 24.5B,
    "data_center_estimate": 18.0B,
    "gaming_estimate": 3.2B
  },
  "sentiment_positioning": {
    "bullish_analysts": 42,
    "bearish_analysts": 3,
    "price_target_avg": 950,
    "options_iv": "ELEVATED"
  },
  "historical": {
    "beat_rate": 85,
    "avg_beat": "+12%",
    "avg_move": "+8%"
  },
  "watch_factors": [
    "Data center guidance",
    "China revenue impact",
    "H200 demand signals"
  ]
}
```

### 8. Research Agent (Port 5109)

```
Research Agent — AI Investment Committee
─────────────────────────────────────────────────────────────────

Responsibilities:
├── Institutional-grade research reports
├── Bull/bear case development
├── Conviction scoring
├── Comparative analysis
└── Report synthesis

Capabilities:

1. Report Generation
   ├── Company research reports
   ├── Sector research reports
   ├── Country research reports
   ├── Theme research reports
   └── Macro research reports

2. AI Investment Committee
   Runs 6 analysts in parallel:
   ├── Fundamental Analyst (financials, valuation)
   ├── Technical Analyst (charts, patterns)
   ├── Macro Analyst (rates, inflation, GDP)
   ├── Risk Manager (downsides, scenarios)
   ├── Sentiment Analyst (social, news)
   └── Quant Analyst (statistics, backtests)

3. Bull/Bear/Neutral Cases
   ├── Bull case with probability
   ├── Bear case with probability
   ├── Base/neutral case
   └── Conviction scoring

4. Comparative Analysis
   ├── Peer comparison
   ├── Sector comparison
   ├── Cross-asset comparison
   └── Historical comparison

Data Sources:
├── All other agents
├── Asset Twin Service (5002)
├── Knowledge Graph (5040-5042)
└── HOJAI Memory

Example Query:
─────────────────────────────────────────────────────────────────
User: "Generate a research report on NVIDIA"

Agent Response:
{
  "report_type": "COMPANY_RESEARCH",
  "asset": "NVIDIA",
  "timestamp": "2026-06-05T08:00:00Z",

  "executive_summary": "NVIDIA remains our top pick in AI infrastructure.
  Strong data center demand, competitive moat in AI GPUs, and expanding
  TAM support our Buy rating with 18-month price target of $1,100.",

  "investment_thesis": {
    "rating": "BUY",
    "conviction": "HIGH",
    "price_target": 1100,
    "current_price": 878,
    "upside": "25%",
    "time_horizon": "18 months"
  },

  "ai_committee_views": {
    "fundamental": { view: "BUY", confidence: 85 },
    "technical": { view: "BUY", confidence: 70 },
    "macro": { view: "HOLD", confidence: 60 },
    "risk": { view: "BUY", confidence: 75 },
    "sentiment": { view: "BUY", confidence: 78 },
    "quant": { view: "BUY", confidence: 72 }
  },

  "bull_case": {
    "probability": 50,
    "price_target": 1300,
    "drivers": [
      "AI infrastructure spending reaches $500B by 2027",
      "NVIDIA maintains 80%+ GPU market share",
      "New verticals (robotics, healthcare) accelerate"
    ]
  },

  "bear_case": {
    "probability": 25,
    "price_target": 550,
    "drivers": [
      "AMD/Intel capture significant share",
      "Custom silicon from Google/Amazon",
      "Macro slowdown reduces tech spending"
    ]
  },

  "base_case": {
    "probability": 25,
    "price_target": 1100,
    "assumptions": [
      "AI spending grows 40% annually",
      "NVIDIA maintains 65% GPU market share",
      "Margins remain elevated"
    ]
  },

  "key_risks": [
    "China export restrictions worsening",
    "Competition from custom ASICs",
    "TSMC capacity constraints"
  ],

  "monitoring_points": [
    "Q1 2026 earnings (May 22)",
    "GTC Conference announcements",
    "AMD MI300 launch results"
  ]
}
```

### 9. Discovery Agent (Port 5111)

```
Discovery Agent — Opportunity Finding
─────────────────────────────────────────────────────────────────

Responsibilities:
├── Proactive opportunity discovery
├── Theme detection
├── Capital rotation tracking
├── Hidden opportunity detection
└── Risk discovery

Capabilities:

1. Opportunity Discovery
   ├── Top 10 daily opportunities
   ├── Sector rotation opportunities
   ├── Thematic opportunities
   ├── Event-driven opportunities
   └── Contrarian opportunities

2. Theme Intelligence
   ├── Theme emergence detection
   ├── Theme momentum tracking
   ├── Theme lifecycle analysis
   └── Theme rotation signals

3. Capital Flow Tracking
   ├── Sector rotation detection
   ├── Smart money tracking
   ├── Whale activity
   └── Flow reversal signals

4. Hidden Opportunities
   ├── "You might be missing" suggestions
   ├── Supply chain beneficiaries
   ├── Competitor analysis
   └── Adjacent market opportunities

Data Sources:
├── All intelligence engines
├── Discovery Service (5180)
├── Capital Flow Service (5183)
└── Knowledge Graph (5040-5042)

Example Query:
─────────────────────────────────────────────────────────────────
User: "What are today's top opportunities?"

Agent Response:
{
  "date": "2026-06-05",
  "top_opportunities": [
    {
      "rank": 1,
      "symbol": "SMCI",
      "name": "Super Micro Computer",
      "opportunity_score": 88,
      "conviction": "HIGH",
      "reason": "AI server demand, NVIDIA partnership",
      "thesis": "Direct beneficiary of AI infrastructure buildout",
      "risk_level": "MEDIUM"
    },
    {
      "rank": 2,
      "symbol": "VRT",
      "name": "Vertiv Holdings",
      "opportunity_score": 85,
      "conviction": "HIGH",
      "reason": "Data center power infrastructure",
      "thesis": "Often missed AI beneficiary in power/cooling"
    }
  ],
  "emerging_themes": [
    {
      "theme": "AI Infrastructure",
      "momentum": "ACCELERATING",
      "top_picks": ["NVDA", "SMCI", "VRT", "DLR"],
      "capital_flow": "INTO_THEME"
    },
    {
      "theme": "Nuclear Renaissance",
      "momentum": "NEW",
      "top_picks": ["CEG", "VST", "NNE"],
      "capital_flow": "EARLY_FLOW"
    }
  ],
  "hidden_opportunities": [
    {
      "user_follows": "NVDA",
      "suggested": "SMCI",
      "reason": "Server builder with NVIDIA partnerships",
      "similarity": 75
    },
    {
      "user_follows": "AAPL",
      "suggested": "MRK",
      "reason": "Defensive play while waiting for iPhone cycle",
      "similarity": 60
    }
  ]
}
```

### 10. Learning Agent (Port 5112)

```
Learning Agent — System Improvement
─────────────────────────────────────────────────────────────────

Responsibilities:
├── Prediction tracking
├── Outcome analysis
├── Model improvement
├── Pattern discovery
└── Confidence calibration

Capabilities:

1. Prediction Tracking
   ├── Store all predictions
   ├── Track prediction outcomes
   ├── Calculate accuracy
   └── Identify patterns

2. Outcome Analysis
   ├── Correct vs incorrect
   ├── Error analysis
   ├── Factor attribution
   └── Systematic biases

3. Model Improvement
   ├── Weight adjustments
   ├── Feature engineering
   ├── Ensemble optimization
   └── Model selection

4. Confidence Calibration
   ├── Predicted vs actual confidence
   ├── Calibration error
   ├── Over/under-confidence detection
   └── Calibration improvement

5. Pattern Discovery
   ├── Market patterns
   ├── Sector rotation patterns
   ├── Seasonal patterns
   └── Sentiment patterns

Data Sources:
├── Intelligence Twin (5006)
├── Prediction outcomes
├── User feedback
└── Market data

Example Output:
─────────────────────────────────────────────────────────────────
{
  "accuracy_report": {
    "overall_accuracy": 68,
    "confidence_calibration": {
      "predicted_avg": 75,
      "actual_accuracy_at_75": 72,
      "calibration_error": 3
    },
    "by_asset_class": {
      "stocks": 71,
      "crypto": 65,
      "forex": 70
    },
    "by_time_horizon": {
      "7d": 62,
      "30d": 71,
      "90d": 68
    }
  },
  "model_performance": {
    "technical_model": { accuracy: 65, weight: 0.2 },
    "fundamental_model": { accuracy: 72, weight: 0.3 },
    "sentiment_model": { accuracy: 68, weight: 0.2 },
    "macro_model": { accuracy: 64, weight: 0.15 },
    "ensemble": { accuracy: 71, weight: 1.0 }
  },
  "improvements_made": [
    "Increased weight of fundamental model by 5%",
    "Added new sentiment features from Twitter",
    "Adjusted macro model for rate sensitivity"
  ],
  "new_patterns_discovered": [
    "Tech stocks rally 2 weeks before Fed pivot",
    "Earnings beat leads to 5-day average drift"
  ]
}
```

---

## Multi-Agent Collaboration Patterns

### Pattern 1: Asset Analysis (Parallel)

```
User Query: "Full analysis of Apple Inc"

Orchestrator Routes:
─────────────────────────────────────────────────────────────────

PARALLEL EXECUTION:
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐
│  Asset       │ │ Financial    │ │ Sentiment    │ │  Risk    │
│  Agent       │ │ Agent        │ │ Agent        │ │  Agent   │
│              │ │              │ │              │ │          │
│ • Profile    │ │ • DCF        │ │ • Social     │ │ • Risks  │
│ • History    │ │ • Ratios     │ │ • News       │ │ • Scenarios
│ • Relations  │ │ • Score      │ │ • Trend      │ │ • Downside
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └───┬──────┘
       │                │                │              │
       └────────────────┼────────────────┴──────────────┘
                      │
                      ▼
              ┌──────────────┐
              │  Research    │
              │  Agent       │
              │  (Committee) │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │  Full Report │
              │  + Twin Update│
              └──────────────┘
```

### Pattern 2: Portfolio Analysis (Sequential)

```
User Query: "Analyze my portfolio and suggest rebalancing"

Orchestrator Routes:
─────────────────────────────────────────────────────────────────

SEQUENTIAL EXECUTION:

1. Portfolio Agent (First)
   └── Get holdings, calculate exposure, identify risks

2. Macro Agent + Risk Agent (Parallel)
   └── Get macro environment, assess portfolio risks

3. Discovery Agent (Parallel)
   └── Find opportunities matching user profile

4. Research Agent (Final)
   └── Generate rebalancing recommendations

5. Learning Agent (Background)
   └── Update Investor Twin with analysis
```

### Pattern 3: Morning Briefing (Broadcast)

```
6:00 AM UTC — Morning Briefings Trigger

BROADCAST TO ALL AGENTS:
─────────────────────────────────────────────────────────────────

┌──────────────┐
│  Scheduler   │
│  Triggers    │
└──────┬───────┘
       │
       ├─────────────────────────────┐
       │                             │
       ▼                             ▼
┌──────────────┐             ┌──────────────┐
│   Market     │             │   Sentiment  │
│   Agent      │             │   Agent      │
│  (Overnight) │             │  (Social)    │
└──────┬───────┘             └──────┬───────┘
       │                             │
       ▼                             ▼
┌──────────────┐             ┌──────────────┐
│   News       │             │   Macro      │
│   Agent      │             │   Agent      │
│  (Headlines) │             │  (Economic)  │
└──────┬───────┘             └──────┬───────┘
       │                             │
       └──────────────┬──────────────┘
                      │
                      ▼
              ┌──────────────┐
              │  Discovery   │
              │  Agent       │
              │  (Opps/Risks)│
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │   Briefing  │
              │   Service   │
              │  (5170)    │
              └─────────────┘
```

---

## Agent Communication Protocol

```
Message Format (Internal):
─────────────────────────────────────────────────────────────────

{
  "message_id": "uuid",
  "type": "QUERY" | "RESPONSE" | "EVENT",
  "from_agent": "asset_agent",
  "to_agent": "research_agent",
  "payload": {
    "query": "...",
    "context": {...},
    "priority": 1-5
  },
  "metadata": {
    "timestamp": "ISO8601",
    "correlation_id": "uuid",
    "retry_count": 0
  }
}

Event Types:
├── ASSET_UPDATED
├── NEWS_ALERT
├── EARNINGS_ANNOUNCED
├── SENTIMENT_SHIFT
├── RISK_ALERT
└── PREDICTION_COMPLETE
```

---

## Model Routing Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODEL ROUTER                                  │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Claude    │  │   GPT-4o   │  │   DeepSeek  │            │
│  │ 3.5 Sonnet  │  │            │  │    R1       │            │
│  │             │  │             │  │             │            │
│  │ Best for:   │  │ Best for:   │  │ Best for:   │            │
│  │ • Reasoning │  │ • Fast Q&A  │  │ • Cost save │            │
│  │ • Reports   │  │ • Summarize │  │ • High vol  │            │
│  │ • Complex   │  │ • Classify  │  │ • Non-critical
│  │   Analysis  │  │             │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│         │               │                 │                     │
│         └───────────────┼─────────────────┘                     │
│                         ▼                                       │
│                ┌─────────────────┐                              │
│                │  Task Router   │                              │
│                │                 │                              │
│                │ Classification │                              │
│                │ Scoring        │                              │
│                │ Summarization  │                              │
│                │ Report Gen     │                              │
│                │ Analysis       │                              │
│                └─────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘

Routing Rules:
─────────────────────────────────────────────────────────────────

Task Type          → Model          → Reason
─────────────────────────────────────────────────────────────
Research Report    → Claude        → Best reasoning, longest context
Quick Q&A         → GPT-4o         → Fast, cheap
Sentiment Class   → GPT-4o         → Fast classification
Complex Analysis  → Claude         → Deep reasoning
High-volume Tasks → DeepSeek       → Cost-effective
Multi-step Logic  → Claude         → Best chain-of-thought
Summarization     → GPT-4o         → Fast, good quality
Translations      → DeepSeek       → Cost-effective

Cost Optimization:
─────────────────────────────────────────────────────────────────

• Use GPT-4o for >80% of queries (fast, cheap)
• Use Claude for: Reports, Complex Analysis, Final Synthesis
• Use DeepSeek for: High-volume simple tasks, batch processing
• Cache common queries (hot assets)
• Batch similar requests
```

---

## Agent Performance Metrics

```
Performance Tracking:
─────────────────────────────────────────────────────────────────

Per Agent Metrics:
├── Queries processed
├── Avg response time (ms)
├── Success rate (%)
├── Error rate (%)
└── Timeout rate (%)

Accuracy Metrics:
├── Prediction accuracy (by asset class)
├── Sentiment accuracy (vs actual)
├── Recommendation accuracy
└── Pattern detection rate

Efficiency Metrics:
├── Cost per query
├── Token usage
├── Cache hit rate
└── Parallel efficiency

User Satisfaction:
├── Query completion rate
├── Follow-up rate
└── Feature usage
```

---

## Next Steps

1. **Week 1-2**: Implement Agent Orchestrator + Research Agent
2. **Week 3-4**: Implement Asset Agent + Financial Agent
3. **Week 5-6**: Implement News + Sentiment Agents
4. **Week 7-8**: Implement Risk + Macro Agents
5. **Week 9-10**: Implement Discovery + Learning Agents
6. **Week 11-12**: Integration testing + Model routing

---

**Document Version:** 1.0  
**Last Updated:** June 5, 2026
