# REZ Grocery Service

A comprehensive grocery store management service for merchants to manage products, inventory, supplier orders, expiry tracking, and freshness management.

**Port:** 4052

## Features

### Product Management
- Full CRUD operations for grocery products
- Category-based organization (Produce, Dairy, Bakery, Frozen, Beverages, Snacks, Essentials)
- Barcode scanning for POS integration
- Bulk CSV product import
- Organic and imported product flags
- Multi-image product support

### Inventory Management
- Real-time stock tracking
- Low stock alerts with configurable reorder levels
- Batch stock adjustments
- Inventory valuation (cost and retail)
- Stock history tracking

### Expiry & Freshness Tracking
- Configurable expiry alert thresholds (3/7/14/30 days)
- Automatic expiry alerts
- Freshness score calculation
- Expired product management

### Supplier Order Management
- Create and manage supplier orders
- Order status tracking (Pending, Confirmed, Shipped, Delivered, Cancelled)
- Partial delivery support
- Order delivery tracking
- Supplier performance metrics

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the service
npm start

# Development mode with hot reload
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4052 | Service port |
| MONGODB_URI | mongodb://localhost:27017/rez-grocery | MongoDB connection string |
| NODE_ENV | development | Environment (production/development) |
| CORS_ORIGIN | - | Allowed CORS origins (comma-separated) |
| JWT_SECRET | - | JWT secret for authentication |
| INTERNAL_SERVICE_TOKEN | - | Token for internal service communication |
| LOG_LEVEL | info | Logging level (error, warn, info, http, debug) |

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /ready | Readiness check |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/products | Create a new product |
| GET | /api/products | List products with filters |
| GET | /api/products/:id | Get product by ID |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Soft delete (discontinue) product |
| GET | /api/products/barcode/:barcode | Scan product by barcode |
| POST | /api/products/bulk | Bulk import from CSV |
| GET | /api/products/category/:category | Get products by category |
| POST | /api/products/stock-adjust | Adjust stock quantity |
| GET | /api/products/stats/summary | Get product statistics |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/inventory/alerts | Get active inventory alerts |
| GET | /api/inventory/alerts/:id | Get specific alert |
| PUT | /api/inventory/alerts/:id/resolve | Resolve an alert |
| POST | /api/inventory/alerts/resolve-all | Resolve all alerts |
| GET | /api/inventory/low-stock | Products below reorder level |
| GET | /api/inventory/expiring | Products expiring within N days |
| GET | /api/inventory/expired | Expired products |
| POST | /api/inventory/stock-adjust | Adjust stock quantity |
| POST | /api/inventory/stock-adjust/batch | Batch stock adjustment |
| GET | /api/inventory/valuation | Get inventory valuation |

### Supplier Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/supplier-orders | Create a new order |
| GET | /api/supplier-orders | List orders with filters |
| GET | /api/supplier-orders/pending | Get pending orders |
| GET | /api/supplier-orders/due | Orders due for delivery |
| GET | /api/supplier-orders/:id | Get order by ID |
| PUT | /api/supplier-orders/:id | Update order |
| PUT | /api/supplier-orders/:id/status | Update order status |
| POST | /api/supplier-orders/:id/receive | Receive order items |
| POST | /api/supplier-orders/:id/cancel | Cancel order |
| GET | /api/supplier-orders/:id/track | Track order delivery |
| GET | /api/supplier-orders/stats/summary | Get order statistics |

### Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/config/expiry | Get expiry tracker configuration |
| PUT | /api/config/expiry | Update expiry tracker configuration |

## Data Models

### Product Categories
- `PRODUCE` - Fresh fruits and vegetables
- `DAIRY` - Milk, cheese, yogurt, etc.
- `BAKERY` - Bread, pastries, etc.
- `FROZEN` - Frozen foods
- `BEVERAGES` - Drinks and beverages
- `SNACKS` - Chips, cookies, etc.
- `ESSENTIALS` - Basic grocery items

### Product Units
- `KG` - Kilograms
- `GRAMS` - Grams
- `PCS` - Pieces
- `PACKS` - Packs
- `LITERS` - Liters
- `BOTTLES` - Bottles
- `CANS` - Cans
- `BOXES` - Boxes

### Alert Types
- `LOW_STOCK` - Stock below reorder level
- `EXPIRING` - Product expiring soon
- `EXPIRED` - Product has expired
- `OUT_OF_STOCK` - Product out of stock

### Alert Severity
- `LOW` - Informational
- `MEDIUM` - Should be addressed soon
- `HIGH` - Needs immediate attention
- `CRITICAL` - Urgent action required

### Order Status
- `PENDING` - Order created, awaiting confirmation
- `CONFIRMED` - Supplier confirmed the order
- `SHIPPED` - Order has been shipped
- `DELIVERED` - Order delivered
- `CANCELLED` - Order cancelled

## Authentication

The service uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Roles
- `admin` - Full access
- `manager` - Store management access
- `cashier` - Point of sale access
- `service` - Internal service access

## Rate Limiting

- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- Bulk operations: 5 requests per minute
- Barcode scanning: 60 requests per minute
- Supplier orders: 20 requests per minute

## Example Usage

### Create a Product

```bash
curl -X POST http://localhost:4052/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Organic Apples",
    "category": "PRODUCE",
    "brand": "Fresh Farm",
    "sku": "APL-001",
    "barcode": "1234567890123",
    "unit": "KG",
    "mrp": 150,
    "sellingPrice": 120,
    "costPrice": 80,
    "stock": 100,
    "minStock": 20,
    "reorderLevel": 30,
    "expiryDate": "2026-07-15",
    "merchantId": "MERCHANT001",
    "isOrganic": true
  }'
```

### Scan Barcode

```bash
curl http://localhost:4052/api/products/barcode/1234567890123 \
  -H "Authorization: Bearer <token>"
```

### Bulk Import

```bash
curl -X POST http://localhost:4052/api/products/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "merchantId": "MERCHANT001",
    "csvData": "name,category,sku,barcode,unit,mrp,sellingPrice,costPrice,stock\nOrganic Milk,DAIRY,MLK-001,2345678901234,LITERS,80,65,45,50"
  }'
```

### Adjust Stock

```bash
curl -X POST http://localhost:4052/api/inventory/stock-adjust \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "productId": "GRP-XXXXXXXX",
    "quantity": 10,
    "reason": "PURCHASE",
    "notes": "Received from supplier"
  }'
```

### Create Supplier Order

```bash
curl -X POST http://localhost:4052/api/supplier-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "merchantId": "MERCHANT001",
    "supplierId": "SUP001",
    "supplierName": "Fresh Foods Supply",
    "items": [
      {
        "name": "Organic Milk",
        "quantity": 20,
        "unit": "LITERS",
        "rate": 45
      }
    ],
    "deliveryDate": "2026-06-10"
  }'
```

## Development

### Project Structure

```
rez-grocery-service/
├── src/
│   ├── index.ts           # Main entry point
│   ├── models/            # Mongoose models
│   │   ├── Product.ts
│   │   ├── InventoryAlert.ts
│   │   ├── SupplierOrder.ts
│   │   └── index.ts
│   ├── routes/            # Express routes
│   │   ├── products.routes.ts
│   │   ├── inventory.routes.ts
│   │   └── supplier-orders.routes.ts
│   ├── services/          # Business logic
│   │   ├── inventoryService.ts
│   │   └── expiryTracker.ts
│   ├── middleware/         # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimit.ts
│   │   └── validation.ts
│   └── utils/             # Utilities
│       └── logger.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Running Tests

```bash
npm test
```

## License

Proprietary - REZ Technologies
