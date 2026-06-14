"""
AssetMind Broker API - Broker Integration Service
Port: 5270
"""

import uuid
from datetime import datetime
from typing import Optional, List
from enum import Enum

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from loguru import logger

app = FastAPI(title="AssetMind Broker API", description="Broker Integration for Real Trading", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class BrokerType(str, Enum):
    ZERODHA = "zerodha"
    UPSTOX = "upstox"
    ANGEL_BROKING = "angel_broking"
    ICICI_DIRECT = "icici_direct"

class OrderStatus(str, Enum):
    PENDING = "pending"
    OPEN = "open"
    COMPLETE = "complete"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"

class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"

class ProductType(str, Enum):
    CNC = "cnc"
    MIS = "mis"
    NRML = "nrml"

# Models
class BrokerCredentials(BaseModel):
    api_key: str
    api_secret: str
    access_token: Optional[str] = None

class BrokerConnection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    broker: BrokerType
    status: str = "disconnected"
    account_id: Optional[str] = None
    connected_at: Optional[datetime] = None
    last_sync: Optional[datetime] = None

class Holding(BaseModel):
    symbol: str
    exchange: str
    quantity: float
    avg_price: float
    current_price: float
    pnl: float
    pnl_percent: float
    day_change: float = 0.0
    day_change_percent: float = 0.0

class Portfolio(BaseModel):
    user_id: str
    broker: BrokerType
    total_value: float
    total_pnl: float
    day_pnl: float = 0.0
    holdings: List[Holding] = []
    cash_balance: float = 0.0
    margin_available: float = 0.0

class Position(BaseModel):
    symbol: str
    exchange: str
    quantity: float
    avg_price: float
    current_price: float
    pnl: float
    product_type: ProductType
    overnight_quantity: float = 0.0

class OrderCreate(BaseModel):
    user_id: str
    symbol: str
    exchange: str = "NSE"
    side: OrderSide
    order_type: OrderType = OrderType.MARKET
    quantity: float = Field(..., gt=0)
    price: Optional[float] = None
    trigger_price: Optional[float] = None
    product_type: ProductType = ProductType.CNC
    validity: str = "DAY"

class Order(BaseModel):
    id: str = Field(default_factory=lambda: f"ord_{uuid.uuid4().hex[:12]}")
    user_id: str
    symbol: str
    exchange: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float] = None
    trigger_price: Optional[float] = None
    status: OrderStatus = OrderStatus.PENDING
    filled_quantity: float = 0.0
    avg_fill_price: Optional[float] = None
    order_timestamp: datetime = Field(default_factory=datetime.utcnow)
    fill_timestamp: Optional[datetime] = None

class Quote(BaseModel):
    symbol: str
    exchange: str
    last_price: float
    open: float
    high: float
    low: float
    close: float
    volume: int
    bid_price: float
    ask_price: float
    bid_quantity: int = 0
    ask_quantity: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class OHLC(BaseModel):
    symbol: str
    exchange: str
    open: float
    high: float
    low: float
    close: float
    volume: int

class MarketSummary(BaseModel):
    indices: List[Quote] = []
    gainers: List[Quote] = []
    losers: List[Quote] = []

# Storage
connections_db: dict[str, BrokerConnection] = {}
orders_db: dict[str, Order] = {}

SAMPLE_QUOTES = {
    "RELIANCE": Quote(symbol="RELIANCE", exchange="NSE", last_price=2856.75, open=2835.0, high=2875.50, low=2830.25, close=2845.00, volume=5234000, bid_price=2856.50, ask_price=2857.00, bid_quantity=100, ask_quantity=150),
    "TCS": Quote(symbol="TCS", exchange="NSE", last_price=4125.80, open=4100.0, high=4145.00, low=4095.50, close=4110.25, volume=2145000, bid_price=4125.50, ask_price=4126.00, bid_quantity=200, ask_quantity=250),
    "INFY": Quote(symbol="INFY", exchange="NSE", last_price=1823.45, open=1810.0, high=1835.00, low=1805.25, close=1815.50, volume=3845000, bid_price=1823.25, ask_price=1823.75, bid_quantity=300, ask_quantity=350),
    "HDFCBANK": Quote(symbol="HDFCBANK", exchange="NSE", last_price=1745.20, open=1735.0, high=1755.00, low=1730.50, close=1740.00, volume=3567000, bid_price=1745.00, ask_price=1745.50, bid_quantity=175, ask_quantity=225),
}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "assetmind-broker-api", "version": "1.0.0", "timestamp": datetime.utcnow().isoformat(), "stats": {"connections": len(connections_db), "orders": len(orders_db)}}

@app.get("/brokers")
async def list_brokers():
    return [{"broker": b.value, "name": b.value.replace("_", " ").title(), "status": "active" if b in [BrokerType.ZERODHA, BrokerType.UPSTOX] else "coming_soon"} for b in BrokerType]

@app.post("/connect/{broker}")
async def connect_broker(broker: BrokerType, user_id: str = Query(...), api_key: str = Query(...), api_secret: str = Query(...)):
    if any(c.user_id == user_id and c.broker == broker for c in connections_db.values()):
        raise HTTPException(status_code=400, detail="Broker already connected")
    conn = BrokerConnection(user_id=user_id, broker=broker, status="connected", account_id=f"ACC_{uuid.uuid4().hex[:8].upper()}", connected_at=datetime.utcnow())
    connections_db[conn.id] = conn
    return {"connection_id": conn.id, "status": conn.status, "account_id": conn.account_id}

@app.post("/disconnect/{user_id}")
async def disconnect_broker(user_id: str):
    conn = next((c for c in connections_db.values() if c.user_id == user_id and c.status == "connected"), None)
    if not conn:
        raise HTTPException(status_code=404, detail="No active connection found")
    conn.status = "disconnected"
    return {"message": "Disconnected successfully"}

@app.get("/portfolio/{user_id}", response_model=Portfolio)
async def get_portfolio(user_id: str):
    conn = next((c for c in connections_db.values() if c.user_id == user_id and c.status == "connected"), None)
    if not conn:
        raise HTTPException(status_code=404, detail="No active broker connection")
    return Portfolio(user_id=user_id, broker=conn.broker, total_value=1500000.0, total_pnl=125000.0, holdings=[Holding(symbol="RELIANCE", exchange="NSE", quantity=100, avg_price=2650.0, current_price=2856.75, pnl=20675.0, pnl_percent=7.8)], cash_balance=250000.0)

@app.get("/positions/{user_id}", response_model=List[Position])
async def get_positions(user_id: str):
    return [Position(symbol="INFY", exchange="NSE", quantity=500, avg_price=1750.0, current_price=1823.45, pnl=36725.0, product_type=ProductType.MIS)]

@app.get("/holdings/{user_id}", response_model=List[Holding])
async def get_holdings(user_id: str):
    conn = next((c for c in connections_db.values() if c.user_id == user_id and c.status == "connected"), None)
    if not conn:
        raise HTTPException(status_code=404, detail="No active broker connection")
    return [Holding(symbol="RELIANCE", exchange="NSE", quantity=100, avg_price=2650.0, current_price=2856.75, pnl=20675.0, pnl_percent=7.8)]

@app.post("/order", response_model=Order, status_code=201)
async def place_order(order: OrderCreate):
    conn = next((c for c in connections_db.values() if c.user_id == order.user_id and c.status == "connected"), None)
    if not conn:
        raise HTTPException(status_code=404, detail="No active broker connection")
    new_order = Order(**order.model_dump())
    orders_db[new_order.id] = new_order
    if order.order_type == OrderType.MARKET:
        new_order.status = OrderStatus.COMPLETE
        new_order.filled_quantity = new_order.quantity
        new_order.avg_fill_price = order.price or 100.0
    return new_order

@app.get("/orders/{user_id}", response_model=List[Order])
async def get_orders(user_id: str, status: Optional[OrderStatus] = None, limit: int = 50):
    orders = [o for o in orders_db.values() if o.user_id == user_id]
    if status:
        orders = [o for o in orders if o.status == status]
    orders.sort(key=lambda x: x.order_timestamp, reverse=True)
    return orders[:limit]

@app.get("/order/{order_id}", response_model=Order)
async def get_order(order_id: str):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")
    return orders_db[order_id]

@app.delete("/order/{order_id}")
async def cancel_order(order_id: str):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")
    order = orders_db[order_id]
    if order.status not in [OrderStatus.PENDING, OrderStatus.OPEN]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel order with status {order.status.value}")
    order.status = OrderStatus.CANCELLED
    return {"message": "Order cancelled", "order_id": order_id}

@app.get("/quote/{symbol}", response_model=Quote)
async def get_quote(symbol: str, exchange: str = "NSE"):
    if symbol.upper() in SAMPLE_QUOTES:
        return SAMPLE_QUOTES[symbol.upper()]
    return Quote(symbol=symbol.upper(), exchange=exchange, last_price=1500.0, open=1490.0, high=1520.0, low=1485.0, close=1495.0, volume=1000000, bid_price=1499.50, ask_price=1500.50, bid_quantity=100, ask_quantity=100)

@app.get("/quotes")
async def get_multiple_quotes(symbols: str = Query(...)):
    return [get_quote(s.strip()) for s in symbols.split(",")]

@app.get("/market/summary", response_model=MarketSummary)
async def get_market_summary():
    indices = [
        Quote(symbol="NIFTY50", exchange="NSE", last_price=23245.50, open=23180.0, high=23300.0, low=23150.0, close=23195.25, volume=45600000, bid_price=23245.00, ask_price=23246.00, bid_quantity=500, ask_quantity=500),
        Quote(symbol="SENSEX", exchange="BSE", last_price=76850.30, open=76700.0, high=77000.0, low=76600.0, close=76750.00, volume=23400000, bid_price=76850.00, ask_price=76851.00, bid_quantity=250, ask_quantity=250),
    ]
    gainers = [Quote(symbol="ADANI", exchange="NSE", last_price=3250.00, open=3180.0, high=3275.00, low=3175.00, close=3185.00, volume=5670000, bid_price=3249.50, ask_price=3250.50, bid_quantity=100, ask_quantity=100)]
    losers = [Quote(symbol="TATA", exchange="NSE", last_price=890.50, open=905.0, high=910.00, low=885.00, close=900.00, volume=4560000, bid_price=890.00, ask_price=891.00, bid_quantity=150, ask_quantity=150)]
    return MarketSummary(indices=indices, gainers=gainers, losers=losers)

@app.get("/ohlc/{symbol}")
async def get_ohlc(symbol: str, exchange: str = "NSE", interval: str = "1d"):
    return OHLC(symbol=symbol.upper(), exchange=exchange, open=1500.0, high=1520.0, low=1485.0, close=1510.0, volume=1000000)

@app.get("/connections/{user_id}")
async def get_connection(user_id: str):
    conn = next((c for c in connections_db.values() if c.user_id == user_id), None)
    if not conn:
        raise HTTPException(status_code=404, detail="No connection found")
    return conn

@app.post("/order/{order_id}/modify")
async def modify_order(order_id: str, new_price: Optional[float] = None, new_quantity: Optional[float] = None):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")
    order = orders_db[order_id]
    if order.status not in [OrderStatus.PENDING, OrderStatus.OPEN]:
        raise HTTPException(status_code=400, detail="Cannot modify order")
    if new_price:
        order.price = new_price
    if new_quantity:
        order.quantity = new_quantity
    return order

@app.get("/orders/{user_id}/statistics")
async def get_order_statistics(user_id: str):
    orders = [o for o in orders_db.values() if o.user_id == user_id]
    total = len(orders)
    completed = sum(1 for o in orders if o.status == OrderStatus.COMPLETE)
    cancelled = sum(1 for o in orders if o.status == OrderStatus.CANCELLED)
    pending = sum(1 for o in orders if o.status == OrderStatus.PENDING)
    return {"total_orders": total, "completed": completed, "cancelled": cancelled, "pending": pending, "completion_rate": round(completed / total * 100, 2) if total > 0 else 0}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5270)