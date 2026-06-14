"""
Asset Memory Service - HOJAI Memory Platform Integration
Long-term memory for asset events and data
Port: 5030

This service integrates with HOJAI Memory Platform (port 4540) to store EVERYTHING forever
and enable cross-domain reasoning. It provides:
- Universal memory storage (remember/recall/profile/reason)
- Cross-LLM memory sharing
- Deep search and retrieval
- Memory profiling
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
import asyncio
import httpx
import json
from enum import Enum

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Asset Memory Service", version="2.0.0", docs_url="/docs")


class MemoryType(str, Enum):
    """Types of memories"""
    PRICE_HISTORY = "price_history"
    NEWS_EVENT = "news_event"
    EARNINGS = "earnings"
    ANALYST_RATING = "analyst_rating"
    MACRO_EVENT = "macro_event"
    PORTFOLIO_CHANGE = "portfolio_change"
    PREDICTION = "prediction"
    OUTCOME = "outcome"
    CORRELATION = "correlation"
    THEME = "theme"
    RISK_EVENT = "risk_event"
    CUSTOM = "custom"


class MemoryRequest(BaseModel):
    """Request to store a memory"""
    asset_id: str
    memory_type: MemoryType
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)


class MemoryResponse(BaseModel):
    """Response from memory operations"""
    memory_id: str
    asset_id: str
    memory_type: str
    content: str
    created_at: str
    confidence: float = 1.0


class AssetProfile(BaseModel):
    """Comprehensive asset profile from memories"""
    asset_id: str
    total_memories: int
    memory_types: List[str]
    first_memory: Optional[str] = None
    latest_memory: Optional[str] = None
    key_events: List[Dict[str, Any]] = Field(default_factory=list)
    correlations: List[Dict[str, Any]] = Field(default_factory=list)
    themes: List[str] = Field(default_factory=list)


class HOJAIMemoryConnector:
    """
    Connector to HOJAI Memory Platform.

    HOJAI Memory Platform provides:
    - Unified Memory API (port 4540)
    - Cross-LLM memory sharing
    - Deep search and retrieval
    - Memory profiling
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.hojai_base_url = self.config.get("hojai_url", os.getenv("HOJAI_MEMORY_URL", "http://localhost:4540"))
        self.api_key = self.config.get("hojai_api_key", "")
        self._http_client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get HTTP client"""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=30.0)
        return self._http_client

    async def health_check(self) -> Dict[str, Any]:
        """Check HOJAI Memory Platform health"""
        try:
            client = await self._get_client()
            response = await client.get(f"{self.hojai_base_url}/health")
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logger.warning(f"HOJAI Memory Platform not available: {e}")

        return {"status": "unavailable", "fallback": "local_storage"}

    async def remember(
        self,
        user_id: str,
        content: str,
        memory_type: str,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Store a memory in HOJAI Memory Platform.

        Uses the Unified Memory API:
        POST /api/v1/remember
        """
        try:
            client = await self._get_client()
            payload = {
                "user_id": user_id,
                "content": content,
                "type": memory_type,
                "metadata": metadata or {},
                "timestamp": datetime.utcnow().isoformat()
            }

            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            response = await client.post(
                f"{self.hojai_base_url}/api/v1/remember",
                json=payload,
                headers=headers
            )

            if response.status_code == 200:
                return response.json()

        except Exception as e:
            logger.warning(f"HOJAI remember failed: {e}")

        # Fallback to local storage
        return {
            "memory_id": f"local_{datetime.utcnow().timestamp()}",
            "user_id": user_id,
            "content": content,
            "type": memory_type,
            "stored_at": datetime.utcnow().isoformat(),
            "source": "local_fallback"
        }

    async def recall(
        self,
        user_id: str,
        query: str,
        memory_type: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Recall memories from HOJAI Memory Platform.

        Uses the Unified Memory API:
        POST /api/v1/recall
        """
        try:
            client = await self._get_client()
            payload = {
                "user_id": user_id,
                "query": query,
                "type": memory_type,
                "limit": limit
            }

            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            response = await client.post(
                f"{self.hojai_base_url}/api/v1/recall",
                json=payload,
                headers=headers
            )

            if response.status_code == 200:
                data = response.json()
                return data.get("memories", [])

        except Exception as e:
            logger.warning(f"HOJAI recall failed: {e}")

        return []

    async def profile(
        self,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Get comprehensive user/asset profile from HOJAI Memory Platform.

        Uses the Unified Memory API:
        POST /api/v1/profile
        """
        try:
            client = await self._get_client()
            payload = {"user_id": user_id}

            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            response = await client.post(
                f"{self.hojai_base_url}/api/v1/profile",
                json=payload,
                headers=headers
            )

            if response.status_code == 200:
                return response.json()

        except Exception as e:
            logger.warning(f"HOJAI profile failed: {e}")

        return {"user_id": user_id, "source": "local_fallback"}

    async def reason(
        self,
        user_id: str,
        query: str
    ) -> Dict[str, Any]:
        """
        Reason over memories using HOJAI Memory Platform.

        Uses the Unified Memory API:
        POST /api/v1/reason
        """
        try:
            client = await self._get_client()
            payload = {
                "user_id": user_id,
                "query": query
            }

            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            response = await client.post(
                f"{self.hojai_base_url}/api/v1/reason",
                json=payload,
                headers=headers
            )

            if response.status_code == 200:
                return response.json()

        except Exception as e:
            logger.warning(f"HOJAI reason failed: {e}")

        return {"query": query, "reasoning": "unavailable", "source": "local_fallback"}


class AssetMemoryService:
    """
    Asset Memory Service with HOJAI Memory Platform integration.

    Key capabilities:
    - Store EVERYTHING forever (prices, news, events, predictions)
    - Cross-domain reasoning
    - Deep search and retrieval
    - Memory profiling
    - Correlation discovery
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Asset Memory"
        self.port = 5030
        self.version = "2.0.0"

        # HOJAI Memory Platform connector
        self.hojai = HOJAIMemoryConnector(self.config)

        # Local fallback storage
        self.local_memory_store: Dict[str, List[Dict[str, Any]]] = {}

        # Asset ID mapping (for cross-referencing)
        self.asset_ids: Dict[str, str] = {}  # symbol -> user_id

    def _get_asset_user_id(self, asset_id: str) -> str:
        """Get or create user ID for an asset"""
        if asset_id not in self.asset_ids:
            self.asset_ids[asset_id] = f"asset_{asset_id}"
        return self.asset_ids[asset_id]

    async def remember(
        self,
        asset_id: str,
        memory_type: MemoryType,
        content: str,
        metadata: Dict[str, Any] = None,
        tags: List[str] = None
    ) -> MemoryResponse:
        """
        Store a new memory for an asset.

        This stores the memory in both HOJAI Memory Platform and local storage.
        """
        user_id = self._get_asset_user_id(asset_id)

        # Store in HOJAI Memory Platform
        hojai_result = await self.hojai.remember(
            user_id=user_id,
            content=content,
            memory_type=memory_type.value,
            metadata={
                "asset_id": asset_id,
                **(metadata or {})
            }
        )

        # Also store locally for fast access
        memory_id = hojai_result.get("memory_id", f"{asset_id}_{datetime.utcnow().timestamp()}")
        memory = {
            "memory_id": memory_id,
            "asset_id": asset_id,
            "type": memory_type.value,
            "content": content,
            "metadata": metadata or {},
            "tags": tags or [],
            "created_at": datetime.utcnow().isoformat(),
 "hojai_synced": "source" in hojai_result and hojai_result["source"] != "local_fallback"
        }

        if asset_id not in self.local_memory_store:
            self.local_memory_store[asset_id] = []
        self.local_memory_store[asset_id].append(memory)

        logger.info(f"Stored memory for {asset_id}: {memory_type.value}")

        return MemoryResponse(
            memory_id=memory_id,
            asset_id=asset_id,
            memory_type=memory_type.value,
            content=content,
            created_at=memory["created_at"],
            confidence=1.0 if memory.get("hojai_synced") else 0.8
        )

    async def recall(
        self,
        asset_id: str,
        memory_type: Optional[MemoryType] = None,
        query: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Retrieve memories for an asset.

        First tries HOJAI Memory Platform, falls back to local storage.
        """
        user_id = self._get_asset_user_id(asset_id)

        # Try HOJAI first
        if query:
            memories = await self.hojai.recall(
                user_id=user_id,
                query=query,
                memory_type=memory_type.value if memory_type else None,
                limit=limit
            )
            if memories:
                return memories

        # Fall back to local storage
        memories = self.local_memory_store.get(asset_id, [])

        if memory_type:
            memories = [m for m in memories if m["type"] == memory_type.value]

        # Sort by creation time
        memories = sorted(memories, key=lambda x: x["created_at"], reverse=True)

        return memories[:limit]

    async def profile(self, asset_id: str) -> AssetProfile:
        """
        Build comprehensive asset profile from memories.

        Uses HOJAI Memory Platform for deep profiling.
        """
        user_id = self._get_asset_user_id(asset_id)

        # Get memories
        memories = await self.recall(asset_id, limit=1000)

        if not memories:
            return AssetProfile(
                asset_id=asset_id,
                total_memories=0,
                memory_types=[]
            )

        # Get HOJAI profile
        hojai_profile = await self.hojai.profile(user_id)

        # Extract key events
        key_events = [
            m for m in memories
            if m["type"] in [MemoryType.EARNINGS.value, MemoryType.RISK_EVENT.value, MemoryType.MACRO_EVENT.value]
        ]

        # Extract correlations
        correlations = [
            m for m in memories
            if m["type"] == MemoryType.CORRELATION.value
        ]

        # Extract themes
        themes = list(set(
            tag for m in memories
            for tag in m.get("tags", [])
            if tag.startswith("theme:")
        ))

        return AssetProfile(
            asset_id=asset_id,
            total_memories=len(memories),
            memory_types=list(set(m["type"] for m in memories)),
            first_memory=memories[-1]["created_at"] if memories else None,
            latest_memory=memories[0]["created_at"] if memories else None,
            key_events=key_events[:20],
            correlations=correlations[:10],
            themes=[t.replace("theme:", "") for t in themes]
        )

    async def reason(
        self,
        asset_id: str,
        query: str
    ) -> Dict[str, Any]:
        """
        Reason over asset memories.

        Uses HOJAI Memory Platform for cross-domain reasoning.
        """
        user_id = self._get_asset_user_id(asset_id)

        # Try HOJAI reasoning
        result = await self.hojai.reason(user_id, query)

        if result.get("reasoning") != "unavailable":
            return result

        # Fallback: simple local reasoning
        memories = await self.recall(asset_id, limit=100)

        relevant = [
            m for m in memories
            if query.lower() in m["content"].lower()
        ]

        return {
            "query": query,
            "reasoning": f"Found {len(relevant)} relevant memories",
            "memories": relevant[:10],
            "confidence": 0.7
        }

    async def store_price(
        self,
        asset_id: str,
        price: float,
        timestamp: Optional[datetime] = None
    ):
        """Store a price memory"""
        ts = timestamp or datetime.utcnow()
        await self.remember(
            asset_id=asset_id,
            memory_type=MemoryType.PRICE_HISTORY,
            content=f"Price: ${price:.2f}",
            metadata={
                "price": price,
                "timestamp": ts.isoformat()
            },
            tags=["price", f"date:{ts.strftime('%Y-%m-%d')}"]
        )

    async def store_news(
        self,
        asset_id: str,
        headline: str,
        source: str,
        sentiment: float = 0
    ):
        """Store a news memory"""
        await self.remember(
            asset_id=asset_id,
            memory_type=MemoryType.NEWS_EVENT,
            content=headline,
            metadata={
                "source": source,
                "sentiment": sentiment
            },
            tags=["news", f"sentiment:{'positive' if sentiment > 0 else 'negative' if sentiment < 0 else 'neutral'}"]
        )

    async def store_earnings(
        self,
        asset_id: str,
        eps: float,
        revenue: float,
        beat_miss: str
    ):
        """Store an earnings memory"""
        await self.remember(
            asset_id=asset_id,
            memory_type=MemoryType.EARNINGS,
            content=f"Earnings: EPS ${eps:.2f}, Revenue ${revenue:.2f}, {beat_miss}",
            metadata={
                "eps": eps,
                "revenue": revenue,
                "result": beat_miss
            },
            tags=["earnings", f"result:{beat_miss}"]
        )

    async def store_prediction(
        self,
        asset_id: str,
        prediction: str,
        confidence: float,
        outcome: Optional[str] = None
    ):
        """Store a prediction memory"""
        tags = ["prediction"]
        if outcome:
            tags.append(f"outcome:{outcome}")

        await self.remember(
            asset_id=asset_id,
            memory_type=MemoryType.PREDICTION,
            content=prediction,
            metadata={
                "confidence": confidence,
                "outcome": outcome
            },
            tags=tags
        )

    async def store_correlation(
        self,
        asset_a: str,
        asset_b: str,
        correlation: float,
        relationship_type: str
    ):
        """Store a correlation memory"""
        memory_id = f"{asset_a}_{asset_b}"
        await self.remember(
            asset_id=memory_id,
            memory_type=MemoryType.CORRELATION,
            content=f"Correlation: {asset_a} ↔ {asset_b} = {correlation:.2%}",
            metadata={
                "asset_a": asset_a,
                "asset_b": asset_b,
                "correlation": correlation,
                "relationship_type": relationship_type
            },
            tags=["correlation", f"type:{relationship_type}"]
        )

    async def search_across_assets(
        self,
        query: str,
        asset_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Search memories across multiple assets"""
        results = []

        if asset_ids:
            for asset_id in asset_ids:
                memories = await self.recall(asset_id, query=query, limit=20)
                for m in memories:
                    m["asset_id"] = asset_id
                    results.append(m)
        else:
            # Search all assets
            for asset_id in self.local_memory_store.keys():
                memories = await self.recall(asset_id, query=query, limit=10)
                for m in memories:
                    m["asset_id"] = asset_id
                    results.append(m)

        return sorted(results, key=lambda x: x["created_at"], reverse=True)

    async def get_timeline(
        self,
        asset_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get timeline of memories for an asset"""
        memories = await self.recall(asset_id, limit=1000)

        if start_date:
            memories = [m for m in memories if m["created_at"] >= start_date.isoformat()]
        if end_date:
            memories = [m for m in memories if m["created_at"] <= end_date.isoformat()]

        return sorted(memories, key=lambda x: x["created_at"])


# Initialize service
service = AssetMemoryService()


@app.get("/health")
async def health():
    """Health check endpoint"""
    hojai_status = await service.hojai.health_check()
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "hojai_memory": hojai_status,
        "local_memories": sum(len(m) for m in service.local_memory_store.values()),
        "tracked_assets": len(service.asset_ids)
    }


@app.post("/api/v1/remember")
async def remember(request: MemoryRequest):
    """Store a new memory"""
    return await service.remember(
        asset_id=request.asset_id,
        memory_type=request.memory_type,
        content=request.content,
        metadata=request.metadata,
        tags=request.tags
    )


@app.get("/api/v1/recall/{asset_id}")
async def recall(
    asset_id: str,
    memory_type: MemoryType = None,
    query: str = None,
    limit: int = 100
):
    """Retrieve memories for an asset"""
    return await service.recall(asset_id, memory_type, query, limit)


@app.get("/api/v1/profile/{asset_id}")
async def profile(asset_id: str):
    """Build comprehensive asset profile"""
    return await service.profile(asset_id)


@app.post("/api/v1/reason/{asset_id}")
async def reason(asset_id: str, query: str):
    """Reason over asset memories"""
    return await service.reason(asset_id, query)


@app.post("/api/v1/prices")
async def store_price(asset_id: str, price: float, timestamp: datetime = None):
    """Store a price memory"""
    await service.store_price(asset_id, price, timestamp)
    return {"status": "stored", "asset_id": asset_id}


@app.post("/api/v1/news")
async def store_news(
    asset_id: str,
    headline: str,
    source: str,
    sentiment: float = 0
):
    """Store a news memory"""
    await service.store_news(asset_id, headline, source, sentiment)
    return {"status": "stored", "asset_id": asset_id}


@app.post("/api/v1/earnings")
async def store_earnings(
    asset_id: str,
    eps: float,
    revenue: float,
    beat_miss: str
):
    """Store an earnings memory"""
    await service.store_earnings(asset_id, eps, revenue, beat_miss)
    return {"status": "stored", "asset_id": asset_id}


@app.post("/api/v1/predictions")
async def store_prediction(
    asset_id: str,
    prediction: str,
    confidence: float,
    outcome: str = None
):
    """Store a prediction memory"""
    await service.store_prediction(asset_id, prediction, confidence, outcome)
    return {"status": "stored", "asset_id": asset_id}


@app.post("/api/v1/correlations")
async def store_correlation(
    asset_a: str,
    asset_b: str,
    correlation: float,
    relationship_type: str
):
    """Store a correlation memory"""
    await service.store_correlation(asset_a, asset_b, correlation, relationship_type)
    return {"status": "stored", "correlation": f"{asset_a} ↔ {asset_b}"}


@app.get("/api/v1/search")
async def search(query: str, asset_ids: str = None):
    """Search memories across assets"""
    asset_list = [a.strip() for a in asset_ids.split(",")] if asset_ids else None
    return await service.search_across_assets(query, asset_list)


@app.get("/api/v1/timeline/{asset_id}")
async def get_timeline(
    asset_id: str,
    start_date: datetime = None,
    end_date: datetime = None
):
    """Get timeline of memories"""
    return await service.get_timeline(asset_id, start_date, end_date)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5030)