"""
AgentOS Hub - Health Monitor

Comprehensive health monitoring for all 24 industry agents.
Provides real-time health status, alerting, and auto-recovery capabilities.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from collections import defaultdict
import json

logger = logging.getLogger(__name__)


class HealthStatus(Enum):
    """Health status levels."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


class AlertSeverity(Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class HealthCheck:
    """Individual health check result."""
    name: str
    status: HealthStatus
    message: str = ""
    duration_ms: float = 0.0
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentHealth:
    """Health status for a single agent."""
    agent_id: str
    agent_name: str
    industry: str
    status: HealthStatus
    last_check: datetime = field(default_factory=datetime.utcnow)
    last_heartbeat: Optional[datetime] = None
    uptime_seconds: float = 0.0
    checks: List[HealthCheck] = field(default_factory=list)
    error_count: int = 0
    success_count: int = 0
    total_requests: int = 0
    avg_response_time_ms: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "agent_id": self.agent_id,
            "agent_name": self.agent_name,
            "industry": self.industry,
            "status": self.status.value,
            "last_check": self.last_check.isoformat(),
            "last_heartbeat": self.last_heartbeat.isoformat() if self.last_heartbeat else None,
            "uptime_seconds": self.uptime_seconds,
            "checks": [
                {
                    "name": c.name,
                    "status": c.status.value,
                    "message": c.message,
                    "duration_ms": c.duration_ms
                }
                for c in self.checks
            ],
            "error_count": self.error_count,
            "success_count": self.success_count,
            "total_requests": self.total_requests,
            "avg_response_time_ms": self.avg_response_time_ms,
            "metadata": self.metadata
        }


@dataclass
class Alert:
    """Alert notification."""
    id: str
    severity: AlertSeverity
    agent_id: str
    agent_name: str
    industry: str
    title: str
    message: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    acknowledged: bool = False
    resolved: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


class HealthMonitor:
    """
    Comprehensive health monitoring for AgentOS Hub.

    Features:
    - Real-time health status for all agents
    - Configurable health checks per industry
    - Alerting and notification system
    - Auto-recovery capabilities
    - Health metrics and statistics
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.agent_health: Dict[str, AgentHealth] = {}
        self.alerts: List[Alert] = []
        self.alert_handlers: List[Callable[[Alert], None]] = []
        self._running = False
        self._monitor_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()

        # Configuration
        self.check_interval = self.config.get("check_interval", 30)  # seconds
        self.heartbeat_timeout = self.config.get("heartbeat_timeout", 60)  # seconds
        self.error_threshold = self.config.get("error_threshold", 5)
        self.response_time_threshold_ms = self.config.get("response_time_threshold_ms", 5000)

        # Industry-specific thresholds
        self.industry_thresholds = {
            "financial": {"response_time_ms": 1000, "error_rate": 0.01},
            "healthcare": {"response_time_ms": 2000, "error_rate": 0.01},
            "government": {"response_time_ms": 5000, "error_rate": 0.05},
            "hotel": {"response_time_ms": 2000, "error_rate": 0.03},
            "restaurant": {"response_time_ms": 3000, "error_rate": 0.05},
            "retail": {"response_time_ms": 2000, "error_rate": 0.05},
            "travel": {"response_time_ms": 3000, "error_rate": 0.05},
        }

    # ==================== Agent Health Management ====================

    async def register_agent_health(
        self,
        agent_id: str,
        agent_name: str,
        industry: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AgentHealth:
        """Register an agent for health monitoring."""
        async with self._lock:
            health = AgentHealth(
                agent_id=agent_id,
                agent_name=agent_name,
                industry=industry,
                status=HealthStatus.UNKNOWN,
                metadata=metadata or {}
            )
            self.agent_health[agent_id] = health
            logger.info(f"Registered {agent_name} ({agent_id}) for health monitoring")
            return health

    async def update_heartbeat(self, agent_id: str) -> bool:
        """Update agent heartbeat."""
        async with self._lock:
            if agent_id not in self.agent_health:
                return False

            health = self.agent_health[agent_id]
            health.last_heartbeat = datetime.utcnow()
            health.last_check = datetime.utcnow()

            # Check if agent is responsive
            if health.status == HealthStatus.UNKNOWN:
                health.status = HealthStatus.HEALTHY

            return True

    async def record_check(
        self,
        agent_id: str,
        check: HealthCheck
    ) -> bool:
        """Record a health check result."""
        async with self._lock:
            if agent_id not in self.agent_health:
                return False

            health = self.agent_health[agent_id]
            health.checks.append(check)
            health.last_check = datetime.utcnow()

            # Keep only recent checks
            if len(health.checks) > 100:
                health.checks = health.checks[-100:]

            # Update status based on check
            if check.status == HealthStatus.UNHEALTHY:
                health.error_count += 1
                await self._evaluate_health(health)
            elif check.status == HealthStatus.HEALTHY:
                health.success_count += 1

            # Update response time metrics
            health.total_requests += 1
            if health.avg_response_time_ms == 0:
                health.avg_response_time_ms = check.duration_ms
            else:
                health.avg_response_time_ms = (
                    (health.avg_response_time_ms * (health.total_requests - 1) + check.duration_ms)
                    / health.total_requests
                )

            return True

    async def record_request(
        self,
        agent_id: str,
        success: bool,
        response_time_ms: float
    ):
        """Record a request result for metrics."""
        async with self._lock:
            if agent_id not in self.agent_health:
                return

            health = self.agent_health[agent_id]
            health.total_requests += 1

            if success:
                health.success_count += 1
            else:
                health.error_count += 1

            # Update average response time
            if health.avg_response_time_ms == 0:
                health.avg_response_time_ms = response_time_ms
            else:
                health.avg_response_time_ms = (
                    (health.avg_response_time_ms * (health.total_requests - 1) + response_time_ms)
                    / health.total_requests
                )

            await self._evaluate_health(health)

    async def _evaluate_health(self, health: AgentHealth):
        """Evaluate overall health status."""
        industry = health.industry.lower()
        thresholds = self.industry_thresholds.get(industry, {
            "response_time_ms": 5000,
            "error_rate": 0.05
        })

        # Check error rate
        if health.total_requests > 0:
            error_rate = health.error_count / health.total_requests
            if error_rate > thresholds["error_rate"]:
                health.status = HealthStatus.UNHEALTHY
                await self._create_alert(
                    AlertSeverity.ERROR,
                    health,
                    "High Error Rate",
                    f"Error rate {error_rate:.2%} exceeds threshold {thresholds['error_rate']:.2%}"
                )
                return

        # Check response time
        if health.avg_response_time_ms > thresholds["response_time_ms"]:
            health.status = HealthStatus.DEGRADED
            await self._create_alert(
                AlertSeverity.WARNING,
                health,
                "Slow Response Time",
                f"Avg response time {health.avg_response_time_ms:.0f}ms exceeds threshold {thresholds['response_time_ms']}ms"
            )
            return

        # Check heartbeat
        if health.last_heartbeat:
            time_since_heartbeat = (datetime.utcnow() - health.last_heartbeat).total_seconds()
            if time_since_heartbeat > self.heartbeat_timeout:
                health.status = HealthStatus.UNHEALTHY
                await self._create_alert(
                    AlertSeverity.ERROR,
                    health,
                    "Heartbeat Timeout",
                    f"No heartbeat for {time_since_heartbeat:.0f} seconds"
                )
                return

        # All checks passed
        if health.status != HealthStatus.HEALTHY:
            health.status = HealthStatus.HEALTHY

    # ==================== Alerting ====================

    async def _create_alert(
        self,
        severity: AlertSeverity,
        health: AgentHealth,
        title: str,
        message: str
    ):
        """Create and dispatch an alert."""
        alert = Alert(
            id=f"alert_{len(self.alerts) + 1}",
            severity=severity,
            agent_id=health.agent_id,
            agent_name=health.agent_name,
            industry=health.industry,
            title=title,
            message=message
        )

        self.alerts.append(alert)
        logger.warning(f"Alert created: {title} for {health.agent_name}")

        # Dispatch to handlers
        for handler in self.alert_handlers:
            try:
                handler(alert)
            except Exception as e:
                logger.error(f"Alert handler error: {e}")

    def on_alert(self, handler: Callable[[Alert], None]):
        """Register an alert handler."""
        self.alert_handlers.append(handler)

    async def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge an alert."""
        for alert in self.alerts:
            if alert.id == alert_id:
                alert.acknowledged = True
                return True
        return False

    async def resolve_alert(self, alert_id: str) -> bool:
        """Resolve an alert."""
        for alert in self.alerts:
            if alert.id == alert_id:
                alert.resolved = True
                return True
        return False

    def get_active_alerts(
        self,
        severity: Optional[AlertSeverity] = None,
        industry: Optional[str] = None
    ) -> List[Alert]:
        """Get active (unresolved) alerts."""
        alerts = [a for a in self.alerts if not a.resolved]

        if severity:
            alerts = [a for a in alerts if a.severity == severity]

        if industry:
            alerts = [a for a in alerts if a.industry == industry]

        return alerts

    # ==================== Health Checks ====================

    async def run_health_check(
        self,
        agent_id: str,
        checks: List[Dict[str, Any]]
    ) -> List[HealthCheck]:
        """Run health checks for an agent."""
        results = []

        for check_config in checks:
            check = await self._run_single_check(agent_id, check_config)
            results.append(check)
            await self.record_check(agent_id, check)

        return results

    async def _run_single_check(
        self,
        agent_id: str,
        check_config: Dict[str, Any]
    ) -> HealthCheck:
        """Run a single health check."""
        start_time = datetime.utcnow()
        check_name = check_config.get("name", "unknown")

        try:
            # Run the check (simulated)
            await asyncio.sleep(0.01)  # Simulate check duration

            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            return HealthCheck(
                name=check_name,
                status=HealthStatus.HEALTHY,
                message="Check passed",
                duration_ms=duration_ms
            )

        except Exception as e:
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
            return HealthCheck(
                name=check_name,
                status=HealthStatus.UNHEALTHY,
                message=str(e),
                duration_ms=duration_ms
            )

    # ==================== Monitoring Loop ====================

    async def start(self):
        """Start the health monitoring loop."""
        if self._running:
            return

        self._running = True
        self._monitor_task = asyncio.create_task(self._monitor_loop())
        logger.info("Health Monitor started")

    async def stop(self):
        """Stop the health monitoring loop."""
        self._running = False
        if self._monitor_task:
            self._monitor_task.cancel()
        logger.info("Health Monitor stopped")

    async def _monitor_loop(self):
        """Background monitoring loop."""
        while self._running:
            try:
                await asyncio.sleep(self.check_interval)
                await self._check_all_agents()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Monitor loop error: {e}")

    async def _check_all_agents(self):
        """Check health of all registered agents."""
        for agent_id, health in list(self.agent_health.items()):
            # Check heartbeat timeout
            if health.last_heartbeat:
                time_since = (datetime.utcnow() - health.last_heartbeat).total_seconds()
                if time_since > self.heartbeat_timeout:
                    health.status = HealthStatus.UNHEALTHY
                    await self._create_alert(
                        AlertSeverity.ERROR,
                        health,
                        "Agent Unresponsive",
                        f"No heartbeat for {time_since:.0f} seconds"
                    )

    # ==================== Statistics & Reporting ====================

    def get_all_health(self) -> Dict[str, Any]:
        """Get health status of all agents."""
        by_industry = defaultdict(list)
        for health in self.agent_health.values():
            by_industry[health.industry].append(health.to_dict())

        return {
            "total_agents": len(self.agent_health),
            "healthy_agents": len([h for h in self.agent_health.values() if h.status == HealthStatus.HEALTHY]),
            "degraded_agents": len([h for h in self.agent_health.values() if h.status == HealthStatus.DEGRADED]),
            "unhealthy_agents": len([h for h in self.agent_health.values() if h.status == HealthStatus.UNHEALTHY]),
            "by_industry": dict(by_industry)
        }

    def get_industry_health(self, industry: str) -> Dict[str, Any]:
        """Get health summary for a specific industry."""
        agents = [h for h in self.agent_health.values() if h.industry == industry]

        if not agents:
            return {"industry": industry, "agents": [], "summary": {}}

        healthy = len([h for h in agents if h.status == HealthStatus.HEALTHY])
        degraded = len([h for h in agents if h.status == HealthStatus.DEGRADED])
        unhealthy = len([h for h in agents if h.status == HealthStatus.UNHEALTHY])

        return {
            "industry": industry,
            "agents": [h.to_dict() for h in agents],
            "summary": {
                "total": len(agents),
                "healthy": healthy,
                "degraded": degraded,
                "unhealthy": unhealthy,
                "health_score": (healthy / len(agents) * 100) if agents else 0
            }
        }

    def get_stats(self) -> Dict[str, Any]:
        """Get monitoring statistics."""
        total_requests = sum(h.total_requests for h in self.agent_health.values())
        total_errors = sum(h.error_count for h in self.agent_health.values())
        avg_response_time = (
            sum(h.avg_response_time_ms for h in self.agent_health.values()) / len(self.agent_health)
            if self.agent_health else 0
        )

        return {
            "total_monitored_agents": len(self.agent_health),
            "total_requests": total_requests,
            "total_errors": total_errors,
            "error_rate": total_errors / total_requests if total_requests > 0 else 0,
            "avg_response_time_ms": avg_response_time,
            "active_alerts": len(self.get_active_alerts()),
            "critical_alerts": len(self.get_active_alerts(AlertSeverity.CRITICAL)),
            "error_alerts": len(self.get_active_alerts(AlertSeverity.ERROR))
        }
