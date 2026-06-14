# Salon Ecosystem Architecture

## Overview

The Salon Ecosystem provides a complete beauty & wellness platform with booking, POS, CRM, and AI-powered features.

## Services

| Service | Port | Purpose |
|---------|------|---------|
| `rez-salon-service` | 4010 | Core booking & management |
| `rez-salon-pos-service` | 4011 | Point of Sale & billing |
| `rez-salon-crm-service` | 4012 | Customer management |
| `rez-salon-inventory-service` | 4013 | Product inventory |
| `rez-salon-membership-service` | 4014 | Packages & memberships |
| `rez-salon-reviews-service` | 4015 | Reviews & ratings |
| `rez-salon-qr-service` | 4016 | QR check-in & loyalty |
| `rez-salon-whatsapp-service` | 4017 | WhatsApp booking bot |
| `rez-mind-salon-service` | 4018 | AI pricing & recommendations |
| `rez-salon-franchisor-service` | 4019 | Multi-location management |

## Data Flow

```
User → ReZ App → Salon Service (booking)
                 → POS Service (payment)
                 → QR Service (loyalty)
                 → WhatsApp Bot (alternate booking)

Business → Admin Web → Salon Service
                       → POS Service
                       → CRM Service
                       → Inventory Service
```

## Tech Stack

- Node.js + Express + TypeScript
- MongoDB (Mongoose)
- Redis (caching, sessions)
- BullMQ (background jobs)
- WhatsApp Web.js (bot)

## Key Features

1. **Booking** - Slot-based appointment scheduling
2. **POS** - Service billing, GST invoices
3. **CRM** - Customer profiles, campaigns
4. **Loyalty** - Points, tiers, referral
5. **WhatsApp** - Natural language booking
6. **AI** - Dynamic pricing, recommendations
