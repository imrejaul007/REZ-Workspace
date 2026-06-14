"""
User Management Service
User management and authentication for AssetMind platform
Port: 5281
"""

from fastapi import FastAPI, HTTPException, Depends, Query
from pydantic import BaseModel, Field, EmailStr
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import logging
import hashlib
import secrets
import re

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind User Management Service", version="1.0.0", docs_url="/docs")


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"
    VIEWER = "viewer"
    API_USER = "api_user"


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


class User(BaseModel):
    user_id: str
    username: str
    email: str
    password_hash: str
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.PENDING
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    permissions: List[str] = Field(default_factory=list)
    preferences: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    login_count: int = 0
    failed_login_attempts: int = 0
    mfa_enabled: bool = False
    mfa_secret: Optional[str] = None


class ApiKey(BaseModel):
    key_id: str
    user_id: str
    key_name: str
    key_hash: str
    permissions: List[str] = Field(default_factory=list)
    created_at: datetime
    expires_at: Optional[datetime] = None
    last_used: Optional[datetime] = None
    is_active: bool = True


class Session(BaseModel):
    session_id: str
    user_id: str
    token: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    is_active: bool = True


class UserManagementService:
    """User management service"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "User Management Service"
        self.port = 5281
        self.version = "1.0.0"
        self._users: Dict[str, User] = {}
        self._api_keys: Dict[str, ApiKey] = {}
        self._sessions: Dict[str, Session] = {}
        self._email_index: Dict[str, str] = {}
        self._username_index: Dict[str, str] = {}
        self._password_min_length = 8
        self._session_duration_hours = 24
        self._max_login_attempts = 5
        self._initialize_default_admin()

    def _initialize_default_admin(self):
        """Create default admin user"""
        admin = self._create_user_internal(
            username="admin",
            email="admin@assetmind.io",
            password=os.getenv("ADMIN_PASSWORD", ""),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            permissions=["*"]
        )
        logger.info(f"Created default admin user: {admin.username}")

    def _generate_id(self, prefix: str = "") -> str:
        """Generate unique ID"""
        timestamp = datetime.utcnow().timestamp()
        random_suffix = secrets.token_hex(8)
        return f"{prefix}{timestamp}_{random_suffix}"

    def _hash_password(self, password: str, salt: Optional[str] = None) -> tuple:
        """Hash password with salt"""
        if salt is None:
            salt = secrets.token_hex(16)
        password_with_salt = f"{password}{salt}"
        hash_value = hashlib.pbkdf2_hmac('sha256', password_with_salt.encode(), salt.encode(), 100000)
        return hash_value.hex(), salt

    def _verify_password(self, password: str, password_hash: str, salt: str) -> bool:
        """Verify password against hash"""
        computed_hash, _ = self._hash_password(password, salt)
        return computed_hash == password_hash

    def _validate_email(self, email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None

    def _validate_password(self, password: str) -> tuple:
        """Validate password strength"""
        if len(password) < self._password_min_length:
            return False, f"Password must be at least {self._password_min_length} characters"
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"
        if not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"
        if not re.search(r'[0-9]', password):
            return False, "Password must contain at least one number"
        return True, "Valid"

    def _create_user_internal(
        self,
        username: str,
        email: str,
        password: str,
        role: UserRole = UserRole.USER,
        status: UserStatus = UserStatus.PENDING,
        permissions: List[str] = None,
        first_name: str = None,
        last_name: str = None
    ) -> User:
        """Internal method to create user"""
        user_id = self._generate_id("user_")
        password_hash, salt = self._hash_password(password)

        user = User(
            user_id=user_id,
            username=username,
            email=email,
            password_hash=f"{salt}:{password_hash}",
            role=role,
            status=status,
            permissions=permissions or [],
            first_name=first_name,
            last_name=last_name,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        self._users[user_id] = user
        self._email_index[email.lower()] = user_id
        self._username_index[username.lower()] = user_id

 return user

    async def create_user(
        self,
        username: str,
        email: str,
        password: str,
        role: str = "user",
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        phone: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new user"""
        # Validate inputs
        if not self._validate_email(email):
            raise ValueError("Invalid email format")

        is_valid, message = self._validate_password(password)
        if not is_valid:
            raise ValueError(message)

        if email.lower() in self._email_index:
            raise ValueError("Email already registered")

        if username.lower() in self._username_index:
            raise ValueError("Username already taken")

        # Create user
        user = self._create_user_internal(
            username=username,
            email=email,
            password=password,
            role=UserRole(role),
            first_name=first_name,
            last_name=last_name
        )

        if phone:
            user.phone = phone

        logger.info(f"Created user: {username} (ID: {user.user_id})")
        return self._user_to_dict(user)

    async def authenticate(
        self,
        username: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """Authenticate user and create session"""
        user_id = self._username_index.get(username.lower())

        if not user_id:
            raise ValueError("Invalid username or password")

        user = self._users[user_id]

        if user.status == UserStatus.SUSPENDED:
            raise ValueError("Account is suspended")

        if user.status == UserStatus.INACTIVE:
            raise ValueError("Account is inactive")

        # Verify password
        salt, stored_hash = user.password_hash.split(":")
        if not self._verify_password(password, stored_hash, salt):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= self._max_login_attempts:
                user.status = UserStatus.SUSPENDED
                raise ValueError("Account suspended due to too many failed attempts")
            raise ValueError("Invalid username or password")

        # Reset failed attempts on successful login
        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()
        user.login_count += 1

        # Create session
        session = self._create_session(user.user_id, ip_address, user_agent)

        logger.info(f"User authenticated: {username}")

        return {
            "user": self._user_to_dict(user),
            "session": {
                "session_id": session.session_id,
                "token": session.token,
                "expires_at": session.expires_at.isoformat()
            }
        }

    def _create_session(
        self,
        user_id: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Session:
        """Create a new session"""
        session_id = self._generate_id("sess_")
        token = secrets.token_urlsafe(32)

        session = Session(
            session_id=session_id,
            user_id=user_id,
            token=token,
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=self._session_duration_hours)
        )

        self._sessions[session_id] = session
        return session

    async def create_api_key(
        self,
        user_id: str,
        key_name: str,
        permissions: List[str] = None,
        expires_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """Create API key for user"""
        if user_id not in self._users:
            raise ValueError("User not found")

        key_id = self._generate_id("key_")
        api_key = secrets.token_urlsafe(32)
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()

        expires_at = None
        if expires_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_days)

        api_key_obj = ApiKey(
            key_id=key_id,
            user_id=user_id,
            key_name=key_name,
            key_hash=key_hash,
            permissions=permissions or [],
            created_at=datetime.utcnow(),
            expires_at=expires_at
        )

        self._api_keys[key_id] = api_key_obj

        logger.info(f"Created API key: {key_name} for user {user_id}")

        return {
            "key_id": key_id,
            "api_key": api_key,  # Only returned once
            "key_name": key_name,
            "expires_at": expires_at.isoformat() if expires_at else None
        }

    async def validate_api_key(self, api_key: str) -> Optional[User]:
        """Validate API key and return user"""
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()

        for key in self._api_keys.values():
            if key.key_hash == key_hash and key.is_active:
                if key.expires_at and key.expires_at < datetime.utcnow():
                    return None
                key.last_used = datetime.utcnow()
                return self._users.get(key.user_id)

        return None

    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        user = self._users.get(user_id)
        return self._user_to_dict(user) if user else None

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        user_id = self._email_index.get(email.lower())
        if user_id:
            return self._user_to_dict(self._users.get(user_id))
        return None

    async def list_users(
        self,
        role: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """List users with filtering"""
        users = list(self._users.values())

        if role:
            users = [u for u in users if u.role.value == role]
        if status:
            users = [u for u in users if u.status.value == status]

        total = len(users)
        users = users[offset:offset + limit]

        return {
            "users": [self._user_to_dict(u) for u in users],
            "total": total,
            "limit": limit,
            "offset": offset
        }

    async def update_user(
        self,
        user_id: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        phone: Optional[str] = None,
        avatar_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update user profile"""
        if user_id not in self._users:
            raise ValueError("User not found")

        user = self._users[user_id]

        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if phone is not None:
            user.phone = phone
        if avatar_url is not None:
            user.avatar_url = avatar_url

        user.updated_at = datetime.utcnow()

        return self._user_to_dict(user)

    async def change_password(
        self,
        user_id: str,
        old_password: str,
        new_password: str
    ) -> bool:
        """Change user password"""
        if user_id not in self._users:
            raise ValueError("User not found")

        user = self._users[user_id]

        # Verify old password
        salt, stored_hash = user.password_hash.split(":")
        if not self._verify_password(old_password, stored_hash, salt):
            raise ValueError("Current password is incorrect")

        # Validate new password
        is_valid, message = self._validate_password(new_password)
        if not is_valid:
            raise ValueError(message)

        # Update password
        new_hash, new_salt = self._hash_password(new_password)
        user.password_hash = f"{new_salt}:{new_hash}"
        user.updated_at = datetime.utcnow()

        logger.info(f"Password changed for user: {user.username}")
        return True

    async def update_user_status(
        self,
        user_id: str,
        status: str
    ) -> Dict[str, Any]:
        """Update user status"""
        if user_id not in self._users:
            raise ValueError("User not found")

        user = self._users[user_id]
        user.status = UserStatus(status)
        user.updated_at = datetime.utcnow()

        return self._user_to_dict(user)

    async def update_user_permissions(
        self,
        user_id: str,
        permissions: List[str]
    ) -> Dict[str, Any]:
        """Update user permissions"""
        if user_id not in self._users:
            raise ValueError("User not found")

        user = self._users[user_id]
        user.permissions = permissions
        user.updated_at = datetime.utcnow()

        return self._user_to_dict(user)

    async def delete_user(self, user_id: str) -> bool:
        """Delete user"""
        if user_id not in self._users:
            raise ValueError("User not found")

        user = self._users[user_id]

        # Remove from indexes
        del self._email_index[user.email.lower()]
        del self._username_index[user.username.lower()]

        # Remove user
        del self._users[user_id]

        logger.info(f"Deleted user: {user_id}")
        return True

    def _user_to_dict(self, user: User) -> Dict[str, Any]:
        """Convert user to dictionary (without sensitive data)"""
        if not user:
            return None
        return {
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "role": user.role.value,
            "status": user.status.value,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "avatar_url": user.avatar_url,
            "permissions": user.permissions,
            "preferences": user.preferences,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "login_count": user.login_count,
            "mfa_enabled": user.mfa_enabled
        }


service = UserManagementService()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "total_users": len(service._users)
    }


@app.post("/api/v1/users")
async def create_user(request: Dict[str, Any]):
    """Create a new user"""
    try:
        return await service.create_user(
            username=request["username"],
            email=request["email"],
            password=request["password"],
            role=request.get("role", "user"),
            first_name=request.get("first_name"),
            last_name=request.get("last_name"),
            phone=request.get("phone")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/v1/auth/login")
async def login(request: Dict[str, Any]):
    """Authenticate user"""
    try:
        return await service.authenticate(
            username=request["username"],
            password=request["password"],
            ip_address=request.get("ip_address"),
            user_agent=request.get("user_agent")
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.post("/api/v1/api-keys")
async def create_api_key(request: Dict[str, Any]):
    """Create API key"""
    try:
        return await service.create_api_key(
            user_id=request["user_id"],
            key_name=request["key_name"],
            permissions=request.get("permissions"),
            expires_days=request.get("expires_days")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/v1/users/{user_id}")
async def get_user(user_id: str):
    """Get user by ID"""
    user = await service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.get("/api/v1/users/email/{email}")
async def get_user_by_email(email: str):
    """Get user by email"""
    user = await service.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.get("/api/v1/users/list")
async def list_users(
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0)
):
    """List users"""
    return await service.list_users(role, status, limit, offset)


@app.patch("/api/v1/users/{user_id}")
async def update_user(user_id: str, request: Dict[str, Any]):
    """Update user profile"""
    try:
        return await service.update_user(
            user_id=user_id,
            first_name=request.get("first_name"),
            last_name=request.get("last_name"),
            phone=request.get("phone"),
            avatar_url=request.get("avatar_url")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.patch("/api/v1/users/{user_id}/password")
async def change_password(user_id: str, request: Dict[str, Any]):
    """Change user password"""
    try:
        return await service.change_password(
            user_id=user_id,
            old_password=request["old_password"],
            new_password=request["new_password"]
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.patch("/api/v1/users/{user_id}/status")
async def update_user_status(user_id: str, request: Dict[str, Any]):
    """Update user status"""
    try:
        return await service.update_user_status(user_id, request["status"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.patch("/api/v1/users/{user_id}/permissions")
async def update_permissions(user_id: str, request: Dict[str, Any]):
    """Update user permissions"""
    try:
        return await service.update_user_permissions(user_id, request["permissions"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/v1/users/{user_id}")
async def delete_user(user_id: str):
    """Delete user"""
    try:
        await service.delete_user(user_id)
        return {"success": True, "message": "User deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5281)