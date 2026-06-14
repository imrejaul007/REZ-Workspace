# RestoPapa - Restaurant Management System Features

**Product:** RestoPapa
**Version:** 4.0.0
**URL:** https://restopapa.corpperks.com
**Framework:** Next.js 14
**Last Updated:** June 12, 2026

---

## Overview

RestoPapa is a comprehensive Restaurant Management System (RMS) that integrates with CorpPerks for employee management, benefits, and payroll. It covers front-of-house operations, kitchen management, inventory, and analytics.

---

## Core Features

### Point of Sale (POS)
| Feature | Description | Status |
|---------|-------------|--------|
| Order Management | Create, modify, split orders | ✅ |
| Table Management | Floor plan, table status | ✅ |
| Menu Display | Digital menu boards | ✅ |
| Quick Service | Fast order entry | ✅ |
| Order Types | Dine-in, Takeout, Delivery | ✅ |
| Split Bill | Divide by items/people | ✅ |
| Discounts | Item/table level discounts | ✅ |
| Tips | Tip collection and distribution | ✅ |
| Print Receipts | Kitchen ticket printing | ✅ |
| QR Ordering | Customer QR code ordering | ✅ |
| KOT Management | Kitchen order tickets | ✅ |

### Kitchen Management
| Feature | Description | Status |
|---------|-------------|--------|
| Kitchen Display | Digital KDS | ✅ |
| Order Routing | Route to stations | ✅ |
| Prep Time Tracking | Track cooking times | ✅ |
| Bump System | Mark items ready | ✅ |
| Allergen Alerts | Highlight allergens | ✅ |
| Recipe Cards | Digital recipes | ✅ |
| Portion Control | Standard portions | ✅ |

### Menu Management
| Feature | Description | Status |
|---------|-------------|--------|
| Menu Builder | Create and manage menu | ✅ |
| Category Management | Item categories | ✅ |
| Modifier Groups | Add-ons and options | ✅ |
| Combo Deals | Package deals | ✅ |
| Seasonal Menu | Time-based items | ✅ |
| Price Management | Update prices | ✅ |
| Item Availability | 86 items | ✅ |
| Menu Analytics | Popular items | ✅ |

### Inventory Management
| Feature | Description | Status |
|---------|-------------|--------|
| Stock Tracking | Real-time inventory | ✅ |
| Purchase Orders | PO creation | ✅ |
| Supplier Management | Vendor contacts | ✅ |
| Receiving | GRN management | ✅ |
| Waste Tracking | Spoilage recording | ✅ |
| Low Stock Alerts | Reorder alerts | ✅ |
| Cost Analysis | Food cost % | ✅ |
| Par Levels | Minimum stock levels | ✅ |

### Table & Reservation
| Feature | Description | Status |
|---------|-------------|--------|
| Reservation System | Book tables | ✅ |
| Waitlist | Manage waitlist | ✅ |
| Table Turnover | Track table time | ✅ |
| Guest Profiles | Customer preferences | ✅ |
| Loyalty Program | Points system | ✅ |
| Feedback Collection | Post-meal surveys | ✅ |

### Employee Management (CorpPerks Integration)
| Feature | Description | Status |
|---------|-------------|--------|
| Staff Scheduling | Shift scheduling | ✅ |
| Time Clock | Attendance tracking | ✅ |
| Role Management | Server, cook, host | ✅ |
| Tip Distribution | Auto-split tips | ✅ |
| Performance | Staff metrics | ✅ |
| Payroll Integration | CorpPerks payroll | ✅ |

### Billing & Payments
| Feature | Description | Status |
|---------|-------------|--------|
| Multiple Payment | Cash, card, digital | ✅ |
| Split Payment | Multiple payment methods | ✅ |
| GST Invoicing | Tax-compliant invoices | ✅ |
| Discount Codes | Promo codes | ✅ |
| Gift Cards | Gift card support | ✅ |
| Partial Payment | Pay in parts | ✅ |
| Settlement | End of day close | ✅ |

### Analytics & Reports
| Feature | Description | Status |
|---------|-------------|--------|
| Sales Dashboard | Real-time sales | ✅ |
| Revenue Reports | Daily/weekly/monthly | ✅ |
| Item Performance | Best sellers | ✅ |
| Table Analytics | Turnover rates | ✅ |
| Staff Performance | Server sales | ✅ |
| Cost Reports | Food cost analysis | ✅ |
| Profit Margins | Margin tracking | ✅ |
| Export Reports | Excel/PDF | ✅ |

### Multi-Location
| Feature | Description | Status |
|---------|-------------|--------|
| HQ Dashboard | All locations | ✅ |
| Location Management | Add/edit locations | ✅ |
| Cross-Location Orders | Transfer orders | ✅ |
| Consolidated Reports | Combined analytics | ✅ |
| Menu Sync | Sync menus | ✅ |
| Inventory Transfer | Transfer stock | ✅ |

---

## Screens & Pages

### Dashboard
- `/dashboard` - Main dashboard
- `/dashboard/real-time` - Live POS view
- `/dashboard/analytics` - Analytics

### POS
- `/pos` - Point of Sale
- `/pos/table/[id]` - Table order
- `/pos/kitchen` - Kitchen display
- `/pos/menu` - Menu management
- `/pos/modifiers` - Modifier groups
- `/pos/combos` - Combo deals

### Orders
- `/orders` - Order list
- `/orders/[id]` - Order detail
- `/orders/kot` - Kitchen tickets
- `/orders/delivery` - Delivery orders
- `/orders/takeout` - Takeout orders

### Reservations
- `/reservations` - All reservations
- `/reservations/new` - New booking
- `/reservations/waitlist` - Waitlist
- `/reservations/settings` - Floor plan

### Inventory
- `/inventory` - Stock overview
- `/inventory/items` - Item list
- `/inventory/categories` - Categories
- `/inventory/suppliers` - Suppliers
- `/inventory/orders` - Purchase orders
- `/inventory/receiving` - GRN
- `/inventory/reports` - Reports

### Staff
- `/staff` - Staff management
- `/staff/schedule` - Shift schedule
- `/staff/attendance` - Time clock
- `/staff/roles` - Role management
- `/staff/tips` - Tip management
- `/staff/performance` - Performance

### Billing
- `/billing` - Billing dashboard
- `/billing/invoices` - All invoices
- `/billing/discounts` - Discounts
- `/billing/gift-cards` - Gift cards
- `/billing/settlements` - Settlements

### Reports
- `/reports/sales` - Sales reports
- `/reports/item` - Item reports
- `/reports/staff` - Staff reports
- `/reports/cost` - Cost reports
- `/reports/profit` - Profit reports

### Settings
- `/settings` - General settings
- `/settings/restaurant` - Restaurant profile
- `/settings/locations` - Locations
- `/settings/taxes` - Tax configuration
- `/settings/printers` - Printer setup
- `/settings/integrations` - Integrations

---

## Integrations

### Internal Services
| Service | Integration | Status |
|---------|-------------|--------|
| api-gateway | REST API | ✅ |
| backend | Employee data | ✅ |
| payroll-service | Staff payroll | ✅ |
| shift-service | Shift scheduling | ✅ |
| analytics-service | Reports | ✅ |
| corpperks-intelligence | AI insights | ✅ |

### REZ Merchant Integration
| Service | Purpose | Status |
|---------|---------|--------|
| REZ-merchant-bridge | GST & invoicing | ✅ |
| Restaurant Hub | Order sync | ✅ |
| Delivery Integration | Delivery tracking | ✅ |

### External Integrations
| Service | Purpose | Status |
|---------|---------|--------|
| CorpID | Staff identity | ✅ |
| RABTUL | Payment gateway | ✅ |
| Printer | Kitchen receipt printers | ✅ |
| POS Hardware | Card machines | ✅ |

---

## API Endpoints

### Orders
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/orders` | GET | List orders |
| `/api/v1/orders` | POST | Create order |
| `/api/v1/orders/:id` | GET | Get order |
| `/api/v1/orders/:id` | PUT | Update order |
| `/api/v1/orders/:id/status` | PUT | Update status |

### Menu
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/menu/items` | GET/POST | Manage items |
| `/api/v1/menu/categories` | GET/POST | Manage categories |
| `/api/v1/menu/modifiers` | GET/POST | Manage modifiers |

### Inventory
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/inventory` | GET | Get stock |
| `/api/v1/inventory/adjust` | POST | Adjust stock |
| `/api/v1/inventory/orders` | POST | Create PO |

### Billing
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/billing/calculate` | POST | Calculate bill |
| `/api/v1/billing/pay` | POST | Process payment |
| `/api/v1/billing/invoice` | GET | Get invoice |

### Staff
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/staff/shifts` | GET/POST | Manage shifts |
| `/api/v1/staff/attendance` | GET | Get attendance |
| `/api/v1/staff/tips` | GET/POST | Manage tips |

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** React 18, Tailwind CSS
- **State:** Zustand, React Query
- **Real-time:** WebSocket for KDS

### Backend Communication
- **API Client:** Fetch with auth
- **Real-time:** WebSocket for live updates
- **Auth:** JWT with CorpID

---

## Related Documentation

- [CorpPerks README](/README.md) - Main documentation
- [BIZORA README](/BIZORA/README.md) - Industry bridges
- [REZ Merchant Integration](/docs/INTEGRATIONS.md) - External integrations

---

*Last Updated: June 12, 2026*
*CorpPerks - Restaurant OS*