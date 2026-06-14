# REZ Franchise Management Service

Franchise/Chain Management Module for the REZ Ecosystem. Manages multi-location restaurant operations, franchise relationships, inventory synchronization, and menu distribution across franchise networks.

## Overview

This service enables restaurant chains and franchises to manage multiple locations from a single platform. It handles inventory synchronization, menu management, and operational coordination across all franchise locations.

## Service Details

| Property | Value |
|----------|-------|
| **Service Name** | REZ Franchise Management |
| **Port** | 4025 |
| **Node Version** | >=18.0.0 |
| **Type** | REST API Service |
| **Database** | MongoDB |

## Features

- **Multi-Location Management** - Manage multiple franchise locations from single dashboard
- **Inventory Sync** - Automatic inventory synchronization across locations
- **Menu Distribution** - Centralized menu management with location-specific customizations
- **Franchise Operations** - Track franchise performance and compliance
- **Background Sync** - Automated scheduled sync with configurable intervals
- **Role-Based Access** - Franchisor and franchisee role management

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/ready` | Readiness check endpoint |
| GET | `/api/v1/franchise` | List all franchises |
| POST | `/api/v1/franchise` | Create new franchise |
| GET | `/api/v1/franchise/:id` | Get franchise by ID |
| PUT | `/api/v1/franchise/:id` | Update franchise |
| DELETE | `/api/v1/franchise/:id` | Delete franchise |
| GET | `/api/v1/franchise/:id/locations` | Get franchise locations |
| POST | `/api/v1/franchise/:id/locations` | Add franchise location |
| GET | `/api/v1/franchise/:id/inventory` | Get inventory across locations |
| POST | `/api/v1/franchise/:id/sync` | Trigger inventory sync |
| GET | `/api/v1/franchise/:id/menu` | Get menu configuration |
| PUT | `/api/v1/franchise/:id/menu` | Update menu configuration |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4025 | Service port |
| `HOST` | 0.0.0.0 | Service host |
| `NODE_ENV` | development | Environment mode |
| `MONGODB_URI` | mongodb://localhost:27017/rez_franchise | MongoDB connection string |
| `REDIS_URL` | redis://localhost:6379 | Redis URL for caching |
| `INTERNAL_SERVICE_TOKEN` | - | Internal service authentication token |
| `ORDER_SERVICE_URL` | http://localhost:4003 | Order service URL |
| `PAYMENT_SERVICE_URL` | http://localhost:4001 | Payment service URL |
| `INVENTORY_SERVICE_URL` | http://localhost:4010 | Inventory service URL |
| `AUTH_SERVICE_URL` | http://localhost:4002 | Authentication service URL |
| `RATE_LIMIT_WINDOW_MS` | 60000 | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |
| `LOG_LEVEL` | info | Logging level |
| `ENABLE_AUTO_SYNC` | true | Enable automatic background sync |
| `SYNC_INTERVAL_MS` | 300000 | Sync interval (5 minutes default) |
| `CORS_ORIGIN` | * | CORS allowed origins |

## Dependencies

### Production Dependencies
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `axios` - HTTP client
- `zod` - Schema validation
- `winston` - Logging
- `dotenv` - Environment variables
- `cors` - CORS middleware
- `helmet` - Security headers
- `compression` - Response compression
- `express-rate-limit` - Rate limiting
- `uuid` - Unique ID generation

### Development Dependencies
- `typescript` - TypeScript compiler
- `ts-node-dev` - Development server with hot reload
- `jest` - Testing framework

## Setup Instructions

### Prerequisites

- Node.js >=18.0.0
- MongoDB 6.0+
- Redis 7.0+ (optional, for caching)

### Installation

```bash
# Navigate to service directory
cd REZ-franchise-management

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration

# Start development server
npm run dev

# Or build and run production
npm run build
npm start
```

### Docker

```bash
# Build image
docker build -t rez-franchise-management .

# Run container
docker run -p 4025:4025 --env-file .env rez-franchise-management
```

## Project Structure

```
REZ-franchise-management/
├── src/
│   ├── config/          # Configuration files
│   │   ├── env.ts       # Environment loader
│   │   └── logger.ts    # Winston logger config
│   ├── middleware/      # Express middleware
│   │   └── common.ts    # Common middleware (error handler, etc.)
│   ├── routes/          # API routes
│   │   └── franchise.ts # Franchise routes
│   ├── services/        # Business logic
│   │   ├── inventorySync.ts
│   │   └── menuSync.ts
│   ├── models/          # MongoDB models
│   └── types/           # TypeScript types
├── .env.example         # Environment template
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Background Services

The service includes background sync services that can be enabled:

- **InventorySyncService** - Synchronizes inventory data across franchise locations
- **MenuSyncService** - Distributes menu updates to all locations

Enable auto-sync by setting `ENABLE_AUTO_SYNC=true` and configure `SYNC_INTERVAL_MS`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm test` | Run tests with coverage |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type check without emitting |

## Health Check

```bash
# Health check
curl http://localhost:4025/health

# Readiness check
curl http://localhost:4025/ready
```

## License

MIT - REZ Platform