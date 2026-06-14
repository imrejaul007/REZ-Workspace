"""
AssetMind - Base Connector
Abstract base class for all data source connectors
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio
import logging


class BaseConnector(ABC):
    """
    Abstract base class for all data connectors.

    All data source connectors should inherit from this class
    and implement the required methods.
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.rate_limit = config.get('rate_limit', 60)  # seconds
        self.last_fetch = datetime.min
        self.logger = logging.getLogger(self.__class__.__name__)
        self.source_name = config.get('source_name', 'unknown')
        self.api_key = config.get('api_key')

    @abstractmethod
    async def fetch(self, **kwargs) -> List[Dict[str, Any]]:
        """
        Fetch data from source.

        Returns:
            List of dictionaries containing the fetched data.
        """
        pass

    @abstractmethod
    async def transform(self, raw_data: Any) -> List[Dict[str, Any]]:
        """
        Transform raw data to standard format.

        Returns:
            List of dictionaries in AssetMind standard format.
        """
        pass

    async def fetch_with_rate_limit(self, **kwargs) -> List[Dict[str, Any]]:
        """
        Fetch data with rate limiting.

        Waits if the last fetch was too recent.
        """
        now = datetime.utcnow()
        elapsed = (now - self.last_fetch).total_seconds()

        if elapsed < self.rate_limit:
            wait_time = self.rate_limit - elapsed
            self.logger.debug(f"Rate limiting: waiting {wait_time:.1f}s")
            await asyncio.sleep(wait_time)

        raw_data = await self.fetch(**kwargs)
        self.last_fetch = datetime.utcnow()

        return await self.transform(raw_data)

    async def stream(self, callback, interval: int = 60):
        """
        Stream data at regular intervals.

        Args:
            callback: Async function to call with new data
            interval: Seconds between fetches
        """
        self.logger.info(f"Starting stream with {interval}s interval")

        while True:
            try:
                data = await self.fetch_with_rate_limit()
                if data:
                    await callback(data)
            except Exception as e:
                self.logger.error(f"Stream error: {e}")

            await asyncio.sleep(interval)

    def validate_data(self, data: Dict[str, Any]) -> bool:
        """
        Validate that data has required fields.

        Override in subclasses for source-specific validation.
        """
        return True

    def get_rate_limit_info(self) -> Dict[str, Any]:
        """Get rate limiting information"""
        elapsed = (datetime.utcnow() - self.last_fetch).total_seconds()
        return {
            "source": self.source_name,
            "rate_limit_seconds": self.rate_limit,
            "seconds_since_last_fetch": elapsed,
            "can_fetch": elapsed >= self.rate_limit
        }


class ConnectorRegistry:
    """
    Registry for all data connectors.
    """

    _connectors: Dict[str, BaseConnector] = {}

    @classmethod
    def register(cls, name: str, connector: BaseConnector):
        """Register a connector"""
        cls._connectors[name] = connector

    @classmethod
    def get(cls, name: str) -> Optional[BaseConnector]:
        """Get a registered connector"""
        return cls._connectors.get(name)

    @classmethod
    def list_connectors(cls) -> List[str]:
        """List all registered connectors"""
        return list(cls._connectors.keys())

    @classmethod
    def health_check_all(cls) -> Dict[str, Dict[str, Any]]:
        """Health check all connectors"""
        results = {}
        for name, connector in cls._connectors.items():
            try:
                results[name] = {
                    "status": "healthy",
                    "rate_limit_info": connector.get_rate_limit_info()
                }
            except Exception as e:
                results[name] = {
                    "status": "error",
                    "error": str(e)
                }
        return results
