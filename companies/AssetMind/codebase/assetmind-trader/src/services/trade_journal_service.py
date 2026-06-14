"""
Trade Journal Service
User trading journal
Port: 5210
"""

from fastapi import FastAPI
from typing import Dict, List, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="Trade Journal Service", version="1.0.0")


class TradeJournalService:
    """Trade journal for users"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Trade Journal"
        self.port = 5210
        self.trades = {}

    async def add_trade(
        self,
        user_id: str,
        trade_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Add a trade to journal"""
        trade_id = f"trade_{datetime.utcnow().timestamp()}"
        trade = {
            "trade_id": trade_id,
            "user_id": user_id,
            **trade_data,
            "created_at": datetime.utcnow().isoformat(),
        }
        self.trades[trade_id] = trade
        return trade

    async def get_trades(
        self,
        user_id: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get user's trades"""
        return [t for t in self.trades.values() if t["user_id"] == user_id][:limit]


service = TradeJournalService()


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Trade Journal", "port": 5210}


@app.post("/api/v1/trades")
async def add_trade(request: Dict[str, Any]):
    return await service.add_trade(request["user_id"], request["trade_data"])


@app.get("/api/v1/trades/{user_id}")
async def get_trades(user_id: str, limit: int = 100):
    return await service.get_trades(user_id, limit)