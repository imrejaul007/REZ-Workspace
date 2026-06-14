# REZ-ads-api

Campaign Management & Serving API for the REZ advertising platform.

## Service Purpose

RESTful API for creating, managing, and serving ad campaigns. Handles campaign lifecycle, targeting rules, budget allocation, and ad delivery coordination.

## Port

```
3001
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List all campaigns |
| POST | `/api/campaigns` | Create new campaign |
| GET | `/api/campaigns/:id` | Get campaign by ID |
| PUT | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign |
| GET | `/api/campaigns/:id/stats` | Get campaign statistics |
| POST | `/api/campaigns/:id/start` | Start campaign |
| POST | `/api/campaigns/:id/pause` | Pause campaign |

## Configuration

Environment variables:

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez-ads
```

## Setup Instructions

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Production build
npm run build
npm start

# Run tests
npm test
```

## Tech Stack

- Express.js
- TypeScript
- CORS
- Helmet (security headers)
