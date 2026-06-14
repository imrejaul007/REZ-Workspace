# REZ Corporate Service - Documentation

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



**Version:** 1.0.0
**Last Updated:** 2026-05-02

---

## Overview

`rez-corporate-service` is the central orchestration service for corporate features including HRIS integration, corporate card management, GST compliance, travel booking, and expense management.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Corporate Service                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐     │
│  │   HRIS Service   │    │  Card Service    │    │   GST Service   │     │
│  │  (GreytHR/Bamboo/Zoho)  │ (Razorpay)     │    │   (e-Invoice)   │     │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘     │
│           │                       │                       │                  │
│  ┌────────▼─────────┐    ┌────────▼─────────┐    ┌────────▼─────────┐     │
│  │ Employee Sync    │    │ Virtual Cards     │    │ IRN Generation   │     │
│  │ Auto-provision   │    │ Transaction Rec  │    │ GSTR-2B Match   │     │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘     │
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐                             │
│  │  Travel Service   │    │   Budget/Expense  │                             │
│  │  (TBO/GDS)       │    │    Service       │                             │
│  └──────────────────┘    └──────────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Services

### 1. HRIS Integration

**Supported Providers:**
- GreytHR (Priority - India market)
- BambooHR
- Zoho People

**Features:**
- OAuth2 authentication
- Employee sync (full/incremental)
- Field mapping configuration
- Webhook handlers
- Scheduled sync (hourly)

### 2. Corporate Cards

**Provider:** Razorpay Corporate Cards

**Features:**
- Virtual card creation
- Spending limits (daily/monthly/per-transaction)
- MCC-based restrictions
- Transaction tracking
- Real-time notifications

### 3. GST e-Invoice

**Features:**
- IRN generation
- QR code generation
- E-way bill
- GSTR-2B reconciliation
- Invoice management

### 4. Travel Booking

**Provider:** TBO (Travel Business Online)

**Features:**
- Hotel search & booking
- Flight search & booking
- Travel policy compliance
- Approval workflows
- Budget enforcement

---

## API Endpoints

### HRIS

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/corporate/hris/connections` | Create connection |
| GET | `/api/corporate/hris/connections/:companyId` | List connections |
| POST | `/api/corporate/hris/connections/:id/connect` | Connect |
| POST | `/api/corporate/hris/connections/:id/sync` | Sync employees |
| GET | `/api/corporate/employees/:companyId` | List employees |

### Cards

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/corporate/cards` | Create virtual card |
| GET | `/api/corporate/cards/company/:companyId` | Company cards |
| GET | `/api/corporate/cards/employee/:employeeId` | Employee cards |
| POST | `/api/corporate/cards/:id/block` | Block card |
| GET | `/api/corporate/cards/transactions/:companyId` | Transactions |

### GST

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/corporate/gst/invoices` | Create invoice |
| POST | `/api/corporate/gst/invoices/:id/irn` | Generate IRN |
| POST | `/api/corporate/gst/invoices/:id/cancel` | Cancel IRN |
| POST | `/api/corporate/gst/reconcile/:companyId` | GSTR-2B match |

### Travel

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/corporate/travel/hotels/search` | Search hotels |
| POST | `/api/corporate/travel/requests` | Create request |
| POST | `/api/corporate/travel/requests/:id/approve` | Approve |
| POST | `/api/corporate/travel/bookings/hotel` | Book hotel |
| GET | `/api/corporate/travel/bookings/:employeeId` | Bookings |
| POST | `/api/corporate/travel/bookings/:id/cancel` | Cancel |
| POST | `/api/corporate/travel/policies` | Create policy |

### Company

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/corporate/companies` | Create company |
| GET | `/api/corporate/companies/:id` | Get company |

---

## Deployment

### Render Blueprint

```yaml
services:
  - type: web
    name: rez-corporate-service
    env: node
    region: singapore
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: MONGODB_URI
        sync: false
```

---

## Environment Variables

See `.env.example` for all required variables.

---

**Maintained by:** REZ Team
**Repository:** imrejaul007/rez-corporate-service
