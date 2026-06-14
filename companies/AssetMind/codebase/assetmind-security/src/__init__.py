"""
AssetMind Security Service
Port: 5305

Role-based access control, audit logging, and security management.
Provides authentication, authorization, and compliance tracking.
"""

import uvicorn
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import json
import hashlib
import secrets


app = FastAPI(title="AssetMind Security", version="1.0.0")


class Role(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    ANALYST = "analyst"
    VIEWER = "viewer"
    GUEST = "guest"


class Permission(str, Enum):
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    ADMIN = "admin"
    TRADE = "trade"
    EXPORT = "export"


class User(BaseModel):
    user_id: str
    username: str
    email: str
    role: Role
    permissions: List[Permission]
    is_active: bool = True
    created_at: str
    last_login: Optional[str] = None


class AuditLog(BaseModel):
    log_id: str
    user_id: str
    action: str
    resource: str
    resource_id: Optional[str] = None
    details: Optional[Dict] = None
    ip_address: Optional[str] = None
    timestamp: str
    status: str  # success, failure


class AccessRequest(BaseModel):
    resource: str
    permission: Permission


# Role-Permission mapping
ROLE_PERMISSIONS = {
    Role.ADMIN: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN, Permission.TRADE, Permission.EXPORT],
    Role.MANAGER: [Permission.READ, Permission.WRITE, Permission.TRADE, Permission.EXPORT],
    Role.ANALYST: [Permission.READ, Permission.WRITE, Permission.EXPORT],
    Role.VIEWER: [Permission.READ],
    Role.GUEST: [Permission.READ],
}

# In-memory storage
users: Dict[str, User] = {}
audit_logs: List[AuditLog] = []
api_keys: Dict[str, Dict] = {}
sessions: Dict[str, Dict] = {}
log_counter = 0


def hash_api_key(key: str) -> str:
    """Hash an API key for storage."""
    return hashlib.sha256(key.encode()).hexdigest()


def generate_api_key() -> str:
    """Generate a new API key."""
    return f"am_{secrets.token_urlsafe(32)}"


def log_action(user_id: str, action: str, resource: str, resource_id: Optional[str] = None, details: Optional[Dict] = None, status: str = "success", ip: Optional[str] = None):
    """Log an action to the audit trail."""
    global log_counter
    log_counter += 1

    log = AuditLog(
        log_id=f"log-{log_counter:08d}",
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=resource_id,
        details=details,
        ip_address=ip,
        timestamp=datetime.now().isoformat(),
        status=status
    )
    audit_logs.append(log)
    return log


def check_permission(user: User, required_permission: Permission) -> bool:
    """Check if a user has a required permission."""
    if not user.is_active:
        return False
    return required_permission in user.permissions


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "security", "version": "1.0.0"}


@app.post("/users")
async def create_user(
    username: str,
    email: str,
    role: Role,
    created_by: str = "system"
):
    """Create a new user."""
    user_id = f"user-{hashlib.md5(username.encode()).hexdigest()[:8]}"

    if user_id in users:
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(
        user_id=user_id,
        username=username,
        email=email,
        role=role,
        permissions=ROLE_PERMISSIONS.get(role, []),
        created_at=datetime.now().isoformat()
    )
    users[user_id] = user

    log_action(created_by, "CREATE_USER", "users", user_id, {"username": username, "role": role.value})

    return {"user": user, "user_id": user_id}


@app.get("/users/{user_id}")
async def get_user(user_id: str):
    """Get user details."""
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    return users[user_id]


@app.get("/users")
async def list_users(role: Optional[Role] = None, active_only: bool = True):
    """List all users."""
    result = list(users.values())

    if role:
        result = [u for u in result if u.role == role]
    if active_only:
        result = [u for u in result if u.is_active]

    return {"users": result, "total": len(result)}


@app.post("/users/{user_id}/deactivate")
async def deactivate_user(user_id: str, deactivated_by: str):
    """Deactivate a user."""
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")

    users[user_id].is_active = False
    log_action(deactivated_by, "DEACTIVATE_USER", "users", user_id)

    return {"status": "deactivated"}


@app.post("/users/{user_id}/permissions")
async def update_user_permissions(user_id: str, permissions: List[Permission], updated_by: str):
    """Update user permissions."""
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")

    users[user_id].permissions = permissions
    log_action(updated_by, "UPDATE_PERMISSIONS", "users", user_id, {"permissions": [p.value for p in permissions]})

    return {"user_id": user_id, "permissions": permissions}


@app.post("/api-keys")
async def create_api_key(user_id: str, name: str):
    """Create an API key for a user."""
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")

    api_key = generate_api_key()
    key_hash = hash_api_key(api_key)

    api_keys[key_hash] = {
        "user_id": user_id,
        "name": name,
        "created_at": datetime.now().isoformat(),
        "last_used": None,
        "is_active": True
    }

    log_action(user_id, "CREATE_API_KEY", "api_keys", key_hash[:8], {"name": name})

    return {
        "api_key": api_key,  # Only returned once!
        "key_id": key_hash[:8],
        "name": name,
        "message": "Store this key securely. It will not be shown again."
    }


@app.post("/auth/verify")
async def verify_permission(user_id: str, resource: str, permission: Permission):
    """Verify if a user has permission to access a resource."""
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")

    user = users[user_id]
    has_permission = check_permission(user, permission)

    return {
        "user_id": user_id,
        "resource": resource,
        "permission": permission.value,
        "has_permission": has_permission,
        "role": user.role.value
    }


@app.get("/audit")
async def get_audit_logs(
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    resource: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100
):
    """Query audit logs."""
    result = audit_logs[-limit:]

    if user_id:
        result = [l for l in result if l.user_id == user_id]
    if action:
        result = [l for l in result if l.action == action]
    if resource:
        result = [l for l in result if l.resource == resource]

    return {"logs": result, "total": len(result)}


@app.post("/audit/export")
async def export_audit_logs(start_date: str, end_date: str, format: str = "json"):
    """Export audit logs for compliance."""
    logs = [l for l in audit_logs if start_date <= l.timestamp <= end_date]

    return {
        "format": format,
        "start_date": start_date,
        "end_date": end_date,
        "total_logs": len(logs),
        "logs": logs
    }


@app.get("/permissions/roles")
async def get_role_permissions():
    """Get permissions for each role."""
    return {
        "roles": [
            {"role": r.value, "permissions": [p.value for p in perms]}
            for r, perms in ROLE_PERMISSIONS.items()
        ]
    }


@app.post("/sessions")
async def create_session(user_id: str, ip_address: Optional[str] = None):
    """Create a new session."""
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")

    if not users[user_id].is_active:
        raise HTTPException(status_code=403, detail="User is deactivated")

    session_id = secrets.token_urlsafe(32)
    session = {
        "session_id": session_id,
        "user_id": user_id,
        "created_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + timedelta(hours=24)).isoformat(),
        "ip_address": ip_address,
        "is_active": True
    }
    sessions[session_id] = session

    users[user_id].last_login = datetime.now().isoformat()
    log_action(user_id, "LOGIN", "sessions", session_id, ip_address=ip_address)

    return session


@app.post("/sessions/{session_id}/invalidate")
async def invalidate_session(session_id: str, user_id: str):
    """Invalidate a session (logout)."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    sessions[session_id]["is_active"] = False
    log_action(user_id, "LOGOUT", "sessions", session_id)

    return {"status": "invalidated"}


@app.get("/compliance/summary")
async def get_compliance_summary():
    """Get compliance summary."""
    total_users = len(users)
    active_users = len([u for u in users.values() if u.is_active])
    total_logs = len(audit_logs)
    recent_failures = len([l for l in audit_logs[-1000:] if l.status == "failure"])

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_audit_logs": total_logs,
        "recent_auth_failures": recent_failures,
        "last_audit_export": audit_logs[-1].timestamp if audit_logs else None,
        "compliance_status": "COMPLIANT" if recent_failures < 10 else "REVIEW_REQUIRED"
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5305)