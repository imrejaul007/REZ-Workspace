"""
AssetMind Paper Trading Service
Risk-free trading simulator for strategy testing
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import uuid
import asyncio
import random
import json

app = FastAPI(
    title="AssetMind Paper Trading",
    description="Paper trading simulator for testing strategies without risk",
    version="1.0.0"
)


# Enums
class OrderStatus(str, Enum):
    PENDING = "pending"
    FILLED = "filled"
    PARTIAL = "partial"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"


class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


class PositionSide(str, Enum):
    LONG = "long"
    SHORT = "short"
    FLAT = "flat"


class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    TRADE = "trade"
    FEE = "fee"
    ADJUSTMENT = "adjustment"


# Pydantic Models
class Portfolio(BaseModel):
    portfolio_id: str
    name: str
    initial_balance: float
    current_balance: float
    total_value: float
    unrealized_pnl: float
    realized_pnl: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    created_at: datetime
    updated_at: datetime


class PaperOrder(BaseModel):
    order_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    portfolio_id: str
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float = Field(..., gt=0)
    price: Optional[float] = None
    stop_price: Optional[float] = None
    status: OrderStatus = OrderStatus.PENDING
    filled_price: Optional[float] = None
    filled_quantity: float = 0.0
    commission: float = 0.0
    created_at: datetime
    filled_at: Optional[datetime] = None


class PaperPosition(BaseModel):
    position_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    portfolio_id: str
    symbol: str
    side: PositionSide
    quantity: float
    entry_price: float
    current_price: float
    unrealized_pnl: float
    realized_pnl: float
    commission: float
    opened_at: datetime
    updated_at: datetime


class PaperTrade(BaseModel):
    trade_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    portfolio_id: str
    order_id: str
    symbol: str
    side: OrderSide
    quantity: float
    price: float
    commission: float
    pnl: Optional[float] = None
    executed_at: datetime


class Transaction(BaseModel):
    transaction_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    portfolio_id: str
    type: TransactionType
    amount: float
    balance_after: float
    description: str
    created_at: datetime


class PortfolioCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    initial_balance: float = Field(..., gt=0)
    base_currency: str = Field(default="USD", max_length=10)
    settings: Dict[str, Any] = Field(default_factory=dict)


class PortfolioSnapshot(BaseModel):
    timestamp: datetime
    portfolio_id: str
    total_value: float
    cash_balance: float
    positions_value: float
    unrealized_pnl: float
    realized_pnl: float
    daily_return: float
    weekly_return: float
    monthly_return: float


class LeaderboardEntry(BaseModel):
    rank: int
    portfolio_id: str
    name: str
    total_return: float
    sharpe_ratio: float
    max_drawdown: float
    total_trades: int


# In-memory storage
portfolios: Dict[str, Portfolio] = {}
orders: Dict[str, PaperOrder] = {}
positions: Dict[str, PaperPosition] = {}
trades: Dict[str, PaperTrade] = {}
transactions: Dict[str, Transaction] = {}
snapshots: Dict[str, List[PortfolioSnapshot]] = {}
ws_connections: List[WebSocket] = []


def create_portfolio(name: str, initial_balance: float, base_currency: str = "USD") -> Portfolio:
    """Create a new paper trading portfolio."""
    portfolio_id = str(uuid.uuid4())
    now = datetime.now()

    portfolio = Portfolio(
        portfolio_id=portfolio_id,
        name=name,
        initial_balance=initial_balance,
        current_balance=initial_balance,
        total_value=initial_balance,
        unrealized_pnl=0.0,
        realized_pnl=0.0,
        total_trades=0,
        winning_trades=0,
        losing_trades=0,
        win_rate=0.0,
        created_at=now,
        updated_at=now
    )

    portfolios[portfolio_id] = portfolio
    snapshots[portfolio_id] = []

    # Record initial deposit
    transactions[portfolio_id] = [Transaction(
        portfolio_id=portfolio_id,
        type=TransactionType.DEPOSIT,
        amount=initial_balance,
        balance_after=initial_balance,
        description=f"Initial deposit of {initial_balance} {base_currency}",
        created_at=now
    )]

    return portfolio


def calculate_portfolio_metrics(portfolio_id: str):
    """Recalculate portfolio metrics."""
    if portfolio_id not in portfolios:
        return

    portfolio = portfolios[portfolio_id]
    portfolio_positions = [p for p in positions.values() if p.portfolio_id == portfolio_id]
    portfolio_trades = [t for t in trades.values() if t.portfolio_id == portfolio_id]

    # Calculate unrealized PnL from open positions
    unrealized = sum(p.unrealized_pnl for p in portfolio_positions)
    positions_value = sum(p.quantity * p.current_price for p in portfolio_positions)

    # Calculate realized PnL from closed trades
    realized = sum(t.pnl for t in portfolio_trades if t.pnl is not None)

    # Count trades
    winning = len([t for t in portfolio_trades if t.pnl and t.pnl > 0])
    losing = len([t for t in portfolio_trades if t.pnl and t.pnl <= 0])

    portfolio.unrealized_pnl = unrealized
    portfolio.realized_pnl = realized
    portfolio.total_value = portfolio.current_balance + positions_value
    portfolio.total_trades = len(portfolio_trades)
    portfolio.winning_trades = winning
    portfolio.losing_trades = losing
    portfolio.win_rate = winning / len(portfolio_trades) if portfolio_trades else 0.0
    portfolio.updated_at = datetime.now()


async def simulate_market_prices():
    """Simulate price updates for all positions."""
    while True:
        await asyncio.sleep(5)  # Update every 5 seconds

        for position in positions.values():
            if position.side == PositionSide.FLAT:
                continue

            # Simulate price movement
            price_change = random.uniform(-0.01, 0.01)
            position.current_price *= (1 + price_change)

            # Calculate unrealized PnL
            if position.side == PositionSide.LONG:
                position.unrealized_pnl = (
                    position.current_price - position.entry_price
                ) * position.quantity - position.commission
            else:
                position.unrealized_pnl = (
                    position.entry_price - position.current_price
                ) * position.quantity - position.commission

            position.updated_at = datetime.now()

        # Update all affected portfolios
        for portfolio_id in set(p.portfolio_id for p in positions.values()):
            calculate_portfolio_metrics(portfolio_id)


@app.on_event("startup")
async def startup_event():
    """Start background price simulation."""
    asyncio.create_task(simulate_market_prices())


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "assetmind-paper-trading",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "active_portfolios": len(portfolios),
        "open_orders": len([o for o in orders.values() if o.status == OrderStatus.PENDING]),
        "open_positions": len([p for p in positions.values() if p.side != PositionSide.FLAT])
    }


@app.post("/portfolios", response_model=Portfolio, status_code=201)
async def create_portfolio_endpoint(request: PortfolioCreate):
    """Create a new paper trading portfolio."""
    portfolio = create_portfolio(request.name, request.initial_balance, request.base_currency)
    return portfolio


@app.get("/portfolios", response_model=List[Portfolio])
async def list_portfolios(limit: int = Query(default=50, ge=1, le=100)):
    """List all paper trading portfolios."""
    results = list(portfolios.values())
    results.sort(key=lambda x: x.total_value, reverse=True)
    return results[:limit]


@app.get("/portfolios/{portfolio_id}", response_model=Portfolio)
async def get_portfolio(portfolio_id: str):
    """Get a specific portfolio."""
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    calculate_portfolio_metrics(portfolio_id)
    return portfolios[portfolio_id]


@app.post("/portfolios/{portfolio_id}/orders", response_model=PaperOrder, status_code=201)
async def place_order(portfolio_id: str, order: PaperOrder):
    """Place a paper trading order."""
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    portfolio = portfolios[portfolio_id]
    order.portfolio_id = portfolio_id
    order.created_at = datetime.now()

    # Set order ID
    order.order_id = str(uuid.uuid4())
    orders[order.order_id] = order

    # Simulate order execution
    async def execute_order():
        await asyncio.sleep(0.2)

        # Get current market price (simulated)
        base_prices = {"BTCUSDT": 50000, "ETHUSDT": 3000, "SOLUSDT": 100}
        current_price = base_prices.get(order.symbol, 100.0) * (1 + random.uniform(-0.01, 0.01))

        order.filled_price = order.price or current_price
        order.filled_quantity = order.quantity
        order.commission = order.quantity * order.filled_price * 0.001  # 0.1% fee
        order.status = OrderStatus.FILLED
        order.filled_at = datetime.now()

        # Update portfolio balance
        cost = order.quantity * order.filled_price + order.commission
        if order.side == OrderSide.BUY:
            if portfolio.current_balance < cost:
                order.status = OrderStatus.REJECTED
                return

            portfolio.current_balance -= cost

            # Create position
            position = PaperPosition(
                portfolio_id=portfolio_id,
                symbol=order.symbol,
                side=PositionSide.LONG,
                quantity=order.quantity,
                entry_price=order.filled_price,
                current_price=order.filled_price,
                unrealized_pnl=0.0,
                realized_pnl=0.0,
                commission=order.commission,
                opened_at=datetime.now(),
                updated_at=datetime.now()
            )
            positions[position.position_id] = position
        else:
            # Sell - close existing position
            portfolio.current_balance += cost - order.commission
            # Find and close matching long position
            for pos_id, pos in positions.items():
                if pos.portfolio_id == portfolio_id and pos.symbol == order.symbol:
                    pnl = (order.filled_price - pos.entry_price) * pos.quantity - pos.commission
                    pos.side = PositionSide.FLAT
                    pos.realized_pnl = pnl
                    break

        calculate_portfolio_metrics(portfolio_id)

    asyncio.create_task(execute_order())
    return order


@app.get("/portfolios/{portfolio_id}/orders", response_model=List[PaperOrder])
async def list_orders(portfolio_id: str, status: Optional[OrderStatus] = None):
    """List orders for a portfolio."""
    portfolio_orders = [o for o in orders.values() if o.portfolio_id == portfolio_id]

    if status:
        portfolio_orders = [o for o in portfolio_orders if o.status == status]

    portfolio_orders.sort(key=lambda x: x.created_at, reverse=True)
    return portfolio_orders


@app.delete("/portfolios/{portfolio_id}/orders/{order_id}", status_code=204)
async def cancel_order(portfolio_id: str, order_id: str):
    """Cancel a pending order."""
    if order_id not in orders:
        raise HTTPException(status_code=404, detail="Order not found")

    order = orders[order_id]
    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=400, detail="Can only cancel pending orders")

    order.status = OrderStatus.CANCELLED


@app.get("/portfolios/{portfolio_id}/positions", response_model=List[PaperPosition])
async def list_positions(portfolio_id: str):
    """List positions for a portfolio."""
    return [p for p in positions.values()
            if p.portfolio_id == portfolio_id and p.side != PositionSide.FLAT]


@app.get("/portfolios/{portfolio_id}/trades", response_model=List[PaperTrade])
async def list_trades(portfolio_id: str, limit: int = Query(default=50, ge=1, le=100)):
    """List trades for a portfolio."""
    portfolio_trades = [t for t in trades.values() if t.portfolio_id == portfolio_id]
    portfolio_trades.sort(key=lambda x: x.executed_at, reverse=True)
    return portfolio_trades[:limit]


@app.get("/portfolios/{portfolio_id}/transactions", response_model=List[Transaction])
async def list_transactions(portfolio_id: str, limit: int = Query(default=50, ge=1, le=100)):
    """List transactions for a portfolio."""
    if portfolio_id not in transactions:
        return []

    portfolio_transactions = transactions[portfolio_id]
    portfolio_transactions.sort(key=lambda x: x.created_at, reverse=True)
    return portfolio_transactions[:limit]


@app.get("/portfolios/{portfolio_id}/snapshots", response_model=List[PortfolioSnapshot])
async def get_snapshots(portfolio_id: str, limit: int = Query(default=100, ge=1, le=1000)):
    """Get portfolio value snapshots."""
    if portfolio_id not in snapshots:
        return []

    return snapshots[portfolio_id][-limit:]


@app.post("/portfolios/{portfolio_id}/deposit")
async def deposit(portfolio_id: str, amount: float):
    """Deposit funds into portfolio."""
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    portfolio = portfolios[portfolio_id]
    portfolio.current_balance += amount
    portfolio.updated_at = datetime.now()

    transactions[portfolio_id].append(Transaction(
        portfolio_id=portfolio_id,
        type=TransactionType.DEPOSIT,
        amount=amount,
        balance_after=portfolio.current_balance,
        description=f"Deposit of {amount}",
        created_at=datetime.now()
    ))

    return {"success": True, "new_balance": portfolio.current_balance}


@app.post("/portfolios/{portfolio_id}/withdraw")
async def withdraw(portfolio_id: str, amount: float):
    """Withdraw funds from portfolio."""
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    portfolio = portfolios[portfolio_id]
    if amount > portfolio.current_balance:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    portfolio.current_balance -= amount
    portfolio.updated_at = datetime.now()

    transactions[portfolio_id].append(Transaction(
        portfolio_id=portfolio_id,
        type=TransactionType.WITHDRAWAL,
        amount=-amount,
        balance_after=portfolio.current_balance,
        description=f"Withdrawal of {amount}",
        created_at=datetime.now()
    ))

    return {"success": True, "new_balance": portfolio.current_balance}


@app.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = Query(default=20, ge=1, le=100)):
    """Get paper trading leaderboard."""
    entries = []
    for portfolio in portfolios.values():
        calculate_portfolio_metrics(portfolio.portfolio_id)
        total_return = (
            (portfolio.total_value - portfolio.initial_balance) / portfolio.initial_balance * 100
        )
        entries.append(LeaderboardEntry(
            rank=0,  # Will be set after sorting
            portfolio_id=portfolio.portfolio_id,
            name=portfolio.name,
            total_return=total_return,
            sharpe_ratio=random.uniform(0.5, 2.5),
            max_drawdown=random.uniform(5, 20),
            total_trades=portfolio.total_trades
        ))

    entries.sort(key=lambda x: x.total_return, reverse=True)
    for i, entry in enumerate(entries[:limit]):
        entry.rank = i + 1

    return entries[:limit]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5103)
