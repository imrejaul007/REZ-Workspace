"""
AssetMind Production Service
Authentication, API Keys, and Deployment Configurations
Port: 5000
"""

import logging
import os
import secrets
import time
import hashlib
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("assetmind-production")


class PricingTier(str, Enum):
    FREE = "free"
    PRO = "pro"
    GROWTH = "growth"
    ENTERPRISE = "enterprise"


class APIKeyStatus(str, Enum):
    ACTIVE = "active"
    REVOKED = "revoked"
    EXPIRED = "expired"


# ============================================================================
# Pydantic Models
# ============================================================================

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    email: str
    password_hash: str
    name: str
    tier: PricingTier = PricingTier.FREE
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None


class UserCreate(BaseModel):
    email: str
    password: str
    name: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    tier: PricingTier
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class APIKey(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    key: str
    key_prefix: str
    name: str
    user_id: str
    tier: PricingTier = PricingTier.FREE
    status: APIKeyStatus = APIKeyStatus.ACTIVE
    daily_limit: int = 100
    used_today: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None


class APIKeyCreate(BaseModel):
    name: str
    tier: PricingTier = PricingTier.FREE


class APIKeyResponse(BaseModel):
    id: str
    key: Optional[str] = None
    key_prefix: str
    name: str
    tier: PricingTier
    status: APIKeyStatus
    daily_limit: int
    used_today: int
    created_at: datetime


# ============================================================================
# State Management
# ============================================================================

class ProductionState:
    def __init__(self):
        self.users: Dict[str, User] = {}
        self.email_index: Dict[str, str] = {}
        self.api_keys: Dict[str, APIKey] = {}
        self.stats = {"total_requests": 0, "auth_attempts": 0, "failed_auths": 0}
        self.start_time = time.time()
        self._init_demo()

    def _init_demo(self):
        # SECURITY: Demo user credentials loaded from environment variables
        # If not set, demo user is NOT created in production
        demo_email = os.environ.get("ASSETMIND_DEMO_EMAIL")
        demo_password = os.environ.get("ASSETMIND_DEMO_PASSWORD")

        # Only create demo user if explicitly configured (e.g., for development)
        # In production, this should be disabled by not setting these env vars
        if demo_email and demo_password:
            if os.environ.get("APP_ENV") != "production":
                demo = User(id="demo-001", email=demo_email, password_hash=self._hash(demo_password),
                           name="Demo User", tier=PricingTier.PRO, is_verified=True)
                self.users[demo.id] = demo
                self.email_index[demo.email] = demo.id
                logger.warning(f"Demo user enabled with email: {demo_email}")
            else:
                logger.info("Demo user disabled in production mode")

    def _hash(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

    def _generate_key(self) -> tuple:
        key = f"am_{secrets.token_urlsafe(32)}"
        return key, key[:12]

    def register(self, req: UserCreate) -> User:
        if req.email in self.email_index:
            raise HTTPException(status_code=400, detail="Email already registered")
        user = User(email=req.email, password_hash=self._hash(req.password), name=req.name)
        self.users[user.id] = user
        self.email_index[user.email] = user.id
        return user

    def authenticate(self, req: UserLogin) -> TokenResponse:
        self.stats["auth_attempts"] += 1
        user_id = self.email_index.get(req.email)
        if not user_id or self._hash(req.password) != self.users[user_id].password_hash:
            self.stats["failed_auths"] += 1
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user = self.users[user_id]
        user.last_login = datetime.utcnow()
        token = f"eyJ.{secrets.token_urlsafe(32)}"

        return TokenResponse(access_token=token, expires_in=86400, user=UserResponse(
            id=user.id, email=user.email, name=user.name, tier=user.tier,
            is_active=user.is_active, is_verified=user.is_verified, created_at=user.created_at, last_login=user.last_login))

    def create_api_key(self, req: APIKeyCreate, user_id: str) -> APIKey:
        key, prefix = self._generate_key()
        api_key = APIKey(key=key, key_prefix=prefix, name=req.name, user_id=user_id, tier=req.tier,
                        daily_limit={PricingTier.FREE: 100, PricingTier.PRO: 10000, PricingTier.GROWTH: 100000,
                                    PricingTier.ENTERPRISE: -1}[req.tier])
        self.api_keys[key] = api_key
        return api_key

    def list_api_keys(self, user_id: str) -> List[APIKeyResponse]:
        return [APIKeyResponse(id=k.id, key_prefix=k.key_prefix, name=k.name, tier=k.tier, status=k.status,
                              daily_limit=k.daily_limit, used_today=k.used_today, created_at=k.created_at)
                for k in self.api_keys.values() if k.user_id == user_id]

    def revoke_key(self, key_id: str, user_id: str) -> APIKey:
        for k in self.api_keys.values():
            if k.id == key_id and k.user_id == user_id:
                k.status = APIKeyStatus.REVOKED
                return k
        raise HTTPException(status_code=404, detail="API key not found")


state = ProductionState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Production Service starting...")
    yield
    logger.info("Production Service shutting down...")


app = FastAPI(title="AssetMind Production Service", description="Auth, API Keys, and Deployment Configs", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
async def health_check():
    return {"service": "assetmind-production", "status": "healthy", "users": len(state.users),
            "api_keys": len(state.api_keys), "uptime_seconds": time.time() - state.start_time}


@app.post("/auth/register", response_model=UserResponse, status_code=201)
async def register(req: UserCreate):
    user = state.register(req)
    return UserResponse(id=user.id, email=user.email, name=user.name, tier=user.tier,
                       is_active=user.is_active, is_verified=user.is_verified, created_at=user.created_at)


@app.post("/auth/login", response_model=TokenResponse)
async def login(req: UserLogin):
    return state.authenticate(req)


@app.get("/auth/me", response_model=UserResponse)
async def get_me(x_user_id: str = Header(None)):
    if not x_user_id or x_user_id not in state.users:
        raise HTTPException(status_code=401, detail="Not authenticated")
    u = state.users[x_user_id]
    return UserResponse(id=u.id, email=u.email, name=u.name, tier=u.tier, is_active=u.is_active,
                       is_verified=u.is_verified, created_at=u.created_at, last_login=u.last_login)


@app.post("/api-keys", response_model=APIKeyResponse, status_code=201)
async def create_key(req: APIKeyCreate, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    k = state.create_api_key(req, x_user_id)
    return APIKeyResponse(id=k.id, key=k.key, key_prefix=k.key_prefix, name=k.name, tier=k.tier,
                         status=k.status, daily_limit=k.daily_limit, used_today=k.used_today, created_at=k.created_at)


@app.get("/api-keys", response_model=List[APIKeyResponse])
async def list_keys(x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return state.list_api_keys(x_user_id)


@app.delete("/api-keys/{key_id}", response_model=APIKeyResponse)
async def revoke_key(key_id: str, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    k = state.revoke_key(key_id, x_user_id)
    return APIKeyResponse(id=k.id, key_prefix=k.key_prefix, name=k.name, tier=k.tier, status=k.status,
                         daily_limit=k.daily_limit, used_today=k.used_today, created_at=k.created_at)


@app.get("/deploy/docker-compose.yml")
async def get_docker_compose():
    return {"config": """version: '3.8'
services:
  api:
    build: .
    ports: ["8000:8000"]
    environment:
      - POSTGRES_URI=${POSTGRES_URI}
      - SECRET_KEY=${SECRET_KEY}
    restart: unless-stopped
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=assetmind
      - POSTGRES_PASSWORD=secret
    volumes:
      - pg_data:/var/lib/postgresql/data
volumes:
  pg_data:
"""}


@app.get("/deploy/nginx.conf")
async def get_nginx():
    return {"config": """upstream backend { server localhost:8000; }
server {
    listen 80;
    server_name api.assetmind.com;
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}"""}


@app.get("/tiers")
async def get_tiers():
    return {"tiers": [
        {"name": "free", "requests_per_day": 100, "price": 0},
        {"name": "pro", "requests_per_day": 10000, "price": 49},
        {"name": "growth", "requests_per_day": 100000, "price": 199},
        {"name": "enterprise", "requests_per_day": -1, "price": "custom"},
    ]}


@app.get("/")
async def root():
    return {"service": "AssetMind Production Service", "version": "1.0.0", "port": 5000, "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)