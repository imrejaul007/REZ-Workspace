# Airzy API Gateway - Source of Truth

**Service:** airzy-api-gateway
**Port:** 4500
**Status:** PRODUCTION
**Last Updated:** June 6, 2026

## Service Definition

| Property | Value |
|----------|-------|
| Name | airzy-api-gateway |
| Port | 4500 |
| Company | KHAIRMOVE |
| Purpose | Unified entry point for all Airzy travel services |
| Type | API Gateway / Reverse Proxy |
| Tech Stack | Express, TypeScript, MongoDB, Redis |

## Technical Specifications

### Infrastructure

| Component | Specification |
|-----------|---------------|
| Runtime | Node.js 18+ |
| Framework | Express 4.x |
| Language | TypeScript 5.x |
| Database | MongoDB (for audit logs) |
| Cache | Redis + In-memory fallback |
| Port | 4500 |

### Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.3",
  "ioredis": "^5.3.2",
  "zod": "^3.22.4",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "winston": "^3.11.0",
  "uuid": "^9.0.1",
  "dotenv": "^16.3.1",
  "express-rate-limit": "^7.1.5",
  "compression": "^1.7.4",
  "axios": "^1.6.2",
  "jsonwebtoken": "^9.0.2"
}
```

## API Endpoints

### Gateway Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Service info |
| GET | `/health` | No | Health check with all service statuses |
| GET | `/api/docs` | No | API documentation |
| GET | `/routes` | No | List of configured routes |
| GET | `/metrics` | No | Request counts and stats |
| GET | `/circuit-breaker` | No | Circuit breaker status |
| GET | `/cache/stats` | No | Cache statistics |
| POST | `/cache/clear` | Yes | Clear cache |
| POST | `/circuit-breaker/:service/:action` | Yes | Control circuit breaker |

### Service Routes

| Prefix | Service | Port | Methods |
|--------|---------|------|---------|
| `/api/v1/flights/*` | flight | 4501 | GET, POST, PUT, DELETE |
| `/api/v1/lounges/*` | lounge | 4502 | GET, POST, PUT, DELETE |
| `/api/v1/itineraries/*` | itinerary | 4503 | GET, POST, PUT, DELETE |
| `/api/v1/wallet/*` | wallet | 4504 | GET, POST |
| `/api/v1/ai/*` | aiBrain | 4505 | POST |
| `/api/v1/corporate/*` | corp | 4506 | GET, POST, PUT |
| `/api/v1/hotels/*` | hotel | 4507 | GET, POST, PUT, DELETE |
| `/api/v1/transfers/*` | transfer | 4508 | GET, POST, PUT, DELETE |
| `/api/v1/dooh/*` | dooh | 4509 | GET, POST, PUT, DELETE |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4500 | Server port |
| `NODE_ENV` | development | Environment |
| `MONGODB_URI` | mongodb://localhost:27017/airzy-gateway | MongoDB URI |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `REDIS_PASSWORD` | - | Redis password |
| `JWT_SECRET` | airzy-gateway-secret-key | JWT signing secret |
| `RATE_LIMIT_WINDOW_MS` | 60000 | Rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |
| `CACHE_ENABLED` | true | Enable caching |
| `CACHE_DEFAULT_TTL` | 300 | Cache TTL in seconds |

### Service URLs

| Service | Environment Variable | Default |
|---------|---------------------|---------|
| Flight | `FLIGHT_SERVICE_URL` | http://localhost:4501 |
| Lounge | `LOUNGE_SERVICE_URL` | http://localhost:4502 |
| Itinerary | `ITINERARY_SERVICE_URL` | http://localhost:4503 |
| Wallet | `WALLET_SERVICE_URL` | http://localhost:4504 |
| AI Brain | `AI_BRAIN_SERVICE_URL` | http://localhost:4505 |
| Corp | `CORP_SERVICE_URL` | http://localhost:4506 |
| Hotel | `HOTEL_SERVICE_URL` | http://localhost:4507 |
| Transfer | `TRANSFER_SERVICE_URL` | http://localhost:4508 |
| DOOH | `DOOH_SERVICE_URL` | http://localhost:4509 |

## Features

### Authentication
- JWT token validation with issuer verification
- API Key authentication (format: `keyId:tenantId:permissions`)
- Optional authentication for public endpoints
- Role-based authorization
- Tenant isolation

### Rate Limiting
- Per-IP rate limiting (configurable)
- Standard headers for client visibility
- Customizable window and max requests

### Circuit Breaker
- Automatic failure detection
- Three states: closed, open, half-open
- Configurable failure threshold
- Manual override controls
- Per-service monitoring

### Caching
- Redis-backed with in-memory fallback
- TTL-based expiration
- Pattern-based clearing
- Cache hit/miss statistics

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking with stack traces
- Service context tracking

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "uuid",
    "timestamp": 1234567890,
    "cached": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": 1234567890
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Route not found |
| `UNAUTHORIZED` | 401 | Missing or invalid auth |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `BAD_REQUEST` | 400 | Invalid request |
| `VALIDATION_ERROR` | 400 | Schema validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `CIRCUIT_BREAKER_OPEN` | 503 | Service unavailable |
| `SERVICE_UNAVAILABLE` | 503 | Downstream service error |
| `INTERNAL_ERROR` | 500 | Server error |

## Running the Service

```bash
# Development
npm run dev

# Production
npm run build
npm start

# Health check
curl http://localhost:4500/health

# Metrics
curl http://localhost:4500/metrics
```

## Integration

### Connected Services

The gateway proxies requests to 9 downstream services:

1. **airzy-flight-service** (4501) - Flight search and booking
2. **airzy-lounge-service** (4502) - Airport lounge access
3. **airzy-itinerary-service** (4503) - Trip planning
4. **airzy-wallet-extension** (4504) - Wallet and payments
5. **airzy-ai-brain** (4505) - AI travel assistant
6. **airzy-corp-service** (4506) - Corporate travel
7. **airzy-hotel-extension** (4507) - Hotel booking
8. **airzy-transfer-extension** (4508) - Airport transfers
9. **airzy-dooh-extension** (4509) - DOOH advertising

### Authentication Flow

```
Client → Gateway → [JWT/API Key Validation] → Service
 ↓
        [Rate Limit Check]
           ↓
        [Cache Check (GET)]
           ↓
        [Proxy to Service]
           ↓
        [Record Metrics]
```

## Monitoring

### Health Check Response
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": 1234567890,
  "version": "1.0.0",
  "services": {
    "flight": { "healthy": true, "latency": 45 },
    "lounge": { "healthy": true, "latency": 32 },
    ...
  }
}
```

### Metrics Response
```json
{
  "requests": { "flight": 100, "lounge": 50, ... },
  "circuitBreaker": {
    "totalServices": 9,
    "openCircuits": 0,
    "halfOpenCircuits": 0,
    "closedCircuits": 9
  },
  "cache": {
    "memorySize": 150,
    "redisConnected": true,
    "enabled": true
  }
}
```

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | June 6, 2026 | Initial release |

## License

Proprietary - KHAIRMOVE