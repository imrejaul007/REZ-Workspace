# Event Commerce Service

Event-triggered advertising for e-commerce platforms.

## Service Purpose

Manages event-driven advertising triggered by e-commerce events like cart abandonment, price drops, back-in-stock, and wishlist activity. Enables hyper-personalized ads based on shopping behavior.

## Port

```
3021
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/events/cart-abandon` | Cart abandonment event |
| POST | `/api/events/price-drop` | Price drop notification |
| POST | `/api/events/back-in-stock` | Back in stock event |
| POST | `/api/events/wishlist` | Wishlist activity |
| POST | `/api/events/purchase` | Post-purchase event |
| GET | `/api/campaigns` | List event campaigns |
| POST | `/api/campaigns` | Create event campaign |
| GET | `/api/campaigns/:id` | Get campaign details |
| PUT | `/api/campaigns/:id` | Update campaign |
| GET | `/api/segments` | List event segments |
| POST | `/api/segments` | Create segment |
| GET | `/api/stats` | Event campaign statistics |

## Configuration

Environment variables:

```env
PORT=3021
NODE_ENV=development
ECOMMERCE_PLATFORM=webhook
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
npm run test:coverage
```

## Event Types

| Event | Trigger | Typical Delay |
|-------|---------|---------------|
| Cart Abandonment | Cart without purchase | 1 hour |
| Price Drop | Product price reduction | Immediate |
| Back in Stock | Product reavailability | Immediate |
| Wishlist Reminder | Weekly digest | 7 days |
| Purchase Follow-up | Post-purchase | 24 hours |

## Tech Stack

- Express.js
- TypeScript
- Axios (HTTP client)
- CORS
- Helmet (security headers)
- Vitest (testing)
