"""
AssetMind - WebSocket Gateway
Port: 5261
Real-time WebSocket connections
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List
import asyncio
import json


app = FastAPI(title="AssetMind WebSocket Gateway", version="1.0.0")


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass


manager = ConnectionManager()


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-websocket",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5261,
        "connections": len(manager.active_connections)
    }


@app.websocket("/ws/prices")
async def websocket_prices(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Send mock price updates
            await websocket.send_json({
                "type": "PRICE_UPDATE",
                "data": {
                    "NVDA": {"price": 878.35, "change": 2.45},
                    "BTC": {"price": 68500, "change": 1250},
                },
                "timestamp": "2026-06-05T12:00:00Z"
            })
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Send mock alerts
            await websocket.send_json({
                "type": "ALERT",
                "data": {
                    "symbol": "NVDA",
                    "alert_type": "PRICE_TARGET",
                    "message": "NVDA approaching price target"
                },
                "timestamp": "2026-06-05T12:00:00Z"
            })
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5261)
