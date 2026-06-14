# HealthOS White-Label Package

**"Your Brand. Our Platform. Better Healthcare."**

---

## 🎯 Overview

Complete white-label solution for hospitals and clinics to launch their own branded healthcare platform powered by RisaCare.

---

## 📁 Package Contents

| File | Description |
|------|-------------|
| [index.html](index.html) | **Demo Landing Page** - Beautiful website to capture leads |
| [pricing-calculator.html](pricing-calculator.html) | **Interactive Calculator** - Instant pricing quotes |
| [SALES-PITCH-DECK.md](SALES-PITCH-DECK.md) | **Sales Deck** - 15-slide pitch for sales team |
| [CONTRACT-TEMPLATES.md](CONTRACT-TEMPLATES.md) | **Legal Templates** - MSA, SLA, DPA, SOW |
| [tenant-config.js](tenant-config.js) | **Config Templates** - Ready-to-deploy tenant configs |

---

## 🚀 Quick Start

### 1. Demo Landing Page
```bash
# Open in browser
open white-label/index.html

# Or serve locally
npx serve white-label/
```

### 2. Pricing Calculator
```bash
# Open calculator
open white-label/pricing-calculator.html
```

### 3. Create Tenant
```bash
# Using the API
curl -X POST https://api.risacare.com/admin/tenants \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d @white-label/tenant-config.js
```

---

## 📋 Documents Breakdown

### Demo Landing Page (index.html)
- ✅ Hero section with live phone mockup
- ✅ Features showcase
- ✅ Pricing tiers (Clinic, Hospital, Enterprise)
- ✅ How it works (4 weeks)
- ✅ Testimonials
- ✅ Lead capture form
- ✅ Fully responsive

### Pricing Calculator (pricing-calculator.html)
- ✅ Organization type selector
- ✅ Doctor count slider
- ✅ Location count slider
- ✅ Module checkboxes
- ✅ Deployment type (SaaS/Dedicated/On-Premise)
- ✅ Real-time price calculation
- ✅ Feature comparison table
- ✅ Get Quote button

### Sales Pitch Deck (SALES-PITCH-DECK.md)
- 15 slides covering:
  1. Opening hook
  2. Problem statement
  3. Solution overview
  4. Key benefits
  5. Features architecture
  6. AI Medical Scribe
  7. Patient App mockup
  8. Integration list
  9. Pricing tiers
  10. Comparison vs legacy
  11. Implementation timeline
  12. Success stories
  13. Security
  14. Next steps
  15. Contact info

### Contract Templates (CONTRACT-TEMPLATES.md)
1. **Master Service Agreement (MSA)**
   - Definitions
   - Services scope
   - Term & termination
   - Fees & payment
   - IP rights
   - Data & security
   - Warranties
   - Confidentiality
   - Signatures

2. **Service Level Agreement (SLA)**
   - Uptime commitments (99.5% - 99.99%)
   - Service credits
   - Response times
   - Performance metrics
   - Disaster recovery
   - Exclusions

3. **Data Processing Agreement (DPA)**
   - Scope and purpose
   - Provider obligations
   - Data subject rights
   - Security measures
   - Data breach notification

4. **Statement of Work (SOW)**
   - Project overview
   - Deliverables
   - Timeline
   - Fees
   - Assumptions
   - Acceptance criteria

### Tenant Config Templates (tenant-config.js)
- Hospital Multi-Specialty template
- Clinic Chain template
- Diagnostic Lab template
- API examples for deployment
- Environment variables

---

## 💰 Pricing Tiers

| Plan | For | Monthly | Annual |
|------|-----|---------|--------|
| **Clinic** | 1-20 doctors | ₹25,000 | ₹2,40,000 |
| **Hospital** | Multi-specialty | ₹1,50,000 | ₹14,40,000 |
| **Enterprise** | Chains, 500+ beds | Custom | Custom |

### Add-ons
| Add-on | Monthly |
|--------|---------|
| AI Medical Scribe | ₹10,000 |
| FHIR/ABHA | ₹5,000 |
| Lab Integration | ���5,000 |
| Additional Doctors (per 10) | ₹5,000 |

---

## 🎨 Branding Options

### What's Included
- ✅ Custom logo (primary, secondary, favicon, app icon)
- ✅ Custom colors (primary, secondary, accent)
- ✅ Custom domain (yourhospital.com)
- ✅ Branded mobile app (iOS/Android)
- ✅ Branded email templates
- ✅ Branded SMS sender ID

### Branding Requirements
```
┌─────────────────────────────────────────────────────┐
│  FROM CLIENT                                         │
│  ─────────────────────────────────────────────────  │
│  ☐ Company logo (SVG, PNG)                           │
│  ☐ Brand colors (primary, secondary)                │
│  ☐ Domain name                                      │
│  ☐ Email domain for staff                           │
│  ☐ Support contact details                          │
│  ☐ Existing data export (if migrating)              │
└─────────────────────────────────────────────────────┘
```

---

## 📞 Lead Capture

### Form Fields
- Hospital/Clinic Name
- Work Email
- Phone Number
- (Optional) Number of doctors
- (Optional) Current system

### Follow-up Process
1. Email confirmation (automated)
2. Sales team contact (within 24 hours)
3. Discovery call (30 minutes)
4. Custom proposal (within 48 hours)
5. Demo (30-60 minutes)
6. Contract negotiation
7. Implementation

---

## 🔧 Technical Requirements

### For Deployment
- Node.js 18+
- MongoDB 7+
- Redis 7+
- Docker (optional)
- Kubernetes (optional)

### For Clients
- Modern browser (Chrome, Firefox, Safari, Edge)
- iOS 14+ / Android 10+ (for mobile app)
- Stable internet connection

---

## 📊 Success Metrics

### Target KPIs
| Metric | Target |
|--------|--------|
| Demo conversion rate | 30% |
| Proposal close rate | 40% |
| Time to close | 30 days |
| Go-live time | 4 weeks |
| Customer satisfaction | 4.5/5 |

---

## 📞 Support

**Sales:** sales@risacare.com

**Technical:** support@risacare.com

**Documentation:** docs.risacare.com

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | June 12, 2026 | Initial release |

---

**© 2026 HealthOS by RTNM Digital**
**Part of the REZ Ecosystem**
