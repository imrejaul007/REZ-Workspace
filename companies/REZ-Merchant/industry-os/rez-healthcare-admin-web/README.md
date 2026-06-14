# Healthcare Admin Portal

**Location:** `/REZ-Merchant/industry-os/rez-healthcare-admin-web/`
**Tech Stack:** Next.js 14 + React18 + Tailwind CSS + Recharts
**Port:** 3000 (configurable)
**Status:** COMPLETE

---

## Overview

Comprehensive healthcare management admin portal for clinic/hospital administrators, doctors, and staff.

## Features

### Dashboard
- [ ] Today's appointments overview
- [ ] Patient statistics (new, returning, critical)
- [ ] Revenue metrics (consultations, procedures, pharmacy)
- [ ] Pending tasks and alerts
- [ ] Quick actions

### Patient Management
- [ ] Patient list with search and filters
- [ ] Patient profile with medical history
- [ ] Appointment history
- [ ] Prescription history
- [ ] Insurance information
- [ ] Patient documents

### Appointments
- [ ] Calendar view (day/week/month)
- [ ] Appointment booking
- [ ] Slot management
- [ ] Doctor schedule
- [ ] Waitlist management
- [ ] Cancellation handling

### Billing
- [ ] Invoice generation
- [ ] Payment tracking
- [ ] Insurance claims
- [ ] GST-compliant billing
- [ ] Refund processing
- [ ] Financial reports

### Pharmacy
- [ ] Medicine inventory
- [ ] Prescription management
- [ ] Drug interactions check
- [ ] Expiry alerts
- [ ] Supplier management

### Analytics
- [ ] Patient flow analytics
- [ ] Revenue trends
- [ ] Doctor performance
- [ ] Department metrics
- [ ] Export reports

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** Tailwind CSS + Lucide React
- **Charts:** Recharts
- **State:** Zustand
- **Tables:** TanStack Table
- **Forms:** React Hook Form + Zod
- **HTTP:** Axios
- **Dates:** date-fns

## Quick Start

```bash
cd rez-healthcare-admin-web
npm install
npm run dev
# Open http://localhost:3000
```

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_HOSPITAL_ID=default
```

## API Integration

Connects to REZ-Merchant healthcare services:
- `rez-healthcare-service` (4000)
- `rez-healthcare-appointment-service`
- `rez-healthcare-billing-service`
- `rez-healthcare-patient-service`
- `rez-pharmacy-service` (4008)

## Screens

1. **Login** - Authentication
2. **Dashboard** - Overview metrics
3. **Patients** - Patient management
4. **Appointments** - Calendar and booking
5. **Billing** - Financial management
6. **Pharmacy** - Medicine management
7. **Settings** - Clinic configuration

---

**Owner:** REZ-Merchant
**Industry:** Healthcare
