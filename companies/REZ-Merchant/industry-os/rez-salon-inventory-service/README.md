# REZ Salon Inventory Service

REZ Salon OS - Inventory management for salon products and supplies

**Port:** 4202

## Features

- **Category Management**: Organize products into categories
- **Supplier Management**: Manage supplier information and contacts
- **Product Catalog**: Maintain salon product inventory with details
- **Stock Alerts**: Configurable alerts for low stock levels
- **Inventory Tracking**: Track product quantities and stock movements
- **Stock Adjustments**: Record stock additions and reductions

## Models

### Category
- Category name and description
- Parent category support (hierarchical)
- Active/inactive status

### Supplier
- Supplier name and contact information
- Email, phone, address details
- Active/inactive status

### Product
- Product name, SKU, and description
- Category association
- Supplier association
- Unit price and cost price
- Current stock quantity
- Reorder level threshold
- Active/inactive status

### StockAlert
- Product reference
- Alert type (low_stock, out_of_stock, expiry_warning)
- Alert threshold
- Status (active, acknowledged, resolved)

## Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test
```

## Configuration

This service uses MongoDB. Configure via environment variables:
- `MONGODB_URI`: MongoDB connection string (default: mongodb://localhost:27017/rez-salon-inventory)

## Note

This is a data models library/module rather than a standalone microservice. Import the models directly into your application to use them with Mongoose.
