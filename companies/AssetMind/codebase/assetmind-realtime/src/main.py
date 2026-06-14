"""
AssetMind Real-Time Service
WebSocket & SSE streaming for live market updates
Port: 5299
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Set
from datetime import datetime
from enum import Enum
import json
import asyncio
import logging
import random
from collections import defaultdict

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AssetMind Real-Time Service",
    version="1.0.0",
    docs_url="/docs",
    description="Real-time streaming for prices, alerts, and portfolio updates"
)


class SubscriptionType(str, Enum):
    PRICE = "price"
    ALERTS = "alerts"
    PORTFOLIO = "portfolio"
    NEWS = "news"
    ORDER_BOOK = "order_book"


class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class PriceUpdate(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: float
    volume: int
    timestamp: datetime
    bid: Optional[float] = None
    ask: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None


class Alert(BaseModel):
    alert_id: str
    symbol: str
    alert_type: str
    severity: AlertSeverity
    message: str
    price: Optional[float] = None
    target_price: Optional[float] = None
    created_at: datetime


class PortfolioUpdate(BaseModel):
    portfolio_id: str
    symbol: str
    quantity: float
    avg_cost: float
    current_value: float
    pnl: float
    pnl_percent: float
    timestamp: datetime


class ConnectionManager:
    """Manages WebSocket connections and subscriptions"""

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = defaultdict(list)
        self.subscriptions: Dict[WebSocket, Set[str]] = defaultdict(set)
        self.price_cache: Dict[str, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        self.active_connections[client_id].append(websocket)
        logger.info(f"Client {client_id} connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket, client_id: str):
        """Remove a WebSocket connection"""
        if client_id in self.active_connections:
            self.active_connections[client_id] = [
                ws for ws in self.active_connections[client_id] if ws != websocket
            ]
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]
        if websocket in self.subscriptions:
            del self.subscriptions[websocket]
        logger.info(f"Client {client_id} disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any], channel: str = None):
        """Broadcast message to all subscribed connections"""
        disconnected = []

        for client_id, connections in self.active_connections.items():
            for websocket in connections:
                if channel and channel not in self.subscriptions.get(websocket, set()):
                    continue

                try:
                    await websocket.send_json(message)
                except Exception:
                    disconnected.append((client_id, websocket))

        # Clean up disconnected clients
        for client_id, websocket in disconnected:
            self.disconnect(websocket, client_id)


class RealTimeService:
    """Core real-time market data service"""

    def __init__(self):
        self.name = "Real-Time Service"
        self.port = 5299
        self.version = "1.0.0"
        self.manager = ConnectionManager()
        self._alert_count = 0
        self._symbols = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "NVDA", "META"]

    def _generate_price_update(self, symbol: str) -> Dict[str, Any]:
        """Generate simulated price update"""
        base_prices = {
            "AAPL": 175.0, "GOOGL": 140.0, "MSFT": 380.0,
            "AMZN": 180.0, "TSLA": 250.0, "NVDA": 500.0, "META": 500.0
        }
        base_price = base_prices.get(symbol.upper(), 100.0)

        # Simulate price movement
        change_percent = random.uniform(-2, 2)
        price = base_price * (1 + change_percent / 100)
        change = price - base_price

        return {
            "type": "price_update",
            "symbol": symbol.upper(),
            "price": round(price, 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
            "volume": random.randint(1000000, 50000000),
            "timestamp": datetime.utcnow().isoformat(),
            "bid": round(price * 0.999, 2),
            "ask": round(price * 1.001, 2),
            "high": round(price * 1.02, 2),
            "low": round(price * 0.98, 2)
        }

    def _generate_alert(self, symbol: str) -> Dict[str, Any]:
        """Generate simulated alert"""
        self._alert_count += 1
        alert_types = ["PRICE_TARGET", "VOLUME_SPIKE", "NEWS", "TECHNICAL", "BREAKOUT"]
        severities = [AlertSeverity.LOW, AlertSeverity.MEDIUM, AlertSeverity.HIGH]

        return {
            "type": "alert",
            "alert_id": f"alert_{datetime.utcnow().timestamp()}_{self._alert_count}",
            "symbol": symbol.upper(),
            "alert_type": random.choice(alert_types),
            "severity": random.choice(severities).value,
            "message": f"Alert triggered for {symbol.upper()}",
            "price": round(random.uniform(50, 500), 2),
            "created_at": datetime.utcnow().isoformat()
        }

    async def start_price_stream(self, symbols: List[str]):
        """Start streaming price updates"""
        while True:
            for symbol in symbols:
                update = self._generate_price_update(symbol)
                await self.manager.broadcast(update, channel=f"price_{symbol}")
            await asyncio.sleep(random.uniform(1, 3))

    async def get_price(self, symbol: str) -> Dict[str, Any]:
        """Get current price for a symbol"""
        return self._generate_price_update(symbol)

    async def get_batch_prices(self, symbols: List[str]) -> List[Dict[str, Any]]:
        """Get current prices for multiple symbols"""
        return [self._generate_price_update(s) for s in symbols]

    async def create_alert(
        self,
        symbol: str,
        alert_type: str,
        target_price: Optional[float] = None,
        severity: AlertSeverity = AlertSeverity.MEDIUM
    ) -> Dict[str, Any]:
        """Create a new alert"""
        alert = self._generate_alert(symbol)
        alert["alert_type"] = alert_type
        alert["severity"] = severity.value
        if target_price:
            alert["target_price"] = target_price

        # Broadcast to alert subscribers
        await self.manager.broadcast(alert, channel="alerts")
        return alert

    async def get_active_alerts(self, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all active alerts"""
        alerts = []
        for _ in range(random.randint(2, 8)):
            symbol_choice = symbol or random.choice(self._symbols)
            alerts.append(self._generate_alert(symbol_choice))
        return alerts


# Initialize service
service = RealTimeService()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "active_connections": len(service.manager.active_connections)
    }


@app.get("/")
async def root():
    """Root endpoint with service info"""
    return {
        "service": "AssetMind Real-Time Service",
        "version": service.version,
        "port": service.port,
        "endpoints": {
            "websocket": "/ws",
            "sse_prices": "/sse/prices",
            "sse_alerts": "/sse/alerts",
            "health": "/health"
        }
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Main WebSocket endpoint for real-time updates"""
    client_id = f"client_{datetime.utcnow().timestamp()}"

    await service.manager.connect(websocket, client_id)

    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "client_id": client_id,
            "message": "Connected to AssetMind Real-Time Service"
        })

        while True:
            # Receive message from client
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                msg_type = message.get("type", "")

                if msg_type == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})

                elif msg_type == "subscribe_price":
                    symbol = message.get("symbol", "").upper()
                    if symbol:
                        service.manager.subscriptions[websocket].add(f"price_{symbol}")
                        await websocket.send_json({
                            "type": "subscribed",
                            "channel": f"price_{symbol}"
                        })

                elif msg_type == "subscribe_alerts":
                    service.manager.subscriptions[websocket].add("alerts")
                    await websocket.send_json({
                        "type": "subscribed",
                        "channel": "alerts"
                    })

                elif msg_type == "unsubscribe":
                    channel = message.get("channel")
                    if channel and channel in service.manager.subscriptions[websocket]:
                        service.manager.subscriptions[websocket].remove(channel)

                elif msg_type == "get_price":
                    symbol = message.get("symbol", "").upper()
                    if symbol:
                        price_data = await service.get_price(symbol)
                        await websocket.send_json(price_data)

                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown message type: {msg_type}"
                    })

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON"
                })

    except WebSocketDisconnect:
        service.manager.disconnect(websocket, client_id)
        logger.info(f"Client {client_id} disconnected")


async def price_event_generator(symbols: List[str]):
    """Generate SSE events for price updates"""
    while True:
        for symbol in symbols:
            update = service._generate_price_update(symbol)
            yield f"data: {json.dumps(update)}\n\n"
        await asyncio.sleep(random.uniform(1, 3))


@app.get("/sse/prices")
async def sse_prices(symbols: str = Query("AAPL,GOOGL,MSFT")):
    """Server-Sent Events stream for price updates"""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    return StreamingResponse(
        price_event_generator(symbol_list),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.get("/sse/alerts")
async def sse_alerts():
    """Server-Sent Events stream for alerts"""
    async def alert_generator():
        while True:
            alert = service._generate_alert(random.choice(service._symbols))
            yield f"data: {json.dumps(alert)}\n\n"
            await asyncio.sleep(random.uniform(5, 15))

    return StreamingResponse(
        alert_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )


@app.get("/api/v1/price/{symbol}")
async def get_price(symbol: str):
    """REST endpoint to get current price"""
    return await service.get_price(symbol.upper())


@app.post("/api/v1/prices/batch")
async def get_batch_prices(symbols: List[str]):
    """REST endpoint to get multiple prices"""
    return await service.get_batch_prices([s.upper() for s in symbols])


@app.post("/api/v1/alerts")
async def create_alert(
    symbol: str,
    alert_type: str,
    target_price: Optional[float] = None,
    severity: AlertSeverity = AlertSeverity.MEDIUM
):
    """Create a new alert"""
    return await service.create_alert(symbol.upper(), alert_type, target_price, severity)


@app.get("/api/v1/alerts")
async def get_alerts(symbol: Optional[str] = None):
    """Get all active alerts"""
    return await service.get_active_alerts(symbol.upper() if symbol else None)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5299)