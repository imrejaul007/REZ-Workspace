# Merchant Twin Service

Behavioral twins for merchants to help advertisers understand merchant audiences.

## Overview

The Merchant Twin Service creates detailed behavioral profiles of merchants, enabling advertisers to understand:
- Merchant customer demographics and behavior
- Advertising effectiveness and spend patterns
- Growth potential and investment readiness
- Target audience insights
- Competitor overlap analysis

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Environment Variables

```env
PORT=4807
MONGODB_URI=mongodb://localhost:27017/merchant-twin
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=https://rez.money,https://admin.rez.money,https://ads.rez.money
LOG_LEVEL=info
```

## API Endpoints

### Create Merchant Twin
```http
POST /api/merchant-twin/create
Content-Type: application/json

{
  "merchantId": "merchant-123",
  "business": {
    "name": "Test Restaurant",
    "category": "restaurant",
    "subcategory": "casual dining",
    "location": {
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India"
    },
    "size": "medium",
    "rating": 4.5,
    "yearsActive": 5
  }
}
```

### Get Merchant Twin
```http
GET /api/merchant-twin/:merchantId
```

### Update Merchant Twin
```http
PUT /api/merchant-twin/:merchantId
Authorization: Bearer <token>
Content-Type: application/json

{
  "business": { "rating": 4.8 },
  "growth": { "monthlyGrowth": 12 }
}
```

### Get Customer Audience Insights
```http
GET /api/merchant-twin/:merchantId/audience
```

### Get Advertising Insights
```http
GET /api/merchant-twin/:merchantId/insights
```

### List Merchant Twins
```http
GET /api/merchant-twin?page=1&limit=20&category=restaurant&city=Mumbai
```

### Find Similar Merchants
```http
GET /api/merchant-twin/:merchantId/similar?limit=10
```

## Health Checks

```bash
# Health check
curl http://localhost:4807/health

# Readiness check
curl http://localhost:4807/ready

# Prometheus metrics
curl http://localhost:4807/metrics
```

## Architecture

```
merchant-twin-service/
├── src/
│   ├── config/          # Configuration
│   ├── middleware/      # Express middleware (auth, validation, metrics)
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript interfaces
│   ├── utils/           # Utilities (logger)
│   └── index.ts         # Main entry point
├── tests/               # Jest tests
├── package.json
└── tsconfig.json
```

## Features

- **Merchant Profiling**: Create detailed behavioral twins for merchants
- **Audience Insights**: Analyze customer demographics and behavior
- **Advertising Intelligence**: Track ad spend, channels, and effectiveness
- **Growth Prediction**: Calculate expansion potential and investment readiness
- **Competitor Analysis**: Determine audience overlap with competitors
- **Similar Merchant Discovery**: Find merchants with similar profiles

## Schema

### MerchantTwin
```typescript
interface MerchantTwin {
  merchantId: string;
  twinId: string;
  business: {
    name: string;
    category: string;
    subcategory: string;
    location: { city: string; state: string; country: string };
    size: 'small' | 'medium' | 'large';
    rating: number;
    yearsActive: number;
  };
  customerProfile: {
    demographics: {
      ageDistribution: { range: string; percentage: number }[];
      genderDistribution: Record<string, number>;
      incomeLevel: 'low' | 'medium' | 'high';
    };
    behavioral: {
      avgVisitFrequency: number;
      avgOrderValue: number;
      peakHours: string[];
      popularDays: string[];
      repeatCustomerRate: number;
    };
    size: number;
  };
  advertising: {
    adSpendHistory: { month: string; amount: number }[];
    preferredChannels: string[];
    targetAudience: string[];
    competitorOverlap: number;
    adEffectiveness: number;
  };
  growth: {
    monthlyGrowth: number;
    seasonalPatterns: string[];
    expansionPotential: number;
    investmentReadiness: 'low' | 'medium' | 'high';
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## License

Private - AdBazaar