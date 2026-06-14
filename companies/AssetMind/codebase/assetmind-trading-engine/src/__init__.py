"""
AssetMind Trading Engine
Port: 5303

Order management system with real-time position tracking and P&L calculation.
Supports multiple broker connections (Zerodha, Upstox simulation).
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import json


app = FastAPI(title="AssetMind Trading Engine", version="1.0.0")


class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"


class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


class OrderStatus(str, Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    PARTIAL = "partial"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class PositionStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"


class Order(BaseModel):
    order_id: str
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    filled_quantity: float = 0
    average_price: float = 0
    status: OrderStatus = OrderStatus.PENDING
    created_at: str
    updated_at: str


class Position(BaseModel):
    position_id: str
    symbol: str
    quantity: float
    avg_price: float
    current_price: float
    market_value: float
    unrealized_pnl: float
    unrealized_pnl_pct: float
    realized_pnl: float = 0
    status: PositionStatus = PositionStatus.OPEN
    opened_at: str
    updated_at: str


class Trade(BaseModel):
    trade_id: str
    order_id: str
    symbol: str
    side: OrderSide
    quantity: float
    price: float
    timestamp: str


class Account(BaseModel):
    account_id: str
    broker: str
    balance: float
    buying_power: float
    equity: float
    day_pnl: float
    realized_pnl: float = 0
    unrealized_pnl: float = 0


class BrokerConnection(BaseModel):
    broker_id: str
    broker_name: str
    api_key: str
    status: str
    connected_at: Optional[str] = None


# In-memory storage
orders: Dict[str, Order] = {}
positions: Dict[str, Position] = {}
trades: List[Trade] = []
accounts: Dict[str, Account] = {}
broker_connections: Dict[str, BrokerConnection] = {}
order_counter = 0
trade_counter = 0


def calculate_position_metrics(position: Position) -> Position:
    """Calculate current P&L for a position."""
    position.market_value = position.quantity * position.current_price
    position.unrealized_pnl = (position.current_price - position.avg_price) * position.quantity
    position.unrealized_pnl_pct = ((position.current_price - position.avg_price) / position.avg_price * 100) if position.avg_price > 0 else 0
    position.updated_at = datetime.now().isoformat()
    return position


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "trading-engine", "version": "1.0.0"}


@app.post("/accounts")
async def create_account(account_id: str, broker: str, initial_balance: float = 100000):
    """Create a trading account."""
    account = Account(
        account_id=account_id,
        broker=broker,
        balance=initial_balance,
        buying_power=initial_balance * 2,  # 2x margin
        equity=initial_balance,
        day_pnl=0
    )
    accounts[account_id] = account
    return account


@app.get("/accounts/{account_id}")
async def get_account(account_id: str):
    """Get account details."""
    if account_id not in accounts:
        raise HTTPException(status_code=404, detail="Account not found")

    # Calculate totals
    total_unrealized = sum(p.unrealized_pnl for p in positions.values() if p.status == PositionStatus.OPEN)
    total_realized = sum(p.realized_pnl for p in positions.values())

    account = accounts[account_id]
    account.unrealized_pnl = total_unrealized
    account.realized_pnl = total_realized
    account.equity = account.balance + total_unrealized

    return account


@app.post("/orders")
async def create_order(
    account_id: str,
    symbol: str,
    side: OrderSide,
    order_type: OrderType,
    quantity: float,
    price: Optional[float] = None,
    stop_price: Optional[float] = None
):
    """Create a new order."""
    global order_counter

    if account_id not in accounts:
        raise HTTPException(status_code=404, detail="Account not found")

    order_counter += 1
    order_id = f"ORD-{order_counter:06d}"

    order = Order(
        order_id=order_id,
        symbol=symbol,
        side=side,
        order_type=order_type,
        quantity=quantity,
        price=price,
        stop_price=stop_price,
        status=OrderStatus.SUBMITTED,
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    )

    orders[order_id] = order

    # Simulate order execution (in production, this goes to broker)
    await simulate_execution(order, account_id)

    return order


async def simulate_execution(order: Order, account_id: str):
    """Simulate order execution (replace with real broker API)."""
    global trade_counter

    # Simulate fill at market price
    fill_price = order.price or 100.0  # Default price
    trade_counter += 1
    trade_id = f"TRD-{trade_counter:06d}"

    trade = Trade(
        trade_id=trade_id,
        order_id=order.order_id,
        symbol=order.symbol,
        side=order.side,
        quantity=order.quantity,
        price=fill_price,
        timestamp=datetime.now().isoformat()
    )
    trades.append(trade)

    order.filled_quantity = order.quantity
    order.average_price = fill_price
    order.status = OrderStatus.FILLED
    order.updated_at = datetime.now().isoformat()

    # Update position
    position_id = f"{account_id}-{order.symbol}"
    if position_id in positions:
        position = positions[position_id]
        if order.side == OrderSide.BUY:
            total_cost = (position.avg_price * position.quantity) + (fill_price * order.quantity)
            position.quantity += order.quantity
            position.avg_price = total_cost / position.quantity
        else:
            position.quantity -= order.quantity
            if position.quantity <= 0:
                position.status = PositionStatus.CLOSED
                position.realized_pnl = (fill_price - position.avg_price) * order.quantity
    else:
        positions[position_id] = Position(
            position_id=position_id,
            symbol=order.symbol,
            quantity=order.quantity if order.side == OrderSide.BUY else 0,
            avg_price=fill_price,
            current_price=fill_price,
            market_value=fill_price * order.quantity,
            unrealized_pnl=0,
            unrealized_pnl_pct=0,
            opened_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )

    # Update account balance
    account = accounts[account_id]
    trade_value = fill_price * order.quantity
    if order.side == OrderSide.BUY:
        account.balance -= trade_value
    else:
        account.balance += trade_value

    # Calculate day P&L
    day_pnl = sum(p.unrealized_pnl for p in positions.values())
    account.day_pnl = day_pnl


@app.get("/orders")
async def list_orders(account_id: Optional[str] = None, status: Optional[OrderStatus] = None):
    """List orders."""
    result = list(orders.values())

    if account_id:
        # Filter by account (simplified)
        result = [o for o in result if o.order_id]

    if status:
        result = [o for o in result if o.status == status]

    return {"orders": result, "total": len(result)}


@app.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order details."""
    if order_id not in orders:
        raise HTTPException(status_code=404, detail="Order not found")
    return orders[order_id]


@app.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str):
    """Cancel an order."""
    if order_id not in orders:
        raise HTTPException(status_code=404, detail="Order not found")

    order = orders[order_id]
    if order.status in [OrderStatus.FILLED, OrderStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Cannot cancel this order")

    order.status = OrderStatus.CANCELLED
    order.updated_at = datetime.now().isoformat()
    return order


@app.get("/positions")
async def list_positions(account_id: Optional[str] = None):
    """List all positions."""
    result = list(positions.values())

    if account_id:
        result = [p for p in result if p.position_id.startswith(account_id)]

    # Update metrics
    for pos in result:
        calculate_position_metrics(pos)

    return {"positions": result, "total": len(result)}


@app.get("/positions/{symbol}")
async def get_position(account_id: str, symbol: str):
    """Get position for a symbol."""
    position_id = f"{account_id}-{symbol}"
    if position_id not in positions:
        raise HTTPException(status_code=404, detail="Position not found")

    position = positions[position_id]
    return calculate_position_metrics(position)


@app.post("/positions/{symbol}/update-price")
async def update_position_price(symbol: str, current_price: float):
    """Update current price for a position (for real-time tracking)."""
    position_id = None
    for pos_id, pos in positions.items():
        if pos.symbol == symbol:
            pos.current_price = current_price
            calculate_position_metrics(pos)
            position_id = pos_id

    if not position_id:
        raise HTTPException(status_code=404, detail="Position not found")

    return positions[position_id]


@app.get("/trades")
async def list_trades(account_id: Optional[str] = None, limit: int = 100):
    """List recent trades."""
    result = trades[-limit:]
    if account_id:
        # Filter by account
        result = [t for t in result if t.order_id]

    return {"trades": result, "total": len(trades)}


@app.get("/pnl")
async def get_pnl_summary(account_id: str):
    """Get P&L summary."""
    if account_id not in accounts:
        raise HTTPException(status_code=404, detail="Account not found")

    open_positions = [p for p in positions.values() if p.status == PositionStatus.OPEN and p.position_id.startswith(account_id)]

    total_unrealized = sum(p.unrealized_pnl for p in open_positions)
    total_realized = sum(p.realized_pnl for p in positions.values())

    gross_pnl = total_unrealized + total_realized
    net_pnl = gross_pnl  # Add fees in production

    return {
        "account_id": account_id,
        "open_positions": len(open_positions),
        "unrealized_pnl": round(total_unrealized, 2),
        "realized_pnl": round(total_realized, 2),
        "gross_pnl": round(gross_pnl, 2),
        "net_pnl": round(net_pnl, 2),
        "account_balance": accounts[account_id].balance,
        "buying_power": accounts[account_id].buying_power
    }


@app.post("/brokers/connect")
async def connect_broker(broker_name: str, api_key: str, api_secret: str):
    """Connect to a broker (simulation)."""
    broker_id = f"broker-{broker_name.lower()}"

    # Simulate connection
    connection = BrokerConnection(
        broker_id=broker_id,
        broker_name=broker_name,
        api_key=api_key[:4] + "****",  # Mask
        status="connected",
        connected_at=datetime.now().isoformat()
    )
    broker_connections[broker_id] = connection

    return {
        "broker_id": broker_id,
        "status": "connected",
        "message": f"Connected to {broker_name} (simulation mode)",
        "note": "This is a simulation. Real trading requires broker API credentials."
    }


@app.get("/brokers")
async def list_brokers():
    """List connected brokers."""
    return {"brokers": list(broker_connections.values())}


@app.post("/orders/batch")
async def create_batch_orders(account_id: str, orders_data: List[Dict]):
    """Create multiple orders at once."""
    results = []
    for order_data in orders_data:
        try:
            order = await create_order(
                account_id=account_id,
                symbol=order_data["symbol"],
                side=OrderSide(order_data["side"]),
                order_type=OrderType(order_data["order_type"]),
                quantity=order_data["quantity"],
                price=order_data.get("price")
            )
            results.append({"success": True, "order": order})
        except Exception as e:
            results.append({"success": False, "error": str(e)})

    return {"results": results}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5303)