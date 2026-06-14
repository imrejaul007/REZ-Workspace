"""
AssetMind Admin - Admin Dashboard and User Management
Port: 5280
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from enum import Enum

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from loguru import logger

app = FastAPI(title="AssetMind Admin", description="Admin Dashboard and User Management", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    ANALYST = "analyst"
    VIEWER = "viewer"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class AuditAction(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"

class ServiceStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"

# Pydantic Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=200)
    role: UserRole = UserRole.VIEWER
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    department: Optional[str] = None
    status: Optional[UserStatus] = None

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: UserStatus = UserStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    permissions: List[str] = []

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserLoginResponse(BaseModel):
    user_id: str
    access_token: str
    expires_in: int = 3600

class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    action: AuditAction
    resource_type: str
    resource_id: Optional[str] = None
    details: dict = {}
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ServiceHealth(BaseModel):
    service_name: str
    status: ServiceStatus
    response_time_ms: float = 0.0
    last_check: datetime = Field(default_factory=datetime.utcnow)

class SystemHealth(BaseModel):
    overall_status: ServiceStatus
    services: List[ServiceHealth] = []
    uptime_seconds: float = 0.0

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    title: str
    message: str
    severity: str = "info"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False

class Permission(BaseModel):
    resource: str
    actions: List[str] = ["read"]

class DashboardMetrics(BaseModel):
    total_users: int
    active_users: int
    total_portfolios: int
    total_assets: int
    system_health: str

# In-Memory Storage
users_db: dict[str, User] = {}
audit_logs_db: dict[str, AuditLog] = {}
sessions_db: dict[str, dict] = {}
notifications_db: dict[str, Notification] = {}

def get_permissions(role: UserRole) -> List[str]:
    return {"admin": ["*"], "manager": ["portfolios:*", "reports:*", "assets:read"], "analyst": ["assets:read", "reports:read"], "viewer": ["assets:read"]}.get(role.value, [])

def log_audit(user_id: Optional[str], action: AuditAction, resource_type: str, resource_id: Optional[str] = None, details: dict = None):
    log = AuditLog(user_id=user_id, action=action, resource_type=resource_type, resource_id=resource_id, details=details or {})
    audit_logs_db[log.id] = log

# Initialize sample data
admin = User(id="admin-001", email="admin@assetmind.io", full_name="System Admin", role=UserRole.ADMIN, department="IT", permissions=["*"])
users_db[admin.id] = admin

manager = User(id="manager-001", email="manager@assetmind.io", full_name="Portfolio Manager", role=UserRole.MANAGER, department="Investment", permissions=["portfolios:*", "reports:*"])
users_db[manager.id] = manager

analyst = User(id="analyst-001", email="analyst@assetmind.io", full_name="Financial Analyst", role=UserRole.ANALYST, department="Research", permissions=["assets:read", "reports:read"])
users_db[analyst.id] = analyst

# Sample notifications
notifications_db["notif-001"] = Notification(type="system", title="System Update", message="AssetMind updated to version 1.2.0", severity="info")
notifications_db["notif-002"] = Notification(type="security", title="Security Alert", message="Unusual login activity detected", severity="warning")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "assetmind-admin", "version": "1.0.0", "timestamp": datetime.utcnow().isoformat(), "stats": {"users": len(users_db), "audit_logs": len(audit_logs_db)}}

@app.post("/api/auth/login", response_model=UserLoginResponse)
async def login(credentials: UserLogin):
    user = next((u for u in users_db.values() if u.email == credentials.email), None)
    if not user or user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = f"at_{uuid.uuid4().hex}"
    sessions_db[token] = {"user_id": user.id, "created_at": datetime.utcnow()}
    user.last_login = datetime.utcnow()
    log_audit(user.id, AuditAction.LOGIN, "user", user.id)
    return UserLoginResponse(user_id=user.id, access_token=token)

@app.post("/api/users", response_model=User, status_code=201)
async def create_user(user_data: UserCreate):
    if any(u.email == user_data.email for u in users_db.values()):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(**user_data.model_dump(), permissions=get_permissions(user_data.role))
    users_db[user.id] = user
    log_audit(None, AuditAction.CREATE, "user", user.id)
    return user

@app.get("/api/users", response_model=List[User])
async def list_users(skip: int = 0, limit: int = 100, role: Optional[UserRole] = None):
    users = list(users_db.values())
    if role:
        users = [u for u in users if u.role == role]
    return users[skip:skip + limit]

@app.get("/api/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    return users_db[user_id]

@app.put("/api/users/{user_id}", response_model=User)
async def update_user(user_id: str, update: UserUpdate):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    user = users_db[user_id]
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    user.updated_at = datetime.utcnow()
    log_audit(None, AuditAction.UPDATE, "user", user_id)
    return user

@app.delete("/api/users/{user_id}", status_code=204)
async def delete_user(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    users_db[user_id].status = UserStatus.INACTIVE
    log_audit(None, AuditAction.DELETE, "user", user_id)

@app.get("/api/audit-logs", response_model=List[AuditLog])
async def list_audit_logs(skip: int = 0, limit: int = 100):
    logs = list(audit_logs_db.values())
    logs.sort(key=lambda x: x.timestamp, reverse=True)
    return logs[skip:skip + limit]

@app.get("/api/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics():
    return DashboardMetrics(total_users=len(users_db), active_users=sum(1 for u in users_db.values() if u.status == UserStatus.ACTIVE), total_portfolios=0, total_assets=0, system_health=ServiceStatus.HEALTHY.value)

@app.get("/api/system/health", response_model=SystemHealth)
async def get_system_health():
    services = [
        ServiceHealth(service_name="assetmind-api", status=ServiceStatus.HEALTHY, response_time_ms=45.2),
        ServiceHealth(service_name="assetmind-memory", status=ServiceStatus.HEALTHY, response_time_ms=12.8),
        ServiceHealth(service_name="assetmind-intelligence", status=ServiceStatus.HEALTHY, response_time_ms=89.5),
        ServiceHealth(service_name="assetmind-gateway", status=ServiceStatus.HEALTHY, response_time_ms=8.3),
    ]
    return SystemHealth(overall_status=ServiceStatus.HEALTHY, services=services, uptime_seconds=86400.0)

@app.get("/api/notifications", response_model=List[Notification])
async def list_notifications(unread_only: bool = False):
    notifications = list(notifications_db.values())
    if unread_only:
        notifications = [n for n in notifications if not n.read]
    return notifications

@app.post("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    if notification_id not in notifications_db:
        raise HTTPException(status_code=404, detail="Notification not found")
    notifications_db[notification_id].read = True
    return notifications_db[notification_id]

@app.post("/api/users/{user_id}/permissions")
async def update_user_permissions(user_id: str, permissions: List[str]):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    user = users_db[user_id]
    old_permissions = user.permissions.copy()
    user.permissions = permissions
    user.updated_at = datetime.utcnow()
    log_audit(None, AuditAction.UPDATE, "user", user_id, {"old": old_permissions, "new": permissions})
    return user

@app.get("/api/roles/{role}/permissions")
async def get_role_permissions(role: UserRole):
    return {"role": role.value, "permissions": [Permission(resource="assets", actions=["read", "write"]), Permission(resource="reports", actions=["read", "write"]), Permission(resource="users", actions=["read", "write"])] if role == UserRole.ADMIN else [Permission(resource="assets", actions=["read"]), Permission(resource="reports", actions=["read"])]}

@app.get("/api/dashboard/activity")
async def get_recent_activity(limit: int = 20):
    logs = list(audit_logs_db.values())
    logs.sort(key=lambda x: x.timestamp, reverse=True)
    return logs[:limit]

@app.post("/api/auth/logout")
async def logout(token: str = Query(...)):
    if token in sessions_db:
        user_id = sessions_db[token]["user_id"]
        del sessions_db[token]
        log_audit(user_id, AuditAction.LOGOUT, "user", user_id)
        return {"message": "Logged out successfully"}
    return {"message": "Session not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5280)