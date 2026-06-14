# CorpPerks Documentation Index

**Version:** 4.2.0
**Last Updated:** June 12, 2026

---

## Overview

This directory contains comprehensive documentation for the CorpPerks platform. All feature documentation for individual products is organized here.

---

## Documentation Structure

```
docs/
├── README.md                    # This file
├── API-REFERENCE.md             # API endpoint documentation
├── DEPLOYMENT-GUIDE.md         # Detailed deployment instructions
├── INTEGRATIONS.md             # Integration setup guides
├── QUICK-REFERENCE.md          # Quick reference guide
├── REALTIME-PUSH-INTEGRATION.md # Real-time and push setup
├── SERVICE-REUSE-AUDIT.md      # Service reuse analysis
├── WALLET-SYSTEM.md            # Wallet and payment system
│
├── peopleos/
│   └── FEATURES.md             # PeopleOS (Workforce OS) features
│
├── talentai/
│   └── FEATURES.md             # TalentAI (Career Intelligence) features
│
├── insight-campus/
│   └── FEATURES.md             # InsightCampus (Student Campus) features
│
├── people/
│   └── FEATURES.md             # People App (Employee Mobile) features
│
├── restopapa/
│   └── FEATURES.md             # RestoPapa (Restaurant OS) features
│
├── bizora/
│   └── FEATURES.md             # BIZORA (Industry Bridges) features
│
└── corpid/
    └── FEATURES.md             # CorpID (Universal Identity) features
```

---

## Quick Links

### Getting Started
- [Main README](/README.md) - Platform overview
- [Developer Guide](/CLAUDE.md) - Development instructions
- [Source of Truth](/SOT.md) - Complete specifications
- [Quick Reference](/docs/QUICK-REFERENCE.md) - Quick reference guide

### Deployment
- [Deployment Guide](/docs/DEPLOYMENT-GUIDE.md) - Detailed deployment
- [API Reference](/docs/API-REFERENCE.md) - API documentation
- [Integrations](/docs/INTEGRATIONS.md) - Integration setup

### Product Documentation

| Product | Documentation |
|---------|---------------|
| **PeopleOS** (Workforce OS) | [FEATURES.md](/docs/peopleos/FEATURES.md) |
| **TalentAI** (Career Intelligence) | [FEATURES.md](/docs/talentai/FEATURES.md) |
| **InsightCampus** (Student Campus) | [FEATURES.md](/docs/insight-campus/FEATURES.md) |
| **People App** (Employee Mobile) | [FEATURES.md](/docs/people/FEATURES.md) |
| **RestoPapa** (Restaurant OS) | [FEATURES.md](/docs/restopapa/FEATURES.md) |
| **BIZORA** (Industry Bridges) | [FEATURES.md](/docs/bizora/FEATURES.md) |
| **CorpID** (Universal Identity) | [FEATURES.md](/docs/corpid/FEATURES.md) |

---

## Web Applications

| App | URL | Purpose | Docs |
|-----|-----|---------|------|
| **peopleos** | peopleos.corpperks.com | Workforce OS | [Features](/docs/peopleos/FEATURES.md) |
| **talentai** | talentai.corpperks.com | Career Intelligence | [Features](/docs/talentai/FEATURES.md) |
| **insight-campus** | insight.corpperks.com | Student Campus | [Features](/docs/insight-campus/FEATURES.md) |
| **client-portal** | clients.corpperks.com | Client Management | - |
| **admin-dashboard** | admin.corpperks.com | Admin Panel | - |
| **super-admin** | platform.corpperks.com | Platform Admin | - |
| **support-portal** | support.corpperks.com | Support Hub | - |
| **corpperks-landing** | corpperks.com | Marketing | - |

---

## Mobile Applications

| App | Platform | Purpose | Docs |
|-----|----------|---------|------|
| **people** | iOS/Android | Employee App | [Features](/docs/people/FEATURES.md) |
| **manager-app** | iOS/Android | Manager App | - |
| **client-app** | iOS/Android | Client App | - |
| **talentai-app** | iOS/Android | Career App | - |
| **insight-app** | iOS/Android | Student App | - |

---

## Microservices

| Service | Port | Purpose |
|---------|------|---------|
| **api-gateway** | 4700 | Unified API Gateway |
| **backend** | 4006 | HRMS Core |
| **corpperks-intelligence** | 4135 | AI Decision Engine |
| **payroll-service** | 4738 | Indian Payroll |
| **meeting-service** | 4728 | 1:1 Meetings |
| **performance-service** | 4729 | Performance Reviews |
| **okr-service** | 4730 | OKR Tracking |
| **workflow-service** | 4731 | Automation |
| **onboarding-service** | 4732 | Onboarding |
| **exit-service** | 4733 | Exit Management |
| **lms-service** | 4734 | Learning Management |
| **reports-service** | 4735 | Reporting |
| **calendar-service** | 4736 | Calendar |
| **sso-service** | 4737 | SSO |
| **shift-service** | 4739 | Shift Management |
| **compensation-service** | 4740 | Compensation |
| **document-service** | 4741 | Documents |
| **video-service** | 4742 | Video Conferencing |
| **push-service** | 4743 | Push Notifications |
| **analytics-service** | 4744 | Analytics |
| **whatsapp-service** | 4745 | WhatsApp |
| **webhook-service** | 4746 | Webhooks |
| **graphql-api** | 4747 | GraphQL API |
| **realtime-service** | 4748 | WebSocket |
| **ai-agents-service** | 4750 | AI Agents |
| **role-ai-agents** | 4751 | Role AI Agents |
| **corp-crm-service** | 4725 | CRM |
| **projectos-service** | 4724 | Project Management |
| **team-collab-service** | 4726 | Team Collaboration |
| **workforce-intelligence** | 4752 | Workforce Analytics |

---

## Integration Documentation

### Core Integrations

| Integration | Documentation | Status |
|-------------|---------------|--------|
| **CorpID** | [FEATURES.md](/docs/corpid/FEATURES.md) | ✅ Active |
| **RABTUL** | [INTEGRATIONS.md](/docs/INTEGRATIONS.md) | ✅ Active |
| **HOJAI AI** | [INTEGRATIONS.md](/docs/INTEGRATIONS.md) | ✅ Active |
| **REZ Merchant** | [INTEGRATIONS.md](/docs/INTEGRATIONS.md) | ✅ Active |

### Real-time & Push

| Service | Documentation | Status |
|---------|---------------|--------|
| **WebSocket** | [REALTIME-PUSH-INTEGRATION.md](/docs/REALTIME-PUSH-INTEGRATION.md) | ✅ |
| **Push Notifications** | [REALTIME-PUSH-INTEGRATION.md](/docs/REALTIME-PUSH-INTEGRATION.md) | ✅ |
| **WhatsApp** | [REALTIME-PUSH-INTEGRATION.md](/docs/REALTIME-PUSH-INTEGRATION.md) | ✅ |

---

## API Reference

### REST API

Base URL: `https://api.corpperks.com/v1`

| Category | Endpoints |
|----------|-----------|
| **Auth** | `/auth/login`, `/auth/logout`, `/auth/refresh` |
| **Employees** | `/employees`, `/employees/:id` |
| **Attendance** | `/attendance/checkin`, `/attendance/checkout` |
| **Leave** | `/leave/apply`, `/leave/balance`, `/leave/history` |
| **Payroll** | `/payroll/run`, `/payroll/payslips` |
| **Meetings** | `/meetings`, `/meetings/:id` |
| **Performance** | `/performance/reviews`, `/performance/feedback` |
| **OKRs** | `/okr`, `/okr/:id` |

### GraphQL API

- **Endpoint:** `https://api.corpperks.com/graphql`
- **Features:** Schema introspection, real-time subscriptions

### WebSocket Events

| Event | Description |
|-------|-------------|
| `employee:updated` | Employee data changed |
| `meeting:scheduled` | New meeting created |
| `notification:new` | Push notification |
| `presence:changed` | User online status |

---

## Feature Categories

### HR & People

| Feature | Product | Documentation |
|---------|---------|---------------|
| Employee Management | PeopleOS | [FEATURES.md](/docs/peopleos/FEATURES.md) |
| Time & Attendance | PeopleOS | [FEATURES.md](/docs/peopleos/FEATURES.md) |
| Leave Management | PeopleOS | [FEATURES.md](/docs/peopleos/FEATURES.md) |
| Performance Reviews | PeopleOS | [FEATURES.md](/docs/peopleos/FEATURES.md) |
| OKR Tracking | PeopleOS | [FEATURES.md](/docs/peopleos/FEATURES.md) |
| 1:1 Meetings | PeopleOS | [FEATURES.md](/docs/peopleos/FEATURES.md) |
| Onboarding | PeopleOS | [FEATURES.md](/docs/peopleos/FEATURES.md) |
| Offboarding | PeopleOS | [FEATURES.md](/docs/peopleos/FEATURES.md) |

### Indian Compliance

| Feature | Service | Documentation |
|---------|---------|---------------|
| PF | payroll-service | [INTEGRATIONS.md](/docs/INTEGRATIONS.md) |
| ESI | payroll-service | [INTEGRATIONS.md](/docs/INTEGRATIONS.md) |
| TDS | payroll-service | [INTEGRATIONS.md](/docs/INTEGRATIONS.md) |
| Professional Tax | payroll-service | [INTEGRATIONS.md](/docs/INTEGRATIONS.md) |
| Gratuity | payroll-service | [INTEGRATIONS.md](/docs/INTEGRATIONS.md) |
| GST Invoicing | REZ-merchant-bridge | [INTEGRATIONS.md](/docs/INTEGRATIONS.md) |

### AI & Intelligence

| Feature | Service | Documentation |
|---------|---------|---------------|
| Role AI Agents | role-ai-agents | [SOT.md](/SOT.md) |
| Career Coach | ai-agents-service | [SOT.md](/SOT.md) |
| Career Intelligence | TalentAI | [FEATURES.md](/docs/talentai/FEATURES.md) |
| Workforce Analytics | workforce-intelligence | [SOT.md](/SOT.md) |

### Industry Bridges

| Industry | Bridge | Documentation |
|----------|--------|---------------|
| Hotel | hotel-os | [FEATURES.md](/docs/bizora/FEATURES.md) |
| Restaurant | restaurant-os | [FEATURES.md](/docs/bizora/FEATURES.md) |
| Salon | salon-os | [FEATURES.md](/docs/bizora/FEATURES.md) |
| Retail | retail-os | [FEATURES.md](/docs/bizora/FEATURES.md) |
| Fitness | fitness-os | [FEATURES.md](/docs/bizora/FEATURES.md) |

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14
- **UI:** React 18, Tailwind CSS
- **Mobile:** Expo SDK 50
- **State:** Zustand, React Query

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Database:** MongoDB
- **Cache:** Redis
- **Auth:** JWT

---

## External Resources

| Resource | URL |
|----------|-----|
| **GitHub Repository** | https://github.com/imrejaul007/CorpPerks |
| **CorpPerks Website** | https://corpperks.com |
| **CorpID Portal** | https://corpid.io |
| **HOJAI AI** | https://hojai.ai |
| **RABTUL** | https://rabtul.com |

---

## Support

- **Documentation Issues:** Create GitHub issue
- **General Support:** support@corpperks.com
- **API Support:** api-support@corpperks.com

---

*Last Updated: June 12, 2026*
*CorpPerks Documentation*