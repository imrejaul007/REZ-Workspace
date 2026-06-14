# rez-laundry-service

**Port:** 4048

Laundry Management Service for guest laundry, valet service, and dry cleaning.

## Features

- **Order Management** - Create, track laundry orders
- **Service Types** - Wash, dry clean, press, iron
- **Pickup/Delivery** - Scheduled collection and delivery
- **Status Tracking** - Real-time order updates
- **Billing** - Charges to guest folio

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:id` | Get order |
| GET | `/api/orders/guest/:guestId` | Guest orders |
| PUT | `/api/orders/:id/status` | Update status |
| GET | `/api/pricing` | Get pricing |
| GET | `/api/machines` | Machine status |

## Quick Start

```bash
npm install
npm run dev
npm test
```
