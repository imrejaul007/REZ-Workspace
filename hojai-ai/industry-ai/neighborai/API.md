# NEIGHBORAI - API Documentation

**Version:** 1.0.0
**Base URL:** `http://localhost:4806`
**Port:** 4806

---

## Table of Contents

1. [Authentication](#authentication)
2. [Health Checks](#health-checks)
3. [AI Employees](#ai-employees)
4. [Residents](#residents)
5. [Visitors](#visitors)
6. [Complaints](#complaints)
7. [Maintenance](#maintenance)
8. [Events](#events)
9. [Analytics](#analytics)
10. [Error Handling](#error-handling)

---

## Authentication

Most endpoints support optional authentication. For protected endpoints, include the JWT token in the Authorization header.

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@neighborai.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "admin@neighborai.com",
    "name": "Society Admin",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "Login successful"
}
```

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "resident@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "resident",
  "flatNumber": "101"
}
```

### Seed Admin

```http
POST /api/auth/seed
```

---

## Health Checks

### Full Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "NEIGHBORAI",
  "version": "1.0.0",
  "port": 4806,
  "environment": "development",
  "uptime": 3600,
  "mongo": "connected",
  "aiEmployees": [
    { "name": "Society Manager AI", "status": "active" },
    { "name": "Visitor Agent AI", "status": "active" },
    { "name": "Complaint Agent AI", "status": "active" },
    { "name": "Community Agent AI", "status": "active" }
  ],
  "stats": {
    "totalResidents": 50,
    "visitorsToday": 12,
    "openComplaints": 5,
    "pendingMaintenance": 8
  },
  "timestamp": "2026-06-06T10:00:00.000Z"
}
```

### Liveness Probe

```http
GET /health/live
```

### Readiness Probe

```http
GET /health/ready
```

---

## AI Employees

### AI Status

```http
GET /ai/status
```

**Response:**
```json
{
  "success": true,
  "active": true,
  "version": "1.0.0",
  "service": "NEIGHBORAI - Residential Society AI Operating System",
  "aiEmployees": {
    "societyManager": {
      "name": "Society Manager AI",
      "status": "active",
      "capabilities": ["Operations", "Billing", "Maintenance", "Resident Directory"]
    },
    "visitorAgent": {
      "name": "Visitor Agent AI",
      "status": "active",
      "capabilities": ["Pre-approval", "Check-in", "Check-out", "Entry codes"]
    },
    "complaintAgent": {
      "name": "Complaint Agent AI",
      "status": "active",
      "capabilities": ["Registration", "Tracking", "Escalation", "Resolution"]
    },
    "communityAgent": {
      "name": "Community Agent AI",
      "status": "active",
      "capabilities": ["Event Planning", "RSVP Management", "Announcements", "Analytics"]
    }
  }
}
```

### Society Manager - Query

```http
POST /api/ai/society/query
Content-Type: application/json

{
  "flatNumber": "101",
  "query": "What are my pending bills?"
}
```

### Society Manager - Billing

```http
POST /api/ai/society/billing
Content-Type: application/json

{
  "flatNumber": "101"
}
```

### Visitor Agent - Pre-Approve

```http
POST /api/ai/visitor/pre-approve
Content-Type: application/json

{
  "flatNumber": "101",
  "visitorName": "Jane Smith",
  "phone": "9876543210",
  "purpose": "Family Visit"
}
```

### Visitor Agent - Check In

```http
POST /api/ai/visitor/checkin
Content-Type: application/json

{
  "visitorId": "60f7c2b8e1d2f3a4b5c6d7e8"
}
```

### Visitor Agent - Check Out

```http
POST /api/ai/visitor/checkout
Content-Type: application/json

{
  "visitorId": "60f7c2b8e1d2f3a4b5c6d7e8"
}
```

### Complaint Agent - Track

```http
POST /api/ai/complaint/track
Content-Type: application/json

{
  "complaintId": "60f7c2b8e1d2f3a4b5c6d7e8"
}
```

### Complaint Agent - Register

```http
POST /api/ai/complaint/register
Content-Type: application/json

{
  "residentId": "60f7c2b8e1d2f3a4b5c6d7e8",
  "flatNumber": "101",
  "category": "maintenance",
  "description": "Water leakage in bathroom",
  "priority": "high"
}
```

### Complaint Agent - Stats

```http
GET /api/ai/complaint/stats
```

### Community Agent - Plan Event

```http
POST /api/ai/event/plan
Content-Type: application/json

{
  "title": "Summer BBQ",
  "description": "Annual society barbecue party",
  "suggestedDate": "2026-07-15",
  "organizer": "Society Committee"
}
```

### Community Agent - Upcoming Events

```http
GET /api/ai/event/upcoming
```

### AI Conversation

```http
POST /api/ai/converse
Content-Type: application/json

{
  "message": "I want to register a complaint about water leakage",
  "context": {
    "flatNumber": "101"
  }
}
```

---

## Residents

### List Residents

```http
GET /api/residents?wing=A&status=owner&search=John
```

**Query Parameters:**
- `wing` - Filter by wing (A, B, etc.)
- `status` - Filter by status (owner, tenant)
- `search` - Search by name, flat number, or email
- `limit` - Number of results (default: 50)
- `page` - Page number (default: 1)

### Get Resident

```http
GET /api/residents/:id
```

### Get Resident by Flat

```http
GET /api/residents/flat/:flatNumber
```

### Create Resident

```http
POST /api/residents
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "flatNumber": "101",
  "wing": "A",
  "status": "owner",
  "familyMembers": ["Jane Doe", "Jimmy Doe"],
  "vehicleNumbers": ["MH12AB1234"]
}
```

### Update Resident

```http
PATCH /api/residents/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "9876543211",
  "emergencyContact": "9876543212"
}
```

### Delete Resident

```http
DELETE /api/residents/:id
Authorization: Bearer <token>
```

### Add Vehicle

```http
POST /api/residents/:id/vehicle
Authorization: Bearer <token>
Content-Type: application/json

{
  "vehicleNumber": "MH12CD5678"
}
```

### Add Family Member

```http
POST /api/residents/:id/family
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Family Member"
}
```

---

## Visitors

### List Visitors

```http
GET /api/visitors?status=checked-in&hostFlat=101&date=2026-06-06
```

**Query Parameters:**
- `status` - Filter by status (pending, checked-in, checked-out)
- `hostFlat` - Filter by host flat number
- `date` - Filter by date
- `limit` - Number of results (default: 50)

### Get Visitor

```http
GET /api/visitors/:id
```

### Check In Visitor

```http
POST /api/visitors/checkin
Content-Type: application/json

{
  "name": "Guest Name",
  "phone": "9876543210",
  "purpose": "Family Visit",
  "hostFlat": "101"
}
```

### Check Out Visitor

```http
POST /api/visitors/checkout
Content-Type: application/json

{
  "visitorId": "60f7c2b8e1d2f3a4b5c6d7e8"
}
```

### Approve Visitor

```http
POST /api/visitors/approve/:id
Content-Type: application/json

{
  "approvedBy": "Security Guard Name"
}
```

### Deny Visitor

```http
POST /api/visitors/deny/:id
Content-Type: application/json

{
  "deniedBy": "Security Guard Name"
}
```

### Delete Visitor Record

```http
DELETE /api/visitors/:id
Authorization: Bearer <token>
```

---

## Complaints

### List Complaints

```http
GET /api/complaints?status=open&priority=high&category=maintenance&flatNumber=101
```

**Query Parameters:**
- `status` - Filter by status (open, in-progress, resolved, closed)
- `priority` - Filter by priority (low, medium, high, urgent)
- `category` - Filter by category
- `flatNumber` - Filter by flat number
- `limit` - Number of results (default: 50)
- `page` - Page number (default: 1)

### Get Complaint

```http
GET /api/complaints/:id
```

### Create Complaint

```http
POST /api/complaints
Content-Type: application/json

{
  "residentId": "60f7c2b8e1d2f3a4b5c6d7e8",
  "flatNumber": "101",
  "wing": "A",
  "category": "maintenance",
  "description": "Water leakage in bathroom ceiling",
  "priority": "high"
}
```

### Update Complaint

```http
PATCH /api/complaints/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in-progress",
  "assignedTo": "Plumbing Team",
  "priority": "urgent"
}
```

### Resolve Complaint

```http
POST /api/complaints/:id/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "resolution": "Fixed the water leakage by replacing the pipe joint",
  "resolvedBy": "Plumber Name"
}
```

### Delete Complaint

```http
DELETE /api/complaints/:id
Authorization: Bearer <token>
```

### Complaint Statistics

```http
GET /api/complaints/stats/summary
```

---

## Maintenance

### List All Maintenance

```http
GET /api/maintenance?status=pending&wing=A
```

**Query Parameters:**
- `status` - Filter by status (pending, paid, overdue)
- `wing` - Filter by wing
- `month` - Filter by month
- `limit` - Number of results (default: 50)
- `page` - Page number (default: 1)

### Get Maintenance by Flat

```http
GET /api/maintenance/:flatNumber?month=June&year=2026
```

### Create Maintenance Request

```http
POST /api/maintenance/request
Content-Type: application/json

{
  "residentId": "60f7c2b8e1d2f3a4b5c6d7e8",
  "flatNumber": "101",
  "wing": "A",
  "category": "repair",
  "description": "Fix broken door lock",
  "amount": 500,
  "dueDate": "2026-06-15"
}
```

### Generate Monthly Bills

```http
POST /api/maintenance/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "month": "June",
  "year": 2026,
  "maintenanceAmount": 3000,
  "includeWater": true,
  "includeParking": true
}
```

### Record Payment

```http
POST /api/maintenance/:id/pay
Content-Type: application/json

{
  "paidAmount": 3500
}
```

### Update Maintenance Record

```http
PATCH /api/maintenance/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 4000,
  "dueDate": "2026-07-10"
}
```

### Delete Maintenance Record

```http
DELETE /api/maintenance/:id
Authorization: Bearer <token>
```

### Mark Overdue Bills

```http
POST /api/maintenance/overdue/update
Authorization: Bearer <token>
```

---

## Events

### List Events

```http
GET /api/events?upcoming=true&limit=10
```

**Query Parameters:**
- `upcoming` - Show only upcoming events (true/false)
- `past` - Show only past events (true/false)
- `limit` - Number of results (default: 50)
- `page` - Page number (default: 1)

### Get Event

```http
GET /api/events/:id
```

### Create Event

```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Society General Meeting",
  "date": "2026-06-20",
  "time": "10:00 AM",
  "venue": "Community Hall",
  "description": "Annual general meeting to discuss society matters",
  "organizer": "Society Secretary"
}
```

### Update Event

```http
PATCH /api/events/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "venue": "Rooftop Garden",
  "time": "5:00 PM"
}
```

### RSVP to Event

```http
POST /api/events/:id/rsvp
Content-Type: application/json

{
  "flatNumber": "101",
  "rsvp": "yes"
}
```

### Announce Event

```http
POST /api/events/:id/announce
Authorization: Bearer <token>
```

### Delete Event

```http
DELETE /api/events/:id
Authorization: Bearer <token>
```

---

## Analytics

### Dashboard

```http
GET /api/analytics/dashboard
```

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "overview": {
      "totalResidents": 50,
      "owners": 35,
      "tenants": 15,
      "totalFlats": 60
    },
    "visitors": {
      "todayCount": 12,
      "currentlyInside": 3,
      "pendingApproval": 2
    },
    "complaints": {
      "open": 5,
      "inProgress": 3,
      "resolved": 45,
      "total": 53,
      "resolutionRate": "85.0%"
    },
    "maintenance": {
      "pending": 8,
      "overdue": 3,
      "pendingRevenue": 35000,
      "collectedRevenue": 120000
    },
    "events": {
      "upcoming": 2
    },
    "revenue": {
      "collected": 120000,
      "pending": 35000,
      "growth": "5.2%"
    }
  }
}
```

### Resident Analytics

```http
GET /api/analytics/residents?wing=A
```

### Visitor Analytics

```http
GET /api/analytics/visitors
```

### Complaint Analytics

```http
GET /api/analytics/complaints
```

### Maintenance Analytics

```http
GET /api/analytics/maintenance
```

### Event Analytics

```http
GET /api/analytics/events
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2026-06-06T10:00:00.000Z"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `INVALID_TOKEN` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `DUPLICATE_FLAT` | 400 | Flat number already exists |
| `ALREADY_PAID` | 400 | Bill already paid |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

- **General:** 100 requests per 15 minutes
- **Auth endpoints:** 10 requests per minute

---

## Webhook Events

The service publishes events to the webhook service:

| Event | Description |
|-------|-------------|
| `neighborai.resident.registered` | New resident added |
| `neighborai.visitor.checked_in` | Visitor checked in |
| `neighborai.complaint.created` | New complaint registered |
| `neighborai.maintenance.paid` | Payment received |

---

## HOJAI Sync

The service syncs data to HOJAI Core:

- Resident registrations
- Visitor check-ins
- Complaint updates
- Maintenance payments

---

**Last Updated:** June 6, 2026