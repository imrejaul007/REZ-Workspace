# REZ Food Safety Service

FSSAI Compliance & HACCP Management

**Port:** 4035

## Features

- FSSAI compliance management
- HACCP (Hazard Analysis Critical Control Point) documentation
- Temperature monitoring for food storage
- Expiry tracking and alerts
- Incident management and reporting
- Allergen management
- Automated cron jobs for expiry checks

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/temperature/* | Temperature monitoring routes |
| GET | /api/expiry/* | Expiry tracking routes |
| GET | /api/haccp/* | HACCP documentation routes |
| GET | /api/incidents/* | Incident management routes |
| GET | /api/allergens/* | Allergen management routes |

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
| PORT | 4035 | Service port |
| MONGODB_URI | mongodb://localhost:27017/food-safety | MongoDB connection string |
| CORS_ORIGIN | - | Allowed CORS origins (comma-separated) |
| NODE_ENV | development | Environment (production/development) |
