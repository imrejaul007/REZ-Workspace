# REZ Schedule JavaScript/TypeScript SDK

The official JavaScript SDK for REZ Schedule - Universal Scheduling Platform.

## Installation

```bash
npm install @rez/schedule-sdk
# or
yarn add @rez/schedule-sdk
# or
pnpm add @rez/schedule-sdk
```

## Quick Start

```typescript
import { ReZSchedule } from '@rez/schedule-sdk';

// Initialize with your API key
const schedule = new ReZSchedule({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.rez.money/schedule' // optional, defaults to cloud
});

// Get event types
const eventTypes = await schedule.eventTypes.list();

// Get availability
const slots = await schedule.availability.get({
  username: 'drsharma',
  slug: 'consultation',
  startDate: '2026-05-27',
  endDate: '2026-05-29'
});

// Create booking
const booking = await schedule.bookings.create({
  eventTypeId: 'evt_xxx',
  startTime: '2026-05-27T10:00:00Z',
  endTime: '2026-05-27T10:30:00Z',
  attendeeName: 'John Doe',
  attendeeEmail: 'john@example.com'
});
```

## Embed Widget

```html
<!-- Add to your HTML -->
<div id="booking-widget"></div>

<script src="https://cdn.rez.money/schedule/widget.js"></script>
<script>
  ReZSchedule.init({
    container: '#booking-widget',
    username: 'drsharma',
    slug: 'consultation',
    theme: 'light', // or 'dark'
    primaryColor: '#6366f1'
  });
</script>
```

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Event Types](#event-types)
- [Availability](#availability)
- [Bookings](#bookings)
- [Users](#users)
- [Webhooks](#webhooks)
- [Error Handling](#error-handling)
- [Types](#types)

## Configuration

```typescript
interface ReZScheduleConfig {
  apiKey: string;           // Required: Your API key
  baseUrl?: string;        // Optional: API base URL
  timeout?: number;        // Optional: Request timeout (ms)
  retries?: number;         // Optional: Retry attempts
  webhookSecret?: string;   // Optional: For webhook verification
}

const schedule = new ReZSchedule({
  apiKey: process.env.REZ_SCHEDULE_API_KEY,
  timeout: 30000,
  retries: 3
});
```

## Event Types

### List Event Types

```typescript
const eventTypes = await schedule.eventTypes.list();

// With filters
const paidOnly = await schedule.eventTypes.list({
  hasPrice: true
});
```

### Get Event Type

```typescript
const eventType = await schedule.eventTypes.get('evt_xxx');

// Get public event type
const publicEvent = await schedule.eventTypes.getPublic('drsharma', 'consultation');
```

### Create Event Type

```typescript
const eventType = await schedule.eventTypes.create({
  slug: 'consultation',
  title: '30-min Consultation',
  duration: 30,
  locationType: 'VIDEO_CALL',
  requiresConfirmation: true,
  price: 500,
  currency: 'INR',
  customQuestions: [
    { question: 'Reason for visit', type: 'TEXTAREA', required: true }
  ]
});
```

### Update Event Type

```typescript
await schedule.eventTypes.update('evt_xxx', {
  title: '45-min Consultation',
  duration: 45,
  price: 750
});
```

### Delete Event Type

```typescript
await schedule.eventTypes.delete('evt_xxx');
```

## Availability

### Get Available Slots

```typescript
const slots = await schedule.availability.get({
  username: 'drsharma',
  slug: 'consultation',
  startDate: '2026-05-27',
  endDate: '2026-05-29',
  guestTimezone: 'America/New_York'
});

// Filter available only
const availableSlots = slots.filter(s => s.available);
```

### Check Slot Availability

```typescript
const result = await schedule.availability.check({
  eventTypeId: 'evt_xxx',
  startTime: '2026-05-27T10:00:00Z',
  endTime: '2026-05-27T10:30:00Z',
  timezone: 'Asia/Kolkata'
});

if (result.available) {
  console.log('Slot is available!');
}
```

## Bookings

### Create Booking

```typescript
const booking = await schedule.bookings.create({
  eventTypeId: 'evt_xxx',
  startTime: '2026-05-27T10:00:00Z',
  endTime: '2026-05-27T10:30:00Z',
  attendeeName: 'John Doe',
  attendeeEmail: 'john@example.com',
  attendeePhone: '+919876543210',
  timezone: 'Asia/Kolkata',
  responses: {
    'Reason for visit': 'Annual checkup'
  }
});

console.log(`Booking ID: ${booking.uid}`);
console.log(`Status: ${booking.status}`);
```

### Get Booking

```typescript
const booking = await schedule.bookings.get('bk_xxx');
```

### List Bookings

```typescript
const bookings = await schedule.bookings.list({
  status: 'CONFIRMED',
  startDate: '2026-05-01',
  endDate: '2026-05-31',
  page: 1,
  limit: 20
});

console.log(`Total: ${bookings.total}`);
console.log(`Pages: ${bookings.pages}`);
```

### Cancel Booking

```typescript
await schedule.bookings.cancel('bk_xxx', {
  reason: 'Schedule conflict',
  notifyHost: true,
  notifyGuest: true
});
```

### Reschedule Booking

```typescript
await schedule.bookings.reschedule('bk_xxx', {
  newStartTime: '2026-05-28T14:00:00Z',
  newEndTime: '2026-05-28T14:30:00Z'
});
```

### Confirm Booking

```typescript
await schedule.bookings.confirm('bk_xxx');
```

## Users

### Get Current User

```typescript
const user = await schedule.users.me();
console.log(`Logged in as: ${user.name}`);
```

### Update Profile

```typescript
await schedule.users.update({
  name: 'Dr. Priya Sharma',
  bio: 'MBBS, MD - 15 years experience',
  timeZone: 'Asia/Kolkata'
});
```

### Get User's Public Profile

```typescript
const profile = await schedule.users.getPublic('drsharma');
console.log(`${profile.name} - ${profile.bio}`);
```

## Webhooks

### Create Webhook

```typescript
const webhook = await schedule.webhooks.create({
  url: 'https://your-app.com/webhooks',
  triggers: [
    'booking.created',
    'booking.cancelled',
    'booking.confirmed'
  ]
});

// Save the secret securely!
console.log(`Webhook Secret: ${webhook.secret}`);
```

### Verify Webhook Signature

```typescript
// Express.js example
app.post('/webhooks', (req, res) => {
  const signature = req.headers['x-rez-signature'];
  const isValid = schedule.webhooks.verifySignature(
    JSON.stringify(req.body),
    signature,
    webhookSecret
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // Process webhook
  const { event, data } = req.body;
  // ...
});
```

### List Webhooks

```typescript
const webhooks = await schedule.webhooks.list();
```

### Delete Webhook

```typescript
await schedule.webhooks.delete('wh_xxx');
```

## Seats & Waiting List (Group/Class)

### Get Available Seats

```typescript
const seats = await schedule.seats.getAvailable('evt_xxx', '2026-05-27');
console.log(`${seats.available} seats available`);
```

### Hold a Seat

```typescript
const hold = await schedule.seats.hold('evt_xxx', {
  startTime: '2026-05-27T10:00:00Z',
  endTime: '2026-05-27T11:00:00Z',
  heldBy: 'customer@example.com'
});
console.log(`Seat held until: ${hold.expiresAt}`);
```

### Join Waiting List

```typescript
const position = await schedule.waitingList.join('evt_xxx', {
  requestedStart: '2026-05-27T10:00:00Z',
  requestedEnd: '2026-05-27T10:30:00Z',
  email: 'customer@example.com',
  name: 'Jane Doe'
});
console.log(`Your position in queue: ${position}`);
```

## Error Handling

```typescript
import { ReZScheduleError, RateLimitError, ValidationError } from '@rez/schedule-sdk';

try {
  await schedule.bookings.create({ ... });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.fields);
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after: ${error.retryAfter}s`);
  } else if (error instanceof ReZScheduleError) {
    console.log(`API Error: ${error.message}`);
  }
}
```

## Types

```typescript
// Event Type
interface EventType {
  id: string;
  slug: string;
  title: string;
  description?: string;
  duration: number;
  locationType: 'IN_PERSON' | 'PHONE_CALL' | 'VIDEO_CALL' | 'CUSTOM_LINK';
  price?: number;
  currency?: string;
  requiresConfirmation: boolean;
}

// Time Slot
interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

// Booking
interface Booking {
  uid: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  eventTypeId: string;
  startTime: Date;
  endTime: Date;
  attendee: {
    name: string;
    email: string;
    phone?: string;
  };
}
```

## React Integration

```tsx
import { ReZScheduleProvider, BookingWidget } from '@rez/schedule-sdk/react';

function App() {
  return (
    <ReZScheduleProvider apiKey="your-api-key">
      <BookingWidget
        username="drsharma"
        slug="consultation"
        theme="light"
        onBookingComplete={(booking) => {
          console.log('Booked:', booking.uid);
        }}
      />
    </ReZScheduleProvider>
  );
}
```

## Next.js Integration

```typescript
// app/api/bookings/route.ts
import { createRouteHandler } from '@rez/schedule-sdk/nextjs';

const handler = createRouteHandler({
  apiKey: process.env.REZ_SCHEDULE_API_KEY!
});

export { handler as GET, handler as POST };
```

## License

MIT
