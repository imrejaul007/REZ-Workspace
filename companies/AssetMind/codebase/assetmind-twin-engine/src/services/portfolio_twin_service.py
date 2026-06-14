"""
AssetMind - Portfolio Twin Service
Port: 5004
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


app = FastAPI(title="AssetMind Portfolio Twin Service", version="1.0.0")

# In-memory storage
portfolios: Dict[str, Dict] = {}


class Holding(BaseModel):
    symbol: str
    name: str
    quantity: float
    avg_entry_price: float
    current_price: float
    current_value: float
    unrealized_pnl: float
    unrealized_pnl_pct: float
    weight: float


class PortfolioCreate(BaseModel):
    user_id: str
    name: str = "Main Portfolio"


class HoldingAdd(BaseModel):
    symbol: str
    name: str
    quantity: float
    avg_entry_price: float
    current_price: float


class PortfolioTwin(BaseModel):
    """Portfolio Digital Twin"""
    portfolio_id: str
    user_id: str
    name: str
    holdings: List[Holding] = Field(default_factory=list)
    cash_balance: float = 0

    # Analytics
    total_value: float = 0
    total_cost: float = 0
    total_return: float = 0
    total_return_pct: float = 0
    day_pnl: float = 0
    day_pnl_pct: float = 0

    # Risk Analytics
    portfolio_beta: float = 1.0
    portfolio_volatility: float = 20.0
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    value_at_risk_95: Optional[float] = None

    # Exposure
    sector_exposure: Dict[str, float] = Field(default_factory=dict)
    asset_class_exposure: Dict[str, float] = Field(default_factory=dict)
    geo_exposure: Dict[str, float] = Field(default_factory=dict)
    theme_exposure: Dict[str, float] = Field(default_factory=dict)

    # Scores
    diversification_score: float = Field(50, ge=0, le=100)
    risk_score: float = Field(50, ge=0, le=100)
    health_score: float = Field(50, ge=0, le=100)

    last_updated: datetime = Field(default_factory=datetime.utcnow)


def calculate_portfolio_metrics(portfolio: PortfolioTwin):
    """Calculate portfolio analytics"""
    total_value = sum(h.current_value for h in portfolio.holdings) + portfolio.cash_balance
    total_cost = sum(h.avg_entry_price * h.quantity for h in portfolio.holdings)

    portfolio.total_value = total_value
    portfolio.total_cost = total_cost
    portfolio.total_return = total_value - total_cost
    portfolio.total_return_pct = ((total_value / total_cost) - 1) * 100 if total_cost > 0 else 0

    # Calculate weights
    for h in portfolio.holdings:
        h.weight = (h.current_value / total_value * 100) if total_value > 0 else 0
        h.unrealized_pnl = (h.current_price - h.avg_entry_price) * h.quantity
        h.unrealized_pnl_pct = ((h.current_price / h.avg_entry_price) - 1) * 100 if h.avg_entry_price > 0 else 0

    # Recalculate total with updated values
    portfolio.total_value = sum(h.current_value for h in portfolio.holdings) + portfolio.cash_balance

    return portfolio


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-portfolio-twin",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5004,
        "total_portfolios": len(portfolios)
    }


@app.post("/portfolios", status_code=201)
async def create_portfolio(request: PortfolioCreate):
    portfolio_id = str(uuid.uuid4())
    portfolio = PortfolioTwin(
        portfolio_id=portfolio_id,
        user_id=request.user_id,
        name=request.name
    )
    portfolios[portfolio_id] = portfolio
    return {"portfolio_id": portfolio_id, "message": "Portfolio created"}


@app.get("/portfolios/{portfolio_id}")
async def get_portfolio(portfolio_id: str):
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolios[portfolio_id]


@app.get("/portfolios/user/{user_id}")
async def get_user_portfolios(user_id: str):
    return [p for p in portfolios.values() if p.user_id == user_id]


@app.post("/portfolios/{portfolio_id}/holdings")
async def add_holding(portfolio_id: str, holding: HoldingAdd):
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    portfolio = portfolios[portfolio_id]

    # Check if already holding
    for h in portfolio.holdings:
        if h.symbol == holding.symbol:
            # Average in
            total_qty = h.quantity + holding.quantity
            new_avg = (h.avg_entry_price * h.quantity + holding.avg_entry_price * holding.quantity) / total_qty
            h.quantity = total_qty
            h.avg_entry_price = new_avg
            h.current_price = holding.current_price
            h.current_value = h.current_price * h.quantity
            break
    else:
        portfolio.holdings.append(Holding(
            symbol=holding.symbol,
            name=holding.name,
            quantity=holding.quantity,
            avg_entry_price=holding.avg_entry_price,
            current_price=holding.current_price,
            current_value=holding.current_price * holding.quantity,
            unrealized_pnl=0,
            unrealized_pnl_pct=0,
            weight=0
        ))

    calculate_portfolio_metrics(portfolio)
    return {"message": "Holding added", "holdings_count": len(portfolio.holdings)}


@app.delete("/portfolios/{portfolio_id}/holdings/{symbol}")
async def remove_holding(portfolio_id: str, symbol: str):
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    portfolio = portfolios[portfolio_id]
    portfolio.holdings = [h for h in portfolio.holdings if h.symbol != symbol]
    calculate_portfolio_metrics(portfolio)

    return {"message": f"Holding {symbol} removed"}


@app.patch("/portfolios/{portfolio_id}/prices")
async def update_prices(portfolio_id: str, prices: Dict[str, float]):
    """Update current prices for all holdings"""
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    portfolio = portfolios[portfolio_id]

    for holding in portfolio.holdings:
        if holding.symbol in prices:
            holding.current_price = prices[holding.symbol]
            holding.current_value = holding.current_price * holding.quantity

    calculate_portfolio_metrics(portfolio)
    return {"message": "Prices updated"}


@app.get("/portfolios/{portfolio_id}/analytics")
async def get_portfolio_analytics(portfolio_id: str):
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    portfolio = portfolios[portfolio_id]

    return {
        "total_value": portfolio.total_value,
        "total_cost": portfolio.total_cost,
        "total_return": portfolio.total_return,
        "total_return_pct": portfolio.total_return_pct,
        "day_pnl": portfolio.day_pnl,
        "day_pnl_pct": portfolio.day_pnl_pct,
        "risk_metrics": {
            "beta": portfolio.portfolio_beta,
            "volatility": portfolio.portfolio_volatility,
            "sharpe_ratio": portfolio.sharpe_ratio,
            "max_drawdown": portfolio.max_drawdown,
            "var_95": portfolio.value_at_risk_95,
        },
        "scores": {
            "diversification": portfolio.diversification_score,
            "risk": portfolio.risk_score,
            "health": portfolio.health_score,
        }
    }


@app.get("/portfolios/{portfolio_id}/exposure")
async def get_portfolio_exposure(portfolio_id: str):
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    portfolio = portfolios[portfolio_id]

    return {
        "sector_exposure": portfolio.sector_exposure,
        "asset_class_exposure": portfolio.asset_class_exposure,
        "geo_exposure": portfolio.geo_exposure,
        "theme_exposure": portfolio.theme_exposure,
    }


@app.get("/portfolios/{portfolio_id}/holdings")
async def get_portfolio_holdings(portfolio_id: str):
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    return portfolios[portfolio_id].holdings


@app.get("/stats")
async def get_stats():
    total_value = sum(p.total_value for p in portfolios.values())
    total_portfolios = len(portfolios)

    return {
        "total_portfolios": total_portfolios,
        "total_value": total_value,
        "avg_portfolio_value": total_value / total_portfolios if total_portfolios > 0 else 0,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5004)
