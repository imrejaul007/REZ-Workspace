"""
AssetMind → HOJAI AI Integration

Connects AssetMind to HOJAI AI for:
- Memory Platform (4540)
- Knowledge Graph
- AI Agents
- Enterprise Brain

Version: 1.0.0
"""

import httpx
import os
from typing import Dict, Any, Optional, List
from datetime import datetime


class HOJAIIntegration:
    """
    Integration with HOJAI AI services.

    Usage:
        hojai = HOJAIIntegration()
        memory = await hojai.remember(user_id="user123", content="NVDA to 1000")
        insights = await hojai.query("What affects NVIDIA price?")
    """

    def __init__(
        self,
        memory_api_url: str = None,
        knowledge_graph_url: str = None,
        agent_url: str = None,
        api_key: str = None
    ):
        self.memory_api_url = memory_api_url or os.getenv("HOJAI_MEMORY_API_URL", "http://localhost:4540")
        self.knowledge_graph_url = knowledge_graph_url or os.getenv("HOJAI_KG_URL", "http://localhost:4550")
        self.agent_url = agent_url or os.getenv("HOJAI_AGENT_URL", "http://localhost:4560")
        self.api_key = api_key or os.getenv("HOJAI_API_KEY", "")
        self.timeout = 30.0

    async def remember(
        self,
        user_id: str,
        content: str,
        content_type: str = "financial_insight",
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Store information in HOJAI Memory.

        Args:
            user_id: User or entity ID
            content: Content to remember
            content_type: Type of content (financial_insight, prediction, research)
            metadata: Additional metadata

        Returns:
            Memory store response
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.memory_api_url}/remember",
                    json={
                        "user_id": user_id,
                        "content": content,
                        "type": content_type,
                        "metadata": metadata or {},
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {"error": str(e), "status": "unavailable"}

    async def recall(
        self,
        user_id: str,
        query: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Recall information from HOJAI Memory.

        Args:
            user_id: User or entity ID
            query: Search query
            limit: Maximum results

        Returns:
            List of recalled memories
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.memory_api_url}/recall",
                    json={
                        "user_id": user_id,
                        "query": query,
                        "limit": limit
                    },
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                response.raise_for_status()
                return response.json().get("memories", [])
            except httpx.HTTPError as e:
                return []

    async def query(
        self,
        prompt: str,
        context: Optional[Dict] = None,
        model: str = "claude-3-5-sonnet"
    ) -> Dict[str, Any]:
        """
        Query HOJAI AI Brain.

        Args:
            prompt: Question or task
            context: Additional context
            model: AI model to use

        Returns:
            AI response
        """
        async with httpx.AsyncClient(timeout=self.timeout * 2) as client:
            try:
                response = await client.post(
                    f"{self.agent_url}/query",
                    json={
                        "prompt": prompt,
                        "context": context or {},
                        "model": model
                    },
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {"error": str(e), "response": None}

    async def get_knowledge(
        self,
        entity: str,
        relationship: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Query HOJAI Knowledge Graph.

        Args:
            entity: Entity to look up (e.g., "NVIDIA", "TSMC")
            relationship: Optional relationship filter

        Returns:
            Knowledge graph response
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                params = {"entity": entity}
                if relationship:
                    params["relationship"] = relationship

                response = await client.get(
                    f"{self.knowledge_graph_url}/query",
                    params=params,
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {"error": str(e), "nodes": []}

    async def get_supply_chain(
        self,
        symbol: str
    ) -> Dict[str, Any]:
        """
        Get supply chain relationships from Knowledge Graph.

        Example: NVIDIA → TSMC → Taiwan → China

        Args:
            symbol: Stock symbol

        Returns:
            Supply chain mapping
        """
        return await self.get_knowledge(entity=symbol, relationship="supplies_to")

    async def store_prediction(
        self,
        symbol: str,
        prediction: Dict[str, Any],
        outcome: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Store prediction for learning network.

        Args:
            symbol: Asset symbol
            prediction: Prediction details
            outcome: Actual outcome (for learning)

        Returns:
            Storage confirmation
        """
        return await self.remember(
            user_id=f"prediction:{symbol}",
            content=str(prediction),
            content_type="prediction",
            metadata={
                "symbol": symbol,
                "outcome": outcome,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    async def get_financial_context(
        self,
        symbol: str
    ) -> Dict[str, Any]:
        """
        Get comprehensive financial context from HOJAI.

        Combines memory, knowledge graph, and AI analysis.

        Args:
            symbol: Asset symbol

        Returns:
            Financial context
        """
        # Get historical predictions
        predictions = await self.recall(
            user_id=f"prediction:{symbol}",
            query=f"{symbol} prediction analysis",
            limit=5
        )

        # Get supply chain
        supply_chain = await self.get_supply_chain(symbol)

        # Get market knowledge
        knowledge = await self.get_knowledge(symbol)

        return {
            "symbol": symbol,
            "predictions": predictions,
            "supply_chain": supply_chain,
            "knowledge": knowledge,
            "timestamp": datetime.utcnow().isoformat()
        }


# Singleton instance
_hojai_integration = None


def get_hojai_integration() -> HOJAIIntegration:
    """Get singleton HOJAI integration instance."""
    global _hojai_integration
    if _hojai_integration is None:
        _hojai_integration = HOJAIIntegration()
    return _hojai_integration