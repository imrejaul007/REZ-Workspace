"""
AssetMind - Twin Engine Models
Core data models for all Digital Twins

Version: 1.0
Date: June 5, 2026
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ============================================================================
# Shared Models
# ============================================================================

class Score(BaseModel):
    """Standard score model for all twin scores"""
    value: float = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0, le=100)
    trend: str = Field(...)  # IMPROVING, STABLE, DETERIORATING
    reasoning: List[str] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    compared_to_sector: Optional[str] = None
    historical_percentile: Optional[float] = None


class ProbabilityPrediction(BaseModel):
    """Probability-based prediction model"""
    bullish_probability: float = Field(..., ge=0, le=100)
    neutral_probability: float = Field(..., ge=0, le=100)
    bearish_probability: float = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0, le=100)
    time_horizon: str = Field(...)  # 7D, 30D, 90D, 1Y
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


class FinancialRatios(BaseModel):
    """Key financial ratios"""
    # Profitability
    roe: Optional[float] = None
    roa: Optional[float] = None
    roic: Optional[float] = None
    gross_margin: Optional[float] = None
    net_margin: Optional[float] = None
    ebitda_margin: Optional[float] = None

    # Valuation
    pe_ratio: Optional[float] = None
    forward_pe: Optional[float] = None
    peg_ratio: Optional[float] = None
    ev_ebitda: Optional[float] = None
    price_book: Optional[float] = None

    # Leverage
    debt_equity: Optional[float] = None
    debt_ebitda: Optional[float] = None
    interest_coverage: Optional[float] = None

    # Liquidity
    current_ratio: Optional[float] = None
    quick_ratio: Optional[float] = None


class SentimentData(BaseModel):
    """Sentiment data from multiple sources"""
    social_sentiment: float = Field(..., ge=0, le=100)  # X, Reddit
    news_sentiment: float = Field(..., ge=0, le=100)
    institutional_sentiment: float = Field(..., ge=0, le=100)
    analyst_sentiment: float = Field(..., ge=0, le=100)
    overall_sentiment: float = Field(..., ge=0, le=100)
    sentiment_trend_7d: str = Field(...)  # IMPROVING, STABLE, DETERIORATING
    sentiment_trend_30d: str = Field(...)
    sentiment_trend_90d: str = Field(...)


class RiskAssessment(BaseModel):
    """Risk assessment scores"""
    financial_risk: float = Field(..., ge=0, le=100)
    market_risk: float = Field(..., ge=0, le=100)
    operational_risk: float = Field(..., ge=0, le=100)
    regulatory_risk: float = Field(..., ge=0, le=100)
    geopolitical_risk: float = Field(..., ge=0, le=100)
    liquidity_risk: float = Field(..., ge=0, le=100)
    overall_risk: float = Field(..., ge=0, le=100)


class Event(BaseModel):
    """Financial event"""
    id: str
    type: str  # EARNINGS, REGULATORY, PRODUCT, MANAGEMENT, MACRO
    title: str
    description: str
    date: datetime
    impact: str  # POSITIVE, NEGATIVE, NEUTRAL
    actual_impact: Optional[float] = None  # Populated after event


class Relationship(BaseModel):
    """Asset relationship"""
    target_symbol: str
    relationship_type: str  # SUPPLIES_TO, CUSTOMER_OF, COMPETES_WITH, etc.
    strength: float = Field(..., ge=0, le=100)
    description: Optional[str] = None


# ============================================================================
# Asset Twin Model
# ============================================================================

class AssetTwin(BaseModel):
    """
    Asset Digital Twin

    The complete intelligence profile of a single financial asset.
    This is the core data structure of the AssetMind platform.
    """

    # Identity
    asset_id: str
    symbol: str
    name: str

    # Market Layer
    current_price: float
    price_change_24h: float
    price_change_percent_24h: float
    volume_24h: float
    market_cap: Optional[float] = None
    market_dominance: Optional[float] = None

    # Financial Layer
    income_statement: Dict[str, Any] = Field(default_factory=dict)
    balance_sheet: Dict[str, Any] = Field(default_factory=dict)
    cash_flow: Dict[str, Any] = Field(default_factory=dict)
    financial_ratios: FinancialRatios = Field(default_factory=FinancialRatios)
    financial_score: Score = Field(...)

    # News Layer
    recent_news: List[Dict[str, Any]] = Field(default_factory=list)
    news_sentiment: float = Field(..., ge=0, le=100)
    key_narratives: List[str] = Field(default_factory=list)

    # Sentiment Layer
    sentiment: SentimentData = Field(...)
    sentiment_score: Score = Field(...)

    # Event Layer
    upcoming_events: List[Event] = Field(default_factory=list)
    past_events: List[Event] = Field(default_factory=list)

    # Relationship Layer
    suppliers: List[Relationship] = Field(default_factory=list)
    customers: List[Relationship] = Field(default_factory=list)
    competitors: List[Relationship] = Field(default_factory=list)
    partners: List[Relationship] = Field(default_factory=list)

    # Risk Layer
    risk_assessment: RiskAssessment = Field(...)
    risk_score: Score = Field(...)

    # Prediction Layer
    prediction: ProbabilityPrediction = Field(...)

    # Health Layer (9 scores)
    market_health: Score = Field(...)
    financial_health: Score = Field(...)
    sentiment_health: Score = Field(...)
    risk_health: Score = Field(...)
    institutional_health: Score = Field(...)
    technical_health: Score = Field(...)
    momentum_health: Score = Field(...)
    growth_health: Score = Field(...)
    overall_health_score: float = Field(..., ge=0, le=100)

    # Derived Scores
    opportunity_score: Score = Field(...)
    conviction_score: Score = Field(...)
    institutional_score: Score = Field(...)
    momentum_score: Score = Field(...)

    # Timestamps
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    twin_created_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Market Twin Model
# ============================================================================

class MarketRegime(str, Enum):
    BULL = "BULL"
    BEAR = "BEAR"
    SIDEWAYS = "SIDEWAYS"
    HIGH_VOLATILITY = "HIGH_VOLATILITY"
    LOW_VOLATILITY = "LOW_VOLATILITY"
    CRISIS = "CRISIS"


class MarketTwin(BaseModel):
    """
    Market Digital Twin

    Tracks the overall market conditions across regions and sectors.
    """

    # Global Market
    global_market_score: float = Field(..., ge=0, le=100)
    regime: MarketRegime = MarketRegime.SIDEWAYS
    volatility_index: float = Field(...)  # VIX equivalent
    fear_greed_index: float = Field(..., ge=0, le=100)

    # Regional Markets
    us_market_score: float = Field(..., ge=0, le=100)
    eu_market_score: float = Field(..., ge=0, le=100)
    asia_market_score: float = Field(..., ge=0, le=100)
    em_market_score: float = Field(..., ge=0, le=100)
    india_market_score: float = Field(..., ge=0, le=100)

    # Sector Rotation
    sector_rankings: List[Dict[str, Any]] = Field(default_factory=list)
    capital_flow_direction: str = Field(...)  # INTO_BONDS, INTO_STOCKS, etc.
    rotation_signals: List[str] = Field(default_factory=list)

    # Macro Context
    interest_rate_environment: str = Field(...)  # HIKING, CUTTING, HOLDING
    inflation_environment: str = Field(...)  # HIGH, MODERATE, LOW
    gdp_growth: str = Field(...)  # ACCELERATING, STABLE, DECELERATING
    central_bank_stance: str = Field(...)

    # Timestamps
    last_updated: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Portfolio Twin Model
# ============================================================================

class Holding(BaseModel):
    """Single holding in a portfolio"""
    symbol: str
    name: str
    quantity: float
    avg_entry_price: float
    current_price: float
    current_value: float
    unrealized_pnl: float
    unrealized_pnl_pct: float
    weight: float  # Portfolio percentage


class PortfolioTwin(BaseModel):
    """
    Portfolio Digital Twin

    Tracks a user's portfolio with full analytics.
    """

    user_id: str
    name: str = "Main Portfolio"

    # Holdings
    holdings: List[Holding] = Field(default_factory=list)
    cash_balance: float = 0

    # Analytics
    total_value: float
    total_cost: float
    total_return: float
    total_return_pct: float
    day_pnl: float
    day_pnl_pct: float

    # Risk Analytics
    portfolio_beta: float
    portfolio_volatility: float
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    value_at_risk_95: Optional[float] = None

    # Exposure Analytics
    sector_exposure: Dict[str, float] = Field(default_factory=dict)
    asset_class_exposure: Dict[str, float] = Field(default_factory=dict)
    geo_exposure: Dict[str, float] = Field(default_factory=dict)
    currency_exposure: Dict[str, float] = Field(default_factory=dict)
    theme_exposure: Dict[str, float] = Field(default_factory=dict)

    # Correlation
    correlation_to_benchmark: Optional[float] = None

    # Scores
    diversification_score: float = Field(..., ge=0, le=100)
    risk_score: float = Field(..., ge=0, le=100)
    health_score: float = Field(..., ge=0, le=100)

    # Timestamps
    last_updated: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Investor Twin Model
# ============================================================================

class StrategyType(str, Enum):
    VALUE = "VALUE"
    GROWTH = "GROWTH"
    INCOME = "INCOME"
    MOMENTUM = "MOMENTUM"
    SWING = "SWING"
    DAY_TRADING = "DAY_TRADING"


class RiskTolerance(str, Enum):
    CONSERVATIVE = "CONSERVATIVE"
    MODERATE = "MODERATE"
    AGGRESSIVE = "AGGRESSIVE"


class InvestorTwin(BaseModel):
    """
    Investor/Trader Digital Twin

    Tracks investor behavior, mistakes, and provides coaching.
    """

    user_id: str

    # Profile
    goals: List[str] = Field(default_factory=list)
    risk_tolerance: RiskTolerance = RiskTolerance.MODERATE
    investment_horizon: str = Field(...)  # SHORT, MEDIUM, LONG
    preferred_sectors: List[str] = Field(default_factory=list)
    preferred_asset_classes: List[str] = Field(default_factory=list)
    strategy_type: StrategyType = StrategyType.GROWTH

    # Behavior Analytics
    total_trades: int = 0
    avg_holding_period_days: float = 0
    avg_position_size_pct: float = 0
    trade_frequency_per_week: float = 0

    # Performance
    win_rate: float = Field(..., ge=0, le=100)
    loss_rate: float = Field(..., ge=0, le=100)
    avg_win_pct: float = 0
    avg_loss_pct: float = 0
    largest_win_pct: float = 0
    largest_loss_pct: float = 0

    # Mistakes Detected
    revenge_trading_count: int = 0
    overtrading_count: int = 0
    fomo_entries: int = 0
    panic_exits: int = 0
    position_sizing_errors: int = 0

    # Best/Worst Strategies
    best_strategies: List[str] = Field(default_factory=list)
    worst_strategies: List[str] = Field(default_factory=list)

    # Coaching
    coaching_tips: List[str] = Field(default_factory=list)
    pre_trade_checks: List[str] = Field(default_factory=list)
    recent_mistakes: List[str] = Field(default_factory=list)

    # Personality Scores (0-100)
    patience_score: float = Field(..., ge=0, le=100)
    discipline_score: float = Field(..., ge=0, le=100)
    emotional_control_score: float = Field(..., ge=0, le=100)
    conviction_score: float = Field(..., ge=0, le=100)

    # Learning Progress
    mistakes_improved: int = 0
    coaching_sessions_completed: int = 0

    # Timestamps
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    twin_created_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Intelligence Twin Model
# ============================================================================

class ModelPerformance(BaseModel):
    """Individual model performance"""
    model_name: str
    accuracy: float = Field(..., ge=0, le=100)
    avg_confidence: float = Field(..., ge=0, le=100)
    predictions_count: int = 0
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class PredictionRecord(BaseModel):
    """Single prediction record for learning"""
    id: str
    asset_symbol: str
    prediction_type: str  # DIRECTION, SCORE, EVENT
    prediction_value: float
    confidence: float
    reasoning: List[str]
    model_used: str
    time_horizon: str

    # Filled after outcome
    actual_outcome: Optional[float] = None
    prediction_correct: Optional[bool] = None
    error: Optional[float] = None

    timestamp: datetime = Field(default_factory=datetime.utcnow)


class IntelligenceTwin(BaseModel):
    """
    Intelligence Digital Twin

    Tracks all predictions, outcomes, and system learning.
    This is what makes the platform improve over time.
    """

    platform_id: str = "assetmind"

    # Overall Performance
    total_predictions: int = 0
    correct_predictions: int = 0
    overall_accuracy: float = Field(..., ge=0, le=100)

    # Confidence Calibration
    avg_predicted_confidence: float = Field(..., ge=0, le=100)
    actual_accuracy_at_confidence: float = Field(..., ge=0, le=100)
    calibration_error: float = Field(...)  # Difference between predicted and actual

    # Model Performance
    technical_model_performance: ModelPerformance = Field(...)
    fundamental_model_performance: ModelPerformance = Field(...)
    sentiment_model_performance: ModelPerformance = Field(...)
    macro_model_performance: ModelPerformance = Field(...)
    event_model_performance: ModelPerformance = Field(...)
    ensemble_model_performance: ModelPerformance = Field(...)

    # Learning Events
    major_learning_events: List[str] = Field(default_factory=list)
    pattern_discoveries: List[str] = Field(default_factory=list)
    model_updates: List[str] = Field(default_factory=list)

    # Intellectual Property
    proprietary_indicators: List[str] = Field(default_factory=list)
    proprietary_patterns: List[str] = Field(default_factory=list)
    proprietary_relationships: List[str] = Field(default_factory=list)

    # Recent Predictions (last 100)
    recent_predictions: List[PredictionRecord] = Field(default_factory=list)

    # Improvement Trends
    accuracy_trend_30d: str = Field(...)  # IMPROVING, STABLE, DECLINING
    accuracy_trend_90d: str = Field(...)
    accuracy_trend_1y: str = Field(...)

    # Timestamps
    last_updated: datetime = Field(default_factory=datetime.utcnow)
