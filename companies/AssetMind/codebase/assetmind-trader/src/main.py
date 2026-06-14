"""
AssetMind Trader Service
Trading interface and order management
Port: 5210
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum
import logging
import uuid
import random

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AssetMind Trader",
    description="Trading interface and order management service",
    version="1.0.0",
)


# Enums
class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"
    TRAILING_STOP = "trailing_stop"
    OCO = "oco"


class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


class OrderStatus(str, Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    EXPIRED = "expired"


class OrderTimeInForce(str, Enum):
    DAY = "day"
    GTC = "gtc"
    IOC = "ioc"
    FOK = "fok"


class StrategyType(str, Enum):
    SWING = "swing"
    DAY_TRADE = "day_trade"
    SCALP = "scalp"
    POSITION = "position"
    ALGO = "algo"


# Pydantic Models
class OrderRequest(BaseModel):
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    time_in_force: OrderTimeInForce = OrderTimeInForce.DAY
    strategy: Optional[StrategyType] = None
    tags: List[str] = Field(default_factory=list)


class Order(BaseModel):
    order_id: str
    user_id: str
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    filled_quantity: float = 0.0
    price: Optional[float] = None
    stop_price: Optional[float] = None
    avg_fill_price: Optional[float] = None
    status: OrderStatus
    time_in_force: OrderTimeInForce
    strategy: Optional[StrategyType] = None
    tags: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    filled_at: Optional[datetime] = None


class Position(BaseModel):
    position_id: str
    user_id: str
    symbol: str
    quantity: float
    avg_cost: float
    current_price: float
    market_value: float
    unrealized_pnl: float
    unrealized_pnl_pct: float
    realized_pnl: float
    day_change: float
    day_change_pct: float


class TradeExecution(BaseModel):
    execution_id: str
    order_id: str
    symbol: str
    side: OrderSide
    quantity: float
    price: float
    commission: float
    executed_at: datetime


class StrategyPerformance(BaseModel):
    strategy_id: str
    strategy_type: StrategyType
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    avg_profit: float
    avg_loss: float
    profit_factor: float
    total_pnl: float
    max_drawdown: float
    sharpe_ratio: float


class TradeJournalEntry(BaseModel):
    entry_id: str
    user_id: str
    order_id: str
    trade_date: datetime
    symbol: str
    side: OrderSide
    quantity: float
    entry_price: float
    exit_price: Optional[float] = None
    exit_date: Optional[datetime] = None
    pnl: Optional[float] = None
    pnl_pct: Optional[float] = None
    holding_period: Optional[int] = None
    strategy: StrategyType
    notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class MarketData(BaseModel):
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    bid: float
    ask: float
    last: float


# In-memory storage
orders_db: Dict[str, Order] = {}
positions_db: Dict[str, Position] = {}
journal_db: Dict[str, TradeJournalEntry] = {}


def generate_order_id() -> str:
    """Generate unique order ID"""
    return f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"


def generate_market_data(symbol: str) -> MarketData:
    """Generate mock market data"""
    base_price = random.uniform(50, 500)
    return MarketData(
        symbol=symbol,
        timestamp=datetime.utcnow(),
        open=base_price * 0.99,
        high=base_price * 1.02,
        low=base_price * 0.98,
        close=base_price,
        volume=random.randint(1000000, 10000000),
        bid=base_price - 0.01,
        ask=base_price + 0.01,
        last=base_price,
    )


# API Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AssetMind Trader",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/api/v1/market/{symbol}")
async def get_market_data(symbol: str) -> MarketData:
    """Get real-time market data for symbol"""
    return generate_market_data(symbol)


@app.post("/api/v1/orders")
async def create_order(user_id: str, order: OrderRequest) -> Order:
    """Create a new order"""
    order_id = generate_order_id()

    new_order = Order(
        order_id=order_id,
        user_id=user_id,
        symbol=order.symbol,
        side=order.side,
        order_type=order.order_type,
        quantity=order.quantity,
        price=order.price,
        stop_price=order.stop_price,
        status=OrderStatus.PENDING,
        time_in_force=order.time_in_force,
        strategy=order.strategy,
        tags=order.tags,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    orders_db[order_id] = new_order
    return new_order


@app.get("/api/v1/orders/{user_id}")
async def get_orders(
    user_id: str,
    status: Optional[OrderStatus] = None,
    symbol: Optional[str] = None,
    limit: int = Query(default=50, le=200)
) -> List[Order]:
    """Get user's orders"""
    orders = [o for o in orders_db.values() if o.user_id == user_id]

    if status:
        orders = [o for o in orders if o.status == status]
    if symbol:
        orders = [o for o in orders if o.symbol == symbol]

    return sorted(orders, key=lambda x: x.created_at, reverse=True)[:limit]


@app.get("/api/v1/orders/detail/{order_id}")
async def get_order(order_id: str) -> Order:
    """Get order details"""
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")
    return orders_db[order_id]


@app.post("/api/v1/orders/{order_id}/cancel")
async def cancel_order(order_id: str) -> Order:
    """Cancel an order"""
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")

    order = orders_db[order_id]
    if order.status in [OrderStatus.FILLED, OrderStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Cannot cancel order in current state")

    order.status = OrderStatus.CANCELLED
    order.updated_at = datetime.utcnow()
    orders_db[order_id] = order

    return order


@app.get("/api/v1/positions/{user_id}")
async def get_positions(user_id: str) -> List[Position]:
    """Get user's positions"""
    positions = [p for p in positions_db.values() if p.user_id == user_id]
    return positions


@app.get("/api/v1/positions/{user_id}/{symbol}")
async def get_position(user_id: str, symbol: str) -> Position:
    """Get specific position"""
    pos_id = f"{user_id}_{symbol}"
    if pos_id not in positions_db:
        raise HTTPException(status_code=404, detail="Position not found")
    return positions_db[pos_id]


@app.get("/api/v1/journal/{user_id}")
async def get_trade_journal(
    user_id: str,
    symbol: Optional[str] = None,
    strategy: Optional[StrategyType] = None,
    limit: int = Query(default=50, le=200)
) -> List[TradeJournalEntry]:
    """Get trade journal entries"""
    entries = [e for e in journal_db.values() if e.user_id == user_id]

    if symbol:
        entries = [e for e in entries if e.symbol == symbol]
    if strategy:
        entries = [e for e in entries if e.strategy == strategy]

    return sorted(entries, key=lambda x: x.trade_date, reverse=True)[:limit]


@app.post("/api/v1/journal/{user_id}")
async def add_journal_entry(user_id: str, entry: TradeJournalEntry) -> TradeJournalEntry:
    """Add trade journal entry"""
    entry.entry_id = str(uuid.uuid4())
    entry.user_id = user_id
    journal_db[entry.entry_id] = entry
    return entry


@app.get("/api/v1/performance/{user_id}/strategies")
async def get_strategy_performance(user_id: str) -> List[StrategyPerformance]:
    """Get performance metrics by strategy"""
    return [
        StrategyPerformance(
            strategy_id="strat_swing",
            strategy_type=StrategyType.SWING,
            total_trades=45,
            winning_trades=28,
            losing_trades=17,
            win_rate=62.2,
            avg_profit=850.00,
            avg_loss=-420.00,
            profit_factor=2.02,
            total_pnl=12500.00,
            max_drawdown=-2100.00,
            sharpe_ratio=1.45,
        ),
        StrategyPerformance(
            strategy_id="strat_day",
            strategy_type=StrategyType.DAY_TRADE,
            total_trades=120,
            winning_trades=72,
            losing_trades=48,
            win_rate=60.0,
            avg_profit=180.00,
            avg_loss=-120.00,
            profit_factor=1.5,
            total_pnl=7200.00,
            max_drawdown=-800.00,
            sharpe_ratio=1.12,
        ),
    ]


@app.get("/api/v1/performance/{user_id}/summary")
async def get_performance_summary(user_id: str) -> Dict[str, Any]:
    """Get overall performance summary"""
    return {
        "user_id": user_id,
        "total_pnl": 19700.00,
        "total_trades": 165,
        "winning_trades": 100,
        "losing_trades": 65,
        "win_rate": 60.6,
        "avg_win": 520.00,
        "avg_loss": -280.00,
        "profit_factor": 1.86,
        "max_drawdown": -2900.00,
        "sharpe_ratio": 1.28,
        "calmar_ratio": 1.85,
        "period": {
            "start": (datetime.utcnow() - timedelta(days=365)).isoformat(),
            "end": datetime.utcnow().isoformat(),
        },
    }


@app.get("/api/v1/executions/{order_id}")
async def get_order_executions(order_id: str) -> List[TradeExecution]:
    """Get executions for an order"""
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")

    return [
        TradeExecution(
            execution_id=str(uuid.uuid4()),
            order_id=order_id,
            symbol=orders_db[order_id].symbol,
            side=orders_db[order_id].side,
            quantity=orders_db[order_id].quantity,
            price=orders_db[order_id].price or 178.50,
            commission=0.50,
            executed_at=datetime.utcnow(),
        )
    ]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5210)
