# Creator QR

**Personal Commerce Infrastructure for Creators**

Part of AdBazaar. Creator QR enables creators to monetize their content through QR codes.

---

## Overview

| Item | Details |
|------|---------|
| **Type** | Next.js Web Application |
| **Company** | AdBazaar |
| **Purpose** | Creator monetization via QR codes |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 |
| Language | TypeScript |
| Database | MongoDB (Mongoose) |
| QR Generation | qrcode |
| Validation | Zod |
| Logging | Winston |
| Deployment | Vercel, Render |

---

## Features

### Core Features
- QR code generation for creator content
- Personal commerce pages
- Analytics and tracking
- Integration with AdBazaar ecosystem

### Creator Dashboard
- QR code management
- Analytics dashboard
- Revenue tracking
- Content links

---

## Quick Start

```bash
# Install dependencies
npm install

# Setup database
npm run db:setup
npm run db:seed

# Run development
npm run dev

# Build for production
npm run build
```

---

## Related

| Repo | Purpose |
|------|---------|
| AdBazaar/creators | Creator portal (main) |
| AdBazaar/creators/creator-qr-service | Backend service |
| AdBazaar/REZ-creator-commerce | Commerce integration |
