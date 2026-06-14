"""
DeFiLlama Connector for DeFi Protocol Data
Source: https://defillama.com/docs/api
Free, no API key required
"""
import httpx
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class DeFiLlamaConnector:
    """Connector for DeFiLlama DeFi data"""

    BASE_URL = "https://api.llama.fi"

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_protocols(
        self,
        category: Optional[str] = None,
        chain: Optional[str] = None,
        min_tvl: float = 1000000
    ) -> List[Dict[str, Any]]:
        """Get all protocols with optional filters"""
        try:
            response = await self.client.get(f"{self.BASE_URL}/protocols")
            response.raise_for_status()
            protocols = response.json()

            # Apply filters
            if category:
                protocols = [p for p in protocols if p.get("category", "").lower() == category.lower()]
            if chain:
                protocols = [p for p in protocols if chain.lower() in [c.lower() for c in p.get("chains", [])]]
            if min_tvl:
                protocols = [p for p in protocols if p.get("tvl", 0) >= min_tvl]

            return [self._transform_protocol(p) for p in protocols]
        except Exception as e:
            logger.error(f"Error fetching protocols: {e}")
            return []

    async def get_protocol(self, name: str) -> Optional[Dict[str, Any]]:
        """Get detailed protocol info"""
        try:
            response = await self.client.get(f"{self.BASE_URL}/protocol/{name}")
            response.raise_for_status()
            data = response.json()
            return self._transform_protocol_details(data)
        except Exception as e:
            logger.error(f"Error fetching protocol {name}: {e}")
            return None

    async def get_protocol_tvl(
        self,
        name: str,
        span: int = 365
    ) -> List[Dict[str, Any]]:
        """Get TVL history for a protocol"""
        try:
            response = await self.client.get(f"{self.BASE_URL}/protocol/{name}/charts")
            response.raise_for_status()
            data = response.json()

            return [
                {
                    "date": datetime.fromtimestamp(item.get("date", 0)),
                    "tvl": item.get("tvl", 0),
                }
                for item in data.get("tvl", [])[-span:]
            ]
        except Exception as e:
            logger.error(f"Error fetching TVL history: {e}")
            return []

    async def get_total_tvl(self) -> Dict[str, Any]:
        """Get current total DeFi TVL"""
        try:
            response = await self.client.get(f"{self.BASE_URL}/tvl")
            response.raise_for_status()
            data = response.json()

            return {
                "total_tvl": data.get("totalTvl", 0),
                "last_updated": datetime.fromtimestamp(data.get("lastUpdated", 0)),
            }
        except Exception as e:
            logger.error(f"Error fetching total TVL: {e}")
            return {"total_tvl": 0}

    async def get_stablecoins(self) -> List[Dict[str, Any]]:
        """Get all stablecoins"""
        try:
            response = await self.client.get(f"{self.BASE_URL}/stablecoins")
            response.raise_for_status()
            data = response.json()

            return [
                {
                    "symbol": s.get("symbol"),
                    "name": s.get("name"),
                    "tvl": s.get("tvl", 0),
                    "circulating": s.get("circulating", 0),
                    "chains": s.get("chains", []),
                }
                for s in data.get("peggedAssets", [])
            ]
        except Exception as e:
            logger.error(f"Error fetching stablecoins: {e}")
            return []

    async def get_yields(
        self,
        min_tvl: float = 100000,
        sort_by: str = "tvl"
    ) -> List[Dict[str, Any]]:
        """Get yield opportunities"""
        try:
            response = await self.client.get(f"{self.BASE_URL}/pools")
            response.raise_for_status()
            pools = response.json()

            # Filter by TVL
            pools = [p for p in pools if p.get("tvlUsd", 0) >= min_tvl]

            # Sort
            if sort_by == "tvl":
                pools.sort(key=lambda x: x.get("tvlUsd", 0), reverse=True)
            elif sort_by == "apy":
                pools.sort(key=lambda x: float(x.get("apy", 0) or 0), reverse=True)

            return [self._transform_pool(p) for p in pools[:100]]
        except Exception as e:
            logger.error(f"Error fetching yields: {e}")
            return []

    def _transform_protocol(self, p: Dict) -> Dict[str, Any]:
        """Transform protocol data"""
        return {
            "name": p.get("name"),
            "symbol": p.get("symbol"),
            "category": p.get("category"),
            "chains": p.get("chains", []),
            "tvl": p.get("tvl", 0),
            "change_1d": p.get("change_1d", 0),
            "change_7d": p.get("change_7d", 0),
            "mcap": p.get("mcap", 0),
        }

    def _transform_protocol_details(self, p: Dict) -> Dict[str, Any]:
        """Transform detailed protocol data"""
        return {
            "name": p.get("name"),
            "symbol": p.get("symbol"),
            "category": p.get("category"),
            "chains": p.get("chains", []),
            "tvl": p.get("tvl", 0),
            "description": p.get("description"),
            "url": p.get("url"),
            "logo": p.get("logo"),
            "gecko_id": p.get("gecko_id"),
        }

    def _transform_pool(self, p: Dict) -> Dict[str, Any]:
        """Transform yield pool data"""
        return {
            "project": p.get("project"),
            "symbol": p.get("symbol"),
            "chain": p.get("chain"),
            "tvl": p.get("tvlUsd", 0),
            "apy": p.get("apy", 0),
            "pool": p.get("pool"),
            "reward_tokens": p.get("rewardTokens", []),
        }

    async def close(self):
        await self.client.aclose()