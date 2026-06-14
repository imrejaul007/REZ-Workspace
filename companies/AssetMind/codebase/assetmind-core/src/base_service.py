"""
AssetMind Core - Base service class for all services
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from enum import Enum
import logging
import asyncio


class ServiceHealth(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"


class ServiceStatus(BaseModel):
    service_name: str
    status: ServiceHealth
    version: str
    port: int
    uptime_seconds: float
    last_health_check: datetime
    dependencies: Dict[str, ServiceHealth] = {}


class BaseService(ABC):
    """
    Abstract base class for all AssetMind services.

    Provides common functionality:
    - Health checks
    - Logging
    - Service discovery
    - Error handling
    """

    def __init__(self, service_name: str, version: str, port: int):
        self.service_name = service_name
        self.version = version
        self.port = port
        self.started_at = datetime.utcnow()
        self.logger = logging.getLogger(service_name)
        self._running = False

    @property
    def uptime(self) -> float:
        """Return service uptime in seconds"""
        return (datetime.utcnow() - self.started_at).total_seconds()

    async def health_check(self) -> ServiceStatus:
        """Return service health status"""
        return ServiceStatus(
            service_name=self.service_name,
            status=ServiceHealth.HEALTHY,
            version=self.version,
            port=self.port,
            uptime_seconds=self.uptime,
            last_health_check=datetime.utcnow(),
            dependencies=await self._check_dependencies()
        )

    async def _check_dependencies(self) -> Dict[str, ServiceHealth]:
        """Check health of service dependencies"""
        return {}

    async def start(self):
        """Start the service"""
        self.logger.info(f"Starting {self.service_name} v{self.version}")
        self._running = True
        await self.on_start()

    async def stop(self):
        """Stop the service"""
        self.logger.info(f"Stopping {self.service_name}")
        self._running = False
        await self.on_stop()

    @abstractmethod
    async def on_start(self):
        """Called when service starts"""
        pass

    @abstractmethod
    async def on_stop(self):
        """Called when service stops"""
        pass

    async def run(self):
        """Main service loop"""
        await self.start()
        try:
            while self._running:
                await asyncio.sleep(1)
        finally:
            await self.stop()
