# REZ Mind Restaurant Service

Restaurant Mind AI Service - Pricing and Insights

**Port:** 4007

## Features

- AI-powered pricing recommendations
- Restaurant insights and analytics
- Internal API routes with service authentication
- Public API routes for external consumers
- Legacy route compatibility
- Structured JSON logging
- Rate limiting
- Graceful shutdown handling

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /ready | Readiness check |
| POST | /api/pricing/* | Pricing routes |
| POST | /api/insights/* | Insights routes |
| POST | /api/internal/pricing/* | Internal pricing (auth required) |
| POST | /api/internal/insights/* | Internal insights (auth required) |
| POST | /api/v1/pricing/* | Public pricing v1 |
| POST | /api/v1/insights/* | Public insights v1 |

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
| PORT | 4007 | Service port |
| NODE_ENV | development | Environment (production/development) |
