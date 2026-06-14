# REZ Mind Spa Service

AI-powered intelligence service for the spa industry - part of the REZ industry-os platform.

## Overview

The REZ Mind Spa Service provides intelligent recommendations and insights for spa businesses:

- **Treatment Recommendations**: AI-powered matching of customers to optimal treatments
- **Therapist Matching**: Connect customers with the best-suited therapists
- **Pricing Optimization**: Data-driven pricing strategies
- **Wellness Insights**: Deep analytics on customer behavior and preferences
- **Customer Lifetime Value**: Predictive analytics for customer value

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

```bash
# Clone the repository
cd rez-mind-spa-service

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Configuration

Create a `.env` file with:

```env
PORT=4051
MONGODB_URI=mongodb://localhost:27017/rez_spa
JWT_SECRET=your-jwt-secret
INTERNAL_TOKEN=your-internal-token
NODE_ENV=development
LOG_LEVEL=info
```

## API Endpoints

### Health Check

```
GET /health
GET /health/live
GET /health/ready
```

### AI Consultation

```
POST /api/v1/consult
```

Request body:
```json
{
  "merchantId": "merchant_123",
  "customerId": "customer_456",
  "preferences": {
    "skinType": "sensitive",
    "concerns": ["dryness", "aging"],
    "budget": "mid-range",
    "preferredTime": "afternoon",
    "duration": 60
  },
  "pastVisits": [
    {
      "treatmentId": "treat_001",
      "date": "2024-01-15",
      "satisfaction": 4.5
    }
  ]
}
```

### Wellness Recommendations

```
GET /api/v1/wellness/recommendations/:merchantId
```

Query parameters:
- `customerId` (optional): Filter for specific customer
- `limit` (optional): Max recommendations (default: 10)

### Pricing Optimization

```
POST /api/v1/pricing/optimize
```

Request body:
```json
{
  "merchantId": "merchant_123",
  "treatmentId": "treat_001",
  "currentPrice": 80,
  "factors": {
    "seasonality": true,
    "competition": true,
    "demand": true
  }
}
```

### Insights Dashboard

```
GET /api/v1/insights/:merchantId
```

Query parameters:
- `period` (optional): '7d', '30d', '90d' (default: '30d')
- `type` (optional): Filter by insight type

## Authentication

### JWT Token

Include in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Internal Token

For service-to-service communication:
```
X-Internal-Token: <your-internal-token>
```

## Rate Limiting

- AI endpoints: 30 requests/minute
- General endpoints: 100 requests/minute

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Project Structure

```
rez-mind-spa-service/
├── src/
│   ├── config/         # Configuration files
│   ├── models/         # Mongoose models
│   ├── routes/         # Express routes
│   ├── services/       # Business logic
│   ├── middleware/     # Express middleware
│   ├── utils/          # Utilities
│   ├── integrations/   # External integrations
│   ├── types/          # TypeScript types
│   └── index.ts        # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

## License

UNLICENSED - Proprietary to REZ Team
