# REZ Retail Smart Inventory Service

Smart inventory management with alerts and purchase order tracking.

## Features

- Stock alerts (low stock, out of stock)
- Purchase order management
- Supplier tracking
- Automatic reorder suggestions
- Scheduled stock level checks

## API Endpoints

### Purchase Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/purchase-orders` | List orders |
| GET | `/api/inventory/purchase-orders/pending` | Pending orders |
| GET | `/api/inventory/purchase-orders/stats` | Order statistics |
| GET | `/api/inventory/purchase-orders/:id` | Get order |
| POST | `/api/inventory/purchase-orders` | Create order |
| PUT | `/api/inventory/purchase-orders/:id/status` | Update status |
| POST | `/api/inventory/purchase-orders/:id/receive` | Receive inventory |
| POST | `/api/inventory/purchase-orders/:id/cancel` | Cancel order |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | Active alerts |
| GET | `/api/alerts/stats` | Alert statistics |
| GET | `/api/alerts/product/:id` | Product alerts |
| PUT | `/api/alerts/:id/acknowledge` | Acknowledge |
| PUT | `/api/alerts/:id/resolve` | Resolve |
| PUT | `/api/alerts/:id/dismiss` | Dismiss |

## Configuration

```env
PORT=4103
MONGODB_URI=mongodb://localhost:27017/rez-retail-inventory
REDIS_URL=redis://localhost:6379
```
