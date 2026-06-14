# REZ Multi-Location Service

**Version:** 1.0.0  
**Service Name:** rez-multi-location  
**Port:** 4601

---

## Overview

Comprehensive franchise/multi-store management service for the REZ Merchant OS. Handles location management, inventory transfers, order tracking, and consolidated reporting across multiple store locations.

## Features

- **Multi-Location Management** - Create, update, delete, and manage multiple store locations
- **Inventory Transfer** - Move stock between locations with tracking
- **Order Management** - Track orders by location with revenue aggregation
- **Consolidated Reporting** - Generate reports across all locations
- **Location Analytics** - Per-location revenue, orders, and performance metrics
- **Manager Assignment** - Assign and track managers across locations

## Quick Start

```bash
cd rez-multi-location
npm install
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Location Management
```
POST   /api/locations          - Create location
GET    /api/locations          - List all locations
GET    /api/locations/:id      - Get location by ID
PUT    /api/locations/:id      - Update location
DELETE /api/locations/:id      - Delete location
```

### Inventory Management
```
GET    /api/inventory/:locationId         - Get inventory
POST   /api/inventory/:locationId         - Add/update item
POST   /api/inventory/transfer            - Transfer between locations
GET    /api/inventory/transfers           - Get transfer history
```

### Order Management
```
POST   /api/orders           - Create order
GET    /api/orders           - List orders
GET    /api/orders/:id       - Get order by ID
```

### Analytics & Reports
```
GET /api/reports/consolidated       - Consolidated report
GET /api/reports/comparison         - Location comparison
GET /api/locations/:id/analytics   - Location analytics
```

### Manager Operations
```
POST /api/locations/:id/manager  - Assign manager
GET  /api/managers/:id           - Get manager details
```

## Environment Variables

```bash
PORT=4601                    # Service port (default: 4601)
```

## Example Usage

### Create a Location
```bash
curl -X POST http://localhost:4601/api/locations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown Store",
    "address": "123 Main St",
    "city": "Mumbai",
    "merchantId": "MERCH001"
  }'
```

### Transfer Inventory
```bash
curl -X POST http://localhost:4601/api/inventory/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "fromLocationId": "LOC001",
    "toLocationId": "LOC002",
    "productId": "PROD001",
    "quantity": 50
  }'
```

### Get Consolidated Report
```bash
curl http://localhost:4601/api/reports/consolidated?merchantId=MERCH001
```

## Testing

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode
```

## Dependencies

- express - Web framework
- cors - CORS middleware
- helmet - Security headers
- uuid - UUID generation
- vitest - Testing framework
- supertest - HTTP testing