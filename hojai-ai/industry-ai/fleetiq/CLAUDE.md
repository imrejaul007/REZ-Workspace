# FLEETIQ - Developer Guide

## Project Context

FLEETIQ is part of the HOJAI AI Industry AI ecosystem. It's an AI-powered fleet management operating system.

**Parent:** HOJAI AI (`/hojai-ai/`)
**Category:** Industry AI
**Industry:** Logistics & Fleet Management
**Port:** 4814

## Key Files

| File | Purpose |
|------|---------|
| `SOT.md` | Complete technical specification |
| `API.md` | API documentation |
| `README.md` | Product overview |
| `src/index.ts` | Main Express server (COMPLETE) |

## Architecture

```
FLEETIQ
├── src/
│   ├── index.ts          # Main entry point
│   ├── app.ts            # Express app setup
│   ├── config.ts         # Configuration
│   ├── models/           # Mongoose models (Vehicle, Driver, Trip, Maintenance)
│   ├── routes/           # API routes
│   │   └── api/
│   │       ├── ai.ts           # AI agent endpoints
│   │       ├── vehicles.ts     # Vehicle CRUD
│   │       ├── drivers.ts      # Driver CRUD
│   │       ├── trips.ts        # Trip CRUD
│   │       ├── maintenance.ts   # Maintenance CRUD
│   │       └── analytics.ts    # Analytics endpoints
│   ├── services/         # Business logic
│   │   ├── dispatchService.ts  # Dispatch optimization
│   │   ├── routeService.ts     # Route calculation
│   │   ├── fleetService.ts     # Fleet analytics
│   │   └── driverService.ts    # Driver coaching
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts              # JWT authentication
│   │   ├── errorHandler.ts     # Error handling
│   │   ├── rateLimiter.ts      # Rate limiting
│   │   └── validation.ts       # Zod validation
│   └── utils/
│       ├── config.ts     # Configuration management
│       ├── logger.ts     # Winston logger
│       ├── database.ts   # MongoDB connection
│       └── webhook.ts    # Webhook helpers
├── tests/                # Test files
└── docker-compose.yml    # Docker setup
```

## AI Employees

1. **Dispatch Agent** (POST /api/ai/dispatch/optimize) - Order allocation, routing
2. **Route Optimizer** (POST /api/ai/route/calculate) - Route planning, optimization
3. **Fleet Manager** (POST /api/ai/fleet/analyze) - Fleet operations, maintenance
4. **Driver Coach** (POST /api/ai/driver/coach) - Driver support, navigation

## Commands

```bash
npm install
npm run dev     # Development mode
npm run build   # Build for production
npm start       # Start production server
npm test        # Run tests
```

## Environment Variables

```bash
PORT=4814
MONGODB_URI=mongodb://localhost:27017/fleetiq
JWT_SECRET=fleetiq-dev-secret-change-in-production
INTERNAL_SERVICE_TOKEN=fleetiq-internal-dev-token
```

## API Base URL

```
http://localhost:4814
```

## Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| GET /health/live | Liveness probe |
| GET /health/ready | Readiness probe |
| GET /health | Detailed health check |
| GET /api/ai/status | AI employee status |

## HOJAI Integration

All Industry AI products connect to:
- **HOJAI Core** (port 4100) - Intent Graph, Memory, Trust
- **Merchant OS** - Backend services

## Development Notes

- Use TypeScript for all new files
- Follow Express.js patterns from HOJAI Core
- Integrate with HOJAI Core for AI capabilities
- Add proper error handling and validation
- Include health check endpoints
- Use Mongoose for MongoDB operations

## Status (COMPLETE - June 6, 2026)

- [x] SOT.md created
- [x] API.md created
- [x] src/index.ts - Main server (COMPLETE)
- [x] src/config.ts - Configuration (COMPLETE)
- [x] src/app.ts - Express app (COMPLETE)
- [x] src/models - Vehicle, Driver, Trip, Maintenance (COMPLETE)
- [x] src/routes - All API routes (COMPLETE)
- [x] src/services - Dispatch, Route, Fleet, Driver services (COMPLETE)
- [x] src/middleware - Auth, validation, error handling (COMPLETE)
- [x] src/utils - Logger, database, config (COMPLETE)
- [x] CLAUDE.md (this file)
