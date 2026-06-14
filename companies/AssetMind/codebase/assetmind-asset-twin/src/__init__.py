"""
AssetMind Asset Twin Engine
Port: 5002

Digital twin for companies/assets. Predicts company performance, analyzes financials,
tracks competitive position, and forecasts stock/valuation movements.
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timedelta
from enum import Enum
import json
import math


app = FastAPI(title="AssetMind Asset Twin", version="1.0.0")


class AssetType(str, Enum):
    STOCK = "stock"
    BOND = "bond"
    COMMODITY = "commodity"
    CRYPTOCURRENCY = "cryptocurrency"
    REIT = "reit"
    ETF = "etf"
    PRIVATE_COMPANY = "private_company"
    REAL_ESTATE = "real_estate"


class Sector(str, Enum):
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


class FinancialMetrics(BaseModel):
    revenue: float
    ebitda: float
    net_income: float
    total_debt: float
    cash: float
    equity: float
    shares_outstanding: float
    stock_price: Optional[float] = None


class AssetTwin(BaseModel):
    asset_id: str
    ticker: Optional[str] = None
    name: str
    asset_type: AssetType
    sector: Optional[Sector] = None
    financials: Optional[FinancialMetrics] = None
    valuation: Dict[str, float]
    metrics: Dict[str, float]
    sentiment_score: float
    risk_score: float
    twin_score: float  # Overall twin score
    created_at: str
    updated_at: str


class PricePrediction(BaseModel):
    asset_id: str
    prediction_horizon: str  # "1d", "1w", "1m", "3m", "1y"
    predicted_price: float
    confidence: float
    trend: str  # "bullish", "bearish", "neutral"
    factors: List[str]
    support: float
    resistance: float


class CompetitorAnalysis(BaseModel):
    asset_id: str
    competitors: List[Dict[str, Any]]
    market_share_breakdown: Dict[str, float]
    competitive_advantages: List[str]
    competitive_risks: List[str]


# In-memory storage
asset_twins: Dict[str, AssetTwin] = {}


def calculate_valuation_metrics(financials: FinancialMetrics) -> Dict[str, float]:
    """Calculate valuation metrics for an asset."""
    metrics = {}

    if financials.stock_price and financials.shares_outstanding:
        market_cap = financials.stock_price * financials.shares_outstanding
        metrics["market_cap"] = market_cap
        metrics["pe_ratio"] = financials.stock_price / (financials.net_income / financials.shares_outstanding) if financials.net_income > 0 else 0
        metrics["price_to_book"] = financials.stock_price / (financials.equity / financials.shares_outstanding) if financials.equity > 0 else 0

    if financials.ebitda > 0:
        metrics["enterprise_value"] = financials.equity + financials.total_debt - financials.cash
        metrics["ev_ebitda"] = metrics.get("enterprise_value", 0) / financials.ebitda

    if financials.revenue > 0:
        metrics["profit_margin"] = (financials.net_income / financials.revenue) * 100
        metrics["ebitda_margin"] = (financials.ebitda / financials.revenue) * 100

    if financials.equity > 0:
        metrics["debt_equity"] = financials.total_debt / financials.equity
        metrics["roe"] = (financials.net_income / financials.equity) * 100

    if financials.cash > 0 and financials.total_debt > 0:
        metrics["net_debt"] = financials.total_debt - financials.cash

    return metrics


def calculate_twin_score(metrics: Dict[str, float], financials: FinancialMetrics) -> float:
    """Calculate overall twin score (0-100)."""
    score = 50  # Base score

    # Valuation scoring
    pe = metrics.get("pe_ratio", 0)
    if 10 < pe < 25:
        score += 15  # Fairly valued
    elif pe <= 0:
        score -= 10  # No earnings
    elif pe > 40:
        score -= 15  # Expensive
    elif pe < 10:
        score += 10  # Cheap

    # Profitability scoring
    margin = metrics.get("profit_margin", 0)
    if margin > 20:
        score += 15
    elif margin > 10:
        score += 10
    elif margin > 0:
        score += 5
    else:
        score -= 15  # Unprofitable

    # Leverage scoring
    de = metrics.get("debt_equity", 0)
    if de < 0.5:
        score += 10
    elif de < 1.5:
        score += 5
    elif de > 2.5:
        score -= 15
    elif de > 1.5:
        score -= 5

    # ROE scoring
    roe = metrics.get("roe", 0)
    if roe > 20:
        score += 10
    elif roe > 10:
        score += 5
    elif roe < 0:
        score -= 10

    return max(0, min(100, score))


def predict_price(asset_twin: AssetTwin, horizon: str) -> PricePrediction:
    """Predict future price based on twin analysis."""

    if not asset_twin.financials or not asset_twin.financials.stock_price:
        raise ValueError("Stock price required for prediction")

    current_price = asset_twin.financials.stock_price
    trend_strength = asset_twin.sentiment_score / 100
    risk_factor = 1 - (asset_twin.risk_score / 100)

    # Horizon multipliers (simplified model)
    horizon_multipliers = {
        "1d": 0.002,
        "1w": 0.01,
        "1m": 0.05,
        "3m": 0.15,
        "1y": 0.30
    }

    drift = trend_strength * risk_factor
    volatility = 0.02 * (asset_twin.risk_score / 50)

    change = current_price * horizon_multipliers.get(horizon, 0.1) * drift
    predicted_price = current_price + change

    # Calculate support and resistance
    avg_volatility = volatility * current_price
    support = predicted_price - avg_volatility * 1.5
    resistance = predicted_price + avg_volatility * 1.5

    trend = "bullish" if drift > 0.2 else "bearish" if drift < -0.2 else "neutral"

    return PricePrediction(
        asset_id=asset_twin.asset_id,
        prediction_horizon=horizon,
        predicted_price=round(predicted_price, 2),
        confidence=round(risk_factor * 100, 1),
        trend=trend,
        factors=[
            f"Twin Score: {asset_twin.twin_score:.0f}",
            f"Sentiment: {asset_twin.sentiment_score:.0f}",
            f"Risk: {asset_twin.risk_score:.0f}",
            f"Sector: {asset_twin.sector.value if asset_twin.sector else 'N/A'}"
        ],
        support=round(support, 2),
        resistance=round(resistance, 2)
    )


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "asset-twin", "version": "1.0.0"}


@app.post("/assets")
async def create_asset_twin(
    asset_id: str,
    name: str,
    asset_type: AssetType,
    sector: Optional[Sector] = None,
    financials: Optional[FinancialMetrics] = None
):
    """Create or update an asset twin."""

    valuation = {}
    metrics = {}
    sentiment_score = 50.0
    risk_score = 30.0

    if financials:
        valuation = {
            "revenue": financials.revenue,
            "ebitda": financials.ebitda,
            "net_income": financials.net_income,
            "enterprise_value": financials.equity + financials.total_debt - financials.cash,
            "market_cap": financials.stock_price * financials.shares_outstanding if financials.stock_price else 0
        }
        metrics = calculate_valuation_metrics(financials)
        risk_score = 30.0 + (metrics.get("debt_equity", 0) * 5)
        sentiment_score = 50.0 + (metrics.get("profit_margin", 0) / 2)

    twin_score = calculate_twin_score(metrics, financials) if financials else 50.0

    twin = AssetTwin(
        asset_id=asset_id,
        name=name,
        asset_type=asset_type,
        sector=sector,
        financials=financials,
        valuation=valuation,
        metrics=metrics,
        sentiment_score=min(100, max(0, sentiment_score)),
        risk_score=min(100, max(0, risk_score)),
        twin_score=twin_score,
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    )

    asset_twins[asset_id] = twin
    return twin


@app.get("/assets/{asset_id}")
async def get_asset_twin(asset_id: str):
    """Get asset twin details."""
    if asset_id not in asset_twins:
        raise HTTPException(status_code=404, detail="Asset twin not found")
    return asset_twins[asset_id]


@app.get("/assets")
async def list_assets(
    asset_type: Optional[AssetType] = None,
    sector: Optional[Sector] = None,
    sort_by: str = "twin_score",
    limit: int = 50
):
    """List all asset twins with filters."""
    assets = list(asset_twins.values())

    if asset_type:
        assets = [a for a in assets if a.asset_type == asset_type]
    if sector:
        assets = [a for a in assets if a.sector == sector]

    # Sort
    if sort_by == "twin_score":
        assets.sort(key=lambda x: x.twin_score, reverse=True)
    elif sort_by == "sentiment":
        assets.sort(key=lambda x: x.sentiment_score, reverse=True)
    elif sort_by == "risk":
        assets.sort(key=lambda x: x.risk_score, reverse=True)

    return {"assets": assets[:limit], "total": len(assets)}


@app.post("/assets/{asset_id}/predict")
async def predict_asset_price(asset_id: str, horizon: str = "1m"):
    """Get price prediction for an asset."""
    if asset_id not in asset_twins:
        raise HTTPException(status_code=404, detail="Asset twin not found")

    twin = asset_twins[asset_id]
    return predict_price(twin, horizon)


@app.post("/assets/{asset_id}/predict/all")
async def predict_all_horizons(asset_id: str):
    """Get predictions for all time horizons."""
    if asset_id not in asset_twins:
        raise HTTPException(status_code=404, detail="Asset twin not found")

    twin = asset_twins[asset_id]
    horizons = ["1d", "1w", "1m", "3m", "1y"]

    predictions = {}
    for h in horizons:
        predictions[h] = predict_price(twin, h)

    return {
        "asset_id": asset_id,
        "name": twin.name,
        "current_price": twin.financials.stock_price if twin.financials else None,
        "predictions": predictions
    }


@app.get("/assets/{asset_id}/competitors")
async def analyze_competitors(asset_id: str):
    """Analyze competitors of an asset."""
    if asset_id not in asset_twins:
        raise HTTPException(status_code=404, detail="Asset twin not found")

    twin = asset_twins[asset_id]

    # Find assets in same sector
    competitors = []
    if twin.sector:
        for other_id, other in asset_twins.items():
            if other_id != asset_id and other.sector == twin.sector:
                competitors.append({
                    "asset_id": other_id,
                    "name": other.name,
                    "twin_score": other.twin_score,
                    "market_cap": other.metrics.get("market_cap", 0),
                    "ev_ebitda": other.metrics.get("ev_ebitda", 0)
                })

    # Sort by market cap
    competitors.sort(key=lambda x: x.get("market_cap", 0), reverse=True)

    return CompetitorAnalysis(
        asset_id=asset_id,
        competitors=competitors[:10],
        market_share_breakdown={
            twin.name: 25.0,  # Simplified
            "Competitor A": 20.0,
            "Competitor B": 15.0,
            "Others": 40.0
        },
        competitive_advantages=[
            "Strong brand recognition",
            "Proprietary technology",
            "Scale advantages",
            "Distribution network"
        ],
        competitive_risks=[
            "Disruptive new entrants",
            "Regulatory changes",
            "Technology obsolescence"
        ]
    )


@app.post("/assets/{asset_id}/update")
async def update_asset_twin(asset_id: str, financials: FinancialMetrics):
    """Update asset twin with new financial data."""
    if asset_id not in asset_twins:
        raise HTTPException(status_code=404, detail="Asset twin not found")

    twin = asset_twins[asset_id]
    twin.financials = financials
    twin.metrics = calculate_valuation_metrics(financials)
    twin.twin_score = calculate_twin_score(twin.metrics, financials)
    twin.updated_at = datetime.now().isoformat()

    return twin


@app.delete("/assets/{asset_id}")
async def delete_asset_twin(asset_id: str):
    """Delete an asset twin."""
    if asset_id in asset_twins:
        del asset_twins[asset_id]
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Asset twin not found")


@app.get("/screener")
async def screen_assets(
    min_twin_score: float = 70,
    max_risk: float = 50,
    min_sentiment: float = 50,
    sector: Optional[Sector] = None
):
    """Screen assets based on criteria."""
    results = []

    for asset in asset_twins.values():
        if sector and asset.sector != sector:
            continue
        if asset.twin_score >= min_twin_score and asset.risk_score <= max_risk and asset.sentiment_score >= min_sentiment:
            results.append({
                "asset_id": asset.asset_id,
                "name": asset.name,
                "twin_score": asset.twin_score,
                "sentiment": asset.sentiment_score,
                "risk": asset.risk_score,
                "sector": asset.sector.value if asset.sector else None
            })

    return {"matches": results, "count": len(results)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5002)
