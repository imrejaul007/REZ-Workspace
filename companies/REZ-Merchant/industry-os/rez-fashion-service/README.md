# ReZ Fashion Service

Industry vertical merchant service for fashion businesses including apparel retail, boutiques, and fashion stores.

## Overview

ReZ Fashion Service provides comprehensive management for:
- Product inventory and catalog management
- Collection and season planning
- Customer style profiling
- Inventory alerts and reordering

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
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port (default: 4062) | Yes |
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | JWT authentication secret | Yes |
| INTERNAL_TOKEN | Internal API authentication token | Yes |
| RABTUL_API_KEY | RABTUL notification service API key | Yes |

## API Endpoints

### Health
- `GET /health` - Service health check
- `GET /health/ready` - Readiness check with DB connection

### Products
- `GET /api/v1/products` - List all products (with pagination, filters)
- `GET /api/v1/products/:productId` - Get product by ID
- `POST /api/v1/products` - Create new product
- `PUT /api/v1/products/:productId` - Update product
- `DELETE /api/v1/products/:productId` - Delete product
- `GET /api/v1/products/barcode/:barcode` - Get product by barcode
- `GET /api/v1/products/search` - Search products
- `POST /api/v1/products/bulk` - Bulk upload products

### Collections
- `GET /api/v1/collections` - List collections
- `GET /api/v1/collections/:collectionId` - Get collection
- `POST /api/v1/collections` - Create collection
- `PUT /api/v1/collections/:collectionId` - Update collection
- `DELETE /api/v1/collections/:collectionId` - Delete collection
- `POST /api/v1/collections/:collectionId/products` - Add products to collection

### Style Profiles
- `GET /api/v1/style/profiles` - List customer style profiles
- `GET /api/v1/style/profiles/:styleId` - Get style profile
- `POST /api/v1/style/profiles` - Create style profile
- `PUT /api/v1/style/profiles/:styleId` - Update style profile
- `GET /api/v1/style/recommendations/:customerId` - Get recommendations

### Inventory
- `GET /api/v1/inventory` - Get inventory overview
- `GET /api/v1/inventory/low-stock` - Get low stock alerts
- `GET /api/v1/inventory/size-alerts` - Get size alerts
- `PATCH /api/v1/inventory/:productId/stock` - Update stock

## Authentication

All API endpoints require authentication via:
- JWT Bearer token in Authorization header
- X-Internal-Token header for internal service calls

## Rate Limiting

- Read operations: 100 requests per minute
- Write operations: 50 requests per minute

## License

Proprietary - ReZ Platform