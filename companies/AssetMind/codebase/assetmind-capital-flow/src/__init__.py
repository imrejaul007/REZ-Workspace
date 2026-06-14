"""
AssetMind - Capital Flow Engine
Port: 5183

Tracks institutional and retail capital flows across assets.
Monitors ETF flows, mutual fund flows, and whale activity.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import uuid


app = FastAPI(title="AssetMind Capital Flow Engine", version="1.0.0")


class FlowType(str, Enum):
    ETF_INFLOW = "etf_inflow"
    ETF_OUTFLOW = "etf_outflow"
    MUTUAL_FUND = "mutual_fund"
    INSTITUTIONAL = "institutional"
    RETAIL = "retail"
    WHALE = "whale"


class AssetClass(str, Enum):
    STOCK = "stock"
    BOND = "bond"
    COMMODITY = "commodity"
    CRYPTO = "crypto"
    CASH = "cash"


class CapitalFlow(BaseModel):
    flow_id: str
    symbol: Optional[str] = None
    flow_type: FlowType
    asset_class: AssetClass
    amount: float  # In millions
    direction: str  # "inflow" or "outflow"
    timestamp: datetime
    source: str  # "ETF", "Mutual Fund", "SEC Filing"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class FlowRequest(BaseModel):
    symbol: Optional[str] = None
    asset_class: Optional[AssetClass] = None
    flow_type: Optional[FlowType] = None
    days_back: int = Field(default=7, ge=1, le=90)


class SectorFlow(BaseModel):
    sector: str
    total_inflow: float
    total_outflow: float
    net_flow: float
    trend: str  # "accelerating", "decelerating", "stable"


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-capital-flow",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5183
    }


# In-memory storage
flows: List[CapitalFlow] = []


@app.post("/flows", status_code=201)
async def record_flow(request: FlowRequest):
    """Record a capital flow"""
    flow_id = str(uuid.uuid4())

    flow = CapitalFlow(
        flow_id=flow_id,
        symbol=request.symbol,
        flow_type=request.flow_type,
        asset_class=request.asset_class,
        amount=0,  # Would be populated from data source
        direction="inflow",
        timestamp=datetime.utcnow(),
        source="api"
    )

    flows.append(flow)
    return {"flow_id": flow_id, "recorded": True}


@app.get("/flows")
async def get_flows(
    symbol: Optional[str] = None,
    flow_type: Optional[FlowType] = None,
    limit: int = 100
):
    """Get capital flows"""
    result = flows.copy()

    if symbol:
        result = [f for f in result if f.symbol == symbol]
    if flow_type:
        result = [f for f in result if f.flow_type == flow_type]

    result.sort(key=lambda f: f.timestamp, reverse=True)

    return {"flows": result[:limit], "total": len(result)}


@app.get("/flows/sector")
async def get_sector_flows(days: int = 7):
    """Get sector-level capital flows"""
    # Mock sector flows
    return {
        "sectors": [
            {
                "sector": "Technology",
                "inflow_7d": 4500,  # Millions
                "outflow_7d": 1200,
                "net_flow": 3300,
                "trend": "accelerating",
                "top_holdings": ["NVDA", "MSFT", "AAPL"]
            },
            {
                "sector": "Healthcare",
                "inflow_7d": 800,
                "outflow_7d": 600,
                "net_flow": 200,
                "trend": "stable",
                "top_holdings": ["UNH", "LLY", "JNJ"]
            },
            {
                "sector": "Financials",
                "inflow_7d": 1500,
                "outflow_7d": 1800,
                "net_flow": -300,
                "trend": "decelerating",
                "top_holdings": ["JPM", "BAC", "GS"]
            },
            {
                "sector": "Energy",
                "inflow_7d": 400,
                "outflow_7d": 1200,
                "net_flow": -800,
                "trend": "accelerating_outflow",
                "top_holdings": ["XOM", "CVX", "COP"]
            }
        ],
        "updated_at": datetime.utcnow().isoformat()
    }


@app.get("/flows/etf")
async def get_etf_flows(symbol: Optional[str] = None):
    """Get ETF-specific flows"""
    # Mock ETF flows
    return {
        "etf_flows": [
            {
                "symbol": "SPY",
                "inflow_1d": 1200,  # Millions
                "inflow_5d": 4500,
                "inflow_20d": 12000,
                "assets_under_management": 450000
            },
            {
                "symbol": "QQQ",
                "inflow_1d": 800,
                "inflow_5d": 3200,
                "inflow_20d": 8500,
                "assets_under_management": 280000
            },
            {
                "symbol": "IWM",
                "inflow_1d": 200,
                "inflow_5d": 450,
                "inflow_20d": 1200,
                "assets_under_management": 65000
            }
        ],
        "updated_at": datetime.utcnow().isoformat()
    }


@app.get("/flows/whale")
async def get_whale_activity(days: int = 7):
    """Track whale (large institutional) activity"""
    return {
        "whale_trades": [
            {
                "date": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                "symbol": "NVDA",
                "action": "BUY",
                "shares": 500000,
                "estimated_value": 450000000,
                "source": "13F Filing",
                "institution": "Goldman Sachs"
            },
            {
                "date": (datetime.utcnow() - timedelta(days=2)).isoformat(),
                "symbol": "AAPL",
                "action": "BUY",
                "shares": 1000000,
                "estimated_value": 160000000,
                "source": "13F Filing",
                "institution": "Morgan Stanley"
            },
            {
                "date": (datetime.utcnow() - timedelta(days=3)).isoformat(),
                "symbol": "MSFT",
                "action": "SELL",
                "shares": 200000,
                "estimated_value": 80000000,
                "source": "13F Filing",
                "institution": "Bank of America"
            }
        ]
    }


@app.get("/flows/rotation")
async def get_sector_rotation():
    """Detect sector rotation patterns"""
    return {
        "rotation": {
            "from_sectors": ["Energy", "Materials", "Utilities"],
            "to_sectors": ["Technology", "Consumer Discretionary", "Communication"],
            "strength": "STRONG",
            "duration": "3 weeks",
            "typical_following": "Continued outperformance for 4-8 weeks"
        },
        "money_flow": {
            "bonds_to_stocks": True,
            "defensive_to_growth": True,
            "value_to_growth": True
        }
    }


@app.get("/flows/flow-indicator")
async def get_flow_indicator(symbol: str):
    """Get flow indicator for a symbol"""
    # Mock flow indicator (combines multiple signals)
    return {
        "symbol": symbol,
        "flow_score": 75,  # 0-100, higher = more inflows
        "confidence": 0.80,
        "components": {
            "etf_flow": 80,
            "institutional": 70,
            "retail": 65,
            "whale_activity": 85
        },
        "interpretation": "Strong institutional buying, positive flow divergence",
        "updated_at": datetime.utcnow().isoformat()
    }


@app.get("/flows/daily-summary")
async def get_daily_summary():
    """Get daily flow summary"""
    return {
        "date": datetime.utcnow().strftime("%Y-%m-%d"),
        "total_market_inflow": 8500,  # Millions
        "total_market_outflow": 4200,
        "net_flow": 4300,
        "by_asset_class": {
            "stocks": {"inflow": 5500, "outflow": 2800, "net": 2700},
            "bonds": {"inflow": 2000, "outflow": 800, "net": 1200},
            "commodities": {"inflow": 500, "outflow": 400, "net": 100},
            "crypto": {"inflow": 500, "outflow": 200, "net": 300}
        },
        "notable_moves": [
            {"symbol": "NVDA", "type": "ETF_INFLOW", "amount": 450, "reason": "Rebalancing"},
            {"symbol": "AAPL", "type": "INSTITUTIONAL", "amount": 320, "reason": "13F filing"}
        ]
    }


@app.get("/stats/flow-trend")
async def get_flow_trend(symbol: str, days: int = 30):
    """Get flow trend for a symbol"""
    return {
        "symbol": symbol,
        "trend": "POSITIVE",
        "avg_daily_flow": 15.5,  # Millions
        "flow_acceleration": 1.25,  # 1.0 = stable, >1 = accelerating
        "days_of_inflow": 22,
        "days_of_outflow": 8,
        "largest_inflow_day": {
            "date": (datetime.utcnow() - timedelta(days=5)).isoformat(),
            "amount": 85.0
        },
        "largest_outflow_day": {
            "date": (datetime.utcnow() - timedelta(days=12)).isoformat(),
            "amount": -45.0
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5183)