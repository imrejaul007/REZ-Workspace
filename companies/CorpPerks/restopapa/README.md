# ReStopapa - B2B Restaurant Platform

> **Formerly known as:** Restaurian, RestoPapa
> **Part of:** CorpPerks ecosystem + nextaBizz integration

A comprehensive B2B restaurant SaaS platform for inventory management, vendor procurement, and restaurant operations.

---

## Product Overview

**ReStopapa** is a standalone B2B restaurant platform that integrates with **nextaBizz** for procurement.

### Architecture
```
ReStopapa (B2B Platform)
    ↓ webhooks (inventory signals)
nextaBizz (Procurement)
```

### Key Features
- Restaurant profile management
- Employee management & verification
- Job portal
- Vendor marketplace
- Inventory management
- Community discussions
- Payments (Razorpay)
- **nextaBizz integration** for procurement

---

## Products & Modules

### Web Apps
| App | Tech | Purpose |
|-----|------|---------|
| Frontend | Next.js 14 | Restaurant dashboard |
| Admin Portal | Next.js | Admin management |

### Backend Modules
| Module | Purpose |
|--------|---------|
| Auth | JWT + SSO authentication |
| Restaurants | Restaurant management |
| Employees | Employee CRUD & verification |
| Jobs | Job portal |
| Vendors | Vendor management |
| Marketplace | Purchase orders |
| Discussions | Community forum |
| Payments | Razorpay integration |
| Webhooks | External integrations |
| Analytics | Reporting |

---

## Integration

### nextaBizz Integration
ReStopapa sends inventory signals to nextaBizz:
- `inventory.low_stock` → Creates RFQ in nextaBizz
- `inventory.out_of_stock` → Creates urgent RFQ
- `inventory.stock_updated` → Syncs inventory
- `order.status_changed` → Tracks orders

### ReZ Merchant SSO
Users can login via ReZ Merchant SSO:
```
User → ReStopapa → ReZ Merchant (auth) → ReStopapa (session)
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL (SQLite for dev) |
| Auth | JWT + bcrypt + SSO |
| Payments | Razorpay |
| Queue | Bull (Redis) |

---

## Quick Start

```bash
# Backend
cd backend
npm install
npx prisma db push
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/restopapa

# Auth
JWT_SECRET=your-secret-key
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret

# nextaBizz Integration
NEXTABIZZ_WEBHOOK_URL=https://api.nextabizz.com/webhooks/restopapa
NEXTABIZZ_WEBHOOK_SECRET=your-hmac-secret

# SSO
REZ_MERCHANT_SSO_URL=https://auth.rez.money
REZ_MERCHANT_CLIENT_ID=your-client-id
```

---

## Documentation

| Doc | Description |
|-----|-------------|
| RESTOPAPA_AUDIT.md | Security audit & fixes |
| DEPLOYMENT.md | Deployment guide |
| PRODUCTION_READY.md | Production checklist |

---

## Related Products

| Product | Relationship |
|---------|-------------|
| **CorpPerks** | Parent company platform |
| **nextaBizz** | Procurement integration |
| **ReZ Merchant** | SSO provider |

---

## Git

**Remote:** github.com/imrejaul007/ReStopapa

---

**Last Updated:** May 16, 2026
