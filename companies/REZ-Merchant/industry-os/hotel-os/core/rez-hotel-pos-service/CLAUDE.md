# CLAUDE.md - ReZ Hotel POS Service

---

## Service Discovery

This service is registered in REZ-Master/services.json.

To discover related services:
```bash
# From REZ-Master directory
node rez-cli find <service-name>  # Find specific service
node rez-cli list --category <category>  # List by category
node rez-cli stats  # Platform statistics
```

Quick search:
- `node rez-cli list --search payment` - Find payment services
- `node rez-cli list --search auth` - Find auth services
- `node rez-cli list --search kds` - Find KDS services
- `node rez-cli list --search ai` - Find AI services

---



## Overview

This service handles billing operations for hotel outlets including:
- Restaurant
- Minibar
- Spa
- Banquet

Integrated with PMS (Property Management System) for guest folio management.

## Architecture

```
rez-hotel-pos-service/
├── src/
│   ├── index.ts              # Main entry point
│   ├── models/               # Mongoose models
│   │   ├── Folio.ts         # Guest folio model
│   │   ├── Transaction.ts   # Transaction model
│   │   └── Item.ts          # Menu/treatment item model
│   ├── services/             # Business logic
│   │   ├── FolioService.ts  # Folio management
│   │   ├── PaymentService.ts # Payment processing
│   │   ├── SplitBillService.ts # Split billing
│   │   └── GstInvoiceService.ts # GST invoice generation
│   ├── outlets/              # Outlet-specific logic
│   │   ├── restaurant.ts
│   │   ├── minibar.ts
│   │   ├── spa.ts
│   │   └── banquet.ts
│   ├── routes/              # API routes
│   │   ├── folio.routes.ts
│   │   ├── outlet.routes.ts
│   │   └── payment.routes.ts
│   ├── config/               # Configuration
│   ├── middleware/           # Express middleware
│   └── health.ts             # Health check server
```

## Key Patterns

### Folio Management
- Folios track guest charges across multiple outlets
- Charges are automatically added to guest room bill
- Supports PMS integration for posting

### Split Billing
- Enable split billing on any open folio
- Supports equal split or custom percentage split
- Tracks individual settlement status

### GST Invoice Generation
- Follows Indian GST compliance
- Generates e-invoice format with HSN codes
- Supports CGST/SGST breakdown for intra-state

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Environment Variables

See `.env.example` for all required variables.

Key variables:
- `MONGODB_URI` - MongoDB connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - JWT signing secret
- `PAYMENT_SERVICE_URL` - ReZ Payment service URL
- `PMS_SERVICE_URL` - PMS integration URL
