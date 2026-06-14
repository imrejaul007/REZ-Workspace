# rez-restaurant-reviews-service

**Port:** 4057

Restaurant reviews and ratings management with sentiment analysis and moderation.

## Features

- Review collection and display
- Sentiment analysis
- Moderation workflow
- Owner responses
- Analytics and insights
- Rating aggregation

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/reviews` | Submit review |
| GET | `/api/reviews/:id` | Get review |
| GET | `/api/restaurants/:id/reviews` | Restaurant reviews |
| PUT | `/api/reviews/:id/moderate` | Moderate review |
| POST | `/api/reviews/:id/response` | Owner response |
| PUT | `/api/reviews/:id/helpful` | Mark helpful |
| GET | `/api/analytics/:restaurantId` | Review analytics |

## Rating Distribution

- 5 Stars: Excellent
- 4 Stars: Very Good
- 3 Stars: Average
- 2 Stars: Below Average
- 1 Star: Poor

## Quick Start

```bash
npm install
npm run dev
npm test
```
