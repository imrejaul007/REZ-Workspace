# REZ Automotive Inventory Service

**Port: 4602**

Auto parts inventory management.

## Features

- Parts catalog management
- Stock tracking
- Supplier management
- Low stock alerts

## API Endpoints

- `GET /api/inventory` - List parts
- `GET /api/inventory/:id` - Get part
- `POST /api/inventory` - Add part
- `PUT /api/inventory/:id` - Update part
- `PATCH /api/inventory/:id/stock` - Update stock
- `GET /api/inventory/low-stock` - Low stock items
- `GET /api/suppliers` - List suppliers

## Environment Variables

```
PORT=4602
MONGODB_URI=mongodb://localhost:27017/rez_automotive_inventory
```
