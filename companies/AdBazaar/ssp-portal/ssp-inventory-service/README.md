# SSP Inventory Service

**Supply Side Platform Inventory Management Service for DOOH Advertising**

## Overview

The SSP Inventory Service manages advertising inventory slots for DOOH (Digital Out of Home) screens. It provides a comprehensive API for creating, booking, and managing time-based advertising slots across multiple screens.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Or build and start production
npm run build
npm start
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
PORT=4522
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ssp_inventory
LOG_LEVEL=info
```

## API Endpoints

### Health Checks
- `GET /health` - Service health status
- `GET /ready` - Readiness check (includes MongoDB status)

### Inventory Management
- `POST /api/inventory` - Create a new inventory slot
- `GET /api/inventory` - List all slots (paginated)
- `GET /api/inventory/:id` - Get slot by ID
- `GET /api/inventory/screen/:screenId` - Get slots by screen
- `GET /api/inventory/screen/:screenId/date/:date` - Get slots for screen on date
- `GET /api/inventory/available` - Search available slots
- `GET /api/inventory/stats` - Get inventory statistics
- `PATCH /api/inventory/:id` - Update slot
- `PATCH /api/inventory/:id/book` - Book slot
- `PATCH /api/inventory/:id/release` - Release slot
- `PATCH /api/inventory/:id/reserve` - Reserve slot (temporary hold)
- `PATCH /api/inventory/:id/block` - Block slot (administrative)
- `DELETE /api/inventory/:id` - Delete slot
- `POST /api/inventory/batch` - Batch create slots

## Slot Model

```typescript
{
  slotId: string;        // Unique identifier
  screenId: string;     // Screen identifier
  date: Date;           // Slot date
  timeSlot: string;     // Time range (e.g., "00-01", "13-14")
  status: 'available' | 'booked' | 'reserved' | 'blocked';
  price: number;        // Price in currency units
  minDuration: number; // Minimum booking duration (hours)
  maxDuration: number;  // Maximum booking duration (hours)
  bookingId?: string;   // Associated booking
  advertiserId?: string; // Associated advertiser
  createdAt: Date;
  updatedAt: Date;
}
```

## Example Usage

### Create a Slot
```bash
curl -X POST http://localhost:4522/api/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "SLOT-001",
    "screenId": "SCREEN-MUMBAI-001",
    "date": "2026-06-15",
    "timeSlot": "09-12",
    "price": 5000,
    "minDuration": 1,
    "maxDuration": 4
  }'
```

### Book a Slot
```bash
curl -X PATCH http://localhost:4522/api/inventory/SLOT-001/book \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOK-12345",
    "advertiserId": "ADV-001"
  }'
```

### Search Available Slots
```bash
curl "http://localhost:4522/api/inventory/available?screenId=SCREEN-MUMBAI-001&date=2026-06-15&duration=2"
```

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Validation:** Zod
- **Logging:** Winston
- **Language:** TypeScript

## Project Structure

```
ssp-inventory-service/
├── src/
│   ├── index.ts              # Application entry point
│   ├── models/
│   │   └── index.ts          # Mongoose models
│   ├── routes/
│   │   └── index.ts          # API routes
│   ├── services/
│   │   └── inventory.service.ts  # Business logic
│   ├── validators/
│   │   └── inventory.validator.ts # Zod schemas
│   ├── middleware/
│   │   └── error.middleware.ts   # Error handling
│   └── utils/
│       └── logger.ts         # Winston logger
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## License

MIT