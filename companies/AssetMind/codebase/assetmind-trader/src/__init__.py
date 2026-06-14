"""
AssetMind - Trader Service
Port: 5150

Trading execution and order management service.
Handles order routing, execution, and portfolio updates.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


app = FastAPI(title="AssetMind Trader Service", version="1.0.0")


class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"


class OrderStatus(str, Enum):
    PENDING = "pending"
    FILLED = "filled"
    PARTIAL = "partial"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class Order(BaseModel):
    order_id: str
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    status: OrderStatus
    filled_quantity: float = 0
    avg_fill_price: float = 0
    created_at: datetime
    updated_at: datetime


class OrderRequest(BaseModel):
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None


class Position(BaseModel):
    symbol: str
    quantity: float
    avg_cost: float
    current_price: float
    unrealized_pnl: float
    unrealized_pnl_percent: float


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-trader",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5150
    }


# In-memory order storage
orders: Dict[str, Order] = {}
positions: Dict[str, Position] = {}


@app.post("/orders", status_code=201)
async def create_order(request: OrderRequest):
    """Create a new trading order"""
    order_id = str(uuid.uuid4())

    # Validate
    if request.order_type in [OrderType.LIMIT, OrderType.STOP_LIMIT] and not request.price:
        raise HTTPException(status_code=400, detail="Limit orders require price")
    if request.order_type in [OrderType.STOP, OrderType.STOP_LIMIT] and not request.stop_price:
        raise HTTPException(status_code=400, detail="Stop orders require stop_price")

    order = Order(
        order_id=order_id,
        symbol=request.symbol,
        side=request.side,
        order_type=request.order_type,
        quantity=request.quantity,
        price=request.price,
        stop_price=request.stop_price,
        status=OrderStatus.PENDING,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    orders[order_id] = order

    # Simulate immediate fill for market orders
    if request.order_type == OrderType.MARKET:
        order.status = OrderStatus.FILLED
        order.filled_quantity = order.quantity
        order.avg_fill_price = order.price or 100.0  # Mock price
        order.updated_at = datetime.utcnow()

        # Update position
        if order.symbol not in positions:
            positions[order.symbol] = Position(
                symbol=order.symbol,
                quantity=order.filled_quantity if order.side == OrderSide.BUY else -order.filled_quantity,
                avg_cost=order.avg_fill_price,
                current_price=order.avg_fill_price,
                unrealized_pnl=0,
                unrealized_pnl_percent=0
            )
        else:
            pos = positions[order.symbol]
            if order.side == OrderSide.BUY:
                total_qty = pos.quantity + order.filled_quantity
                pos.avg_cost = (pos.avg_cost * pos.quantity + order.avg_fill_price * order.filled_quantity) / total_qty
                pos.quantity = total_qty
            else:
                pos.quantity -= order.filled_quantity

    return order


@app.get("/orders/{order_id}")
async def get_order(order_id: str):
    if order_id not in orders:
        raise HTTPException(status_code=404, detail="Order not found")
    return orders[order_id]


@app.get("/orders")
async def list_orders(
    symbol: Optional[str] = None,
    status: Optional[OrderStatus] = None,
    limit: int = 100
):
    result = list(orders.values())
    if symbol:
        result = [o for o in result if o.symbol == symbol]
    if status:
        result = [o for o in result if o.status == status]
    return {"orders": result[:limit], "total": len(result)}


@app.delete("/orders/{order_id}")
async def cancel_order(order_id: str):
    if order_id not in orders:
        raise HTTPException(status_code=404, detail="Order not found")

    order = orders[order_id]
    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=400, detail="Can only cancel pending orders")

    order.status = OrderStatus.CANCELLED
    order.updated_at = datetime.utcnow()
    return {"message": "Order cancelled", "order": order}


@app.get("/positions")
async def list_positions():
    """Get all current positions"""
    return {"positions": list(positions.values())}


@app.get("/positions/{symbol}")
async def get_position(symbol: str):
    if symbol not in positions:
        raise HTTPException(status_code=404, detail="Position not found")
    return positions[symbol]


@app.get("/portfolio/summary")
async def get_portfolio_summary():
    """Get portfolio summary"""
    total_value = sum(p.quantity * p.current_price for p in positions.values())
    total_cost = sum(abs(p.quantity) * p.avg_cost for p in positions.values())
    total_pnl = total_value - total_cost

    return {
        "total_value": total_value,
        "total_cost": total_cost,
        "total_pnl": total_pnl,
        "total_pnl_percent": (total_pnl / total_cost * 100) if total_cost > 0 else 0,
        "positions_count": len(positions),
        "updated_at": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5150)