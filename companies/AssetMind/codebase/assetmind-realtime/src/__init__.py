"""
AssetMind - Real-Time Layer
Port: 5299

WebSocket streaming for live market data.

Features:
- Real-time price updates
- Alert streaming
- Portfolio tracking
- Trade execution streaming

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime
from enum import Enum
import asyncio
import json
import random


app = FastAPI(title="AssetMind Real-Time Layer", version="1.0.0")


# =============================================================================
# MODELS
# =============================================================================

class AlertPriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class MarketEvent(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: float
    volume: Optional[float] = None
    timestamp: datetime


class Alert(BaseModel):
    alert_id: str
    symbol: str
    priority: AlertPriority
    message: str
    triggered_at: datetime


class TradeUpdate(BaseModel):
    trade_id: str
    symbol: str
    side: str
    quantity: float
    price: float
    status: str


# =============================================================================
# WEBSOCKET MANAGER
# =============================================================================

class ConnectionManager:
    """Manages WebSocket connections"""

    def __init__(self):
        # Active connections
        self.active_connections: List[WebSocket] = []

        # Subscriptions
        self.price_subscribers: Dict[str, Set[WebSocket]] = {}
        self.alert_subscribers: Set[WebSocket] = set()
        self.portfolio_subscribers: Set[WebSocket] = set()
        self.trade_subscribers: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        # Remove from all subscriptions
        for symbol in self.price_subscribers:
            self.price_subscribers[symbol].discard(websocket)
        self.alert_subscribers.discard(websocket)
        self.portfolio_subscribers.discard(websocket)
        self.trade_subscribers.discard(websocket)

    async def send_personal(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

    async def broadcast_to_subscribers(self, message: str, subscribers: Set[WebSocket]):
        for connection in subscribers:
            try:
                await connection.send_text(message)
            except:
                pass

    def subscribe_price(self, symbol: str, websocket: WebSocket):
        if symbol not in self.price_subscribers:
            self.price_subscribers[symbol] = set()
        self.price_subscribers[symbol].add(websocket)

    def unsubscribe_price(self, symbol: str, websocket: WebSocket):
        if symbol in self.price_subscribers:
            self.price_subscribers[symbol].discard(websocket)

    def subscribe_alerts(self, websocket: WebSocket):
        self.alert_subscribers.add(websocket)

    def subscribe_portfolio(self, websocket: WebSocket):
        self.portfolio_subscribers.add(websocket)

    def subscribe_trades(self, websocket: WebSocket):
        self.trade_subscribers.add(websocket)


manager = ConnectionManager()


# =============================================================================
# MOCK DATA STREAMS
# =============================================================================

SYMBOLS = ["NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "AMD"]

PRICES = {
    "NVDA": 920.0,
    "AAPL": 185.0,
    "MSFT": 420.0,
    "GOOGL": 175.0,
    "AMZN": 195.0,
    "META": 520.0,
    "TSLA": 175.0,
    "AMD": 165.0
}


async def price_stream():
    """Stream simulated price updates"""
    while True:
        for symbol in SYMBOLS:
            # Random price movement
            change = random.uniform(-2, 2)
            PRICES[symbol] += change

            event = {
                "type": "price_update",
                "data": {
                    "symbol": symbol,
                    "price": round(PRICES[symbol], 2),
                    "change": round(change, 2),
                    "change_percent": round(change / PRICES[symbol] * 100, 2),
                    "timestamp": datetime.utcnow().isoformat()
                }
            }

            # Broadcast to subscribers
            if symbol in manager.price_subscribers:
                await manager.broadcast_to_subscribers(
                    json.dumps(event),
                    manager.price_subscribers[symbol]
                )

            # Broadcast to all (if enabled)
            if manager.alert_subscribers:
                await manager.broadcast_to_subscribers(
                    json.dumps(event),
                    manager.alert_subscribers
                )

        await asyncio.sleep(2)  # Update every 2 seconds


async def alert_stream():
    """Stream simulated alerts"""
    alerts = [
        ("NVDA", "critical", "Earnings in 1 hour"),
        ("AAPL", "high", "Price target reached"),
        ("MSFT", "medium", "Analyst upgrade"),
        ("TSLA", "low", "Volume spike detected"),
    ]

    while True:
        alert_data = random.choice(alerts)

        alert = {
            "type": "alert",
            "data": {
                "alert_id": f"alert_{random.randint(1000, 9999)}",
                "symbol": alert_data[0],
                "priority": alert_data[1],
                "message": alert_data[2],
                "triggered_at": datetime.utcnow().isoformat()
            }
        }

        if manager.alert_subscribers:
            await manager.broadcast_to_subscribers(
                json.dumps(alert),
                manager.alert_subscribers
            )

        await asyncio.sleep(10)  # Alert every 10 seconds


# Start background streams
@app.on_event("startup")
async def start_streams():
    asyncio.create_task(price_stream())
    asyncio.create_task(alert_stream())


# =============================================================================
# HTTP ENDPOINTS
# =============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-realtime",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5299,
        "active_connections": len(manager.active_connections)
    }


@app.get("/prices/{symbol}")
async def get_current_price(symbol: str):
    if symbol.upper() not in PRICES:
        raise HTTPException(status_code=404, detail="Symbol not found")

    return {
        "symbol": symbol.upper(),
        "price": round(PRICES[symbol.upper()], 2),
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/prices")
async def get_all_prices():
    return {
        "prices": {symbol: round(price, 2) for symbol, price in PRICES.items()},
        "timestamp": datetime.utcnow().isoformat()
    }


# =============================================================================
# WEBSOCKET ENDPOINTS
# =============================================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Main WebSocket endpoint"""
    await manager.connect(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            msg_type = message.get("type")

            if msg_type == "subscribe_price":
                symbol = message.get("symbol", "").upper()
                manager.subscribe_price(symbol, websocket)
                await websocket.send_json({
                    "type": "subscribed",
                    "channel": f"price:{symbol}"
                })

            elif msg_type == "unsubscribe_price":
                symbol = message.get("symbol", "").upper()
                manager.unsubscribe_price(symbol, websocket)
                await websocket.send_json({
                    "type": "unsubscribed",
                    "channel": f"price:{symbol}"
                })

            elif msg_type == "subscribe_alerts":
                manager.subscribe_alerts(websocket)
                await websocket.send_json({
                    "type": "subscribed",
                    "channel": "alerts"
                })

            elif msg_type == "subscribe_portfolio":
                manager.subscribe_portfolio(websocket)
                await websocket.send_json({
                    "type": "subscribed",
                    "channel": "portfolio"
                })

            elif msg_type == "subscribe_trades":
                manager.subscribe_trades(websocket)
                await websocket.send_json({
                    "type": "subscribed",
                    "channel": "trades"
                })

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.websocket("/ws/prices")
async def websocket_prices(websocket: WebSocket):
    """Dedicated price WebSocket"""
    await manager.connect(websocket)
    symbol = "ALL"

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "subscribe":
                symbol = message.get("symbol", "ALL").upper()

            # Send current prices
            await websocket.send_json({
                "type": "prices",
                "data": {s: round(PRICES[s], 2) for s in PRICES}
            })

    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """Dedicated alerts WebSocket"""
    await manager.connect(websocket)
    manager.subscribe_alerts(websocket)

    try:
        while True:
            await websocket.receive_text()  # Keep connection alive

    except WebSocketDisconnect:
        manager.disconnect(websocket)


# =============================================================================
# SSE ENDPOINTS (Server-Sent Events)
# =============================================================================

from fastapi.responses import StreamingResponse

@app.get("/sse/prices")
async def sse_prices(symbols: Optional[str] = None):
    """SSE stream of price updates"""

    async def event_generator():
        symbol_list = symbols.split(",") if symbols else SYMBOLS

        while True:
            for symbol in symbol_list:
                price = PRICES.get(symbol.upper(), 0)
                change = random.uniform(-1, 1)
                price += change
                PRICES[symbol.upper()] = price

                event = f"data: {json.dumps({
                    'symbol': symbol.upper(),
                    'price': round(price, 2),
                    'change': round(change, 2),
                    'timestamp': datetime.utcnow().isoformat()
                })}\n\n"
                yield event

            await asyncio.sleep(2)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.get("/sse/alerts")
async def sse_alerts():
    """SSE stream of alerts"""
    alerts = [
        ("NVDA", "critical", "Price alert triggered"),
        ("AAPL", "high", "News alert"),
        ("MSFT", "medium", "Analyst action"),
    ]

    async def event_generator():
        while True:
            alert = random.choice(alerts)
            event = f"data: {json.dumps({
                'alert_id': f'alert_{random.randint(1000, 9999)}',
                'symbol': alert[0],
                'priority': alert[1],
                'message': alert[2],
                'timestamp': datetime.utcnow().isoformat()
            })}\n\n"
            yield event
            await asyncio.sleep(15)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5299)