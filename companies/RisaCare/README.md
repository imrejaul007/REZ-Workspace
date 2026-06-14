# RisaCare - Healthcare Operating System

> India's AI-Powered Consumer Healthcare Platform

![Version](https://img.shields.io/badge/version-6.0.0-blue)
![Status](https://img.shields.io/badge/status-Production%20Ready-success)
![License](https://img.shields.io/badge/license-proprietary-red)

---

## 🎯 What is RisaCare?

RisaCare is **India's Consumer Healthcare OS** - a comprehensive healthcare operating system that provides:

- **B2C Healthcare** - Consumer-facing health services
- **B2B Enterprise** - Hospital, clinic, and lab management
- **AI-Powered** - Medical scribe, predictive health, ambient documentation
- **Ecosystem Connected** - HOJAI LLM, RABTUL Auth, REZ Intelligence

### Taglines
- **RisaCare:** "India's Consumer Healthcare OS"
- **MyRisa:** "Your Health. Understood."

---

## 📚 Complete Documentation

### Master Documentation
| Document | Description |
|----------|-------------|
| **[MASTER-DOCUMENTATION.md](MASTER-DOCUMENTATION.md)** | Complete source of truth - ALL documentation combined |
| **[CLAUDE.md](CLAUDE.md)** | Developer Guide - Full technical documentation |

### RTNM Ecosystem
| Document | Description |
|----------|-------------|
| **[RTNM-COMPANIES-AUDIT.md](RTNM-COMPANIES-AUDIT.md)** | Complete RTNM ecosystem - All 16+ companies |
| **[RTNM-PRODUCTS-FEATURES-AUDIT.md](RTNM-PRODUCTS-FEATURES-AUDIT.md)** | Complete products & features audit |

### RisaCare Documentation
| Document | Description |
|----------|-------------|
| **[SOT.md](SOT.md)** | Source of Truth - Complete service registry |
| **[RISACARE-FEATURES-LIST.md](RISACARE-FEATURES-LIST.md)** | Complete features list - 500+ features |
| **[MYRISA-COMPLETE-DOCUMENTATION.md](MYRISA-COMPLETE-DOCUMENTATION.md)** | MyRisa personal wellbeing - 7 domains |

### Production & Deployment
| Document | Description |
|----------|-------------|
| **[PRODUCTION-AUDIT.md](PRODUCTION-AUDIT.md)** | Production readiness audit |
| **[docker-compose.production.yml](docker-compose.production.yml)** | Production Docker deployment |
| **[k8s/base/deployments.yaml](k8s/base/deployments.yaml)** | Kubernetes manifests |

### White-Label Solution
| Document | Description |
|----------|-------------|
| **[RISACARE-WHITE-LABEL-SOLUTION.md](RISACARE-WHITE-LABEL-SOLUTION.md)** | Complete white-label guide |
| **[white-label/README.md](white-label/README.md)** | White-label package overview |
| **[white-label/index.html](white-label/index.html)** | Demo landing page |
| **[white-label/pricing-calculator.html](white-label/pricing-calculator.html)** | Interactive pricing calculator |
| **[white-label/SALES-PITCH-DECK.md](white-label/SALES-PITCH-DECK.md)** | Sales pitch deck |
| **[white-label/CONTRACT-TEMPLATES.md](white-label/CONTRACT-TEMPLATES.md)** | MSA, SLA, DPA, SOW templates |
| **[white-label/tenant-config.js](white-label/tenant-config.js)** | Tenant configuration templates |

---

## RTNM Digital Ecosystem

RisaCare is part of the RTNM Digital ecosystem where each company is independent but shares services:

| Company | Role | Shares With RisaCare |
|---------|------|---------------------|
| **HOJAI AI** | "The AWS of AI" | LLM, Voice, Memory |
| **RABTUL Technologies** | "Infrastructure for money" | Auth, Payment, Wallet |
| **AdBazaar** | "AI-Powered Commerce" | Analytics, Growth |
| **Nexha** | "Commerce Network OS" | Data, Insights |
| **CorpPerks** | "Workforce OS" | Employee health |
| **StayOwn** | "Hospitality" | Guest health |
| **RisnaEstate** | "Real Estate" | Property health |
| **REZ Consumer** | "Consumer Super App" | User base |
| **KHAIRMOVE** | "Mobility OS" | Driver health |
| **LawGens** | "Legal AI" | Compliance |
| **RIDZA** | "Finance OS" | Insurance |
| **AssetMind** | "Financial Intelligence" | Analytics |
| **Axom** | "Trust, Social & BPO" | Trust scores |
| **Karma Foundation** | "Social Impact" | Community health |

---

## Services (56+)

### B2C Core Platform (4700-4708)
| Port | Service | Description |
|------|---------|-------------|
| 4700 | risa-care-api-gateway | Main entry, routing |
| 4701 | risa-care-profile-service | Profiles, family |
| 4702 | risa-care-records-service | Health records, OCR |
| 4703 | risa-care-wellness-service | Cycle, habits, pregnancy |
| 4704 | risa-care-visit-service | Visits, encounters |
| 4705 | risa-care-consent-service | HIPAA/DPDP consent |
| 4706 | risa-care-care-circle-service | Family, caregiver access |
| 4707 | risa-care-medication-service | Prescriptions, reminders |
| 4708 | risa-care-corporate-service | Corporate wellness |

### B2C Healthcare Products (4720-4729)
| Port | Service | Description |
|------|---------|-------------|
| 4720 | risa-care-chronic-care-service | Diabetes, BP, Thyroid |
| 4721 | risa-care-elderly-service | Fall detection, SOS |
| 4722 | risa-care-mental-health-service | Therapy, crisis support |
| 4723 | risa-care-teleconsult-service | Video consultations |
| 4724 | risa-care-insurance-service | Health insurance |
| 4725 | risa-care-nutrition-service | Diet planning |
| 4726 | risa-care-second-opinion-service | Medical opinions |
| 4727 | risa-care-vaccination-service | Immunization tracking |
| 4728 | risa-care-home-healthcare-service | Home nursing, caregivers |
| 4729 | risa-care-sleep-service | Sleep analysis |

### Emergency & Integration (4730-4732)
| Port | Service | Description |
|------|---------|-------------|
| 4730 | emergency-service | Ambulance, SOS |
| 4731 | abha-service | India Digital Health ID |
| 4732 | risa-care-ai-scribe | Medical scribe, SOAP notes |

### B2B Enterprise (4740-4743)
| Port | Service | Description |
|------|---------|-------------|
| 4740 | risa-care-hospital-service | Hospital management, ADT |
| 4741 | risa-care-doctor-practice-service | Clinic management |
| 4742 | risa-care-lab-service | Lab information system |
| 4743 | risa-care-pharmacy-management-service | Pharmacy inventory |

### AI + Revenue Cycle (4750-4762)
| Port | Service | Description |
|------|---------|-------------|
| 4750 | risa-care-rcm-service | Revenue Cycle Management |
| 4753 | risa-care-wearable-service | Apple/Google Fit |
| 4754 | risa-care-predictive-service | NEWS2, qSOFA, Fall risk |
| 4755 | risa-care-lab-integration | SRL, PathLabs, Metropolis |
| 4756 | risa-care-teleconsult-v2 | Video consultations v2 |
| 4757 | risa-care-pharmacy-integration | 1mg, PharmEasy |
| 4758 | risa-care-eligibility-service | CAQH, NaviNet |
| 4759 | risa-care-clearinghouse | 837 Claims EDI |
| 4760 | risa-care-nursing-home-service | Resident management |
| 4761 | risa-care-fhir-service | FHIR R4 interoperability |
| 4762 | risa-care-ambient-audio-service | Real-time STT |

### Patient/Doctor Apps (4770-4781)
| Port | Service | Description |
|------|---------|-------------|
| 4770 | risa-care-mobile-backend | Patient/Doctor apps |
| 4772 | risa-care-hospital-admin | Hospital admin dashboard |
| 4773 | risa-care-telemedicine | Video consultations |
| 4774 | risa-care-marketplace | Health products |
| 4775 | risa-care-insurance-aggregator | Insurance compare/buy |
| 4776 | risa-care-homecare | Home nursing |
| 4777 | risa-care-diagnostics | Lab tests, booking |
| 4778 | risa-care-emr-service | Electronic Medical Records |
| 4779 | risa-care-patient-portal | Patient records portal |
| 4780 | risa-care-provider-directory | Doctor/hospital search |
| 4781 | risa-care-health-wallet | Savings, rewards |

---

## MyRisa - Personal Wellbeing Intelligence

**Tagline:** "Your Health. Understood."

### MyRisa 7 Domains

| Domain | Icon | Service | Description |
|--------|------|---------|--------------|
| Women's Health | 🌸 | 4820 | Cycle, Fertility, Pregnancy, PCOS, Menopause |
| Sexual Wellness | 💜 | 4821 | Libido, Contraception, Intimacy, Reproductive |
| Mental Wellness | 🧠 | 4722 | Mood, Stress, Therapy, Crisis Support |
| Sleep | 😴 | 4729 | Sleep tracking, analysis, recommendations |
| Lifestyle | 🏃 | 4703 | Exercise, Nutrition, Habits |
| Work-Life Balance | ⚡ | 4822 | Burnout, Energy, Productivity, PTO |
| Relationships | ❤️ | 4823 | Partner, Quality Time, Intimacy |

---

## Key Features

### AI (Powered by HOJAI)
- Medical Scribe - Real-time SOAP notes
- Report Interpretation - Lab analysis
- Symptom Assessment - AI triage
- Care Plan Generation - Personalized plans
- Predictive Health - NEWS2, qSOFA, Fall risk

### Healthcare Enterprise
- Hospital Management - ADT, beds, wards
- Lab Integration - SRL, PathLabs, Metropolis, Apollo
- Pharmacy Integration - 1mg, PharmEasy, NetMeds
- Nursing Home - Resident care management

### Revenue Cycle
- RCM Service - ICD-10, CPT coding
- Eligibility - CAQH, NaviNet verification
- Clearinghouse - 837 claims EDI

### Interoperability
- FHIR R4 - Patient, Observation resources
- ABHA - India Digital Health ID
- Ambient Audio - Whisper STT
- Wearable - Apple Health, Google Fit

---

## Quick Start

### Docker Deployment

```bash
# Clone
git clone https://github.com/imrejaul007/RisaCare.git
cd RisaCare

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps
```

### Kubernetes Deployment

```bash
# Apply base manifests
kubectl apply -f k8s/base/

# Or use production overlay
kubectl apply -k k8s/overlays/production/
```

### Manual Development

```bash
# Install dependencies
npm install

# Start individual service
cd risa-care-second-opinion-service
npm run dev
```

---

## Ecosystem Integration

```
                    ┌─────────────────┐
                    │    HOJAI-AI     │
                    │  (AI Brain)    │
                    │  Port 4600-4605│
                    └────────┬────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────┐
│                 RABTUL-TECHNOLOGIES                  │
│         Auth (4002), Payment (4001), Wallet (4004)  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              REZ-Intelligence                         │
│         Health Expert (3011), Care (3014)          │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                    RisaCare                           │
│              Healthcare OS                           │
│                                                        │
│  B2C (4700-4729)     B2B (4740-4743)   AI (4750+) │
│  11 Services          4 Services         18 Services │
└─────────────────────────────────────────────────────┘
```

---

## Production Readiness

| Category | Status |
|----------|--------|
| **Services** | 56+ ✅ |
| **MongoDB** | 56 databases ✅ |
| **Docker** | Production-ready ✅ |
| **Health Checks** | All services ✅ |
| **Kubernetes** | Ready ✅ |
| **Security** | HIPAA/DPDP compliant ✅ |

---

## License

Proprietary - RTNM Digital

---

## HOJAI AI Integration

**Connected to:** HOJAI AI Business Copilot Platform
**Status:** 21/21 Services Running | June 14, 2026 🎉

### HOJAI AI Services Connected

| Port | Service | Purpose |
|------|---------|---------|
| 4600 | hojai-business-copilot | Unified gateway |
| 4002 | core/business-copilot | 24 industries |
| 4810 | hojai-graph | Knowledge graph |
| 4860 | hojai-twin | Digital twins |
| 4870 | hojai-board | AI C-Suite |
| 4520 | hojai-memory | Memory infrastructure |
| 4530 | hojai-intelligence | ML predictions |
| 4550 | hojai-expert-os | Agent runtime |
| 4580 | hojai-agent-marketplace | AI agent library |
| 4801 | hojai-command-center | Executive dashboard |
| + 11 more services | | |

### Access Points

| Service | URL |
|---------|-----|
| Business Copilot | http://localhost:4600 |
| Command Center | http://localhost:4801 |

**Last Updated:** June 14, 2026

---

**Built with ❤️ by REZ Ecosystem**
**Version 6.0.0 - June 2026**
**GitHub:** github.com/imrejaul007/RisaCare