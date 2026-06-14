# REZ-ab-testing

A/B Testing Service for REZ-Media - enables experimentation with experiments, variants, and statistical analysis for campaign optimization.

## Service Overview

- **Purpose**: Run controlled experiments to test variations in ads, landing pages, and user experiences
- **Port**: Configurable via `PORT` env (default from config)
- **Database**: MongoDB
- **Authentication**: Internal service token via `X-Internal-Token` header

## API Endpoints

### Health Checks
- `GET /health` - Service health status
- `GET /ready` - Readiness check (MongoDB connection)

### Experiments
- `POST /api/experiments` - Create new experiment
- `GET /api/experiments` - List experiments (paginated)
- `GET /api/experiments/:id` - Get experiment by ID
- `PATCH /api/experiments/:id` - Update experiment
- `DELETE /api/experiments/:id` - Delete experiment (draft only)
- `POST /api/experiments/:id/start` - Start experiment
- `POST /api/experiments/:id/pause` - Pause experiment
- `POST /api/experiments/:id/complete` - Complete experiment
- `POST /api/experiments/:id/archive` - Archive experiment

### Variants
- `POST /api/experiments/:id/variants` - Add variant
- `GET /api/experiments/:id/variants` - List variants
- `GET /api/experiments/:id/variants/:variantId` - Get variant
- `DELETE /api/experiments/:id/variants/:variantId` - Remove variant
- `POST /api/experiments/:id/allocate` - Allocate user to variant
- `POST /api/experiments/:id/impressions` - Batch track impressions
- `POST /api/experiments/:id/conversions` - Batch track conversions
- `GET /api/experiments/:id/preview` - Allocation preview

### Results & Analytics
- `GET /api/experiments/:id/results` - Get experiment results
- `GET /api/experiments/:id/stats` - Get variant statistics
- `GET /api/experiments/:id/timeseries` - Time series data
- `GET /api/experiments/:id/revenue` - Revenue breakdown
- `GET /api/experiments/:id/sample-size` - Sample size calculator
- `GET /api/experiments/:id/significance` - Significance analysis
- `GET /api/experiments/:id/daily` - Daily summary

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.2.0",
  "zod": "^3.22.4",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "morgan": "^1.10.0",
  "dotenv": "^16.4.5",
  "uuid": "^9.0.1",
  "jssha": "^3.3.1",
  "axios": "^1.6.0"
}
```

## Setup Instructions

### Prerequisites
- Node.js >= 18.0.0
- MongoDB instance
- Internal service token

### Environment Variables
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/rez-ab-testing
INTERNAL_SERVICE_TOKEN=your-internal-token
ALLOWED_ORIGINS=https://rez.money,https://admin.rez.money
```

### Installation
```bash
npm install
```

### Development
```bash
npm run dev     # Start with tsx watch
npm run build   # Compile TypeScript
npm start       # Start production server
npm test        # Run tests
npm run lint    # Lint code
```

## Features

- User bucketing with deterministic hashing
- Variant allocation with configurable weights
- Impression and conversion tracking
- Statistical significance calculation
- Time-series analytics
- Revenue attribution
- Sample size estimation
- Multiple experiment states (draft, running, paused, completed, archived)