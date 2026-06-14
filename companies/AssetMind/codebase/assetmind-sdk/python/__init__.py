"""
AssetMind Python SDK

The official Python SDK for AssetMind Financial Intelligence Platform.

Usage:
    from assetmind import AssetMind

    client = AssetMind(api_key="your-api-key")

    # Get asset twin
    twin = client.twin.get("NVDA")

    # Get prediction
    prediction = client.prediction.get("NVDA")

    # Get briefing
    briefing = client.briefing.get()
"""

from .client import AssetMind
from .services.asset import AssetService
from .services.twin import TwinService
from .services.prediction import PredictionService
from .services.briefing import BriefingService
from .services.research import ResearchService
from .services.memory import MemoryService

__version__ = "1.0.0"
__all__ = [
    "AssetMind",
    "AssetService",
    "TwinService",
    "PredictionService",
    "BriefingService",
    "ResearchService",
    "MemoryService",
]


class AssetMind:
    """
    Main AssetMind Python SDK client.

    Usage:
        from assetmind import AssetMind

        client = AssetMind(api_key="your-api-key")
        twin = client.twin.get("NVDA")
    """

    def __init__(self, api_key: str = None, base_url: str = "https://api.assetmind.ai"):
        self.api_key = api_key
        self.base_url = base_url
        self._client = None

        # Initialize services
        self.asset = AssetService(self)
        self.twin = TwinService(self)
        self.prediction = PredictionService(self)
        self.briefing = BriefingService(self)
        self.research = ResearchService(self)
        self.memory = MemoryService(self)

    def _request(self, method: str, path: str, **kwargs):
        """Make an API request"""
        import requests

        headers = kwargs.pop("headers", {})
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        url = f"{self.base_url}{path}"
        response = requests.request(method, url, headers=headers, **kwargs)
        response.raise_for_status()
        return response.json()


class AssetService:
    """Asset Universe Service"""

    def __init__(self, client: AssetMind):
        self.client = client

    def list(self, asset_class: str = None, limit: int = 100):
        """List all assets"""
        params = {"limit": limit}
        if asset_class:
            params["asset_class"] = asset_class
        return self.client._request("GET", "/api/v1/assets", params=params)

    def get(self, symbol: str):
        """Get a specific asset"""
        return self.client._request("GET", f"/api/v1/assets/{symbol.upper()}")

    def search(self, query: str, asset_class: str = None):
        """Search assets"""
        params = {"q": query}
        if asset_class:
            params["asset_class"] = asset_class
        return self.client._request("GET", "/api/v1/search", params=params)


class TwinService:
    """Asset Twin Service"""

    def __init__(self, client: AssetMind):
        self.client = client

    def get(self, symbol: str, include_correlations: bool = False):
        """Get asset twin with scores and predictions"""
        params = {"include_correlations": include_correlations}
        return self.client._request("GET", f"/api/v1/twin/{symbol.upper()}", params=params)

    def get_scores(self, symbol: str):
        """Get all scores for an asset"""
        return self.get(symbol)


class PredictionService:
    """Prediction Service"""

    def __init__(self, client: AssetMind):
        self.client = client

    def get(self, symbol: str, horizon: str = "30D"):
        """Get prediction for an asset"""
        params = {"time_horizon": horizon}
        return self.client._request("GET", f"/api/v1/prediction/{symbol.upper()}", params=params)

    def get_all(self, symbols: list):
        """Get predictions for multiple assets"""
        return [self.get(s) for s in symbols]


class BriefingService:
    """Briefing Service"""

    def __init__(self, client: AssetMind):
        self.client = client

    def get(self):
        """Get today's briefing"""
        return self.client._request("GET", "/api/v1/briefing")

    def get_by_type(self, briefing_type: str):
        """Get briefing by type"""
        return self.client._request("GET", f"/api/v1/briefing/{briefing_type}")


class ResearchService:
    """Research Service"""

    def __init__(self, client: AssetMind):
        self.client = client

    def get_report(self, symbol: str):
        """Get research report for an asset"""
        return self.client._request("GET", f"/api/v1/research/{symbol.upper()}")

    def compare(self, symbols: list):
        """Compare multiple assets"""
        return self.client._request("GET", f"/api/v1/compare", params={"symbols": ",".join(symbols)})


class MemoryService:
    """Financial Memory Service"""

    def __init__(self, client: AssetMind):
        self.client = client

    def remember(self, content: str, symbol: str = None, memory_type: str = "insight"):
        """Store a memory"""
        data = {"content": content, "memory_type": memory_type}
        if symbol:
            data["symbol"] = symbol
        return self.client._request("POST", "/api/v1/memory", json=data)

    def recall(self, query: str, symbol: str = None):
        """Recall relevant memories"""
        data = {"query": query}
        if symbol:
            data["symbol"] = symbol
        return self.client._request("POST", "/api/v1/memory/recall", json=data)

    def learn(self, insight: str, category: str = "pattern"):
        """Store a learning"""
        data = {"insight": insight, "category": category}
        return self.client._request("POST", "/api/v1/memory/learnings", json=data)
