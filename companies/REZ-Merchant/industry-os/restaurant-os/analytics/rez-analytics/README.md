# REZ Restaurant Analytics Service

Restaurant Reports and Dashboard Analytics

**Port:** Configured via config.ts

## Features

- Restaurant reports generation
- Dashboard analytics
- Protected routes with authentication
- Internal service routes
- Rate limiting for API protection
- Readiness checks
- Database connectivity

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /ready | Readiness check |
| GET | /api/reports/* | Reports routes |
| GET | /api/dashboard/* | Dashboard routes |
| GET | /api/protected | Protected route (auth required) |
| GET | /internal/reports/* | Internal reports (service auth required) |

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
| ALLOWED_ORIGINS | https://rez.money | Allowed CORS origins (comma-separated) |
