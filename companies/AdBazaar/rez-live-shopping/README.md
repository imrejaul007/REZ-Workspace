# REZ Live Shopping

Live shopping with video streaming, real-time bidding, and checkout integration.

## Service Purpose

Enables live shopping experiences with real-time product bidding, interactive video streaming, and seamless checkout integration. Supports influencer-driven live commerce.

## Port

```
3028
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | List live sessions |
| POST | `/api/sessions` | Create session |
| GET | `/api/sessions/:id` | Get session details |
| PUT | `/api/sessions/:id` | Update session |
| DELETE | `/api/sessions/:id` | End session |
| POST | `/api/sessions/:id/start` | Start streaming |
| POST | `/api/sessions/:id/end` | End streaming |
| GET | `/api/products` | Session products |
| POST | `/api/products` | Add product to session |
| POST | `/api/bids` | Submit live bid |
| GET | `/api/bids/session/:sessionId` | Session bids |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:id` | Get order |
| GET | `/api/chat` | Session chat messages |
| POST | `/api/chat` | Send chat message |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| bid | both | New bid placed |
| product_highlight | server | Product featured |
| chat_message | both | Chat message |
| viewer_count | server | Viewer count update |
| session_end | server | Session ended |

## Configuration

Environment variables:

```env
PORT=3028
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez-live-shopping
REDIS_URL=redis://localhost:6379
STREAMING_PROVIDER=custom
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
```

## Tech Stack

- Express.js
- TypeScript
- Socket.io
- Mongoose (MongoDB)
- Redis
- Winston (logging)
- Axios (HTTP client)
