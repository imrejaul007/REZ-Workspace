"""
AssetMind Market Twin Service
Market conditions and trends analysis

Port: 5006

Version: 1.0.0
"""

import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
import random

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="AssetMind Market Twin",
    description="Market conditions and trends analysis service",
    version="1.0.0",
)

# ============================================================================
# Enums
# ============================================================================

class MarketPhase(str, Enum):
    BULL = "bull"
    BEAR = "bear"
    SIDEWAYS = "sideways"
    RECOVERY = "recovery"
    DISTRIBUTION = "distribution"

class MarketRegime(str, Enum):
    LOW_VOLATILITY = "low_volatility"
    HIGH_VOLATILITY = "high_volatility"
    TRENDING = "trending"
    RANGE_BOUND = "range_bound"
    CRISIS = "crisis"

class TrendDirection(str, Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"

class SectorType(str, Enum):
    TECHNOLOGY = "technology"
    HEALTHCARE = "healthcare"
    FINANCIALS = "financials"
    CONSUMER = "consumer"
    ENERGY = "energy"
    INDUSTRIALS = "industrials"
    MATERIALS = "materials"
    UTILITIES = "utilities"
    REAL_ESTATE = "real_estate"
    COMMUNICATIONS = "communications"

# ============================================================================
# Pydantic Models - Market Data
# ============================================================================

class IndexQuote(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_pct: float
    volume: int = 0
    high: float = 0.0
    low: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SectorPerformance(BaseModel):
    sector: SectorType
    performance_1d: float
    performance_1w: float
    performance_1m: float
    performance_ytd: float
    relative_strength: float  # vs SPX
    volume_change: float
    top_gainer: Optional[str] = None
    top_loser: Optional[str] = None

class VolatilityMetrics(BaseModel):
    vix: float = 0.0
    vix_change: float = 0.0
    atr_spy: float = 0.0
    atr_qqq: float = 0.0
    put_call_ratio: float = 1.0
    fear_greed_index: float = 50.0
    fear_greed_label: str = "neutral"

class MarketBreadth(BaseModel):
    advancing_issues: int = 0
    declining_issues: int = 0
    new_highs: int = 0
    new_lows: int = 0
    advancing_volume: int = 0
    declining_volume: int = 0
    breadth_ratio: float = 1.0
    a_d_line: int = 0

class TrendData(BaseModel):
    direction: TrendDirection
    strength: float  # 0.0 to 1.0
    duration_days: int = 0
    start_price: float = 0.0
    current_price: float = 0.0

# ============================================================================
# Pydantic Models - Market Twin Entity
# ============================================================================

class MarketConditions(BaseModel):
    phase: MarketPhase = MarketPhase.SIDEWAYS
    regime: MarketRegime = MarketRegime.RANGE_BOUND
    volatility: VolatilityMetrics = Field(default_factory=VolatilityMetrics)
    breadth: MarketBreadth = Field(default_factory=MarketBreadth)
    trend: TrendData = Field(default_factory=TrendData)

class SupportResistance(BaseModel):
    level: float
    type: str  # support, resistance
    strength: float  # 0.0 to 1.0
    touches: int = 0
    last_test: Optional[datetime] = None

class MarketTwin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Market Overview"
    region: str = "US"
    currency: str = "USD"

    # Indices
    indices: List[IndexQuote] = []

    # Conditions
    conditions: MarketConditions = Field(default_factory=MarketConditions)

    # Sectors
    sector_performance: List[SectorPerformance] = []

    # Levels
    support_resistance: List[SupportResistance] = []

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

# ============================================================================
# Request/Response Models
# ============================================================================

class MarketAnalysisRequest(BaseModel):
    symbols: List[str] = ["SPY", "QQQ", "DIA"]
    timeframe: str = "1d"
    include_sentiment: bool = True
    include_correlations: bool = True

class MarketAnalysisResponse(BaseModel):
    market_phase: MarketPhase
    regime: MarketRegime
    overall_sentiment: str
    confidence: float
    key_levels: List[SupportResistance]
    sector_rotation: List[SectorPerformance]
    risk_factors: List[str]
    opportunities: List[str]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ============================================================================
# In-Memory Storage
# ============================================================================

market_twin: Optional[MarketTwin] = None

def initialize_market_twin() -> MarketTwin:
    """Initialize market twin with sample data."""
    global market_twin

    indices = [
        IndexQuote(symbol="SPX", name="S&P 500", price=5234.18, change=15.32, change_pct=0.29,
                   volume=2500000000, high=5250.00, low=5210.50),
        IndexQuote(symbol="NDX", name="NASDAQ 100", price=18345.67, change=-45.21, change_pct=-0.25,
                   volume=3200000000, high=18450.00, low=18280.00),
        IndexQuote(symbol="DJI", name="Dow Jones", price=39127.14, change=89.54, change_pct=0.23,
                   volume=350000000, high=39200.00, low=38950.00),
        IndexQuote(symbol="RUT", name="Russell 2000", price=2078.34, change=12.45, change_pct=0.60,
                   volume=2500000000, high=2085.00, low=2060.00),
        IndexQuote(symbol="VIX", name="Volatility Index", price=14.25, change=-0.85, change_pct=-5.63,
                   volume=0, high=15.50, low=14.00),
    ]

    sectors = [
        SectorPerformance(sector=SectorType.TECHNOLOGY, performance_1d=0.45, performance_1w=2.1,
                          performance_1m=5.3, performance_ytd=18.5, relative_strength=1.2,
                          volume_change=15.2, top_gainer="NVDA", top_loser="META"),
        SectorPerformance(sector=SectorType.HEALTHCARE, performance_1d=-0.35, performance_1w=0.8,
                          performance_1m=1.2, performance_ytd=5.8, relative_strength=0.8,
                          volume_change=-5.0),
        SectorPerformance(sector=SectorType.FINANCIALS, performance_1d=0.72, performance_1w=1.5,
                          performance_1m=3.8, performance_ytd=12.3, relative_strength=1.1,
                          volume_change=8.5),
        SectorPerformance(sector=SectorType.CONSUMER, performance_1d=-0.15, performance_1w=0.5,
                          performance_1m=2.1, performance_ytd=8.5, relative_strength=0.95,
                          volume_change=2.3),
        SectorPerformance(sector=SectorType.ENERGY, performance_1d=1.25, performance_1w=3.2,
                          performance_1m=6.5, performance_ytd=15.2, relative_strength=1.3,
                          volume_change=12.0, top_gainer="XOM"),
    ]

    conditions = MarketConditions(
        phase=MarketPhase.BULL,
        regime=MarketRegime.LOW_VOLATILITY,
        volatility=VolatilityMetrics(
            vix=14.25,
            vix_change=-5.63,
            atr_spy=18.50,
            atr_qqq=95.20,
            put_call_ratio=0.85,
            fear_greed_index=68.0,
            fear_greed_label="greed",
        ),
        breadth=MarketBreadth(
            advancing_issues=2850,
            declining_issues=1750,
            new_highs=145,
            new_lows=25,
            advancing_volume=8500000000,
            declining_volume=5200000000,
            breadth_ratio=1.63,
            a_d_line=1250,
        ),
        trend=TrendData(
            direction=TrendDirection.BULLISH,
            strength=0.75,
            duration_days=45,
            start_price=4850.00,
            current_price=5234.18,
        ),
    )

    levels = [
        SupportResistance(level=5150.00, type="support", strength=0.85, touches=5),
        SupportResistance(level=5200.00, type="support", strength=0.70, touches=3),
        SupportResistance(level=5300.00, type="resistance", strength=0.80, touches=4),
        SupportResistance(level=5400.00, type="resistance", strength=0.65, touches=2),
    ]

    market_twin = MarketTwin(
        indices=indices,
        conditions=conditions,
        sector_performance=sectors,
        support_resistance=levels,
    )

    return market_twin

# Initialize
initialize_market_twin()

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "assetmind-market-twin",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "market_phase": market_twin.conditions.phase.value if market_twin else "unknown",
        "vix": market_twin.conditions.volatility.vix if market_twin else 0,
    }

# ============================================================================
# Market Summary Endpoints
# ============================================================================

@app.get("/api/market/summary", response_model=MarketTwin)
async def get_market_summary():
    """Get overall market summary."""
    return market_twin

@app.get("/api/market/indices", response_model=List[IndexQuote])
async def get_indices():
    """Get major market indices."""
    return market_twin.indices if market_twin else []

@app.get("/api/market/indices/{symbol}", response_model=IndexQuote)
async def get_index(symbol: str):
    """Get specific index quote."""
    for idx in market_twin.indices:
        if idx.symbol.upper() == symbol.upper():
            return idx
    raise HTTPException(status_code=404, detail=f"Index {symbol} not found")

@app.get("/api/market/volatility", response_model=VolatilityMetrics)
async def get_volatility():
    """Get volatility metrics."""
    return market_twin.conditions.volatility if market_twin else VolatilityMetrics()

@app.get("/api/market/breadth", response_model=MarketBreadth)
async def get_breadth():
    """Get market breadth indicators."""
    return market_twin.conditions.breadth if market_twin else MarketBreadth()

# ============================================================================
# Sector Endpoints
# ============================================================================

@app.get("/api/market/sectors", response_model=List[SectorPerformance])
async def get_sectors(
    sort_by: str = Query("performance_ytd", description="Sort field"),
    ascending: bool = Query(False, description="Sort direction"),
):
    """Get sector performance."""
    sectors = market_twin.sector_performance if market_twin else []

    if sort_by == "performance_1d":
        sectors = sorted(sectors, key=lambda s: s.performance_1d, reverse=not ascending)
    elif sort_by == "performance_1w":
        sectors = sorted(sectors, key=lambda s: s.performance_1w, reverse=not ascending)
    elif sort_by == "performance_1m":
        sectors = sorted(sectors, key=lambda s: s.performance_1m, reverse=not ascending)
    else:
        sectors = sorted(sectors, key=lambda s: s.performance_ytd, reverse=not ascending)

    return sectors

@app.get("/api/market/sectors/{sector}", response_model=SectorPerformance)
async def get_sector(sector: str):
    """Get specific sector performance."""
    for s in market_twin.sector_performance:
        if s.sector.value == sector.lower():
            return s
    raise HTTPException(status_code=404, detail=f"Sector {sector} not found")

# ============================================================================
# Trend & Levels Endpoints
# ============================================================================

@app.get("/api/market/trend", response_model=TrendData)
async def get_trend():
    """Get current market trend."""
    return market_twin.conditions.trend if market_twin else TrendData(direction=TrendDirection.NEUTRAL)

@app.get("/api/market/levels", response_model=List[SupportResistance])
async def get_levels(
    type: Optional[str] = Query(None, description="Filter by support or resistance"),
):
    """Get support and resistance levels."""
    levels = market_twin.support_resistance if market_twin else []

    if type:
        levels = [l for l in levels if l.type == type.lower()]

    return levels

@app.get("/api/market/levels/near/{price}", response_model=List[SupportResistance])
async def get_nearest_levels(price: float):
    """Find support/resistance levels near a price."""
    if not market_twin:
        return []

    sorted_levels = sorted(market_twin.support_resistance, key=lambda l: abs(l.level - price))
    return sorted_levels[:3]

# ============================================================================
# Analysis Endpoints
# ============================================================================

@app.post("/api/analyze", response_model=MarketAnalysisResponse)
async def analyze_market(request: MarketAnalysisRequest):
    """Perform market analysis."""
    conditions = market_twin.conditions if market_twin else MarketConditions()

    # Determine sentiment
    fear_greed = conditions.volatility.fear_greed_index
    trend = conditions.trend.direction

    if fear_greed >= 70 and trend == TrendDirection.BULLISH:
        sentiment = "strongly_bullish"
        confidence = 0.85
    elif fear_greed >= 60 and trend == TrendDirection.BULLISH:
        sentiment = "bullish"
        confidence = 0.75
    elif fear_greed <= 30 and trend == TrendDirection.BEARISH:
        sentiment = "strongly_bearish"
        confidence = 0.85
    elif fear_greed <= 40 and trend == TrendDirection.BEARISH:
        sentiment = "bearish"
        confidence = 0.70
    else:
        sentiment = "neutral"
        confidence = 0.55

    # Risk factors
    risk_factors = []
    if conditions.volatility.vix > 25:
        risk_factors.append("High volatility - VIX elevated")
    if conditions.breadth.new_lows > 50:
        risk_factors.append("Increasing market weakness - many new lows")
    if conditions.breadth.breadth_ratio < 0.8:
        risk_factors.append("Weak breadth - declining stocks outperforming")

    # Opportunities
    opportunities = []
    if conditions.phase == MarketPhase.BULL and conditions.trend.strength > 0.7:
        opportunities.append("Strong uptrend - momentum strategies favored")
    for sector in conditions.sector_performance[:3]:
        if sector.performance_1m > 5:
            opportunities.append(f"{sector.sector.value} showing strength - consider overweight")

    return MarketAnalysisResponse(
        market_phase=conditions.phase,
        regime=conditions.regime,
        overall_sentiment=sentiment,
        confidence=confidence,
        key_levels=market_twin.support_resistance[:4] if market_twin else [],
        sector_rotation=conditions.sector_performance[:5],
        risk_factors=risk_factors,
        opportunities=opportunities,
    )

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting AssetMind Market Twin Service on port 5006")
    uvicorn.run(app, host="0.0.0.0", port=5006)