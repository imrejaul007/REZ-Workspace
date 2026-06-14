# REZ Mind Spa Service - Technical Specification

## Overview

The **REZ Mind Spa Service** is an AI-powered intelligence layer for the spa industry, part of the REZ industry-os platform. It provides intelligent recommendations for spa services, customer preferences, pricing optimization, therapist matching, and wellness insights.

## Architecture

### Technology Stack
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3+
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose 8.x
- **Validation**: Zod 3.x
- **Logging**: Winston 3.x
- **Authentication**: JWT + Internal Token

### Port Configuration
- **Service Port**: 4051
- **Health Endpoints**: `/health`, `/health/live`, `/health/ready`

## Data Models

### SpaMind Session
Collection: `spa_mind_sessions`

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | MongoDB ID |
| merchantId | string | Indexed merchant identifier |
| sessionId | string | Unique session UUID |
| customerId | string | Customer identifier |
| analysis | object | AI analysis results |
| recommendations | array | Treatment/service recommendations |
| sentiment | object | Customer sentiment analysis |
| preferences | object | Customer preferences captured |
| lifetimeValuePrediction | number | Predicted CLV |
| createdAt | Date | Session creation timestamp |
| updatedAt | Date | Last update timestamp |

### Wellness Insight
Collection: `wellness_insights`

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | MongoDB ID |
| insightId | string | Unique insight UUID |
| merchantId | string | Merchant identifier |
| type | enum | ['treatment', 'upsell', 'retention', 'pricing'] |
| confidence | number | AI confidence score (0-1) |
| payload | object | Insight data |
| metadata | object | Additional context |
| expiresAt | Date | Insight expiration |
| createdAt | Date | Creation timestamp |

## API Endpoints

### 1. AI Consultation
**POST** `/api/v1/consult`

Accepts customer preferences and returns:
- Matched treatments
- Recommended therapists
- Upsell opportunities
- Customer lifetime value prediction
- Personalized wellness packages

### 2. Wellness Recommendations
**GET** `/api/v1/wellness/recommendations/:merchantId`

Returns personalized wellness recommendations based on:
- Historical visit data
- Seasonal patterns
- Customer preferences
- Treatment effectiveness

### 3. Pricing Optimization
**POST** `/api/v1/pricing/optimize`

Analyzes and suggests optimal pricing based on:
- Market positioning
- Seasonal demand
- Customer segments
- Competition analysis

### 4. Insights Dashboard
**GET** `/api/v1/insights/:merchantId`

Provides aggregated insights including:
- Treatment performance
- Customer behavior patterns
- Revenue optimization opportunities
- Retention metrics

## Middleware Stack

### Authentication
- JWT verification for external requests
- X-Internal-Token for service-to-service communication
- Rate limiting: 30 requests/minute for AI endpoints

### Error Handling
- Global error handler with Winston logging
- Structured error responses
- Async route wrapper

### Validation
- Zod schemas for all inputs
- Request validation middleware
- Response validation

## Service Layer

### SpaIntelligence
Core AI service providing:
- Treatment recommendation engine
- Customer segmentation
- Seasonal pattern analysis
- Sentiment analysis

### Recommendations Engine
- Collaborative filtering
- Content-based recommendations
- Personalized ranking

### Therapist Matcher
- Expertise matching
- Availability optimization
- Customer preference alignment

## Configuration

Environment variables managed via Zod schema:
- `PORT`: Service port (default: 4051)
- `MONGODB_URI`: Database connection string
- `JWT_SECRET`: JWT signing secret
- `INTERNAL_TOKEN`: Internal service token
- `NODE_ENV`: Environment (development/production)

## Security

- Helmet.js for HTTP headers
- CORS configured for production
- Rate limiting on all endpoints
- Input sanitization via Zod
- JWT + Internal token dual auth

## Graceful Shutdown

1. Stop accepting new connections
2. Complete in-flight requests
3. Close MongoDB connection
4. Exit process cleanly

## Logging

Winston configured with:
- Console transport (development)
- File transport (production)
- Structured JSON format
- Log levels: error, warn, info, debug
