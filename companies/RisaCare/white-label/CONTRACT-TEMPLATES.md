# RisaCare White-Label Agreement Templates

**Version:** 1.0.0
**Date:** June 12, 2026
**Company:** RTNM Digital Pvt. Ltd.

---

## Table of Contents

1. [Master Service Agreement (MSA)](#1-master-service-agreement-msa)
2. [Service Level Agreement (SLA)](#2-service-level-agreement-sla)
3. [Data Processing Agreement (DPA)](#3-data-processing-agreement-dpa)
4. [Statement of Work (SOW)](#4-statement-of-work-sow)

---

# 1. Master Service Agreement (MSA)

## MASTER SERVICE AGREEMENT

**This Master Service Agreement ("Agreement") is entered into as of [DATE] by and between:**

**SERVICE PROVIDER:**
RTNM Digital Pvt. Ltd.
[Address]
hereinafter referred to as "Provider"

**AND**

**CLIENT:**
[Client Legal Name]
[Address]
hereinafter referred to as "Client"

---

### 1. DEFINITIONS

| Term | Definition |
|------|------------|
| **"Services"** | White-label healthcare platform services as described in Schedule A |
| **"Platform"** | HealthOS SaaS platform operated by Provider |
| **"Tenant"** | Client's branded instance of the Platform |
| **"Users"** | Client's employees, contractors, and patients using the Platform |
| **"Content"** | All data, information, and materials uploaded by Client |
| **"Confidential Information"** | Any non-public information disclosed by either party |

---

### 2. SERVICES

**2.1 Provision of Services**
Provider agrees to provide Client with:
- [x] White-label healthcare platform access
- [x] Custom branding (logo, colors, domain)
- [x] Mobile applications (iOS/Android)
- [x] Technical support and maintenance
- [x] Software updates and upgrades

**2.2 Service Modules**
```
┌─────────────────────────────────────────────────────┐
│  ENABLED MODULES                                    │
│  ─────────────────────────────────────────────────  │
│  [ ] Hospital Management                            │
│  [ ] EMR/EHR                                       │
│  [ ] Teleconsult                                    │
│  [ ] Billing & Insurance                            │
│  [ ] Lab Integration                                │
│  [ ] Pharmacy Management                            │
│  [ ] Patient Portal                                 │
│  [ ] AI Medical Scribe                              │
│  [ ] Analytics Dashboard                            │
│  [ ] FHIR/ABHA Integration                          │
└─────────────────────────────────────────────────────┘
```

**2.3 Support Levels**
| Level | Response Time | Hours | Price |
|-------|--------------|-------|-------|
| Standard | 4 hours | Business | Included |
| Priority | 1 hour | 24/7 | +₹X,XXX/mo |
| Dedicated | 15 min | 24/7 | +₹X,XXX/mo |

---

### 3. TERM AND TERMINATION

**3.1 Term**
This Agreement shall commence on the Effective Date and continue for a period of **[12/24/36]** months ("Initial Term"), unless terminated earlier in accordance with this Agreement.

**3.2 Renewal**
This Agreement shall automatically renew for successive **[12-month]** periods ("Renewal Terms") unless either party provides written notice of non-renewal at least **[60]** days prior to the end of the then-current term.

**3.3 Termination for Cause**
Either party may terminate this Agreement immediately upon written notice if:
- The other party materially breaches this Agreement and fails to cure within **[30]** days
- The other party becomes insolvent or files for bankruptcy

**3.4 Effect of Termination**
Upon termination:
- Client data shall be available for export for **[30]** days
- Provider shall provide data export in standard formats
- All licenses granted hereunder shall immediately terminate

---

### 4. FEES AND PAYMENT

**4.1 Fees**
```
┌─────────────────────────────────────────────────────┐
│  FEE SCHEDULE                                       │
│  ─────────────────────────────────────────────────  │
│  Base Platform Fee:     ₹[XXX,XXX]/month            │
│  Add-on Modules:        ₹[XX,XXX]/month              │
│  Additional Users:      ₹[X,XXX]/user/month        │
│  ─────────────────────────────────────────────────  │
│  Total Monthly Fee:     ₹[XXX,XXX]/month            │
│  Annual Prepayment:     ₹[XXX,XXX]/year             │
│  (20% discount)                                   │
└─────────────────────────────────────────────────────┘
```

**4.2 Payment Terms**
- Invoices issued monthly in advance
- Payment due within **[15]** days of invoice date
- Late payments accrue interest at **[1.5%]** per month
- All fees are exclusive of applicable taxes (GST @ 18%)

**4.3 Fee Adjustments**
Provider may adjust fees with **[60]** days prior written notice:
- Annual CPI increase (max 10%)
- New module pricing
- Volume-based adjustments

---

### 5. INTELLECTUAL PROPERTY

**5.1 Provider IP**
Provider retains all rights to:
- HealthOS platform and software
- Source code, algorithms, documentation
- Improvements and enhancements
- Aggregated, anonymized data

**5.2 Client IP**
Client retains all rights to:
- Client Content and data
- Client branding (logo, trademarks)
- Client-specific customizations

**5.3 License Grant**
Provider grants Client a non-exclusive, non-transferable license to:
- Use the Platform during the Term
- Display Provider's branding (required)
- Access APIs as documented

**5.4 Branding Requirements**
```
┌─────────────────────────────────────────────────────┐
│  REQUIRED ATTRIBUTION                               │
│  ─────────────────────────────────────────────────  │
│  Powered by HealthOS (small text in footer)         │
│  Link to healthos.com                               │
│  HealthOS logo in about/settings                    │
└─────────────────────────────────────────────────────┘
```

---

### 6. DATA AND SECURITY

**6.1 Data Ownership**
Client owns all Content and data generated through use of the Platform.

**6.2 Data Processing**
Provider shall process Client data only:
- To provide the Services
- As instructed by Client
- In accordance with the Data Processing Agreement (Schedule B)

**6.3 Security Measures**
| Measure | Implementation |
|---------|----------------|
| Encryption | AES-256 at rest, TLS 1.3 in transit |
| Access Control | Role-based, MFA enabled |
| Audit | Complete audit logging |
| Backup | Daily automated, 99.9% recovery |
| Compliance | HIPAA, DPDP Act, ISO 27001 |

**6.4 Data Breach**
In the event of a data breach:
- Provider shall notify Client within **[24]** hours
- Provider shall provide breach details within **[72]** hours
- Provider shall bear costs of notification (if Provider fault)

---

### 7. WARRANTIES AND LIABILITIES

**7.1 Provider Warranties**
Provider warrants that:
- Services will perform substantially as described
- Platform is free from material defects
- Provider has authority to enter this Agreement

**7.2 Client Warranties**
Client warrants that:
- Client has authority to use all Content
- Content complies with applicable laws
- Client will use Platform in accordance with this Agreement

**7.3 Limitation of Liability**
```
┌─────────────────────────────────────────────────────┐
│  LIABILITY CAPS                                    │
│  ─────────────────────────────────────────────────  │
│  Maximum aggregate liability:                       │
│  12 months of fees paid by Client                  │
│                                                     │
│  Excluded from liability cap:                       │
│  - Fraud, gross negligence                         │
│  - IP infringement                                 │
│  - Death or personal injury                        │
│  - Indemnification obligations                     │
└─────────────────────────────────────────────────────┘
```

**7.4 Indemnification**
Each party shall indemnify the other against:
- Third-party claims arising from breach
- IP infringement claims
- Regulatory violations

---

### 8. CONFIDENTIALITY

**8.1 Definition**
"Confidential Information" means any non-public information disclosed by either party.

**8.2 Obligations**
- Use only to perform obligations under this Agreement
- Protect with same care as own confidential information
- Limit disclosure to need-to-know personnel
- Return or destroy upon termination

**8.3 Exceptions**
Confidential Information does not include information that:
- Is or becomes publicly available
- Was known prior to disclosure
- Is independently developed
- Is received from third party without restriction

---

### 9. GENERAL PROVISIONS

**9.1 Governing Law**
This Agreement shall be governed by the laws of India.

**9.2 Dispute Resolution**
- Good faith negotiations for 30 days
- Arbitration under ICADR rules
- Seat: [City], India

**9.3 Force Majeure**
Neither party liable for delays due to events beyond reasonable control.

**9.4 Assignment**
Neither party may assign without prior written consent.

**9.5 Notices**
All notices shall be in writing and delivered to addresses on file.

**9.6 Entire Agreement**
This Agreement constitutes the entire agreement and supersedes all prior agreements.

---

### SIGNATURES

**PROVIDER:**
RTNM Digital Pvt. Ltd.

Signature: _______________________
Name: [Authorized Signatory]
Title: [Title]
Date: [Date]

**CLIENT:**
[Client Legal Name]

Signature: _______________________
Name: [Authorized Signatory]
Title: [Title]
Date: [Date]

---

# 2. Service Level Agreement (SLA)

## SERVICE LEVEL AGREEMENT

**This SLA is incorporated by reference into the Master Service Agreement dated [DATE]**

---

### 1. SERVICE AVAILABILITY

**1.1 Uptime Commitment**
| Plan | Uptime Target | Downtime/Month |
|------|---------------|----------------|
| Standard | 99.5% | 3.6 hours |
| Priority | 99.9% | 43.8 minutes |
| Enterprise | 99.99% | 4.4 minutes |

**1.2 Calculation**
```
Uptime % = (Total Minutes - Downtime Minutes) / Total Minutes × 100
```

**1.3 Scheduled Maintenance**
- Planned maintenance with 48 hours notice
- Maximum 4 hours/month scheduled maintenance
- Maintenance windows: 2 AM - 6 AM IST

---

### 2. SERVICE CREDITS

**2.1 Credit Schedule**
| Uptime Achieved | Credit |
|-----------------|--------|
| 99.0% - 99.5% | 5% of monthly fee |
| 98.0% - 99.0% | 10% of monthly fee |
| 95.0% - 98.0% | 25% of monthly fee |
| Below 95.0% | 50% of monthly fee |

**2.2 Credit Limitations**
- Maximum credits: 50% of monthly fee
- Credits apply to next invoice
- No cash refunds
- Excludes scheduled maintenance

**2.3 Claim Process**
1. Client reports incident via support portal
2. Provider investigates and confirms downtime
3. Credits applied within 30 days

---

### 3. RESPONSE AND RESOLUTION

**3.1 Support Response Times**
| Priority | Response Time | Resolution Target |
|----------|---------------|-------------------|
| Critical (P1) | 15 minutes | 4 hours |
| High (P2) | 1 hour | 8 hours |
| Medium (P3) | 4 hours | 24 hours |
| Low (P4) | 8 hours | 72 hours |

**3.2 Priority Definitions**
| Priority | Description | Examples |
|----------|-------------|----------|
| P1 - Critical | Platform down, no workaround | All users cannot access |
| P2 - High | Major feature broken | Teleconsult not working |
| P3 - Medium | Feature degraded | Slow performance |
| P4 - Low | Minor issue | UI bug, cosmetic |

**3.3 Support Channels**
| Channel | Availability |
|---------|--------------|
| Email | 24/7 |
| Phone | Priority+ only |
| Portal | 24/7 |
| WhatsApp | Priority+ only |

---

### 4. PERFORMANCE METRICS

**4.1 API Response Times**
| Endpoint Type | Target | Maximum |
|--------------|--------|---------|
| Read operations | < 200ms | 500ms |
| Write operations | < 500ms | 1s |
| Complex queries | < 2s | 5s |
| File uploads | < 5s | 30s |

**4.2 Platform Performance**
| Metric | Target |
|--------|--------|
| Page load time | < 2s |
| Search response | < 500ms |
| Report generation | < 10s |
| Video quality | 720p minimum |

**4.3 Monitoring**
- Real-time monitoring at healthos.com/status
- SMS alerts for P1 incidents
- Weekly performance reports

---

### 5. DISASTER RECOVERY

**5.1 Backup Schedule**
| Type | Frequency | Retention |
|------|-----------|-----------|
| Full backup | Daily | 90 days |
| Incremental | Every 6 hours | 7 days |
| Transaction logs | Real-time | 24 hours |
| Off-site backup | Daily | 90 days |

**5.2 Recovery Objectives**
| Objective | Target |
|-----------|--------|
| RTO (Recovery Time Objective) | 4 hours |
| RPO (Recovery Point Objective) | 1 hour |
| Backup success rate | 99.9% |

**5.3 Failover**
- Automatic failover for database
- Manual failover for application (if needed)
- Tested quarterly

---

### 6. SLA EXCLUSIONS

**6.1 Excluded Events**
SLA does not apply to downtime caused by:
- Client's actions or inactions
- Third-party services
- Force majeure events
- Scheduled maintenance (with notice)
- Internet connectivity issues
- Client's equipment

**6.2 Third-Party Services**
| Service | Provider | SLA |
|---------|----------|-----|
| AWS/Azure | Cloud provider | Provider's |
| Twilio | SMS/Voice | Provider's |
| MongoDB Atlas | Database | Provider's |
| Stripe/Razorpay | Payments | Provider's |

---

### 7. REPORTING

**7.1 Monthly Report**
Provider shall provide monthly report including:
- Uptime statistics
- Incident summary
- Support metrics
- Performance trends

**7.2 Incident Reports**
For P1/P2 incidents:
- Root cause analysis within 5 business days
- Corrective action plan within 10 business days

---

# 3. Data Processing Agreement (DPA)

## DATA PROCESSING AGREEMENT

**This DPA governs the processing of Personal Data under the Master Service Agreement**

---

### 1. SCOPE AND PURPOSE

**1.1 Purpose Limitation**
Provider shall process Personal Data only for the specific purposes of providing the Services.

**1.2 Data Categories**
| Category | Examples |
|----------|----------|
| Patient Data | Name, contact, medical records, health information |
| Staff Data | Name, role, credentials, access logs |
| Business Data | Billing, appointments, prescriptions |

---

### 2. OBLIGATIONS OF PROVIDER

**2.1 Processing**
- Process only on documented instructions
- Ensure confidentiality of personnel
- Implement appropriate security measures
- Assist Client with data subject requests

**2.2 Sub-processors**
Provider may engage sub-processors for:
- Cloud infrastructure (AWS/Azure)
- Database services (MongoDB Atlas)
- Communication (Twilio)
- Analytics (third-party analytics)

**2.3 Data Transfer**
- Data stored in India (default)
- Cross-border transfers only with adequate safeguards
- Standard Contractual Clauses for EU data

---

### 3. DATA SUBJECT RIGHTS

**3.1 Rights Support**
Provider shall assist Client in fulfilling:
- Right to access
- Right to rectification
- Right to erasure
- Right to data portability
- Right to object

**3.2 Response Time**
| Request Type | Provider Response |
|--------------|-------------------|
| Data export | 7 days |
| Data deletion | 30 days |
| Access confirmation | 15 days |

---

### 4. SECURITY MEASURES

**4.1 Technical Measures**
| Measure | Implementation |
|---------|----------------|
| Encryption | AES-256 at rest, TLS 1.3 in transit |
| Access Control | RBAC, MFA, principle of least privilege |
| Monitoring | Real-time alerting, audit logging |
| Testing | Vulnerability scans, penetration testing |

**4.2 Organizational Measures**
- DPO appointed
- Regular security training
- Incident response procedures
- Vendor management

---

### 5. DATA BREACH

**5.1 Notification**
Provider shall notify Client within **[24]** hours of becoming aware of a breach.

**5.2 Breach Notification Contents**
- Nature of breach
- Categories and number of data subjects
- Likely consequences
- Measures taken/proposed

**5.3 Investigation**
Provider shall:
- Investigate breach promptly
- Provide updates as available
- Cooperate with regulatory authorities

---

# 4. Statement of Work (SOW)

## STATEMENT OF WORK

**SOW #:** [SOW-XXX]
**Date:** [Date]
**Reference:** MSA dated [Date]

---

### 1. PROJECT OVERVIEW

**1.1 Client Information**
```
┌─────────────────────────────────────────────────────┐
│  CLIENT DETAILS                                     │
│  ─────────────────────────────────────────────────  │
│  Organization:  [Client Name]                      │
│  Type:           [Hospital/Clinic/Lab]              │
│  Location:       [Address]                          │
│  Beds/Doctors:   [XXX beds / XX doctors]            │
│  Contact:        [Name], [Email], [Phone]           │
└─────────────────────────────────────────────────────┘
```

**1.2 Project Scope**
White-label deployment of HealthOS platform with custom branding and integrations.

---

### 2. DELIVERABLES

**2.1 Core Deliverables**
| # | Deliverable | Target Date | Acceptance Criteria |
|---|-------------|------------|---------------------|
| 1 | Branded tenant setup | Week 1 | Logo, colors, domain configured |
| 2 | Core modules enabled | Week 1 | All requested modules active |
| 3 | User accounts created | Week 2 | XX users provisioned |
| 4 | Data migration | Week 2 | XX records migrated |
| 5 | Integrations configured | Week 3 | All integrations tested |
| 6 | Staff training | Week 3 | XX staff trained |
| 7 | UAT completed | Week 4 | Sign-off received |
| 8 | Go-live | Week 4 | Production deployment |

**2.2 Deliverable Specifications**
```
┌─────────────────────────────────────────────────────┐
│  DELIVERABLE SPECIFICATIONS                         │
│  ───────────────────────────────��─────────────────  │
│  Branding:                                          │
│  - Primary logo (SVG, PNG)                          │
│  - Secondary logo                                   │
│  - Favicon                                          │
│  - App icon (1024x1024)                             │
│  - Primary color (#XXXXXX)                          │
│  - Secondary color (#XXXXXX)                        │
│                                                     │
│  Domain:                                            │
│  - Primary domain: [domain.com]                     │
│  - Admin subdomain: admin.[domain.com]               │
│  - API subdomain: api.[domain.com]                  │
│                                                     │
│  Modules:                                           │
│  - [List of enabled modules]                        │
│                                                     │
│  Integrations:                                      │
│  - [List of configured integrations]                │
└─────────────────────────────────────────────────────┘
```

---

### 3. TIMELINE

**3.1 Project Phases**
| Phase | Duration | Activities |
|-------|----------|------------|
| Discovery | Week 1 | Requirements, branding, access |
| Setup | Week 1-2 | Configure, brand, migrate |
| Integration | Week 2-3 | Connect systems, test |
| Training | Week 3 | Staff training, UAT |
| Go-Live | Week 4 | Launch, monitor |

**3.2 Milestones**
| Milestone | Date | Sign-off |
|-----------|------|----------|
| M1: Discovery Complete | [Date] | ☐ |
| M2: Setup Complete | [Date] | ☐ |
| M3: UAT Sign-off | [Date] | ☐ |
| M4: Go-Live | [Date] | ☐ |

---

### 4. FEES

**4.1 Implementation Fees**
| Item | Amount |
|------|--------|
| Setup Fee | ₹[XX,XXX] |
| Data Migration | ₹[XX,XXX] |
| Integration Setup | ₹[XX,XXX] |
| Training | ₹[XX,XXX] |
| **Total Implementation** | ₹[XXX,XXX] |

**4.2 Recurring Fees**
| Item | Amount | Frequency |
|------|--------|-----------|
| Platform License | ₹[XX,XXX] | Monthly |
| Support | ₹[XX,XXX] | Monthly |
| **Total Monthly** | ₹[XXX,XXX] | Monthly |

---

### 5. ASSUMPTIONS

**5.1 Client Responsibilities**
- Provide timely access to systems
- Assign dedicated project manager
- Complete data export within agreed format
- Conduct UAT within 5 business days
- Provide sign-off within 3 business days

**5.2 Provider Responsibilities**
- Provide timely communication
- Deliver according to timeline
- Conduct knowledge transfer
- Provide documentation

**5.3 Assumptions**
- Client will provide data in standard formats
- Network connectivity is adequate
- Client IT team available for integration support
- No major scope changes during implementation

---

### 6. ACCEPTANCE CRITERIA

**6.1 Go-Live Criteria**
- [ ] All enabled modules functional
- [ ] Branded tenant accessible
- [ ] Patient app submitted to stores
- [ ] Staff trained and certified
- [ ] Integrations tested and working
- [ ] Documentation delivered
- [ ] UAT sign-off received

**6.2 Acceptance Testing**
- 5 business days for acceptance testing
- Defects will be fixed prior to go-live
- Go-live proceeds upon sign-off

---

### APPROVALS

**PROVIDER:**
Name: _______________________
Title: _______________________
Date: _______________________

**CLIENT:**
Name: _______________________
Title: _______________________
Date: _______________________

---

## Appendix A: Pricing Calculator

### Quick Quote

| Organization Type | Monthly | Annual (20% off) |
|-------------------|---------|------------------|
| Single Clinic | ₹25,000 | ₹2,40,000 |
| Clinic Chain | ₹40,000 | ₹3,84,000 |
| Small Hospital (50-200 beds) | ₹75,000 | ₹7,20,000 |
| Medium Hospital (200-500 beds) | ₹1,50,000 | ₹14,40,000 |
| Large Hospital (500+ beds) | ₹2,50,000+ | Custom |

### Add-ons
| Add-on | Monthly |
|--------|---------|
| AI Medical Scribe | ₹10,000 |
| FHIR/ABHA Integration | ₹5,000 |
| Lab Integration | ₹5,000 |
| Additional Doctors (per 10) | ₹5,000 |

---

**© 2026 RTNM Digital Pvt. Ltd.**
**All rights reserved**
**Version 1.0.0**
