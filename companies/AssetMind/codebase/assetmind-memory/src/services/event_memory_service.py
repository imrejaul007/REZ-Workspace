"""
Event Memory Service
Stores and retrieves event memories
Port: 5031
"""

from fastapi import FastAPI
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="Event Memory Service", version="1.0.0")


class EventMemoryService:
    """Stores and retrieves event memories"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Event Memory"
        self.port = 5031
        self.events = {}

    async def store_event(
        self,
        asset_id: str,
        event_type: str,
        event_data: Dict[str, Any],
        impact: str = "UNKNOWN"
    ) -> Dict[str, Any]:
        """Store an event memory"""
        event_id = f"evt_{datetime.utcnow().timestamp()}"

        event = {
            "event_id": event_id,
            "asset_id": asset_id,
            "type": event_type,
            "data": event_data,
            "impact": impact,
            "created_at": datetime.utcnow().isoformat(),
        }

        self.events[event_id] = event
        return event

    async def get_events(
        self,
        asset_id: str,
        event_type: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get events for an asset"""
        events = [
            e for e in self.events.values()
            if e["asset_id"] == asset_id
            and (event_type is None or e["type"] == event_type)
        ]
        return sorted(events, key=lambda x: x["created_at"], reverse=True)[:limit]

    async def get_impact(self, asset_id: str) -> Dict[str, Any]:
        """Analyze impact of stored events"""
        events = await self.get_events(asset_id, limit=1000)

        return {
            "asset_id": asset_id,
            "total_events": len(events),
            "by_impact": {
                "HIGH": len([e for e in events if e["impact"] == "HIGH"]),
                "MEDIUM": len([e for e in events if e["impact"] == "MEDIUM"]),
                "LOW": len([e for e in events if e["impact"] == "LOW"]),
                "UNKNOWN": len([e for e in events if e["impact"] == "UNKNOWN"]),
            },
            "by_type": {},
        }


service = EventMemoryService()


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Event Memory", "port": 5031}


@app.post("/api/v1/events")
async def store_event(request: Dict[str, Any]):
    return await service.store_event(
        request["asset_id"],
        request["event_type"],
        request["event_data"],
        request.get("impact", "UNKNOWN")
    )


@app.get("/api/v1/events/{asset_id}")
async def get_events(
    asset_id: str,
    event_type: str = None,
    start_date: str = None,
    end_date: str = None,
    limit: int = 100
):
    return await service.get_events(asset_id, event_type, start_date, end_date, limit)


@app.get("/api/v1/events/{asset_id}/impact")
async def get_impact(asset_id: str):
    return await service.get_impact(asset_id)
