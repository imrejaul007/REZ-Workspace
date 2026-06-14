"""
AssetMind Portfolio Twin Service
Digital twin for portfolio analytics and management

Port: 5004

Version: 1.0.0
"""

import asyncio
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
import random

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="AssetMind Portfolio Twin",
    description="Digital twin service for portfolio analytics",
    version="1.0.0",
)

# ============================================================================
# Enums
# ============================================================================

class PortfolioType(str, Enum):
    EQUITY = "equity"
    FIXED_INCOME = "fixed_income"
    BALANCED = "balanced"
    GROWTH = "growth"
    INCOME = "income"
    ALTERNATIVE = "alternative"
    CUSTOM = "custom"

class RebalanceStrategy(str, Enum):
    THRESHOLD = "threshold"
    CALENDAR = "calendar"
    TAX_LOSS_HARVEST = "tax_loss_harvest"
    RISK_PARITY = "risk_parity"
    EQUAL_WEIGHT = "equal_weight"

class RiskProfile(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"
    SPECULATIVE = "speculative"

# ============================================================================
# Pydantic Models - Holdings
# ============================================================================

class Holding(BaseModel):
    asset_id: str
    symbol: str
    name: str
    quantity: float = Field(..., gt=0)
    avg_cost: float = Field(..., ge=0)
    current_price: float = 0.0
    market_value: float = 0.0
    unrealized_pnl: float = 0.0
    unrealized_pnl_pct: float = 0.0
    weight: float = 0.0  # Portfolio weight %
    sector: Optional[str] = None
    asset_type: str = "stock"

class Allocation(BaseModel):
    sector: str
    value: float
    weight: float
    change_1d: float = 0.0

class AssetAllocation(BaseModel):
    stocks: float = 0.0
    bonds: float = 0.0
    cash: float = 0.0
    alternatives: float = 0.0
    crypto: float = 0.0
    commodities: float = 0.0

# ============================================================================
# Pydantic Models - Performance
# ============================================================================

class PerformanceMetrics(BaseModel):
    total_return: float = 0.0
    total_return_pct: float = 0.0
    annualized_return: float = 0.0
    ytd_return: float = 0.0
    mtd_return: float = 0.0
    return_1d: float = 0.0
    return_1w: float = 0.0
    return_1m: float = 0.0
    return_3m: float = 0.0
    return_6m: float = 0.0
    return_1y: float = 0.0
    return_3y: float = 0.0
    return_5y: float = 0.0

class RiskMetrics(BaseModel):
    volatility: float = 0.0  # Annualized std dev
    sharpe_ratio: float = 0.0
    sortino_ratio: float = 0.0
    max_drawdown: float = 0.0
    max_drawdown_duration: int = 0  # Days
    value_at_risk_95: float = 0.0  # VaR 95%
    conditional_var_95: float = 0.0  # CVaR/Expected Shortfall
    beta: float = 1.0
    alpha: float = 0.0
    tracking_error: float = 0.0
    information_ratio: float = 0.0
    treynor_ratio: float = 0.0
    calmar_ratio: float = 0.0

class BenchmarkComparison(BaseModel):
    benchmark_name: str
    portfolio_return: float
    benchmark_return: float
    excess_return: float
    beta: float = 1.0
    correlation: float = 0.0
    r_squared: float = 0.0

# ============================================================================
# Pydantic Models - Portfolio Twin Entity
# ============================================================================

class RebalanceRecommendation(BaseModel):
    action: str  # buy, sell, hold
    symbol: str
    current_weight: float
    target_weight: float
    difference: float
    estimated_value: float
    priority: str  # high, medium, low

class PortfolioConfig(BaseModel):
    rebalance_strategy: RebalanceStrategy = RebalanceStrategy.THRESHOLD
    rebalance_threshold: float = 5.0  # % deviation threshold
    target_volatility: float = 15.0
    max_position_size: float = 25.0
    min_position_size: float = 1.0
    tax_loss_harvest_enabled: bool = False

class PortfolioTwin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    portfolio_type: PortfolioType = PortfolioType.BALANCED
    risk_profile: RiskProfile = RiskProfile.MODERATE
    currency: str = "USD"
    status: str = "active"

    # Holdings
    holdings: List[Holding] = []
    allocations: List[Allocation] = []
    asset_allocation: AssetAllocation = Field(default_factory=AssetAllocation)

    # Value
    total_value: float = 0.0
    cash_balance: float = 0.0
    invested_value: float = 0.0
    initial_value: float = 0.0

    # Metrics
    performance: PerformanceMetrics = Field(default_factory=PerformanceMetrics)
    risk_metrics: RiskMetrics = Field(default_factory=RiskMetrics)
    benchmark: Optional[BenchmarkComparison] = None

    # Config
    config: PortfolioConfig = Field(default_factory=PortfolioConfig)
    rebalance_recommendations: List[RebalanceRecommendation] = []

    # Metadata
    owner_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

# ============================================================================
# Request/Response Models
# ============================================================================

class PortfolioCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    portfolio_type: PortfolioType = PortfolioType.BALANCED
    risk_profile: RiskProfile = RiskProfile.MODERATE
    initial_value: float = Field(default=0.0, ge=0)
    config: Optional[PortfolioConfig] = None

class PositionAdd(BaseModel):
    symbol: str
    name: str
    quantity: float = Field(..., gt=0)
    avg_cost: float = Field(..., ge=0)
    current_price: float = Field(..., gt=0)
    sector: Optional[str] = None
    asset_type: str = "stock"

class PerformanceRequest(BaseModel):
    portfolio_id: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    benchmark: Optional[str] = "SPY"

# ============================================================================
# In-Memory Storage
# ============================================================================

portfolios_db: Dict[str, PortfolioTwin] = {}

def create_sample_portfolio(name: str, portfolio_type: PortfolioType, initial: float) -> PortfolioTwin:
    """Create a sample portfolio with holdings."""
    holdings = [
        Holding(
            asset_id="asset-001", symbol="AAPL", name="Apple Inc.",
            quantity=100, avg_cost=150.00, current_price=178.50,
            market_value=17850.00, unrealized_pnl=2850.00, unrealized_pnl_pct=19.0,
            weight=35.0, sector="Technology", asset_type="stock"
        ),
        Holding(
            asset_id="asset-002", symbol="GOOGL", name="Alphabet Inc.",
            quantity=50, avg_cost=130.00, current_price=141.20,
            market_value=7060.00, unrealized_pnl=560.00, unrealized_pnl_pct=8.62,
            weight=14.0, sector="Technology", asset_type="stock"
        ),
        Holding(
            asset_id="asset-003", symbol="MSFT", name="Microsoft Corp.",
            quantity=75, avg_cost=320.00, current_price=378.90,
            market_value=28417.50, unrealized_pnl=4417.50, unrealized_pnl_pct=18.41,
            weight=28.0, sector="Technology", asset_type="stock"
        ),
        Holding(
            asset_id="asset-007", symbol="BND", name="Vanguard Total Bond ETF",
            quantity=200, avg_cost=75.00, current_price=72.50,
            market_value=14500.00, unrealized_pnl=-500.00, unrealized_pnl_pct=-3.33,
            weight=15.0, sector="Fixed Income", asset_type="bond"
        ),
        Holding(
            asset_id="asset-004", symbol="BTC", name="Bitcoin",
            quantity=0.5, avg_cost=45000.00, current_price=67500.00,
            market_value=33750.00, unrealized_pnl=11250.00, unrealized_pnl_pct=50.0,
            weight=8.0, sector="Crypto", asset_type="crypto"
        ),
    ]

    total_value = sum(h.market_value for h in holdings) + 10000  # Cash
    cash = 10000.0

    portfolio = PortfolioTwin(
        name=name,
        description="Sample portfolio for demonstration",
        portfolio_type=portfolio_type,
        holdings=holdings,
        total_value=total_value,
        cash_balance=cash,
        invested_value=total_value - cash,
        initial_value=initial or total_value,
        performance=PerformanceMetrics(
            total_return=total_value - (initial or total_value),
            total_return_pct=((total_value - (initial or total_value)) / (initial or total_value)) * 100,
            annualized_return=12.5,
            ytd_return=8.3,
            mtd_return=1.2,
            return_1d=0.45,
            return_1w=1.8,
            return_1m=2.5,
            return_3m=5.2,
            return_6m=10.1,
            return_1y=18.5,
        ),
        risk_metrics=RiskMetrics(
            volatility=16.5,
            sharpe_ratio=1.15,
            sortino_ratio=1.45,
            max_drawdown=-12.3,
            max_drawdown_duration=45,
            value_at_risk_95=4500.0,
            conditional_var_95=6200.0,
            beta=1.12,
            alpha=2.3,
        ),
        config=PortfolioConfig(
            rebalance_threshold=5.0,
            target_volatility=15.0,
            max_position_size=25.0,
        ),
        rebalance_recommendations=[
            RebalanceRecommendation(
                action="sell", symbol="AAPL", current_weight=35.0, target_weight=25.0,
                difference=-10.0, estimated_value=3570.0, priority="medium"
            ),
            RebalanceRecommendation(
                action="buy", symbol="BND", current_weight=15.0, target_weight=20.0,
                difference=5.0, estimated_value=1790.0, priority="high"
            ),
        ],
    )
    portfolios_db[portfolio.id] = portfolio
    return portfolio

# Initialize sample portfolios
sample_portfolios = [
    ("Tech Growth Portfolio", PortfolioType.GROWTH, 85000),
    ("Balanced Income Fund", PortfolioType.BALANCED, 150000),
    ("Conservative Retirement", PortfolioType.FIXED_INCOME, 200000),
]

for name, ptype, initial in sample_portfolios:
    create_sample_portfolio(name, ptype, initial)

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "assetmind-portfolio-twin",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {
            "total_portfolios": len(portfolios_db),
            "total_value": sum(p.total_value for p in portfolios_db.values()),
        },
    }

# ============================================================================
# Portfolio CRUD Endpoints
# ============================================================================

@app.post("/api/portfolio", response_model=PortfolioTwin, status_code=201)
async def create_portfolio(request: PortfolioCreate):
    """Create a new portfolio twin."""
    portfolio = PortfolioTwin(
        name=request.name,
        description=request.description,
        portfolio_type=request.portfolio_type,
        risk_profile=request.risk_profile,
        initial_value=request.initial_value,
        cash_balance=request.initial_value,
        config=request.config or PortfolioConfig(),
    )
    portfolios_db[portfolio.id] = portfolio
    return portfolio

@app.get("/api/portfolio", response_model=List[PortfolioTwin])
async def list_portfolios(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    portfolio_type: Optional[PortfolioType] = None,
    risk_profile: Optional[RiskProfile] = None,
):
    """List all portfolios with optional filtering."""
    portfolios = list(portfolios_db.values())

    if portfolio_type:
        portfolios = [p for p in portfolios if p.portfolio_type == portfolio_type]
    if risk_profile:
        portfolios = [p for p in portfolios if p.risk_profile == risk_profile]

    return portfolios[skip : skip + limit]

@app.get("/api/portfolio/{portfolio_id}", response_model=PortfolioTwin)
async def get_portfolio(portfolio_id: str):
    """Get portfolio details."""
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolios_db[portfolio_id]

@app.delete("/api/portfolio/{portfolio_id}", status_code=204)
async def delete_portfolio(portfolio_id: str):
    """Delete a portfolio."""
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    del portfolios_db[portfolio_id]

# ============================================================================
# Holdings Endpoints
# ============================================================================

@app.post("/api/portfolio/{portfolio_id}/holdings", response_model=PortfolioTwin)
async def add_holding(portfolio_id: str, position: PositionAdd):
    """Add a holding to a portfolio."""
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    portfolio = portfolios_db[portfolio_id]

    holding = Holding(
        asset_id=str(uuid.uuid4()),
        symbol=position.symbol.upper(),
        name=position.name,
        quantity=position.quantity,
        avg_cost=position.avg_cost,
        current_price=position.current_price,
        market_value=position.quantity * position.current_price,
        unrealized_pnl=(position.current_price - position.avg_cost) * position.quantity,
        unrealized_pnl_pct=((position.current_price - position.avg_cost) / position.avg_cost) * 100,
        sector=position.sector,
        asset_type=position.asset_type,
    )

    # Recalculate weights
    portfolio.holdings.append(holding)
    total_market_value = sum(h.market_value for h in portfolio.holdings)
    for h in portfolio.holdings:
        h.weight = (h.market_value / total_market_value) * 100

    portfolio.total_value = total_market_value + portfolio.cash_balance
    portfolio.invested_value = total_market_value
    portfolio.updated_at = datetime.utcnow()

    return portfolio

@app.delete("/api/portfolio/{portfolio_id}/holdings/{symbol}", response_model=PortfolioTwin)
async def remove_holding(portfolio_id: str, symbol: str):
    """Remove a holding from portfolio."""
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    portfolio = portfolios_db[portfolio_id]
    portfolio.holdings = [h for h in portfolio.holdings if h.symbol != symbol.upper()]

    total_market_value = sum(h.market_value for h in portfolio.holdings)
    portfolio.total_value = total_market_value + portfolio.cash_balance
    portfolio.invested_value = total_market_value
    portfolio.updated_at = datetime.utcnow()

    return portfolio

# ============================================================================
# Analytics Endpoints
# ============================================================================

@app.get("/api/portfolio/{portfolio_id}/performance", response_model=PerformanceMetrics)
async def get_performance(portfolio_id: str):
    """Get performance metrics for portfolio."""
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolios_db[portfolio_id].performance

@app.get("/api/portfolio/{portfolio_id}/risk", response_model=RiskMetrics)
async def get_risk_metrics(portfolio_id: str):
    """Get risk metrics for portfolio."""
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolios_db[portfolio_id].risk_metrics

@app.get("/api/portfolio/{portfolio_id}/allocations")
async def get_allocations(portfolio_id: str):
    """Get allocation breakdown."""
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    portfolio = portfolios_db[portfolio_id]

    # Sector allocation
    sector_map: Dict[str, Dict[str, float]] = {}
    for h in portfolio.holdings:
        sector = h.sector or "Other"
        if sector not in sector_map:
            sector_map[sector] = {"value": 0.0, "count": 0}
        sector_map[sector]["value"] += h.market_value
        sector_map[sector]["count"] += 1

    total = sum(s["value"] for s in sector_map.values())
    allocations = [
        Allocation(
            sector=sector,
            value=data["value"],
            weight=(data["value"] / total) * 100 if total > 0 else 0,
            change_1d=random.uniform(-2, 3),
        )
        for sector, data in sector_map.items()
    ]

    return {
        "portfolio_id": portfolio_id,
        "total_value": portfolio.total_value,
        "sector_allocations": allocations,
        "asset_allocation": portfolio.asset_allocation,
    }

@app.get("/api/portfolio/{portfolio_id}/rebalance", response_model=List[RebalanceRecommendation])
async def get_rebalance_recommendations(portfolio_id: str):
    """Get rebalancing recommendations."""
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolios_db[portfolio_id].rebalance_recommendations

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    print("Starting AssetMind Portfolio Twin Service on port 5004")
    uvicorn.run(app, host="0.0.0.0", port=5004)