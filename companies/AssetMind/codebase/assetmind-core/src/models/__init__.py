"""
AssetMind Core - Shared models
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class AssetClass(str, Enum):
    STOCK = "STOCK"
    CRYPTO = "CRYPTO"
    FOREX = "FOREX"
    COMMODITY = "COMMODITY"
    BOND = "BOND"
    ETF = "ETF"
    INDEX = "INDEX"


class AssetStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DELISTED = "DELISTED"


class TimeHorizon(str, Enum):
    DAY = "1D"
    WEEK = "7D"
    MONTH = "30D"
    QUARTER = "90D"
    YEAR = "1Y"


class Score(BaseModel):
    """Standard score model (0-100)"""
    value: float = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0, le=100)
    trend: str = Field(...)  # IMPROVING, STABLE, DETERIORATING
    reasoning: List[str] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)


class ProbabilityPrediction(BaseModel):
    """Probability-based prediction"""
    bullish_probability: float = Field(..., ge=0, le=100)
    neutral_probability: float = Field(..., ge=0, le=100)
    bearish_probability: float = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0, le=100)
    time_horizon: str = Field(...)
    reasoning_chain: List[str] = Field(default_factory=list)
    supporting_factors: List[str] = Field(default_factory=list)
    contradicting_factors: List[str] = Field(default_factory=list)


class PriceData(BaseModel):
    """OHLCV price data"""
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    market_cap: Optional[float] = None


class RiskAssessment(BaseModel):
    """Risk assessment scores"""
    financial_risk: float = Field(..., ge=0, le=100)
    market_risk: float = Field(..., ge=0, le=100)
    operational_risk: float = Field(..., ge=0, le=100)
    regulatory_risk: float = Field(..., ge=0, le=100)
    geopolitical_risk: float = Field(..., ge=0, le=100)
    liquidity_risk: float = Field(..., ge=0, le=100)
    overall_risk: float = Field(..., ge=0, le=100)


class SentimentData(BaseModel):
    """Sentiment data from multiple sources"""
    social_sentiment: float = Field(..., ge=0, le=100)
    news_sentiment: float = Field(..., ge=0, le=100)
    institutional_sentiment: float = Field(..., ge=0, le=100)
    analyst_sentiment: float = Field(..., ge=0, le=100)
    overall_sentiment: float = Field(..., ge=0, le=100)
    sentiment_trend: str = Field(...)  # IMPROVING, STABLE, DETERIORATING


class Event(BaseModel):
    """Financial event"""
    id: str
    type: str  # EARNINGS, REGULATORY, PRODUCT, MANAGEMENT, MACRO
    title: str
    description: str
    date: datetime
    impact: str  # POSITIVE, NEGATIVE, NEUTRAL


class FinancialRatios(BaseModel):
    """Key financial ratios"""
    # Profitability
    roe: Optional[float] = None
    roa: Optional[float] = None
    roic: Optional[float] = None
    gross_margin: Optional[float] = None
    net_margin: Optional[float] = None

    # Valuation
    pe_ratio: Optional[float] = None
    forward_pe: Optional[float] = None
    peg_ratio: Optional[float] = None
    ev_ebitda: Optional[float] = None

    # Leverage
    debt_equity: Optional[float] = None
    debt_ebitda: Optional[float] = None

    # Liquidity
    current_ratio: Optional[float] = None
    quick_ratio: Optional[float] = None


class HealthScores(BaseModel):
    """All health scores for an asset"""
    market_health: Score
    financial_health: Score
    sentiment_health: Score
    risk_health: Score
    institutional_health: Score
    technical_health: Score
    momentum_health: Score
    growth_health: Score
    overall_health: float = Field(..., ge=0, le=100)


class OpportunityScore(BaseModel):
    """Opportunity score with breakdown"""
    overall: float = Field(..., ge=0, le=100)
    technical_contribution: float = Field(..., ge=0, le=100)
    fundamental_contribution: float = Field(..., ge=0, le=100)
    sentiment_contribution: float = Field(..., ge=0, le=100)
    momentum_contribution: float = Field(..., ge=0, le=100)


class PortfolioHolding(BaseModel):
    """Single holding in a portfolio"""
    symbol: str
    quantity: float
    avg_entry_price: float
    current_price: float
    current_value: float
    unrealized_pnl: float
    unrealized_pnl_pct: float
    weight: float


class PortfolioAnalytics(BaseModel):
    """Portfolio analytics"""
    total_value: float
    total_cost: float
    total_return: float
    total_return_pct: float
    day_pnl: float
    beta: float
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    diversification_score: float = Field(..., ge=0, le=100)


class InvestorProfile(BaseModel):
    """Investor profile"""
    risk_tolerance: str = Field(...)  # CONSERVATIVE, MODERATE, AGGRESSIVE
    investment_horizon: str = Field(...)  # SHORT, MEDIUM, LONG
    preferred_sectors: List[str] = Field(default_factory=list)
    strategy_type: str = Field(...)  # VALUE, GROWTH, INCOME, MOMENTUM


class InvestorBehavior(BaseModel):
    """Investor behavior analytics"""
    total_trades: int = 0
    win_rate: float = Field(..., ge=0, le=100)
    avg_holding_period_days: float = 0
    avg_position_size_pct: float = 0


class InvestorMistakes(BaseModel):
    """Tracked investor mistakes"""
    revenge_trading_count: int = 0
    overtrading_count: int = 0
    fomo_entries: int = 0
    panic_exits: int = 0
