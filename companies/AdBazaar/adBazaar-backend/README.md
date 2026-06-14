# AdBazaar Backend

Screen marketplace backend connecting screen owners with advertisers.

## Service Purpose

Core backend for the AdBazaar digital out-of-home advertising marketplace. Manages screen inventory, campaign bookings, billing, and advertiser/publisher relationships.

## Port

```
3015
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/screens` | List available screens |
| POST | `/api/screens` | Register new screen |
| GET | `/api/screens/:id` | Get screen details |
| PUT | `/api/screens/:id` | Update screen info |
| DELETE | `/api/screens/:id` | Remove screen |
| GET | `/api/bookings` | List bookings |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/:id` | Get booking details |
| PUT | `/api/bookings/:id` | Update booking |
| DELETE | `/api/bookings/:id` | Cancel booking |
| GET | `/api/inventory` | Search available inventory |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns/:id` | Get campaign |
| PUT | `/api/campaigns/:id` | Update campaign |
| GET | `/api/billing/invoices` | List invoices |
| POST | `/api/billing/pay` | Process payment |

## Configuration

Environment variables:

```env
PORT=3015
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/adbazaar-backend
REDIS_URL=redis://localhost:6379
```

## Setup Instructions

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build
npm start

# Run tests
npm test
npm run test:watch
npm run test:e2e

# Linting
npm run lint
npm run lint:fix
```

## Tech Stack

- Express.js
- TypeScript
- Mongoose (MongoDB)
- Redis
- Axios (HTTP client)
- Zod (validation)
- UUID (ID generation)
- CORS
- Helmet (security headers)
- Rate limiting
- Jest (testing)
