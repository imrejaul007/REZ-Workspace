"""
AssetMind Twin Engine Service - Port 5002
Digital Twin orchestration: Asset, Portfolio, Investor, Market, Economic twins.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

app = FastAPI(title="AssetMind Twin Engine", version="1.0.0")
DEFAULT_PORT = 5002


class TwinType(str, Enum):
    ASSET = "asset"
    PORTFOLIO = "portfolio"
    INVESTOR = "investor"
    MARKET = "market"
    ECONOMIC = "economic"


class TwinStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TRAINING = "training"


class TwinCreate(BaseModel):
    twin_type: TwinType
    entity_id: str
    name: str
    description: Optional[str] = None
    initial_data: Dict[str, Any] = Field(default_factory=dict)


class Twin(BaseModel):
    twin_id: str
    twin_type: TwinType
    entity_id: str
    name: str
    status: TwinStatus = TwinStatus.ACTIVE
    created_at: datetime
    updated_at: datetime
    version: int = 1
    attributes: Dict[str, Any] = Field(default_factory=dict)
    metrics: Dict[str, float] = Field(default_factory=dict)


class TwinSimulate(BaseModel):
    twin_id: str
    scenario: str
    inputs: Dict[str, Any]
    time_horizon: int = 30


class AssetTwinData(BaseModel):
    symbol: str
    company_name: str
    sector: str
    market_cap: float
    current_price: float
    fair_value: float
    revenue: float
    earnings: float


class PortfolioTwinData(BaseModel):
    portfolio_id: str
    name: str
    positions: List[Dict[str, Any]]
    total_value: float
    cash_balance: float
    risk_tolerance: str


class InvestorTwinData(BaseModel):
    investor_id: str
    name: str
    age: int
    risk_tolerance: str
    investment_experience: str
    investment_goals: List[str]


class MarketTwinData(BaseModel):
    market_id: str
    name: str
    index_level: float
    volatility: float
    sentiment: float


# In-memory store
twins_store: Dict[str, Twin] = {}
predictions_store: Dict[str, List] = {}


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
        "service": "assetmind-twin-engine",
        "status": "healthy",
        "version": "1.0.0",
        "port": DEFAULT_PORT,
        "uptime_seconds": get_uptime(),
        "capabilities": {
            "asset_twins": "active",
            "portfolio_twins": "active",
            "investor_twins": "active",
            "market_twins": "active",
            "simulation": "active"
        }
    }


@app.get("/status")
async def get_status():
    counts = {}
    for t in twins_store.values():
        counts[t.twin_type.value] = counts.get(t.twin_type.value, 0) + 1
    return {
        "service": "assetmind-twin-engine",
        "total_twins": len(twins_store),
        "twin_counts": counts
    }


# ============================================================================
# Twin CRUD
# ============================================================================

@app.post("/twin/create", response_model=Twin)
async def create_twin(request: TwinCreate):
    twin_id = f"twin-{request.twin_type.value}-{request.entity_id}-{uuid.uuid4().hex[:8]}"
    twin = Twin(
        twin_id=twin_id,
        twin_type=request.twin_type,
        entity_id=request.entity_id,
        name=request.name,
        status=TwinStatus.ACTIVE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        attributes=request.initial_data
    )
    twins_store[twin_id] = twin
    return twin


@app.get("/twin/{twin_id}", response_model=Twin)
async def get_twin(twin_id: str):
    if twin_id not in twins_store:
        raise HTTPException(status_code=404, detail="Twin not found")
    return twins_store[twin_id]


@app.get("/twins")
async def list_twins(twin_type: Optional[TwinType] = None, limit: int = 100):
    twins = list(twins_store.values())
    if twin_type:
        twins = [t for t in twins if t.twin_type == twin_type]
    twins.sort(key=lambda x: x.updated_at, reverse=True)
    return {"twins": twins[:limit], "total": len(twins)}


@app.patch("/twin/{twin_id}", response_model=Twin)
async def update_twin(twin_id: str, attributes: Optional[Dict] = None, metrics: Optional[Dict] = None):
    if twin_id not in twins_store:
        raise HTTPException(status_code=404, detail="Twin not found")
    twin = twins_store[twin_id]
    if attributes:
        twin.attributes.update(attributes)
    if metrics:
        twin.metrics.update(metrics)
    twin.updated_at = datetime.utcnow()
    twin.version += 1
    return twin


@app.delete("/twin/{twin_id}")
async def delete_twin(twin_id: str):
    if twin_id not in twins_store:
        raise HTTPException(status_code=404, detail="Twin not found")
    del twins_store[twin_id]
    return {"deleted": True, "twin_id": twin_id}


# ============================================================================
# Twin Simulation
# ============================================================================

@app.post("/twin/simulate")
async def simulate_twin(request: TwinSimulate):
    if request.twin_id not in twins_store:
        raise HTTPException(status_code=404, detail="Twin not found")
    twin = twins_store[request.twin_id]

    predictions = []
    base_value = twin.attributes.get("value", 100)
    for day in range(1, request.time_horizon + 1):
        predictions.append({
            "day": day,
            "value": round(base_value * (1 + 0.001 * day), 2),
            "confidence": round(max(0.5, 1 - (day / request.time_horizon) * 0.3), 2)
        })

    result = {
        "twin_id": request.twin_id,
        "scenario": request.scenario,
        "predictions": predictions,
        "confidence": 0.78,
        "simulated_at": datetime.utcnow().isoformat()
    }

    if request.twin_id not in predictions_store:
        predictions_store[request.twin_id] = []
    predictions_store[request.twin_id].append(result)

    return result


@app.get("/twin/{twin_id}/predictions")
async def get_predictions(twin_id: str, limit: int = 10):
    if twin_id not in twins_store:
        raise HTTPException(status_code=404, detail="Twin not found")
    preds = predictions_store.get(twin_id, [])[-limit:]
    return {"twin_id": twin_id, "predictions": preds, "total": len(preds)}


# ============================================================================
# Twin Sync & Learn
# ============================================================================

@app.post("/twin/{twin_id}/sync")
async def sync_twin(twin_id: str):
    if twin_id not in twins_store:
        raise HTTPException(status_code=404, detail="Twin not found")
    twins_store[twin_id].updated_at = datetime.utcnow()
    return {"twin_id": twin_id, "synced": True, "synced_at": datetime.utcnow()}


@app.post("/twin/{twin_id}/learn")
async def learn_from_twin(twin_id: str, feedback: Dict):
    if twin_id not in twins_store:
        raise HTTPException(status_code=404, detail="Twin not found")
    twin = twins_store[twin_id]
    twin.status = TwinStatus.TRAINING
    twin.attributes.update(feedback.get("updates", {}))
    twin.updated_at = datetime.utcnow()
    twin.status = TwinStatus.ACTIVE
    twin.version += 1
    return {"twin_id": twin_id, "learned": True, "new_version": twin.version}


# ============================================================================
# Specialized Twin Creation
# ============================================================================

@app.post("/twin/asset", response_model=Twin)
async def create_asset_twin(data: AssetTwinData):
    twin_id = f"twin-asset-{data.symbol}-{uuid.uuid4().hex[:8]}"
    twin = Twin(
        twin_id=twin_id,
        twin_type=TwinType.ASSET,
        entity_id=data.symbol,
        name=data.company_name,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        attributes={
            "symbol": data.symbol,
            "company_name": data.company_name,
            "sector": data.sector,
            "market_cap": data.market_cap,
            "current_price": data.current_price,
            "fair_value": data.fair_value,
            "revenue": data.revenue,
            "earnings": data.earnings
        },
        metrics={
            "upside_potential": round((data.fair_value - data.current_price) / data.current_price * 100, 2)
        }
    )
    twins_store[twin_id] = twin
    return twin


@app.post("/twin/portfolio", response_model=Twin)
async def create_portfolio_twin(data: PortfolioTwinData):
    twin_id = f"twin-portfolio-{data.portfolio_id}-{uuid.uuid4().hex[:8]}"
    twin = Twin(
        twin_id=twin_id,
        twin_type=TwinType.PORTFOLIO,
        entity_id=data.portfolio_id,
        name=data.name,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        attributes={
            "positions": data.positions,
            "total_value": data.total_value,
            "cash_balance": data.cash_balance,
            "risk_tolerance": data.risk_tolerance
        },
        metrics={
            "diversification": round(len(data.positions) / 20 * 100, 2),
            "cash_ratio": round(data.cash_balance / data.total_value * 100, 2)
        }
    )
    twins_store[twin_id] = twin
    return twin


@app.post("/twin/investor", response_model=Twin)
async def create_investor_twin(data: InvestorTwinData):
    twin_id = f"twin-investor-{data.investor_id}-{uuid.uuid4().hex[:8]}"
    risk_scores = {"low": 30, "medium": 50, "high": 70, "very_high": 90}
    twin = Twin(
        twin_id=twin_id,
        twin_type=TwinType.INVESTOR,
        entity_id=data.investor_id,
        name=data.name,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        attributes={
            "age": data.age,
            "risk_tolerance": data.risk_tolerance,
            "investment_experience": data.investment_experience,
            "investment_goals": data.investment_goals
        },
        metrics={
            "risk_score": risk_scores.get(data.risk_tolerance, 50)
        }
    )
    twins_store[twin_id] = twin
    return twin


@app.post("/twin/market", response_model=Twin)
async def create_market_twin(data: MarketTwinData):
    twin_id = f"twin-market-{data.market_id}-{uuid.uuid4().hex[:8]}"
    twin = Twin(
        twin_id=twin_id,
        twin_type=TwinType.MARKET,
        entity_id=data.market_id,
        name=data.name,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        attributes={
            "index_level": data.index_level,
            "volatility": data.volatility,
            "sentiment": data.sentiment
        },
        metrics={
            "market_health": round((data.sentiment + 1) / 2 * 100, 2),
            "risk_level": round(data.volatility * 100, 2)
        }
    )
    twins_store[twin_id] = twin
    return twin


# ============================================================================
# Twin Types
# ============================================================================

@app.get("/twin-types")
async def get_twin_types():
    return {
        "twin_types": [
            {"type": "asset", "description": "Individual asset digital twin"},
            {"type": "portfolio", "description": "Portfolio composition twin"},
            {"type": "investor", "description": "Investor profile twin"},
            {"type": "market", "description": "Market conditions twin"},
            {"type": "economic", "description": "Economic indicator twin"}
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=DEFAULT_PORT)
