# Merchant Intelligence Service

A comprehensive business intelligence service that captures and analyzes everything about merchants for business operations.

## Features

- **Merchant Profile Management**: Create and update comprehensive merchant profiles
- **Revenue Analytics**: Track daily, weekly, monthly revenue patterns and growth
- **Order Intelligence**: Analyze order volume, frequency, and peak times
- **Customer Insights**: Inferred demographics, top customers, retention rates
- **Inventory Analysis**: Stock patterns, alerts, and restock predictions
- **Competitive Analysis**: Find and analyze similar merchants
- **Health Scoring**: Comprehensive health, growth, and engagement scores
- **Trend Analysis**: Historical trends and forecasting
- **Recommendations**: Personalized strategic recommendations

## API Endpoints

### Profile Management
- `POST /api/v1/merchant/profile` - Create or update merchant profile
- `GET /api/v1/merchant/:id/profile` - Get merchant profile
- `POST /api/v1/merchant/:id/sync` - Sync data from external services

### Insights
- `GET /api/v1/merchant/:id/insights` - Get comprehensive merchant insights
- `GET /api/v1/merchant/:id/recommendations` - Get personalized recommendations
- `GET /api/v1/merchant/:id/competitors` - Get competitor analysis

### Scoring
- `GET /api/v1/merchant/:id/health-score` - Get health, growth, engagement scores

### Events
- `POST /api/v1/merchant/:id/event` - Capture merchant behavior events

### Trends
- `GET /api/v1/merchant/:id/trends` - Get trend analysis

## Scoring System

### Health Score (0-100)
Weighted combination of:
- Revenue performance (25%)
- Order fulfillment (20%)
- Customer base (15%)
- Inventory health (15%)
- Customer feedback (15%)
- Activity level (10%)

### Growth Score (0-100)
Based on:
- Revenue growth
- Order growth
- Customer growth
- Market expansion

### Engagement Score (0-100)
Based on:
- Customer engagement
- Repeat purchase rate
- Response rate
- Update frequency

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Redis (optional, for caching)

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run in production
npm start
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Run with custom environment
docker-compose -f docker-compose.yml up -d
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=4012
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net
MONGODB_DB=merchant_intelligence
NODE_ENV=development
```

## API Documentation

Swagger documentation is available at `/api-docs` when the service is running.

## Architecture

```
src/
├── config/         # Configuration
├── connectors/     # External service connectors
├── controllers/    # Request handlers
├── middleware/     # Express middleware
├── models/         # MongoDB models
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript types
├── utils/          # Utilities
└── index.ts        # Application entry
```

## External Service Integration

The service integrates with:
- Order Service: Transaction data, order patterns
- Inventory Service: Stock levels, alerts
- Feedback Service: Customer feedback, ratings

## License

Proprietary - All rights reserved
