# REZ Booking Services - Complete API Reference

**Version:** 1.0.0
**Last Updated:** May 28, 2026

---

## Services

| Service | Port | Industry |
|---------|------|----------|
| [REZ-schedule-service](#rez-schedule-service) | 4090 | Universal |
| [REZ-healthcare-service](#rez-healthcare-service) | 4091 | Healthcare |
| [REZ-restaurant-service](#rez-restaurant-service) | 4092 | Restaurant |
| [REZ-home-services](#rez-home-services) | 4093 | Home Services |
| [REZ-professional-services](#rez-professional-services) | 4094 | Professional |

---

## REZ-schedule-service (Port 4090)

**Universal scheduling platform** - Core booking engine for all services.

### Authentication

```bash
curl -H "X-API-Key: your-api-key"
```

### Event Types

#### Create Event Type
```http
POST /api/event-types
Content-Type: application/json
X-API-Key: your-api-key

{
  "slug": "consultation",
  "title": "30-min Consultation",
  "duration": 30,
  "locationType": "VIDEO_CALL",
  "price": 500,
  "currency": "INR",
  "requiresConfirmation": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "evt_xxx",
    "slug": "consultation",
    "title": "30-min Consultation",
    "duration": 30
  }
}
```

#### List Event Types
```http
GET /api/event-types
X-API-Key: your-api-key
```

#### Get Public Event Type
```http
GET /api/event-types/public/:username/:slug
```

### Availability

#### Get Available Slots
```http
GET /api/availability/:username/:slug?startDate=2026-05-28&endDate=2026-05-30
```

**Response:**
```json
{
  "success": true,
  "data": {
    "slots": [
      {
        "startTime": "2026-05-28T10:00:00Z",
        "endTime": "2026-05-28T10:30:00Z",
        "available": true
      }
    ]
  }
}
```

#### Check Slot Availability
```http
POST /api/availability/check
Content-Type: application/json

{
  "eventTypeId": "evt_xxx",
  "startTime": "2026-05-28T10:00:00Z",
  "endTime": "2026-05-28T10:30:00Z"
}
```

### Bookings

#### Create Booking
```http
POST /api/bookings
Content-Type: application/json

{
  "eventTypeId": "evt_xxx",
  "startTime": "2026-05-28T10:00:00Z",
  "endTime": "2026-05-28T10:30:00Z",
  "attendeeName": "John Doe",
  "attendeeEmail": "john@example.com",
  "attendeePhone": "+919876543210",
  "timezone": "Asia/Kolkata"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uid": "bk_xxx",
    "status": "CONFIRMED",
    "startTime": "2026-05-28T10:00:00Z",
    "endTime": "2026-05-28T10:30:00Z"
  }
}
```

#### Get Booking
```http
GET /api/bookings/:uid
```

#### List Bookings
```http
GET /api/bookings?status=CONFIRMED&page=1&limit=20
```

#### Cancel Booking
```http
PATCH /api/bookings/:uid/cancel
Content-Type: application/json

{
  "reason": "Schedule conflict"
}
```

#### Reschedule Booking
```http
PATCH /api/bookings/:uid/reschedule
Content-Type: application/json

{
  "newStartTime": "2026-05-29T14:00:00Z",
  "newEndTime": "2026-05-29T14:30:00Z"
}
```

### Webhooks

#### Create Webhook
```http
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks",
  "triggers": ["booking.created", "booking.cancelled"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "wh_xxx",
    "secret": "whsec_xxx"
  }
}
```

### Webhook Events

| Event | Trigger |
|-------|---------|
| `booking.created` | New booking created |
| `booking.confirmed` | Booking confirmed |
| `booking.cancelled` | Booking cancelled |
| `booking.rescheduled` | Booking rescheduled |
| `booking.completed` | Booking completed |
| `booking.no_show` | Attendee marked no-show |

---

## REZ-healthcare-service (Port 4091)

**Healthcare appointments** - Doctor consultations, lab tests, teleconsultations.

### Base URL
```
http://localhost:4091
```

### Get Services
```http
GET /api/services
```

### Get Doctors
```http
GET /api/doctors
GET /api/doctors?specialty=Cardiologist
```

### Create Healthcare Booking
```http
POST /api/bookings
Content-Type: application/json

{
  "serviceId": "doctor-consultation",
  "doctorId": "dr-001",
  "startTime": "2026-05-28T10:00:00Z",
  "endTime": "2026-05-28T10:15:00Z",
  "patientName": "John Doe",
  "patientEmail": "john@example.com",
  "patientPhone": "+919876543210",
  "symptoms": "Chest pain",
  "isNewPatient": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingUid": "bk_xxx",
    "confirmationId": "HC-ABC123",
    "service": "Doctor Consultation",
    "meetingLink": "https://meet.rez.money/bk_xxx"
  }
}
```

### Healthcare Services

| Service ID | Name | Duration | Price |
|-----------|------|----------|-------|
| `doctor-consultation` | Doctor Consultation | 15 min | ₹500 |
| `specialist-consultation` | Specialist Consultation | 30 min | ₹1000 |
| `lab-appointment` | Lab Test | 30 min | ₹0 |
| `health-checkup` | Full Health Checkup | 60 min | ₹2500 |
| `teleconsultation` | Teleconsultation | 15 min | ₹299 |

---

## REZ-restaurant-service (Port 4092)

**Table reservations** - Restaurant bookings, private dining.

### Base URL
```
http://localhost:4092
```

### Get Restaurant
```http
GET /api/restaurant/:restaurantId
```

### Get Available Slots
```http
GET /api/restaurant/:restaurantId/slots?date=2026-05-28&partySize=4
```

### Create Reservation
```http
POST /api/reservations
Content-Type: application/json

{
  "restaurantId": "rest-001",
  "date": "2026-05-28",
  "time": "19:00",
  "partySize": 4,
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "guestPhone": "+919876543210",
  "seatingType": "Indoor",
  "occasion": "Birthday"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reservationUid": "bk_xxx",
    "confirmationId": "RES-ABC123",
    "tableNumber": 5,
    "status": "CONFIRMED"
  }
}
```

### Seating Types
- Indoor
- Outdoor
- Rooftop
- Private
- Window
- Bar

### Occasions
- Birthday
- Anniversary
- Date Night
- Business Meal
- Family Gathering
- Celebration
- Casual

---

## REZ-home-services (Port 4093)

**Home service appointments** - Cleaning, plumbing, electrical, AC repair.

### Base URL
```
http://localhost:4093
```

### Get Services
```http
GET /api/services
GET /api/services?category=cleaning
```

### Get Categories
```http
GET /api/categories
```

### Create Booking
```http
POST /api/bookings
Content-Type: application/json

{
  "serviceId": "deep-cleaning",
  "date": "2026-05-28",
  "time": "10:00",
  "address": "123 Main St, Mumbai",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+919876543210"
}
```

### Home Service Categories

| Category | Services |
|----------|---------|
| Cleaning | Deep cleaning, Basic cleaning, Bathroom, Kitchen |
| Plumbing | Repair, Installation |
| Electrical | Repair, Installation |
| AC | Service, Repair |
| Pest | Pest control |
| Painting | Home painting |
| Carpenter | Furniture repair |

---

## REZ-professional-services (Port 4094)

**Professional consultations** - Legal, tax, business, career coaching.

### Base URL
```
http://localhost:4094
```

### Get Services
```http
GET /api/services
```

### Create Booking
```http
POST /api/bookings
Content-Type: application/json

{
  "serviceId": "legal-consultation",
  "date": "2026-05-28",
  "time": "14:00",
  "clientName": "John Doe",
  "clientEmail": "john@example.com",
  "clientPhone": "+919876543210",
  "company": "Acme Corp",
  "notes": "Contract review needed"
}
```

### Professional Services

| Service ID | Name | Duration | Price |
|-----------|------|----------|-------|
| `legal-consultation` | Legal Consultation | 30 min | ₹1500 |
| `tax-consultation` | Tax Consultation | 45 min | ₹2000 |
| `business-consultation` | Business Strategy | 60 min | ₹5000 |
| `career-coaching` | Career Coaching | 45 min | ₹1500 |
| `financial-planning` | Financial Planning | 60 min | ₹2500 |
| `marketing-consultation` | Marketing Strategy | 45 min | ₹3000 |

---

## SDK Usage

### JavaScript
```bash
npm install @rez/schedule-sdk
```

```typescript
import { createClient } from '@rez/schedule-sdk';

const client = createClient({ apiKey: 'your-api-key' });

// Get availability
const { slots } = await client.availability.get({
  username: 'drsharma',
  slug: 'consultation',
  startDate: '2026-05-28',
  endDate: '2026-05-30'
});

// Create booking
const booking = await client.bookings.create({
  eventTypeId: 'evt_xxx',
  startTime: '2026-05-28T10:00:00Z',
  endTime: '2026-05-28T10:30:00Z',
  attendeeName: 'John Doe',
  attendeeEmail: 'john@example.com'
});
```

### Python
```bash
pip install rez-schedule
```

```python
from rez_schedule import create_client

client = create_client(api_key="your-api-key")

slots = client.availability.get(
    username="drsharma",
    slug="consultation",
    start_date="2026-05-28",
    end_date="2026-05-30"
)

booking = client.bookings.create(
    event_type_id="evt_xxx",
    start_time="2026-05-28T10:00:00Z",
    end_time="2026-05-28T10:30:00Z",
    attendee_name="John Doe",
    attendee_email="john@example.com"
)
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid API key |
| `NOT_FOUND` | Resource not found |
| `SLOT_UNAVAILABLE` | Time slot not available |
| `VALIDATION_ERROR` | Invalid request data |
| `RATE_LIMITED` | Too many requests |

---

## Rate Limits

| Plan | Requests/minute |
|------|---------------|
| Free | 60 |
| Pro | 600 |
| Enterprise | 6000 |
