# REZ B2B Integration Service

B2B-to-B2C integration service that connects supplier data to merchant profiles. Enables seamless synchronization between Tally ERP, suppliers, and the REZ Merchant ecosystem.

## Overview

This service acts as a bridge between external B2B suppliers (like Tally) and the REZ Merchant platform, handling product catalog synchronization, cost tracking, and merchant-supplier mappings.

## Service Details

| Property | Value |
|----------|-------|
| **Service Name** | REZ B2B Integration |
| **Port** | 4095 |
| **Node Version** | >=18.0.0 |
| **Type** | REST API Service |

## Features

- **Tally ERP Integration** - Sync products and suppliers from Tally accounting software
- **Product Catalog Sync** - Synchronize product data from suppliers to merchants
- **Cost Tracking** - Monitor product costs and alert on price changes
- **Margin Calculation** - Calculate competitive margins for products
- **Supplier Management** - Manage merchant-supplier relationships
- **Employee Linking** - Connect corporate employees to merchant accounts

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/api/v1/suppliers` | List all suppliers |
| POST | `/api/v1/suppliers` | Create a new supplier |
| GET | `/api/v1/suppliers/:id` | Get supplier by ID |
| PUT | `/api/v1/suppliers/:id` | Update supplier |
| GET | `/api/v1/products/sync` | Sync products from supplier |
| POST | `/api/v1/products/sync` | Trigger product synchronization |
| GET | `/api/v1/costs/:productId` | Get product cost history |
| POST | `/api/v1/costs/calculate` | Calculate costs and margins |
| GET | `/api/v1/alerts` | Get cost change alerts |
| POST | `/api/v1/mappings` | Create merchant-supplier mapping |
| GET | `/api/v1/employees/link` | Link employee to merchant |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4095 | Service port |
| `NODE_ENV` | development | Environment mode |
| `MONGODB_URI` | mongodb://localhost:27017/rez_b2b_integration | MongoDB connection string |
| `REDIS_URL` | redis://localhost:6379 | Redis URL for caching |
| `INTERNAL_SERVICE_TOKEN` | - | Internal service authentication token |
| `TALLY_API_URL` | - | Tally ERP API URL |
| `TALLY_API_KEY` | - | Tally API authentication key |
| `TALLY_COMPANY_ID` | - | Tally company identifier |
| `MERCHANT_SERVICE_URL` | http://localhost:3001 | Merchant service URL |
| `NOTIFICATIONS_SERVICE_URL` | http://localhost:4004 | Notifications service URL |
| `RATE_LIMIT_WINDOW_MS` | 60000 | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |
| `LOG_LEVEL` | info | Logging level |
| `SYNC_CRON_SCHEDULE` | 0 */6 * * * | Cron schedule for supplier sync |
| `COST_CHANGE_THRESHOLD_PERCENT` | 5 | Cost change threshold for alerts |

## Dependencies

### Production Dependencies
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `axios` - HTTP client for external APIs
- `zod` - Schema validation
- `winston` - Logging
- `dotenv` - Environment variables
- `cors` - CORS middleware
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `compression` - Response compression
- `node-cron` - Scheduled tasks
- `uuid` - Unique ID generation

### Development Dependencies
- `typescript` - TypeScript compiler
- `ts-node-dev` - Development server with hot reload
- `jest` - Testing framework
- `@typescript-eslint/eslint-plugin` - ESLint plugin

## Setup Instructions

### Prerequisites

- Node.js >=18.0.0
- MongoDB 6.0+
- Redis 7.0+ (optional, for caching)

### Installation

```bash
# Navigate to service directory
cd REZ-b2b-integration

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
docker build -t rez-b2b-integration .

# Run container
docker run -p 4095:4095 --env-file .env rez-b2b-integration
```

## Project Structure

```
REZ-b2b-integration/
├── src/
│   ├── models/          # MongoDB models
│   │   ├── supplier.model.ts
│   │   ├── product-cost.model.ts
│   │   ├── synced-product.model.ts
│   │   ├── merchant-supplier-mapping.model.ts
│   │   └── cost-alert.model.ts
│   ├── services/        # Business logic
│   │   ├── supplierBridge.ts
│   │   ├── costCalculator.ts
│   │   └── employeeLinker.ts
│   ├── integrations/    # External integrations
│   │   └── rabtulClient.ts
│   └── types/           # TypeScript type definitions
│       └── index.ts
├── .env.example         # Environment template
├── Dockerfile
├── package.json
└── tsconfig.json
```

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
curl http://localhost:4095/health
```

## License

Proprietary - REZ Platform