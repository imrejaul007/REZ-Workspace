"""
AssetMind - Asset Twin Service
Main service for managing Asset Digital Twins

Port: 5002

Version: 1.0
Date: June 5, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from models.twin_models import (
    AssetTwin, Score, ProbabilityPrediction, RiskAssessment,
    SentimentData, FinancialRatios, Event, Relationship,
    HealthScores
)

app = FastAPI(title="AssetMind Asset Twin Service", version="1.0.0")

# In-memory storage (replace with PostgreSQL + TimescaleDB in production)
twin_store: Dict[str, AssetTwin] = {}


# ============================================================================
# Pydantic Models for Requests
# ============================================================================

class UpdateTwinRequest(BaseModel):
    """Request to update twin data"""
    current_price: Optional[float] = None
    price_change_24h: Optional[float] = None
    financial_score: Optional[Score] = None
    sentiment: Optional[SentimentData] = None
    risk_assessment: Optional[RiskAssessment] = None
    prediction: Optional[ProbabilityPrediction] = None


class CreateTwinRequest(BaseModel):
    """Request to create a new asset twin"""
    asset_id: str
    symbol: str
    name: str
    current_price: float = 0
    financial_score: Score
    sentiment: SentimentData
    risk_assessment: RiskAssessment
    prediction: ProbabilityPrediction


# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "service": "assetmind-asset-twin",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5002,
        "total_twins": len(twin_store)
    }


# ============================================================================
# Twin CRUD Operations
# ============================================================================

@app.post("/twins", status_code=201)
async def create_twin(request: CreateTwinRequest):
    """Create a new Asset Digital Twin"""

    if request.symbol in twin_store:
        raise HTTPException(status_code=409, detail="Twin already exists")

    twin = AssetTwin(
        asset_id=request.asset_id,
        symbol=request.symbol,
        name=request.name,
        current_price=request.current_price,
        price_change_24h=0,
        price_change_percent_24h=0,
        volume_24h=0,
        financial_ratios=FinancialRatios(),
        financial_score=request.financial_score,
        sentiment=request.sentiment,
        risk_assessment=request.risk_assessment,
        prediction=request.prediction,
        # Initialize all health scores
        market_health=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[]),
        financial_health=request.financial_score,
        sentiment_health=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[]),
        risk_health=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[]),
        institutional_health=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[]),
        technical_health=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[]),
        momentum_health=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[]),
        growth_health=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[]),
        overall_health_score=50,
        opportunity_score=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[]),
        conviction_score=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[]),
        institutional_score=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[]),
        momentum_score=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[])
    )

    twin_store[request.symbol] = twin
    return {"message": "Twin created", "symbol": twin.symbol, "twin_id": twin.asset_id}


@app.get("/twins/{symbol}")
async def get_twin(symbol: str):
    """Get Asset Twin by symbol"""

    twin = twin_store.get(symbol)
    if not twin:
        raise HTTPException(status_code=404, detail="Twin not found")

    return twin


@app.get("/twins")
async def list_twins(limit: int = 100, offset: int = 0):
    """List all Asset Twins"""
    twins = list(twin_store.values())
    return twins[offset:offset + limit]


@app.patch("/twins/{symbol}")
async def update_twin(symbol: str, request: UpdateTwinRequest):
    """Update Asset Twin with new data"""

    twin = twin_store.get(symbol)
    if not twin:
        raise HTTPException(status_code=404, detail="Twin not found")

    # Update fields
    if request.current_price is not None:
        twin.current_price = request.current_price
    if request.price_change_24h is not None:
        twin.price_change_24h = request.price_change_24h
    if request.financial_score is not None:
        twin.financial_score = request.financial_score
    if request.sentiment is not None:
        twin.sentiment = request.sentiment
    if request.risk_assessment is not None:
        twin.risk_assessment = request.risk_assessment
    if request.prediction is not None:
        twin.prediction = request.prediction

    twin.last_updated = datetime.utcnow()

    return {"message": "Twin updated", "symbol": symbol, "updated_at": twin.last_updated}


# ============================================================================
# Twin Analytics
# ============================================================================

@app.get("/twins/{symbol}/scores")
async def get_twin_scores(symbol: str):
    """Get all scores for an Asset Twin"""

    twin = twin_store.get(symbol)
    if not twin:
        raise HTTPException(status_code=404, detail="Twin not found")

    return {
        "symbol": symbol,
        "overall_health": twin.overall_health_score,
        "opportunity": twin.opportunity_score.value,
        "risk": twin.risk_score.value if hasattr(twin, 'risk_score') else twin.risk_assessment.overall_risk,
        "sentiment": twin.sentiment_score.value if hasattr(twin, 'sentiment_score') else twin.sentiment.overall_sentiment,
        "conviction": twin.conviction_score.value,
        "institutional": twin.institutional_score.value,
        "financial": twin.financial_score.value,
        "technical": twin.technical_health.value,
        "momentum": twin.momentum_score.value,
        "prediction": twin.prediction.model_dump()
    }


@app.get("/twins/{symbol}/prediction")
async def get_twin_prediction(symbol: str):
    """Get prediction for an Asset Twin"""

    twin = twin_store.get(symbol)
    if not twin:
        raise HTTPException(status_code=404, detail="Twin not found")

    return twin.prediction


@app.get("/twins/{symbol}/health")
async def get_twin_health(symbol: str):
    """Get health breakdown for an Asset Twin"""

    twin = twin_store.get(symbol)
    if not twin:
        raise HTTPException(status_code=404, detail="Twin not found")

    return {
        "symbol": symbol,
        "overall": twin.overall_health_score,
        "market": twin.market_health.value,
        "financial": twin.financial_health.value,
        "sentiment": twin.sentiment_health.value,
        "risk": twin.risk_health.value,
        "institutional": twin.institutional_health.value,
        "technical": twin.technical_health.value,
        "momentum": twin.momentum_health.value,
        "growth": twin.growth_health.value
    }


# ============================================================================
# Top Performers
# ============================================================================

@app.get("/twins/top/opportunities")
async def get_top_opportunities(limit: int = 10):
    """Get top opportunity scores"""

    sorted_twins = sorted(
        twin_store.values(),
        key=lambda t: t.opportunity_score.value,
        reverse=True
    )

    return [
        {
            "symbol": t.symbol,
            "name": t.name,
            "opportunity_score": t.opportunity_score.value,
            "confidence": t.opportunity_score.confidence,
            "current_price": t.current_price
        }
        for t in sorted_twins[:limit]
    ]


@app.get("/twins/top/risks")
async def get_top_risks(limit: int = 10):
    """Get highest risk scores"""

    sorted_twins = sorted(
        twin_store.values(),
        key=lambda t: t.risk_assessment.overall_risk,
        reverse=True
    )

    return [
        {
            "symbol": t.symbol,
            "name": t.name,
            "risk_score": t.risk_assessment.overall_risk,
            "financial_risk": t.risk_assessment.financial_risk,
            "market_risk": t.risk_assessment.market_risk
        }
        for t in sorted_twins[:limit]
    ]


@app.get("/twins/top/health")
async def get_healthiest_twins(limit: int = 10):
    """Get healthiest twins"""

    sorted_twins = sorted(
        twin_store.values(),
        key=lambda t: t.overall_health_score,
        reverse=True
    )

    return [
        {
            "symbol": t.symbol,
            "name": t.name,
            "health_score": t.overall_health_score,
            "current_price": t.current_price
        }
        for t in sorted_twins[:limit]
    ]


# ============================================================================
# Comparison
# ============================================================================

@app.get("/twins/compare")
async def compare_twins(symbols: str):
    """Compare multiple twins side by side"""

    symbol_list = symbols.split(",")
    twins = []

    for symbol in symbol_list:
        twin = twin_store.get(symbol.strip())
        if twin:
            twins.append(twin)

    if not twins:
        raise HTTPException(status_code=404, detail="No twins found")

    return {
        "twins": [
            {
                "symbol": t.symbol,
                "name": t.name,
                "current_price": t.current_price,
                "opportunity_score": t.opportunity_score.value,
                "risk_score": t.risk_assessment.overall_risk,
                "sentiment": t.sentiment.overall_sentiment,
                "prediction": t.prediction.model_dump()
            }
            for t in twins
        ]
    }


# ============================================================================
# Statistics
# ============================================================================

@app.get("/stats")
async def get_stats():
    """Get twin statistics"""

    twins = list(twin_store.values())

    if not twins:
        return {
            "total_twins": 0,
            "avg_opportunity_score": 0,
            "avg_risk_score": 0,
            "avg_sentiment": 0,
            "avg_health": 0
        }

    return {
        "total_twins": len(twins),
        "avg_opportunity_score": sum(t.opportunity_score.value for t in twins) / len(twins),
        "avg_risk_score": sum(t.risk_assessment.overall_risk for t in twins) / len(twins),
        "avg_sentiment": sum(t.sentiment.overall_sentiment for t in twins) / len(twins),
        "avg_health": sum(t.overall_health_score for t in twins) / len(twins),
        "bullish_count": sum(1 for t in twins if t.prediction.bullish_probability > 50),
        "bearish_count": sum(1 for t in twins if t.prediction.bearish_probability > 50),
        "neutral_count": sum(1 for t in twins if t.prediction.neutral_probability > 50)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002)
