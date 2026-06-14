# Reks Ads

Reks advertising platform core service.

## Service Purpose

Core advertising platform service handling campaign management, ad serving, and inventory optimization for the Reks advertising network.

## Port

```
3025
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns/:id` | Get campaign |
| PUT | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign |
| POST | `/api/campaigns/:id/start` | Start campaign |
| POST | `/api/campaigns/:id/pause` | Pause campaign |
| GET | `/api/ads` | List ads |
| POST | `/api/ads` | Create ad |
| GET | `/api/ads/:id` | Get ad |
| PUT | `/api/ads/:id` | Update ad |
| GET | `/api/inventory` | Available inventory |
| GET | `/api/stats` | Platform statistics |

## Configuration

Environment variables:

```env
PORT=3025
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/reks-ads
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
- Mongoose (MongoDB)
- Zod (validation)
- UUID (ID generation)
- Axios (HTTP client)
- CORS
- Helmet (security headers)
- Vitest (testing)
