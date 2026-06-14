"""
AssetMind API - Main REST API Service
Port: 8000
"""

import asyncio
import uuid
from datetime import datetime
from typing import Optional, List
from enum import Enum

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from loguru import logger

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="AssetMind API",
    description="Financial Intelligence Platform - Main REST API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Enums
# ============================================================================

class AssetType(str, Enum):
    STOCK = "stock"
    BOND = "bond"
    COMMODITY = "commodity"
    CRYPTO = "crypto"
    REAL_ESTATE = "real_estate"
    FOREX = "forex"
    FUND = "fund"

class RiskLevel(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"
    SPECULATIVE = "speculative"

class OrderStatus(str, Enum):
    PENDING = "pending"
    EXECUTED = "executed"
    CANCELLED = "cancelled"
    FAILED = "failed"

# ============================================================================
# Pydantic Models - Asset Domain
# ============================================================================

class AssetBase(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=200)
    asset_type: AssetType
    currency: str = Field(default="USD", max_length=3)
    exchange: Optional[str] = None

class AssetCreate(AssetBase):
    sector: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None

class Asset(AssetBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sector: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    current_price: Optional[float] = None
    market_cap: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

# ============================================================================
# Pydantic Models - Portfolio Domain
# ============================================================================

class Position(BaseModel):
    asset_id: str
    symbol: str
    quantity: float = Field(..., gt=0)
    avg_cost: float = Field(..., ge=0)
    current_price: Optional[float] = None

class PortfolioBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    base_currency: str = Field(default="USD", max_length=3)

class PortfolioCreate(PortfolioBase):
    initial_value: float = Field(default=0.0, ge=0)
    risk_profile: RiskLevel = RiskLevel.MODERATE

class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    risk_profile: Optional[RiskLevel] = None

class Portfolio(PortfolioBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    positions: List[Position] = []
    total_value: float = 0.0
    cash_balance: float = 0.0
    risk_profile: RiskLevel = RiskLevel.MODERATE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

# ============================================================================
# Pydantic Models - Market Data
# ============================================================================

class Quote(BaseModel):
    symbol: str
    price: float
    change: float = 0.0
    change_pct: float = 0.0
    volume: Optional[int] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class MarketSummary(BaseModel):
    indices: List[Quote] = []
    gainers: List[Quote] = []
    losers: List[Quote] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ============================================================================
# Pydantic Models - Trading
# ============================================================================

class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"

class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"

class OrderCreate(BaseModel):
    portfolio_id: str
    symbol: str
    side: OrderSide
    order_type: OrderType = OrderType.MARKET
    quantity: float = Field(..., gt=0)
    price: Optional[float] = Field(None, ge=0)
    stop_price: Optional[float] = Field(None, ge=0)

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    portfolio_id: str
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    status: OrderStatus = OrderStatus.PENDING
    filled_quantity: float = 0.0
    avg_fill_price: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ============================================================================
# Pydantic Models - Analytics
# ============================================================================

class PerformanceMetrics(BaseModel):
    total_return: float = 0.0
    annualized_return: float = 0.0
    volatility: float = 0.0
    sharpe_ratio: float = 0.0
    max_drawdown: float = 0.0
    win_rate: float = 0.0

class RiskMetrics(BaseModel):
    value_at_risk: float = 0.0
    conditional_var: float = 0.0
    beta: float = 1.0
    correlation: float = 0.0

class AnalyticsRequest(BaseModel):
    portfolio_id: str
    metrics: List[str] = ["performance", "risk"]

# ============================================================================
# In-Memory Storage (Simulated Database)
# ============================================================================

assets_db: dict[str, Asset] = {}
portfolios_db: dict[str, Portfolio] = {}
orders_db: dict[str, Order] = {}

# Initialize with sample data
def init_sample_data():
    """Initialize sample assets for testing."""
    sample_assets = [
        Asset(id="asset-001", symbol="AAPL", name="Apple Inc.", asset_type=AssetType.STOCK,
              sector="Technology", current_price=178.50, market_cap=2800000000000),
        Asset(id="asset-002", symbol="GOOGL", name="Alphabet Inc.", asset_type=AssetType.STOCK,
              sector="Technology", current_price=141.20, market_cap=1780000000000),
        Asset(id="asset-003", symbol="MSFT", name="Microsoft Corp.", asset_type=AssetType.STOCK,
              sector="Technology", current_price=378.90, market_cap=2820000000000),
        Asset(id="asset-004", symbol="BTC", name="Bitcoin", asset_type=AssetType.CRYPTO,
              current_price=67500.00),
        Asset(id="asset-005", symbol="ETH", name="Ethereum", asset_type=AssetType.CRYPTO,
              current_price=3450.00),
    ]
    for asset in sample_assets:
        assets_db[asset.id] = asset

    # Sample portfolio
    portfolio = Portfolio(
        id="portfolio-001",
        name="Tech Growth Portfolio",
        description="High-growth tech stocks",
        positions=[
            Position(asset_id="asset-001", symbol="AAPL", quantity=100, avg_cost=150.00, current_price=178.50),
            Position(asset_id="asset-002", symbol="GOOGL", quantity=50, avg_cost=130.00, current_price=141.20),
        ],
        total_value=23650.00,
        cash_balance=5000.00,
    )
    portfolios_db[portfolio.id] = portfolio

init_sample_data()

# ============================================================================
# Health Check Endpoint
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "assetmind-api",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {
            "assets": len(assets_db),
            "portfolios": len(portfolios_db),
            "orders": len(orders_db),
        }
    }

# ============================================================================
# Asset Endpoints (CRUD)
# ============================================================================

@app.post("/api/assets", response_model=Asset, status_code=201)
async def create_asset(asset: AssetCreate):
    """Create a new asset."""
    # Check for duplicate symbol
    for existing in assets_db.values():
        if existing.symbol == asset.symbol:
            raise HTTPException(status_code=400, detail=f"Asset with symbol {asset.symbol} already exists")

    new_asset = Asset(**asset.model_dump())
    assets_db[new_asset.id] = new_asset
    logger.info(f"Created asset: {new_asset.symbol}")
    return new_asset

@app.get("/api/assets", response_model=List[Asset])
async def list_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    asset_type: Optional[AssetType] = None,
    sector: Optional[str] = None,
):
    """List all assets with optional filtering."""
    assets = list(assets_db.values())

    if asset_type:
        assets = [a for a in assets if a.asset_type == asset_type]
    if sector:
        assets = [a for a in assets if a.sector and a.sector.lower() == sector.lower()]

    return assets[skip : skip + limit]

@app.get("/api/assets/{asset_id}", response_model=Asset)
async def get_asset(asset_id: str):
    """Get a specific asset by ID."""
    if asset_id not in assets_db:
        raise HTTPException(status_code=404, detail="Asset not found")
    return assets_db[asset_id]

@app.get("/api/assets/symbol/{symbol}", response_model=Asset)
async def get_asset_by_symbol(symbol: str):
    """Get asset by symbol."""
    for asset in assets_db.values():
        if asset.symbol == symbol.upper():
            return asset
    raise HTTPException(status_code=404, detail=f"Asset with symbol {symbol} not found")

@app.put("/api/assets/{asset_id}", response_model=Asset)
async def update_asset(asset_id: str, update: AssetUpdate):
    """Update an existing asset."""
    if asset_id not in assets_db:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset = assets_db[asset_id]
    update_data = update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(asset, field, value)

    asset.updated_at = datetime.utcnow()
    logger.info(f"Updated asset: {asset.symbol}")
    return asset

@app.delete("/api/assets/{asset_id}", status_code=204)
async def delete_asset(asset_id: str):
    """Delete an asset."""
    if asset_id not in assets_db:
        raise HTTPException(status_code=404, detail="Asset not found")

    del assets_db[asset_id]
    logger.info(f"Deleted asset: {asset_id}")
    return None

# ============================================================================
# Portfolio Endpoints (CRUD)
# ============================================================================

@app.post("/api/portfolios", response_model=Portfolio, status_code=201)
async def create_portfolio(portfolio: PortfolioCreate):
    """Create a new portfolio."""
    new_portfolio = Portfolio(
        **portfolio.model_dump(),
        cash_balance=portfolio.initial_value,
    )
    portfolios_db[new_portfolio.id] = new_portfolio
    logger.info(f"Created portfolio: {new_portfolio.name}")
    return new_portfolio

@app.get("/api/portfolios", response_model=List[Portfolio])
async def list_portfolios(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000)):
    """List all portfolios."""
    return list(portfolios_db.values())[skip : skip + limit]

@app.get("/api/portfolios/{portfolio_id}", response_model=Portfolio)
async def get_portfolio(portfolio_id: str):
    """Get a specific portfolio."""
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolios_db[portfolio_id]

@app.put("/api/portfolios/{portfolio_id}", response_model=Portfolio)
async def update_portfolio(portfolio_id: str, update: PortfolioUpdate):
    """Update a portfolio."""
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    portfolio = portfolios_db[portfolio_id]
    update_data = update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(portfolio, field, value)

    portfolio.updated_at = datetime.utcnow()
    return portfolio

@app.delete("/api/portfolios/{portfolio_id}", status_code=204)
async def delete_portfolio(portfolio_id: str):
    """Delete a portfolio."""
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    del portfolios_db[portfolio_id]
    return None

# ============================================================================
# Position Management
# ============================================================================

@app.post("/api/portfolios/{portfolio_id}/positions", response_model=Portfolio)
async def add_position(portfolio_id: str, position: Position):
    """Add a position to a portfolio."""
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    portfolio = portfolios_db[portfolio_id]

    # Check if position already exists
    for i, p in enumerate(portfolio.positions):
        if p.symbol == position.symbol:
            # Update existing position
            total_qty = p.quantity + position.quantity
            p.avg_cost = (p.avg_cost * p.quantity + position.avg_cost * position.quantity) / total_qty
            p.quantity = total_qty
            p.current_price = position.current_price
            portfolio.updated_at = datetime.utcnow()
            return portfolio

    # Add new position
    portfolio.positions.append(position)
    portfolio.updated_at = datetime.utcnow()
    return portfolio

@app.delete("/api/portfolios/{portfolio_id}/positions/{symbol}", status_code=204)
async def remove_position(portfolio_id: str, symbol: str):
    """Remove a position from a portfolio."""
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    portfolio = portfolios_db[portfolio_id]
    portfolio.positions = [p for p in portfolio.positions if p.symbol != symbol]
    portfolio.updated_at = datetime.utcnow()

# ============================================================================
# Order Endpoints
# ============================================================================

@app.post("/api/orders", response_model=Order, status_code=201)
async def create_order(order: OrderCreate):
    """Create a new trading order."""
    if order.portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    new_order = Order(**order.model_dump())
    orders_db[new_order.id] = new_order
    logger.info(f"Created order: {new_order.side} {new_order.quantity} {new_order.symbol}")
    return new_order

@app.get("/api/orders", response_model=List[Order])
async def list_orders(
    portfolio_id: Optional[str] = None,
    status: Optional[OrderStatus] = None,
):
    """List orders with optional filtering."""
    orders = list(orders_db.values())

    if portfolio_id:
        orders = [o for o in orders if o.portfolio_id == portfolio_id]
    if status:
        orders = [o for o in orders if o.status == status]

    return orders

@app.get("/api/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """Get order details."""
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")
    return orders_db[order_id]

@app.post("/api/orders/{order_id}/execute", response_model=Order)
async def execute_order(order_id: str, background_tasks: BackgroundTasks):
    """Execute an order (background processing)."""
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")

    order = orders_db[order_id]
    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Order already {order.status.value}")

    async def process_order():
        await asyncio.sleep(0.1)  # Simulate processing
        order.status = OrderStatus.EXECUTED
        order.filled_quantity = order.quantity
        order.avg_fill_price = order.price or 100.0
        order.updated_at = datetime.utcnow()

    background_tasks.add_task(process_order)
    return order

@app.post("/api/orders/{order_id}/cancel", response_model=Order)
async def cancel_order(order_id: str):
    """Cancel a pending order."""
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")

    order = orders_db[order_id]
    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Cannot cancel order with status {order.status.value}")

    order.status = OrderStatus.CANCELLED
    order.updated_at = datetime.utcnow()
    return order

# ============================================================================
# Analytics Endpoints
# ============================================================================

@app.post("/api/analytics", response_model=dict)
async def analyze_portfolio(request: AnalyticsRequest):
    """Analyze portfolio performance and risk."""
    if request.portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    portfolio = portfolios_db[request.portfolio_id]

    # Simulate analytics calculation
    result = {
        "portfolio_id": request.portfolio_id,
        "metrics": {},
        "timestamp": datetime.utcnow().isoformat(),
    }

    if "performance" in request.metrics:
        result["metrics"]["performance"] = PerformanceMetrics(
            total_return=12.5,
            annualized_return=18.2,
            volatility=15.3,
            sharpe_ratio=1.2,
            max_drawdown=8.5,
            win_rate=0.65,
        )

    if "risk" in request.metrics:
        result["metrics"]["risk"] = RiskMetrics(
            value_at_risk=2500.0,
            conditional_var=3500.0,
            beta=1.15,
            correlation=0.75,
        )

    return result

# ============================================================================
# Market Data Endpoints
# ============================================================================

@app.get("/api/market/quotes/{symbol}", response_model=Quote)
async def get_quote(symbol: str):
    """Get current quote for a symbol."""
    # Find asset by symbol
    for asset in assets_db.values():
        if asset.symbol == symbol.upper():
            return Quote(
                symbol=asset.symbol,
                price=asset.current_price or 100.0,
                change=2.5,
                change_pct=1.5,
                volume=1000000,
            )

    # Return simulated quote if asset not found
    return Quote(
        symbol=symbol.upper(),
        price=150.0,
        change=0.0,
        change_pct=0.0,
    )

@app.get("/api/market/summary", response_model=MarketSummary)
async def get_market_summary():
    """Get market summary with indices."""
    indices = [
        Quote(symbol="SPX", price=5234.18, change=15.3, change_pct=0.29),
        Quote(symbol="NDX", price=18345.67, change=-45.2, change_pct=-0.25),
        Quote(symbol="DJI", price=39127.14, change=89.5, change_pct=0.23),
    ]

    return MarketSummary(
        indices=indices,
        gainers=[
            Quote(symbol="NVDA", price=878.35, change=25.4, change_pct=2.98),
        ],
        losers=[
            Quote(symbol="META", price=502.30, change=-12.8, change_pct=-2.48),
        ],
    )

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting AssetMind API on port 8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)