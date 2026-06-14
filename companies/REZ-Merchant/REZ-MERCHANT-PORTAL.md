# REZ Merchant Portal - Unified Admin Platform

**Single portal for all 15 industries.**

**Version:** 1.0.0  
**Date:** June 8, 2026  
**Port:** 4200  
**URL:** `merchant.rez.money` or `admin.rez.money`

---

## Vision

**"One portal. Every industry. Zero complexity."**

A single admin dashboard where merchants can:
1. Select their industry (Restaurant, Hotel, Salon, etc.)
2. Access industry-specific modules
3. Switch between industries seamlessly
4. See unified metrics across all businesses

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REZ UNIFIED MERCHANT PORTAL                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    UNIFIED LAYER                             │   │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │   │
│   │  │ Dashboard│ │Settings │ │ Reports │ │ Users  │ │ More  │ │   │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────┘ │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    INDUSTRY SELECTOR                         │   │
│   │   [🍽️ Restaurant] [🏨 Hotel] [💇 Salon] [🏪 Retail] [+]    │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                   INDUSTRY MODULES                           │   │
│   │                                                               │   │
│   │   Restaurant:  POS │ KDS │ Menu │ Orders │ Tables │ Staff   │   │
│   │   Hotel:      PMS │ Housekeeping │ Maintenance │ Booking    │   │
│   │   Salon:      Appointments │ Membership │ Inventory │ CRM  │   │
│   │   Retail:     Products │ Inventory │ Suppliers │ Reports    │   │
│   │   ...                                                     │   │
│   │                                                               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 15 Industries Module Support

| # | Industry | Modules |
|---|----------|---------|
| 1 | **Restaurant** | POS, KDS, Menu, Orders, Tables, Reservations, CRM, Loyalty, Inventory |
| 2 | **Hotel** | PMS, Housekeeping, Maintenance, Messaging, Booking, Room Service, Laundry, Spa |
| 3 | **Salon/Spa** | Appointments, Membership, Inventory, CRM, WhatsApp, QR Check-in |
| 4 | **Fitness/Gym** | Access Control, Classes, Schedules, Attendance, Analytics |
| 5 | **Healthcare** | Appointments, Pharmacy, Patient Records, Billing |
| 6 | **Retail** | POS, Inventory, Suppliers, Loyalty, Analytics |
| 7 | **Grocery** | Products, Inventory, Expiry Tracking, Suppliers |
| 8 | **Education** | Courses, Attendance, Scheduling, LMS |
| 9 | **Events** | Bookings, Ticketing, Scheduling |
| 10 | **Pharmacy** | Inventory, Prescriptions, Orders |
| 11 | **Automotive** | Vehicle Inventory, Service Records, Spare Parts |
| 12 | **Fashion** | Collections, Style Profiles, Inventory |
| 13 | **Drive-thru** | KDS, Order Management |
| 14 | **Self-Kiosk** | Self-service Management |
| 15 | **Travel** | Bookings, Itineraries |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Charts | Recharts |
| State | Zustand |
| Auth | RABTUL Auth |

---

## Features

### 1. Industry Selector
```tsx
// Top-level tab or sidebar to switch industries
<IndustrySelector 
  industries={INDUSTRIES}
  selected={currentIndustry}
  onChange={setIndustry}
/>
```

### 2. Dynamic Module Loading
```tsx
// Load industry-specific modules based on selection
{industry === 'restaurant' && <RestaurantModule />}
{industry === 'hotel' && <HotelModule />}
{industry === 'salon' && <SalonModule />}
```

### 3. Unified Navigation
```
├── Dashboard (unified metrics)
├── [Industry] (dynamic based on selection)
│   ├── POS / Orders
│   ├── Inventory
│   ├── Customers / CRM
│   ├── Staff
│   ├── Reports
│   └── Settings
├── All Industries (multi-business view)
├── Settings (profile, billing)
└── Help
```

### 4. Multi-Business Support
Merchants with multiple businesses (e.g., 2 restaurants + 1 hotel) can:
- See all locations in one view
- Switch between locations
- Compare performance across businesses
- Unified reporting

---

## Directory Structure

```
REZ-Merchant/rez-merchant-portal/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login, register
│   │   ├── (dashboard)/      # Main dashboard
│   │   │   ├── layout.tsx    # Sidebar + header
│   │   │   ├── page.tsx      # Unified dashboard
│   │   │   ├── [industry]/   # Dynamic industry routes
│   │   │   ├── [industry]/[module]/ # Module pages
│   │   │   ├── settings/
│   │   │   └── reports/
│   │   └── api/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── IndustrySelector.tsx
│   │   ├── modules/
│   │   │   ├── restaurant/
│   │   │   │   ├── POSView.tsx
│   │   │   │   ├── KDSView.tsx
│   │   │   │   ├── MenuView.tsx
│   │   │   │   └── ...
│   │   │   ├── hotel/
│   │   │   │   ├── PMSView.tsx
│   │   │   │   ├── HousekeepingView.tsx
│   │   │   │   └── ...
│   │   │   ├── salon/
│   │   │   ├── retail/
│   │   │   └── ... (all 15 industries)
│   │   └── ui/               # Shared UI components
│   ├── lib/
│   │   ├── industries.ts     # Industry definitions
│   │   ├── modules.ts        # Module configs
│   │   └── api.ts            # API client
│   └── types/
│       └── index.ts
├── package.json
└── README.md
```

---

## Quick Start

```bash
# Create the portal
cd REZ-Merchant
mkdir -p rez-merchant-portal
cd rez-merchant-portal

# Initialize Next.js
npx create-next-app@latest . --typescript --tailwind --eslint

# Install dependencies
npm install zustand recharts lucide-react @rez/shared

# Start development
npm run dev

# Open http://localhost:4200
```

---

## API Integration

```typescript
// src/lib/api.ts
import { createEcosystemClient } from '@rez/sdk';

const api = createEcosystemClient({
  baseUrl: process.env.NEXT_PUBLIC_GATEWAY_URL,
  apiKey: process.env.REZ_API_KEY
});

// Get industry-specific data
export async function getIndustryData(industry: string, merchantId: string) {
  const endpoints = {
    restaurant: '/api/restaurant',
    hotel: '/api/hotel',
    salon: '/api/salon',
    // ...
  };
  
  return api.get(endpoints[industry], { merchantId });
}
```

---

## Migration Path

### Phase 1: Create Unified Portal
- Build the shell with industry selector
- Migrate most-used modules (Restaurant, Hotel, Salon)

### Phase 2: Add Industry Coverage
- Add remaining 12 industries
- Migrate existing admin webs into unified portal

### Phase 3: Consolidate
- Merge `REZ-dashboard` into unified portal
- Merge `REZ-atlas-dashboard` as a module
- Archive individual admin webs

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Page Load Time | < 2s |
| Industry Switch | < 500ms |
| Modules per Industry | 5-10 |
| Supported Industries | 15/15 |

---

**Status:** Proposed  
**Next Step:** Build `rez-merchant-portal`