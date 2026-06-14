"""
API Gateway Service
Main API gateway for AssetMind platform
Port: 5260
"""

from fastapi import FastAPI, HTTPException, Request, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import logging
import time
import hashlib
import json

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind API Gateway", version="1.0.0", docs_url="/docs")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ServiceRoute(BaseModel):
    service_name: str
    port: int
    path_prefix: str
    auth_required: bool = True
    rate_limit: int = 100  # requests per minute


class APIKey(BaseModel):
    key_id: str
    key_name: str
    key_hash: str
    permissions: List[str] = Field(default_factory=list)
    rate_limit: int = 100
    created_at: datetime
    last_used: Optional[datetime] = None
    is_active: bool = True


class RequestLog(BaseModel):
    request_id: str
    api_key_id: Optional[str]
    method: str
    path: str
    service: str
    status_code: int
    response_time_ms: float
    timestamp: datetime


class APIGatewayService:
    """Main API gateway service"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "API Gateway"
        self.port = 5260
        self.version = "1.0.0"
        self.started_at = datetime.utcnow()

        # Service routes
        self._routes: Dict[str, ServiceRoute] = {
            "predictions": ServiceRoute(
                service_name="predictions",
                port=5160,
                path_prefix="/api/v1/predict",
                auth_required=True
            ),
            "probability": ServiceRoute(
                service_name="probability",
                port=5161,
                path_prefix="/api/v1/probability",
                auth_required=True
            ),
            "outcome": ServiceRoute(
                service_name="outcome",
                port=5164,
                path_prefix="/api/v1/outcomes",
                auth_required=True
            ),
            "morning-briefing": ServiceRoute(
                service_name="morning-briefing",
                port=5170,
                path_prefix="/api/v1/briefing",
                auth_required=True
            ),
            "watchlist": ServiceRoute(
                service_name="watchlist",
                port=5171,
                path_prefix="/api/v1/watchlist",
                auth_required=True
            ),
            "portfolio": ServiceRoute(
                service_name="portfolio",
                port=5172,
                path_prefix="/api/v1/portfolio",
                auth_required=True
            ),
            "market": ServiceRoute(
                service_name="market",
                port=5173,
                path_prefix="/api/v1/market",
                auth_required=True
            ),
            "theme": ServiceRoute(
                service_name="theme",
                port=5174,
                path_prefix="/api/v1/theme",
                auth_required=True
            ),
            "risk": ServiceRoute(
                service_name="risk",
                port=5175,
                path_prefix="/api/v1/risk",
                auth_required=True
            ),
            "opportunity": ServiceRoute(
                service_name="opportunity",
                port=5176,
                path_prefix="/api/v1/opportunity",
                auth_required=True
            ),
            "admin": ServiceRoute(
                service_name="admin",
                port=5280,
                path_prefix="/api/v1/admin",
                auth_required=True
            ),
            "users": ServiceRoute(
                service_name="users",
                port=5281,
                path_prefix="/api/v1/users",
                auth_required=True
            ),
        }

        # API keys
        self._api_keys: Dict[str, APIKey] = {}
        self._request_logs: List[RequestLog] = []
        self._request_count = 0

    def _generate_request_id(self) -> str:
        """Generate unique request ID"""
        self._request_count += 1
        timestamp = datetime.utcnow().timestamp()
        return f"req_{timestamp}_{self._request_count}"

    def _hash_api_key(self, api_key: str) -> str:
        """Hash API key for storage"""
        return hashlib.sha256(api_key.encode()).hexdigest()

    async def create_api_key(
        self,
        key_name: str,
        permissions: List[str] = None,
        rate_limit: int = 100
    ) -> Dict[str, Any]:
        """Create a new API key"""
        import secrets
        key_id = f"key_{datetime.utcnow().timestamp()}_{secrets.token_hex(8)}"
        api_key = secrets.token_urlsafe(32)
        key_hash = self._hash_api_key(api_key)

        api_key_obj = APIKey(
            key_id=key_id,
            key_name=key_name,
            key_hash=key_hash,
            permissions=permissions or [],
            rate_limit=rate_limit,
            created_at=datetime.utcnow()
        )

        self._api_keys[key_id] = api_key_obj
        logger.info(f"Created API key: {key_name} (ID: {key_id})")

        return {
            "key_id": key_id,
            "api_key": api_key,  # Only returned once
            "key_name": key_name,
            "permissions": permissions,
            "rate_limit": rate_limit,
            "created_at": api_key_obj.created_at.isoformat()
        }

    async def validate_api_key(self, api_key: str) -> Optional[APIKey]:
        """Validate API key"""
        key_hash = self._hash_api_key(api_key)

        for key in self._api_keys.values():
            if key.key_hash == key_hash and key.is_active:
                key.last_used = datetime.utcnow()
                return key

        return None

    async def get_services(self) -> List[Dict[str, Any]]:
        """Get all registered services"""
        return [
            {
                "service_name": route.service_name,
                "port": route.port,
                "path_prefix": route.path_prefix,
                "auth_required": route.auth_required,
                "rate_limit": route.rate_limit,
                "status": "healthy"  # In production, check actual health
            }
            for route in self._routes.values()
        ]

    async def route_request(
        self,
        path: str,
        method: str,
        headers: Dict[str, str],
        body: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Route request to appropriate service"""
        # Find matching route
        for route in self._routes.values():
            if path.startswith(route.path_prefix):
                # In production, this would forward to actual service
                return {
                    "service": route.service_name,
                    "port": route.port,
                    "path": path,
                    "method": method,
                    "status": "forwarded"
                }

        return {
            "error": "Route not found",
            "path": path,
            "available_routes": list(self._routes.keys())
        }

    async def get_metrics(self) -> Dict[str, Any]:
        """Get gateway metrics"""
        total_requests = len(self._request_logs)
        avg_response_time = 0

        if self._request_logs:
            avg_response_time = sum(log.response_time_ms for log in self._request_logs) / total_requests

        return {
            "total_requests": total_requests,
            "uptime_seconds": (datetime.utcnow() - self.started_at).total_seconds(),
            "avg_response_time_ms": round(avg_response_time, 2),
            "registered_services": len(self._routes),
            "active_api_keys": len([k for k in self._api_keys.values() if k.is_active]),
            "services": [
                {
                    "name": route.service_name,
                    "port": route.port,
                    "requests": sum(1 for log in self._request_logs if log.service == route.service_name)
                }
                for route in self._routes.values()
            ]
        }

    async def get_request_logs(
        self,
        limit: int = 100,
        service: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get request logs"""
        logs = self._request_logs

        if service:
            logs = [log for log in logs if log.service == service]

        logs = logs[-limit:]

        return [
            {
                "request_id": log.request_id,
                "api_key_id": log.api_key_id,
                "method": log.method,
                "path": log.path,
                "service": log.service,
                "status_code": log.status_code,
                "response_time_ms": log.response_time_ms,
                "timestamp": log.timestamp.isoformat()
            }
            for log in logs
        ]

    async def register_service(
        self,
        service_name: str,
        port: int,
        path_prefix: str,
        auth_required: bool = True
    ) -> ServiceRoute:
        """Register a new service route"""
        route = ServiceRoute(
            service_name=service_name,
            port=port,
            path_prefix=path_prefix,
            auth_required=auth_required
        )

        self._routes[service_name] = route
        logger.info(f"Registered service route: {service_name} -> port {port}")

        return route


service = APIGatewayService()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "uptime_seconds": (datetime.utcnow() - service.started_at).total_seconds(),
        "services_registered": len(service._routes)
    }


@app.get("/api/v1/services")
async def get_services():
    """Get all registered services"""
    return await service.get_services()


@app.post("/api/v1/services/register")
async def register_service(request: Dict[str, Any]):
    """Register a new service"""
    return await service.register_service(
        service_name=request["service_name"],
        port=request["port"],
        path_prefix=request["path_prefix"],
        auth_required=request.get("auth_required", True)
    )


@app.post("/api/v1/api-keys")
async def create_api_key(request: Dict[str, Any]):
    """Create a new API key"""
    return await service.create_api_key(
        key_name=request["key_name"],
        permissions=request.get("permissions"),
        rate_limit=request.get("rate_limit", 100)
    )


@app.get("/api/v1/metrics")
async def get_metrics():
    """Get gateway metrics"""
    return await service.get_metrics()


@app.get("/api/v1/logs")
async def get_request_logs(
    limit: int = Query(100, le=1000),
    service: str = Query(None)
):
    """Get request logs"""
    return await service.get_request_logs(limit, service)


@app.get("/api/v1/routes")
async def get_routes():
    """Get all available routes"""
    return {
        "routes": [
            {
                "path_prefix": route.path_prefix,
                "service": route.service_name,
                "port": route.port
            }
            for route in service._routes.values()
        ],
        "total": len(service._routes)
    }


@app.get("/api/v1/docs")
async def get_api_docs():
    """Get API documentation"""
    return {
        "title": "AssetMind API Gateway",
        "version": service.version,
        "description": "Main entry point for AssetMind platform services",
        "services": list(service._routes.keys()),
        "endpoints": {
            "services": "/api/v1/services",
            "api_keys": "/api/v1/api-keys",
            "metrics": "/api/v1/metrics",
            "logs": "/api/v1/logs",
            "routes": "/api/v1/routes"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5260)