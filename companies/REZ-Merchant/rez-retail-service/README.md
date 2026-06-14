# REZ Retail Service

**Core retail operations platform** — Products, stores, categories, employees, and suppliers management.

## Overview

REZ Retail Service is the foundational business layer for retail operations in the REZ ecosystem. It provides:

- **Product Management** — SKUs, pricing, categories, suppliers
- **Store Management** — Retail locations, warehouse, popup stores
- **Category Management** — Hierarchical product categories
- **Employee Management** — Staff roles, assignments, schedules
- **Supplier Management** — Vendor relationships, ratings

## Architecture

```
REZ Retail Service (4100)
        │
        ├── Products API
        ├── Stores API
        ├── Categories API
        ├── Employees API
        └── Suppliers API
              │
              ▼
        SHOPFLOW (4830)
        (AI Intelligence)
```

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Validation:** Zod
- **Logging:** Winston

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Health Checks

```bash
curl http://localhost:4100/health
curl http://localhost:4100/health/live
curl http://localhost:4100/health/ready
```

## API Endpoints

### Products

```bash
GET    /api/products # List products
GET    /api/products/:id          # Get product
GET    /api/products/sku/:sku     # Get by SKU
POST   /api/products              # Create product
PUT    /api/products/:id          # Update product
PATCH /api/products/:id/stock     # Update stock levels
DELETE /api/products/:id          # Deactivate product
POST /api/products/bulk         # Bulk create/update
GET    /api/products/:id/analytics # Product analytics
```

### Stores

```bash
GET    /api/stores                # List stores
GET    /api/stores/:id            # Get store
GET    /api/stores/code/:code     # Get by code
POST   /api/stores                # Create store
PUT    /api/stores/:id            # Update store
DELETE /api/stores/:id            # Deactivate store
GET    /api/stores/:id/employees  # Store employees
GET    /api/stores/:id/overview   # Store dashboard
```

### Categories

```bash
GET    /api/categories                 # List categories
GET    /api/categories/:id             # Get category
GET    /api/categories/:id/subcategories # Subcategories
POST   /api/categories                # Create category
PUT    /api/categories/:id             # Update category
DELETE /api/categories/:id             # Deactivate category
```

### Employees

```bash
GET    /api/employees                     # List employees
GET    /api/employees/:id                 # Get employee
GET    /api/employees/employeeId/:id     # Get by employee ID
POST   /api/employees                     # Create employee
PUT    /api/employees/:id                 # Update employee
DELETE /api/employees/:id                 # Deactivate employee
```

### Suppliers

```bash
GET    /api/suppliers                 # List suppliers
GET    /api/suppliers/:id # Get supplier
GET    /api/suppliers/code/:code      # Get by code
POST   /api/suppliers                 # Create supplier
PUT    /api/suppliers/:id             # Update supplier
DELETE /api/suppliers/:id             # Deactivate supplier
PATCH /api/suppliers/:id/rating       # Update rating
```

## Environment Variables

```env
PORT=4100
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez-retail
JWT_SECRET=your-secret-key
LOG_LEVEL=info

# Integration URLs
SHOPFLOW_URL=http://localhost:4830
CRM_SERVICE_URL=http://localhost:4101
LOYALTY_SERVICE_URL=http://localhost:4102
INVENTORY_SERVICE_URL=http://localhost:4103
POS_SERVICE_URL=http://localhost:4104
ANALYTICS_SERVICE_URL=http://localhost:4105
HOJAI_BRAIN_URL=http://localhost:4800
```

## Models

### Product
- sku (unique)
- name, description
- category, subcategory, brand
- price, cost, mrp, taxRate
- images, attributes
- reorderLevel, reorderQuantity
- isActive

### Store
- name, code (unique)
- type (retail/warehouse/popup)
- address, location (GeoJSON)
- phone, email
- operatingHours
- managerId

### Category
- name
- parentId (hierarchical)
- level
- attributes
- isActive

### Employee
- employeeId (unique)
- name, phone, email
- role (manager/cashier/stockist/security/supervisor)
- storeId
- isActive

### Supplier
- name, code (unique)
- contactPerson, phone, email
- address, gstin
- paymentTerms
- rating
- isActive

## Integration

### With ShopFlow (AI)

The service integrates with ShopFlow for AI-powered insights:

```typescript
// Product recommendations from ShopFlow
POST http://localhost:4830/api/ai/discovery/recommend

// Pricing optimization
POST http://localhost:4830/api/ai/pricing/recommend
```

### With Other Services

```typescript
// CRM for customer data
GET http://localhost:4101/api/customers/:id

// Loyalty for points
GET http://localhost:4102/api/accounts/:customerId

// Inventory for stock
PATCH http://localhost:4103/api/inventory/:productId/quantity
```

## Port

**Port: 4100**

## License

MIT
