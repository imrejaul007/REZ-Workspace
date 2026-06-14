# RisaCare - Complete Service Index

## All 55+ Services

### Core Platform (4700-4708)
| Port | Service | Location | Status |
|------|---------|----------|--------|
| 4700 | API Gateway | risa-care-api-gateway | ✅ |
| 4702 | Records | risa-care-records-service | ✅ |
| 4703 | AI Service | risa-care-ai-service | ✅ |
| 4704 | Profile | risa-care-profile-service | ✅ |
| 4705 | Booking | risa-care-booking-service | ✅ |
| 4706 | Consent | risa-care-consent-service | ✅ |
| 4707 | Care Circle | risa-care-care-circle-service | ✅ |
| 4708 | Medication | risa-care-medication-service | ✅ |

### Healthcare Products (4720-4729)
| Port | Service | Location | Status |
|------|---------|----------|--------|
| 4720 | Chronic Care | risa-care-chronic-care-service | ✅ |
| 4721 | Elderly Care | risa-care-elderly-service | ✅ |
| 4722 | Mental Health | risa-care-mental-health-service | ✅ |
| 4723 | Teleconsult | risa-care-teleconsult-service | ✅ |
| 4724 | Insurance | risa-care-insurance-service | ✅ |
| 4725 | Nutrition | risa-care-nutrition-service | ✅ |
| 4726 | Second Opinion | risa-care-second-opinion-service | ✅ |
| 4727 | Vaccination | risa-care-vaccination-service | ✅ |
| 4728 | Home Healthcare | risa-care-home-healthcare-service | ✅ |
| 4729 | Sleep | risa-care-sleep-service | ✅ |

### B2B Enterprise (4740-4743)
| Port | Service | Location | Status |
|------|---------|----------|--------|
| 4740 | Hospital | risa-care-hospital-service | ✅ |
| 4741 | Doctor Practice | risa-care-doctor-practice-service | ✅ |
| 4742 | Lab | risa-care-lab-service | ✅ |
| 4743 | Pharmacy | risa-care-pharmacy-management-service | ✅ |

### Emergency & AI (4730-4732)
| Port | Service | Location | Status |
|------|---------|----------|--------|
| 4730 | Emergency | emergency-service | ✅ |
| 4731 | ABHA | abha-service | ✅ |
| 4732 | AI Scribe | risa-care-ai-scribe | ✅ |

### AI + RCM (4750-4762)
| Port | Service | Location | Status |
|------|---------|----------|--------|
| 4750 | RCM | risa-care-rcm-service | ✅ |
| 4753 | Wearable | risa-care-wearable-service | ✅ |
| 4754 | Predictive | risa-care-predictive-service | ✅ |
| 4755 | Lab Integration | risa-care-lab-integration-service | ✅ |
| 4756 | Teleconsult V2 | risa-care-teleconsult-v2 | ✅ |
| 4757 | Pharmacy | risa-care-pharmacy-integration | ✅ |
| 4758 | Eligibility | risa-care-eligibility-service | ✅ |
| 4759 | Clearinghouse | risa-care-clearinghouse | ✅ |
| 4760 | Nursing Home | risa-care-nursing-home-service | ✅ |
| 4761 | FHIR | risa-care-fhir-service | ✅ |
| 4762 | Ambient Audio | risa-care-ambient-audio-service | ✅ |

### Patient/Doctor Apps (4770-4781)
| Port | Service | Location | Status |
|------|---------|----------|--------|
| 4770 | Mobile Backend | risa-care-mobile-backend | ✅ |
| 4772 | Hospital Admin | risa-care-hospital-admin | ✅ |
| 4773 | Telemedicine | risa-care-telemedicine-service | ✅ |
| 4774 | Marketplace | risa-care-marketplace | ✅ |
| 4775 | Insurance | risa-care-insurance-aggregator | ✅ |
| 4776 | Homecare | risa-care-homecare | ✅ |
| 4777 | Diagnostics | risa-care-diagnostics | ✅ |
| 4778 | EMR | risa-care-emr-service | ✅ |
| 4779 | Patient Portal | risa-care-patient-portal | ✅ |
| 4780 | Provider Directory | risa-care-provider-directory | ✅ |
| 4781 | Health Wallet | risa-care-health-wallet | ✅ |

---

## Shared Libraries

| Package | Location | Purpose |
|---------|----------|---------|
| Shared Client | risa-care-shared | RABTUL, HOJAI, REZ integration |

---

## Mobile App

| App | Location | Stack |
|-----|----------|--------|
| Patient App | risa-care-mobile-app | React Native/Expo |

---

## Deployment

| File | Purpose |
|------|---------|
| docker-compose.yml | All services |
| docker-compose.addendum.yml | Additional services |
| k8s-deployment.yml | Kubernetes |
| nginx.conf | Reverse proxy |

---

## Documentation

| File | Purpose |
|------|---------|
| README.md | Overview |
| SOT.md | Source of Truth |
| CLAUDE.md | Developer Guide |
| QUICKSTART.md | Quick Start |
| SERVICES.md | This file |
| COMPLETE-GAP-ANALYSIS.md | Gap Analysis |
| INTEGRATION-AUDIT.md | Integration Status |

---

## Ecosystem Connections

```
HOJAI-AI ──► LLM Service (4730)
            ──► Voice Service (4590)
            ──► CARECODE (4102)

RABTUL ─────► Auth (4002)
           ──► Payment (4001)
           ──► Wallet (4004)
           ──► Notification (4011)

REZ ───────► Intent Graph
             ──► Health Expert (3011)
             ──► Care Service (3014)
```

---

## Total: 55+ Services

Built: 55 ✅
Missing: 0 ✅
