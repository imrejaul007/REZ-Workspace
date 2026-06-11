# PROPFLOW - Real Estate AI Operating System

## Overview

PROPFLOW is a production-ready Real Estate AI Operating System built with Node.js, Express, MongoDB, and TypeScript. It features AI-powered agents for property management, lead qualification, and deal management.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### AI Employees

1. **Property Agent** - Property matching, recommendations, and market analysis
2. **Lead Agent** - Lead qualification, scoring, nurturing, and segmentation
3. **Site Visit Agent** - Visit scheduling, reminders, and feedback collection

### Core Capabilities

- Property CRUD with advanced filtering
- Lead management with AI-powered qualification
- Site visit scheduling and management
- Deal pipeline with stage tracking
- Real-time analytics dashboard
- JWT authentication with role-based access
- Rate limiting and security middleware
- Comprehensive logging with Winston
- Graceful shutdown and error handling
- Zod validation for all endpoints
- MongoDB with optimized indexes

## Tech Stack

- **Runtime**: Node.js >= 18
- **Framework**: Express 4.21
- **Language**: TypeScript 5.6
- **Database**: MongoDB with Mongoose 8.6
- **Validation**: Zod 3.23
- **Security**: Helmet, Rate Limiting, JWT
- **Logging**: Winston with file rotation
- **Scheduling**: node-cron

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB 4.4+
- npm or yarn

### Installation

```bash
# Navigate to project directory
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/hojai-ai/industry-ai/propflow

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your MongoDB URI and secrets

# Start development server
npm run dev

# Or build and start production
npm run build
npm start
```

## API Endpoints

### Health Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Full health check |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai/status` | AI system status |
| POST | `/api/ai/property/match` | Find matching properties |
| POST | `/api/ai/lead/qualify` | Qualify a lead |
| POST | `/api/ai/visit/schedule` | Schedule site visit |

### Properties

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties` | List all properties |
| GET | `/api/properties/:id` | Get property by ID |
| POST | `/api/properties` | Create property |
| PATCH | `/api/properties/:id` | Update property |
| DELETE | `/api/properties/:id` | Delete property |

### Leads

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | List all leads |
| GET | `/api/leads/:id` | Get lead by ID |
| POST | `/api/leads` | Create lead |
| PATCH | `/api/leads/:id` | Update lead |
| POST | `/api/leads/:id/qualify` | Qualify lead |

### Site Visits

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/visits` | List all visits |
| POST | `/api/visits` | Schedule visit |
| PATCH | `/api/visits/:id` | Update visit |
| POST | `/api/visits/:id/feedback` | Submit feedback |

### Deals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deals` | List all deals |
| POST | `/api/deals` | Create deal |
| PATCH | `/api/deals/:id/stage` | Update deal stage |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/analytics/properties` | Property analytics |
| GET | `/api/analytics/leads` | Lead analytics |
| GET | `/api/analytics/deals` | Deal analytics |

## Data Models

### Property

```typescript
{
  title: string,
  type: 'apartment' | 'villa' | 'plot' | 'commercial' | 'office',
  status: 'available' | 'sold' | 'reserved' | 'under-construction',
  price: number,
  location: { address, city, pincode, locality },
  specifications: { bedrooms, bathrooms, area, areaUnit, floor, totalFloors },
  amenities: string[],
  ownerId: string
}
```

### Lead

```typescript
{
  name: string,
  phone: string,
  email: string,
  source: 'website' | 'phone' | 'walkin' | 'referral' | 'agent',
  budget: { min, max },
  status: 'new' | 'contacted' | 'qualified' | 'visiting' | 'negotiating' | 'closed-won' | 'closed-lost',
  score: number,        // 0-100
  scoreTier: 'hot' | 'warm' | 'cold'
}
```

### SiteVisit

```typescript
{
  propertyId: ObjectId,
  leadId: ObjectId,
  date: Date,
  time: string,
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled',
  feedback: string,
  rating: number
}
```

### Deal

```typescript
{
  propertyId: ObjectId,
  leadId: ObjectId,
  offerPrice: number,
  stage: 'negotiating' | 'accepted' | 'documents' | 'registered' | 'closed',
  probability: number,
  commission: number
}
```

## Environment Variables

```env
PORT=4807
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/propflow
JWT_SECRET=your-secret-key
CORS_ORIGIN=*
LOG_LEVEL=info
```

## License

MIT License
