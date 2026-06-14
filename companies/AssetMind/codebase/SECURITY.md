# AssetMind Security Guide

**Last Updated:** June 12, 2026

---

## Overview

This guide covers security hardening for the AssetMind platform including rate limiting, circuit breakers, SSL/TLS, and best practices.

## Table of Contents

1. [Rate Limiting](#rate-limiting)
2. [Circuit Breakers](#circuit-breakers)
3. [SSL/TLS Configuration](#ssltls-configuration)
4. [Security Headers](#security-headers)
5. [API Authentication](#api-authentication)
6. [Secrets Management](#secrets-management)

---

## Rate Limiting

### Python (FastAPI)

```python
from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/data")
@limiter.limit("100/minute")
async def get_data(request: Request):
    return {"data": "value"}
```

### Python (Custom Implementation)

```python
import time
from collections import defaultdict
from functools import wraps

class RateLimiter:
    def __init__(self, requests: int, period: int):
        self.requests = requests
        self.period = period
        self.clients = defaultdict(list)
    
    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        # Remove old requests
        self.clients[client_id] = [
            t for t in self.clients[client_id]
            if now - t < self.period
        ]
        # Check limit
        if len(self.clients[client_id]) >= self.requests:
            return False
        self.clients[client_id].append(now)
        return True

# Usage
rate_limiter = RateLimiter(requests=100, period=60)  # 100 requests per minute

@app.middleware
async def rate_limit_middleware(request: Request, call_next):
    client_id = request.client.host
    if not rate_limiter.is_allowed(client_id):
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded"}
        )
    return await call_next(request)
```

### TypeScript/Express

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 60
  }
});

app.use('/api/', limiter);
```

---

## Circuit Breakers

### Python

```python
import asyncio
import time
from functools import wraps
from enum import Enum

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"           # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing recovery

class CircuitBreaker:
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type = Exception
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.failures = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED
    
    def call(self, func, *args, **kwargs):
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
            else:
                raise CircuitBreakerOpen("Circuit breaker is OPEN")
        
        try:
            result = func(*args, **kwargs)
            if self.state == CircuitState.HALF_OPEN:
                self.reset()
            return result
        except self.expected_exception as e:
            self.record_failure()
            raise
    
    def record_failure(self):
        self.failures += 1
        self.last_failure_time = time.time()
        if self.failures >= self.failure_threshold:
            self.state = CircuitState.OPEN
    
    def reset(self):
        self.failures = 0
        self.state = CircuitState.CLOSED
        self.last_failure_time = None

# Usage
breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=30)

@app.get("/api/external-data")
async def get_external_data():
    return await breaker.call(fetch_data_from_external_service)
```

### TypeScript

```typescript
import CircuitBreaker from 'opossum';

const options = {
  timeout: 3000, // If response takes > 3s, considered failure
  errorThresholdPercentage: 50, // Open circuit if > 50% failures
  resetTimeout: 30000 // Try again after 30s
};

const circuitBreaker = new CircuitBreaker(fetchExternalData, options);

circuitBreaker
  .fire(params)
  .then(result => res.json(result))
  .catch(err => {
    if (circuitBreaker.status === 'OPEN') {
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }
    throw err;
  });
```

---

## SSL/TLS Configuration

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.assetmind.ai;

    # SSL Certificate
    ssl_certificate /etc/ssl/certs/assetmind.crt;
    ssl_certificate_key /etc/ssl/private/assetmind.key;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.assetmind.ai;
    return 301 https://$server_name$request_uri;
}
```

### Docker Compose with SSL

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/ssl/certs
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api-gateway
```

### Let's Encrypt Certificate

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d api.assetmind.ai -d app.assetmind.ai

# Auto-renew
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

---

## Security Headers

### Nginx

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

### FastAPI

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

app = FastAPI()

# Force HTTPS in production
if os.getenv("APP_ENV") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.assetmind.ai"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Security Headers Middleware
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response
```

---

## API Authentication

### JWT Token Validation

```python
import jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        if payload.get("exp") < time.time():
            raise HTTPException(status_code=401, detail="Token expired")
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/protected")
async def protected_route(user: dict = Depends(verify_token)):
    return {"user": user}
```

### API Key Authentication

```python
from fastapi import APIKeyHeader, Security

api_key_header = APIKeyHeader(name="X-API-Key")

async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key not in valid_api_keys:
        raise HTTPException(
            status_code=403,
            detail="Invalid API key"
        )
    return api_key

@app.post("/data")
async def get_data(_: str = Security(verify_api_key)):
    return {"data": "value"}
```

---

## Secrets Management

### Environment Variables

```bash
# Never commit .env files!
# Use .env.example as template

# .env.example (safe to commit)
DATABASE_URL=postgresql://user:password@localhost:5432/db
SECRET_KEY=your-secret-key-here

# .env (in .gitignore)
DATABASE_URL=postgresql://assetmind:P@ssw0rd!@prod-db:5432/assetmind
SECRET_KEY=super-secret-production-key-xyz123
```

### Docker Secrets

```yaml
# docker-compose.yml
services:
  api:
    image: assetmind/api:latest
    secrets:
      - db_password
      - api_key
    environment:
      - DATABASE_URL=postgresql://assetmind:${db_password}@db:5432/assetmind

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    file: ./secrets/api_key.txt
```

### Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: assetmind-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgresql://assetmind:password@postgres:5432/assetmind"
  SECRET_KEY: "your-secret-key"
---
# Use in deployment
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: assetmind-secrets
        key: DATABASE_URL
```

### HashiCorp Vault

```python
import hvac

client = hvac.Client(url='https://vault.assetmind.ai')

# Read secret
client.secrets.kv.v2.read_secret_version(
    path='assetmind/production',
    mount_point='secret'
)

# Or use dynamic database credentials
client.secrets.database.generate_credentials(
    name='assetmind-db-role'
)
```

---

## Security Checklist

### Development
- [ ] No hardcoded credentials
- [ ] Environment variables for all secrets
- [ ] CORS configured properly
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS prevention

### Production
- [ ] SSL/TLS enabled
- [ ] HSTS header enabled
- [ ] Rate limiting configured
- [ ] Circuit breakers in place
- [ ] API key rotation enabled
- [ ] Audit logging enabled
- [ ] Secrets management configured
- [ ] Security scanning in CI/CD

### Monitoring
- [ ] Failed authentication alerts
- [ ] Rate limit breach alerts
- [ ] Error rate monitoring
- [ ] API usage analytics

---

*Generated by Claude Code*  
*Last updated: June 12, 2026*