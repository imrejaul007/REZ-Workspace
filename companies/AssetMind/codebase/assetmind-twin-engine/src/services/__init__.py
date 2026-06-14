"""
AssetMind - Asset Twin Service
Port: 5002
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from models.twin_models import (
    AssetTwin, Score, ProbabilityPrediction, RiskAssessment,
    SentimentData, FinancialRatios, Event, Relationship, HealthScores
)

app = FastAPI(title="AssetMind Asset Twin Service", version="1.0.0")

# In-memory storage
twin_store: Dict[str, AssetTwin] = {}


class CreateTwinRequest(BaseModel):
    asset_id: str
    symbol: str
    name: str
    current_price: float = 0
    market_cap: Optional[float] = None


class UpdateTwinRequest(BaseModel):
    current_price: Optional[float] = None
    price_change_24h: Optional[float] = None
    volume_24h: Optional[float] = None
    financial_score: Optional[Score] = None
    sentiment: Optional[SentimentData] = None
    risk_assessment: Optional[RiskAssessment] = None
    prediction: Optional[ProbabilityPrediction] = None


def create_default_twin(symbol: str, name: str, asset_id: str, current_price: float = 0) -> AssetTwin:
    """Create a new Asset Twin with default values"""
    return AssetTwin(
        asset_id=asset_id,
        symbol=symbol,
        name=name,
        current_price=current_price,
        price_change_24h=0,
        price_change_percent_24h=0,
        volume_24h=0,
        market_cap=None,
        market_dominance=None,
        income_statement={},
        balance_sheet={},
        cash_flow={},
        financial_ratios=FinancialRatios(),
        financial_score=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[]),
        recent_news=[],
        news_sentiment=50,
        key_narratives=[],
        sentiment=SentimentData(
            social_sentiment=50, news_sentiment=50,
            institutional_sentiment=50, analyst_sentiment=50,
            overall_sentiment=50, sentiment_trend="STABLE"
        ),
        sentiment_score=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[]),
        upcoming_events=[],
        past_events=[],
        suppliers=[],
        customers=[],
        competitors=[],
        partners=[],
        risk_assessment=RiskAssessment(
            financial_risk=50, market_risk=50, operational_risk=50,
            regulatory_risk=50, geopolitical_risk=50, liquidity_risk=50,
            overall_risk=50
        ),
        risk_score=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[]),
        prediction=ProbabilityPrediction(
            bullish_probability=33.33, neutral_probability=33.33, bearish_probability=33.33,
            confidence=50, time_horizon="30D", reasoning_chain=[],
            supporting_factors=[], contradicting_factors=[]
        ),
        market_health=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[]),
        financial_health=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[]),
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
        momentum_score=Score(value=50, confidence=50, trend="STABLE", reasoning=[], sources=[]),
        last_updated=datetime.utcnow(),
        twin_created_at=datetime.utcnow()
    )


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-asset-twin",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5002,
        "total_twins": len(twin_store)
    }


@app.post("/twins", status_code=201)
async def create_twin(request: CreateTwinRequest):
    if request.symbol in twin_store:
        raise HTTPException(status_code=409, detail="Twin already exists")

    twin = create_default_twin(
        symbol=request.symbol,
        name=request.name,
        asset_id=request.asset_id,
        current_price=request.current_price
    )

    if request.market_cap:
        twin.market_cap = request.market_cap

    twin_store[request.symbol] = twin
    return {"message": "Twin created", "symbol": twin.symbol, "asset_id": twin.asset_id}


@app.get("/twins/{symbol}")
async def get_twin(symbol: str):
    twin = twin_store.get(symbol)
    if not twin:
        raise HTTPException(status_code=404, detail="Twin not found")
    return twin


@app.get("/twins")
async def list_twins(limit: int = 100, offset: int = 0):
    twins = list(twin_store.values())
    return twins[offset:offset + limit]


@app.patch("/twins/{symbol}")
async def update_twin(symbol: str, request: UpdateTwinRequest):
    twin = twin_store.get(symbol)
    if not twin:
        raise HTTPException(status_code=404, detail="Twin not found")

    if request.current_price is not None:
        twin.current_price = request.current_price
    if request.price_change_24h is not None:
        twin.price_change_24h = request.price_change_24h
    if request.volume_24h is not None:
        twin.volume_24h = request.volume_24h
    if request.financial_score is not None:
        twin.financial_score = request.financial_score
    if request.sentiment is not None:
        twin.sentiment = request.sentiment
    if request.risk_assessment is not None:
        twin.risk_assessment = request.risk_assessment
    if request.prediction is not None:
        twin.prediction = request.prediction

    twin.last_updated = datetime.utcnow()
    return {"message": "Twin updated", "symbol": symbol}


@app.get("/twins/{symbol}/scores")
async def get_twin_scores(symbol: str):
    twin = twin_store.get(symbol)
    if not twin:
        raise HTTPException(status_code=404, detail="Twin not found")

    return {
        "symbol": symbol,
        "overall_health": twin.overall_health_score,
        "opportunity": twin.opportunity_score.value,
        "risk": twin.risk_assessment.overall_risk,
        "sentiment": twin.sentiment.overall_sentiment,
        "conviction": twin.conviction_score.value,
        "institutional": twin.institutional_score.value,
        "financial": twin.financial_score.value,
        "technical": twin.technical_health.value,
        "momentum": twin.momentum_score.value,
    }


@app.get("/twins/{symbol}/prediction")
async def get_twin_prediction(symbol: str):
    twin = twin_store.get(symbol)
    if not twin:
        raise HTTPException(status_code=404, detail="Twin not found")
    return twin.prediction


@app.get("/twins/{symbol}/health")
async def get_twin_health(symbol: str):
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
        "momentum": twin.momentum_score.value,
        "growth": twin.growth_health.value,
    }


@app.get("/twins/top/opportunities")
async def get_top_opportunities(limit: int = 10):
    sorted_twins = sorted(twin_store.values(), key=lambda t: t.opportunity_score.value, reverse=True)
    return [
        {"symbol": t.symbol, "name": t.name, "score": t.opportunity_score.value, "price": t.current_price}
        for t in sorted_twins[:limit]
    ]


@app.get("/twins/top/risks")
async def get_top_risks(limit: int = 10):
    sorted_twins = sorted(twin_store.values(), key=lambda t: t.risk_assessment.overall_risk, reverse=True)
    return [
        {"symbol": t.symbol, "name": t.name, "risk": t.risk_assessment.overall_risk}
        for t in sorted_twins[:limit]
    ]


@app.get("/twins/top/health")
async def get_healthiest_twins(limit: int = 10):
    sorted_twins = sorted(twin_store.values(), key=lambda t: t.overall_health_score, reverse=True)
    return [
        {"symbol": t.symbol, "name": t.name, "health": t.overall_health_score}
        for t in sorted_twins[:limit]
    ]


@app.get("/twins/compare")
async def compare_twins(symbols: str):
    symbol_list = [s.strip() for s in symbols.split(",")]
    twins = [twin_store.get(s) for s in symbol_list if s in twin_store]

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


@app.get("/stats")
async def get_stats():
    twins = list(twin_store.values())
    if not twins:
        return {"total_twins": 0}

    return {
        "total_twins": len(twins),
        "avg_opportunity_score": sum(t.opportunity_score.value for t in twins) / len(twins),
        "avg_risk_score": sum(t.risk_assessment.overall_risk for t in twins) / len(twins),
        "avg_sentiment": sum(t.sentiment.overall_sentiment for t in twins) / len(twins),
        "avg_health": sum(t.overall_health_score for t in twins) / len(twins),
        "bullish_count": sum(1 for t in twins if t.prediction.bullish_probability > 50),
        "bearish_count": sum(1 for t in twins if t.prediction.bearish_probability > 50),
        "neutral_count": sum(1 for t in twins if t.prediction.neutral_probability > 50),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002)
