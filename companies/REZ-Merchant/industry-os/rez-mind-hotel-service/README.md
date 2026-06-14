# REZ Mind Hotel Service

AI-powered Hotel Intelligence Service

**Port:** 4017

## Features

- AI-powered hotel recommendations
- Dynamic pricing optimization
- Guest satisfaction prediction
- Service SLA prediction
- Event ingestion and analytics
- Knowledge base management
- Calendar/event management
- Integration with REZ-Intelligence platform
- Signal Aggregator integration
- Predictive Engine integration
- Unified Profile integration
- Realtime Segments integration
- Intent Predictor integration

## REZ-Intelligence Integrations

| Service | Port | Purpose |
|---------|------|---------|
| Signal Aggregator | 4121 | Event signal aggregation |
| Predictive Engine | 4123 | ML predictions |
| Unified Profile | 4120 | Guest profile unification |
| Realtime Segments | 4126 | Real-time guest segments |
| Intent Predictor | 4018 | Guest intent prediction |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /health/ready | Readiness check |
| POST | /api/events/* | Event ingestion routes |
| GET | /api/analytics/* | Analytics routes |
| GET | /api/calendar/* | Calendar routes |
| GET | /api/knowledge/* | Knowledge base routes |
| POST | /api/ai/recommendations | Get personalized recommendations |
| POST | /api/ai/pricing | Get dynamic pricing |
| POST | /api/ai/satisfaction | Predict guest satisfaction |
| POST | /api/ai/sla-predict | Predict service SLA |
| GET | /ai/recommendations/:userId | Get "For You" recommendations |
| GET | /ai/upsells/:bookingId | Get upsell recommendations |
| GET | /ai/predictions/:userId | Predict rebooking likelihood |

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
| PORT | 4017 | Service port |
| MONGODB_URI | mongodb://localhost:27017/rez_mind_hotel | MongoDB connection string |
| REZ_INTELLIGENCE_URL | http://localhost:4121 | REZ-Intelligence Signal Aggregator URL |
| INTENT_PREDICTOR_URL | http://localhost:4018 | Intent Predictor URL |
| UNIFIED_PROFILE_URL | http://localhost:4120 | Unified Profile URL |
| CORS_ORIGIN | http://localhost:3000 | Allowed CORS origins |
