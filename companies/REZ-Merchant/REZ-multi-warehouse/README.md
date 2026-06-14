# REZ Multi-Warehouse Service

Multi-Warehouse Inventory Service for the REZ ecosystem. Manages warehouse operations, inventory tracking, inter-warehouse transfers, fulfillment optimization, and low-stock alerts across multiple warehouse locations.

## Overview

This service provides comprehensive warehouse management capabilities for the REZ platform, enabling businesses to manage inventory across multiple warehouse locations with support for transfers, allocation, fulfillment optimization, and analytics.

## Service Details

| Property | Value |
|----------|-------|
| **Service Name** | REZ Multi-Warehouse |
| **Port** | 4024 |
| **Node Version** | >=18.0.0 |
| **Type** | REST API Service |
| **Database** | MongoDB |

## Features

- **Warehouse Management** - Create and manage multiple warehouse locations
- **Inventory Tracking** - Real-time inventory tracking with bin locations
- **Inter-Warehouse Transfers** - Manage stock transfers between warehouses
- **Fulfillment Optimization** - Intelligent order fulfillment based on location
- **Allocation Strategies** - Multiple allocation strategies (nearest, cheapest, fastest)
- **Low Stock Alerts** - Configurable alerts for low inventory levels
- **Transfer Tracking** - Full tracking of transfer status and history
- **Warehouse Analytics** - Performance metrics and utilization reports

## Warehouse Types

- **Primary** - Main distribution center
- **Secondary** - Secondary storage location
- **Distribution** - Regional distribution hub
- **Retail** - Retail storefront storage
- **Fulfillment** - E-commerce fulfillment center
- **Returns** - Returns processing center

## API Endpoints

### Health & Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/ready` | Readiness check endpoint |

### Warehouses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/warehouses` | List all warehouses |
| POST | `/api/v1/warehouses` | Create new warehouse |
| GET | `/api/v1/warehouses/:id` | Get warehouse by ID |
| PUT | `/api/v1/warehouses/:id` | Update warehouse |
| DELETE | `/api/v1/warehouses/:id` | Delete warehouse |
| GET | `/api/v1/warehouses/:id/inventory` | Get warehouse inventory |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/inventory` | List all inventory items |
| POST | `/api/v1/inventory` | Add inventory item |
| GET | `/api/v1/inventory/:productId` | Get inventory for product |
| PUT | `/api/v1/inventory/:productId` | Update inventory |
| POST | `/api/v1/inventory/:productId/adjust` | Adjust inventory quantity |
| GET | `/api/v1/inventory/low-stock` | Get low stock items |

### Transfers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/transfers` | List all transfers |
| POST | `/api/v1/transfers` | Create new transfer |
| GET | `/api/v1/transfers/:id` | Get transfer by ID |
| PUT | `/api/v1/transfers/:id` | Update transfer |
| POST | `/api/v1/transfers/:id/approve` | Approve transfer |
| POST | `/api/v1/transfers/:id/ship` | Mark transfer as shipped |
| POST | `/api/v1/transfers/:id/receive` | Receive transfer items |
| POST | `/api/v1/transfers/:id/cancel` | Cancel transfer |

### Fulfillment
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/fulfillment/allocate` | Allocate inventory to order |
| POST | `/api/v1/fulfillment/optimize` | Optimize fulfillment across warehouses |
| GET | `/api/v1/fulfillment/routes` | Get fulfillment routes |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/warehouse/:id` | Get warehouse analytics |
| GET | `/api/v1/analytics/inventory` | Get inventory analytics |
| GET | `/api/v1/analytics/transfers` | Get transfer analytics |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4024 | Service port |
| `NODE_ENV` | development | Environment mode |
| `MONGODB_URI` | mongodb://localhost:27017/rez_multi_warehouse | MongoDB connection string |
| `REDIS_URL` | redis://localhost:6379 | Redis URL for caching |
| `INTERNAL_SERVICE_TOKEN` | - | Internal service authentication token |
| `LOG_LEVEL` | info | Logging level |
| `LOW_STOCK_THRESHOLD_DEFAULT` | 10 | Default low stock threshold |
| `LOW_STOCK_THRESHOLD_PER_WAREHOUSE` | false | Use per-warehouse thresholds |
| `GOOGLE_MAPS_API_KEY` | - | Google Maps API for fulfillment optimization |
| `LOW_STOCK_WEBHOOK_URL` | - | Webhook URL for low stock alerts |
| `RATE_LIMIT_WINDOW_MS` | 60000 | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |

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
cd REZ-multi-warehouse

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
docker build -t rez-multi-warehouse .

# Run container
docker run -p 4024:4024 --env-file .env rez-multi-warehouse
```

## Project Structure

```
REZ-multi-warehouse/
├── src/
│   ├── config/          # Configuration files
│   │   ├── logger.ts    # Winston logger config
│   │   └── database.ts  # MongoDB connection
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── models/          # MongoDB models
│   ├── integrations/    # External integrations
│   │   └── rabtulClient.ts
│   └── types/           # TypeScript types
│       └── index.ts
├── .env.example         # Environment template
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Transfer Workflow

```
PENDING → APPROVED → IN_TRANSIT → RECEIVED → COMPLETED
                  ↓
              CANCELLED
```

## Allocation Strategies

| Strategy | Description |
|----------|-------------|
| `nearest` | Fulfill from closest warehouse to delivery location |
| `cheapest` | Minimize total fulfillment cost |
| `fastest` | Prioritize fastest delivery time |
| `balanced` | Balance cost and speed |

## Fulfillment Optimization

The fulfillment endpoint considers:
- Distance to delivery location
- Available inventory
- Warehouse capacity
- Transfer costs
- Delivery time estimates

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm test` | Run tests with coverage |
| `npm run lint` | Run ESLint |

## Health Check

```bash
# Health check
curl http://localhost:4024/health

# Readiness check
curl http://localhost:4024/ready
```

## License

MIT - REZ Platform