"""
AgentOS Hub - Core Orchestrator

The central orchestration engine that coordinates all industry agents.
Supports cross-industry workflows, load balancing, and intelligent routing.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
from collections import defaultdict
import uuid

logger = logging.getLogger(__name__)


class IndustryType(Enum):
    """All 24 industry verticals supported by AgentOS Hub."""
    AGRICULTURE = "agriculture"
    AUTOMOTIVE = "automotive"
    BEAUTY = "beauty"
    BUSINESS_COPILOT = "business_copilot"
    CONSTRUCTION = "construction"
    EDUCATION = "education"
    ENTERTAINMENT = "entertainment"
    FASHION = "fashion"
    FINANCIAL = "financial"
    FITNESS = "fitness"
    GAMING = "gaming"
    GENIE = "genie"
    GOVERNMENT = "government"
    HEALTHCARE = "healthcare"
    HOME_SERVICES = "home_services"
    HOTEL = "hotel"
    LEGAL = "legal"
    MANUFACTURING = "manufacturing"
    NONPROFIT = "nonprofit"
    PROFESSIONAL = "professional"
    REALESTATE = "realestate"
    RESTAURANT = "restaurant"
    RETAIL = "retail"
    SPORTS = "sports"
    TRANSPORT = "transport"
    TRAVEL = "travel"


class AgentStatus(Enum):
    """Agent operational status."""
    IDLE = "idle"
    BUSY = "busy"
    ERROR = "error"
    OFFLINE = "offline"
    HEALTHY = "healthy"


class WorkflowPriority(Enum):
    """Workflow execution priority levels."""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class Agent:
    """Represents an AI agent in the ecosystem."""
    id: str
    name: str
    industry: IndustryType
    capabilities: List[str]
    endpoint: str
    protocol: str = "grpc"
    status: AgentStatus = AgentStatus.IDLE
    max_concurrent_tasks: int = 10
    current_tasks: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)
    last_heartbeat: datetime = field(default_factory=datetime.utcnow)
    error_count: int = 0
    success_count: int = 0

    def is_available(self) -> bool:
        """Check if agent can accept new tasks."""
        return (
            self.status == AgentStatus.IDLE or
            self.status == AgentStatus.HEALTHY and
            self.current_tasks < self.max_concurrent_tasks
        )


@dataclass
class WorkflowTask:
    """Represents a workflow task to be executed."""
    id: str
    workflow_id: str
    agent_id: str
    action: str
    payload: Dict[str, Any]
    priority: WorkflowPriority = WorkflowPriority.NORMAL
    timeout: int = 300  # seconds
    retry_count: int = 0
    max_retries: int = 3
    created_at: datetime = field(default_factory=datetime.utcnow)
    status: str = "pending"
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@dataclass
class Workflow:
    """Represents a multi-agent workflow spanning industries."""
    id: str
    name: str
    description: str
    industries: List[IndustryType]
    steps: List[Dict[str, Any]]
    status: str = "pending"
    created_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    context: Dict[str, Any] = field(default_factory=dict)


class AgentOrchestrator:
    """
    Central orchestration engine for all RTMN industry agents.

    Features:
    - Unified agent registry across all 24 industries
    - Cross-industry workflow orchestration
    - Intelligent load balancing
    - Event-driven architecture
    - Health monitoring and auto-recovery
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.agents: Dict[str, Agent] = {}
        self.workflows: Dict[str, Workflow] = {}
        self.pending_tasks: asyncio.PriorityQueue = asyncio.PriorityQueue()
        self.active_tasks: Dict[str, WorkflowTask] = {}
        self.event_handlers: Dict[str, List[Callable]] = defaultdict(list)
        self.industry_adapters: Dict[IndustryType, Any] = {}
        self._running = False
        self._task_processor: Optional[asyncio.Task] = None

        # Initialize industry configurations
        self._initialize_industry_configs()

    def _initialize_industry_configs(self):
        """Initialize port and service configurations for all 24 industries."""
        self.industry_configs = {
            IndustryType.AGRICULTURE: {
                "ports": [5001, 5012, 5034, 5045, 5056],
                "gateway": "http://localhost:5001",
                "twins": ["crop", "soil", "weather", "equipment", "inventory"],
                "agents": ["field", "crop", "irrigation", "harvest", "market"]
            },
            IndustryType.AUTOMOTIVE: {
                "ports": [7501, 7502, 7503, 7504, 8102],
                "gateway": "http://localhost:8102",
                "twins": ["vehicle", "driver", "dealer", "service"],
                "agents": ["sales", "service", "diagnostic", "inventory"]
            },
            IndustryType.BEAUTY: {
                "ports": [3100, 3200, 3400, 3500, 4004, 4142, 4300],
                "gateway": "http://localhost:3100",
                "twins": ["customer", "product", "stylist", "appointment", "inventory"],
                "agents": ["booking", "product", "stylist", "customer"]
            },
            IndustryType.BUSINESS_COPILOT: {
                "ports": [4200, 4210, 4220, 4230],
                "gateway": "http://localhost:4200",
                "twins": ["document", "calendar", "task", "project"],
                "agents": ["assistant", "analyst", "coordinator", "reporter"]
            },
            IndustryType.CONSTRUCTION: {
                "ports": [4001, 4022, 4023, 4034, 4045],
                "gateway": "http://localhost:4001",
                "twins": ["project", "worker", "equipment", "material", "safety"],
                "agents": ["project", "safety", "resource", "compliance"]
            },
            IndustryType.EDUCATION: {
                "ports": [3000, 3100, 4142, 4200, 5100],
                "gateway": "http://localhost:3000",
                "twins": ["student", "course", "instructor", "assignment", "certificate"],
                "agents": ["enrollment", "assessment", "grade", "career"]
            },
            IndustryType.ENTERTAINMENT: {
                "ports": [7001, 7002, 7003, 7004, 7005, 8101],
                "gateway": "http://localhost:8101",
                "twins": ["content", "viewer", "creator", "platform", "event"],
                "agents": ["content", "recommendation", "streaming", "engagement"]
            },
            IndustryType.FASHION: {
                "ports": [5543, 5544, 5545, 5546, 5547, 5548],
                "gateway": "http://localhost:5548",
                "twins": ["style", "wardrobe", "trend", "designer", "retail"],
                "agents": ["style", "trend", "inventory", "customer"]
            },
            IndustryType.FINANCIAL: {
                "ports": [8943, 8944, 8945, 8946, 8947, 8948, 8949, 8950, 8951, 8952],
                "gateway": "http://localhost:8952",
                "twins": ["account", "transaction", "customer", "product", "portfolio",
                          "compliance", "risk", "trading", "loan"],
                "agents": ["account", "loan", "investment", "compliance", "risk", "trading"]
            },
            IndustryType.FITNESS: {
                "ports": [3100, 3200, 4142, 4300, 4400],
                "gateway": "http://localhost:3100",
                "twins": ["body", "fitness", "trainer", "gym", "goal"],
                "agents": ["workout", "trainer", "nutrition", "progress"]
            },
            IndustryType.GAMING: {
                "ports": [3001, 3002, 3003, 3011, 3023, 3030],
                "gateway": "http://localhost:3001",
                "twins": ["player", "game", "match", "achievement", "leaderboard", "tournament"],
                "agents": ["matchmaking", "player", "tournament", "achievement"]
            },
            IndustryType.GENIE: {
                "ports": [9100, 9101, 9102, 9103],
                "gateway": "http://localhost:9100",
                "twins": ["wish", "fulfillment", "magic", "result"],
                "agents": ["wishmaker", "fulfillment", "magic", "result"]
            },
            IndustryType.GOVERNMENT: {
                "ports": [5443, 6443, 7443, 7444, 7445, 7446, 7447, 8443, 9443],
                "gateway": "http://localhost:8443",
                "twins": ["citizen", "service", "department", "permit", "complaint"],
                "agents": ["citizen", "permit", "service", "compliance"]
            },
            IndustryType.HEALTHCARE: {
                "ports": [8643, 8644, 8645, 8646, 8647, 8648, 8649],
                "gateway": "http://localhost:8643",
                "twins": ["patient", "doctor", "staff", "facility", "insurance"],
                "agents": ["patient", "scheduling", "insurance", "clinical"]
            },
            IndustryType.HOME_SERVICES: {
                "ports": [7601, 7602, 7603, 7604, 8103],
                "gateway": "http://localhost:8103",
                "twins": ["home", "service_provider", "job", "customer"],
                "agents": ["booking", "dispatch", "quality", "customer", "payment"]
            },
            IndustryType.HOTEL: {
                "ports": [8443, 8444, 8445, 8446, 8447, 8448, 8449, 8450, 8451, 8452],
                "gateway": "http://localhost:8443",
                "twins": ["guest", "room", "property", "staff", "experience"],
                "agents": ["reservation", "housekeeping", "concierge", "revenue"]
            },
            IndustryType.LEGAL: {
                "ports": [4190, 5004, 4180, 4181, 4182, 4183, 4184, 4185, 3000],
                "gateway": "http://localhost:4190",
                "twins": ["client", "matter", "document", "attorney", "court"],
                "agents": ["case", "document", "billing", "court"]
            },
            IndustryType.MANUFACTURING: {
                "ports": [6001, 6002, 6003, 6004, 6005, 6006],
                "gateway": "http://localhost:6001",
                "twins": ["plant", "machine", "inventory", "vendor", "product", "quality"],
                "agents": ["production", "quality", "maintenance", "inventory", "procurement", "safety"]
            },
            IndustryType.NONPROFIT: {
                "ports": [8343, 8344, 8345, 8346, 8347, 8348, 7343, 6343],
                "gateway": "http://localhost:7343",
                "twins": ["donor", "beneficiary", "organization", "campaign", "impact"],
                "agents": ["donation", "grant", "volunteer", "impact"]
            },
            IndustryType.PROFESSIONAL: {
                "ports": [6101, 6102, 6103, 6104, 6105, 6106],
                "gateway": "http://localhost:6106",
                "twins": ["professional", "client", "project", "resource", "invoice"],
                "agents": ["project", "resource", "billing", "client", "talent", "compliance"]
            },
            IndustryType.REALESTATE: {
                "ports": [8843, 8844, 8845, 8846, 8847, 8848, 8849, 8850],
                "gateway": "http://localhost:8850",
                "twins": ["property", "agent", "buyer", "deal", "area", "referral"],
                "agents": ["listing", "showing", "negotiation", "closing"]
            },
            IndustryType.RESTAURANT: {
                "ports": [8543, 8544, 8545, 8546, 8547, 8548, 8549, 8550, 8551],
                "gateway": "http://localhost:8551",
                "twins": ["table", "kitchen", "menu", "customer", "staff", "order", "reservation"],
                "agents": ["reservation", "kitchen", "inventory", "customer"]
            },
            IndustryType.RETAIL: {
                "ports": [8743, 8744, 8745, 8746, 8747, 8748, 8749, 8750, 8751, 8752],
                "gateway": "http://localhost:8752",
                "twins": ["shopper", "store", "product", "basket", "order"],
                "agents": ["shopping", "inventory", "loyalty", "fulfillment"]
            },
            IndustryType.SPORTS: {
                "ports": [5643, 5644, 5645, 5646, 5647, 5656],
                "gateway": "http://localhost:5656",
                "twins": ["fan", "athlete", "team", "venue", "event"],
                "agents": ["ticket", "fantasy", "media", "athlete"]
            },
            IndustryType.TRANSPORT: {
                "ports": [9043, 9044, 9045, 9046, 9047, 9048, 9049],
                "gateway": "http://localhost:9043",
                "twins": ["vehicle", "driver", "rider", "fleet", "journey", "order"],
                "agents": ["routing", "dispatch", "safety", "compliance"]
            },
            IndustryType.TRAVEL: {
                "ports": [6501, 6502, 6503, 6504, 6505, 6506],
                "gateway": "http://localhost:6506",
                "twins": ["traveler", "destination", "package", "booking", "experience"],
                "agents": ["booking", "concierge", "recommendation", "loyalty"]
            }
        }

    # ==================== Agent Management ====================

    async def register_agent(self, agent: Agent) -> bool:
        """Register a new agent with the orchestrator."""
        try:
            self.agents[agent.id] = agent
            logger.info(f"Registered agent {agent.name} for {agent.industry.value}")
            await self._emit_event("agent_registered", {"agent_id": agent.id, "industry": agent.industry.value})
            return True
        except Exception as e:
            logger.error(f"Failed to register agent {agent.id}: {e}")
            return False

    async def unregister_agent(self, agent_id: str) -> bool:
        """Unregister an agent from the orchestrator."""
        if agent_id in self.agents:
            agent = self.agents.pop(agent_id)
            logger.info(f"Unregistered agent {agent.name}")
            await self._emit_event("agent_unregistered", {"agent_id": agent_id})
            return True
        return False

    def get_agent(self, agent_id: str) -> Optional[Agent]:
        """Get agent by ID."""
        return self.agents.get(agent_id)

    def get_agents_by_industry(self, industry: IndustryType) -> List[Agent]:
        """Get all agents for a specific industry."""
        return [a for a in self.agents.values() if a.industry == industry]

    def get_agents_by_capability(self, capability: str) -> List[Agent]:
        """Get all agents with a specific capability."""
        return [a for a in self.agents.values() if capability in a.capabilities]

    async def update_agent_status(self, agent_id: str, status: AgentStatus) -> bool:
        """Update agent status."""
        if agent_id in self.agents:
            self.agents[agent_id].status = status
            self.agents[agent_id].last_heartbeat = datetime.utcnow()
            await self._emit_event("agent_status_changed", {
                "agent_id": agent_id,
                "status": status.value
            })
            return True
        return False

    # ==================== Workflow Management ====================

    async def create_workflow(
        self,
        name: str,
        description: str,
        industries: List[IndustryType],
        steps: List[Dict[str, Any]]
    ) -> Workflow:
        """Create a new cross-industry workflow."""
        workflow = Workflow(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            industries=industries,
            steps=steps,
            status="created"
        )
        self.workflows[workflow.id] = workflow
        logger.info(f"Created workflow {workflow.name} ({workflow.id}) across {len(industries)} industries")
        await self._emit_event("workflow_created", {"workflow_id": workflow.id, "name": name})
        return workflow

    async def execute_workflow(self, workflow_id: str, initial_context: Optional[Dict] = None) -> Dict[str, Any]:
        """Execute a workflow across multiple industries."""
        workflow = self.workflows.get(workflow_id)
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")

        workflow.status = "running"
        workflow.context = initial_context or {}

        logger.info(f"Executing workflow {workflow.name} with {len(workflow.steps)} steps")

        try:
            for step_idx, step in enumerate(workflow.steps):
                step_result = await self._execute_workflow_step(workflow, step, step_idx)
                workflow.context.update(step_result)

            workflow.status = "completed"
            workflow.completed_at = datetime.utcnow()
            await self._emit_event("workflow_completed", {"workflow_id": workflow_id})

        except Exception as e:
            workflow.status = "failed"
            logger.error(f"Workflow {workflow_id} failed: {e}")
            await self._emit_event("workflow_failed", {"workflow_id": workflow_id, "error": str(e)})
            raise

        return {"workflow_id": workflow_id, "status": workflow.status, "context": workflow.context}

    async def _execute_workflow_step(
        self,
        workflow: Workflow,
        step: Dict[str, Any],
        step_idx: int
    ) -> Dict[str, Any]:
        """Execute a single workflow step."""
        step_name = step.get("name", f"step_{step_idx}")
        industry = step.get("industry")
        action = step.get("action")
        params = step.get("params", {})

        # Find suitable agent
        agents = self.get_agents_by_industry(IndustryType(industry)) if industry else list(self.agents.values())

        # Filter by capability if specified
        if "capability" in step:
            agents = [a for a in agents if step["capability"] in a.capabilities]

        if not agents:
            raise ValueError(f"No suitable agent found for step {step_name}")

        # Select best agent (round-robin with load balancing)
        agent = self._select_best_agent(agents)

        # Create task
        task = WorkflowTask(
            id=str(uuid.uuid4()),
            workflow_id=workflow.id,
            agent_id=agent.id,
            action=action,
            payload={**params, "workflow_context": workflow.context},
            priority=WorkflowPriority[step.get("priority", "NORMAL")]
        )

        # Execute task
        result = await self._execute_task(task)
        agent.current_tasks -= 1

        return {f"step_{step_idx}_result": result}

    def _select_best_agent(self, agents: List[Agent]) -> Agent:
        """Select the best available agent using load balancing."""
        available = [a for a in agents if a.is_available()]
        if not available:
            available = agents  # Fall back to any agent

        # Select agent with lowest current load
        return min(available, key=lambda a: a.current_tasks)

    async def _execute_task(self, task: WorkflowTask) -> Dict[str, Any]:
        """Execute a single task with an agent."""
        agent = self.agents.get(task.agent_id)
        if not agent:
            raise ValueError(f"Agent {task.agent_id} not found")

        agent.current_tasks += 1
        task.status = "running"

        try:
            # In production, this would make actual gRPC/REST calls
            # For now, simulate execution
            logger.info(f"Executing task {task.id} with agent {agent.name}")

            # Simulate task execution
            await asyncio.sleep(0.1)  # Simulate network latency

            result = {
                "task_id": task.id,
                "agent_id": agent.id,
                "status": "completed",
                "output": f"Task {task.action} completed successfully"
            }

            task.status = "completed"
            task.result = result
            agent.success_count += 1

            await self._emit_event("task_completed", {"task_id": task.id})

            return result

        except Exception as e:
            task.status = "failed"
            task.error = str(e)
            agent.error_count += 1
            logger.error(f"Task {task.id} failed: {e}")

            # Retry logic
            if task.retry_count < task.max_retries:
                task.retry_count += 1
                return await self._execute_task(task)

            raise

    # ==================== Cross-Industry Operations ====================

    async def orchestrate_cross_industry(
        self,
        source_industry: IndustryType,
        target_industry: IndustryType,
        operation: str,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Orchestrate an operation across two industry verticals.
        Used for cross-industry integrations like Hotel -> Restaurant.
        """
        logger.info(f"Cross-industry operation: {source_industry.value} -> {target_industry.value}: {operation}")

        # Get agents from both industries
        source_agents = self.get_agents_by_industry(source_industry)
        target_agents = self.get_agents_by_industry(target_industry)

        if not source_agents:
            raise ValueError(f"No agents available for source industry: {source_industry.value}")

        if not target_agents:
            raise ValueError(f"No agents available for target industry: {target_industry.value}")

        # Execute cross-industry workflow
        workflow = await self.create_workflow(
            name=f"Cross-{source_industry.value}-{target_industry.value}",
            description=f"Cross-industry operation: {operation}",
            industries=[source_industry, target_industry],
            steps=[
                {
                    "name": "source_operation",
                    "industry": source_industry.value,
                    "action": f"prepare_{operation}",
                    "params": payload
                },
                {
                    "name": "transfer_data",
                    "industry": source_industry.value,
                    "action": "transfer_to_target",
                    "params": {"target_industry": target_industry.value}
                },
                {
                    "name": "target_operation",
                    "industry": target_industry.value,
                    "action": f"process_{operation}",
                    "params": {}
                }
            ]
        )

        return await self.execute_workflow(workflow.id)

    async def broadcast_to_industry(
        self,
        industry: IndustryType,
        message: Dict[str, Any]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Broadcast a message to all agents in an industry."""
        agents = self.get_agents_by_industry(industry)
        results = []

        for agent in agents:
            try:
                result = await self._send_to_agent(agent, message)
                results.append({"agent_id": agent.id, "status": "success", "result": result})
            except Exception as e:
                results.append({"agent_id": agent.id, "status": "error", "error": str(e)})

        return {"broadcast_results": results}

    async def _send_to_agent(self, agent: Agent, message: Dict[str, Any]) -> Dict[str, Any]:
        """Send a message to a specific agent."""
        logger.info(f"Sending message to agent {agent.name}")
        await asyncio.sleep(0.05)  # Simulate network call
        return {"status": "received", "agent_id": agent.id}

    # ==================== Event System ====================

    async def on(self, event: str, handler: Callable):
        """Register an event handler."""
        self.event_handlers[event].append(handler)

    async def _emit_event(self, event: str, data: Dict[str, Any]):
        """Emit an event to all registered handlers."""
        for handler in self.event_handlers.get(event, []):
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(data)
                else:
                    handler(data)
            except Exception as e:
                logger.error(f"Event handler error for {event}: {e}")

    # ==================== Lifecycle Management ====================

    async def start(self):
        """Start the orchestrator."""
        if self._running:
            logger.warning("Orchestrator already running")
            return

        self._running = True
        self._task_processor = asyncio.create_task(self._process_tasks())
        logger.info("AgentOS Hub Orchestrator started")

    async def stop(self):
        """Stop the orchestrator."""
        self._running = False
        if self._task_processor:
            self._task_processor.cancel()
        logger.info("AgentOS Hub Orchestrator stopped")

    async def _process_tasks(self):
        """Background task processor."""
        while self._running:
            try:
                # Process any pending tasks
                await asyncio.sleep(1)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Task processor error: {e}")

    # ==================== Monitoring & Statistics ====================

    def get_stats(self) -> Dict[str, Any]:
        """Get orchestrator statistics."""
        industry_stats = {}
        for industry in IndustryType:
            agents = self.get_agents_by_industry(industry)
            industry_stats[industry.value] = {
                "agent_count": len(agents),
                "healthy_agents": len([a for a in agents if a.status == AgentStatus.HEALTHY]),
                "busy_agents": len([a for a in agents if a.status == AgentStatus.BUSY]),
                "idle_agents": len([a for a in agents if a.status == AgentStatus.IDLE]),
                "total_successes": sum(a.success_count for a in agents),
                "total_errors": sum(a.error_count for a in agents)
            }

        return {
            "total_agents": len(self.agents),
            "total_workflows": len(self.workflows),
            "active_workflows": len([w for w in self.workflows.values() if w.status == "running"]),
            "completed_workflows": len([w for w in self.workflows.values() if w.status == "completed"]),
            "failed_workflows": len([w for w in self.workflows.values() if w.status == "failed"]),
            "industry_stats": industry_stats
        }

    def get_industry_overview(self) -> Dict[str, Any]:
        """Get a comprehensive overview of all industries."""
        overview = {
            "total_industries": len(IndustryType),
            "industries": []
        }

        for industry in IndustryType:
            config = self.industry_configs.get(industry, {})
            agents = self.get_agents_by_industry(industry)

            overview["industries"].append({
                "name": industry.value,
                "display_name": industry.name.replace("_", " ").title(),
                "twins": config.get("twins", []),
                "agent_count": len(agents),
                "registered_agents": [a.name for a in agents],
                "ports": config.get("ports", []),
                "gateway": config.get("gateway", "N/A")
            })

        return overview
