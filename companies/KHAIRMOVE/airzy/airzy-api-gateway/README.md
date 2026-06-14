# Airzy API Gateway

**Port:** 4500  
**Company:** KHAIRMOVE  
**Purpose:** Unified entry point for all Airzy travel services

## Overview

The Airzy API Gateway serves as the central router and security layer for all Airzy microservices. It handles request routing, authentication, rate limiting, caching, and circuit breaking.

## Architecture

```
                    ┌─────────────────┐
                    │   Airzy API     │
                    │    Gateway      │
                    │    (Port 4500)  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌────────────┐       ┌────────────┐       ┌────────────┐
│   Flight   │       │   Lounge   │       │ Itinerary  │
│  Service   │       │  Service   │       │  Service   │
│ (Port 4501)│       │ (Port 4502)│       │ (Port 4503)│
└────────────┘       └────────────┘       └────────────┘
         │                   │                   │
         ▼                   ▼                   ▼
┌────────────┐       ┌────────────┐       ┌────────────┐
│   Wallet   │       │  AI Brain  │       │   Corp     │
│ Extension  │       │ (Port 4505)│       │  Service   │
│ (Port 4504)│       │            │       │ (Port 4506)│
└────────────┘       └────────────┘       └────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌────────────┐       ┌────────────┐       ┌────────────┐
│   Hotel    │       │  Transfer  │       │    DOOH    │
│ Extension  │       │ Extension  │       │ Extension  │
│ (Port 4507)│       │ (Port 4508)│       │ (Port 4509)│
└────────────┘       └────────────┘       └────────────┘
```

## Features

### Request Routing
- Dynamic path-based routing to downstream services
- Automatic header forwarding (user ID, tenant ID)
- Response caching for GET requests

### Authentication
- JWT token validation
- API Key authentication
- Optional authentication for public endpoints

### Rate Limiting
- Per-IP rate limiting
- Per-tenant rate limiting
- Configurable windows and limits

### Circuit Breaker
- Automatic failure detection
- Circuit open/close states
- Manual override controls

### Caching
- Redis-backed caching
- In-memory fallback
- TTL-based expiration

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Gateway health check with all service statuses |
| GET | `/metrics` | Request counts, circuit breaker stats, cache stats |
| GET | `/routes` | List of all configured routes |
| GET | `/circuit-breaker` | Circuit breaker status for all services |
| GET | `/cache/stats` | Cache hit/miss statistics |

### Cache Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/cache/clear` | Clear all cache or by pattern |

### Circuit Breaker Control

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/circuit-breaker/:service/open` | Force open circuit |
| POST | `/circuit-breaker/:service/close` | Force close circuit |
| POST | `/circuit-breaker/:service/reset` | Reset circuit to initial state |

### Service Routes

| Prefix | Service | Description |
|--------|---------|-------------|
| `/api/v1/flights/*` | flight | Flight search and booking |
| `/api/v1/lounges/*` | lounge | Airport lounge access |
| `/api/v1/itineraries/*` | itinerary | Trip planning and itinerary |
| `/api/v1/wallet/*` | wallet | Wallet and payments |
| `/api/v1/ai/*` | aiBrain | AI travel assistant |
| `/api/v1/corporate/*` | corp | Corporate travel management |
| `/api/v1/hotels/*` | hotel | Hotel booking |
| `/api/v1/transfers/*` | transfer | Airport transfers |
| `/api/v1/dooh/*` | dooh | DOOH advertising |

## Configuration

### Environment Variables

```env
# Server
PORT=4500
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/airzy-gateway

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-secret-key

# Service URLs
FLIGHT_SERVICE_URL=http://localhost:4501
LOUNGE_SERVICE_URL=http://localhost:4502
ITINERARY_SERVICE_URL=http://localhost:4503
WALLET_SERVICE_URL=http://localhost:4504
AI_BRAIN_SERVICE_URL=http://localhost:4505
CORP_SERVICE_URL=http://localhost:4506
HOTEL_SERVICE_URL=http://localhost:4507
TRANSFER_SERVICE_URL=http://localhost:4508
DOOH_SERVICE_URL=http://localhost:4509

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Caching
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300
```

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

## Response Format

All responses follow this format:

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

Error responses:

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

## Dependencies

- express: Web framework
- mongoose: MongoDB ODM
- ioredis: Redis client
- zod: Schema validation
- helmet: Security headers
- cors: Cross-origin resource sharing
- winston: Logging
- express-rate-limit: Rate limiting
- axios: HTTP client for proxying
- jsonwebtoken: JWT authentication

## License

Proprietary - KHAIRMOVE