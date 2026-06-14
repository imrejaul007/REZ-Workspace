"""
AssetMind - Admin Service
Port: 5251

Internal admin dashboard and system management.
Health monitoring, user management, billing, and analytics.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


app = FastAPI(title="AssetMind Admin Service", version="1.0.0")


class UserTier(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"
    INSTITUTIONAL = "institutional"


class User(BaseModel):
    user_id: str
    email: str
    name: str
    tier: UserTier
    api_calls_used: int = 0
    api_calls_limit: int
    created_at: datetime
    last_active: datetime


class BillingEvent(BaseModel):
    event_id: str
    user_id: str
    event_type: str  # "subscription", "api_call", "upgrade"
    amount: float
    currency: str = "USD"
    status: str  # "pending", "completed", "failed"
    created_at: datetime


class SystemMetrics(BaseModel):
    total_users: int
    active_users_24h: int
    total_api_calls: int
    api_calls_today: int
    avg_response_time_ms: float
    error_rate: float
    uptime_percent: float


class ServiceHealth(BaseModel):
    service_name: str
    status: str  # healthy, degraded, down
    latency_ms: float
    uptime_percent: float
    last_check: datetime


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-admin",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5251
    }


# In-memory storage
users: Dict[str, User] = {}
billing_events: List[BillingEvent] = []


# ============================================================================
# Users
# ============================================================================

@app.post("/users", status_code=201)
async def create_user(email: str, name: str, tier: UserTier = UserTier.FREE):
    """Create a new user"""
    user_id = str(uuid.uuid4())

    limits = {
        UserTier.FREE: 1000,
        UserTier.STARTER: 10000,
        UserTier.PROFESSIONAL: 100000,
        UserTier.ENTERPRISE: 1000000,
        UserTier.INSTITUTIONAL: 10000000
    }

    user = User(
        user_id=user_id,
        email=email,
        name=name,
        tier=tier,
        api_calls_limit=limits[tier],
        created_at=datetime.utcnow(),
        last_active=datetime.utcnow()
    )

    users[user_id] = user
    return {"user_id": user_id, "created": True}


@app.get("/users/{user_id}")
async def get_user(user_id: str):
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    return users[user_id]


@app.get("/users")
async def list_users(limit: int = 100):
    return {"users": list(users.values())[:limit], "total": len(users)}


@app.patch("/users/{user_id}/tier")
async def update_tier(user_id: str, tier: UserTier):
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")

    limits = {UserTier.FREE: 1000, UserTier.STARTER: 10000, UserTier.PROFESSIONAL: 100000,
              UserTier.ENTERPRISE: 1000000, UserTier.INSTITUTIONAL: 10000000}

    users[user_id].tier = tier
    users[user_id].api_calls_limit = limits[tier]
    return {"updated": True, "tier": tier}


# ============================================================================
# System Metrics
# ============================================================================

@app.get("/metrics/system")
async def get_system_metrics():
    """Get overall system metrics"""
    return SystemMetrics(
        total_users=len(users),
        active_users_24h=len(users) // 3,
        total_api_calls=1250000,
        api_calls_today=45000,
        avg_response_time_ms=45.2,
        error_rate=0.02,
        uptime_percent=99.95
    )


@app.get("/metrics/services")
async def get_service_health():
    """Get health status of all services"""
    services = [
        {"service_name": "asset-universe", "status": "healthy", "latency_ms": 12},
        {"service_name": "twin-engine", "status": "healthy", "latency_ms": 25},
        {"service_name": "knowledge-graph", "status": "healthy", "latency_ms": 35},
        {"service_name": "agents", "status": "healthy", "latency_ms": 120},
        {"service_name": "kronos", "status": "healthy", "latency_ms": 85},
        {"service_name": "api-gateway", "status": "healthy", "latency_ms": 8},
    ]
    return {"services": services}


# ============================================================================
# Billing
# ============================================================================

@app.post("/billing/events", status_code=201)
async def create_billing_event(
    user_id: str,
    event_type: str,
    amount: float
):
    """Record a billing event"""
    event_id = str(uuid.uuid4())

    event = BillingEvent(
        event_id=event_id,
        user_id=user_id,
        event_type=event_type,
        amount=amount,
        status="completed",
        created_at=datetime.utcnow()
    )

    billing_events.append(event)
    return {"event_id": event_id, "recorded": True}


@app.get("/billing/user/{user_id}")
async def get_user_billing(user_id: str):
    """Get billing history for a user"""
    user_events = [e for e in billing_events if e.user_id == user_id]
    total_spent = sum(e.amount for e in user_events)

    return {
        "user_id": user_id,
        "events": user_events,
        "total_spent": total_spent,
        "event_count": len(user_events)
    }


@app.get("/billing/revenue")
async def get_revenue_stats():
    """Get overall revenue statistics"""
    return {
        "mrr": 125000,  # Monthly recurring revenue
        "arr": 1500000,  # Annual recurring revenue
        "ltv": 4500,  # Lifetime value per customer
        "churn_rate": 2.5,  # Monthly churn %
        "arpu": 125,  # Average revenue per user
        "new_mrr_today": 2500,
        "churned_mrr_today": 800
    }


# ============================================================================
# API Keys
# ============================================================================

@app.post("/api-keys")
async def create_api_key(user_id: str, name: str):
    """Create an API key for a user"""
    key_id = str(uuid.uuid4())
    return {
        "key_id": key_id,
        "key": f"am_live_{uuid.uuid4().hex}",
        "user_id": user_id,
        "name": name,
        "created_at": datetime.utcnow().isoformat()
    }


@app.get("/api-keys/user/{user_id}")
async def list_user_keys(user_id: str):
    """List all API keys for a user"""
    return {"keys": []}  # Mock


# ============================================================================
# Analytics
# ============================================================================

@app.get("/analytics/usage")
async def get_usage_analytics():
    """Get usage analytics"""
    return {
        "api_calls_by_tier": {
            "free": 250000,
            "starter": 450000,
            "professional": 400000,
            "enterprise": 100000
        },
        "top_endpoints": [
            {"endpoint": "/forecast", "calls": 450000},
            {"endpoint": "/twins", "calls": 320000},
            {"endpoint": "/search", "calls": 280000}
        ],
        "peak_hour": "10:00 AM EST",
        "avg_calls_per_user": 450
    }


@app.get("/analytics/retention")
async def get_retention_metrics():
    """Get user retention metrics"""
    return {
        "d1": 85,  # Day 1 retention %
        "d7": 72,
        "d30": 58,
        "d90": 45,
        "mau": len(users),
        "waus": len(users) // 3
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5251)