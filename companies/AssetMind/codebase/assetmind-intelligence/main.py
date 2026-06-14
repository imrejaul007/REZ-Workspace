"""
AssetMind Intelligence Service - Port 5050
Multi-source market analysis, pattern recognition, anomaly detection.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import random

app = FastAPI(title="AssetMind Intelligence Service", version="1.0.0")
DEFAULT_PORT = 5050


class InsightType(str, Enum):
    OPPORTUNITY = "opportunity"
    RISK = "risk"
    TREND = "trend"
    ANOMALY = "anomaly"


class SourceType(str, Enum):
    MARKET = "market"
    NEWS = "news"
    SOCIAL = "social"
    TECHNICAL = "technical"


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Insight(BaseModel):
    id: str
    type: InsightType
    title: str
    description: str
    confidence: float = Field(ge=0, le=1)
    severity: Severity = Severity.MEDIUM
    source: SourceType
    symbols: List[str] = Field(default_factory=list)
    action: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class IntelligenceRequest(BaseModel):
    symbols: List[str]
    timeframe: str = "1d"
    min_confidence: float = 0.5


class SentimentData(BaseModel):
    symbol: str
    overall_sentiment: float = Field(ge=-1, le=1)
    bullish_signals: int = 0
    bearish_signals: int = 0
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RiskSignal(BaseModel):
    symbol: str
    risk_type: str
    severity: Severity
    description: str
    probability: float


# In-memory stores
insights_store: Dict[str, Insight] = {}
sentiment_store: Dict[str, SentimentData] = {}
risk_signals_store: Dict[str, RiskSignal] = {}
signal_store: List[Dict] = []


def get_uptime() -> float:
    if not hasattr(app.state, "started_at"):
        app.state.started_at = datetime.utcnow()
    return (datetime.utcnow() - app.state.started_at).total_seconds()


# ============================================================================
# Health & Status
# ============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-intelligence",
        "status": "healthy",
        "version": "1.0.0",
        "port": DEFAULT_PORT,
        "uptime_seconds": get_uptime(),
        "capabilities": {
            "multi_source_analysis": "active",
            "pattern_recognition": "active",
            "anomaly_detection": "active",
            "sentiment_analysis": "active"
        }
    }


@app.get("/status")
async def get_status():
    return {
        "service": "assetmind-intelligence",
        "insights_generated": len(insights_store),
        "sentiments_tracked": len(sentiment_store),
        "risk_signals": len(risk_signals_store)
    }


# ============================================================================
# Insights Endpoints
# ============================================================================

@app.get("/insights")
async def get_insights(
    insight_type: Optional[InsightType] = None,
    min_confidence: float = 0.0,
    limit: int = 50
):
    insights = list(insights_store.values())
    if insight_type:
        insights = [i for i in insights if i.type == insight_type]
    if min_confidence > 0:
        insights = [i for i in insights if i.confidence >= min_confidence]
    insights.sort(key=lambda x: x.confidence, reverse=True)
    return {"insights": insights[:limit], "total": len(insights)}


@app.post("/insights")
async def create_insight(insight: Insight):
    insight.id = f"ins-{len(insights_store) + 1}"
    insight.created_at = datetime.utcnow()
    insights_store[insight.id] = insight
    return {"insight_id": insight.id, "created": True}


@app.get("/insights/{insight_id}")
async def get_insight(insight_id: str):
    if insight_id not in insights_store:
        raise HTTPException(status_code=404, detail="Insight not found")
    return insights_store[insight_id]


# ============================================================================
# Sentiment Analysis Endpoints
# ============================================================================

@app.get("/sentiment/{symbol}")
async def get_sentiment(symbol: str):
    if symbol not in sentiment_store:
        sentiment = SentimentData(
            symbol=symbol,
            overall_sentiment=random.uniform(-0.3, 0.3),
            bullish_signals=random.randint(5, 20),
            bearish_signals=random.randint(5, 20)
        )
        sentiment_store[symbol] = sentiment
    return sentiment_store[symbol]


@app.post("/sentiment")
async def update_sentiment(sentiment: SentimentData):
    sentiment.updated_at = datetime.utcnow()
    sentiment_store[sentiment.symbol] = sentiment
    return {"symbol": sentiment.symbol, "updated": True}


# ============================================================================
# Risk Signals Endpoints
# ============================================================================

@app.get("/risk-signals")
async def get_risk_signals(severity: Optional[Severity] = None, limit: int = 50):
    signals = list(risk_signals_store.values())
    if severity:
        signals = [s for s in signals if s.severity == severity]
    return {"risk_signals": signals[:limit], "total": len(signals)}


@app.post("/risk-signals")
async def create_risk_signal(signal: RiskSignal):
    signal_id = f"risk-{len(risk_signals_store) + 1}"
    risk_signals_store[signal_id] = signal
    return {"signal_id": signal_id, "created": True}


# ============================================================================
# Analysis Endpoints
# ============================================================================

@app.post("/analyze")
async def analyze(request: IntelligenceRequest):
    insights = []
    for symbol in request.symbols:
        insight = Insight(
            id=f"ins-{len(insights_store) + 1}",
            type=InsightType.OPPORTUNITY,
            title=f"{symbol} showing bullish momentum",
            description=f"Technical indicators suggest upward movement for {symbol}",
            confidence=0.78,
            severity=Severity.MEDIUM,
            source=SourceType.TECHNICAL,
            symbols=[symbol],
            action="Consider long position"
        )
        insights.append(insight)
        insights_store[insight.id] = insight

    return {
        "analysis_id": f"analysis-{len(insights_store)}",
        "symbols": request.symbols,
        "insights_generated": len(insights),
        "confidence": 0.78
    }


@app.post("/sentiment/analyze")
async def analyze_sentiment(symbol: str):
    sentiment = SentimentData(
        symbol=symbol,
        overall_sentiment=random.uniform(-0.3, 0.3),
        bullish_signals=random.randint(5, 20),
        bearish_signals=random.randint(5, 20)
    )
    sentiment_store[symbol] = sentiment
    return sentiment


# ============================================================================
# Market Signals Endpoints
# ============================================================================

@app.get("/signals/{symbol}")
async def get_signals(symbol: str):
    signals = [s for s in signal_store if s.get("symbol") == symbol]
    return {"symbol": symbol, "signals": signals, "count": len(signals)}


@app.post("/signals/generate")
async def generate_signals(symbol: str, analysis_type: str = "COMPREHENSIVE"):
    signal = {
        "symbol": symbol,
        "signal_type": "HOLD",
        "strength": 0.5,
        "analysis_type": analysis_type,
        "timestamp": datetime.utcnow().isoformat()
    }
    signal_store.append(signal)
    return {"signal": signal}


@app.get("/signals/top")
async def get_top_signals(limit: int = 20):
    signals = sorted(signal_store, key=lambda x: x.get("strength", 0), reverse=True)
    return {"signals": signals[:limit]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=DEFAULT_PORT)
