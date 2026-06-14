# REZ API Gateway

Central API gateway service for routing, authentication, rate limiting, and request proxying across the ReZ ecosystem.

## Features

- **Request Routing**: Intelligent routing to microservices
- **Authentication**: JWT and API key validation
- **Rate Limiting**: Per-user and per-IP rate limiting
- **Load Balancing**: Round-robin and weighted routing
- **Circuit Breaker**: Automatic failover on service failures
- **Request/Response Transformation**: Header manipulation and body parsing
- **CORS**: Configurable cross-origin resource sharing
- **Logging**: Request/response logging with correlation IDs

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       API Gateway                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Router   │  │  Auth    │  │  Rate    │  │ Circuit  │      │
│  │          │  │  Filter  │  │  Limiter │  │ Breaker  │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │              │             │              │              │
│  ┌────▼────────────────────────────────────────────────────┐   │
│  │                    Service Proxy                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│   Auth     │  │   Order   │  │  Payment  │  │  Wallet   │
│  Service   │  │  Service  │  │  Service  │  │  Service  │
└────────────┘  └────────────┘  └────────────┘  └────────────┘
```

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Gateway port | 3000 |
| `NODE_ENV` | Environment | development |
| `LOG_LEVEL` | Logging level | info |
| `CORS_ORIGIN` | Allowed origins | * |

## API Endpoints

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/health/ready` | Readiness probe |

### Routes

Configure routes in `src/routes.config.ts`:

```typescript
{
  path: '/api/orders',
  target: 'http://rez-order-service:3005',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  auth: true,
  rateLimit: { window: '1m', max: 100 }
}
```

## Rate Limiting

Default limits per authenticated user:
- 100 requests per minute
- 1000 requests per hour
- 10000 requests per day

## Circuit Breaker

Automatic failover for service failures:
- 5 consecutive failures: Open circuit
- 30 second recovery timeout
- 2 successes to close circuit

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm test         # Run tests
```

## License

MIT
