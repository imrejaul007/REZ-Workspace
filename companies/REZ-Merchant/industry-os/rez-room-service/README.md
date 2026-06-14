# rez-room-service

**Port:** 4043

F&B Room Service for in-room dining, menu management, and order tracking.

## Features

- **Menu Management** - Categories, items, dietary info
- **Order Management** - Create, track, update orders
- **Kitchen Display** - KDS integration ready
- **Billing** - Charges to guest folio

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu/:hotelId` | Get menu |
| GET | `/api/menu/:hotelId/:categoryId` | Get category items |
| POST | `/api/order` | Create order |
| GET | `/api/order/:id` | Get order |
| PUT | `/api/order/:id/status` | Update status |

## Quick Start

```bash
npm install
npm run dev
npm test
```
