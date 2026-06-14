# BIZORA - Industry OS Bridge Features

**Product:** BIZORA
**Version:** 4.0.0
**URL:** https://bizora.corpperks.com
**Last Updated:** June 12, 2026

---

## Overview

BIZORA is the Industry OS bridge layer of CorpPerks that connects the workforce platform to vertical-specific solutions via the REZ Merchant ecosystem. It enables employee benefits, loyalty programs, and HR services across different industries.

---

## Core Features

### Industry Bridges
| Feature | Description | Status |
|---------|-------------|--------|
| Hotel Bridge | Connect to hotel-ecosystem | ✅ |
| Restaurant Bridge | Connect to restauranthub | ✅ |
| Salon Bridge | Connect to salon-ecosystem | ✅ |
| Retail Bridge | Connect to retail-app | ✅ |
| Fitness Bridge | Connect to fitness-app | ✅ |

### Employee Benefits
| Feature | Description | Status |
|---------|-------------|--------|
| Corporate Discounts | Employee discount programs | ✅ |
| Loyalty Integration | Cross-brand loyalty | ✅ |
| Benefits Catalog | Select benefits | ✅ |
| Redemption Tracking | Track benefit usage | ✅ |
| Benefits Analytics | Usage reports | ✅ |

### Multi-Industry Features
| Feature | Description | Status |
|---------|-------------|--------|
| Unified Employee ID | CorpID across industries | ✅ |
| Cross-Industry Benefits | Benefits in any industry | ✅ |
| Industry Dashboard | Per-industry analytics | ✅ |
| Partner Management | Manage industry partners | ✅ |
| Commission Tracking | Partner commissions | ✅ |

### HR Integration
| Feature | Description | Status |
|---------|-------------|--------|
| Employee Sync | Sync employees to partners | ✅ |
| Attendance Sharing | Share attendance data | ✅ |
| Payroll Integration | Benefits deduction | ✅ |
| Compliance | Industry-specific compliance | ✅ |

### Partner Portal
| Feature | Description | Status |
|---------|-------------|--------|
| Partner Dashboard | Business overview | ✅ |
| Employee Management | Manage corporate employees | ✅ |
| Benefits Setup | Configure benefits | ✅ |
| Reports | Usage and commission reports | ✅ |
| Integration Settings | API configuration | ✅ |

---

## Industry-Specific Features

### Hotel Industry
| Feature | Description | Status |
|---------|-------------|--------|
| Room Discounts | Corporate room rates | ✅ |
| F&B Discounts | Food & beverage benefits | ✅ |
| Event Discounts | Corporate event rates | ✅ |
| Loyalty Points | Earn points on stay | ✅ |
| Staff Referrals | Employee referrals | ✅ |

### Restaurant Industry
| Feature | Description | Status |
|---------|-------------|--------|
| Meal Benefits | Corporate meal plans | ✅ |
| Discount Cards | Employee discount cards | ✅ |
| Catering Discounts | Corporate catering | ✅ |
| Loyalty Points | Restaurant points | ✅ |
| Delivery Benefits | Corporate delivery | ✅ |

### Salon Industry
| Feature | Description | Status |
|---------|-------------|--------|
| Service Discounts | Corporate service rates | ✅ |
| Membership Benefits | Premium memberships | ✅ |
| Package Deals | Corporate packages | ✅ |
| Loyalty Points | Salon points | ✅ |
| Gift Cards | Corporate gift cards | ✅ |

### Retail Industry
| Feature | Description | Status |
|---------|-------------|--------|
| Store Discounts | Employee discounts | ✅ |
| Loyalty Points | Retail points | ✅ |
| Corporate Gifting | Bulk gifting | ✅ |
| Exclusive Access | Early sales access | ✅ |
| Return Policies | Enhanced returns | ✅ |

### Fitness Industry
| Feature | Description | Status |
|---------|-------------|--------|
| Gym Memberships | Corporate memberships | ✅ |
| Class Discounts | Class packages | ✅ |
| Personal Training | Corporate PT rates | ✅ |
| Wellness Programs | Corporate wellness | ✅ |
| Referral Benefits | Employee referrals | ✅ |

---

## Screens & Pages

### BIZORA Hub
- `/dashboard` - Main dashboard
- `/dashboard/industries` - Industry overview
- `/dashboard/analytics` - Benefits analytics
- `/dashboard/partners` - Partner overview

### Industries
- `/industries` - All industries
- `/industries/hotel` - Hotel bridge
- `/industries/restaurant` - Restaurant bridge
- `/industries/salon` - Salon bridge
- `/industries/retail` - Retail bridge
- `/industries/fitness` - Fitness bridge

### Benefits
- `/benefits` - Benefits catalog
- `/benefits/catalog` - Browse benefits
- `/benefits/my-benefits` - My benefits
- `/benefits/redemptions` - Redemption history
- `/benefits/analytics` - Usage analytics

### Partners
- `/partners` - Partner list
- `/partners/[id]` - Partner detail
- `/partners/new` - Add partner
- `/partners/[id]/settings` - Partner settings
- `/partners/[id]/reports` - Partner reports

### Employees
- `/employees` - Corporate employees
- `/employees/sync` - Sync employees
- `/employees/benefits` - Assign benefits
- `/employees/usage` - Usage tracking

### Settings
- `/settings` - General settings
- `/settings/industries` - Industry config
- `/settings/partners` - Partner management
- `/settings/integrations` - Bridge settings
- `/settings/commissions` - Commission config

---

## Integrations

### REZ Merchant Ecosystem
| Service | Integration | Status |
|---------|-------------|--------|
| REZ-merchant-bridge | Core bridge | ✅ |
| hotel-ecosystem | Hotel integration | ✅ |
| restauranthub | Restaurant integration | ✅ |
| REZ-salon-ecosystem | Salon integration | ✅ |
| REZ-retail-app | Retail integration | ✅ |
| REZ-fitness-app | Fitness integration | ✅ |

### CorpPerks Services
| Service | Integration | Status |
|---------|-------------|--------|
| api-gateway | REST API | ✅ |
| backend | Employee data | ✅ |
| payroll-service | Deductions | ✅ |
| corpperks-intelligence | Analytics | ✅ |
| push-service | Notifications | ✅ |

### External
| Service | Purpose | Status |
|---------|---------|--------|
| CorpID | Identity | ✅ |
| RABTUL | Payments | ✅ |

---

## API Endpoints

### Industries
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/bizora/industries` | GET | List industries |
| `/api/v1/bizora/industries/:id` | GET | Get industry |
| `/api/v1/bizora/industries/:id/benefits` | GET | Get benefits |

### Benefits
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/bizora/benefits` | GET | List benefits |
| `/api/v1/bizora/benefits/redeem` | POST | Redeem benefit |
| `/api/v1/bizora/benefits/history` | GET | Redemption history |

### Partners
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/bizora/partners` | GET/POST | Manage partners |
| `/api/v1/bizora/partners/:id` | GET/PUT | Partner detail |
| `/api/v1/bizora/partners/:id/employees` | GET | Partner employees |

### Employees
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/bizora/employees/sync` | POST | Sync employees |
| `/api/v1/bizora/employees/:id/benefits` | GET/POST | Assign benefits |

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** React 18, Tailwind CSS
- **State:** Zustand, React Query

### Bridge Services
- **Node.js:** Express.js microservices
- **API Style:** REST with webhooks
- **Auth:** JWT with CorpID

---

## Related Documentation

- [CorpPerks README](/README.md) - Main documentation
- [REZ Merchant Bridge](/REZ-merchant-corpperks-bridge/) - Merchant bridge
- [RTNM Companies Audit](/RTNM-COMPANIES-AUDIT.md) - RTNM ecosystem

---

*Last Updated: June 12, 2026*
*CorpPerks - Industry OS*