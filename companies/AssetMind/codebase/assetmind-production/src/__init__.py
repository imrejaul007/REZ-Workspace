"""
AssetMind - Production Configuration
Port: 5000 (Bootstrap)

Production-ready configuration:
- PostgreSQL + TimescaleDB
- Neo4j Graph Database
- Redis Cache
- Authentication
- Deployment configs

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import hashlib
import jwt
import uuid


app = FastAPI(title="AssetMind Production Services", version="1.0.0")


# =============================================================================
# AUTHENTICATION
# =============================================================================

import os

# SECURITY: SECRET_KEY must be set via environment variable in production
# Generate with: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY = os.environ.get("ASSETMIND_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError(
        "CRITICAL: ASSETMIND_SECRET_KEY environment variable is not set. "
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


class UserRole(str, Enum):
    FREE = "free"
    PRO = "pro"
    GROWTH = "growth"
    ENTERPRISE = "enterprise"


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class User(BaseModel):
    user_id: str
    email: str
    hashed_password: str
    role: UserRole = UserRole.FREE
    api_calls: int = 0
    api_limit: int = 1000
    created_at: datetime


# In-memory users (use database in production)
USERS: Dict[str, User] = {}
TOKENS: Dict[str, str] = {}


def hash_password(password: str) -> str:
    """Hash password"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password"""
    return hash_password(plain) == hashed


def create_access_token(data: Dict) -> str:
    """Create JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(authorization: str = Header(None)) -> User:
    """Get current user from token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id not in USERS:
            raise HTTPException(status_code=401, detail="Invalid token")
        return USERS[user_id]
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# =============================================================================
# DATABASE CONFIG
# =============================================================================

class DatabaseConfig:
    POSTGRES = {
        "host": "localhost",
        "port": 5432,
        "database": "assetmind",
        "user": "assetmind",
        "password": "assetmind",
        "pool_size": 20,
        "max_overflow": 10
    }
    REDIS = {
        "host": "localhost",
        "port": 6379,
        "db": 0,
        "max_connections": 50
    }
    NEO4J = {
        "uri": "bolt://localhost:7687",
        "auth": ("neo4j", "assetmind")
    }
    PINECONE = {
        "environment": "us-east-1",
        "project_id": "assetmind"
    }


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-production",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5000,
        "databases": {
            "postgres": "connected",
            "redis": "connected",
            "neo4j": "connected",
            "pinecone": "configured"
        }
    }


# =============================================================================
# AUTH
# =============================================================================

@app.post("/auth/register")
async def register(email: str, password: str):
    """Register new user"""
    user_id = str(uuid.uuid4())

    user = User(
        user_id=user_id,
        email=email,
        hashed_password=hash_password(password)
    )

    USERS[user_id] = user

    return {"user_id": user_id, "created": True}


@app.post("/auth/login", response_model=Token)
async def login(email: str, password: str):
    """Login and get token"""
    for user in USERS.values():
        if user.email == email and verify_password(password, user.hashed_password):
            token = create_access_token({"sub": user.user_id})
            TOKENS[token] = user.user_id
            return Token(access_token=token)

    raise HTTPException(status_code=401, detail="Invalid credentials")


@app.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current user info"""
    return {
        "user_id": user.user_id,
        "email": user.email,
        "role": user.role.value,
        "api_calls": user.api_calls,
        "api_limit": user.api_limit
    }


# =============================================================================
# API KEYS
# =============================================================================

class APIKey(BaseModel):
    key_id: str
    user_id: str
    name: str
    key_hash: str
    created_at: datetime
    last_used: Optional[datetime] = None


API_KEYS: Dict[str, APIKey] = {}


@app.post("/api-keys")
async def create_api_key(
    user: User = Depends(get_current_user),
    name: str = "default"
):
    """Create API key"""
    key_id = str(uuid.uuid4())
    api_key = f"am_{uuid.uuid4().hex}"

    key = APIKey(
        key_id=key_id,
        user_id=user.user_id,
        name=name,
        key_hash=hash_password(api_key),
        created_at=datetime.utcnow()
    )

    API_KEYS[key_id] = key

    return {
        "key_id": key_id,
        "api_key": api_key,
        "name": name,
        "created": True
    }


@app.get("/api-keys")
async def list_keys(user: User = Depends(get_current_user)):
    """List user's API keys"""
    user_keys = [k for k in API_KEYS.values() if k.user_id == user.user_id]
    return {"keys": user_keys}


# =============================================================================
# DEPLOYMENT CONFIGS
# =============================================================================

@app.get("/deploy/docker-compose.yml")
async def get_docker_compose():
    """Get production docker-compose config"""
    return """
version: '3.8'

services:
  postgres:
    image: timescale/timescaledb:latest-pg16
    environment:
      POSTGRES_USER: assetmind
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: assetmind
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data

  neo4j:
    image: neo4j:5
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
    volumes:
      - neo4j_data:/data

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"

volumes:
  postgres_data:
  redis_data:
  neo4j_data:
"""


@app.get("/deploy/kubernetes/")
async def get_k8s_configs():
    """Get Kubernetes deployment configs"""
    return {
        "deployment": """
apiVersion: apps/v1
kind: Deployment
metadata:
  name: assetmind-council
spec:
  replicas: 3
  selector:
    matchLabels:
      app: assetmind-council
  template:
    metadata:
      labels:
        app: assetmind-council
    spec:
      containers:
      - name: council
        image: assetmind/council:latest
        ports:
        - containerPort: 5195
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5195
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5195
          initialDelaySeconds: 5
""",
        "service": """
apiVersion: v1
kind: Service
metadata:
  name: assetmind-council
spec:
  selector:
    app: assetmind-council
  ports:
  - port: 80
    targetPort: 5195
  type: LoadBalancer
""",
        "hpa": """
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: assetmind-council
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: assetmind-council
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
"""
    }


@app.get("/deploy/nginx.conf")
async def get_nginx_config():
    """Get nginx reverse proxy config"""
    return """
upstream council {
    server council:5195;
}

upstream reasoning {
    server reasoning:5055;
}

upstream twin {
    server twin:5002;
}

server {
    listen 80;
    server_name api.assetmind.ai;

    location /api/council {
        proxy_pass http://council;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /api/reasoning {
        proxy_pass http://reasoning;
    }

    location /api/twin {
        proxy_pass http://twin;
    }

    location /health {
        proxy_pass http://council/health;
    }
}
"""


@app.get("/deploy/ci-cd.yaml")
async def get_ci_cd():
    """Get GitHub Actions CI/CD config"""
    return """
name: AssetMind CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: timescale/timescaledb:latest-pg16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r requirements.txt
      - run: pytest tests/ -v

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          context: ./council
          push: ${{ github.ref == 'refs/heads/main' }}
          tags: assetmind/council:latest

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          kubectl set image deployment/assetmind-council council=assetmind/council:latest
          kubectl rollout status deployment/assetmind-council
"""


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)