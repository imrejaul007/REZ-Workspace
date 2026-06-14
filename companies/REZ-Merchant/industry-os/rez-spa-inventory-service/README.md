# REZ Spa Inventory Service

**Port: 4402**

Spa product and inventory management service.

## Features

- Product catalog management
- Inventory tracking
- Supplier management
- Stock alerts
- Low stock notifications

## API Endpoints

### Inventory
- `GET /api/inventory` - List all products
- `GET /api/inventory/:id` - Get product by ID
- `POST /api/inventory` - Add new product
- `PUT /api/inventory/:id` - Update product
- `DELETE /api/inventory/:id` - Delete product
- `PATCH /api/inventory/:id/stock` - Update stock levels
- `GET /api/inventory/low-stock` - Get low stock products

### Suppliers
- `GET /api/suppliers` - List all suppliers
- `GET /api/suppliers/:id` - Get supplier by ID
- `POST /api/suppliers` - Add supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

## Environment Variables

```
PORT=4402
MONGODB_URI=mongodb://localhost:27017/rez_spa_inventory
```
