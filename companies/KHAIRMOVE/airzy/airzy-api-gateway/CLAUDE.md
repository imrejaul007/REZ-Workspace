# Airzy API Gateway - Claude Code Context

**Service:** airzy-api-gateway  
**Port:** 4500  
**Company:** KHAIRMOVE  
**Role:** Central entry point for all Airzy travel services

## Service Overview

This gateway is the single entry point for all Airzy microservices. It handles:
- Request routing to downstream services
- Authentication (JWT and API Key)
- Rate limiting
- Caching
- Circuit breaking
- Logging

## Architecture

```
Client → API Gateway (4500) → [Flight, Lounge, Itinerary, Wallet, AI Brain, Corp, Hotel, Transfer, DOOH]
```

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Express server setup, middleware, routes |
| `src/config/index.ts` | All configuration values |
| `src/services/proxy.ts` | HTTP proxy to downstream services |
| `src/services/circuitBreaker.ts` | Circuit breaker implementation |
| `src/services/cache.ts` | Redis + memory caching |
| `src/routes/index.ts` | Route definitions and handlers |
| `src/middleware/auth.ts` | JWT and API key authentication |

## Routes

All routes are under `/api/v1/`:
- `/api/v1/flights/*` → Flight Service (4501)
- `/api/v1/lounges/*` → Lounge Service (4502)
- `/api/v1/itineraries/*` → Itinerary Service (4503)
- `/api/v1/wallet/*` → Wallet Service (4504)
- `/api/v1/ai/*` → AI Brain Service (4505)
- `/api/v1/corporate/*` → Corp Service (4506)
- `/api/v1/hotels/*` → Hotel Service (4507)
- `/api/v1/transfers/*` → Transfer Service (4508)
- `/api/v1/dooh/*` → DOOH Service (4509)

## Dependencies

All 10 Airzy services share the same dependencies:
- express, mongoose, ioredis, zod, helmet, cors, winston, uuid, dotenv, express-rate-limit, compression

## Running

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/KHAIRMOVE/airzy/airzy-api-gateway
npm run dev  # Development
npm run build && npm start  # Production

# Health check
curl http://localhost:4500/health
```

## Testing

```bash
# Health check
curl http://localhost:4500/health

# Metrics
curl http://localhost:4500/metrics

# Route to flight service
curl -H "Authorization: Bearer <token>" http://localhost:4500/api/v1/flights/search
```

## Environment Variables

Required in `.env`:
- `MONGODB_URI` - MongoDB connection string
- `REDIS_HOST` / `REDIS_PORT` - Redis connection
- `JWT_SECRET` - JWT signing secret
- Service URLs for each downstream service

## Connected Services

| Service | Port | Purpose |
|---------|------|---------|
| airzy-flight-service | 4501 | Flight search and booking |
| airzy-lounge-service | 4502 | Airport lounge access |
| airzy-itinerary-service | 4503 | Trip planning |
| airzy-wallet-extension | 4504 | Wallet and payments |
| airzy-ai-brain | 4505 | AI travel assistant |
| airzy-corp-service | 4506 | Corporate travel |
| airzy-hotel-extension | 4507 | Hotel booking |
| airzy-transfer-extension | 4508 | Airport transfers |
| airzy-dooh-extension | 4509 | DOOH advertising |