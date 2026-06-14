"""
AssetMind - Risk Intelligence Service
Port: 5053
Analyzes and scores risk across multiple dimensions
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime


app = FastAPI(title="AssetMind Risk Intelligence", version="1.0.0")


class RiskAssessment(BaseModel):
    symbol: str
    financial_risk: float = Field(..., ge=0, le=100)
    market_risk: float = Field(..., ge=0, le=100)
    operational_risk: float = Field(..., ge=0, le=100)
    regulatory_risk: float = Field(..., ge=0, le=100)
    geopolitical_risk: float = Field(..., ge=0, le=100)
    liquidity_risk: float = Field(..., ge=0, le=100)
    overall_risk: float = Field(..., ge=0, le=100)
    risk_level: str  # LOW, MEDIUM, HIGH, VERY_HIGH
    risk_factors: List[str] = Field(default_factory=list)
    risk_trends: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


class ScenarioAnalysis(BaseModel):
    scenario: str
    probability: float
    impact: float
    affected_assets: List[str] = Field(default_factory=list)


MOCK_RISK = {
    "NVDA": RiskAssessment(
        symbol="NVDA",
        financial_risk=25,
        market_risk=45,
        operational_risk=35,
        regulatory_risk=55,
        geopolitical_risk=60,
        liquidity_risk=15,
        overall_risk=42,
        risk_level="MEDIUM",
        risk_factors=[
            "China export restrictions",
            "TSMC manufacturing dependency",
            "High valuation multiples"
        ],
        risk_trends=[
            "Regulatory risk increasing",
            "Competition from AMD intensifying"
        ],
        recommendations=[
            "Monitor China policy changes",
            "Consider AMD as hedge",
            "Set stop-loss at 20%"
        ]
    ),
    "AAPL": RiskAssessment(
        symbol="AAPL",
        financial_risk=20,
        market_risk=35,
        operational_risk=25,
        regulatory_risk=45,
        geopolitical_risk=40,
        liquidity_risk=10,
        overall_risk=30,
        risk_level="LOW",
        risk_factors=[
            "Diversified supply chain",
            "Strong balance sheet",
            "Brand moat"
        ],
        risk_trends=[
            "China sales stabilizing",
            "Services revenue growing"
        ],
        recommendations=[
            "Hold for long-term",
            "Accumulate on dips"
        ]
    ),
}


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-risk-intelligence",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5053
    }


@app.get("/assessment/{symbol}")
async def get_risk_assessment(symbol: str):
    """Get complete risk assessment"""
    return MOCK_RISK.get(symbol.upper(), RiskAssessment(
        symbol=symbol.upper(),
        financial_risk=50, market_risk=50, operational_risk=50,
        regulatory_risk=50, geopolitical_risk=50, liquidity_risk=50,
        overall_risk=50, risk_level="MEDIUM",
        risk_factors=["Data not available"],
        risk_trends=[],
        recommendations=[]
    ))


@app.get("/assessment/{symbol}/scores")
async def get_risk_scores(symbol: str):
    """Get just risk scores"""
    risk = MOCK_RISK.get(symbol.upper())

    if not risk:
        return {
            "symbol": symbol.upper(),
            "financial_risk": 50,
            "market_risk": 50,
            "operational_risk": 50,
            "regulatory_risk": 50,
            "geopolitical_risk": 50,
            "liquidity_risk": 50,
            "overall_risk": 50
        }

    return {
        "symbol": symbol.upper(),
        "financial_risk": risk.financial_risk,
        "market_risk": risk.market_risk,
        "operational_risk": risk.operational_risk,
        "regulatory_risk": risk.regulatory_risk,
        "geopolitical_risk": risk.geopolitical_risk,
        "liquidity_risk": risk.liquidity_risk,
        "overall_risk": risk.overall_risk
    }


@app.get("/scenarios")
async def get_risk_scenarios():
    """Get current risk scenarios"""
    return {
        "scenarios": [
            {
                "name": "Fed Rate Hike",
                "probability": 15,
                "impact": "HIGH",
                "affected_assets": ["QQQ", "SPY", "BTC"]
            },
            {
                "name": "Recession",
                "probability": 25,
                "impact": "VERY_HIGH",
                "affected_assets": ["ALL"]
            },
            {
                "name": "Tech Regulation",
                "probability": 35,
                "impact": "MEDIUM",
                "affected_assets": ["AAPL", "GOOGL", "META", "AMZN"]
            },
            {
                "name": "China Escalation",
                "probability": 20,
                "impact": "HIGH",
                "affected_assets": ["NVDA", "AMD", "AAPL"]
            }
        ]
    }


@app.get("/market-risk")
async def get_market_risk():
    """Get overall market risk level"""
    return {
        "overall_market_risk": 45,
        "risk_level": "MODERATE",
        "factors": {
            "volatility": "ELEVATED",
            "valuations": "STRETCHED",
            "geopolitics": "ELEVATED",
            "liquidity": "NORMAL"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5053)
