"""
AgentOS Hub - Agent Registry

Central registry for all agents across the 24 industry verticals.
Provides service discovery, capability matching, and agent health tracking.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import json
import hashlib

logger = logging.getLogger(__name__)


class AgentCapability(Enum):
    """Standardized agent capabilities across all industries."""
    # Core capabilities
    DATA_PROCESSING = "data_processing"
    ANALYTICS = "analytics"
    PREDICTION = "prediction"
    AUTOMATION = "automation"
    ORCHESTRATION = "orchestration"

    # Industry-agnostic capabilities
    COMMUNICATION = "communication"
    NOTIFICATION = "notification"
    SCHEDULING = "scheduling"
    REPORTING = "reporting"
    BILLING = "billing"

    # Specific capabilities
    INVENTORY_MANAGEMENT = "inventory_management"
    CUSTOMER_MANAGEMENT = "customer_management"
    BOOKING = "booking"
    DISPATCH = "dispatch"
    ROUTING = "routing"
    MATCHING = "matching"
    RECOMMENDATION = "recommendation"
    SENTIMENT_ANALYSIS = "sentiment_analysis"
    COMPLIANCE = "compliance"
    SECURITY = "security"


@dataclass
class AgentMetadata:
    """Extended metadata for agent registration."""
    version: str = "1.0.0"
    author: str = ""
    description: str = ""
    tags: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    config_schema: Dict[str, Any] = field(default_factory=dict)
    health_check_endpoint: Optional[str] = None
    metrics_endpoint: Optional[str] = None


@dataclass
class AgentRegistration:
    """Complete agent registration record."""
    agent_id: str
    name: str
    industry: str
    agent_type: str
    capabilities: List[str]
    endpoints: Dict[str, str]  # protocol -> endpoint
    metadata: AgentMetadata
    registered_at: datetime = field(default_factory=datetime.utcnow)
    last_seen: datetime = field(default_factory=datetime.utcnow)
    health_status: str = "unknown"
    version: str = "1.0.0"
    checksum: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "industry": self.industry,
            "agent_type": self.agent_type,
            "capabilities": self.capabilities,
            "endpoints": self.endpoints,
            "metadata": {
                "version": self.metadata.version,
                "author": self.metadata.author,
                "description": self.metadata.description,
                "tags": self.metadata.tags,
                "dependencies": self.metadata.dependencies,
                "config_schema": self.metadata.config_schema,
                "health_check_endpoint": self.metadata.health_check_endpoint,
                "metrics_endpoint": self.metadata.metrics_endpoint
            },
            "registered_at": self.registered_at.isoformat(),
            "last_seen": self.last_seen.isoformat(),
            "health_status": self.health_status,
            "version": self.version,
            "checksum": self.checksum
        }


class AgentRegistry:
    """
    Central registry for all agents across the RTMN ecosystem.

    Features:
    - Service discovery by industry, capability, or agent type
    - Health tracking and heartbeat monitoring
    - Capability-based agent matching
    - Agent versioning and metadata management
    - Namespace isolation for multi-tenancy
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.agents: Dict[str, AgentRegistration] = {}
        self.industry_index: Dict[str, Set[str]] = {}  # industry -> agent_ids
        self.capability_index: Dict[str, Set[str]] = {}  # capability -> agent_ids
        self.type_index: Dict[str, Set[str]] = {}  # agent_type -> agent_ids
        self.namespace_index: Dict[str, Set[str]] = {}  # namespace -> agent_ids
        self._lock = asyncio.Lock()
        self._heartbeat_task: Optional[asyncio.Task] = None
        self._running = False

        # Configuration
        self.heartbeat_timeout = self.config.get("heartbeat_timeout", 60)  # seconds
        self.cleanup_interval = self.config.get("cleanup_interval", 300)  # seconds
        self.max_retries = self.config.get("max_retries", 3)

    # ==================== Registration ====================

    async def register(
        self,
        agent_id: str,
        name: str,
        industry: str,
        agent_type: str,
        capabilities: List[str],
        endpoints: Dict[str, str],
        metadata: Optional[AgentMetadata] = None,
        namespace: str = "default",
        version: str = "1.0.0"
    ) -> AgentRegistration:
        """Register a new agent in the registry."""
        async with self._lock:
            # Check for duplicate
            if agent_id in self.agents:
                logger.warning(f"Agent {agent_id} already registered, updating...")
                return await self.update_registration(agent_id, {
                    "name": name,
                    "capabilities": capabilities,
                    "endpoints": endpoints,
                    "metadata": metadata
                })

            # Create registration
            metadata = metadata or AgentMetadata()
            registration = AgentRegistration(
                agent_id=agent_id,
                name=name,
                industry=industry,
                agent_type=agent_type,
                capabilities=capabilities,
                endpoints=endpoints,
                metadata=metadata,
                version=version,
                checksum=self._compute_checksum(agent_id, name, industry)
            )

            # Store registration
            self.agents[agent_id] = registration

            # Update indexes
            self._update_indexes(registration, namespace)

            logger.info(f"Registered agent {name} ({agent_id}) for industry {industry}")
            logger.info(f"  Capabilities: {', '.join(capabilities)}")
            logger.info(f"  Endpoints: {endpoints}")

            return registration

    async def unregister(self, agent_id: str) -> bool:
        """Unregister an agent from the registry."""
        async with self._lock:
            if agent_id not in self.agents:
                return False

            agent = self.agents.pop(agent_id)

            # Remove from indexes
            for index in [self.industry_index, self.capability_index, self.type_index, self.namespace_index]:
                for agent_set in index.values():
                    agent_set.discard(agent_id)

            logger.info(f"Unregistered agent {agent.name} ({agent_id})")
            return True

    async def update_registration(
        self,
        agent_id: str,
        updates: Dict[str, Any]
    ) -> Optional[AgentRegistration]:
        """Update an existing agent registration."""
        async with self._lock:
            if agent_id not in self.agents:
                return None

            agent = self.agents[agent_id]

            # Apply updates
            for key, value in updates.items():
                if key == "metadata" and isinstance(value, AgentMetadata):
                    agent.metadata = value
                elif hasattr(agent, key):
                    setattr(agent, key, value)

            agent.last_seen = datetime.utcnow()
            agent.checksum = self._compute_checksum(agent.agent_id, agent.name, agent.industry)

            return agent

    def _update_indexes(self, registration: AgentRegistration, namespace: str):
        """Update all search indexes for a registration."""
        # Industry index
        if registration.industry not in self.industry_index:
            self.industry_index[registration.industry] = set()
        self.industry_index[registration.industry].add(registration.agent_id)

        # Capability index
        for cap in registration.capabilities:
            if cap not in self.capability_index:
                self.capability_index[cap] = set()
            self.capability_index[cap].add(registration.agent_id)

        # Type index
        if registration.agent_type not in self.type_index:
            self.type_index[registration.agent_type] = set()
        self.type_index[registration.agent_type].add(registration.agent_id)

        # Namespace index
        if namespace not in self.namespace_index:
            self.namespace_index[namespace] = set()
        self.namespace_index[namespace].add(registration.agent_id)

    def _compute_checksum(self, agent_id: str, name: str, industry: str) -> str:
        """Compute a checksum for agent verification."""
        data = f"{agent_id}:{name}:{industry}:{datetime.utcnow().isoformat()}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]

    # ==================== Discovery ====================

    def get_agent(self, agent_id: str) -> Optional[AgentRegistration]:
        """Get agent by ID."""
        return self.agents.get(agent_id)

    def get_all_agents(self) -> List[AgentRegistration]:
        """Get all registered agents."""
        return list(self.agents.values())

    def get_agents_by_industry(self, industry: str) -> List[AgentRegistration]:
        """Get all agents for a specific industry."""
        agent_ids = self.industry_index.get(industry, set())
        return [self.agents[aid] for aid in agent_ids if aid in self.agents]

    def get_agents_by_capability(self, capability: str) -> List[AgentRegistration]:
        """Get all agents with a specific capability."""
        agent_ids = self.capability_index.get(capability, set())
        return [self.agents[aid] for aid in agent_ids if aid in self.agents]

    def get_agents_by_type(self, agent_type: str) -> List[AgentRegistration]:
        """Get all agents of a specific type."""
        agent_ids = self.type_index.get(agent_type, set())
        return [self.agents[aid] for aid in agent_ids if aid in self.agents]

    def get_agents_by_namespace(self, namespace: str) -> List[AgentRegistration]:
        """Get all agents in a specific namespace."""
        agent_ids = self.namespace_index.get(namespace, set())
        return [self.agents[aid] for aid in agent_ids if aid in self.agents]

    def find_agents(
        self,
        industries: Optional[List[str]] = None,
        capabilities: Optional[List[str]] = None,
        agent_types: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        namespace: str = "default"
    ) -> List[AgentRegistration]:
        """
        Find agents matching multiple criteria.
        All criteria are ANDed together.
        """
        # Start with namespace filter
        if namespace in self.namespace_index:
            candidates = set(self.namespace_index[namespace])
        else:
            candidates = set(self.agents.keys())

        # Apply industry filter
        if industries:
            for industry in industries:
                if industry in self.industry_index:
                    candidates &= self.industry_index[industry]
                else:
                    return []  # No agents in this industry

        # Apply capability filter (agent must have ALL specified capabilities)
        if capabilities:
            for cap in capabilities:
                if cap in self.capability_index:
                    candidates &= self.capability_index[cap]
                else:
                    return []  # No agents with this capability

        # Apply type filter
        if agent_types:
            type_candidates = set()
            for atype in agent_types:
                if atype in self.type_index:
                    type_candidates |= self.type_index[atype]
            candidates &= type_candidates

        # Apply tag filter
        if tags:
            tagged_agents = []
            for aid in candidates:
                agent = self.agents.get(aid)
                if agent and any(tag in agent.metadata.tags for tag in tags):
                    tagged_agents.append(aid)
            candidates &= set(tagged_agents)

        return [self.agents[aid] for aid in candidates if aid in self.agents]

    def match_agent(
        self,
        required_capabilities: List[str],
        preferred_industries: Optional[List[str]] = None
    ) -> Optional[AgentRegistration]:
        """
        Find the best matching agent for a set of required capabilities.
        Uses load balancing and preference scoring.
        """
        candidates = self.find_agents(
            industries=preferred_industries,
            capabilities=required_capabilities
        )

        if not candidates:
            return None

        # Score and rank candidates
        scored = []
        for agent in candidates:
            score = len(set(agent.capabilities) & set(required_capabilities))
            score += len(required_capabilities)  # Bonus for exact match
            scored.append((score, agent))

        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[0][1]

    # ==================== Health Management ====================

    async def update_heartbeat(self, agent_id: str) -> bool:
        """Update agent heartbeat timestamp."""
        async with self._lock:
            if agent_id not in self.agents:
                return False

            self.agents[agent_id].last_seen = datetime.utcnow()
            self.agents[agent_id].health_status = "healthy"
            return True

    async def update_health_status(self, agent_id: str, status: str) -> bool:
        """Update agent health status."""
        async with self._lock:
            if agent_id not in self.agents:
                return False

            self.agents[agent_id].health_status = status
            return True

    def get_unhealthy_agents(self, timeout_seconds: int = 60) -> List[AgentRegistration]:
        """Get agents that have missed their heartbeat."""
        cutoff = datetime.utcnow() - timedelta(seconds=timeout_seconds)
        return [
            agent for agent in self.agents.values()
            if agent.last_seen < cutoff
        ]

    async def cleanup_stale_agents(self) -> int:
        """Remove agents that have been offline for too long."""
        async with self._lock:
            stale = self.get_unhealthy_agents(self.heartbeat_timeout)
            count = 0

            for agent in stale:
                await self.unregister(agent.agent_id)
                count += 1

            if count > 0:
                logger.info(f"Cleaned up {count} stale agents")

            return count

    # ==================== Lifecycle ====================

    async def start(self):
        """Start the registry background tasks."""
        self._running = True
        self._heartbeat_task = asyncio.create_task(self._health_check_loop())
        logger.info("Agent Registry started")

    async def stop(self):
        """Stop the registry background tasks."""
        self._running = False
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
        logger.info("Agent Registry stopped")

    async def _health_check_loop(self):
        """Background loop for health checking."""
        while self._running:
            try:
                await asyncio.sleep(self.cleanup_interval)
                await self.cleanup_stale_agents()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health check error: {e}")

    # ==================== Export/Import ====================

    def export_registry(self) -> Dict[str, Any]:
        """Export the entire registry as JSON."""
        return {
            "exported_at": datetime.utcnow().isoformat(),
            "total_agents": len(self.agents),
            "industries": list(self.industry_index.keys()),
            "capabilities": list(self.capability_index.keys()),
            "agents": [agent.to_dict() for agent in self.agents.values()]
        }

    async def import_registry(self, data: Dict[str, Any]) -> int:
        """Import agents from exported data."""
        count = 0
        for agent_data in data.get("agents", []):
            try:
                metadata = AgentMetadata(
                    version=agent_data.get("metadata", {}).get("version", "1.0.0"),
                    author=agent_data.get("metadata", {}).get("author", ""),
                    description=agent_data.get("metadata", {}).get("description", ""),
                    tags=agent_data.get("metadata", {}).get("tags", []),
                    dependencies=agent_data.get("metadata", {}).get("dependencies", []),
                    health_check_endpoint=agent_data.get("metadata", {}).get("health_check_endpoint"),
                    metrics_endpoint=agent_data.get("metadata", {}).get("metrics_endpoint")
                )

                await self.register(
                    agent_id=agent_data["agent_id"],
                    name=agent_data["name"],
                    industry=agent_data["industry"],
                    agent_type=agent_data["agent_type"],
                    capabilities=agent_data["capabilities"],
                    endpoints=agent_data["endpoints"],
                    metadata=metadata,
                    version=agent_data.get("version", "1.0.0")
                )
                count += 1
            except Exception as e:
                logger.error(f"Failed to import agent {agent_data.get('agent_id')}: {e}")

        logger.info(f"Imported {count} agents from registry export")
        return count

    # ==================== Statistics ====================

    def get_stats(self) -> Dict[str, Any]:
        """Get registry statistics."""
        industry_counts = {
            industry: len(agents)
            for industry, agents in self.industry_index.items()
        }

        capability_counts = {
            cap: len(agents)
            for cap, agents in self.capability_index.items()
        }

        return {
            "total_agents": len(self.agents),
            "total_industries": len(self.industry_index),
            "total_capabilities": len(self.capability_index),
            "total_types": len(self.type_index),
            "agents_by_industry": industry_counts,
            "agents_by_capability": capability_counts,
            "unhealthy_agents": len(self.get_unhealthy_agents())
        }
