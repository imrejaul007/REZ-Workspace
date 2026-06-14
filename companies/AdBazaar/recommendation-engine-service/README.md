# Recommendation Engine Service

Product/content recommendations for AdBazaar.

## Features

- Collaborative filtering
- Content-based recommendations
- Hybrid recommendation engine
- Trending/popular items
- Real-time personalization
- Feedback tracking

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/recommendations/:userId | Get recommendations |
| POST | /api/recommendations/:userId | Generate recommendations |
| POST | /api/recommendations/:userId/feedback | Record feedback |
| GET | /api/recommendations/:userId/history | Get user history |
| GET | /api/recommendations/id/:id | Get by recommendation ID |

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/recommendation-engine-service
npm install
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5095 | Service port |
| MONGODB_URI | mongodb://localhost:27017/recommendation-engine | MongoDB connection |