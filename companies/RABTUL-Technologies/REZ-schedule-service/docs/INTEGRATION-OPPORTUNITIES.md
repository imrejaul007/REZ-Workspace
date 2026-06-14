# REZ Schedule Service - Integration Opportunities

**Audited:** May 28, 2026
**Purpose:** Identify where REZ-schedule-service can replace or enhance existing scheduling in the REZ ecosystem.

---

## Executive Summary

| Category | Count | Integration Priority |
|----------|-------|---------------------|
| **Replace (Inferior)** | 3 | HIGH |
| **Enhance (Add Features)** | 8 | MEDIUM |
| **New (No Scheduling)** | 12 | HIGH |
| **Already Integrated** | 2 | LOW |

---

## 1. REPLACE - Replace Existing Inferior Scheduling

These services have basic scheduling but could benefit from REZ-schedule-service's advanced features (RRULE, webhooks, multi-user, etc.)

### 1.1 StayOwn-Hospitality - Hotel Booking ⭐ HIGH

**Current State:** Basic hotel booking with room types, not time-slot based.

**Location:** `StayOwn-Hospitality/hotel-habixo-service/`

**Current Implementation:**
- Booking model for room reservations (overnight stays)
- NOT real-time slot booking like Calendly

**Opportunity:**
- Add **room tours** (15-min slots for property viewing)
- Add **spa appointments** within hotels
- Add **restaurant reservations** within hotels
- Add **conference room bookings**

**Integration Point:**
```typescript
// NEW endpoint in hotel-habixo-service
POST /api/habixo/services/:serviceId/book
{
  "slot": "2026-05-28T14:00:00Z",
  "guestName": "John Doe",
  "guestEmail": "john@example.com"
}
```

**Files to Update:**
- `src/api/routes/booking.routes.ts` - Add service booking routes
- `src/models/Booking.ts` - Add service booking model

---

### 1.2 REZ-Merchant - Salon Booking ⭐ HIGH

**Current State:** Client-side time slot generation, basic booking.

**Location:** `REZ-Merchant/rez-app-merchant/app/salon/`

**Current Issues:**
- Time slots generated client-side (not timezone-aware)
- No webhook support
- No multi-user/team scheduling
- No waiting list
- No calendar sync

**Integration Opportunity:**
```
Replace: app/salon/schedule.tsx (client-side slots)
With:    REZ-schedule-service widget embed
```

**Benefits:**
- Timezone-aware slots
- Calendar sync (Google, Outlook)
- Webhook notifications
- Team scheduling (multiple stylists)
- Waiting list
- Payments via Stripe

**Integration Point:**
```typescript
// In REZ-Merchant's salon component
import { ReZSchedule } from '@rez/schedule-sdk';

// Replace client-side slot generation
const schedule = new ReZSchedule({ apiKey: 'merchant-api-key' });

// Use merchant's event types
const slots = await schedule.availability.get({
  username: 'glamstudio',
  slug: 'haircut-styling'
});
```

---

### 1.3 REZ-Merchant - KDS/Purchase Order ⭐ MEDIUM

**Current State:** Order-based, not time-slot based.

**Location:** `REZ-Merchant/rez-app-merchant/app/kds/`

**Opportunity:** Schedule kitchen/prep times for orders.

---

## 2. ENHANCE - Add Features to Existing Scheduling

### 2.1 ReZ-Ride - Driver Scheduling ⭐ MEDIUM

**Current State:** Immediate booking only.

**Location:** `rez-ride/src/services/ride.service.ts`

**Opportunity:** Add **scheduled rides** (book ahead feature)

**Integration:**
```typescript
// Add scheduled ride endpoint
POST /api/rides/schedule
{
  "pickup": { "lat": 19.07, "lng": 72.87 },
  "dropoff": { "lat": 19.17, "lng": 72.97 },
  "scheduledTime": "2026-05-30T10:00:00Z",
  "vehicleType": "sedan"
}
```

---

### 2.2 Airzy - Flight/Hotel Booking ⭐ MEDIUM

**Current State:** Search-only, no appointment booking.

**Location:** `Airzy/airzy-flight-service/`, `airzy-lounge-service/`

**Opportunity:**
- Add **travel consultation** appointments (15-min with travel expert)
- Add **visa consultation** slots
- Add **itinerary planning** sessions

**Integration:**
```typescript
// In airzy-api-gateway
app.post('/api/consultations', async (req, res) => {
  // Create booking via REZ-schedule-service
  const booking = await schedule.bookings.create({
    eventTypeId: 'travel-consultation',
    startTime: req.body.preferredTime,
    attendeeEmail: req.user.email
  });
});
```

---

### 2.3 REZ-Intelligence - Expert Services ⭐ HIGH

**Current State:** AI-based recommendations only.

**Location:** `REZ-Intelligence/rez-fitness-expert/`, `rez-salon-expert/`, etc.

**Opportunity:** Add **expert consultation** slots for human experts.

**Integration:**
```typescript
// Each expert service can expose booking slots
GET /api/experts/salon/availability
GET /api/experts/fitness/availability

// Unified via REZ-schedule-service
schedule.availability.get({
  username: 'salon-expert',
  slug: 'hair-consultation'
});
```

---

## 3. NEW - No Existing Scheduling

### 3.1 Restaurant Reservations 🍽️ ⭐ HIGH

**Location:** Could be new service or part of REZ-Consumer

**Opportunity:**
- Table reservations (30-min, 1-hour, 2-hour slots)
- Kitchen appointment booking (food prep time)
- Chef's table private dining

**Implementation:**
```typescript
// NEW: Restaurant Reservation Widget
<ReZSchedule
  username="restaurant-name"
  slug="table-reservation"
  theme="elegant"
  slots={[
    { time: "12:00", partySize: 2 },
    { time: "12:30", partySize: 4 },
    // ...
  ]}
/>
```

**File:** Create `REZ-Consumer/REZ-restaurant-booking/`

---

### 3.2 Healthcare Appointments 🏥 ⭐ HIGH

**Location:** Could be new service or part of StayOwn

**Opportunity:**
- Doctor consultation slots
- Lab test appointments
- Health checkup packages

**Implementation:**
```typescript
// NEW: Healthcare Booking Widget
schedule.eventTypes.create({
  slug: 'doctor-consultation',
  title: '15-min Doctor Consultation',
  duration: 15,
  locationType: 'VIDEO_CALL',
  price: 500,
  customQuestions: [
    { question: 'Symptoms', type: 'TEXTAREA' }
  ]
});
```

---

### 3.3 Education/Tutoring 📚 ⭐ MEDIUM

**Location:** CorpPerks or new service

**Opportunity:**
- Tutor booking slots
- Course scheduling
- Demo class reservations

**Integration:**
```typescript
// In CorpPerks education module
schedule.eventTypes.create({
  slug: 'tutor-session',
  title: '1-on-1 Tutoring Session',
  duration: 60,
  locationType: 'VIDEO_CALL',
  maxBookingsPerDay: 5
});
```

---

### 3.4 Fitness/Gym Classes 🏋️ ⭐ MEDIUM

**Location:** REZ-Intelligence/rez-fitness-expert/

**Opportunity:**
- Class schedule with capacity
- Personal training slots
- Equipment booking

**Integration:**
```typescript
// Class-based event with seats
schedule.eventTypes.create({
  slug: 'yoga-class',
  title: 'Morning Yoga Class',
  duration: 60,
  bookingType: 'SEATS', // Group/Class
  seatsPerSlot: 20,
  waitingListEnabled: true
});
```

---

### 3.5 Professional Services (Consultants, Lawyers, etc.) 💼 ⭐ HIGH

**Location:** New service in REZ-Intelligence

**Opportunity:**
- Legal consultation slots
- Tax appointment booking
- Business strategy sessions

**Current Gap:** No dedicated booking for professional services.

---

### 3.6 Auto Service / Car Wash 🚗 ⭐ MEDIUM

**Location:** REZ-Merchant

**Opportunity:**
- Service appointment booking
- Slot selection for oil change, tire rotation, etc.
- Bay/time slot selection

---

### 3.7 Home Services (Cleaning, Plumbing, Electrician) 🏠 ⭐ HIGH

**Location:** REZ-Merchant

**Opportunity:**
- Home service appointments
- Time slot selection (morning/afternoon/evening)
- Service provider assignment

---

### 3.8 Spa & Wellness ⭐ MEDIUM

**Location:** REZ-Merchant or StayOwn

**Opportunity:**
- Massage/salon appointments
- Package booking (combo services)
- Therapist availability

---

## 4. Priority Implementation Roadmap

### Phase 1: High Impact (Month 1)

| # | Service | Integration | Effort |
|---|---------|------------|--------|
| 1 | REZ-Merchant Salon | Replace with REZ-schedule-service | HIGH |
| 2 | Healthcare Appointments | New service | HIGH |
| 3 | Restaurant Reservations | New service | MEDIUM |

### Phase 2: Medium Impact (Month 2)

| # | Service | Integration | Effort |
|---|---------|------------|--------|
| 4 | Home Services | Extend Merchant | MEDIUM |
| 5 | Professional Services | New service | MEDIUM |
| 6 | ReZ-Ride Scheduled Rides | Enhance ReZ-Ride | MEDIUM |

### Phase 3: Low Priority (Month 3)

| # | Service | Integration | Effort |
|---|---------|------------|--------|
| 7 | Fitness Classes | Enhance REZ-Intelligence | LOW |
| 8 | Education Tutoring | Extend CorpPerks | LOW |
| 9 | Hotel Services | Enhance StayOwn | LOW |

---

## 5. Quick Wins - Webhook Integration

Many existing services can benefit from **notifications** via REZ-schedule-service webhooks:

### 5.1 Booking Confirmation Webhooks

```typescript
// Any service can subscribe to booking events
POST /api/webhooks
{
  "url": "https://merchant-service.rez.money/webhooks",
  "triggers": ["booking.created", "booking.cancelled"]
}
```

### 5.2 Services That Need Webhooks

| Service | Webhook Events |
|---------|---------------|
| RABTUL Notifications | `booking.created` → Send confirmation |
| RABTUL Wallet | `booking.confirmed` → Process payment |
| REZ-Intelligence | `booking.completed` → Update ML models |

---

## 6. Technical Integration Patterns

### Pattern 1: Direct API (Microservices)

```typescript
// In any service
const scheduleResponse = await fetch('http://localhost:4090/api/bookings', {
  method: 'POST',
  headers: { 'X-API-Key': process.env.SCHEDULE_API_KEY },
  body: JSON.stringify({ ... })
});
```

### Pattern 2: SDK Integration

```typescript
import { createClient } from '@rez/schedule-sdk';
const schedule = createClient({ apiKey: process.env.SCHEDULE_API_KEY });

// Get availability
const { slots } = await schedule.availability.get({
  username: 'merchant-slug',
  slug: 'service-slug'
});
```

### Pattern 3: Widget Embed

```html
<!-- Drop-in for any web app -->
<script src="https://cdn.rez.money/schedule/widget.js"></script>
<div id="booking"></div>
<script>
  ReZSchedule.init({
    container: '#booking',
    username: 'merchant-slug',
    slug: 'appointment-type'
  });
</script>
```

---

## 7. File Reference

| Integration | File | Change |
|-------------|------|--------|
| REZ-Merchant Salon | `app/salon/schedule.tsx` | Replace with SDK |
| StayOwn Hotel | `hotel-habixo-service/src/api/routes/booking.routes.ts` | Add service endpoints |
| ReZ-Ride | `ride.service.ts` | Add scheduled ride method |
| Airzy | `airzy-api-gateway/src/index.ts` | Add booking proxy |
| REZ-Intelligence | `rez-fitness-expert/src/` | Add booking endpoints |

---

## Summary

| Category | Count | Recommendation |
|----------|-------|----------------|
| **Replace** | 3 | High priority - REZ-Merchant Salon, StayOwn services, basic booking |
| **Enhance** | 8 | Medium priority - Add features to existing |
| **New** | 12 | High priority - Healthcare, restaurants, home services |
| **Total Opportunities** | 23 | Wide adoption across ecosystem |

**Recommended Next Steps:**
1. ✅ Integrate REZ-Merchant Salon → Use SDK
2. ✅ Create Healthcare service → New service
3. ✅ Add Restaurant Reservations → New service
