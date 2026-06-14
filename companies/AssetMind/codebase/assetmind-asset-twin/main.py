"""
AssetMind Asset Twin Service
Digital twin for individual financial assets

Port: 5002

Version: 1.0.0
"""

import asyncio
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
import random

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="AssetMind Asset Twin",
    description="Digital twin service for financial assets",
    version="1.0.0",
)

# ============================================================================
# Enums
# ============================================================================

class TwinStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SYNCING = "syncing"
    ERROR = "error"

class TwinType(str, Enum):
    STOCK = "stock"
    CRYPTO = "crypto"
    FOREX = "forex"
    COMMODITY = "commodity"
    ETF = "etf"
    BOND = "bond"

class TimeFrame(str, Enum):
    MINUTE = "1m"
    HOUR = "1h"
    DAY = "1d"
    WEEK = "1w"
    MONTH = "1M"

# ============================================================================
# Pydantic Models - Twin Core
# ============================================================================

class PricePoint(BaseModel):
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int = 0

class TechnicalIndicators(BaseModel):
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    ema_12: Optional[float] = None
    ema_26: Optional[float] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_histogram: Optional[float] = None
    bollinger_upper: Optional[float] = None
    bollinger_lower: Optional[float] = None
    atr: Optional[float] = None

class AssetMetrics(BaseModel):
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    eps: Optional[float] = None
    dividend_yield: Optional[float] = None
    beta: float = 1.0
    volume_24h: Optional[int] = None
    avg_volume_30d: Optional[int] = None

class Prediction(BaseModel):
    horizon: str  # 1d, 1w, 1m
    direction: str  # up, down, sideways
    confidence: float  # 0.0 to 1.0
    target_price: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ============================================================================
# Pydantic Models - Twin Entity
# ============================================================================

class TwinCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=200)
    twin_type: TwinType
    initial_price: float = Field(..., gt=0)
    currency: str = Field(default="USD", max_length=3)
    metadata: Optional[Dict[str, Any]] = None

class TwinState(BaseModel):
    current_price: float
    price_change_24h: float = 0.0
    price_change_pct_24h: float = 0.0
    volume_24h: int = 0
    high_24h: float = 0.0
    low_24h: float = 0.0
    market_cap: Optional[float] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class TwinConfig(BaseModel):
    refresh_interval_seconds: int = 60
    history_retention_days: int = 365
    enable_predictions: bool = True
    technical_indicators: List[str] = ["sma", "rsi", "macd"]

class AssetTwin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str
    name: str
    twin_type: TwinType
    currency: str = "USD"
    status: TwinStatus = TwinStatus.ACTIVE

    # State
    state: TwinState
    config: TwinConfig = Field(default_factory=TwinConfig)

    # Analytics
    metrics: Optional[AssetMetrics] = None
    indicators: Optional[TechnicalIndicators] = None
    predictions: List[Prediction] = []

    # History
    price_history: List[PricePoint] = []

    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

# ============================================================================
# Request/Response Models
# ============================================================================

class PriceHistoryRequest(BaseModel):
    symbol: str
    timeframe: TimeFrame = TimeFrame.DAY
    limit: int = Field(default=100, ge=1, le=1000)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class AnalysisRequest(BaseModel):
    symbol: str
    indicators: List[str] = ["sma", "rsi", "macd", "bollinger"]
    timeframe: TimeFrame = TimeFrame.DAY

class AnalysisResponse(BaseModel):
    symbol: str
    current_price: float
    indicators: TechnicalIndicators
    signals: Dict[str, str]  # indicator -> signal (bullish/bearish/neutral)
    summary: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ============================================================================
# In-Memory Storage
# ============================================================================

twins_db: Dict[str, AssetTwin] = {}

def create_sample_twin(symbol: str, name: str, twin_type: TwinType, price: float) -> AssetTwin:
    """Create a sample twin with initial data."""
    twin = AssetTwin(
        symbol=symbol,
        name=name,
        twin_type=twin_type,
        state=TwinState(
            current_price=price,
            price_change_24h=random.uniform(-5, 10),
            price_change_pct_24h=random.uniform(-3, 5),
            volume_24h=random.randint(1000000, 50000000),
            high_24h=price * 1.02,
            low_24h=price * 0.98,
            market_cap=price * random.randint(1000000, 100000000),
        ),
        metrics=AssetMetrics(
            market_cap=price * random.randint(1000000, 100000000),
            pe_ratio=random.uniform(10, 50),
            eps=random.uniform(1, 20),
            dividend_yield=random.uniform(0, 5),
            beta=random.uniform(0.5, 2.0),
            volume_24h=random.randint(1000000, 50000000),
            avg_volume_30d=random.randint(5000000, 30000000),
        ),
        indicators=TechnicalIndicators(
            sma_20=price * random.uniform(0.95, 1.05),
            sma_50=price * random.uniform(0.90, 1.10),
            rsi=random.uniform(30, 70),
            macd=random.uniform(-2, 2),
            macd_signal=random.uniform(-1, 1),
            macd_histogram=random.uniform(-1, 1),
            bollinger_upper=price * 1.02,
            bollinger_lower=price * 0.98,
            atr=random.uniform(1, 5),
        ),
        predictions=[
            Prediction(horizon="1d", direction="up", confidence=0.65, target_price=price * 1.01),
            Prediction(horizon="1w", direction="up", confidence=0.55, target_price=price * 1.05),
            Prediction(horizon="1m", direction="sideways", confidence=0.45, target_price=price),
        ],
    )
    twins_db[twin.id] = twin
    return twin

# Initialize sample twins
init_twins = [
    ("AAPL", "Apple Inc.", TwinType.STOCK, 178.50),
    ("GOOGL", "Alphabet Inc.", TwinType.STOCK, 141.20),
    ("MSFT", "Microsoft Corp.", TwinType.STOCK, 378.90),
    ("BTC", "Bitcoin", TwinType.CRYPTO, 67500.00),
    ("ETH", "Ethereum", TwinType.CRYPTO, 3450.00),
    ("EURUSD", "Euro/US Dollar", TwinType.FOREX, 1.0850),
    ("GOLD", "Gold Futures", TwinType.COMMODITY, 2345.00),
    ("SPY", "SPDR S&P 500 ETF", TwinType.ETF, 523.45),
]

for symbol, name, twin_type, price in init_twins:
    create_sample_twin(symbol, name, twin_type, price)

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "assetmind-asset-twin",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {
            "active_twins": len(twins_db),
            "by_type": {t.value: sum(1 for twin in twins_db.values() if twin.twin_type == t) for t in TwinType},
        },
    }

# ============================================================================
# Twin Management Endpoints
# ============================================================================

@app.post("/api/twins", response_model=AssetTwin, status_code=201)
async def create_twin(twin: TwinCreate):
    """Create a new asset twin."""
    # Check for duplicate symbol
    for existing in twins_db.values():
        if existing.symbol == twin.symbol.upper():
            raise HTTPException(status_code=400, detail=f"Twin for {twin.symbol} already exists")

    new_twin = create_sample_twin(
        symbol=twin.symbol.upper(),
        name=twin.name,
        twin_type=twin.twin_type,
        price=twin.initial_price,
    )

    if twin.metadata:
        new_twin.metadata = twin.metadata

    return new_twin

@app.get("/api/twins", response_model=List[AssetTwin])
async def list_twins(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    twin_type: Optional[TwinType] = None,
    status: Optional[TwinStatus] = None,
):
    """List all twins with optional filtering."""
    twins = list(twins_db.values())

    if twin_type:
        twins = [t for t in twins if t.twin_type == twin_type]
    if status:
        twins = [t for t in twins if t.status == status]

    return twins[skip : skip + limit]

@app.get("/api/twins/{twin_id}", response_model=AssetTwin)
async def get_twin(twin_id: str):
    """Get a specific twin by ID."""
    if twin_id not in twins_db:
        raise HTTPException(status_code=404, detail="Twin not found")
    return twins_db[twin_id]

@app.get("/api/twins/symbol/{symbol}", response_model=AssetTwin)
async def get_twin_by_symbol(symbol: str):
    """Get twin by symbol."""
    for twin in twins_db.values():
        if twin.symbol == symbol.upper():
            return twin
    raise HTTPException(status_code=404, detail=f"Twin for {symbol} not found")

@app.put("/api/twins/{twin_id}/state", response_model=AssetTwin)
async def update_twin_state(twin_id: str, state: TwinState):
    """Update twin state (price, volume, etc.)."""
    if twin_id not in twins_db:
        raise HTTPException(status_code=404, detail="Twin not found")

    twin = twins_db[twin_id]
    twin.state = state
    twin.updated_at = datetime.utcnow()
    return twin

@app.post("/api/twins/{twin_id}/sync", response_model=AssetTwin)
async def sync_twin(twin_id: str, background_tasks: BackgroundTasks):
    """Trigger twin synchronization."""
    if twin_id not in twins_db:
        raise HTTPException(status_code=404, detail="Twin not found")

    twin = twins_db[twin_id]
    twin.status = TwinStatus.SYNCING

    async def do_sync():
        await asyncio.sleep(0.5)
        twin.state.last_updated = datetime.utcnow()
        twin.status = TwinStatus.ACTIVE

    background_tasks.add_task(do_sync)
    return twin

@app.delete("/api/twins/{twin_id}", status_code=204)
async def delete_twin(twin_id: str):
    """Delete a twin."""
    if twin_id not in twins_db:
        raise HTTPException(status_code=404, detail="Twin not found")
    del twins_db[twin_id]
    return None

# ============================================================================
# Price History Endpoints
# ============================================================================

@app.get("/api/twins/{symbol}/history")
async def get_price_history(
    symbol: str,
    timeframe: TimeFrame = TimeFrame.DAY,
    limit: int = Query(100, ge=1, le=1000),
):
    """Get price history for a twin."""
    twin = await get_twin_by_symbol(symbol)

    # Generate sample history
    history = []
    base_price = twin.state.current_price
    now = datetime.utcnow()

    for i in range(min(limit, 365)):
        if timeframe == TimeFrame.DAY:
            ts = now - timedelta(days=i)
        elif timeframe == TimeFrame.HOUR:
            ts = now - timedelta(hours=i)
        elif timeframe == TimeFrame.WEEK:
            ts = now - timedelta(weeks=i)
        else:
            ts = now - timedelta(days=i)

        price_var = random.uniform(0.98, 1.02)
        close = base_price * price_var
        history.append(PricePoint(
            timestamp=ts,
            open=close * random.uniform(0.995, 1.005),
            high=close * random.uniform(1.0, 1.01),
            low=close * random.uniform(0.99, 1.0),
            close=close,
            volume=random.randint(1000000, 50000000),
        ))

    return {
        "symbol": symbol,
        "timeframe": timeframe.value,
        "history": history,
        "count": len(history),
    }

# ============================================================================
# Analytics Endpoints
# ============================================================================

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_twin(request: AnalysisRequest):
    """Analyze a twin with technical indicators."""
    twin = await get_twin_by_symbol(request.symbol)

    signals = {}
    indicators = twin.indicators or TechnicalIndicators()

    # Generate signals based on indicators
    if indicators.rsi:
        if indicators.rsi > 70:
            signals["rsi"] = "overbought"
        elif indicators.rsi < 30:
            signals["rsi"] = "oversold"
        else:
            signals["rsi"] = "neutral"

    if indicators.macd and indicators.macd_signal:
        if indicators.macd > indicators.macd_signal:
            signals["macd"] = "bullish"
        else:
            signals["macd"] = "bearish"

    if indicators.sma_20 and indicators.sma_50:
        if indicators.sma_20 > indicators.sma_50:
            signals["sma_crossover"] = "bullish"
        else:
            signals["sma_crossover"] = "bearish"

    if indicators.bollinger_upper and indicators.bollinger_lower:
        price = twin.state.current_price
        mid = (indicators.bollinger_upper + indicators.bollinger_lower) / 2
        if price > indicators.bollinger_upper:
            signals["bollinger"] = "overbought"
        elif price < indicators.bollinger_lower:
            signals["bollinger"] = "oversold"
        else:
            signals["bollinger"] = "neutral"

    # Generate summary
    bullish_count = sum(1 for s in signals.values() if s in ["bullish", "oversold"])
    bearish_count = sum(1 for s in signals.values() if s in ["bearish", "overbought"])

    if bullish_count > bearish_count:
        summary = f"Bullish trend detected. {bullish_count} indicators positive."
    elif bearish_count > bullish_count:
        summary = f"Bearish trend detected. {bearish_count} indicators negative."
    else:
        summary = "Neutral market conditions."

    return AnalysisResponse(
        symbol=request.symbol,
        current_price=twin.state.current_price,
        indicators=indicators,
        signals=signals,
        summary=summary,
    )

@app.get("/api/twins/{symbol}/metrics")
async def get_twin_metrics(symbol: str):
    """Get detailed metrics for a twin."""
    twin = await get_twin_by_symbol(symbol)
    return {
        "symbol": symbol,
        "metrics": twin.metrics,
        "state": twin.state,
        "predictions": twin.predictions,
    }

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting AssetMind Asset Twin Service on port 5002")
    uvicorn.run(app, host="0.0.0.0", port=5002)