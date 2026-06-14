# REZ Intelligence Bridge

Integration bridge between REZ Media and REZ Intelligence services.

## Service Purpose

Bridges REZ Media advertising platform with REZ Intelligence for AI-powered insights, predictive analytics, and automated optimization. Handles data synchronization and event-driven communication between services.

## Port

```
3006
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sync/campaigns` | Sync campaign data |
| POST | `/api/sync/analytics` | Push analytics to Intelligence |
| GET | `/api/insights/campaigns/:id` | Get AI insights for campaign |
| GET | `/api/insights/audiences` | Get audience insights |
| POST | `/api/recommendations/apply` | Apply AI recommendation |
| GET | `/api/predictions/:type` | Get predictive analytics |
| POST | `/api/events` | Publish platform event |
| GET | `/api/status` | Bridge health status |

## Configuration

Environment variables:

```env
PORT=3006
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez-intelligence-bridge
INTELLIGENCE_API_URL=https://intelligence.api.example.com
INTELLIGENCE_API_KEY=your_api_key
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

## Data Flow

```
REZ Media Services → Intelligence Bridge → REZ Intelligence
                         ↓
                  Data Transformation
                  Event Publishing
                  Sync Management
```

## Tech Stack

- Express.js
- TypeScript
- Mongoose (MongoDB)
- Axios (HTTP client)
- Zod (validation)
- Dotenv (environment config)
