# ReZ Automotive Service

Industry vertical merchant service for automotive businesses including car dealers, service centers, and spare parts shops.

## Overview

ReZ Automotive Service provides comprehensive management for:
- Vehicle inventory and sales
- Service records and maintenance tracking
- Appointment scheduling
- Spare parts inventory management

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port (default: 4060) | Yes |
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | JWT authentication secret | Yes |
| INTERNAL_TOKEN | Internal API authentication token | Yes |
| RABTUL_API_KEY | RABTUL notification service API key | Yes |
| RABTUL_BASE_URL | RABTUL API base URL | No |

## API Endpoints

### Health
- `GET /health` - Service health check
- `GET /health/ready` - Readiness check with DB connection

### Vehicles
- `GET /api/v1/vehicles` - List all vehicles (with pagination, filters)
- `GET /api/v1/vehicles/:vehicleId` - Get vehicle by ID
- `POST /api/v1/vehicles` - Create new vehicle
- `PUT /api/v1/vehicles/:vehicleId` - Update vehicle
- `DELETE /api/v1/vehicles/:vehicleId` - Delete vehicle
- `GET /api/v1/vehicles/search` - Search vehicles
- `GET /api/v1/vehicles/merchant/:merchantId` - Get merchant vehicles

### Service Records
- `GET /api/v1/service-records` - List service records
- `GET /api/v1/service-records/:recordId` - Get service record
- `POST /api/v1/service-records` - Create service record
- `PUT /api/v1/service-records/:recordId` - Update service record
- `DELETE /api/v1/service-records/:recordId` - Delete service record
- `GET /api/v1/service-records/vehicle/:vehicleId` - Get vehicle service history

### Appointments
- `GET /api/v1/appointments` - List appointments
- `GET /api/v1/appointments/:appointmentId` - Get appointment
- `POST /api/v1/appointments` - Schedule appointment
- `PUT /api/v1/appointments/:appointmentId` - Update appointment
- `DELETE /api/v1/appointments/:appointmentId` - Cancel appointment
- `GET /api/v1/appointments/calendar` - Calendar view
- `GET /api/v1/appointments/merchant/:merchantId` - Get merchant appointments

### Spare Parts
- `GET /api/v1/spare-parts` - List spare parts
- `GET /api/v1/spare-parts/:partId` - Get spare part
- `POST /api/v1/spare-parts` - Add spare part
- `PUT /api/v1/spare-parts/:partId` - Update spare part
- `DELETE /api/v1/spare-parts/:partId` - Delete spare part
- `GET /api/v1/spare-parts/low-stock` - Get low stock alerts
- `GET /api/v1/spare-parts/category/:category` - Get parts by category

## Authentication

All API endpoints require authentication via:
- JWT Bearer token in Authorization header
- X-Internal-Token header for internal service calls

## Rate Limiting

- Read operations: 100 requests per minute
- Write operations: 50 requests per minute

## Architecture

```
src/
├── config/          # Configuration and environment validation
├── integrations/    # RABTUL notification integration
├── middleware/      # Auth, error handling, validation
├── models/          # Mongoose database models
├── routes/          # Express route handlers
├── services/        # Business logic
├── types/           # TypeScript interfaces
└── utils/           # Logger and utilities
```

## License

Proprietary - ReZ Platform