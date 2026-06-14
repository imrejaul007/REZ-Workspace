# Creator QR Service

**Backend Service for Creator QR Infrastructure**

Part of AdBazaar. This is the backend service that powers the Creator QR platform.

---

## Overview

| Item | Details |
|------|---------|
| **Type** | Express.js Backend Service |
| **Company** | AdBazaar |
| **Port** | TBD |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB (Mongoose) |
| Cache | Redis (ioredis) |
| Queue | BullMQ |
| Validation | Zod |
| Authentication | JWT |

---

## API Endpoints

### QR Management
- `POST /api/qr/create` - Generate new QR code
- `GET /api/qr/:id` - Get QR details
- `DELETE /api/qr/:id` - Delete QR code

### Analytics
- `GET /api/analytics/:creatorId` - Creator analytics
- `GET /api/analytics/qr/:id` - QR-specific analytics

### Creator
- `GET /api/creator/:id` - Creator profile
- `PUT /api/creator/:id` - Update profile

---

## Quick Start

```bash
# Install dependencies
npm install

# Run development
npm run dev

# Build for production
npm run build

# Start production
npm start
```

---

## Related

| Repo | Purpose |
|------|---------|
| AdBazaar/creators/creator-qr | Frontend application |
| AdBazaar/creators | Creator portal (main) |
| AdBazaar/REZ-creator-commerce | Commerce integration |
