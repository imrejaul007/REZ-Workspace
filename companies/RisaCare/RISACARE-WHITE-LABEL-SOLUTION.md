# RisaCare White-Label Healthcare Platform

**Solution for Hospitals & Clinics - "Your Brand. Our Platform."**

---

## 🎯 What is White-Label RisaCare?

A complete healthcare OS platform that hospitals and clinics can **rebrand as their own** - with custom domain, logo, colors, and features - while running on RisaCare's proven infrastructure.

---

## 💼 White-Label Packages

### 1. Hospital Pro Package

| Feature | Description |
|---------|-------------|
| **Branding** | Custom logo, colors, domain (yourhospital.com) |
| **Modules** | All B2B modules (Hospital, Lab, Pharmacy, EMR) |
| **Users** | Unlimited doctors, staff, patients |
| **Integration** | Existing HIS/PMS integration |
| **Support** | Dedicated account manager |
| **SLA** | 99.9% uptime guarantee |
| **Price** | ₹X Lakhs/year (based on bed count) |

### 2. Clinic Express Package

| Feature | Description |
|---------|-------------|
| **Branding** | Custom logo, colors, subdomain |
| **Modules** | Practice management, EMR, Teleconsult |
| **Users** | Up to 50 doctors |
| **Integration** | Basic integrations |
| **Support** | Standard support |
| **SLA** | 99.5% uptime |
| **Price** | ₹XX,XXX/month |

### 3. Lab Network Package

| Feature | Description |
|---------|-------------|
| **Branding** | Custom logo, colors, domain |
| **Modules** | Lab management, reporting, integrations |
| **Collection Centers** | Unlimited |
| **Integration** | All major lab equipment |
| **Support** | 24/7 lab support |
| **Price** | ₹X Lakhs/year |

---

## 🏥 Hospital White-Label Features

### Core Hospital Management
| Feature | Description |
|---------|-------------|
| **ADT Management** | Admissions, transfers, discharges |
| **Bed Management** | Real-time availability, allocation |
| **Ward Management** | ICU, General, Private wards |
| **OT Scheduling** | Operation theater scheduling |
| **Pharmacy** | In-house pharmacy management |
| **Lab Integration** | Bidirectional LIS integration |
| **Blood Bank** | Blood inventory management |
| **ICU Monitoring** | Real-time vital signs |

### Clinical Modules
| Feature | Description |
|---------|-------------|
| **EMR/EHR** | Electronic Medical Records |
| **e-Prescription** | Digital prescription writer |
| **Clinical Notes** | SOAP notes, progress notes |
| **Order Sets** | Standard order templates |
| **Nursing Notes** | Care documentation |
| **Discharge Summary** | Auto-generated summaries |

### Administrative
| Feature | Description |
|---------|-------------|
| **Billing** | Insurance, cash, packages |
| **Insurance** | TPA management, pre-auth |
| **Inventory** | Medical supplies, equipment |
| **HRMS** | Staff scheduling, payroll |
| **Analytics** | Clinical & operational dashboards |

### Patient Experience
| Feature | Description |
|---------|-------------|
| **Patient Portal** | Online appointments, records |
| **Mobile App** | Branded patient app |
| **Teleconsult** | Video consultations |
| **Kiosk** | Self check-in, queue management |
| **Feedback** | Post-discharge surveys |

---

## 🏨 Clinic White-Label Features

### Practice Management
| Feature | Description |
|---------|-------------|
| **Appointment** | Smart scheduling, reminders |
| **Patient Records** | EMR with photo upload |
| **Prescription** | Digital Rx with prints |
| **Billing** | Simple invoicing |
| **Inventory** | Medicine tracking |
| **SMS/WhatsApp** | Patient communication |

### Specialties
| Specialty | Modules |
|-----------|---------|
| **General Physician** | Basic EMR, teleconsult |
| **Dental** | Tooth chart, treatment plan |
| **Orthopedic** | Bone assessment, rehab tracking |
| **Cardiology** | ECG integration, stress tests |
| **Dermatology** | Photo documentation, body map |
| **Ophthalmology** | Vision testing, lens inventory |
| **Pediatric** | Growth charts, vaccination |
| **Gynecology** | menstrual tracking, pregnancy |

---

## 🔧 Technical White-Label Setup

### Custom Branding
```yaml
# tenant-config.yaml
tenant:
  name: "Sunrise Hospital"
  domain: "sunrise.risacare.com"  # or sunrise.com
  logo: "/branding/sunrise-logo.png"
  primaryColor: "#1E88E5"
  secondaryColor: "#42A5F5"
  contactEmail: "support@sunrisehospital.com"
  supportPhone: "+91-9876543210"
```

### Multi-Tenant Architecture
```
                    ┌─────────────────┐
                    │   API Gateway    │
                    │  (Multi-tenant)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │Tenant A │          │Tenant B │          │Tenant C │
   │Sunrise  │          │City     │          │Health   │
   │Hospital │          │Clinic   │          │Center   │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                    │                    │
        ▼                    ▼                    ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │Mongo-A  │          │Mongo-B  │          │Mongo-C  │
   │DB       │          │DB       │          │DB       │
   └─────────┘          └─────────┘          └─────────┘
```

### Custom Domain Setup
```
# DNS Configuration
sunrisehospital.com → Cloudflare/CDN → RisaCare SaaS

# Or On-Premise
sunrisehospital.com → Internal server → RisaCare
```

---

## 📱 White-Label Mobile Apps

### Patient App (Your Hospital Branding)
| Feature | Description |
|---------|-------------|
| **App Name** | "Sunrise Health" (configurable) |
| **Logo** | Hospital logo |
| **Theme** | Hospital colors |
| **Features** | Appointments, records, teleconsult, billing |

### Doctor App (Your Hospital Branding)
| Feature | Description |
|---------|-------------|
| **App Name** | "Sunrise Doctor" |
| **Logo** | Hospital logo |
| **Features** | Patient list, e-prescription, schedule |

---

## 💰 Pricing Models

### 1. SaaS (Monthly Subscription)
| Tier | Beds | Price |
|------|------|-------|
| Basic | Up to 50 | ₹25,000/month |
| Standard | Up to 200 | ₹75,000/month |
| Premium | Up to 500 | ₹1,50,000/month |
| Enterprise | 500+ | Custom |

### 2. Perpetual License
| Tier | Beds | Price |
|------|------|-------|
| Basic | Up to 50 | ₹5,00,000 |
| Standard | Up to 200 | ₹15,00,000 |
| Premium | Up to 500 | ₹35,00,000 |
| Enterprise | 500+ | Custom |

### 3. Revenue Share
| Model | Description |
|-------|-------------|
| **Per Patient** | ₹X per patient registered |
| **Per Transaction** | X% of teleconsult/treatment |
| **Hybrid** | Base + usage fees |

---

## 🛠 Setup Process

### Week 1-2: Branding
- [ ] Collect logo, colors, brand guidelines
- [ ] Configure custom domain
- [ ] Set up email templates
- [ ] Configure SMS/WhatsApp sender ID

### Week 3-4: Data Migration
- [ ] Export data from existing system
- [ ] Map data fields to RisaCare schema
- [ ] Migrate patient records
- [ ] Migrate doctor/staff accounts

### Week 5-6: Integration
- [ ] HIS/PMS integration
- [ ] Lab equipment integration
- [ ] Pharmacy system integration
- [ ] Insurance/TPA integration

### Week 7-8: Testing & Training
- [ ] UAT with hospital staff
- [ ] Train super users
- [ ] Go-live preparation
- [ ] Backup & disaster recovery setup

---

## 📋 White-Label Checklist

### Required from Hospital/Clinic
- [ ] Company logo (SVG, PNG)
- [ ] Brand colors (primary, secondary)
- [ ] Domain name (or subdomain)
- [ ] Email domain for staff
- [ ] Support contact details
- [ ] Existing data export (if any)

### RisaCare Provides
- [ ] Custom subdomain/domain
- [ ] Branded login pages
- [ ] Branded email templates
- [ ] Branded mobile apps (iOS/Android)
- [ ] Branded patient portal
- [ ] Custom features (as needed)

---

## 🌐 Deployment Options

### 1. RisaCare Cloud (SaaS)
- Fastest deployment (1-2 weeks)
- Lowest upfront cost
- Automatic updates
- Managed infrastructure

### 2. Dedicated Cloud
- Isolated database
- Custom SLA
- Enhanced security
- Monthly/annual fee

### 3. On-Premise
- Complete data isolation
- One-time license
- Your IT team manages
- Annual support fee

### 4. Hybrid
- Core data on-premise
- AI/ML from cloud
- Custom integration
- Flexible pricing

---

## 📞 White-Label Inquiry Form

### Hospital Information
```markdown
Hospital Name: _______________
Location: _______________
Bed Count: _______________
Specialties: _______________
Current System: _______________
Migrating Data: Yes/No

Contact Person: _______________
Email: _______________
Phone: _______________
```

### Requirements
```markdown
Modules Needed:
[ ] Hospital Management
[ ] Lab Management
[ ] Pharmacy
[ ] EMR/EHR
[ ] Teleconsult
[ ] Patient Portal
[ ] Billing/Insurance
[ ] Analytics

Deployment:
[ ] Cloud SaaS
[ ] Dedicated Cloud
[ ] On-Premise
[ ] Hybrid

Budget: _______________
Timeline: _______________
```

---

## 🏆 Success Stories

### Sunrise Hospital (Multi-Specialty)
- **Before:** Paper-based, 3 systems
- **After:** Unified platform, 50% reduction in paperwork
- **Result:** 30% improvement in patient satisfaction

### City Clinic (Dental Chain)
- **Before:** Excel-based tracking
- **After:** Digital EMR with teleconsult
- **Result:** 3x patient capacity

### Health Diagnostics (Lab Chain)
- **Before:** Standalone systems per center
- **After:** Centralized lab OS
- **Result:** Real-time inventory across 50 centers

---

## 📞 Contact

**White-Label Sales:** white-label@risacare.com

**Demo Request:** demo.risacare.com

**Sales Team:** +91-XXXXX-XXXXX

---

## Next Steps

1. **Demo** - Schedule a personalized demo
2. **Proposal** - Get custom pricing
3. **POC** - 30-day proof of concept
4. **Contract** - Sign white-label agreement
5. **Launch** - Go live with your brand

---

**"Your Brand. Our Platform. Better Healthcare."**

---

**License:** Proprietary - RTNM Digital
**Version:** 1.0.0
**Date:** June 12, 2026