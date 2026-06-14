# REZ Restaurant CRM Service

Customer Management and Campaign Automation

**Port:** 4007

## Features

- Customer management
- Campaign automation
- Customer visit tracking
- CORS protection for production
- Legacy route compatibility

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/customers/* | Customer management routes |
| GET | /api/campaigns/* | Campaign routes |
| GET | /api/visits/* | Visit tracking routes (legacy) |

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
| CORS_ORIGIN | - | Allowed CORS origins (comma-separated) |
