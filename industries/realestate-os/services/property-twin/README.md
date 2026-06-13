# Property Twin Service

**Part of Real Estate OS**

Digital twin service for real estate properties, enabling comprehensive property data management, market analytics, and PropFlow AI integration.

## Overview

The Property Twin Service provides a centralized digital representation of real estate properties, including:

- **Property Details**: Location, physical attributes, features, and condition
- **Listing Management**: Price tracking, status updates, and market history
- **Financial Data**: Current values, estimates, taxes, and insurance
- **Market Analytics**: Price comparisons, competition indices, and trends
- **Media Management**: Photos, videos, 3D tours, and floor plans
- **PropFlow AI Integration**: Investment scoring and price forecasting

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Property Twin Service                        │
│                           Port: 8843                             │
├─────────────────────────────────────────────────────────────────┤
│  Controllers │ Services │ Models │ Middleware │ Utils           │
├─────────────────────────────────────────────────────────────────┤
│                      Express.js REST API                         │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB          │  Redis          │  RabbitMQ                 │
│  (Data Store)      │  (Caching)      │  (Event Bus)              │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- MongoDB 7+
- Redis 7+

### Installation

```bash
# Install dependencies
npm install

# Build
npm run build

# Run development server
npm run dev
```

### Docker

```bash
# Build image
docker build -t property-twin-service .

# Run with docker-compose
docker-compose up -d

# Run staging environment
docker-compose -f docker-compose.staging.yml up -d
```

## API Endpoints

### Property Twin Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/property` | Create property twin |
| GET | `/api/twins/property` | Query property twins |
| GET | `/api/twins/property/:id` | Get property by propertyId |
| GET | `/api/twins/property/twin/:twinId` | Get property by twinId |
| PUT | `/api/twins/property/:id` | Update property |
| PATCH | `/api/twins/property/:id/status` | Update listing status |
| PATCH | `/api/twins/property/:id/price` | Update price |
| POST | `/api/twins/property/:id/media` | Add media |
| POST | `/api/twins/property/:id/tour` | Add 3D tour URL |
| POST | `/api/twins/property/:id/floorplan` | Add floor plan |
| PATCH | `/api/twins/property/:id/agent` | Update agent |
| GET | `/api/twins/property/:id/propflow` | Get PropFlow insights |
| DELETE | `/api/twins/property/:id` | Archive property |
| DELETE | `/api/twins/property/:id/permanent` | Permanent delete |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/twins/property/stats/market` | Market statistics |
| GET | `/api/twins/property/stats/price-per-sqft` | Price per sqft stats |
| GET | `/api/twins/property/search` | Full-text search |

### Health Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |

## Environment Variables

```env
# Service Configuration
PORT=8843
NODE_ENV=development
HOST=0.0.0.0
SERVICE_NAME=property-twin-service

# MongoDB
MONGODB_URI=mongodb://localhost:27017/property-twin-service

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_URI=amqp://localhost:5672

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# Service URLs
PROPFLOW_SERVICE_URL=http://localhost:8844
MARKETPLACE_SERVICE_URL=http://localhost:8845
```

## Property Twin Schema

```typescript
interface IPropertyTwin {
  twinId: string;                    // Unique twin identifier
  propertyId: string;                // External property ID
  
  listing: {
    status: 'active' | 'pending' | 'under_contract' | 'sold' | 'off_market';
    listingPrice: number;
    askingPrice?: number;
    priceHistory: Array<{ price: number; date: Date; event: string }>;
    daysOnMarket: number;
  };
  
  location: {
    address: IAddress;
    coordinates: { lat: number; lng: number };
    areaId?: string;
    neighborhood?: string;
  };
  
  physical: {
    propertyType: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'land' | 'commercial';
    bedrooms: number;
    bathrooms: number;
    interiorSqft?: number;
    yearBuilt?: number;
  };
  
  financial: {
    currentValue?: number;
    propflowEstimate?: number;
    propertyTax?: number;
  };
  
  market: {
    priceTrend: 'increasing' | 'stable' | 'decreasing';
    marketTemperature: 'hot' | 'warm' | 'cool' | 'cold';
    competitionIndex?: number;
  };
  
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastActivity: Date;
    twinVersion: string;
  };
}
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch

# Integration tests
npm run test:integration
```

## Kubernetes Deployment

```bash
# Apply deployment
kubectl apply -f deployment/kubernetes/deployment.yaml

# Check status
kubectl get pods -n realestate-os

# View logs
kubectl logs -n realestate-os -l app=property-twin-service
```

## Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Property Operations | 2000 | per minute |
| Search | 50 | per minute |
| PropFlow AI | 200 | per minute |

## Error Codes

| Code | Description |
|------|-------------|
| `PROPERTY_NOT_FOUND` | Property does not exist |
| `INVALID_STATUS` | Invalid listing status |
| `INVALID_ID_FORMAT` | Invalid ID format |
| `DUPLICATE_PROPERTY` | Property already exists |

## Contributing

1. Create a feature branch
2. Write tests for new features
3. Ensure all tests pass
4. Submit a pull request

## License

Internal use only - RTMN
