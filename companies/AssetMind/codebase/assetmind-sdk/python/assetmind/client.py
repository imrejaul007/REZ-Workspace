"""
AssetMind Python SDK - Client
"""

import os
from typing import Dict, List, Any, Optional
import httpx
from .exceptions import AssetMindError, APIError, AuthenticationError


class AssetMindClient:
    """
    Python client for AssetMind Financial Intelligence Platform.

    Usage:
        from assetmind import AssetMindClient

        client = AssetMindClient(api_key="your-api-key")
        twin = client.twin.get("NVDA")
        prediction = client.prediction.get("NVDA")
    """

    def __init__(
        self,
        api_key: str = None,
        base_url: str = os.getenv("ASSETMIND_API_URL", "http://localhost:5260"),
        timeout: int = 30
    ):
        """
        Initialize AssetMind client.

        Args:
            api_key: Your API key (or set ASSETMIND_API_KEY env var)
            base_url: Base URL for API
            timeout: Request timeout in seconds
        """
        self.api_key = api_key or os.environ.get("ASSETMIND_API_KEY")
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

        if not self.api_key:
            raise AssetMindError("API key required. Set ASSETMIND_API_KEY env var.")

        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        )

        # Resource groups
        self.assets = AssetsResource(self.client)
        self.twin = TwinResource(self.client)
        self.prediction = PredictionResource(self.client)
        self.research = ResearchResource(self.client)
        self.briefing = BriefingResource(self.client)
        self.opportunities = OpportunitiesResource(self.client)
        self.risks = RisksResource(self.client)

    async def close(self):
        """Close the client"""
        await self.client.aclose()

    async def health(self) -> Dict[str, Any]:
        """Check API health"""
        response = await self.client.get("/health")
        return response.json()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


# =============================================================================
// RESOURCE CLASSES
// =============================================================================

class AssetsResource:
    """Assets API resource"""

    def __init__(self, client: httpx.AsyncClient):
        self._client = client

    async def list(
        self,
        asset_class: str = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """List assets"""
        params = {"limit": limit}
        if asset_class:
            params["asset_class"] = asset_class

        response = await self._client.get("/api/v1/assets", params=params)
        return response.json()

    async def get(self, symbol: str) -> Dict[str, Any]:
        """Get asset by symbol"""
        response = await self._client.get(f"/api/v1/assets/{symbol}")
        return response.json()

    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search assets"""
        params = {"query": query, "limit": limit}
        response = await self._client.get("/search", params=params)
        return response.json()


class TwinResource:
    """Asset Twin API resource"""

    def __init__(self, client: httpx.AsyncClient):
        self._client = client

    async def get(self, symbol: str) -> Dict[str, Any]:
        """Get Asset Twin for symbol"""
        response = await self._client.get(f"/api/v1/twin/{symbol}")
        return response.json()

    async def scores(self, symbol: str) -> Dict[str, Any]:
        """Get all scores for symbol"""
        response = await self._client.get(f"/twins/{symbol}/scores")
        return response.json()

    async def health(self, symbol: str) -> Dict[str, Any]:
        """Get health breakdown for symbol"""
        response = await self._client.get(f"/twins/{symbol}/health")
        return response.json()

    async def top_opportunities(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top opportunities"""
        response = await self._client.get(
            "/twins/top/opportunities",
            params={"limit": limit}
        )
        return response.json()

    async def top_risks(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top risks"""
        response = await self._client.get(
            "/twins/top/risks",
            params={"limit": limit}
        )
        return response.json()


class PredictionResource:
    """Prediction API resource"""

    def __init__(self, client: httpx.AsyncClient):
        self._client = client

    async def get(
        self,
        symbol: str,
        time_horizon: str = "30D"
    ) -> Dict[str, Any]:
        """Get prediction for symbol"""
        response = await self._client.get(
            f"/api/v1/prediction/{symbol}",
            params={"time_horizon": time_horizon}
        )
        return response.json()

    async def top(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top predictions"""
        response = await self._client.get(
            "/predictions/top",
            params={"limit": limit}
        )
        return response.json()


class ResearchResource:
    """Research API resource"""

    def __init__(self, client: httpx.AsyncClient):
        self._client = client

    async def generate(
        self,
        symbol: str,
        report_type: str = "COMPANY"
    ) -> Dict[str, Any]:
        """Generate research report for symbol"""
        response = await self._client.post(
            "/report/generate",
            params={"report_type": report_type, "subject": symbol}
        )
        return response.json()

    async def quick(self, symbol: str) -> Dict[str, Any]:
        """Get quick research summary"""
        response = await self._client.post(
            "/report/quick",
            params={"symbol": symbol}
        )
        return response.json()

    async def compare(self, symbols: List[str]) -> Dict[str, Any]:
        """Comparative analysis"""
        response = await self._client.post(
            "/compare/report",
            params={"symbols": ",".join(symbols)}
        )
        return response.json()


class BriefingResource:
    """Daily Briefing API resource"""

    def __init__(self, client: httpx.AsyncClient):
        self._client = client

    async def get(self) -> Dict[str, Any]:
        """Get morning briefing"""
        response = await self._client.get("/api/v1/briefing")
        return response.json()

    async def market(self) -> Dict[str, Any]:
        """Get market briefing"""
        response = await self._client.get("/briefing/market")
        return response.json()

    async def opportunities(self) -> Dict[str, Any]:
        """Get opportunity briefing"""
        response = await self._client.get("/briefing/opportunities")
        return response.json()


class OpportunitiesResource:
    """Opportunities API resource"""

    def __init__(self, client: httpx.AsyncClient):
        self._client = client

    async def list(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top opportunities"""
        response = await self._client.get(
            "/api/v1/opportunities",
            params={"limit": limit}
        )
        return response.json()

    async def themes(self) -> Dict[str, Any]:
        """Get emerging themes"""
        response = await self._client.get("/themes")
        return response.json()

    async def hidden_for(self, symbol: str) -> Dict[str, Any]:
        """Get hidden opportunities related to symbol"""
        response = await self._client.get(f"/hidden/{symbol}")
        return response.json()


class RisksResource:
    """Risks API resource"""

    def __init__(self, client: httpx.AsyncClient):
        self._client = client

    async def list(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top risks"""
        response = await self._client.get(
            "/api/v1/risks",
            params={"limit": limit}
        )
        return response.json()

    async def scenarios(self) -> Dict[str, Any]:
        """Get current risk scenarios"""
        response = await self._client.get("/scenarios")
        return response.json()


# =============================================================================
// USAGE EXAMPLES
// =============================================================================

async def main():
    """Example usage"""
    async with AssetMindClient(api_key="test-key") as client:

        # Check health
        health = await client.health()
        print(f"API Status: {health['status']}")

        # Get NVIDIA Twin
        twin = await client.twin.get("NVDA")
        print(f"NVDA Opportunity: {twin['opportunity_score']}")
        print(f"NVDA Risk: {twin['risk_score']}")

        # Get prediction
        pred = await client.prediction.get("NVDA")
        print(f"Bullish: {pred['bullish_probability']}%")
        print(f"Bearish: {pred['bearish_probability']}%")

        # Generate research
        report = await client.research.generate("NVDA")
        print(f"Rating: {report['rating']}")
        print(f"Price Target: ${report['price_target']}")

        # Get briefing
        briefing = await client.briefing.get()
        print(f"Market: {briefing['market_sentiment']}")

        # Top opportunities
        opps = await client.opportunities.list(limit=5)
        for opp in opps:
            print(f"{opp['symbol']}: {opp['opportunity_score']}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
