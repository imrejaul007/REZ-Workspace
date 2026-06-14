# REZ Fitness Access Service

QR-based gym access and check-in system

**Port:** 4015

## Features

- QR-based gym access control
- Member check-in/check-out tracking
- Access statistics and reporting
- Integration with fitness membership system

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/access/* | Access control routes |
| GET | /api/members/* | Member management routes |
| GET | /api/stats/* | Statistics routes |

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
| PORT | 4015 | Service port |
| MONGODB_URI | mongodb://localhost:27017/fitness-access | MongoDB connection string |
| CORS_ORIGIN | - | Allowed CORS origins (comma-separated) |
