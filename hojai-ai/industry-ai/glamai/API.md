# GLAMAI - API Documentation

**Version:** 1.0.0
**Port:** 4860
**Base URL:** `http://localhost:4860`

---

## Overview

GLAMAI is a Salon AI Operating System with 4 AI Employees:
- **Beauty Advisor** - Service recommendations
- **Appointment Manager** - Scheduling and reminders
- **Campaign Agent** - Marketing and loyalty
- **Retention Agent** - Churn prevention

---

## Authentication

Most endpoints require authentication via JWT Bearer token:

```
Authorization: Bearer <token>
```

For internal service-to-service calls, use:

```
X-Internal-Token: <internal-token>
```

---

## Standard Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "timestamp": "2026-06-06T10:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2026-06-06T10:00:00.000Z"
}
```

---

## Health Check Endpoints

### GET /health

Full health check with system status.

**Response:**
```json
{
  "status": "healthy",
  "service": "GLAMAI",
  "version": "1.0.0",
  "port": 4860,
  "environment": "development",
  "uptime": 12345,
  "mongo": "connected",
  "aiEmployees": {
    "beautyAdvisor": { "status": "active", "description": "..." },
    "appointmentManager": { "status": "active", "description": "..." },
    "campaignAgent": { "status": "active", "description": "..." },
    "retentionAgent": { "status": "active", "description": "..." }
  },
  "stats": {
    "appointmentsToday": 15,
    "services": 12,
    "stylists": 5,
    "customers": 150
  },
  "timestamp": "2026-06-06T10:00:00.000Z"
}
```

### GET /health/live

Liveness probe.

### GET /health/ready

Readiness probe.

---

## AI Endpoints

### GET /api/ai/status

Get AI employee status.

### POST /api/ai/beauty-advisor/recommend

Get personalized service recommendations.

**Request:**
```json
{
  "customerId": "optional-customer-id",
  "budget": 2000,
  "occasion": "wedding",
  "preferences": ["Hair", "Skin"],
  "serviceCategory": "Hair"
}
```

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "_id": "...",
      "name": "Hair Coloring",
      "category": "Hair",
      "price": 2500,
      "duration": 120,
      "aiScore": 85,
      "aiReason": "Perfect for your wedding occasion!",
      "discount": 250
    }
  ],
  "aiMessage": "Based on your wedding needs, I recommend...",
  "customerProfile": {
    "name": "Priya",
    "loyaltyTier": "gold",
    "totalSpent": 5000,
    "visits": 10
  },
  "timestamp": "2026-06-06T10:00:00.000Z"
}
```

### POST /api/ai/appointment/schedule

Schedule an appointment.

**Request:**
```json
{
  "customerId": "customer-id",
  "serviceId": "service-id",
  "stylistId": "optional-stylist-id",
  "date": "2026-06-15",
  "time": "14:00",
  "notes": "First visit"
}
```

### POST /api/ai/appointment/reschedule

Reschedule an appointment.

**Request:**
```json
{
  "appointmentId": "appointment-id",
  "newDate": "2026-06-16",
  "newTime": "15:00"
}
```

### POST /api/ai/appointment/cancel

Cancel an appointment.

**Request:**
```json
{
  "appointmentId": "appointment-id",
  "reason": "Schedule conflict"
}
```

### GET /api/ai/appointment/slots

Get available time slots.

**Query:** `?date=2026-06-15&serviceId=service-id&stylistId=optional`

### POST /api/ai/campaign/create

Create a marketing campaign.

**Request:**
```json
{
  "type": "birthday",
  "targetSegment": "all",
  "discount": 20,
  "customMessage": "Happy Birthday!",
  "duration": 7
}
```

Campaign types: `birthday`, `loyalty`, `promotion`, `winback`, `seasonal`, `referral`

Target segments: `all`, `inactive`, `loyal`, `birthday`, `new`, `vip`

### GET /api/ai/campaign/active

Get active campaigns.

### POST /api/ai/retention/analyze

Analyze customer retention risk.

**Request:**
```json
{
  "customerId": "customer-id"
}
```

**Response:**
```json
{
  "success": true,
  "customer": {
    "id": "...",
    "name": "Priya",
    "phone": "9876543210",
    "loyaltyTier": "gold",
    "totalSpent": 5000,
    "visits": 10
  },
  "analysis": {
    "riskLevel": "low",
    "riskScore": 15,
    "daysSinceVisit": 7,
    "engagementScore": 85,
    "churnProbability": 15
  },
  "recommendations": [
    {
      "action": "referral_program",
      "priority": "low",
      "expectedImpact": "medium",
      "aiMessage": "Love our services? Refer a friend..."
    }
  ],
  "timestamp": "2026-06-06T10:00:00.000Z"
}
```

### GET /api/ai/retention/at-risk

Get all at-risk customers.

### GET /api/ai/retention/stats

Get retention statistics.

---

## Customer Endpoints

### POST /api/customers

Create a new customer.

**Request:**
```json
{
  "name": "Priya Sharma",
  "phone": "9876543210",
  "email": "priya@example.com",
  "birthday": "1990-05-15",
  "preferences": ["Hair", "Skin"],
  "loyaltyTier": "bronze"
}
```

### GET /api/customers

List customers with pagination.

**Query:** `?page=1&limit=20&tier=gold&search=priya`

### GET /api/customers/:id

Get customer by ID.

### PATCH /api/customers/:id

Update customer.

### GET /api/customers/:id/history

Get customer appointment history.

### GET /api/customers/:id/loyalty

Get customer loyalty status with progress to next tier.

---

## Service Endpoints

### POST /api/services

Create a new service.

**Request:**
```json
{
  "name": "Hair Treatment",
  "category": "Hair",
  "price": 1500,
  "duration": 60,
  "description": "Deep conditioning treatment"
}
```

Categories: `Hair`, `Skin`, `Nails`, `Spa`, `Massage`, `Makeup`, `Other`

### GET /api/services

List services.

**Query:** `?category=Hair&active=true`

### GET /api/services/categories

Get all service categories.

### GET /api/services/:id

Get service by ID.

### PATCH /api/services/:id

Update service.

### DELETE /api/services/:id

Soft-delete service (sets isActive=false).

---

## Appointment Endpoints

### POST /api/appointments

Create appointment.

**Request:**
```json
{
  "customerId": "customer-id",
  "serviceId": "service-id",
  "stylistId": "stylist-id",
  "date": "2026-06-15",
  "time": "14:00",
  "notes": "First visit"
}
```

### GET /api/appointments

List appointments.

**Query:** `?date=2026-06-15&status=scheduled&stylistId=...&page=1&limit=50`

### GET /api/appointments/slots

Get available time slots.

**Query:** `?date=2026-06-15&serviceId=...&stylistId=...`

### GET /api/appointments/:id

Get appointment by ID.

### PATCH /api/appointments/:id

Update appointment status.

**Request:**
```json
{
  "status": "completed"
}
```

Status values: `scheduled`, `confirmed`, `in-progress`, `completed`, `cancelled`, `no-show`

### POST /api/appointments/:id/confirm

Confirm appointment.

### POST /api/appointments/:id/start

Start appointment (in-progress).

### POST /api/appointments/:id/complete

Complete appointment.

### POST /api/appointments/:id/cancel

Cancel appointment.

### POST /api/appointments/:id/reschedule

Reschedule appointment.

### POST /api/appointments/:id/no-show

Mark as no-show.

---

## Stylist Endpoints

### POST /api/stylists

Create stylist.

**Request:**
```json
{
  "name": "Rahul Verma",
  "phone": "9876543211",
  "email": "rahul@example.com",
  "specialties": ["Hair", "Makeup"],
  "rating": 4.5
}
```

### GET /api/stylists

List stylists.

**Query:** `?active=true&specialty=Hair`

### GET /api/stylists/specialties

Get all specialties.

### GET /api/stylists/:id

Get stylist by ID.

### PATCH /api/stylists/:id

Update stylist.

### DELETE /api/stylists/:id

Soft-delete stylist.

---

## Analytics Endpoints

### GET /api/analytics/dashboard

Get dashboard statistics.

### GET /api/analytics/revenue

Get revenue analytics.

**Query:** `?period=week|month|year`

### GET /api/analytics/customers

Get customer analytics.

### GET /api/analytics/services

Get service analytics.

### GET /api/analytics/stylists

Get stylist analytics.

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Authentication required |
| `INVALID_TOKEN` | JWT token invalid or expired |
| `CUSTOMER_NOT_FOUND` | Customer does not exist |
| `SERVICE_NOT_FOUND` | Service does not exist |
| `STYLIST_NOT_FOUND` | Stylist does not exist |
| `APPOINTMENT_NOT_FOUND` | Appointment does not exist |
| `SLOT_UNAVAILABLE` | Time slot already booked |
| `DUPLICATE_PHONE` | Phone number already registered |
| `DUPLICATE_SERVICE` | Service name already exists |
| `VALIDATION_ERROR` | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `AUTH_RATE_LIMIT_EXCEEDED` | Too many auth attempts |
| `AI_RATE_LIMIT_EXCEEDED` | Too many AI requests |
| `INTERNAL_ERROR` | Server error |

---

## Rate Limits

| Endpoint Type | Limit |
|--------------|-------|
| General API | 100 requests / 15 minutes |
| Auth | 10 requests / minute |
| AI Endpoints | 30 requests / minute |

---

## Webhooks

When enabled, the following events trigger webhooks:

- `glamai.customer.registered`
- `glamai.appointment.scheduled`
- `glamai.appointment.completed`

---

## HOJAI Integration

The service syncs with HOJAI for:
- Centralized logging
- Event tracking
- Analytics

---

**Last Updated:** June 6, 2026