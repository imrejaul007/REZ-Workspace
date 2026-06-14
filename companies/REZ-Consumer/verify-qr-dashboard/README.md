# Verify QR Dashboard

**AI-powered Product Trust & Warranty Infrastructure Dashboard**

> **Version 2.0** - Ownership Passport, Resale Safety, OEM Analytics

---

## Overview

The Verify QR Dashboard is a consumer-facing dashboard for managing warranties, scanning QR codes, filing claims, transferring ownership, and accessing the complete product trust ecosystem.

### Features (v2.0)

| Category | Features |
|----------|----------|
| **Verification** | QR Scanner, Manual Entry, Verification History |
| **Warranties** | View, Activate, Extend warranties |
| **Claims** | File, Track, Manage claims |
| **Ownership** | Ownership Passport, Certificates, Transfer |
| **Resale** | Resale Verification, Buyer Checks, Safety |
| **Service** | Book Service, Track Appointments |
| **Extended** | Warranty Plans, Subscriptions |

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** React Hooks
- **QR Scanning:** Camera API + Manual Entry

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Navigate to the project directory
cd verify-qr-dashboard

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Environment Variables

```env
# API Configuration
NEXT_PUBLIC_VERIFY_API_URL=http://localhost:4003
VERIFY_INTERNAL_TOKEN=your-internal-token

# App Configuration
NEXT_PUBLIC_APP_NAME=Verify QR
NEXT_PUBLIC_COMPANY_NAME=ReZ
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Project Structure

```
verify-qr-dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # My Warranties
│   │   ├── scan/page.tsx               # QR Scanner
│   │   ├── claims/page.tsx             # My Claims
│   │   ├── transfer/page.tsx           # Ownership Transfer
│   │   ├── passport/page.tsx            # Ownership Passport (NEW!)
│   │   ├── resale/page.tsx             # Resale Verification (NEW!)
│   │   ├── plans/page.tsx              # Warranty Plans (NEW!)
│   │   ├── layout.tsx                 # Root layout
│   │   └── globals.css                # Global styles
│   ├── components/
│   │   ├── WarrantyCard.tsx           # Warranty display
│   │   ├── ClaimForm.tsx              # File claims
│   │   ├── QRScanner.tsx              # Camera QR scanner
│   │   ├── PassportCard.tsx           # Ownership passport (NEW!)
│   │   ├── ResaleCheck.tsx            # Resale verification (NEW!)
│   │   └── ServiceBooking.tsx          # Service booking
│   └── services/
│       └── api.ts                     # API client
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── .env.example
```

---

## Pages

### My Warranties (/)

- View all warranties in grid layout
- Filter by status (All, Active, Expired, Claimed)
- Search by product, brand, or serial number
- Stats cards showing counts
- Warranty cards with QR code display

### QR Scanner (/scan)

- Camera-based QR code scanning
- Manual QR code entry option
- Demo scan for testing
- Warranty verification result
- Quick actions (view, claim, transfer)

### My Claims (/claims)

- List all claims with status
- Filter by claim status
- Create new claim modal
- Claim details with timeline
- Support escalation

### Ownership Transfer (/transfer)

- Transfer ownership to another user
- Enter recipient details
- Generate transfer verification
- Track transfer status

### Ownership Passport (/passport) **NEW!**

- View ownership passport for products
- Shareable certificate
- Ownership chain history
- Service history
- Warranty status

### Resale Verification (/resale) **NEW!**

- Request verification before purchase
- Risk assessment
- Ownership chain verification
- Safety recommendations

### Warranty Plans (/plans) **NEW!**

- Browse extended warranty plans
- Plan comparison
- Subscribe to plans
- View active subscriptions

---

## API Integration

The dashboard integrates with the `verify-qr-service` API (Port 4003).

### Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/verify` | Verify product |
| POST | `/api/activate-warranty` | Activate warranty |
| GET | `/api/passport/:serial` | Get passport |
| POST | `/api/passport/create` | Create passport |
| POST | `/api/passport/:serial/transfer` | Transfer ownership |
| GET | `/api/resale/buyer-check/:serial` | Resale check |
| GET | `/api/warranty-plans` | List plans |
| POST | `/api/subscribe` | Subscribe to plan |

### API Service

All API calls go through `src/services/api.ts`:

```typescript
import { api } from '@/services/api';

// Verify a product
const result = await api.verify('REZ123456789', 'user_123');

// Create passport
const passport = await api.createPassport({
  serial_number: 'REZ123456789',
  user_id: 'user_123',
  customer_name: 'John Doe',
  purchase_date: '2026-05-01'
});

// Resale check
const check = await api.buyerCheck('REZ123456789');
```

---

## Development

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint
```

---

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Related Services

| Service | Port | Location |
|---------|------|----------|
| verify-qr-service | 4003 | `verify-qr-service/` |
| verify-qr-admin | - | `verify-qr-admin/` |

---

## Documentation

| Document | Description |
|----------|-------------|
| Service API Docs | `verify-qr-service/docs/` |
| Platform Docs | `docs/VERIFIED-PLATFORM.md` |
| QR Ecosystem | `docs/QR-ECOSYSTEM.md` |

---

## License

Part of the ReZ Full App ecosystem.
Proprietary - RTNM Group

---

## Support

- **Email:** support@rez.money
- **Docs:** https://docs.verify-qr.rezapp.com
