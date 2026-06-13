"""
AgentOS Hub - API Gateway

FastAPI-based REST API gateway providing unified access to all 24 industry verticals.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ..core.orchestrator import AgentOrchestrator, IndustryType, Agent, AgentStatus
from ..core.registry import AgentRegistry
from ..core.event_bus import EventBus
from ..core.health_monitor import HealthMonitor

logger = logging.getLogger(__name__)


# ==================== Request/Response Models ====================

class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    timestamp: str
    version: str
    uptime_seconds: float


class IndustryOverviewResponse(BaseModel):
    """Industry overview response."""
    total_industries: int
    industries: List[Dict[str, Any]]


class AgentRegisterRequest(BaseModel):
    """Agent registration request."""
    agent_id: str
    name: str
    industry: str
    agent_type: str
    capabilities: List[str]
    endpoints: Dict[str, str]
    version: str = "1.0.0"
    metadata: Optional[Dict[str, Any]] = None


class WorkflowCreateRequest(BaseModel):
    """Workflow creation request."""
    name: str
    description: str
    industries: List[str]
    steps: List[Dict[str, Any]]
    initial_context: Optional[Dict[str, Any]] = None


class CrossIndustryRequest(BaseModel):
    """Cross-industry operation request."""
    source_industry: str
    target_industry: str
    operation: str
    payload: Dict[str, Any]


class BroadcastRequest(BaseModel):
    """Broadcast request."""
    industry: str
    message: Dict[str, Any]


class AgentOSHub:
    """
    Main API Gateway class that orchestrates all components.

    Provides:
    - Agent registration and discovery
    - Workflow orchestration
    - Cross-industry operations
    - Health monitoring
    - Event management
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.start_time = datetime.utcnow()

        # Initialize core components
        self.orchestrator = AgentOrchestrator(config)
        self.registry = AgentRegistry(config)
        self.event_bus = EventBus(config)
        self.health_monitor = HealthMonitor(config)

        self._running = False

    async def start(self):
        """Start all components."""
        if self._running:
            return

        await self.orchestrator.start()
        await self.registry.start()
        await self.event_bus.start()
        await self.health_monitor.start()

        # Setup event handlers
        await self._setup_event_handlers()

        self._running = True
        logger.info("AgentOS Hub API Gateway started")

    async def stop(self):
        """Stop all components."""
        if not self._running:
            return

        await self.orchestrator.stop()
        await self.registry.stop()
        await self.event_bus.stop()
        await self.health_monitor.stop()

        self._running = False
        logger.info("AgentOS Hub API Gateway stopped")

    async def _setup_event_handlers(self):
        """Setup internal event handlers."""
        # Forward orchestrator events to event bus
        async def on_agent_registered(data):
            await self.event_bus.publish(
                "agent.registered",
                source="orchestrator",
                payload=data
            )

        async def on_workflow_completed(data):
            await self.event_bus.publish(
                "workflow.completed",
                source="orchestrator",
                payload=data
            )

        await self.orchestrator.on("agent_registered", on_agent_registered)
        await self.orchestrator.on("workflow_completed", on_workflow_completed)

    @property
    def uptime_seconds(self) -> float:
        """Get uptime in seconds."""
        return (datetime.utcnow() - self.start_time).total_seconds()


# ==================== FastAPI Application ====================

# Global instance
_hub: Optional[AgentOSHub] = None


def get_hub() -> AgentOSHub:
    """Get the global hub instance."""
    global _hub
    if _hub is None:
        _hub = AgentOSHub()
    return _hub


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    hub = get_hub()
    await hub.start()
    yield
    await hub.stop()


def create_app(config: Optional[Dict[str, Any]] = None) -> FastAPI:
    """Create and configure the FastAPI application."""
    global _hub

    if config:
        _hub = AgentOSHub(config)

    app = FastAPI(
        title="AgentOS Hub API",
        description="Unified API Gateway for all 24 Industry Vertical Agents",
        version="1.0.0",
        lifespan=lifespan
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    from .routes import router
    app.include_router(router, prefix="/api/v1")

    return app


class APIGateway:
    """
    Standalone API Gateway class for external usage.
    Can be used without FastAPI.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.hub = AgentOSHub(config)

    async def start(self):
        """Start the gateway."""
        await self.hub.start()

    async def stop(self):
        """Stop the gateway."""
        await self.hub.stop()

    @property
    def orchestrator(self) -> AgentOrchestrator:
        return self.hub.orchestrator

    @property
    def registry(self) -> AgentRegistry:
        return self.hub.registry

    @property
    def event_bus(self) -> EventBus:
        return self.hub.event_bus

    @property
    def health_monitor(self) -> HealthMonitor:
        return self.hub.health_monitor
