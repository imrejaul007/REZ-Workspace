"""
AssetMind - Broker API Service
Port: 5270

Broker integration for real trading execution.

Supports:
- Zerodha
- Upstox
- Angel Broking
- ICICI Direct

Version: 1.0.0
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum

app = FastAPI(title="AssetMind Broker API")

# ============================================================================
# MODELS
# ============================================================================

class Broker(str, Enum):
    ZERODHA = "zerodha"
    UPSTOX = "upstox"
    ANGEL = "angel_broking"
    ICICI = "icici_direct"

class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    BRACKET = "bracket"

class Side(str, Enum):
    BUY = "buy"
    SELL = "sell"

class OrderStatus(str, Enum):
    PENDING = "pending"
    EXECUTED = "executed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

class Order(BaseModel):
    order_id: str
    symbol: str
    side: Side
    quantity: int
    order_type: OrderType
    price: Optional[float] = None
    status: OrderStatus
    timestamp: str
    broker: Broker
    filled_quantity: int = 0
    average_price: Optional[float] = None

class Portfolio(BaseModel):
    user_id: str
    broker: Broker
    holdings: List[Dict]
    cash: float
    total_value: float

class Position(BaseModel):
    symbol: str
    quantity: int
    average_price: float
    current_price: float
    pnl: float
    pnl_percent: float

# ============================================================================
# BROKER MOCK DATA
# ============================================================================

MOCK_HOLDINGS = {
    "user_1": [
        {"symbol": "NVDA", "quantity": 10, "avg_price": 85000, "current_price": 92000},
        {"symbol": "AAPL", "quantity": 5, "avg_price": 175000, "current_price": 185000},
        {"symbol": "MSFT", "quantity": 8, "avg_price": 380000, "current_price": 425000},
    ]
}

MOCK_POSITIONS = [
    {"symbol": "NVDA", "quantity": 10, "avg_price": 85000, "current_price": 92000},
    {"symbol": "AAPL", "quantity": 5, "avg_price": 175000, "current_price": 185000},
]

# ============================================================================
# ROUTES
# ============================================================================

@app.get("/health")
async def health():
    return {
        "service": "broker-api",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5270,
        "supported_brokers": [b.value for b in Broker]
    }

@app.get("/brokers")
async def list_brokers():
    return {
        "brokers": [
            {"id": "zerodha", "name": "Zerodha", "status": "active"},
            {"id": "upstox", "name": "Upstox", "status": "active"},
            {"id": "angel_broking", "name": "Angel Broking", "status": "coming_soon"},
            {"id": "icici_direct", "name": "ICICI Direct", "status": "coming_soon"},
        ]
    }

@app.post("/connect/{broker}")
async def connect_broker(broker: Broker, api_key: str, api_secret: str):
    """
    Connect a broker account.
    """
    if broker not in [Broker.ZERODHA, Broker.UPSTOX]:
        raise HTTPException(status_code=400, detail="Broker not supported")

    return {
        "status": "connected",
        "broker": broker.value,
        "account_id": f"acc_{datetime.utcnow().timestamp()}",
        "message": f"Successfully connected to {broker.value}"
    }

@app.get("/portfolio/{user_id}", response_model=Portfolio)
async def get_portfolio(user_id: str, broker: Broker = Broker.ZERODHA) -> Portfolio:
    """
    Get portfolio from broker.
    """
    holdings = MOCK_HOLDINGS.get(user_id, MOCK_HOLDINGS["user_1"])

    total_value = sum(h["quantity"] * h["current_price"] for h in holdings)
    cash = 50000  # Mock cash

    return Portfolio(
        user_id=user_id,
        broker=broker,
        holdings=holdings,
        cash=cash,
        total_value=total_value + cash
    )

@app.get("/positions/{user_id}")
async def get_positions(user_id: str):
    """
    Get current positions.
    """
    holdings = MOCK_HOLDINGS.get(user_id, MOCK_HOLDINGS["user_1"])

    positions = []
    for h in holdings:
        pnl = (h["current_price"] - h["avg_price"]) * h["quantity"]
        pnl_pct = ((h["current_price"] - h["avg_price"]) / h["avg_price"]) * 100

        positions.append(Position(
            symbol=h["symbol"],
            quantity=h["quantity"],
            average_price=h["avg_price"],
            current_price=h["current_price"],
            pnl=pnl,
            pnl_percent=round(pnl_pct, 2)
        ))

    return {"positions": positions}

@app.get("/holdings/{user_id}")
async def get_holdings(user_id: str):
    """
    Get holdings with P&L.
    """
    holdings = MOCK_HOLDINGS.get(user_id, MOCK_HOLDINGS["user_1"])

    result = []
    for h in holdings:
        pnl = (h["current_price"] - h["avg_price"]) * h["quantity"]
        result.append({
            "symbol": h["symbol"],
            "quantity": h["quantity"],
            "avg_price": h["avg_price"],
            "current_price": h["current_price"],
            "invested": h["avg_price"] * h["quantity"],
            "current_value": h["current_price"] * h["quantity"],
            "pnl": pnl,
            "pnl_percent": round((pnl / (h["avg_price"] * h["quantity"])) * 100, 2)
        })

    return {"holdings": result}

@app.post("/order")
async def place_order(
    user_id: str,
    symbol: str,
    side: Side,
    quantity: int,
    order_type: OrderType = OrderType.MARKET,
    price: Optional[float] = None,
    broker: Broker = Broker.ZERODHA
) -> Order:
    """
    Place a trading order.
    """
    order_id = f"ord_{datetime.utcnow().timestamp()}"

    return Order(
        order_id=order_id,
        symbol=symbol,
        side=side,
        quantity=quantity,
        order_type=order_type,
        price=price,
        status=OrderStatus.EXECUTED,
        timestamp=datetime.utcnow().isoformat(),
        broker=broker,
        filled_quantity=quantity,
        average_price=price or 100000  # Mock price
    )

@app.get("/orders/{user_id}")
async def get_orders(user_id: str, limit: int = 10):
    """
    Get order history.
    """
    return {
        "orders": [
            Order(
                order_id="ord_1",
                symbol="NVDA",
                side=Side.BUY,
                quantity=10,
                order_type=OrderType.MARKET,
                status=OrderStatus.EXECUTED,
                timestamp=datetime.utcnow().isoformat(),
                broker=Broker.ZERODHA,
                filled_quantity=10,
                average_price=92000
            )
        ]
    }

@app.delete("/order/{order_id}")
async def cancel_order(order_id: str):
    """
    Cancel an order.
    """
    return {
        "order_id": order_id,
        "status": "cancelled",
        "message": "Order cancelled successfully"
    }

@app.get("/quote/{symbol}")
async def get_quote(symbol: str):
    """
    Get live quote from broker.
    """
    return {
        "symbol": symbol,
        "ltp": 92000,  # Last traded price
        "change": 1500,
        "change_percent": 1.66,
        "volume": 45000000,
        "bid": 91950,
        "ask": 92050,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/quote/batch")
async def get_batch_quotes(symbols: str):
    """
    Get quotes for multiple symbols.
    """
    symbol_list = symbols.split(",")

    return {
        "quotes": [
            {
                "symbol": s.strip(),
                "ltp": 92000,
                "change": 1500,
                "change_percent": 1.66
            }
            for s in symbol_list
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5270)
