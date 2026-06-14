# Airzy API Gateway - API Reference

**Base URL:** `http://localhost:4500`  
**Version:** 1.0.0  
**Company:** KHAIRMOVE

## Overview

The Airzy API Gateway provides a unified entry point for all Airzy travel services. All requests should be made to the gateway, which will proxy them to the appropriate service.

## Authentication

### JWT Token

Include the JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### API Key

Include the API key in the `X-API-Key` header:

```
X-API-Key: keyId:tenantId:permissions
```

## Endpoints

### Gateway Endpoints

#### GET /

Get service information.

**Response:**
```json
{
  "service": "Airzy API Gateway",
  "version": "1.0.0",
  "status": "running",
  "timestamp": 1234567890,
  "endpoints": {
    "health": "/health",
    "routes": "/routes",
    "metrics": "/metrics",
    "circuitBreaker": "/circuit-breaker",
    "cache": "/cache/stats"
  }
}
```

#### GET /health

Health check with all downstream service statuses.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1234567890,
  "version": "1.0.0",
  "services": {
    "flight": { "healthy": true, "latency": 45 },
    "lounge": { "healthy": true, "latency": 32 },
    "itinerary": { "healthy": true, "latency": 28 },
    "wallet": { "healthy": true, "latency": 15 },
    "aiBrain": { "healthy": true, "latency": 120 },
    "corp": { "healthy": true, "latency": 22 },
    "hotel": { "healthy": true, "latency": 55 },
    "transfer": { "healthy": true, "latency": 38 },
    "dooh": { "healthy": true, "latency": 42 }
  }
}
```

#### GET /metrics

Get request counts, circuit breaker stats, and cache stats.

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": {
      "flight": 150,
      "lounge": 75,
      "itinerary": 120
    },
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
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": 1234567890
  }
}
```

#### GET /routes

List all configured routes.

**Response:**
```json
{
  "success": true,
  "data": {
    "routes": [
      { "path": "/api/v1/flights/*", "service": "flight", "method": "any" },
      { "path": "/api/v1/lounges/*", "service": "lounge", "method": "any" }
    ],
    "total": 20
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": 1234567890
  }
}
```

#### GET /circuit-breaker

Get circuit breaker status for all services.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalServices": 9,
      "openCircuits": 0,
      "halfOpenCircuits": 0,
      "closedCircuits": 9
    },
    "states": {
      "flight": {
        "failures": 0,
        "lastFailure": 0,
        "state": "closed",
        "nextRetry": 0
      }
    }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": 1234567890
  }
}
```

#### GET /cache/stats

Get cache statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "memorySize": 150,
    "redisConnected": true,
    "enabled": true
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": 1234567890
  }
}
```

#### POST /cache/clear

Clear cache entries.

**Request Body:**
```json
{
  "pattern": "flight:*"  // Optional, clears matching entries
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared for pattern: flight:*",
  "meta": {
    "requestId": "uuid",
    "timestamp": 1234567890
  }
}
```

#### POST /circuit-breaker/:service/:action

Control circuit breaker state.

**Parameters:**
- `service` - Service name (flight, lounge, itinerary, wallet, aiBrain, corp, hotel, transfer, dooh)
- `action` - Action (open, close, reset)

**Response:**
```json
{
  "success": true,
  "message": "Circuit breaker for flight opened",
  "meta": {
    "requestId": "uuid",
    "timestamp": 1234567890
  }
}
```

### Service Routes

All service routes are under `/api/v1/`. The gateway will proxy requests to the appropriate service.

#### Flight Service Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/flights/search` | Search flights |
| GET | `/api/v1/flights/:id` | Get flight details |
| POST | `/api/v1/flights/book` | Book a flight |
| GET | `/api/v1/bookings` | List bookings |
| GET | `/api/v1/bookings/:id` | Get booking details |
| DELETE | `/api/v1/bookings/:id` | Cancel booking |

#### Lounge Service Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/lounges` | List airport lounges |
| GET | `/api/v1/lounges/:id` | Get lounge details |
| POST | `/api/v1/lounges/book` | Book lounge access |
| GET | `/api/v1/lounge/bookings` | List lounge bookings |

#### Itinerary Service Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/itineraries` | List itineraries |
| POST | `/api/v1/itineraries` | Create itinerary |
| GET | `/api/v1/itineraries/:id` | Get itinerary |
| PUT | `/api/v1/itineraries/:id` | Update itinerary |
| DELETE | `/api/v1/itineraries/:id` | Delete itinerary |
| POST | `/api/v1/itineraries/:id/share` | Share itinerary |

#### Wallet Service Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/wallet/balance` | Get wallet balance |
| GET | `/api/v1/wallet/transactions` | List transactions |
| POST | `/api/v1/wallet/topup` | Top up wallet |
| POST | `/api/v1/wallet/pay` | Make payment |

#### AI Brain Service Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/ai/chat` | Chat with AI assistant |
| POST | `/api/v1/ai/recommend` | Get recommendations |
| POST | `/api/v1/ai/assist` | Get booking assistance |

#### Corporate Service Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/corporate/policies` | List travel policies |
| GET | `/api/v1/corporate/approvals` | List approvals |
| POST | `/api/v1/corporate/approvals` | Submit for approval |
| GET | `/api/v1/corporate/expenses` | List expenses |
| POST | `/api/v1/corporate/expenses` | Submit expense |

#### Hotel Service Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/hotels/search` | Search hotels |
| GET | `/api/v1/hotels/:id` | Get hotel details |
| POST | `/api/v1/hotels/book` | Book hotel |
| GET | `/api/v1/rooms/:id` | Get room details |
| POST | `/api/v1/rooms/:id/room-service` | Order room service |

#### Transfer Service Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/transfers/search` | Search transfers |
| POST | `/api/v1/transfers/book` | Book transfer |
| GET | `/api/v1/transfers/:id` | Get transfer details |
| POST | `/api/v1/transfers/:id/cancel` | Cancel transfer |

#### DOOH Service Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/dooh/screens` | List screens |
| GET | `/api/v1/dooh/screens/:id` | Get screen details |
| GET | `/api/v1/dooh/campaigns` | List campaigns |
| POST | `/api/v1/dooh/campaigns` | Create campaign |
| GET | `/api/v1/dooh/campaigns/:id` | Get campaign details |
| GET | `/api/v1/dooh/analytics` | Get analytics |

## Error Responses

All errors follow this format:

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

### Error Codes

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

## Rate Limits

| Tier | Requests per Minute |
|------|---------------------|
| Standard | 100 |
| Premium | 500 |
| Enterprise | 2000 |

Rate limit headers are included in all responses:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Time when the limit resets

## Caching

GET requests are cached by default with a TTL of 300 seconds (5 minutes). Cache can be controlled via the cache management endpoints.

## Examples

### Search Flights

```bash
curl -X GET "http://localhost:4500/api/v1/flights/search?from=DEL&to=BOM&date=2026-06-15" \
  -H "Authorization: Bearer <token>"
```

### Book Lounge

```bash
curl -X POST "http://localhost:4500/api/v1/lounges/book" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "loungeId": "lounge-123",
    "date": "2026-06-15",
    "guests": 2
  }'
```

### Chat with AI

```bash
curl -X POST "http://localhost:4500/api/v1/ai/chat" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need to fly from Delhi to Mumbai next week",
    "context": {}
  }'
```

## SDK Usage

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:4500',
  headers: {
    'Authorization': 'Bearer<token>'
  }
});

// Search flights
const flights = await client.get('/api/v1/flights/search', {
  params: { from: 'DEL', to: 'BOM', date: '2026-06-15' }
});

// Book lounge
const booking = await client.post('/api/v1/lounges/book', {
  loungeId: 'lounge-123',
  date: '2026-06-15',
  guests: 2
});
```

## Support

For issues or questions, contact the KHAIRMOVE engineering team.