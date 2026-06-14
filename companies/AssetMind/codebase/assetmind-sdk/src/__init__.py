"""
AssetMind - SDK
Python SDK for AssetMind API.

Usage:
    from assetmind import Client

    client = Client(api_key="your-key")
    result = client.council.opinions(symbol="NVDA")

Version: 1.0.0
"""

import requests
from typing import Optional, Dict, List, Any


class Client:
    """AssetMind API Client"""

    def __init__(self, api_key: str, base_url: str = os.getenv("ASSETMIND_API_URL", "http://localhost:8000")):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {"X-API-Key": api_key}

    def council_opinions(self, symbol: str) -> Dict[str, Any]:
        """Get council opinions for symbol"""
        response = requests.post(
            f"{self.base_url}/council/convene",
            json={"symbol": symbol},
            headers=self.headers
        )
        return response.json()

    def get_recommendation(self, symbol: str) -> Dict[str, Any]:
        """Get AI recommendation"""
        response = requests.post(
            f"{self.base_url}/predict",
            json={"symbol": symbol},
            headers=self.headers
        )
        return response.json()

    def get_portfolio(self) -> Dict[str, Any]:
        """Get portfolio data"""
        response = requests.get(
            f"{self.base_url}/portfolio",
            headers=self.headers
        )
        return response.json()


__all__ = ["Client"]