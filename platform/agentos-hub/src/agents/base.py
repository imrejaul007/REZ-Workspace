"""
AgentOS Hub - Base Industry Adapter

Abstract base class for all industry adapters.
Provides common functionality and interface for industry-specific operations.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Callable
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)


class TwinType(Enum):
    """Standard twin types across all industries."""
    USER = "user"
    PRODUCT = "product"
    TRANSACTION = "transaction"
    LOCATION = "location"
    DOCUMENT = "document"
    ASSET = "asset"
    SCHEDULE = "schedule"
    NOTIFICATION = "notification"


@dataclass
class TwinReference:
    """Reference to a digital twin."""
    twin_id: str
    twin_type: TwinType
    industry: str
    entity_id: str
    endpoint: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class IndustryCapability:
    """Represents a capability offered by an industry."""
    name: str
    description: str
    endpoints: List[str]
    required_twins: List[str]
    optional_twins: List[str] = field(default_factory=list)


class BaseIndustryAdapter(ABC):
    """
    Abstract base class for all industry adapters.

    Each industry adapter provides:
    - Industry-specific agent initialization
    - Twin management for industry entities
    - Cross-industry integration points
    - Standardized API for industry operations
    """

    industry_name: str = "base"
    industry_display_name: str = "Base Industry"
    port_range: tuple = (8000, 9000)

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.agents: Dict[str, Any] = {}
        self.twins: Dict[str, TwinReference] = {}
        self._running = False
        self._lock = asyncio.Lock()

    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize the industry adapter and its agents."""
        pass

    @abstractmethod
    async def shutdown(self) -> bool:
        """Shutdown the industry adapter."""
        pass

    @abstractmethod
    def get_capabilities(self) -> List[IndustryCapability]:
        """Get the capabilities offered by this industry."""
        pass

    @abstractmethod
    async def execute_operation(
        self,
        operation: str,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute an industry-specific operation."""
        pass

    # ==================== Twin Management ====================

    async def register_twin(self, twin: TwinReference) -> bool:
        """Register a digital twin with the adapter."""
        async with self._lock:
            self.twins[twin.twin_id] = twin
            logger.debug(f"Registered twin {twin.twin_id} for {self.industry_name}")
            return True

    async def unregister_twin(self, twin_id: str) -> bool:
        """Unregister a digital twin."""
        async with self._lock:
            if twin_id in self.twins:
                del self.twins[twin_id]
                return True
            return False

    def get_twin(self, twin_id: str) -> Optional[TwinReference]:
        """Get a twin by ID."""
        return self.twins.get(twin_id)

    def get_twins_by_type(self, twin_type: TwinType) -> List[TwinReference]:
        """Get all twins of a specific type."""
        return [t for t in self.twins.values() if t.twin_type == twin_type]

    # ==================== Agent Management ====================

    async def register_agent(self, agent_id: str, agent: Any) -> bool:
        """Register an agent with the adapter."""
        async with self._lock:
            self.agents[agent_id] = agent
            logger.debug(f"Registered agent {agent_id} for {self.industry_name}")
            return True

    async def unregister_agent(self, agent_id: str) -> bool:
        """Unregister an agent."""
        async with self._lock:
            if agent_id in self.agents:
                del self.agents[agent_id]
                return True
            return False

    def get_agent(self, agent_id: str) -> Optional[Any]:
        """Get an agent by ID."""
        return self.agents.get(agent_id)

    def get_all_agents(self) -> List[Any]:
        """Get all registered agents."""
        return list(self.agents.values())

    # ==================== Cross-Industry Operations ====================

    async def prepare_cross_industry_data(
        self,
        target_industry: str,
        operation: str,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Prepare data for cross-industry operations.
        Override in subclasses for industry-specific transformations.
        """
        return {
            "source_industry": self.industry_name,
            "target_industry": target_industry,
            "operation": operation,
            "data": payload,
            "timestamp": datetime.utcnow().isoformat()
        }

    async def process_cross_industry_response(
        self,
        source_industry: str,
        operation: str,
        response: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process response from cross-industry operations.
        Override in subclasses for industry-specific handling.
        """
        return response

    # ==================== Status & Health ====================

    def get_status(self) -> Dict[str, Any]:
        """Get adapter status."""
        return {
            "industry": self.industry_name,
            "running": self._running,
            "agent_count": len(self.agents),
            "twin_count": len(self.twins),
            "agents": list(self.agents.keys()),
            "twins": list(self.twins.keys())
        }

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check."""
        return {
            "industry": self.industry_name,
            "status": "healthy" if self._running else "stopped",
            "agents": len(self.agents),
            "twins": len(self.twins),
            "timestamp": datetime.utcnow().isoformat()
        }


class IndustryAdapterRegistry:
    """
    Registry for all industry adapters.
    Provides centralized access to all 24 industry adapters.
    """

    _instance = None
    _adapters: Dict[str, BaseIndustryAdapter] = {}

    @classmethod
    def get_instance(cls) -> "IndustryAdapterRegistry":
        """Get singleton instance."""
        if cls._instance is None:
            cls._instance = IndustryAdapterRegistry()
        return cls._instance

    def register(self, industry: str, adapter: BaseIndustryAdapter):
        """Register an industry adapter."""
        self._adapters[industry] = adapter
        logger.info(f"Registered adapter for industry: {industry}")

    def unregister(self, industry: str) -> bool:
        """Unregister an industry adapter."""
        if industry in self._adapters:
            del self._adapters[industry]
            return True
        return False

    def get(self, industry: str) -> Optional[BaseIndustryAdapter]:
        """Get an industry adapter."""
        return self._adapters.get(industry)

    def get_all(self) -> Dict[str, BaseIndustryAdapter]:
        """Get all registered adapters."""
        return dict(self._adapters)

    def get_industries(self) -> List[str]:
        """Get list of registered industries."""
        return list(self._adapters.keys())

    async def initialize_all(self) -> Dict[str, bool]:
        """Initialize all registered adapters."""
        results = {}
        for industry, adapter in self._adapters.items():
            try:
                results[industry] = await adapter.initialize()
            except Exception as e:
                logger.error(f"Failed to initialize {industry}: {e}")
                results[industry] = False
        return results

    async def shutdown_all(self) -> Dict[str, bool]:
        """Shutdown all registered adapters."""
        results = {}
        for industry, adapter in self._adapters.items():
            try:
                results[industry] = await adapter.shutdown()
            except Exception as e:
                logger.error(f"Failed to shutdown {industry}: {e}")
                results[industry] = False
        return results

    def get_all_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all adapters."""
        return {industry: adapter.get_status() for industry, adapter in self._adapters.items()}
