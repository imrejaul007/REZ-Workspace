"""
WebSocket Gateway Service
WebSocket handler for real-time AssetMind services
Port: 5261
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Set
from datetime import datetime
from enum import Enum
import logging
import json
import asyncio
from collections import defaultdict

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind WebSocket Gateway", version="1.0.0")


class MessageType(str, Enum):
    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"
    BROADCAST = "broadcast"
    DIRECT = "direct"
    HEARTBEAT = "heartbeat"
    ERROR = "error"
    ACK = "ack"


class WSMessage(BaseModel):
    type: MessageType
    channel: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Channel(BaseModel):
    name: str
    description: str
    subscribers: Set[str] = set()
    message_count: int = 0
    created_at: datetime


class WebSocketGatewayService:
    """WebSocket gateway service for real-time communication"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "WebSocket Gateway"
        self.port = 5261
        self.version = "1.0.0"
        self.started_at = datetime.utcnow()

        # Active connections
        self._connections: Dict[str, WebSocket] = {}
        self._connection_metadata: Dict[str, Dict[str, Any]] = {}
        self._connection_count = 0

        # Channels
        self._channels: Dict[str, Channel] = {}
        self._user_channels: Dict[str, Set[str]] = defaultdict(set)

        # Initialize default channels
        self._initialize_default_channels()

        # Message handlers
        self._handlers: Dict[MessageType, callable] = {}

    def _initialize_default_channels(self):
        """Initialize default channels"""
        default_channels = [
            ("market-data", "Real-time market data and price updates"),
            ("predictions", "Prediction updates and alerts"),
            ("portfolio", "Portfolio updates and notifications"),
            ("news", "Breaking news and market updates"),
            ("alerts", "System alerts and warnings"),
            ("trades", "Trade execution updates"),
            ("risk", "Risk metrics and alerts"),
            ("briefings", "Daily briefing updates")
        ]

        for name, description in default_channels:
            self._channels[name] = Channel(
                name=name,
                description=description,
                subscribers=set(),
                message_count=0,
                created_at=datetime.utcnow()
            )

    def _generate_connection_id(self) -> str:
        """Generate unique connection ID"""
        self._connection_count += 1
        timestamp = datetime.utcnow().timestamp()
        return f"conn_{timestamp}_{self._connection_count}"

    def _generate_message_id(self) -> str:
        """Generate unique message ID"""
        return f"msg_{datetime.utcnow().timestamp()}_{id(self)}"

    async def connect(
        self,
        websocket: WebSocket,
        user_id: Optional[str] = None,
        metadata: Dict[str, Any] = None
    ) -> str:
        """Accept and register a new WebSocket connection"""
        await websocket.accept()

        connection_id = self._generate_connection_id()
        self._connections[connection_id] = websocket
        self._connection_metadata[connection_id] = {
            "user_id": user_id,
            "metadata": metadata or {},
            "connected_at": datetime.utcnow(),
            "channels": set(),
            "message_count": 0
        }

        logger.info(f"New WebSocket connection: {connection_id}")
        return connection_id

    async def disconnect(self, connection_id: str):
        """Handle connection disconnect"""
        if connection_id in self._connections:
            # Unsubscribe from all channels
            for channel_name in self._connection_metadata.get(connection_id, {}).get("channels", set()):
                await self.unsubscribe(connection_id, channel_name)

            del self._connections[connection_id]
            if connection_id in self._connection_metadata:
                del self._connection_metadata[connection_id]

            logger.info(f"WebSocket disconnected: {connection_id}")

    async def subscribe(self, connection_id: str, channel: str) -> bool:
        """Subscribe connection to a channel"""
        if connection_id not in self._connections:
            return False

        if channel not in self._channels:
            # Create channel if it doesn't exist
            self._channels[channel] = Channel(
                name=channel,
                description=f"Custom channel: {channel}",
                subscribers=set(),
                message_count=0,
                created_at=datetime.utcnow()
            )

        self._channels[channel].subscribers.add(connection_id)
        self._user_channels[connection_id].add(channel)
        self._connection_metadata[connection_id]["channels"].add(channel)

        logger.info(f"Connection {connection_id} subscribed to {channel}")
        return True

    async def unsubscribe(self, connection_id: str, channel: str) -> bool:
        """Unsubscribe connection from a channel"""
        if channel in self._channels:
            self._channels[channel].subscribers.discard(connection_id)

        if connection_id in self._user_channels:
            self._user_channels[connection_id].discard(channel)

        if connection_id in self._connection_metadata:
            self._connection_metadata[connection_id]["channels"].discard(channel)

        logger.info(f"Connection {connection_id} unsubscribed from {channel}")
        return True

    async def broadcast(
        self,
        channel: str,
        message: Dict[str, Any],
        exclude: Optional[str] = None
    ):
        """Broadcast message to channel subscribers"""
        if channel not in self._channels:
            return

        message_id = self._generate_message_id()
        payload = {
            "type": "broadcast",
            "channel": channel,
            "message_id": message_id,
            "data": message,
            "timestamp": datetime.utcnow().isoformat()
        }

        disconnected = []
        for connection_id in self._channels[channel].subscribers:
            if connection_id == exclude:
                continue

            if connection_id in self._connections:
                try:
                    await self._connections[connection_id].send_json(payload)
                    self._channels[channel].message_count += 1
                    if connection_id in self._connection_metadata:
                        self._connection_metadata[connection_id]["message_count"] += 1
                except Exception as e:
                    logger.error(f"Failed to send to {connection_id}: {e}")
                    disconnected.append(connection_id)

        # Clean up disconnected
        for conn_id in disconnected:
            await self.disconnect(conn_id)

    async def send_to_connection(
        self,
        connection_id: str,
        message: Dict[str, Any]
    ):
        """Send message to specific connection"""
        if connection_id not in self._connections:
            return False

        try:
            await self._connections[connection_id].send_json(message)
            if connection_id in self._connection_metadata:
                self._connection_metadata[connection_id]["message_count"] += 1
            return True
        except Exception as e:
            logger.error(f"Failed to send to {connection_id}: {e}")
            await self.disconnect(connection_id)
            return False

    async def handle_message(
        self,
        connection_id: str,
        message: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle incoming WebSocket message"""
        msg_type = message.get("type")
        channel = message.get("channel")
        payload = message.get("payload", {})

        if msg_type == MessageType.SUBSCRIBE.value:
            if channel:
                success = await self.subscribe(connection_id, channel)
                return {
                    "type": "ack",
                    "action": "subscribe",
                    "channel": channel,
                    "success": success
                }

        elif msg_type == MessageType.UNSUBSCRIBE.value:
            if channel:
                success = await self.unsubscribe(connection_id, channel)
                return {
                    "type": "ack",
                    "action": "unsubscribe",
                    "channel": channel,
                    "success": success
                }

        elif msg_type == MessageType.BROADCAST.value:
            if channel:
                await self.broadcast(channel, payload, exclude=connection_id)
                return {
                    "type": "ack",
                    "action": "broadcast",
                    "channel": channel
                }

        elif msg_type == MessageType.HEARTBEAT.value:
            return {
                "type": "heartbeat",
                "timestamp": datetime.utcnow().isoformat()
            }

        return {
            "type": "error",
            "message": "Unknown message type"
        }

    async def get_channels(self) -> List[Dict[str, Any]]:
        """Get all channels"""
        return [
            {
                "name": channel.name,
                "description": channel.description,
                "subscriber_count": len(channel.subscribers),
                "message_count": channel.message_count,
                "created_at": channel.created_at.isoformat()
            }
            for channel in self._channels.values()
        ]

    async def get_connection_info(self, connection_id: str) -> Optional[Dict[str, Any]]:
        """Get connection information"""
        if connection_id not in self._connection_metadata:
            return None

        metadata = self._connection_metadata[connection_id]
        return {
            "connection_id": connection_id,
            "user_id": metadata.get("user_id"),
            "metadata": metadata.get("metadata"),
            "connected_at": metadata.get("connected_at").isoformat(),
            "channels": list(metadata.get("channels", set())),
            "message_count": metadata.get("message_count", 0)
        }

    async def get_metrics(self) -> Dict[str, Any]:
        """Get gateway metrics"""
        return {
            "total_connections": len(self._connections),
            "total_channels": len(self._channels),
            "total_messages": sum(ch.message_count for ch in self._channels.values()),
            "uptime_seconds": (datetime.utcnow() - self.started_at).total_seconds(),
            "channels": {
                name: {
                    "subscribers": len(channel.subscribers),
                    "message_count": channel.message_count
                }
                for name, channel in self._channels.items()
            }
        }


service = WebSocketGatewayService()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "uptime_seconds": (datetime.utcnow() - service.started_at).total_seconds(),
        "active_connections": len(service._connections),
        "total_channels": len(service._channels)
    }


@app.get("/api/v1/channels")
async def get_channels():
    """Get all channels"""
    return await service.get_channels()


@app.get("/api/v1/connections/{connection_id}")
async def get_connection_info(connection_id: str):
    """Get connection information"""
    info = await service.get_connection_info(connection_id)
    if not info:
        raise HTTPException(status_code=404, detail="Connection not found")
    return info


@app.get("/api/v1/metrics")
async def get_metrics():
    """Get gateway metrics"""
    return await service.get_metrics()


@app.post("/api/v1/broadcast")
async def broadcast_message(request: Dict[str, Any]):
    """Broadcast message to a channel"""
    channel = request["channel"]
    message = request["message"]

    await service.broadcast(channel, message)

    return {
        "success": True,
        "channel": channel,
        "subscriber_count": len(service._channels.get(channel, Channel(name="", description="")).subscribers)
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, user_id: str = Query(None)):
    """WebSocket endpoint"""
    connection_id = await service.connect(websocket, user_id)

    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "connection_id": connection_id,
            "channels": list(service._channels.keys()),
            "timestamp": datetime.utcnow().isoformat()
        })

        while True:
            # Receive message
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                response = await service.handle_message(connection_id, message)
                await websocket.send_json(response)
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON"
                })

    except WebSocketDisconnect:
        await service.disconnect(connection_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await service.disconnect(connection_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5261)