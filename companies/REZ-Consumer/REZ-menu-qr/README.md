# REZ-menu-qr

**Restaurant Menu QR Service for REZ Consumer**

A table management and digital menu service that allows restaurants to generate QR codes for tables, display menus, and accept orders. Built with Express, TypeScript, and MongoDB.

## Overview

REZ-menu-qr provides a seamless dining experience by enabling customers to scan QR codes at restaurant tables to view menus, browse items, and place orders directly from their phones.

## Features

- **QR Code Generation**: Generate unique QR codes for tables
- **Table Management**: Track table status (available, occupied, reserved)
- **Digital Menu Display**: Show categorized menus with images and descriptions
- **Order Placement**: Accept orders directly through the QR interface
- **Demo Data**: Pre-populated demo restaurant data for testing
- **MongoDB Persistence**: Production-ready with MongoDB storage
- **In-Memory Fallback**: Works without MongoDB for development

## Status

**✅ COMPLETE v2.0** - Built June 2026 (MongoDB Added)

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose (v2.0 upgrade)
- **Language**: TypeScript
- **Security**: CORS, Helmet, Rate Limiting

## Project Structure

```
REZ-menu-qr/
├── src/
│   ├── index.ts              # Express app entry point
│   └── integrations/          # RABTUL integrations
├── .env.example
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Port Configuration

**Default Port: 3014**

The service runs on `PORT=3014` (configurable via environment variable).

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone and navigate
cd REZ-menu-qr

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### QR Generation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/menu/generate-qr` | POST | Generate QR code for table |

### Menu

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/menu/:restaurantId` | GET | Get restaurant menu |
| `GET /api/menu/:restaurantId/tables` | GET | Get table list |

### Orders

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/menu/order` | POST | Place order |
| `GET /api/menu/order/:orderId` | GET | Get order status |

## API Examples

### Generate QR Code

```bash
curl -X POST http://localhost:3014/api/menu/generate-qr \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "rest123",
    "tableId": "t1",
    "type": "menu"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qr_content": "REZ:menu:rest123:t1",
    "qr_url": "https://rez.money/menu/rest123?table=t1"
  }
}
```

### Get Restaurant Menu

```bash
curl http://localhost:3014/api/menu/rest123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "restaurant_id": "rest123",
    "name": "Demo Restaurant",
    "categories": [
      {
        "id": "cat-1",
        "name": "Starters",
        "items": [
          {"id": "i1", "name": "Spring Rolls", "price": 150, "description": "Crispy vegetable rolls"},
          {"id": "i2", "name": "Soup", "price": 120, "description": "Hot and sour soup"}
        ]
      },
      {
        "id": "cat-2",
        "name": "Main Course",
        "items": [
          {"id": "i3", "name": "Biryani", "price": 250, "description": "Hyderabadi biryani"},
          {"id": "i4", "name": "Curry", "price": 200, "description": "Butter chicken curry"}
        ]
      }
    ]
  }
}
```

### Get Tables

```bash
curl http://localhost:3014/api/menu/rest123/tables
```

### Place Order

```bash
curl -X POST http://localhost:3014/api/menu/order \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "rest123",
    "tableId": "t1",
    "customerName": "John Doe",
    "items": [
      {"id": "i1", "name": "Spring Rolls", "price": 150, "quantity": 2},
      {"id": "i3", "name": "Biryani", "price": 250, "quantity": 1}
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "order_id": "uuid-generated-order-id",
      "restaurant_id": "rest123",
      "table_id": "t1",
      "items": [...],
      "customer_name": "John Doe",
      "status": "pending",
      "total": 550,
      "created_at": "2026-06-04T10:00:00.000Z"
    }
  }
}
```

## QR Code Types

| Type | Format | Description |
|------|--------|-------------|
| `menu` | `REZ:menu:{restaurantId}` | Shows restaurant menu |
| `table` | `REZ:table:{restaurantId}:{tableId}` | Opens table-specific menu |
| `order` | `REZ:order:{restaurantId}:{orderId}` | Shows order status |
| `payment` | `REZ:payment:{restaurantId}:{orderId}` | Initiates payment |

## RABTUL Integration

REZ-menu-qr integrates with the following RABTUL services:

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_SERVICE_URL` | RABTUL Authentication service | http://localhost:4002 |
| `WALLET_SERVICE_URL` | RABTUL Wallet service | http://localhost:4004 |
| `ANALYTICS_SERVICE_URL` | RABTUL Analytics service | http://localhost:4016 |
| `NOTIFICATION_SERVICE_URL` | RABTUL Notification service | http://localhost:4011 |
| `EVENT_BUS_URL` | Event bus for pub/sub | http://localhost:4025 |

### Event Types Published

```typescript
interface OrderEvent {
  type: 'order.placed';
  restaurantId: string;
  tableId: string;
  orderId: string;
  timestamp: Date;
  metadata: {
    itemCount: number;
    totalAmount: number;
    customerName?: string;
  };
}
```

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3014 |

### RABTUL Services

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_SERVICE_URL` | Authentication service | http://localhost:4002 |
| `WALLET_SERVICE_URL` | Wallet service | http://localhost:4004 |
| `ANALYTICS_SERVICE_URL` | Analytics service | http://localhost:4016 |
| `NOTIFICATION_SERVICE_URL` | Notification service | http://localhost:4011 |
| `EVENT_BUS_URL` | Event bus | http://localhost:4025 |

## Data Structures

### Menu

```typescript
interface Menu {
  restaurant_id: string;
  name: string;
  categories: Category[];
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
}
```

### Order

```typescript
interface Order {
  order_id: string;
  restaurant_id: string;
  table_id: string;
  items: OrderItem[];
  customer_name?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
  total: number;
  created_at: Date;
}
```

## Testing

```bash
# Run tests
npm test

# Test with curl
curl http://localhost:3014/api/menu/demo-restaurant
```

## Deployment

### Docker

```bash
# Build image
docker build -t rez-menu-qr .

# Run container
docker run -p 3014:3014 rez-menu-qr
```

### Production Considerations

- For production, replace in-memory storage with MongoDB
- Add JWT authentication for restaurant owners
- Integrate with payment gateway
- Add real-time order updates via WebSocket

## Integration with REZ Consumer Apps

The QR codes generated point to REZ consumer-facing apps:

| URL Pattern | Target |
|-------------|--------|
| `https://rez.money/menu/{restaurantId}` | REZ consumer web app |
| `https://rez.money/menu/{restaurantId}?table={tableId}` | Table-specific menu |

## Related Services

| Service | Port | Description |
|---------|------|-------------|
| go4food-api | 3002 | Food search and comparison |
| REZ-assistant | 3011 | AI recommendations |
| REZ-nearby | 3015 | Restaurant discovery |

## License

Private - REZ Consumer Application
