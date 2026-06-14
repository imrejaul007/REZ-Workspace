# REZ Healthcare Service

Healthcare Management System

**Port:** Configured via config (from config.ts)

## Features

- Patient management
- Appointment scheduling
- Prescription management
- Telemedicine support with session management
- Redis caching for session data
- Rate limiting for API protection
- Graceful shutdown handling

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/patients/* | Patient management routes |
| GET | /api/appointments/* | Appointment routes |
| GET | /api/prescriptions/* | Prescription routes |
| GET | /api/telemedicine/* | Telemedicine routes |

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
| NODE_ENV | development | Environment (production/development) |
| ALLOWED_ORIGINS | * | Allowed CORS origins (comma-separated) |
