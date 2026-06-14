# REZ Unified Booking Service

A unified facade service connecting all 17 industry verticals, providing a single API for all booking types across the REZ ecosystem.

## Overview

This service acts as a unified gateway over all industry-specific booking services, enabling:
- **Single API** for all verticals (restaurant, hotel, salon, spa, gym, etc.)
- **Cross-vertical availability search**
- **Unified booking management** (create, update, cancel)
- **Integrated payment processing**
- **Multi-channel notifications**
- **Calendar synchronization**
- **Waitlist management**

## Supported Verticals

| Vertical | Service Name | Port | Booking Fields |
|----------|--------------|------|----------------|
| restaurant | Restaurant Booking | 3001 | date, time, partySize, specialRequests |
| hotel | Hotel Booking | 4010 | checkIn, checkOut, roomType, guests |
| salon | Salon Booking | 4009 | date, time, serviceIds, stylistId |
| spa | Spa Booking | 4049 | date, time, serviceId, therapistId |
| gym | Gym Booking | 4011 | classId, date, time |
| education | Education Booking | 4054 | courseId, batchId, startDate |
| events | Events Booking | 4055 | eventId, ticketType, quantity |
| automotive | Automotive Booking | 4060 | serviceType, date, time, vehicleId |
| medical | Medical Booking | 4056 | date, time, doctorId, serviceType |
| tours | Tours Booking | 4057 | tourId, date, participants |
| rentals | Rentals Booking | 4058 | itemId, startDate, endDate |
| entertainment | Entertainment Booking | 4059 | eventId, seats, showTime |
| cleaning | Cleaning Booking | 4061 | date, time, serviceType, address |
| repair | Repair Booking | 4062 | date, serviceType, deviceInfo |
| childcare | Childcare Booking | 4063 | date, time, duration, ageGroup |
| petcare | Petcare Booking | 4064 | date, serviceType, petInfo |
| legal | Legal Booking | 4065 | date, time, consultationType |

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB 6.0+
- Redis (optional, for caching)

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Build TypeScript
npm run build

# Start service
npm start
```

### Configuration

Create a `.env` file with the following variables:

```env
# Service Configuration
PORT=4072
NODE_ENV=production
INTERNAL_API_KEY=your-secure-api-key

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rez-unified-booking

# Vertical Service URLs (optional, defaults provided)
RESTAURANT_BOOKING_URL=http://localhost:3001
HOTEL_BOOKING_URL=http://localhost:4010
SALON_BOOKING_URL=http://localhost:4009
SPA_BOOKING_URL=http://localhost:4049
GYM_BOOKING_URL=http://localhost:4011
EDUCATION_BOOKING_URL=http://localhost:4054
EVENTS_BOOKING_URL=http://localhost:4055
AUTOMOTIVE_BOOKING_URL=http://localhost:4060
MEDICAL_BOOKING_URL=http://localhost:4056
TOURS_BOOKING_URL=http://localhost:4057
RENTALS_BOOKING_URL=http://localhost:4058
ENTERTAINMENT_BOOKING_URL=http://localhost:4059
CLEANING_BOOKING_URL=http://localhost:4061
REPAIR_BOOKING_URL=http://localhost:4062
CHILDCARE_BOOKING_URL=http://localhost:4063
PETCARE_BOOKING_URL=http://localhost:4064
LEGAL_BOOKING_URL=http://localhost:4065

# RABTUL Integration
RABTUL_API_KEY=your-rabtul-api-key
RABTUL_WEBHOOK_URL=https://rabtul.rezactions.com/webhook

# Logging
LOG_LEVEL=info
```

## API Reference

### Health Check

```http
GET /health
GET /health/ready
GET /health/live
```

### Availability Search

```http
# Search specific vertical
GET /api/v1/search/availability?vertical=restaurant&merchantId=123&date=2024-01-15&partySize=4

# Search all verticals for a date
GET /api/v1/search/availability/all?date=2024-01-15&startTime=19:00&partySize=4

# Search merchants by location
GET /api/v1/search/merchants?vertical=restaurant&city=NYC&radius=10
```

### Booking Management

```http
# Create booking
POST /api/v1/bookings
{
  "userId": "user-123",
  "merchantId": "merchant-456",
  "vertical": "restaurant",
  "type": "table",
  "startDateTime": "2024-01-15T19:00:00Z",
  "duration": 90,
  "partySize": 4,
  "bookingData": {
    "specialRequests": "Window seat"
  }
}

# List user bookings
GET /api/v1/bookings?userId=user-123&vertical=restaurant&status=confirmed

# Get booking details
GET /api/v1/bookings/:bookingId

# Update booking
PUT /api/v1/bookings/:bookingId
{
  "startDateTime": "2024-01-16T19:00:00Z",
  "notes": "Updated request"
}

# Cancel booking
POST /api/v1/bookings/:bookingId/cancel
{
  "reason": "Change of plans"
}

# Get reschedule options
GET /api/v1/bookings/:bookingId/reschedule
```

### Payment

```http
# Process payment
POST /api/v1/bookings/:bookingId/pay
{
  "paymentMethod": "card",
  "paymentDetails": {
    "token": "tok_xxxx"
  }
}

# Process refund
POST /api/v1/bookings/:bookingId/refund
{
  "amount": 50.00,
  "reason": "Partial cancellation"
}
```

### Waitlist

```http
# Add to waitlist
POST /api/v1/waitlist
{
  "userId": "user-123",
  "vertical": "restaurant",
  "merchantId": "merchant-456",
  "date": "2024-01-15",
  "time": "19:00",
  "partySize": 4
}

# Get user's waitlist entries
GET /api/v1/waitlist/user/:userId

# Remove from waitlist
DELETE /api/v1/waitlist/:entryId

# Notify user (internal)
POST /api/v1/waitlist/:entryId/notify
```

### Calendar

```http
# User's unified calendar
GET /api/v1/calendars/user/:userId?fromDate=2024-01-01&toDate=2024-01-31&vertical=restaurant

# Merchant calendar
GET /api/v1/calendars/merchant/:merchantId?fromDate=2024-01-01&toDate=2024-01-31&status=confirmed
```

### Vertical Proxy

```http
# List all verticals
GET /api/v1/verticals

# Proxy to vertical service
GET /api/v1/verticals/:vertical/bookings/:bookingId
PUT /api/v1/verticals/:vertical/bookings/:bookingId
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Booking with ID xyz not found",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-123"
  }
}
```

## Booking Status Flow

```
pending -> confirmed -> in_progress -> completed
    |         |
    v         v
 cancelled  no_show
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request parameters |
| UNAUTHORIZED | 401 | Invalid or missing authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| BOOKING_NOT_FOUND | 404 | Booking does not exist |
| MERCHANT_NOT_FOUND | 404 | Merchant does not exist |
| VERTICAL_UNAVAILABLE | 503 | Vertical service unavailable |
| PAYMENT_FAILED | 402 | Payment processing failed |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Search endpoints**: 60 requests per minute
- **Booking endpoints**: 30 requests per minute

## Monitoring

### Metrics Endpoint
```http
GET /metrics
```

### Health Checks
- `/health` - Basic health
- `/health/ready` - Readiness (DB + vertical services)
- `/health/live` - Liveness

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Unified Booking Service                  │
│                         Port: 4072                          │
├─────────────────────────────────────────────────────────────┤
│  Routes Layer                                               │
│  ├── Search Routes (availability, merchants)               │
│  ├── Booking Routes (CRUD, cancel, reschedule)             │
│  ├── Payment Routes (pay, refund)                          │
│  ├── Waitlist Routes (add, notify, expire)                 │
│  ├── Calendar Routes (user, merchant)                      │
│  └── Vertical Routes (proxy to services)                   │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                             │
│  ├── BookingService (core logic)                           │
│  ├── VerticalProxy (service communication)                 │
│  ├── WaitlistService (waitlist management)                │
│  ├── PaymentService (payment processing)                   │
│  └── NotificationService (RABTUL integration)             │
├─────────────────────────────────────────────────────────────┤
│  Middleware                                                │
│  ├── Authentication (JWT + X-Internal-Token)               │
│  ├── Validation (Zod schemas)                              │
│  └── Error Handler                                         │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ├── UnifiedBooking (MongoDB)                              │
│  └── WaitlistEntry (MongoDB)                              │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
        │ Restaurant│   │   Hotel   │   │   Salon   │
        │ Service   │   │  Service  │   │  Service  │
        │  :3001    │   │  :4010    │   │  :4009    │
        └───────────┘   └───────────┘   └───────────┘
              ...            ...              ...
        (All 17 Vertical Services)
```

## License

MIT