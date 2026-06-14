"""
AssetMind - Decision Engine
Port: 5150
Converts data into actionable decisions
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime


app = FastAPI(title="AssetMind Decision Engine", version="1.0.0")


class DecisionRequest(BaseModel):
    symbol: str
    decision_type: str = "FULL"  # FULL, QUICK, OPPORTUNITY, RISK


class Decision(BaseModel):
    decision: str  # BUY, SELL, HOLD, WATCH, AVOID
    confidence: float
    reasoning: List[str]
    supporting_factors: List[str]
    contradicting_factors: List[str]
    time_horizon: str
    risk_level: str
    comparable_situations: List[Dict] = Field(default_factory=list)


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-decision-engine",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5150
    }


@app.post("/decision")
async def get_decision(request: DecisionRequest):
    """Get investment decision for a symbol"""
    symbol = request.symbol.upper()

    # Mock decision
    return Decision(
        decision="BUY",
        confidence=78,
        reasoning=[
            "Strong AI infrastructure demand continues",
            "Technical indicators bullish",
            "Institutional accumulation increasing"
        ],
        supporting_factors=[
            "Revenue growth 122% YoY",
            "Data center guidance raised",
            "Market leadership in AI chips"
        ],
        contradicting_factors=[
            "Valuation at 45x forward PE",
            "China export restrictions",
            "Competition from AMD"
        ],
        time_horizon="30 days",
        risk_level="MEDIUM",
        comparable_situations=[
            {"event": "Similar setup in 2023", "outcome": "+45% in 6 months"}
        ]
    )


@app.get("/decision/{symbol}")
async def get_symbol_decision(symbol: str):
    """Get quick decision for symbol"""
    return await get_decision(DecisionRequest(symbol=symbol, decision_type="QUICK"))


@app.get("/what-watch")
async def what_to_watch():
    """What should investors watch today?"""
    return {
        "watch_list": [
            {"symbol": "NVDA", "reason": "Earnings in 5 days"},
            {"symbol": "BTC", "reason": "Breaking resistance"},
            {"symbol": "AAPL", "reason": "AI event today"}
        ],
        "economic_events": [
            {"event": "US CPI", "impact": "HIGH", "time": "8:30 AM"}
        ]
    }


@app.get("/what-changed")
async def what_changed():
    """What changed overnight?"""
    return {
        "changes": [
            {"symbol": "NVDA", "change": "+2.5%", "reason": "AI optimism"},
            {"symbol": "BTC", "change": "+1.8%", "reason": "ETF inflows"}
        ]
    }


@app.get("/what-risky")
async def what_risky():
    """What is becoming risky?"""
    return {
        "risks": [
            {"symbol": "TSLA", "risk_level": "HIGH", "reason": "Overextended rally"}
        ]
    }


@app.get("/what-opportunities")
async def what_opportunities():
    """What opportunities emerged?"""
    return {
        "opportunities": [
            {"symbol": "SMCI", "opportunity_score": 85, "reason": "AI server demand"},
            {"symbol": "VRT", "opportunity_score": 82, "reason": "Data center power"}
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5150)
