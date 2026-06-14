# Risna Deal Service

Deal pipeline service for RisnaEstate - handles deal creation, stage management, offers, payments, and AI-powered scoring.

## Overview

The Risna Deal Service is a microservice responsible for managing the complete deal lifecycle in the RisnaEstate real estate platform. It provides:

- Deal CRUD operations
- Pipeline management (Kanban-style view)
- Offer and negotiation tracking
- Payment milestone management
- Property handover tracking
- AI-powered deal scoring
- Analytics and reporting

## Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose)
- **Cache:** Redis (via ioredis)
- **Validation:** Zod
- **Language:** TypeScript

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RISNA DEAL SERVICE                       │
├─────────────────────────────────────────────────────────────┤
│  Routes → Controllers → Services → Models                   │
├─────────────────────────────────────────────────────────────┤
│                    EXTERNAL SERVICES                        │
│  • RABTUL Auth Service (authentication)                     │
│  • RABTUL Wallet Service (payments)                         │
│  • REZ Intelligence (AI scoring)                            │
│  • Internal Risna Services (Lead, Property, Broker)         │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB 6.0+
- Redis 7.0+

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Configuration

Create a `.env` file with the following variables:

```env
# Service
NODE_ENV=development
PORT=4119
SERVICE_NAME=risna-deal-service

# MongoDB
MONGODB_URI=mongodb://localhost:27017/risna-deal
MONGODB_AUTH_SOURCE=admin

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret
INTERNAL_SERVICE_TOKEN=your-service-token

# External Services
REZ_AUTH_SERVICE_URL=http://localhost:4002
REZ_INTELLIGENCE_API_KEY=your-api-key
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Docker

```bash
# Build image
docker build -t risna-deal-service .

# Run container
docker run -p 4119:4119 --env-file .env risna-deal-service
```

## API Reference

### Base URL

```
http://localhost:4119/api/v1
```

### Authentication

All API endpoints (except health checks) require Bearer token authentication:

```
Authorization: Bearer <jwt_token>
```

### Endpoints

#### Health Check

```
GET /health
GET /healthz
GET /ready
GET /metrics
```

#### Deals

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/deals` | Create a new deal |
| GET | `/deals` | Query deals with filters |
| GET | `/deals/pipeline` | Get pipeline view |
| GET | `/deals/stats` | Get deal statistics |
| GET | `/deals/analytics` | Get analytics data |
| GET | `/deals/:dealId` | Get deal by ID |
| PATCH | `/deals/:dealId` | Update deal |
| DELETE | `/deals/:dealId` | Delete deal (soft) |

#### Stage Management

```
PATCH /deals/:dealId/stage
```

#### Offers

```
POST  /deals/:dealId/offers
PATCH /deals/:dealId/offers/:offerId
```

#### Payment Milestones

```
POST  /deals/:dealId/milestones
PATCH /deals/:dealId/milestones/:milestoneId
```

#### Handover

```
POST  /deals/:dealId/handover
PATCH /deals/:dealId/handover/:itemId
```

#### Timeline

```
GET /deals/:dealId/timeline
```

#### AI Scoring

```
POST /deals/:dealId/score
POST /deals/batch-score
```

#### Bulk Operations

```
PATCH /deals/bulk/stage
PATCH /deals/bulk/status
```

### Create Deal

```json
POST /deals
{
  "leadId": "507f1f77bcf86cd799439011",
  "propertyId": "507f1f77bcf86cd799439012",
  "brokerId": "507f1f77bcf86cd799439013",
  "buyerId": "buyer-123",
  "sellerId": "seller-456",
  "dealType": "sale",
  "propertyType": "apartment",
  "askingPrice": 5000000,
  "source": "direct"
}
```

### Update Stage

```json
PATCH /deals/:dealId/stage
{
  "stage": "negotiation",
  "notes": "Buyer agreed to schedule site visit"
}
```

### Add Offer

```json
POST /deals/:dealId/offers
{
  "offeredBy": "buyer",
  "price": 4800000,
  "notes": "First offer, negotiable"
}
```

## Deal Stages

```
inquiry → site_visit → offer_made → negotiation → agreement → registry → closed_won
                                                              ↓
                                                        closed_lost
```

## AI Scoring

The service includes AI-powered deal scoring with factors:

- **Budget Match (25%)** - How well the offer matches the asking price
- **Timeline Alignment (20%)** - Payment schedule and handover timeline
- **Broker Performance (20%)** - Historical broker success rate
- **Engagement (20%)** - Activity level and touchpoints
- **Stage Velocity (15%)** - Speed of progression through pipeline

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": [ ... ]
}
```

## Monitoring

### Health Checks

- `/health` - Detailed health with dependencies
- `/healthz` - Simple health status
- `/ready` - Kubernetes readiness probe
- `/metrics` - Memory and uptime metrics

## Project Structure

```
risna-deal-service/
├── src/
│   ├── config/
│   │   ├── mongodb.ts      # MongoDB connection
│   │   ├── redis.ts        # Redis client
│   │   └── logger.ts       # Winston logger
│   ├── controllers/
│   │   └── deal.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── rate-limiter.middleware.ts
│   ├── models/
│   │   └── deal.model.ts
│   ├── routes/
│   │   └── deals.routes.ts
│   ├── schemas/
│   │   └── deal.validation.ts
│   ├── services/
│   │   ├── deal.service.ts
│   │   └── ai-scoring.service.ts
│   ├── utils/
│   │   ├── errors.ts
│   │   └── deal.utils.ts
│   └── index.ts
├── .env.example
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## License

Internal use only - RisnaEstate