"""
AssetMind Market Intelligence Service
Market data aggregation, analysis, and insights
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date
from enum import Enum
import uuid

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="AssetMind Market Intelligence",
    description="Market data aggregation and intelligence service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Enums
# ============================================================================

class MarketTrend(str, Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"
    VOLATILE = "volatile"

class AssetClass(str, Enum):
    EQUITIES = "equities"
    FIXED_INCOME = "fixed_income"
    COMMODITIES = "commodities"
    REAL_ESTATE = "real_estate"
    CRYPTO = "crypto"
    FOREX = "forex"

class TimeInterval(str, Enum):
    MINUTE_1 = "1m"
    MINUTE_5 = "5m"
    MINUTE_15 = "15m"
    HOUR_1 = "1h"
    HOUR_4 = "4h"
    DAY_1 = "1d"
    WEEK_1 = "1w"
    MONTH_1 = "1M"

# ============================================================================
# Pydantic Models
# ============================================================================

class PriceData(BaseModel):
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    interval: TimeInterval

class MarketIndex(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    symbol: str
    current_value: float
    change: float
    change_percent: float
    trend: MarketTrend
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class SectorPerformance(BaseModel):
    sector: str
    performance_1d: float
    performance_1w: float
    performance_1m: float
    performance_1y: float
    leading_stocks: List[str]
    sentiment: str

class MarketSentiment(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    overall: str  # bullish, bearish, neutral
    fear_greed_index: float = Field(ge=0, le=100)
    vix: float
    put_call_ratio: float
    moving_averages: Dict[str, str]
    sectors: Dict[str, str]

class EconomicIndicator(BaseModel):
    indicator: str
    value: float
    unit: str
    previous_value: Optional[float] = None
    change_percent: Optional[float] = None
    timestamp: datetime
    source: str

class TechnicalSignal(BaseModel):
    symbol: str
    indicator: str
    value: float
    signal: str  # buy, sell, hold
    strength: float = Field(ge=0, le=1)
    timestamp: datetime

class MarketInsight(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: str
    impact: str  # high, medium, low
    affected_symbols: List[str]
    source: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChartPattern(BaseModel):
    pattern: str
    confidence: float
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    timeframe: str

class MarketDataRequest(BaseModel):
    symbols: List[str]
    interval: TimeInterval = TimeInterval.DAY_1
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None

# ============================================================================
# In-Memory Storage
# ============================================================================

indices_db: Dict[str, MarketIndex] = {}
insights_db: List[MarketInsight] = []
price_data_db: Dict[str, List[PriceData]] = {}
sectors_db: Dict[str, SectorPerformance] = {}

# Initialize sample data
_initialize_sample_data()

def _initialize_sample_data():
    sample_indices = [
        MarketIndex(name="S&P 500", symbol="SPX", current_value=5420.5, change=25.3,
                   change_percent=0.47, trend=MarketTrend.BULLISH),
        MarketIndex(name="NASDAQ", symbol="NDX", current_value=17850.2, change=-45.8,
                   change_percent=-0.26, trend=MarketTrend.BEARISH),
        MarketIndex(name="Dow Jones", symbol="DJI", current_value=38950.4, change=120.5,
                   change_percent=0.31, trend=MarketTrend.BULLISH),
        MarketIndex(name="Russell 2000", symbol="RUT", current_value=2050.3, change=15.2,
                   change_percent=0.75, trend=MarketTrend.BULLISH),
    ]
    for idx in sample_indices:
        indices_db[idx.symbol] = idx

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "assetmind-market-intelligence",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "indices_count": len(indices_db),
        "insights_count": len(insights_db)
    }

@app.get("/ready")
async def readiness_check():
    """Readiness check"""
    return {"ready": True}

# ============================================================================
# Market Indices Endpoints
# ============================================================================

@app.get("/api/v1/indices", response_model=List[MarketIndex])
async def list_market_indices():
    """List all tracked market indices"""
    return list(indices_db.values())

@app.get("/api/v1/indices/{symbol}", response_model=MarketIndex)
async def get_index(symbol: str):
    """Get specific market index"""
    if symbol not in indices_db:
        raise HTTPException(status_code=404, detail="Index not found")
    return indices_db[symbol]

@app.post("/api/v1/indices", response_model=MarketIndex, status_code=201)
async def create_index(index: MarketIndex):
    """Add a new market index to track"""
    indices_db[index.symbol] = index
    return index

@app.put("/api/v1/indices/{symbol}", response_model=MarketIndex)
async def update_index(symbol: str, index: MarketIndex):
    """Update market index data"""
    if symbol not in indices_db:
        raise HTTPException(status_code=404, detail="Index not found")
    index.last_updated = datetime.utcnow()
    indices_db[symbol] = index
    return index

# ============================================================================
# Price Data Endpoints
# ============================================================================

@app.post("/api/v1/prices", status_code=201)
async def add_price_data(price_data: PriceData):
    """Add price data point"""
    symbol = price_data.symbol
    if symbol not in price_data_db:
        price_data_db[symbol] = []
    price_data_db[symbol].append(price_data)
    # Keep last 1000 data points
    price_data_db[symbol] = price_data_db[symbol][-1000:]
    return {"added": True, "symbol": symbol}

@app.get("/api/v1/prices/{symbol}", response_model=List[PriceData])
async def get_price_data(
    symbol: str,
    interval: TimeInterval = Query(default=TimeInterval.DAY_1),
    limit: int = Query(default=100, le=1000)
):
    """Get price history for a symbol"""
    if symbol not in price_data_db:
        return []
    return price_data_db[symbol][-limit:]

@app.post("/api/v1/prices/batch", status_code=201)
async def batch_add_prices(data_points: List[PriceData]):
    """Batch add price data points"""
    count = 0
    for pd in data_points:
        symbol = pd.symbol
        if symbol not in price_data_db:
            price_data_db[symbol] = []
        price_data_db[symbol].append(pd)
        price_data_db[symbol] = price_data_db[symbol][-1000:]
        count += 1
    return {"added": count}

# ============================================================================
# Technical Analysis Endpoints
# ============================================================================

@app.get("/api/v1/analysis/{symbol}/signals", response_model=List[TechnicalSignal])
async def get_technical_signals(symbol: str):
    """Get technical analysis signals for a symbol"""
    # Simulated technical signals
    signals = [
        TechnicalSignal(
            symbol=symbol,
            indicator="RSI",
            value=58.5,
            signal="hold",
            strength=0.65,
            timestamp=datetime.utcnow()
        ),
        TechnicalSignal(
            symbol=symbol,
            indicator="MACD",
            value=2.35,
            signal="buy",
            strength=0.72,
            timestamp=datetime.utcnow()
        ),
        TechnicalSignal(
            symbol=symbol,
            indicator="MA50",
            value=150.25,
            signal="buy",
            strength=0.80,
            timestamp=datetime.utcnow()
        ),
    ]
    return signals

@app.get("/api/v1/analysis/{symbol}/patterns", response_model=List[ChartPattern])
async def detect_chart_patterns(symbol: str):
    """Detect chart patterns for a symbol"""
    # Simulated pattern detection
    patterns = [
        ChartPattern(
            pattern="Bull Flag",
            confidence=0.78,
            target_price=155.50,
            stop_loss=148.00,
            timeframe="4h"
        ),
        ChartPattern(
            pattern="Double Bottom",
            confidence=0.85,
            target_price=160.00,
            stop_loss=145.00,
            timeframe="1d"
        ),
    ]
    return patterns

@app.get("/api/v1/analysis/{symbol}/indicators")
async def get_technical_indicators(symbol: str):
    """Get comprehensive technical indicators"""
    return {
        "symbol": symbol,
        "indicators": {
            "RSI_14": 58.5,
            "MACD": {"value": 2.35, "signal": 1.80, "histogram": 0.55},
            "MA": {"MA20": 151.20, "MA50": 150.25, "MA200": 145.00},
            "BB": {"upper": 158.00, "middle": 152.00, "lower": 146.00},
            "ATR": 3.25,
            "ADX": 28.5
        },
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# Sector Analysis Endpoints
# ============================================================================

@app.get("/api/v1/sectors", response_model=List[SectorPerformance])
async def list_sectors():
    """List performance of all sectors"""
    return list(sectors_db.values())

@app.get("/api/v1/sectors/{sector}", response_model=SectorPerformance)
async def get_sector_performance(sector: str):
    """Get performance for a specific sector"""
    if sector not in sectors_db:
        raise HTTPException(status_code=404, detail="Sector not found")
    return sectors_db[sector]

@app.post("/api/v1/sectors", response_model=SectorPerformance, status_code=201)
async def create_sector_performance(perf: SectorPerformance):
    """Add sector performance data"""
    sectors_db[perf.sector] = perf
    return perf

# ============================================================================
# Market Sentiment Endpoints
# ============================================================================

@app.get("/api/v1/sentiment", response_model=MarketSentiment)
async def get_market_sentiment():
    """Get current market sentiment"""
    return MarketSentiment(
        timestamp=datetime.utcnow(),
        overall="bullish",
        fear_greed_index=65.5,
        vix=14.25,
        put_call_ratio=0.85,
        moving_averages={
            "SPX": "bullish",
            "NDX": "neutral",
            "DJI": "bullish"
        },
        sectors={
            "Technology": "bullish",
            "Healthcare": "neutral",
            "Finance": "bullish",
            "Energy": "bearish"
        }
    )

@app.get("/api/v1/sentiment/{symbol}")
async def get_symbol_sentiment(symbol: str):
    """Get sentiment for a specific symbol"""
    return {
        "symbol": symbol,
        "sentiment": "bullish",
        "score": 0.72,
        "social_volume": 15420,
        "social_sentiment": 0.65,
        "news_sentiment": 0.58,
        "analyst_rating": 4.2,
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# Market Insights Endpoints
# ============================================================================

@app.get("/api/v1/insights", response_model=List[MarketInsight])
async def list_insights(
    category: Optional[str] = None,
    limit: int = Query(default=20, le=100)
):
    """List market insights"""
    insights = insights_db
    if category:
        insights = [i for i in insights if i.category == category]
    return insights[-limit:]

@app.post("/api/v1/insights", response_model=MarketInsight, status_code=201)
async def create_insight(insight: MarketInsight):
    """Create a new market insight"""
    insights_db.append(insight)
    return insight

# ============================================================================
# Economic Indicators Endpoints
# ============================================================================

@app.get("/api/v1/economic/indicators", response_model=List[EconomicIndicator])
async def get_economic_indicators():
    """Get key economic indicators"""
    return [
        EconomicIndicator(
            indicator="CPI",
            value=3.2,
            unit="percent",
            previous_value=3.4,
            change_percent=-5.88,
            timestamp=datetime.utcnow(),
            source="BLS"
        ),
        EconomicIndicator(
            indicator="GDP Growth",
            value=2.1,
            unit="percent",
            previous_value=2.5,
            change_percent=-16.0,
            timestamp=datetime.utcnow(),
            source="BEA"
        ),
        EconomicIndicator(
            indicator="Unemployment",
            value=3.8,
            unit="percent",
            previous_value=3.9,
            change_percent=-2.56,
            timestamp=datetime.utcnow(),
            source="BLS"
        ),
        EconomicIndicator(
            indicator="Fed Funds Rate",
            value=5.25,
            unit="percent",
            previous_value=5.50,
            change_percent=-4.55,
            timestamp=datetime.utcnow(),
            source="FED"
        ),
    ]

# ============================================================================
# Run with uvicorn
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002)