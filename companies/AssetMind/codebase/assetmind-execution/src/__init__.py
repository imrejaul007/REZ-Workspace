"""
AssetMind - Execution Service
Port: 5160

Trade execution and order management service.
Handles order routing, execution algorithms, and fills.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import uuid
import asyncio


app = FastAPI(title="AssetMind Execution Service", version="1.0.0")


class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"
    TRAILING_STOP = "trailing_stop"
    TWAP = "twap"      # Time-weighted average price
    VWAP = "vwap"      # Volume-weighted average price


class OrderStatus(str, Enum):
    PENDING = "pending"
    ROUTING = "routing"
    PARTIAL = "partial"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    EXPIRED = "expired"


class ExecutionAlgo(str, Enum):
    MARKET = "market"
    VWAP = "vwap"
    TWAP = "twap"
    POV = "pov"          # Percentage of volume
    IS = "is"            # Implementation shortfall


class Order(BaseModel):
    order_id: str
    client_order_id: Optional[str] = None
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    filled_quantity: float = 0
    price: Optional[float] = None
    stop_price: Optional[float] = None
    algo: Optional[ExecutionAlgo] = None
    status: OrderStatus
    avg_fill_price: float = 0
    commission: float = 0
    created_at: datetime
    updated_at: datetime
    filled_at: Optional[datetime] = None


class OrderRequest(BaseModel):
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    algo: Optional[ExecutionAlgo] = None
    time_in_force: str = "DAY"  # DAY, GTC, IOC, FOK
    client_order_id: Optional[str] = None


class Fill(BaseModel):
    fill_id: str
    order_id: str
    symbol: str
    side: OrderSide
    quantity: float
    price: float
    commission: float
    timestamp: datetime


# In-memory storage
orders: Dict[str, Order] = {}
fills: List[Fill] = []


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-execution",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5160,
        "pending_orders": len([o for o in orders.values() if o.status in [OrderStatus.PENDING, OrderStatus.ROUTING]])
    }


# ============================================================================
# Order Management
# ============================================================================

@app.post("/orders", status_code=201)
async def create_order(request: OrderRequest):
    """Create a new order"""
    order_id = str(uuid.uuid4())

    # Validate
    if request.order_type in [OrderType.LIMIT, OrderType.STOP_LIMIT] and not request.price:
        raise HTTPException(status_code=400, detail="Limit orders require price")
    if request.order_type in [OrderType.STOP, OrderType.STOP_LIMIT] and not request.stop_price:
        raise HTTPException(status_code=400, detail="Stop orders require stop_price")

    order = Order(
        order_id=order_id,
        client_order_id=request.client_order_id,
        symbol=request.symbol.upper(),
        side=request.side,
        order_type=request.order_type,
        quantity=request.quantity,
        price=request.price,
        stop_price=request.stop_price,
        algo=request.algo,
        status=OrderStatus.PENDING,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    orders[order_id] = order

    # Simulate order processing
    asyncio.create_task(process_order(order_id))

    return order


async def process_order(order_id: str):
    """Simulate order execution"""
    order = orders.get(order_id)
    if not order:
        return

    order.status = OrderStatus.ROUTING
    order.updated_at = datetime.utcnow()

    # Simulate delay
    await asyncio.sleep(0.5)

    # Simulate fill
    if order.order_type == OrderType.MARKET:
        order.status = OrderStatus.FILLED
        order.filled_quantity = order.quantity
        order.avg_fill_price = order.price or 100.0
        order.filled_at = datetime.utcnow()

        fills.append(Fill(
            fill_id=str(uuid.uuid4()),
            order_id=order_id,
            symbol=order.symbol,
            side=order.side,
            quantity=order.quantity,
            price=order.avg_fill_price,
            commission=order.quantity * order.avg_fill_price * 0.001,
            timestamp=datetime.utcnow()
        ))

    order.updated_at = datetime.utcnow()


@app.get("/orders/{order_id}")
async def get_order(order_id: str):
    if order_id not in orders:
        raise HTTPException(status_code=404, detail="Order not found")
    return orders[order_id]


@app.get("/orders")
async def list_orders(
    symbol: Optional[str] = None,
    status: Optional[OrderStatus] = None,
    side: Optional[OrderSide] = None,
    limit: int = 100
):
    result = list(orders.values())

    if symbol:
        result = [o for o in result if o.symbol == symbol.upper()]
    if status:
        result = [o for o in result if o.status == status]
    if side:
        result = [o for o in result if o.side == side]

    result.sort(key=lambda o: o.created_at, reverse=True)

    return {"orders": result[:limit], "total": len(result)}


@app.delete("/orders/{order_id}")
async def cancel_order(order_id: str):
    if order_id not in orders:
        raise HTTPException(status_code=404, detail="Order not found")

    order = orders[order_id]
    if order.status not in [OrderStatus.PENDING, OrderStatus.ROUTING]:
        raise HTTPException(status_code=400, detail="Cannot cancel this order")

    order.status = OrderStatus.CANCELLED
    order.updated_at = datetime.utcnow()

    return {"order_id": order_id, "status": "cancelled"}


@app.patch("/orders/{order_id}/modify")
async def modify_order(order_id: str, quantity: Optional[float] = None, price: Optional[float] = None):
    """Modify an existing order"""
    if order_id not in orders:
        raise HTTPException(status_code=404, detail="Order not found")

    order = orders[order_id]
    if order.status not in [OrderStatus.PENDING]:
        raise HTTPException(status_code=400, detail="Cannot modify this order")

    if quantity:
        order.quantity = quantity
    if price:
        order.price = price

    order.updated_at = datetime.utcnow()

    return {"order_id": order_id, "modified": True}


# ============================================================================
# Fills
# ============================================================================

@app.get("/fills")
async def list_fills(symbol: Optional[str] = None, limit: int = 100):
    result = fills.copy()

    if symbol:
        result = [f for f in result if f.symbol == symbol.upper()]

    result.sort(key=lambda f: f.timestamp, reverse=True)

    return {"fills": result[:limit], "total": len(result)}


@app.get("/fills/order/{order_id}")
async def get_order_fills(order_id: str):
    order_fills = [f for f in fills if f.order_id == order_id]
    return {"fills": order_fills}


# ============================================================================
# Execution Analytics
# ============================================================================

@app.get("/analytics/execution-quality")
async def get_execution_quality():
    """Get execution quality metrics"""
    if not fills:
        return {"message": "No fills to analyze"}

    total_commission = sum(f.commission for f in fills)
    avg_commission = total_commission / len(fills)

    return {
        "total_fills": len(fills),
        "total_volume": sum(f.quantity for f in fills),
        "total_commission": total_commission,
        "avg_commission_per_fill": avg_commission,
        "avg_slippage_bps": 2.5,  # Mock
        "fill_rate": 0.98
    }


@app.get("/analytics/broker-performance")
async def get_broker_performance():
    """Get broker execution performance"""
    return {
        "brokers": [
            {
                "broker": "Broker A",
                "fill_rate": 0.99,
                "avg_slippage": 1.8,
                "avg_latency_ms": 45
            },
            {
                "broker": "Broker B",
                "fill_rate": 0.97,
                "avg_slippage": 2.2,
                "avg_latency_ms": 52
            }
        ]
    }


# ============================================================================
# Batch Orders
# ============================================================================

@app.post("/orders/batch")
async def create_batch_orders(requests: List[OrderRequest]):
    """Create multiple orders"""
    order_ids = []

    for req in requests:
        order_id = str(uuid.uuid4())
        order = Order(
            order_id=order_id,
            symbol=req.symbol.upper(),
            side=req.side,
            order_type=req.order_type,
            quantity=req.quantity,
            price=req.price,
            stop_price=req.stop_price,
            algo=req.algo,
            status=OrderStatus.PENDING,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        orders[order_id] = order
        order_ids.append(order_id)

        asyncio.create_task(process_order(order_id))

    return {"order_ids": order_ids, "created": len(order_ids)}


# ============================================================================
# Smart Order Routing
# ============================================================================

@app.get("/routing/estimate/{symbol}")
async def get_routing_estimate(symbol: str, quantity: float, side: OrderSide):
    """Get routing estimate for an order"""
    return {
        "symbol": symbol.upper(),
        "quantity": quantity,
        "side": side.value,
        "estimated_price": 100.50,  # Mock
        "estimated_slippage_bps": 2.0,
        "available_routes": [
            {"route": "NASDAQ", "available": True, "estimated_slippage": 1.5},
            {"route": "NYSE", "available": True, "estimated_slippage": 2.5},
            {"route": "DARK", "available": True, "estimated_slippage": 0.5}
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5160)