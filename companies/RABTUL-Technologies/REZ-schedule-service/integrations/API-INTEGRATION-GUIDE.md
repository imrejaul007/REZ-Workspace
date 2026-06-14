# REZ Schedule - Integration Guide

**Universal Scheduling Platform API** - Like Calendly, for anyone to integrate.

---

## Quick Integration

### 1. Get an API Key

Sign up at [api.rez.money/schedule](https://api.rez.money/schedule) to get your API key.

### 2. Embed the Widget

```html
<!-- Add to any website -->
<div id="booking"></div>

<script src="https://cdn.rez.money/schedule/widget.js"></script>
<script>
  ReZSchedule.init({
    container: '#booking',
    username: 'drsharma',
    slug: 'consultation'
  });
</script>
```

### 3. Use the API

```javascript
import { createClient } from '@rez/schedule-sdk';

const client = createClient({ apiKey: 'your-api-key' });

// Get available slots
const { slots } = await client.availability.get({
  username: 'drsharma',
  slug: 'consultation',
  startDate: '2026-05-27',
  endDate: '2026-05-29'
});

// Create booking
const booking = await client.bookings.create({
  eventTypeId: slots[0].eventTypeId,
  startTime: slots[0].startTime,
  endTime: slots[0].endTime,
  attendeeName: 'John Doe',
  attendeeEmail: 'john@example.com'
});
```

---

## Integration Options

| Option | Best For | Complexity |
|--------|----------|------------|
| **Widget** | Any website, WordPress, Squarespace | ⭐ (Drop-in) |
| **SDK** | React, Next.js, Node.js apps | ⭐⭐ |
| **REST API** | Custom integrations | ⭐⭐⭐ |
| **Webhooks** | Real-time notifications | ⭐⭐ |

---

## Widget Integration

### Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
  <title>Book Appointment</title>
</head>
<body>
  <div id="rez-booking-widget"></div>

  <script src="https://cdn.rez.money/schedule/widget.js"></script>
  <script>
    ReZSchedule.init({
      container: '#rez-booking-widget',
      username: 'your-username',
      slug: 'your-event-slug',
      theme: 'light',      // 'light' or 'dark'
      primaryColor: '#6366f1'
    });
  </script>
</body>
</html>
```

### WordPress

Add to any page/post:

```
[rez_schedule username="drsharma" slug="consultation"]
```

Or use the Gutenberg block:
- Add block > Search "REZ Schedule" > Configure

### Shopify

1. Go to Online Store > Themes > Edit code
2. Add a new section or block
3. Paste the widget code

### Wix

1. Add > Embed > Embed Code
2. Paste the widget HTML
3. Set dimensions as needed

### Squarespace

1. Add > Code > Code Block
2. Paste the widget code
3. Position as needed

---

## REST API Integration

### Base URL

```
Production: https://api.rez.money/schedule
```

### Authentication

Include your API key in all requests:

```bash
curl -X GET "https://api.rez.money/schedule/api/event-types" \
  -H "X-API-Key: your-api-key"
```

Or use Bearer token:

```bash
curl -X GET "https://api.rez.money/schedule/api/event-types" \
  -H "Authorization: Bearer your-api-key"
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/event-types/public/:username/:slug` | Get public event type |
| GET | `/api/availability/:username/:slug` | Get available slots |
| POST | `/api/availability/check` | Check slot availability |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/:uid` | Get booking |
| PATCH | `/api/bookings/:uid/cancel` | Cancel booking |

### Example: Get Availability

```javascript
const response = await fetch(
  `https://api.rez.money/schedule/api/availability/drsharma/consultation?` +
  new URLSearchParams({
    startDate: '2026-05-27',
    endDate: '2026-05-29'
  }),
  {
    headers: {
      'X-API-Key': 'your-api-key',
      'Content-Type': 'application/json'
    }
  }
);

const { slots } = await response.json();
```

### Example: Create Booking

```javascript
const response = await fetch(
  'https://api.rez.money/schedule/api/bookings',
  {
    method: 'POST',
    headers: {
      'X-API-Key': 'your-api-key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      eventTypeId: 'evt_xxx',
      startTime: '2026-05-27T10:00:00Z',
      endTime: '2026-05-27T10:30:00Z',
      attendeeName: 'John Doe',
      attendeeEmail: 'john@example.com',
      timezone: 'Asia/Kolkata'
    })
  }
);

const booking = await response.json();
console.log(booking.uid);
```

---

## Webhook Integration

### Setting Up Webhooks

1. Go to Dashboard > Webhooks
2. Add new webhook URL
3. Select events to receive
4. Copy generated secret

### Webhook Events

| Event | Trigger |
|-------|---------|
| `booking.created` | New booking created |
| `booking.confirmed` | Booking confirmed |
| `booking.cancelled` | Booking cancelled |
| `booking.rescheduled` | Booking rescheduled |
| `booking.completed` | Booking completed |
| `booking.no_show` | Attendee marked as no-show |

### Verifying Webhooks

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Express.js example
app.post('/webhooks', (req, res) => {
  const signature = req.headers['x-rez-signature'];
  const isValid = verifyWebhook(
    JSON.stringify(req.body),
    signature,
    webhookSecret
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  const { event, data } = req.body;
  console.log(`Event: ${event}`, data);

  res.status(200).send('OK');
});
```

### Webhook Payload

```json
{
  "event": "booking.created",
  "timestamp": "2026-05-27T10:00:00Z",
  "data": {
    "uid": "bk_xxx",
    "status": "CONFIRMED",
    "startTime": "2026-05-27T10:00:00Z",
    "endTime": "2026-05-27T10:30:00Z",
    "attendee": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "eventType": {
      "title": "Consultation",
      "duration": 30
    }
  }
}
```

---

## SDK Integration

### JavaScript/TypeScript

```bash
npm install @rez/schedule-sdk
```

```typescript
import { createClient } from '@rez/schedule-sdk';

const client = createClient({
  apiKey: 'your-api-key'
});

// All methods return Promises
const slots = await client.availability.get({
  username: 'drsharma',
  slug: 'consultation',
  startDate: '2026-05-27',
  endDate: '2026-05-29'
});
```

### Python

```bash
pip install rez-schedule
```

```python
from rez_schedule import ReZSchedule

client = ReZSchedule(api_key="your-api-key")

slots = client.availability.get(
    username="drsharma",
    slug="consultation",
    start_date="2026-05-27",
    end_date="2026-05-29"
)
```

### React

```bash
npm install @rez/schedule-sdk
```

```tsx
import { ReZScheduleProvider, BookingWidget } from '@rez/schedule-sdk/react';

function App() {
  return (
    <ReZScheduleProvider apiKey="your-api-key">
      <BookingWidget
        username="drsharma"
        slug="consultation"
        onBookingComplete={(booking) => {
          console.log('Booked:', booking.uid);
        }}
      />
    </ReZScheduleProvider>
  );
}
```

---

## iFrame Integration

For strict sandboxing, use iFrame:

```html
<iframe
  src="https://embed.rez.money/schedule/drsharma/consultation"
  width="100%"
  height="600"
  style="border: none; border-radius: 12px;"
  allow="calendar"
></iframe>
```

Query parameters:
- `theme=light|dark`
- `primaryColor=#hex`
- `callback=https://yoursite.com/callback`

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid API key |
| `NOT_FOUND` | Event type or booking not found |
| `SLOT_UNAVAILABLE` | Selected time not available |
| `VALIDATION_ERROR` | Missing required fields |
| `RATE_LIMITED` | Too many requests |

---

## Rate Limits

| Plan | Requests/minute |
|------|---------------|
| Free | 60 |
| Pro | 600 |
| Enterprise | 6000 |

---

## Support

- Documentation: [docs.rez.money/schedule](https://docs.rez.money/schedule)
- API Reference: [api.rez.money/schedule/docs](https://api.rez.money/schedule/docs)
- Support: support@rez.money
