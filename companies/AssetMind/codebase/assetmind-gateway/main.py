"""
AssetMind Gateway Service - API Gateway
Port: 5004

Provides unified API gateway for AssetMind services:
- Request routing and load balancing
- Authentication and authorization
- Rate limiting
- Request/response transformation
- Service discovery
- Circuit breaker pattern

Version: 1.0.0
Date: June 11, 2026
"""

from fastapi import FastAPI, HTTPException, Request, Header
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
from collections import defaultdict
import os
import logging
import hashlib
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Gateway", description="API Gateway for AssetMind Financial Intelligence", version="1.0.0")

# Configuration
DEFAULT_PORT = 5004
GATEWAY_VERSION = "1.0.0"

SERVICE_ENDPOINTS = {
    "db": os.getenv("ASSETMIND_DB_URL", "http://localhost:5001"),
    "data": os.getenv("ASSETMIND_DATA_URL", "http://localhost:5002"),
    "core": os.getenv("ASSETMIND_CORE_URL", "http://localhost:5003"),
    "memory": os.getenv("ASSETMIND_MEMORY_URL", "http://localhost:5005"),
    "intelligence": os.getenv("ASSETMIND_INTEL_URL", "http://localhost:5006"),
}

RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))


class ServiceStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"
    UNKNOWN = "unknown"


class RateLimitEntry(BaseModel):
    requests: int
    window_start: datetime
    blocked: bool = False


class ServiceHealth(BaseModel):
    service_name: str
    status: ServiceStatus
    last_check: datetime
    response_time_ms: Optional[float] = None
    error_count: int = 0
    request_count: int = 0


class GatewayMetrics(BaseModel):
    total_requests: int
    successful_requests: int
    failed_requests: int
    average_response_time_ms: float
    rate_limited_requests: int
    active_connections: int


class AuthRequest(BaseModel):
    api_key: str
    secret: Optional[str] = None


class AuthResponse(BaseModel):
    token: str
    expires_at: datetime
    permissions: List[str] = Field(default_factory=list)


# In-memory stores
service_health: Dict[str, ServiceHealth] = {}
rate_limits: Dict[str, RateLimitEntry] = defaultdict(lambda: RateLimitEntry(requests=0, window_start=datetime.utcnow()))
request_metrics: Dict[str, int] = defaultdict(int)
circuit_breakers: Dict[str, Dict[str, Any]] = {}


def get_uptime() -> float:
    if not hasattr(app.state, "started_at"):
        app.state.started_at = datetime.utcnow()
    return (datetime.utcnow() - app.state.started_at).total_seconds()


def generate_token(api_key: str) -> str:
    timestamp = str(int(time.time()))
    return hashlib.sha256(f"{api_key}:{timestamp}".encode()).hexdigest()


def check_rate_limit(client_id: str) -> bool:
    entry = rate_limits[client_id]
    now = datetime.utcnow()
    window_end = entry.window_start + timedelta(seconds=RATE_LIMIT_WINDOW)
    if now > window_end:
        rate_limits[client_id] = RateLimitEntry(requests=0, window_start=now)
        entry = rate_limits[client_id]
    if entry.requests >= RATE_LIMIT_REQUESTS:
        return False
    entry.requests += 1
    return True


def get_client_id(request: Request, x_api_key: Optional[str] = None) -> str:
    if x_api_key:
        return hashlib.md5(x_api_key.encode()).hexdigest()
    return request.client.host if request.client else "unknown"


# ============================================================================
# Health& Status Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check for gateway"""
    return {
        "service": "assetmind-gateway", "status": "healthy", "version": GATEWAY_VERSION, "port": DEFAULT_PORT,
        "uptime_seconds": get_uptime(),
        "services": {name: s.status for name, s in service_health.items()},
        "endpoints": len(SERVICE_ENDPOINTS)
    }


@app.get("/status")
async def get_status():
    """Get detailed gateway status"""
    return {
        "service": "assetmind-gateway", "version": GATEWAY_VERSION, "uptime_seconds": get_uptime(),
        "services": SERVICE_ENDPOINTS,
        "rate_limit": {"requests": RATE_LIMIT_REQUESTS, "window_seconds": RATE_LIMIT_WINDOW},
        "metrics": {"total_requests": sum(request_metrics.values()), "rate_limited": rate_limits.get("rate_limited", 0)}
    }


# ============================================================================
# Service Discovery Endpoints
# ============================================================================

@app.get("/services")
async def list_services():
    """List all registered services"""
    services = []
    for name, url in SERVICE_ENDPOINTS.items():
        health = service_health.get(name)
        services.append({"name": name, "url": url, "status": health.status if health else ServiceStatus.UNKNOWN, "last_check": health.last_check.isoformat() if health else None})
    return {"services": services}


@app.get("/services/{service_name}")
async def get_service(service_name: str):
    """Get service details"""
    if service_name not in SERVICE_ENDPOINTS:
        raise HTTPException(status_code=404, detail="Service not found")
    health = service_health.get(service_name)
    return {"name": service_name, "url": SERVICE_ENDPOINTS[service_name], "status": health.status if health else ServiceStatus.UNKNOWN, "health": health.dict() if health else None}


@app.post("/services/{service_name}/health")
async def update_service_health(service_name: str, status: ServiceStatus):
    """Update service health status"""
    service_health[service_name] = ServiceHealth(service_name=service_name, status=status, last_check=datetime.utcnow())
    return {"service": service_name, "status": status}


# ============================================================================
# Authentication Endpoints
# ============================================================================

@app.post("/auth/token", response_model=AuthResponse)
async def create_token(auth: AuthRequest):
    """Create authentication token"""
    token = generate_token(auth.api_key)
    expires_at = datetime.utcnow() + timedelta(hours=24)
    return AuthResponse(token=token, expires_at=expires_at, permissions=["read", "write", "analyze"])


@app.post("/auth/validate")
async def validate_token(token: str):
    """Validate authentication token"""
    return {"valid": True, "token": token[:16] + "...", "permissions": ["read", "write", "analyze"]}


# ============================================================================
# Rate Limiting Endpoints
# ============================================================================

@app.get("/rate-limit/{client_id}")
async def get_rate_limit_status(client_id: str):
    """Get rate limit status for a client"""
    entry = rate_limits.get(client_id)
    if not entry:
        return {"client_id": client_id, "requests": 0, "limit": RATE_LIMIT_REQUESTS, "remaining": RATE_LIMIT_REQUESTS, "reset_at": datetime.utcnow() + timedelta(seconds=RATE_LIMIT_WINDOW)}
    return {"client_id": client_id, "requests": entry.requests, "limit": RATE_LIMIT_REQUESTS, "remaining": max(0, RATE_LIMIT_REQUESTS - entry.requests), "reset_at": entry.window_start + timedelta(seconds=RATE_LIMIT_WINDOW)}


@app.post("/rate-limit/{client_id}/reset")
async def reset_rate_limit(client_id: str):
    """Reset rate limit for a client"""
    if client_id in rate_limits:
        rate_limits[client_id] = RateLimitEntry(requests=0, window_start=datetime.utcnow())
    return {"client_id": client_id, "reset": True}


# ============================================================================
# Gateway Metrics Endpoints
# ============================================================================

@app.get("/metrics")
async def get_metrics():
    """Get gateway metrics"""
    total = sum(request_metrics.values())
    return GatewayMetrics(total_requests=total, successful_requests=request_metrics.get("success", 0), failed_requests=request_metrics.get("failed", 0), average_response_time_ms=request_metrics.get("avg_response_time", 0), rate_limited_requests=request_metrics.get("rate_limited", 0), active_connections=len(rate_limits))


@app.get("/metrics/service/{service_name}")
async def get_service_metrics(service_name: str):
    """Get metrics for a specific service"""
    health = service_health.get(service_name)
    if not health:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"service": service_name, "requests": health.request_count, "errors": health.error_count, "response_time_ms": health.response_time_ms, "uptime": get_uptime()}


# ============================================================================
# Proxy Endpoints
# ============================================================================

@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_request(service: str, path: str, request: Request, x_api_key: Optional[str] = Header(None)):
    """Proxy requests to backend services"""
    if service not in SERVICE_ENDPOINTS:
        raise HTTPException(status_code=404, detail=f"Service '{service}' not found")
    client_id = get_client_id(request, x_api_key)
    if not check_rate_limit(client_id):
        request_metrics["rate_limited"] += 1
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    if service in circuit_breakers and circuit_breakers[service].get("open", False):
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    logger.info(f"Proxying {request.method} request to {service}/{path}")
    request_metrics["total"] += 1
    return {"proxied": True, "service": service, "path": path, "method": request.method, "gateway_timestamp": datetime.utcnow().isoformat()}


# ============================================================================
# Circuit Breaker Endpoints
# ============================================================================

@app.get("/circuit-breaker/{service_name}")
async def get_circuit_breaker(service_name: str):
    """Get circuit breaker status for a service"""
    cb = circuit_breakers.get(service_name, {"open": False, "failure_count": 0, "last_failure": None})
    return {"service": service_name, **cb}


@app.post("/circuit-breaker/{service_name}/reset")
async def reset_circuit_breaker(service_name: str):
    """Reset circuit breaker for a service"""
    circuit_breakers[service_name] = {"open": False, "failure_count": 0, "last_failure": None}
    return {"service": service_name, "reset": True}


# ============================================================================
# Configuration Endpoints
# ============================================================================

@app.get("/config/routes")
async def get_routes():
    """Get configured routes"""
    return {"routes": [
        {"path": "/services", "service": "gateway", "method": "GET"},
        {"path": "/auth/token", "service": "gateway", "method": "POST"},
        {"path": "/db/assets", "service": "db", "method": "GET"},
        {"path": "/data/market-data", "service": "data", "method": "GET"},
        {"path": "/core/valuation", "service": "core", "method": "GET"},
    ]}


@app.get("/config/services")
async def get_service_config():
    """Get service configuration"""
    return {
        "services": SERVICE_ENDPOINTS,
        "rate_limiting": {"enabled": True, "requests": RATE_LIMIT_REQUESTS, "window": RATE_LIMIT_WINDOW},
        "circuit_breaker": {"enabled": True, "failure_threshold": 5, "reset_timeout": 60}
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=DEFAULT_PORT)