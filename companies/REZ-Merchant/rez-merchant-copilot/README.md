# REZ Merchant Copilot

AI-powered business intelligence service for merchants. Provides real-time health scores, actionable recommendations, competitor analysis, and operational decisions.

## Features

- **Health Scorer** - Comprehensive business health scoring based on orders, revenue, reviews, and inventory
- **Recommendation Engine** - AI-generated marketing, pricing, and operational recommendations
- **Competitor Analyzer** - Market intelligence and competitive positioning
- **Decision Engine** - Actionable operational decisions with expected impact

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **AI**: Claude API integration
- **Database**: MongoDB
- **Cache**: Redis

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | Yes |
| `NODE_ENV` | Environment | Yes |
| `ANTHROPIC_API_KEY` | Claude API key | Yes |
| `REZ_MERCHANT_SERVICE_URL` | Merchant service URL | Yes |
| `REZ_ORDER_SERVICE_URL` | Order service URL | Yes |
| `INTERNAL_TOKEN` | Internal service auth | Yes |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/merchant/:id/profile | Merchant profile with metrics |
| GET | /api/merchant/:id/insights | AI-generated insights |
| GET | /api/merchant/:id/recommendations | Actionable recommendations |
| GET | /api/merchant/:id/health-score | Comprehensive health score |
| GET | /api/merchant/:id/decisions | Operational decisions |
| GET | /api/merchant/:id/competitors | Competitor analysis |

## Health Score Response

```json
{
  "merchant_id": "merchant123",
  "health_score": {
    "overall": 85,
    "metrics": {
      "revenue": { "score": 88, "trend": "up" },
      "orders": { "score": 82, "trend": "up" },
      "retention": { "score": 79, "trend": "stable" }
    },
    "risk_level": "low"
  }
}
```

## Deployment

Deploy via Render Blueprint. Required environment variables must be configured in the Render dashboard.
