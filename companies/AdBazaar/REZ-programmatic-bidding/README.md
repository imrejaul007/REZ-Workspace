# REZ Programmatic Bidding

Real-time programmatic bidding engine for ad auctions.

## Service Purpose

Handles real-time bidding auctions for programmatic ad buying. Implements bid optimization, floor price management, and auction dynamics for maximizing campaign performance.

## Port

```
3009
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bid` | Submit bid for impression |
| GET | `/api/bids` | List active bids |
| GET | `/api/bids/:id` | Get bid details |
| POST | `/api/campaigns/:id/budget` | Set campaign budget |
| GET | `/api/auctions/active` | Active auction count |
| GET | `/api/auctions/stats` | Auction statistics |
| POST | `/api/strategies` | Create bidding strategy |
| GET | `/api/strategies/:id` | Get strategy details |
| PUT | `/api/strategies/:id` | Update strategy |
| GET | `/api/floor-prices` | Get current floor prices |

## Configuration

Environment variables:

```env
PORT=3009
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez-programmatic-bidding
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

## Bid Request Format

```typescript
interface BidRequest {
  impressionId: string;
  inventory: {
    adSize: { width: number; height: number };
    format: 'banner' | 'video' | 'native';
    position: 'above' | 'below';
  };
  targeting: {
    demographics?: { ageRange?: [number, number]; gender?: string };
    location?: { country: string; region?: string; city?: string };
    interests?: string[];
  };
  floorPrice: number;
  allowed advertisers?: string[];
}
```

## Tech Stack

- Express.js
- TypeScript
- Mongoose (MongoDB)
- Redis (auction state)
- Zod (validation)
- UUID (ID generation)
- Axios (HTTP client)
- CORS
- Helmet (security headers)
- Vitest (testing)
