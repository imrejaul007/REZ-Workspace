# REZ Fitness Service

Gym & Fitness Center Management

**Port:** 4005

## Features

- Member management
- Class scheduling and bookings
- Trainer management
- Membership plans and billing
- Attendance tracking and check-in
- Rate limiting and authentication

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/memberships | List all memberships |
| POST | /api/memberships | Create membership |
| GET | /api/memberships/:id | Get membership details |
| POST | /api/billing/create | Create billing record |
| GET | /api/billing/history/:memberId | Get member billing history |
| POST | /api/attendance/checkin | Check in member |

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
| MONGODB_URI | mongodb://localhost:27017/fitness | MongoDB connection string |
| REDIS_URL | redis://localhost:6379 | Redis connection string |
| CORS_ORIGIN | - | Allowed CORS origins (comma-separated) |
| NODE_ENV | development | Environment (production/development) |
