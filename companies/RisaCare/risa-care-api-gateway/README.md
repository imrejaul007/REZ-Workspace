# RisaCare API Gateway

**Central API Gateway for RisaCare Healthcare OS**

The unified entry point for all RisaCare services, providing routing, authentication, rate limiting, and request orchestration.

## Overview

RisaCare API Gateway serves as the single entry point for:
- Centralized authentication and authorization
- Service routing and load balancing
- Rate limiting and throttling
- Request/response transformation
- Logging and monitoring
- API versioning

## Features

### Authentication
- JWT token validation
- OAuth2 integration
- API key management
- Session management

### Routing
- Path-based routing
- Service discovery integration
- Health check routing
- Circuit breaker support

### Rate Limiting
- Per-user rate limits
- Per-service limits
- Burst handling
- Quota management

### Monitoring
- Request logging
- Performance metrics
- Error tracking
- Latency monitoring

## Quick Start

```bash
cd risa-care-api-gateway
npm install
npm run dev
```

Service runs on **port 4700**.

## Architecture

```
RisaCare API Gateway
       │
       ├──► RisaCare Profile Service (4701)
       ├──► RisaCare Records Service (4702)
       ├──► RisaCare Wellness Service (4703)
       ├──► RisaCare Visit Service (4704)
       ├──► RisaCare Consent Service (4705)
       ├──► RisaCare Care Circle Service (4706)
       ├──► RisaCare Medication Service (4707)
       └──► RisaCare Analytics Service (4708)
```

## API Endpoints

### Gateway Health
```
GET /health                          - Gateway health check
GET /health/:serviceName           - Service-specific health
```

### Authentication
```
POST /auth/validate                - Validate JWT token
POST /auth/refresh                  - Refresh access token
POST /auth/logout                   - Invalidate session
```

### Routing
```
ALL /*                               - Route to appropriate service
```

## Request Headers

| Header | Description |
|--------|-------------|
| Authorization | Bearer {token} |
| X-API-Key | API key for service-to-service |
| X-Request-ID | Request tracing ID |
| X-User-ID | Authenticated user ID |
| X-Tenant-ID | Multi-tenant identifier |

## Rate Limits

| Tier | Requests/min | Burst |
|------|--------------|-------|
| Free | 60 | 10 |
| Premium | 300 | 50 |
| Enterprise | Unlimited | 100 |

## Integration

Integrates with:
- RABTUL Auth (4002) for authentication
- RABTUL Notifications (4011) for alerts
- HOJAI Governance (4501) for audit logging

## Port Configuration

| Service | Port |
|---------|------|
| API Gateway | 4700 |

## License

Proprietary - RTNM Group
