# REZ Media Integration Service

REZ-Media integration with RABTUL-Technologies.

## Service Purpose

Integration service bridging REZ Media platform with external systems and RABTUL-Technologies infrastructure. Handles data synchronization, event streaming, and API coordination.

## Port

```
3029
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service health check |
| POST | `/api/sync` | Trigger data sync |
| GET | `/api/sync/status` | Sync status |
| POST | `/api/events` | Send event |
| GET | `/api/events` | Get events |
| GET | `/api/connections` | List connections |
| POST | `/api/connections` | Add connection |
| DELETE | `/api/connections/:id` | Remove connection |
| POST | `/api/webhook/test` | Test webhook |

## Configuration

Environment variables:

```env
PORT=3029
NODE_ENV=development
EXTERNAL_API_URL=https://api.rabtul.example.com
WEBHOOK_SECRET=your_webhook_secret
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

## Tech Stack

- Express.js
- TypeScript
- UUID (ID generation)
- CORS
- Helmet (security headers)
- Vitest (testing)
