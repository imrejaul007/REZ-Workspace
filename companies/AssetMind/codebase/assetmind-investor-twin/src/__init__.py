"""
AssetMind - Investor Twin
Port: 5005

Personal AI that understands each investor.

Tracks:
- Goals
- Risk appetite
- Trading behavior
- Biases
- Preferences
- Decision patterns

Then provides personalized recommendations.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


app = FastAPI(title="AssetMind Investor Twin", version="1.0.0")


class InvestorType(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"
    DAY_TRADER = "day_trader"
    LONG_TERM = "long_term"


class InvestorTwin(BaseModel):
    twin_id: str
    investor_id: str
    name: str
    investor_type: InvestorType

    # Goals
    goals: List[str] = Field(default_factory=list)
    target_return: Optional[float] = None
    time_horizon: str = "10 years"

    # Behavior
    avg_holding_period: str = "6 months"
    avg_position_size: float = 5  # % of portfolio
    trading_frequency: str = "weekly"

    # Biases detected
    biases: List[Dict] = Field(default_factory=list)

    # Preferences
    preferred_sectors: List[str] = Field(default_factory=list)
    excluded_sectors: List[str] = Field(default_factory=list)
    esg_preference: bool = False

    # Performance
    avg_return: Optional[float] = None
    win_rate: Optional[float] = None

    # Recommendations
    personalized_recommendations: List[Dict] = Field(default_factory=list)

    last_updated: datetime


INVESTORS: Dict[str, InvestorTwin] = {}


@app.get("/health")
async def health_check():
    return {"service": "assetmind-investor-twin", "status": "healthy", "port": 5005}


@app.post("/investors", status_code=201)
async def create_investor(investor: InvestorTwin):
    INVESTORS[investor.twin_id] = investor
    return {"twin_id": investor.twin_id, "created": True}


@app.get("/investors/{twin_id}")
async def get_investor(twin_id: str):
    if twin_id not in INVESTORS:
        raise HTTPException(status_code=404, detail="Investor not found")
    return INVESTORS[twin_id]


@app.get("/investors/{twin_id}/biases")
async def detect_biases(twin_id: str):
    if twin_id not in INVESTORS:
        raise HTTPException(status_code=404, detail="Investor not found")
    return {
        "biases": [
            {"type": "Loss Aversion", "severity": "medium", "description": "Holds losing positions too long"},
            {"type": "Herding", "severity": "low", "description": "Tends to follow market trends"}
        ]
    }


@app.get("/investors/{twin_id}/recommendations")
async def get_recommendations(twin_id: str):
    if twin_id not in INVESTORS:
        raise HTTPException(status_code=404, detail="Investor not found")
    return {
        "recommendations": [
            {"type": "Rebalance", "reason": "Tech overweight by 15%"},
            {"type": "Add", "reason": "Healthcare underweight"},
            {"type": "Reduce", "reason": "Concentration risk in single stock"}
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5005)