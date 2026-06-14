"""
AssetMind Trading Engine
Real-time trading execution service
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import uuid
import asyncio
import json

app = FastAPI(
    title="AssetMind Trading Engine",
    description="Real-time trading execution engine",
    version="1.0.0"
)


# Enums
class OrderStatus(str, Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    PARTIAL = "partial"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    EXPIRED = "expired"


class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    STOP_LIMIT = "stop_limit"
    TRAILING_STOP = "trailing_stop"


class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


class PositionStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    LIQUIDATING = "liquidating"


class TimeInForce(str, Enum):
    DAY = "day"
    GTC = "gtc"  # Good Till Cancel
    IOC = "ioc"  # Immediate Or Cancel
    FOK = "fok"  # Fill Or Kill


# Pydantic Models
class OrderRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    side: OrderSide
    order_type: OrderType
    quantity: float = Field(..., gt=0)
    price: Optional[float] = Field(default=None, gt=0)
    stop_price: Optional[float] = Field(default=None, gt=0)
    time_in_force: TimeInForce = TimeInForce.DAY
    client_order_id: Optional[str] = None
    reduce_only: bool = False
    tags: Dict[str, str] = Field(default_factory=dict)

    @validator("price")
    def validate_price(cls, v, values):
        if values.get("order_type") in [OrderType.LIMIT, OrderType.STOP_LIMIT]:
            if v is None:
                raise ValueError(f"Price required for {values.get('order_type')} orders")
        return v


class OrderResponse(BaseModel):
    order_id: str
    client_order_id: Optional[str]
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    filled_quantity: float
    price: Optional[float]
    avg_fill_price: Optional[float]
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    error: Optional[str] = None


class Position(BaseModel):
    position_id: str
    symbol: str
    side: OrderSide
    quantity: float
    entry_price: float
    current_price: float
    unrealized_pnl: float
    realized_pnl: float
    leverage: int
    margin: float
    liquidation_price: Optional[float]
    status: PositionStatus
    opened_at: datetime
    updated_at: datetime


class AccountBalance(BaseModel):
    asset: str
    free: float
    locked: float
    total: float
    unrealized_pnl: float
    margin_used: float
    margin_available: float


class TradeExecution(BaseModel):
    execution_id: str
    order_id: str
    symbol: str
    side: OrderSide
    price: float
    quantity: float
    commission: float
    commission_asset: str
    executed_at: datetime


class MarketData(BaseModel):
    symbol: str
    price: float
    bid: float
    ask: float
    volume_24h: float
    change_24h: float
    high_24h: float
    low_24h: float
    timestamp: datetime


class RiskLimits(BaseModel):
    max_position_size: float = 100000
    max_order_size: float = 50000
    max_daily_loss: float = 10000
    max_leverage: int = 10
    min_margin_ratio: float = 0.1


class WebSocketMessage(BaseModel):
    type: str
    data: Dict[str, Any]
    timestamp: datetime


# In-memory storage
orders: Dict[str, OrderResponse] = {}
positions: Dict[str, Position] = {}
balances: Dict[str, AccountBalance] = {}
ws_connections: List[WebSocket] = []


def generate_sample_balance():
    """Initialize sample account balances."""
    return {
        "USDT": AccountBalance(
            asset="USDT", free=100000, locked=0, total=100000,
            unrealized_pnl=0, margin_used=0, margin_available=100000
        ),
        "BTC": AccountBalance(
            asset="BTC", free=1.5, locked=0, total=1.5,
            unrealized_pnl=0, margin_used=0, margin_available=1.5
        ),
        "ETH": AccountBalance(
            asset="ETH", free=10.0, locked=0, total=10.0,
            unrealized_pnl=0, margin_used=0, margin_available=10.0
        )
    }


balances = generate_sample_balance()


def calculate_pnl(position: Position, current_price: float) -> float:
    """Calculate unrealized PnL for a position."""
    if position.side == OrderSide.BUY:
        return (current_price - position.entry_price) * position.quantity
    else:
        return (position.entry_price - current_price) * position.quantity


def broadcast_update(message: dict):
    """Broadcast message to all connected WebSocket clients."""
    for connection in ws_connections:
        try:
            asyncio.create_task(connection.send_json(message))
        except:
            pass


# Routes
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "assetmind-trading-engine",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "active_orders": len([o for o in orders.values() if o.status not in [OrderStatus.FILLED, OrderStatus.CANCELLED]]),
        "open_positions": len([p for p in positions.values() if p.status == PositionStatus.OPEN])
    }


@app.post("/orders", response_model=OrderResponse, status_code=201)
async def create_order(request: OrderRequest, background_tasks: BackgroundTasks):
    """Submit a new order."""
    order_id = str(uuid.uuid4())
    now = datetime.now()

    order = OrderResponse(
        order_id=order_id,
        client_order_id=request.client_order_id,
        symbol=request.symbol,
        side=request.side,
        order_type=request.order_type,
        quantity=request.quantity,
        filled_quantity=0.0,
        price=request.price,
        avg_fill_price=None,
        status=OrderStatus.PENDING,
        created_at=now,
        updated_at=now
    )
    orders[order_id] = order

    async def execute_order():
        await asyncio.sleep(0.5)

        if order.order_type == OrderType.MARKET:
            fill_price = order.price or 100.0
            order.filled_quantity = order.quantity
            order.avg_fill_price = fill_price
            order.status = OrderStatus.FILLED
        else:
            order.status = OrderStatus.SUBMITTED

        order.updated_at = datetime.now()

        # Broadcast order update
        broadcast_update({
            "type": "order_update",
            "data": order.model_dump()
        })

    background_tasks.add_task(execute_order)
    return order


@app.get("/orders", response_model=List[OrderResponse])
async def list_orders(
    symbol: Optional[str] = None,
    status: Optional[OrderStatus] = None,
    limit: int = Field(default=50, ge=1, le=100),
    offset: int = Field(default=0, ge=0)
):
    """List all orders with optional filtering."""
    results = list(orders.values())

    if symbol:
        results = [o for o in results if o.symbol == symbol]
    if status:
        results = [o for o in results if o.status == status]

    results.sort(key=lambda x: x.created_at, reverse=True)
    return results[offset:offset + limit]


@app.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str):
    """Get a specific order by ID."""
    if order_id not in orders:
        raise HTTPException(status_code=404, detail="Order not found")
    return orders[order_id]


@app.delete("/orders/{order_id}", response_model=OrderResponse)
async def cancel_order(order_id: str):
    """Cancel an order."""
    if order_id not in orders:
        raise HTTPException(status_code=404, detail="Order not found")

    order = orders[order_id]
    if order.status in [OrderStatus.FILLED, OrderStatus.CANCELLED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel order with status: {order.status}"
        )

    order.status = OrderStatus.CANCELLED
    order.updated_at = datetime.now()

    broadcast_update({
        "type": "order_cancelled",
        "data": {"order_id": order_id}
    })

    return order


@app.post("/orders/batch", response_model=List[OrderResponse], status_code=201)
async def create_batch_orders(requests: List[OrderRequest]):
    """Submit multiple orders in a batch."""
    results = []
    for request in requests:
        order = await create_order(request, BackgroundTasks())
        results.append(order)
    return results


@app.get("/positions", response_model=List[Position])
async def list_positions(symbol: Optional[str] = None):
    """List all open positions."""
    results = [p for p in positions.values() if p.status == PositionStatus.OPEN]

    if symbol:
        results = [p for p in results if p.symbol == symbol]

    return results


@app.get("/positions/{position_id}", response_model=Position)
async def get_position(position_id: str):
    """Get a specific position."""
    if position_id not in positions:
        raise HTTPException(status_code=404, detail="Position not found")
    return positions[position_id]


@app.post("/positions/{position_id}/close", response_model=Position)
async def close_position(position_id: str):
    """Close a position."""
    if position_id not in positions:
        raise HTTPException(status_code=404, detail="Position not found")

    position = positions[position_id]
    if position.status != PositionStatus.OPEN:
        raise HTTPException(status_code=400, detail="Position is not open")

    position.status = PositionStatus.CLOSED
    position.updated_at = datetime.now()

    broadcast_update({
        "type": "position_closed",
        "data": {"position_id": position_id}
    })

    return position


@app.get("/account/balance", response_model=List[AccountBalance])
async def get_account_balance():
    """Get account balances."""
    return list(balances.values())


@app.get("/account/balance/{asset}", response_model=AccountBalance)
async def get_asset_balance(asset: str):
    """Get balance for a specific asset."""
    if asset not in balances:
        raise HTTPException(status_code=404, detail="Asset not found")
    return balances[asset]


@app.get("/market/{symbol}", response_model=MarketData)
async def get_market_data(symbol: str):
    """Get current market data for a symbol."""
    import random
    base_price = 100.0 if "USDT" not in symbol else 50000.0

    return MarketData(
        symbol=symbol,
        price=base_price * (1 + random.uniform(-0.02, 0.02)),
        bid=base_price * 0.999,
        ask=base_price * 1.001,
        volume_24h=random.uniform(1000000, 10000000),
        change_24h=random.uniform(-5, 5),
        high_24h=base_price * 1.05,
        low_24h=base_price * 0.95,
        timestamp=datetime.now()
    )


@app.get("/risk/limits", response_model=RiskLimits)
async def get_risk_limits():
    """Get current risk limits."""
    return RiskLimits()


@app.put("/risk/limits", response_model=RiskLimits)
async def update_risk_limits(limits: RiskLimits):
    """Update risk limits."""
    return limits


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await websocket.accept()
    ws_connections.append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "subscribe":
                symbol = message.get("symbol")
                await websocket.send_json({
                    "type": "subscribed",
                    "symbol": symbol
                })
    except WebSocketDisconnect:
        ws_connections.remove(websocket)


@app.get("/executions", response_model=List[TradeExecution])
async def list_executions(
    order_id: Optional[str] = None,
    limit: int = Field(default=50, ge=1, le=100)
):
    """List trade executions."""
    return []


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5102)
