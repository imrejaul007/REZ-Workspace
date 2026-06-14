# REZ RTB Service

Real-Time Bidding service for programmatic advertising.

## Service Purpose

Implements OpenRTB-compatible real-time bidding for programmatic ad transactions. Handles bid requests, executes auctions, and manages bid responses at sub-100ms latency.

## Port

```
3012
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bidrequest` | Receive OpenRTB bid request |
| POST | `/api/bidresponse` | Submit bid response |
| GET | `/api/campaigns` | List active campaigns |
| POST | `/api/campaigns` | Create RTB campaign |
| GET | `/api/campaigns/:id` | Get campaign config |
| PUT | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign |
| GET | `/api/creative/:id` | Serve creative |
| POST | `/api/creative` | Upload creative |
| GET | `/api/creative/:id/审核` | Get creative status |
| GET | `/api/stats` | Bidding statistics |

## Configuration

Environment variables:

```env
PORT=3012
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez-rtb-service
RTB_TIMEOUT_MS=100
SEAT_ID=rez-seat-001
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
```

## OpenRTB 2.5 Support

Implements core OpenRTB 2.5 specification:

```typescript
interface BidRequest {
  id: string;
  imp: Impression[];
  site: Site;
  device: Device;
  user: User;
  tmax: number;
  test?: number;
}
```

## Tech Stack

- Express.js
- TypeScript
- Mongoose (MongoDB)
- Axios (HTTP client)
- Zod (validation)
- Dotenv (environment config)
