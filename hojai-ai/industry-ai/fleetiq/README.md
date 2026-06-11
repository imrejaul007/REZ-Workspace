# FLEETIQ - Fleet AI Operating System

> "AI-Driven Fleet Intelligence for Modern Logistics"

**Port:** 4814
**Status:** Production Ready (June 6, 2026)

FLEETIQ is a production-ready fleet management AI operating system built with TypeScript, Express, and MongoDB. It provides intelligent dispatch, route optimization, fleet analytics, and driver coaching through specialized AI agents.

## Features

### AI Employees

1. **Dispatch Agent** - Optimal route planning and vehicle allocation
2. **Route Optimizer** - Navigation, ETA calculation, and route optimization (Nearest Neighbor + 2-Opt)
3. **Fleet Manager** - Vehicle tracking, analytics, and maintenance alerts
4. **Driver Coach** - Driver performance monitoring and coaching

### Production Features

- MongoDB with Mongoose ODM
- JWT Authentication with role-based access
- Rate limiting (express-rate-limit)
- Helmet security headers
- Winston structured logging
- Health checks (liveness, readiness, detailed)
- Zod validation for all inputs
- Graceful shutdown handling
- Comprehensive error handling
- Webhook triggers for events
- HOJAI ecosystem sync

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Health Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |
| GET | `/health` | Detailed health check |

### AI Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/status` | AI employees status |
| POST | `/api/ai/dispatch/optimize` | Optimize dispatch allocation |
| POST | `/api/ai/route/calculate` | Calculate optimal route |
| POST | `/api/ai/fleet/analyze` | Analyze fleet performance |
| POST | `/api/ai/driver/coach` | Coach driver based on situation |

### Vehicles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicles` | List all vehicles |
| POST | `/api/vehicles` | Create vehicle |
| GET | `/api/vehicles/:id` | Get vehicle details |
| PATCH | `/api/vehicles/:id/location` | Update location |
| PATCH | `/api/vehicles/:id/status` | Update status |
| DELETE | `/api/vehicles/:id` | Delete vehicle |

### Drivers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drivers` | List all drivers |
| POST | `/api/drivers` | Create driver |
| GET | `/api/drivers/:id` | Get driver details |
| PATCH | `/api/drivers/:id/rating` | Update rating |
| DELETE | `/api/drivers/:id` | Delete driver |

### Trips

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips` | List all trips |
| POST | `/api/trips` | Create trip |
| GET | `/api/trips/:id` | Get trip details |
| PATCH | `/api/trips/:id/status` | Update trip status |

### Maintenance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/maintenance` | List maintenance records |
| POST | `/api/maintenance` | Create maintenance record |
| PATCH | `/api/maintenance/:id/status` | Update maintenance status |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard summary |
| GET | `/api/analytics/vehicles` | Vehicle analytics |
| GET | `/api/analytics/drivers` | Driver analytics |
| GET | `/api/analytics/trips` | Trip analytics |
| GET | `/api/analytics/performance` | Overall performance |

## Authentication

All API endpoints (except health checks) require JWT authentication.

Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

For internal services, use the internal token header:
```
X-Internal-Token: <your-internal-service-token>
```

## Environment Variables

See `.env.example` for all configuration options:

- `PORT` - Server port (default: 4814)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `INTERNAL_SERVICE_TOKEN` - Internal service authentication

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
fleetiq/
├── src/
│   ├── index.ts           # Entry point
│   ├── app.ts             # Express app setup
│   ├── config.ts          # Configuration
│   ├── models/            # Mongoose models
│   │   └── index.ts       # Vehicle, Driver, Trip, Maintenance
│   ├── routes/            # API routes
│   │   └── api/
│   │       ├── index.ts
│   │       ├── ai.ts
│   │       ├── vehicles.ts
│   │       ├── drivers.ts
│   │       ├── trips.ts
│   │       ├── maintenance.ts
│   │       └── analytics.ts
│   ├── services/          # Business logic
│   │   ├── dispatchService.ts
│   │   ├── routeService.ts
│   │   ├── fleetService.ts
│   │   └── driverService.ts
│   ├── middleware/        # Express middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   └── utils/             # Utilities
│       ├── config.ts
│       ├── logger.ts
│       ├── database.ts
│       └── webhook.ts
├── tests/                 # Test files
├── .env.example
├── package.json
├── tsconfig.json
├── API.md                 # API Documentation
├── CLAUDE.md              # Developer Guide
└── SOT.md                 # State of Technology
```

## Pricing

- **₹4,999/month** (HOJAI AI - Non-REZ clients)
- Included in REZ-Merchant OS (REZ ecosystem clients)

## Support

For technical support, contact: support@hojai.ai

## License

Proprietary - HOJAI AI

## Documentation

| Document | Purpose |
|----------|---------|
| README.md | Product overview |
| API.md | Complete API documentation |
| CLAUDE.md | Developer guide |
| SOT.md | Technical specification |
