# In-Ad Booking Service

**Port:** 4810

Enables booking flows inside ads - users can book appointments, tables, services directly from ads without leaving.

## Features

- Multi-category booking (restaurant, healthcare, salon, service, appointment)
- Payment integration with RABTUL wallet
- Status tracking (pending, confirmed, cancelled, completed)
- Ad attribution tracking
- Confirmation workflows
- Prometheus metrics
- JWT authentication
- Rate limiting

## Tech Stack

- Express.js
- MongoDB (Mongoose)
- Redis (ioredis)
- Zod validation
- JWT authentication
- Prometheus metrics
- TypeScript

## Quick Start

```bash
# Install dependencies
cd in-ad-booking-service
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## Environment Variables

```env
PORT=4810
MONGODB_URI=mongodb://localhost:27017/in-ad-booking
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
RABTUL_WALLET_URL=http://localhost:4004
ALLOWED_ORIGINS=https://rez.money,https://admin.rez.money,https://ads.rez.money
```

## API Endpoints

### Create Booking
```http
POST /api/booking/create
Content-Type: application/json

{
  "adId": "ad-123",
  "advertiserId": "adv-123",
  "userId": "user-123",
  "businessId": "biz-123",
  "type": "restaurant",
  "details": {
    "date": "2024-12-25T19:00:00.000Z",
    "time": "19:00",
    "guests": 2,
    "notes": "Window seat please"
  },
  "paymentRequired": true,
  "paymentAmount": 500
}
```

### Get Booking
```http
GET /api/booking/:id
```

### Cancel Booking
```http
PUT /api/booking/:id/cancel
```

### Confirm Booking
```http
POST /api/booking/:id/confirm
```

### Get User Bookings
```http
GET /api/booking/user/:userId?page=1&limit=20
```

### Get Ad Bookings
```http
GET /api/booking/ad/:adId?page=1&limit=20
```

### Process Payment
```http
POST /api/booking/:id/pay
Content-Type: application/json

{
  "method": "wallet"
}
```

## Health Check

```bash
curl http://localhost:4810/health
```

## Metrics

```bash
curl http://localhost:4810/metrics
```

## Project Structure

```
in-ad-booking-service/
├── src/
│   ├── config/          # Configuration
│   ├── middleware/       # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilities
│   └── index.ts         # Entry point
├── tests/               # Test files
├── package.json
├── tsconfig.json
└── README.md
```

## Booking Types

| Type | Description |
|------|-------------|
| restaurant | Table reservations |
| healthcare | Doctor appointments |
| salon | Salon services |
| service | General services |
| appointment | Generic appointments |

## Booking Status Flow

```
pending -> confirmed -> completed
    |          |
    v          v
 cancelled  cancelled
```

## License

Proprietary - REZ Ecosystem
