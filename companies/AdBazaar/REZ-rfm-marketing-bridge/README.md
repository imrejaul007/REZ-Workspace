# REZ RFM Marketing Bridge

RFM (Recency, Frequency, Monetary) scoring to marketing campaign bridge.

## Service Purpose

Connects RFM customer scoring with marketing automation. Triggers campaigns based on RFM segments, manages customer journeys, and orchestrates personalized marketing communications.

## Port

```
3011
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rfm/scores` | Get RFM scores |
| POST | `/api/rfm/calculate` | Calculate RFM scores |
| GET | `/api/rfm/segments` | List RFM segments |
| GET | `/api/rfm/users/:segment` | Get users in segment |
| POST | `/api/campaigns/trigger` | Trigger campaign for segment |
| GET | `/api/journeys` | List customer journeys |
| POST | `/api/journeys` | Create journey |
| PUT | `/api/journeys/:id` | Update journey |
| GET | `/api/journeys/:id/stats` | Journey statistics |
| POST | `/api/events/consume` | Consume external event |

## Configuration

Environment variables:

```env
PORT=3011
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez-rfm-bridge
REDIS_URL=redis://localhost:6379
MARKETING_API_URL=http://localhost:4000
CRON_SCHEDULE=0 2 * * *
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

# Run tests with coverage
npm test

# Run linting
npm run lint
```

## RFM Segments

| Segment | Description | Marketing Action |
|---------|-------------|------------------|
| Champions | High recency, frequency, monetary | VIP rewards, early access |
| Loyal | High frequency | Loyalty programs, upsells |
| Potential | Medium scores | Nurture campaigns |
| At Risk | Low recency, high frequency | Re-engagement campaigns |
| Lost | Low across all | Win-back campaigns |

## Tech Stack

- Express.js
- TypeScript
- Mongoose (MongoDB)
- Redis
- Axios (HTTP client)
- Zod (validation)
- Winston (logging)
- Node-cron (scheduled jobs)
- CORS
- Helmet (security headers)
- Rate limiting
