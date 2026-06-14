"""
AssetMind - Economic Twin
Port: 5041

The Economic Twin - Models the entire economy.

Tracks:
- GDP
- Inflation
- Interest rates
- Employment
- Liquidity
- Trade
- Currency

Then models: Fed → Economy → Sectors → Companies → Portfolio

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


app = FastAPI(title="AssetMind Economic Twin", version="1.0.0")


class EconomicRegime(str, Enum):
    EXPANSION = "expansion"
    PEAK = "peak"
    CONTRACTION = "contraction"
    TROUGH = "trough"


class EconomicTwin(BaseModel):
    twin_id: str = "economic-twin"

    # Current state
    gdp: Optional[float] = None  # YoY %
    gdp_growth: Optional[float] = None
    inflation: Optional[float] = None  # CPI YoY %
    unemployment: Optional[float] = None  # %

    # Central bank
    fed_funds_rate: Optional[float] = None
    balance_sheet: Optional[float] = None
    next_meeting: Optional[str] = None

    # Credit
    credit_growth: Optional[float] = None
    spreads: Dict[str, float] = Field(default_factory=dict)

    # Currency
    dollar_index: Optional[float] = None
    em_fx: Optional[float] = None

    # Sentiment
    consumer_confidence: Optional[float] = None
    business_confidence: Optional[float] = None

    # Regime
    regime: EconomicRegime = EconomicRegime.EXPANSION
    regime_confidence: float = 0.5

    # Forecasts
    forecasts: Dict[str, Any] = Field(default_factory=dict)

    last_updated: datetime


@app.get("/health")
async def health_check():
    return {"service": "assetmind-economic-twin", "status": "healthy", "port": 5041}


@app.get("/")
async def root():
    return {
        "service": "Economic Twin",
        "description": "Models Fed → Economy → Sectors → Companies → Portfolio"
    }


@app.get("/regime")
async def get_regime():
    return {
        "regime": "expansion",
        "confidence": 0.72,
        "indicators": {
            "yield_curve": "inverted",
            "leading_indicators": "declining",
            "employment": "strong"
        }
    }


@app.get("/sector-impact")
async def get_sector_impact():
    return {
        "sectors": [
            {"name": "Technology", "impact": "positive", "sensitivity": "high"},
            {"name": "Financials", "impact": "positive", "sensitivity": "medium"},
            {"name": "Utilities", "impact": "negative", "sensitivity": "high"},
            {"name": "Real Estate", "impact": "negative", "sensitivity": "high"}
        ]
    }


@app.get("/fed-transmission")
async def get_fed_transmission():
    """How Fed policy flows to economy"""
    return {
        "chain": [
            {"step": 1, "from": "Fed Rate", "to": "Bank Lending Rates", "lag": "1-3 months"},
            {"step": 2, "from": "Lending Rates", "to": "Investment", "lag": "3-6 months"},
            {"step": 3, "from": "Investment", "to": "GDP", "lag": "6-12 months"},
            {"step": 4, "from": "GDP", "to": "Employment", "lag": "12-18 months"}
        ]
    }


@app.post("/scenario")
async def economic_scenario(scenario: Dict):
    """What if rate reaches X?"""
    rate = scenario.get("fed_rate")
    return {
        "scenario": f"Fed rate at {rate}%",
        "impact": {
            "mortgage_rate": rate + 2,
            "10yr_treasury": rate + 1,
            "sp500_pe_impact": -(rate - 5) * 2,
            "gdp_impact": -(rate - 3) * 0.5
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5041)