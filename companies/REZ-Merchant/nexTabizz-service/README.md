# NexTaBizz Service

**Universal Business OS - Backend Service**

NexTaBizz is a multi-industry merchant platform that provides a comprehensive business management solution for restaurants, hotels, salons, retail stores, gyms, and many other industries.

## Overview

NexTaBizz Service provides a robust backend API for managing businesses across multiple industries. It offers:

- **Multi-tenant Architecture**: Support for multiple businesses per user
- **Industry-specific Modules**: Pre-configured modules for each industry type
- **Module Management**: Enable/disable features per business
- **Business Analytics**: Dashboard insights and performance metrics
- **RABTUL Integration**: Auth, wallet, and payment services

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Cache**: Redis (via ioredis)
- **Queue**: BullMQ
- **Validation**: Zod
- **Logging**: Winston

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB 6+
- Redis (optional, for caching)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Configuration

Edit `.env` file with your settings:

```env
PORT=4200
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/nextabizz
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
RABTUL_AUTH_SERVICE_URL=http://localhost:3001
RABTUL_WALLET_SERVICE_URL=http://localhost:3002
RABTUL_PAYMENT_SERVICE_URL=http://localhost:3003
```

### Running the Service

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start

# Run tests
npm test
```

## Project Structure

```
nexTabizz-service/
├── src/
│   ├── index.ts              # Entry point
│   ├── config/
│   │   └── index.ts         # Environment configuration
│   ├── routes/
│   │   ├── business.ts      # Business CRUD routes
│   │   ├── industry.ts      # Industry and module routes
│   │   └── analytics.ts     # Analytics routes
│   ├── services/
│   │   ├── business.service.ts
│   │   ├── industry.service.ts
│   │   └── analytics.service.ts
│   ├── models/
│   │   ├── Business.ts      # Business model
│   │   ├── Industry.ts      # Industry config model
│   │   └── Module.ts        # Module model
│   ├── middleware/
│   │   └── auth.ts          # JWT auth middleware
│   └── types/
│       └── index.ts         # TypeScript types
├── package.json
├── tsconfig.json
└── .env.example
```

## API Documentation

### Base URL

```
http://localhost:4200/api
```

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "nexTabizz-service",
  "version": "1.0.0",
  "timestamp": "2026-06-04T00:00:00.000Z",
  "uptime": 3600
}
```

### Business Endpoints

#### Create Business

```http
POST /api/business
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "My Restaurant",
  "industry": "restaurant",
  "phone": "+91-9876543210",
  "email": "contact@myrestaurant.com",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "currency": "INR",
  "timezone": "Asia/Kolkata"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "businessId": "biz_abc123def456",
    "name": "My Restaurant",
    "industry": "restaurant",
    "modules": ["menu", "pos", "kds", "inventory", "staff", "loyalty", "orders"],
    "ownerId": "user_123",
    "location": { ... },
    "contact": { ... },
    "isActive": true,
    "stats": { ... }
  },
  "message": "Business created successfully"
}
```

#### List Businesses

```http
GET /api/business?page=1&limit=20&industry=restaurant&isActive=true
Authorization: Bearer <token>
```

#### Get Business by ID

```http
GET /api/business/:id
Authorization: Bearer <token>
```

#### Update Business

```http
PUT /api/business/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Restaurant Name",
  "phone": "+91-9876543211"
}
```

#### Delete Business

```http
DELETE /api/business/:id
Authorization: Bearer <token>
```

### Module Endpoints

#### Get Business Modules

```http
GET /api/business/:id/modules
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "enabled": ["menu", "pos", "inventory"],
    "available": ["menu", "pos", "kds", "inventory", "staff", "loyalty", "orders"]
  }
}
```

#### Enable Module

```http
POST /api/business/:id/modules
Content-Type: application/json
Authorization: Bearer <token>

{
  "moduleId": "kds"
}
```

#### Disable Module

```http
DELETE /api/business/:id/modules/:moduleId
Authorization: Bearer <token>
```

### Industry Endpoints

#### List All Industries

```http
GET /api/industries
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "type": "restaurant",
      "name": "Restaurant",
      "description": "Restaurants, cafes, bars...",
      "icon": "🍽️",
      "color": "#FF6B6B",
      "modules": [...],
      "features": {
        "hasReservations": true,
        "hasInventory": true,
        "hasStaff": true,
        "hasLoyalty": true,
        "hasBookings": false,
        "hasMembership": false,
        "hasDelivery": true,
        "hasTableManagement": true
      }
    },
    ...
  ]
}
```

#### Get Industry Modules

```http
GET /api/industries/:type/modules
```

### Analytics Endpoints

#### Get Business Analytics

```http
GET /api/analytics/business/:id?period=month
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "totalRevenue": 150000,
    "totalOrders": 450,
    "totalCustomers": 180,
    "averageOrderValue": 333.33,
    "revenueGrowth": 15.5,
    "orderGrowth": 12.3,
    "customerGrowth": 8.7,
    "topProducts": [...],
    "salesByDay": [...],
    "revenueByModule": [...]
  }
}
```

## Supported Industries

| Industry | Description | Key Modules |
|----------|-------------|-------------|
| Restaurant | Restaurants, cafes, bars | Menu, POS, KDS, Inventory |
| Hotel | Hotels, resorts, motels | Rooms, Booking, Housekeeping |
| Salon | Hair salons, beauty parlors | Appointments, POS, Clients |
| Retail | Shops, boutiques, stores | POS, Inventory, Suppliers |
| Gym | Fitness centers, health clubs | Membership, Attendance, Classes |
| Spa | Spas, wellness centers | Appointments, Treatments, Booking |
| Healthcare | Clinics, medical practices | Patients, Appointments, Prescriptions |
| Education | Schools, training institutes | Students, Courses, Attendance |
| Real Estate | Agencies, property management | Properties, Leads, Viewings |
| Automotive | Car dealers, service centers | Vehicles, Service History, Parts |
| Grocery | Supermarkets, convenience stores | POS, Inventory, Barcode |
| Pharmacy | Pharmacies, drugstores | POS, Prescriptions, Inventory |
| Fashion | Clothing stores, boutiques | POS, Inventory, Clients |
| Fitness | Yoga, dance studios | Membership, Classes, Trainers |

## Industry Modules

### Core Modules
- **POS**: Point of Sale for processing sales
- **Orders**: Order management from creation to fulfillment
- **Menu**: Menu management (restaurant)
- **Rooms**: Room management (hotel)
- **Appointments**: Appointment scheduling

### Operations Modules
- **Inventory**: Stock and supplier management
- **KDS**: Kitchen Display System
- **Table Management**: Restaurant seating
- **Delivery**: Delivery order management
- **Housekeeping**: Room cleaning management
- **Attendance**: Attendance tracking

### Customer Modules
- **Loyalty**: Customer loyalty programs
- **Clients**: Client management
- **Reservations**: Booking management
- **Bookings**: Service bookings

### Management Modules
- **Staff**: Employee management
- **Analytics**: Business insights
- **Reporting**: Detailed reports
- **Settings**: Business configuration

## RABTUL Integration

NexTaBizz integrates with RABTUL-TECHNOLOGIES for core services:

### Authentication
- Uses RABTUL Auth Service for user authentication
- JWT tokens validated via middleware

### Wallet Integration
- Business wallet management
- Transaction processing

### Payment Integration
- Payment gateway connections
- Invoice management

## Error Handling

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message describing the issue"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window**: 15 minutes
- **Max Requests**: 100 per window

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1622500000
```

## License

Proprietary - REZ-Merchant
