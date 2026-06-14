"""
Admin Service
Main administration service for AssetMind platform
Port: 5280
"""

from fastapi import FastAPI, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import logging
import hashlib
import secrets

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Admin Service", version="1.0.0", docs_url="/docs")


class ServiceStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"
    STARTING = "starting"


class AdminUser(BaseModel):
    user_id: str
    username: str
    email: str
    role: str = "user"
    permissions: List[str] = Field(default_factory=list)
    created_at: datetime
    last_login: Optional[datetime] = None
    is_active: bool = True


class ServiceInfo(BaseModel):
    service_name: str
    service_id: str
    status: ServiceStatus
    port: int
    version: str
    health_url: str
    last_health_check: datetime
    uptime_seconds: float = 0
    requests_count: int = 0
    error_count: int = 0


class SystemMetrics(BaseModel):
    total_services: int
    healthy_services: int
    degraded_services: int
    down_services: int
    total_requests: int
    total_errors: int
    avg_response_time_ms: float
    cpu_usage_percent: float
    memory_usage_mb: float
    uptime_seconds: float


class AdminService:
    """Main admin service for platform management"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Admin Service"
        self.port = 5280
        self.version = "1.0.0"
        self.started_at = datetime.utcnow()
        self._services: Dict[str, ServiceInfo] = {}
        self._users: Dict[str, AdminUser] = {}
        self._metrics: Dict[str, List[float]] = {"response_times": [], "errors": []}
        self._initialize_default_services()

    def _initialize_default_services(self):
        """Initialize default platform services"""
        default_services = [
            {"name": "api-gateway", "port": 5260, "version": "1.0.0"},
            {"name": "websocket-gateway", "port": 5261, "version": "1.0.0"},
            {"name": "predictions", "port": 5160, "version": "1.0.0"},
            {"name": "probability-engine", "port": 5161, "version": "1.0.0"},
            {"name": "outcome-tracker", "port": 5164, "version": "1.0.0"},
            {"name": "morning-briefing", "port": 5170, "version": "1.0.0"},
            {"name": "marketplace", "port": 5230, "version": "1.0.0"},
            {"name": "knowledge-graph", "port": 5200, "version": "1.0.0"},
            {"name": "execution", "port": 5250, "version": "1.0.0"},
            {"name": "intelligence", "port": 5050, "version": "1.0.0"},
        ]
        for svc in default_services:
            self.register_service(
                svc["name"], svc["port"], svc["version"]
            )

    def _generate_id(self, prefix: str = "") -> str:
        """Generate unique ID"""
        timestamp = datetime.utcnow().timestamp()
        random_suffix = secrets.token_hex(4)
        return f"{prefix}{timestamp}_{random_suffix}" if prefix else f"{timestamp}_{random_suffix}"

    def register_service(
        self,
        service_name: str,
        port: int,
        version: str = "1.0.0"
    ) -> ServiceInfo:
        """Register a new service"""
        service_id = self._generate_id(f"{service_name}_")
        service_info = ServiceInfo(
            service_name=service_name,
            service_id=service_id,
            status=ServiceStatus.HEALTHY,
            port=port,
            version=version,
            health_url=f"http://localhost:{port}/health",
            last_health_check=datetime.utcnow()
        )
        self._services[service_id] = service_info
        logger.info(f"Registered service: {service_name} (ID: {service_id})")
        return service_info

    async def check_service_health(self, service_id: str) -> Dict[str, Any]:
        """Check health of a specific service"""
        if service_id not in self._services:
            raise ValueError(f"Service {service_id} not found")

        service = self._services[service_id]
        service.last_health_check = datetime.utcnow()

        # Simulate health check (in production, this would call the actual health endpoint)
        import random
        health_score = random.randint(85, 100)
        if health_score >= 90:
            service.status = ServiceStatus.HEALTHY
        elif health_score >= 70:
            service.status = ServiceStatus.DEGRADED
        else:
            service.status = ServiceStatus.DOWN

        return {
            "service_id": service_id,
            "status": service.status.value,
            "health_score": health_score,
            "last_check": service.last_health_check.isoformat()
        }

    async def get_system_metrics(self) -> SystemMetrics:
        """Get overall system metrics"""
        healthy = sum(1 for s in self._services.values() if s.status == ServiceStatus.HEALTHY)
        degraded = sum(1 for s in self._services.values() if s.status == ServiceStatus.DEGRADED)
        down = sum(1 for s in self._services.values() if s.status == ServiceStatus.DOWN)
        total_requests = sum(s.requests_count for s in self._services.values())
        total_errors = sum(s.error_count for s in self._services.values())

        response_times = self._metrics["response_times"]
        avg_response = sum(response_times) / len(response_times) if response_times else 0

        import random
        return SystemMetrics(
            total_services=len(self._services),
            healthy_services=healthy,
            degraded_services=degraded,
            down_services=down,
            total_requests=total_requests,
            total_errors=total_errors,
            avg_response_time_ms=avg_response,
            cpu_usage_percent=random.uniform(15, 45),
            memory_usage_mb=random.uniform(256, 512),
            uptime_seconds=(datetime.utcnow() - self.started_at).total_seconds()
        )

    async def get_services(self, status: Optional[ServiceStatus] = None) -> List[Dict[str, Any]]:
        """Get all services, optionally filtered by status"""
        services = list(self._services.values())
        if status:
            services = [s for s in services if s.status == status]
        return [
            {
                "service_id": s.service_id,
                "service_name": s.service_name,
                "status": s.status.value,
                "port": s.port,
                "version": s.version,
                "last_health_check": s.last_health_check.isoformat()
            }
            for s in services
        ]

    async def create_user(
        self,
        username: str,
        email: str,
        role: str = "user",
        permissions: List[str] = None
    ) -> AdminUser:
        """Create a new admin user"""
        user_id = self._generate_id("user_")
        user = AdminUser(
            user_id=user_id,
            username=username,
            email=email,
            role=role,
            permissions=permissions or [],
            created_at=datetime.utcnow()
        )
        self._users[user_id] = user
        logger.info(f"Created user: {username} (ID: {user_id})")
        return user

    async def get_user(self, user_id: str) -> Optional[AdminUser]:
        """Get user by ID"""
        return self._users.get(user_id)

    async def list_users(self, role: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all users, optionally filtered by role"""
        users = list(self._users.values())
        if role:
            users = [u for u in users if u.role == role]
        return [
            {
                "user_id": u.user_id,
                "username": u.username,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat()
            }
            for u in users
        ]

    async def update_user_permissions(
        self,
        user_id: str,
        permissions: List[str]
    ) -> AdminUser:
        """Update user permissions"""
        if user_id not in self._users:
            raise ValueError(f"User {user_id} not found")
        self._users[user_id].permissions = permissions
        return self._users[user_id]

    async def update_service_status(
        self,
        service_id: str,
        status: ServiceStatus
    ) -> ServiceInfo:
        """Update service status"""
        if service_id not in self._services:
            raise ValueError(f"Service {service_id} not found")
        self._services[service_id].status = status
        return self._services[service_id]

    async def get_audit_log(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get audit log entries"""
        # In production, this would query a database
        # For now, return mock audit entries
        return [
            {
                "timestamp": datetime.utcnow().isoformat(),
                "action": "SERVICE_REGISTERED",
                "service": "api-gateway",
                "user": "system",
                "details": "Service registered successfully"
            },
            {
                "timestamp": (datetime.utcnow() - timedelta(minutes=5)).isoformat(),
                "action": "USER_CREATED",
                "service": "admin",
                "user": "admin",
                "details": "New user created: john.doe"
            }
        ][:limit]


service = AdminService()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "uptime_seconds": (datetime.utcnow() - service.started_at).total_seconds()
    }


@app.get("/api/v1/metrics", response_model=SystemMetrics)
async def get_metrics():
    """Get system-wide metrics"""
    return await service.get_system_metrics()


@app.get("/api/v1/services", response_model=List[Dict[str, Any]])
async def get_services(status: Optional[str] = Query(None)):
    """Get all registered services"""
    service_status = ServiceStatus(status) if status else None
    return await service.get_services(service_status)


@app.post("/api/v1/services/register")
async def register_service(request: Dict[str, Any]):
    """Register a new service"""
    return service.register_service(
        request["service_name"],
        request["port"],
        request.get("version", "1.0.0")
    )


@app.get("/api/v1/services/{service_id}/health")
async def check_service_health(service_id: str):
    """Check health of a specific service"""
    return await service.check_service_health(service_id)


@app.patch("/api/v1/services/{service_id}/status")
async def update_service_status(service_id: str, request: Dict[str, Any]):
    """Update service status"""
    return await service.update_service_status(service_id, ServiceStatus(request["status"]))


@app.get("/api/v1/users", response_model=List[Dict[str, Any]])
async def list_users(role: Optional[str] = Query(None)):
    """List all users"""
    return await service.list_users(role)


@app.post("/api/v1/users")
async def create_user(request: Dict[str, Any]):
    """Create a new user"""
    return await service.create_user(
        request["username"],
        request["email"],
        request.get("role", "user"),
        request.get("permissions", [])
    )


@app.get("/api/v1/users/{user_id}")
async def get_user(user_id: str):
    """Get user by ID"""
    user = await service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.patch("/api/v1/users/{user_id}/permissions")
async def update_permissions(user_id: str, request: Dict[str, Any]):
    """Update user permissions"""
    return await service.update_user_permissions(user_id, request["permissions"])


@app.get("/api/v1/audit-log")
async def get_audit_log(
    limit: int = Query(100, le=1000),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """Get audit log"""
    return await service.get_audit_log(start_date, end_date, limit)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5280)