# REZ Mind Fitness Service

Fitness Mind AI Service - Member Insights and Recommendations

**Port:** 4010

## Features

- AI-powered workout recommendations
- Class suggestions based on member history
- Trainer matching
- Member engagement scoring
- Churn prediction
- Activity metrics analysis
- Batch processing for engagement and churn analysis

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | Service info |
| GET | /api/insights/health | Health check |
| POST | /api/insights/workouts/recommendations | Get workout recommendations |
| POST | /api/insights/classes/suggestions | Get class suggestions |
| POST | /api/insights/trainers/match | Match trainer to member |
| POST | /api/insights/engagement/score | Calculate engagement score |
| POST | /api/insights/churn/predict | Predict churn risk |
| POST | /api/insights/activity/metrics | Get activity metrics |
| POST | /api/insights/batch/engagement | Batch engagement analysis |
| POST | /api/insights/batch/churn | Batch churn prediction |

## Quick Start

```bash
# Install dependencies
npm install

# Start the service
npm start

# Development mode with hot reload
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4010 | Service port |
| NODE_ENV | development | Environment (production/development) |
