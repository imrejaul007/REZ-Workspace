# ReZ Schedule - Universal Scheduling Platform

**The scheduling platform that works on any website.**

Drop-in booking widget for salons, clinics, consultants, restaurants, HR, and more. Built from scratch (not a fork).

---

## Features

- **Universal Booking** - Salon, clinic, consultant, restaurant, HR, meetings, classes
- **Drop-in Widget** - One line of code, works on any website
- **SDKs** - JavaScript, Python, React
- **Plugins** - WordPress, Shopify, WooCommerce
- **Availability Engine** - Timezone-aware, RRULE, DST handling
- **Event Types** - Configurable booking types with custom questions
- **Group/Class** - Seat management, waiting lists, capacity
- **Calendar Sync** - Google Calendar, Outlook, Apple
- **Video Meetings** - Zoom, Meet, Teams, Daily.co
- **Payments** - Stripe checkout, refunds
- **Webhooks** - Real-time notifications with HMAC signatures
- **Rate Limiting** - Token bucket algorithm
- **Audit Logging** - Full compliance trail

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/reztechnologies/rez-schedule-service.git
cd rez-schedule-service
npm install
```

### 2. Setup Database

```bash
npm run db:generate
npm run db:push
npm run db:seed  # Optional: adds demo data
```

### 3. Start Server

```bash
npm run dev
```

**Server runs at:** `http://localhost:4090`

### 4. Open Demo

- **Admin Dashboard:** `http://localhost:4090/apps/admin`
- **Booking Widget:** `http://localhost:4090/apps/web`
- **API Docs:** `http://localhost:4090/api/docs`

---

## Integration in 30 Seconds

### Add to Any Website

```html
<script src="https://cdn.rez.money/schedule/widget.js"></script>
<div id="booking"></div>
<script>
  ReZSchedule.init({
    container: '#booking',
    username: 'drsharma',
    slug: 'consultation'
  });
</script>
```

### WordPress

```
[rez_schedule username="drsharma" slug="consultation"]
```

### React

```bash
npm install @rez/schedule-sdk
```

```tsx
import { BookingWidget } from '@rez/schedule-sdk/react';

function App() {
  return (
    <BookingWidget
      username="drsharma"
      slug="consultation"
      onBookingComplete={(booking) => console.log(booking)}
    />
  );
}
```

### Python

```bash
pip install rez-schedule
```

```python
from rez_schedule import create_client

client = create_client(api_key="your-key")
slots = client.availability.get(username="drsharma", slug="consultation", ...)
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| Database | PostgreSQL + Prisma |
| Language | TypeScript |
| Validation | Zod |
| Payments | Stripe |
| Caching | Redis-ready |

---

## Project Structure

```
rez-schedule-service/
├── src/
│   ├── services/          # Business logic
│   │   ├── availabilityService.ts
│   │   ├── bookingService.ts
│   │   ├── eventTypeService.ts
│   │   ├── webhookService.ts
│   │   ├── calendarSyncService.ts
│   │   ├── videoService.ts
│   │   ├── rateLimitService.ts
│   │   ├── auditService.ts
│   │   └── ...
│   ├── routes/           # API endpoints
│   └── utils/            # Helpers
├── sdks/
│   ├── javascript/       # JS/TS SDK + React
│   └── python/          # Python SDK
├── plugins/
│   ├── wordpress/       # WordPress plugin
│   ├── shopify/        # Shopify app
│   └── woocommerce/    # WooCommerce plugin
├── apps/
│   ├── admin/          # Admin dashboard
│   ├── web/            # Booking widget demo
│   └── landing/        # Marketing page
├── prisma/
│   ├── schema.prisma   # Database schema (19 models)
│   └── seed.ts        # Demo data
└── deploy/            # Deployment configs
    ├── railway.json
    ├── render.yaml
    └── vercel.json
```

---

## Environment Variables

```bash
# Server
PORT=4090
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/rez_schedule

# Optional: Redis
REDIS_URL=redis://localhost:6379

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Calendar
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Zoom
ZOOM_ACCOUNT_ID=...
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/event-types` | List event types |
| POST | `/api/event-types` | Create event type |
| GET | `/api/availability/:username/:slug` | Get available slots |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/:uid` | Get booking |
| PATCH | `/api/bookings/:uid/cancel` | Cancel booking |
| GET | `/api/webhooks` | List webhooks |
| POST | `/api/webhooks` | Create webhook |
| GET | `/api/users/me` | Get current user |

Full API docs at `/api/docs`

---

## Deployment

### Docker

```bash
docker compose up -d
```

### Railway

```bash
railway init
railway up
```

### Render

Connect to Render and deploy automatically.

### Vercel

```bash
vercel --prod
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [SPEC.md](SPEC.md) | Complete specification |
| [API Integration Guide](integrations/API-INTEGRATION-GUIDE.md) | Full integration guide |
| [JavaScript SDK](sdks/javascript/README.md) | JS/TS SDK docs |
| [Python SDK](sdks/python/README.md) | Python SDK docs |
| [WordPress Plugin](plugins/wordpress/README.md) | WordPress setup |
| [SOT.md](SOT.md) | Platform source of truth |

---

## License

MIT - Part of the ReZ ecosystem

---

## Support

- **Docs:** docs.rez.money/schedule
- **API:** api.rez.money/schedule/api/docs
- **Email:** support@rez.money
