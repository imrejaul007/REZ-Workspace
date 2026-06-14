"""
AssetMind Security - Security Service
Port: 5002
Provides authentication, authorization, and security monitoring.
"""

import uuid
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional, List
from enum import Enum

from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from loguru import logger

app = FastAPI(title="AssetMind Security", description="Security Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class UserRole(str, Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    TRADER = "trader"
    VIEWER = "viewer"

class AuditAction(str, Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    READ = "read"

class ThreatLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# ============================================================================
# Pydantic Models
# ============================================================================

class UserCreate(BaseModel):
    email: str
    name: str = Field(..., min_length=1, max_length=100)
    role: UserRole = UserRole.VIEWER
    password: str = Field(..., min_length=8)

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: UserRole
    is_active: bool = True
    mfa_enabled: bool = False
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LoginRequest(BaseModel):
    email: str
    password: str
    mfa_code: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: User

class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    action: AuditAction
    resource: str
    ip_address: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SecurityEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    severity: ThreatLevel
    description: str
    resolved: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ApiKeyCreate(BaseModel):
    name: str
    scopes: List[str] = []
    expires_in_days: int = 90

class ApiKey(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key_prefix: str
    name: str
    user_id: str
    scopes: List[str] = []
    is_active: bool = True
    expires_at: datetime

# ============================================================================
# In-Memory Storage
# ============================================================================

users_db: dict[str, User] = {}
api_keys_db: dict[str, ApiKey] = {}
audit_logs_db: dict[str, AuditLog] = {}
security_events_db: dict[str, SecurityEvent] = {}
active_sessions_db: dict[str, dict] = {}

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    return hmac.compare_digest(hash_password(password), password_hash)

def generate_token(user_id: str) -> str:
    return f"token_{user_id}_{uuid.uuid4().hex}"

# Initialize admin user
admin = User(id="admin-001", email="admin@assetmind.io", name="System Admin", role=UserRole.ADMIN)
users_db[admin.id] = admin

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "assetmind-security",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {"users": len(users_db), "api_keys": len(api_keys_db), "audit_logs": len(audit_logs_db)}
    }

# ============================================================================
# Authentication Endpoints
# ============================================================================

@app.post("/auth/register", response_model=User, status_code=201)
async def register_user(user: UserCreate):
    for existing in users_db.values():
        if existing.email == user.email:
            raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(**user.model_dump(exclude={"password"}))
    users_db[new_user.id] = new_user
    logger.info(f"New user registered: {new_user.email}")
    return new_user

@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = None
    for u in users_db.values():
        if u.email == request.email:
            user = u
            break

    if not user:
        security_events_db[uuid.uuid4().hex] = SecurityEvent(
            event_type="failed_login", severity=ThreatLevel.MEDIUM, description=f"Failed login for {request.email}"
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    access_token = generate_token(user.id)
    refresh_token = generate_token(user.id)
    user.last_login = datetime.utcnow()

    audit_logs_db[uuid.uuid4().hex] = AuditLog(user_id=user.id, action=AuditAction.LOGIN, resource="auth")
    return LoginResponse(access_token=access_token, refresh_token=refresh_token, user=user)

@app.post("/auth/logout")
async def logout(authorization: str = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        if token in active_sessions_db:
            del active_sessions_db[token]
    return {"message": "Logged out successfully"}

# ============================================================================
# User Management Endpoints
# ============================================================================

@app.get("/users", response_model=List[User])
async def list_users(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100)):
    return list(users_db.values())[skip:skip+limit]

@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    return users_db[user_id]

@app.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, update: dict):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    user = users_db[user_id]
    for field, value in update.items():
        if hasattr(user, field):
            setattr(user, field, value)
    return user

@app.delete("/users/{user_id}", status_code=204)
async def delete_user(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    del users_db[user_id]

# ============================================================================
# API Key Management
# ============================================================================

@app.post("/api-keys", response_model=dict, status_code=201)
async def create_api_key(user_id: str, request: ApiKeyCreate):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    raw_key = f"am_{uuid.uuid4().hex}"
    api_key = ApiKey(
        key_prefix=raw_key[:12], name=request.name, user_id=user_id,
        scopes=request.scopes, expires_at=datetime.utcnow() + timedelta(days=request.expires_in_days)
    )
    api_keys_db[api_key.id] = api_key
    return {"api_key": raw_key, "key_id": api_key.id, "name": api_key.name, "expires_at": api_key.expires_at.isoformat()}

@app.get("/api-keys", response_model=List[ApiKey])
async def list_api_keys(user_id: str):
    return [k for k in api_keys_db.values() if k.user_id == user_id]

@app.delete("/api-keys/{key_id}", status_code=204)
async def revoke_api_key(key_id: str):
    if key_id not in api_keys_db:
        raise HTTPException(status_code=404, detail="API key not found")
    api_keys_db[key_id].is_active = False

# ============================================================================
# Audit & Security Monitoring
# ============================================================================

@app.get("/audit-logs", response_model=List[AuditLog])
async def list_audit_logs(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100)):
    logs = list(audit_logs_db.values())
    logs.sort(key=lambda x: x.timestamp, reverse=True)
    return logs[skip:skip+limit]

@app.get("/security-events", response_model=List[SecurityEvent])
async def list_security_events(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100)):
    events = list(security_events_db.values())
    events.sort(key=lambda x: x.created_at, reverse=True)
    return events[skip:skip+limit]

@app.post("/security-events/{event_id}/resolve", response_model=SecurityEvent)
async def resolve_security_event(event_id: str):
    if event_id not in security_events_db:
        raise HTTPException(status_code=404, detail="Security event not found")
    event = security_events_db[event_id]
    event.resolved = True
    return event

# ============================================================================
# Permission Checking
# ============================================================================

@app.post("/permissions/check")
async def check_permission(user_id: str, resource: str, action: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    user = users_db[user_id]
    permissions = {UserRole.ADMIN: ["*"], UserRole.ANALYST: ["read"], UserRole.TRADER: ["read", "execute"], UserRole.VIEWER: ["read"]}
    user_permissions = permissions.get(user.role, [])
    allowed = "*" in user_permissions or action in user_permissions
    return {"allowed": allowed, "user_id": user_id, "role": user.role, "resource": resource, "action": action}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting AssetMind Security on port 5002")
    uvicorn.run(app, host="0.0.0.0", port=5002)
