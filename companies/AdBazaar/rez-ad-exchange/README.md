# REZ Ad Exchange

Programmatic ad exchange - SSP/DSP marketplace for buying and selling ad inventory.

## Service Purpose

Full-featured ad exchange platform connecting Supply-Side Platforms (SSPs) and Demand-Side Platforms (DSPs). Manages real-time auctions, floor pricing, deal management, and programmatic guaranteed deals.

## Port

```
3026
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auction` | Submit to auction |
| GET | `/api/auction/:id` | Get auction result |
| GET | `/api/inventory` | Browse available inventory |
| GET | `/api/deals` | List programmatic deals |
| POST | `/api/deals` | Create deal |
| GET | `/api/deals/:id` | Get deal details |
| PUT | `/api/deals/:id` | Update deal |
| POST | `/api/deals/:id/activate` | Activate deal |
| POST | `/api/deals/:id/pause` | Pause deal |
| GET | `/api/floor-prices` | Get floor price rules |
| POST | `/api/floor-prices` | Set floor price |
| GET | `/api/sellers` | List sellers (SSPs) |
| GET | `/api/buyers` | List buyers (DSPs) |
| GET | `/api/stats` | Exchange statistics |

## Configuration

Environment variables:

```env
PORT=3026
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez-ad-exchange
REDIS_URL=redis://localhost:6379
AUCTION_TIMEOUT_MS=100
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
npm run test:run
```

## Deal Types

| Type | Description | Latency |
|------|-------------|---------|
| Open Auction | All bidders compete | < 100ms |
| Private Auction | Invited DSPs only | < 100ms |
| Preferred Deal | Fixed price, first look | < 100ms |
| Programmatic Guaranteed | Guaranteed delivery | Async |

## Tech Stack

- Express.js
- TypeScript
- Mongoose (MongoDB)
- Redis
- Zod (validation)
- UUID (ID generation)
- Axios (HTTP client)
- CORS
- Helmet (security headers)
- Rate limiting
- Vitest (testing)
