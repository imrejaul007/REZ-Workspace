# RisaCare - Developer Guide

**Version:** 5.1.0  
**Updated:** June 12, 2026  
**Status:** Production Ready  
**Company:** RisaCare (Healthcare vertical under RTNM Digital)

---

## Overview

RisaCare is **India's Consumer Healthcare OS** - AI-powered healthcare navigation.
Part of the REZ Ecosystem, providing comprehensive B2C consumer healthcare
and B2B healthcare enterprise solutions.

**Total Services:** 56+ microservices  
**MongoDB Connected:** 56 ✅  
**Real AI:** HOJAI LLM (Claude/GPT-4)  
**Ecosystem:** RABTUL Auth, REZ Intelligence, HOJAI AI

---

## RTNM Digital Ecosystem - Complete

**Full Audit Document:** [RTNM-COMPANIES-AUDIT.md](RTNM-COMPANIES-AUDIT.md) | [RTNM-PRODUCTS-FEATURES-AUDIT.md](RTNM-PRODUCTS-FEATURES-AUDIT.md)

### RTNM Companies Overview

| Company | Role | Purpose |
|---------|------|---------|
| **HOJAI AI** | "The AWS of AI" | Provides AI to everyone |
| **RABTUL Technologies** | "Infrastructure for money" | Payments, auth, wallet |
| **AdBazaar** | "AI-Powered Commerce" | Intent exchange, retail media |
| **Nexha** | "Commerce Network OS" | Distribution, franchise, procurement |
| **CorpPerks** | "Workforce OS" | Human + Agent + Hybrid Twins |
| **RisaCare** | "India's Consumer Healthcare OS" | Healthcare for everyone |
| **StayOwn** | "Hospitality & Living" | Hotels, vacation rentals |
| **RisnaEstate** | "AI-Powered Real Estate" | Property marketplace, CRM |
| **REZ Consumer** | "Consumer Super App" | Shopping, wallet, rewards |
| **REZ Merchant** | "Merchant Commerce Platform" | POS, KDS, QR Cloud |
| **KHAIRMOVE** | "Mobility OS" | Ride, driver, fleet, logistics |
| **LawGens** | "Legal AI" | Research, contracts, compliance |
| **RIDZA** | "The CFO Who Finally Saw Everything" | Credit, insurance, lending |
| **AssetMind** | "Financial Intelligence" | Bloomberg-like platform, Twins |
| **Axom** | "Trust, Social & BPO" | BuzzLocal, Z-Events, Cosmic OS |
| **Karma Foundation** | "Social Impact" | Education, healthcare, community |

---

# =============================================================================
# SECTION 1: HOJAI AI - COMPLETE
# =============================================================================

## HOJAI AI - "The AWS of AI"

**Role:** Provides AI services to all ecosystem companies
**GitHub:** github.com/imrejaul007/hojai-ai

### HOJAI Core Platforms

| Product | Type | Purpose |
|---------|------|---------|
| **HOJAI Core** | Platform | 12 core platforms (API Gateway, Event Bus, Memory, Intelligence, Agents, Workflows, Communications, Hyperlocal, Data, Governance, Identity, Analytics) |
| **MemoryOS** | Platform | Multi-tier memory infrastructure |
| **TwinOS** | Platform | Digital twins (Human, Agent, Hybrid, Organization, Asset) |
| **FlowOS** | Platform | Visual workflow builder |
| **GenieOS** | Platform | Personal AI assistant |
| **GenieMarketplace** | Platform | Skills and agent marketplace |
| **SkillNet** | Platform | AI skill lifecycle management |
| **VoiceOS** | Platform | Voice services |
| **RealtimeOS** | Platform | Real-time services |

### HOJAI Voice Services (19/19)

| Service | Port | Purpose |
|---------|------|---------|
| HOJAI Voice (Main) | 4590 | Core voice service |
| HOJAI Voice STT | 4591 | Speech to text |
| HOJAI Voice TTS | 4592 | Text to speech |
| HOJAI Voice Conversation | 4593 | Conversation handling |
| HOJAI Voice IVR | 4594 | IVR integration |
| HOJAI Voice Dialer | 4595 | Outbound dialer |
| HOJAI Voice Bot | 4596 | Voice bot |
| HOJAI Voice Conference | 4597 | Conference calls |
| HOJAI Voice Transcription | 4598 | Transcription |
| HOJAI Voice Analytics | 4599 | Voice analytics |
| HOJAI Voice Quality | 4600 | Quality monitoring |
| HOJAI Voice Recording | 4601 | Call recording |
| HOJAI Voice Screening | 4602 | Voice screening |
| HOJAI Voice Coaching | 4603 | Agent coaching |
| HOJAI Voice Survey | 4604 | Survey integration |
| HOJAI Voice Compliance | 4605 | Compliance recording |
| HOJAI Voice Support | 4606 | Support integration |
| HOJAI Voice Enterprise | 4607 | Enterprise features |
| HOJAI Voice AI | 4608 | AI voice features |

### HOJAI Bridge Services

| Service | Port | Purpose |
|---------|------|---------|
| HOJAI Bridge | 5140 | Universal connector |
| BrandPulse | 4770 | Brand Intelligence |
| HIB | 3053 | Human Intelligence Bridge |
| AssetMind | 5001 | Financial Intelligence |
| Nexha | 5002 | Commerce Network |
| RisaCare | 4800 | Healthcare Intelligence |
| StayOwn | 4801 | Hospitality Intelligence |
| CorpPerks | 4720 | Workforce Intelligence |
| KHAIRMOVE | 4600 | Mobility Intelligence |
| GenieOS | 4703 | Personal AI |
| IndustryAI | 4750 | Industry Intelligence |
| Memory | 4520 | Core Platform |
| Intelligence | 4530 | Core Platform |
| Agents | 4550 | Core Platform |

### HOJAI AI Services Currently Running (June 13, 2026)

RisaCare integrates with the following HOJAI AI services:

| Port | Service | Status | Purpose |
|------|---------|--------|---------|
| 4600 | hojai-business-copilot | ✅ RUNNING | Unified gateway (8 interfaces) |
| 4520 | hojai-memory | ✅ RUNNING | Memory infrastructure (L1-L5) |
| 4550 | hojai-expert-os | ✅ RUNNING | Agent runtime platform |
| 4700 | hojai-meeting-intelligence | ✅ RUNNING | AI meeting management |
| 4708 | genie-project-service | ✅ RUNNING | Project & task management |
| 4752 | hojai-customer-intelligence | ✅ RUNNING | Customer 360 |
| 4755 | hojai-product-intelligence | ✅ RUNNING | Product hub |
| 4756 | hojai-competitive-intelligence | ✅ RUNNING | Competitive intel |
| 4757 | hojai-revenue-intelligence | ✅ RUNNING | Revenue tracking & forecasting |
| 4242 | hojai-goal-os | ✅ RUNNING | Goal management & OKRs |
| 4244 | sutar-flow-os | ✅ RUNNING | Workflow orchestration |
| 4260 | hojai-founder-os | ✅ RUNNING | Founder tools & briefings |
| 4810 | hojai-graph | ✅ RUNNING | Knowledge graph (31 entities) |
| 4820 | hojai-workforce | ✅ RUNNING | AI employee marketplace |
| 4860 | hojai-twin | ✅ RUNNING | Digital twins |
| 4870 | hojai-board | ✅ RUNNING | AI C-Suite advisory board |
| 4241 | sutar-simulation-os | ✅ RUNNING | What-if scenarios |

**Total: 18 HOJAI AI services running**

**Verified Working:**
- ✅ Gateway health endpoint
- ✅ Chat interface (24 industries)
- ✅ Query router with intent classification
- ✅ Skills catalog
- ✅ 120+ skills across 24 industries

### HOJAI Products & Features

#### MemoryOS
| Feature | Description |
|---------|-------------|
| Conversation Memory | Chat history, context persistence |
| Preference Memory | User likes, dislikes, settings |
| Interaction Memory | Behavioral patterns, usage data |
| Knowledge Memory | Facts, entities, relationships |
| Cross-Device Sync | Seamless memory across devices |

#### TwinOS
| Feature | Description |
|---------|-------------|
| Human Twin | Employee/customer digital twin |
| Agent Twin | AI employee digital twin |
| Hybrid Twin | Human + Agent team composition |
| Organization Twin | Company-level digital twin |
| Asset Twin | Product, inventory, equipment twins |
| Relationship Graph | Entity relationships, social graph |

#### FlowOS
| Feature | Description |
|---------|-------------|
| Visual Workflow Builder | Drag-and-drop workflow creation |
| Pre-built Templates | Healthcare, e-commerce, finance |
| Conditional Logic | If/else, switch, merge |
| Integrations | 100+ integrations |
| Version Control | Git-like versioning |
| Collaboration | Team workflows |

#### GenieOS
| Feature | Description |
|---------|-------------|
| Personal AI Assistant | Contextual help, task automation |
| Proactive Suggestions | Based on behavior patterns |
| Cross-Platform | Web, mobile, desktop |
| Privacy-First | Local processing options |
| Learning | Adapts to user preferences |

#### SkillNet
| Feature | Description |
|---------|-------------|
| Skill Registry | Browse, install, update skills |
| Training Pipeline | Train skills with data |
| Evaluation | Benchmark skill performance |
| Evolution | Auto-improve skills |
| Marketplace | Buy/sell skills |

---

# =============================================================================
# SECTION 2: RABTUL TECHNOLOGIES - COMPLETE
# =============================================================================

## RABTUL Technologies - "Infrastructure for Money Movement"

**Role:** Provides payments, auth, wallet to all ecosystem companies

### RABTUL Products

| Product | Type | Purpose |
|---------|------|---------|
| **RABTUL Pay** | Product | Payment gateway (UPI, cards, net banking) |
| **RABTUL Auth** | Product | Authentication, SSO, MFA |
| **RABTUL Wallet** | Product | Digital wallet, REZ Coins |
| **RABTUL Connect** | Product | Banking integrations |
| **RABTUL Lending** | Product | BNPL, EMI, credit |
| **RABTUL Notify** | Product | Notifications (SMS, email, WhatsApp) |
| **RABTUL Checkout** | Product | One-click checkout |
| **RABTUL Subscriptions** | Product | Recurring payments |

### RABTUL Services

| Service | Port | Purpose |
|---------|------|---------|
| risa-care-rabtul-auth | 4002 | Authentication service |
| risa-care-rabtul-payment | 4001 | Payment processing |
| risa-care-rabtul-wallet | 4004 | Digital wallet |
| risa-care-rabtul-connect | 4003 | Banking integrations |
| risa-care-rabtul-lending | 4010 | BNPL, EMI |
| risa-care-rabtul-notify | 4011 | Notifications |

---

# =============================================================================
# SECTION 3: ADBAZAAR - COMPLETE
# =============================================================================

## AdBazaar - "AI-Powered Commerce"

**Role:** Provides marketing and commerce services

### AdBazaar Products

| Product | Type | Purpose |
|---------|------|---------|
| **Intent Exchange** | Platform | Real-time ad bidding |
| **Retail Media** | Platform | In-store digital signage |
| **Performance Marketing** | Product | ROI-focused campaigns |
| **Content Engine** | Product | AI content generation |
| **Audience Intelligence** | Product | Customer segmentation |

---

# =============================================================================
# SECTION 4: NEXHA - COMPLETE
# =============================================================================

## Nexha - "Commerce Network OS"

**Role:** Provides distribution, franchise, procurement services

### Nexha Products

| Product | Type | Purpose |
|---------|------|---------|
| **Nexha Distribute** | Product | Distribution management |
| **Nexha Franchise** | Product | Franchise network |
| **Nexha Procure** | Product | Procurement automation |
| **Nexha Supply** | Product | Supply chain optimization |

---

# =============================================================================
# SECTION 5: CORPPERKS - COMPLETE
# =============================================================================

## CorpPerks - "Workforce OS"

**Role:** Provides HR, workforce management, and digital twins

### CorpPerks Products

| Product | Type | Purpose |
|---------|------|---------|
| **Human Twin** | Product | Employee digital twin |
| **Agent Twin** | Product | AI agent digital twin |
| **Hybrid Twin** | Product | Human + Agent team |
| **Workforce OS** | Platform | HR management |
| **Payroll** | Product | Salary processing |
| **Benefits** | Product | Employee benefits |

---

# =============================================================================
# SECTION 6: RISA CARE - COMPLETE (THIS COMPANY)
# =============================================================================

## RisaCare - "India's Consumer Healthcare OS"

**Tagline:** "Your Health. Understood." (MyRisa)

### Complete Port Map

#### B2C Core Platform (4700-4708)

| Port | Service | MongoDB | Integration | Purpose |
|------|---------|---------|-------------|---------|
| 4700 | risa-care-api-gateway | ✅ | RABTUL, REZ | Main entry, routing |
| 4701 | risa-care-profile-service | ✅ | RABTUL Auth | Profiles, family |
| 4702 | risa-care-records-service | ✅ | REZ Intelligence | Health records, OCR |
| 4703 | risa-care-wellness-service | ✅ | - | Cycle, habits, pregnancy |
| 4704 | risa-care-visit-service | ✅ | - | Visits, encounters |
| 4705 | risa-care-consent-service | ✅ | - | HIPAA/DPDP consent |
| 4706 | risa-care-care-circle-service | ✅ | - | Family, caregiver access |
| 4707 | risa-care-medication-service | ✅ | - | Prescriptions, reminders |
| 4708 | risa-care-corporate-service | ✅ | - | Corporate wellness |

#### B2C Healthcare Products (4720-4729)

| Port | Service | MongoDB | Integration | Purpose |
|------|---------|---------|-------------|---------|
| 4720 | risa-care-chronic-care-service | ✅ | HOJAI AI | Diabetes, BP, Thyroid |
| 4721 | risa-care-elderly-service | ✅ | RABTUL | Fall detection, SOS |
| 4722 | risa-care-mental-health-service | ✅ | HOJAI AI | Therapy, crisis support |
| 4723 | risa-care-teleconsult-service | ✅ | WebRTC | Video consultations |
| 4724 | risa-care-insurance-service | ✅ | RABTUL | Health insurance |
| 4725 | risa-care-nutrition-service | ✅ | HOJAI AI | Diet planning, calories |
| 4726 | risa-care-second-opinion-service | ✅ | HOJAI AI | Medical opinions |
| 4727 | risa-care-vaccination-service | ✅ | - | Immunization tracking |
| 4728 | risa-care-home-healthcare-service | ✅ | RABTUL | Home nursing, caregivers |
| 4729 | risa-care-sleep-service | ✅ | HOJAI AI | Sleep analysis |

#### Emergency & Integration (4730-4732)

| Port | Service | MongoDB | Integration | Purpose |
|------|---------|---------|-------------|---------|
| 4730 | emergency-service | ✅ | RABTUL | Ambulance, SOS |
| 4731 | abha-service | ✅ | Government | India Digital Health ID |
| 4732 | risa-care-ai-scribe | ✅ | HOJAI LLM | Medical scribe, SOAP notes |

#### B2B Enterprise (4740-4743)

| Port | Service | MongoDB | Integration | Purpose |
|------|---------|---------|-------------|---------|
| 4740 | risa-care-hospital-service | ✅ | RABTUL | Hospital management, ADT |
| 4741 | risa-care-doctor-practice-service | ✅ | - | Clinic management |
| 4742 | risa-care-lab-service | ✅ | - | Lab information system |
| 4743 | risa-care-pharmacy-management-service | ✅ | RABTUL | Pharmacy inventory |

#### AI + Revenue Cycle (4750-4762)

| Port | Service | MongoDB | Integration | Purpose |
|------|---------|---------|-------------|---------|
| 4750 | risa-care-rcm-service | ✅ | HOJAI, REZ | Revenue Cycle Management |
| 4753 | risa-care-wearable-service | ✅ | RABTUL, REZ | Apple/Google Fit |
| 4754 | risa-care-predictive-service | ✅ | HOJAI AI | NEWS2, qSOFA, Fall risk |
| 4755 | risa-care-lab-integration | ✅ | - | SRL, PathLabs, Metropolis |
| 4756 | risa-care-teleconsult-v2 | ✅ | WebRTC | Video consultations v2 |
| 4757 | risa-care-pharmacy-integration | ✅ | RABTUL, REZ | 1mg, PharmEasy |
| 4758 | risa-care-eligibility-service | ✅ | - | CAQH, NaviNet |
| 4759 | risa-care-clearinghouse | ✅ | - | 837 Claims EDI |
| 4760 | risa-care-nursing-home-service | ✅ | RABTUL, REZ | Resident management |
| 4761 | risa-care-fhir-service | ✅ | - | FHIR R4 interoperability |
| 4762 | risa-care-ambient-audio-service | ✅ | HOJAI LLM | Real-time STT |

#### Patient/Doctor Apps (4770-4781)

| Port | Service | MongoDB | Integration | Purpose |
|------|---------|---------|-------------|---------|
| 4770 | risa-care-mobile-backend | ✅ | RABTUL, REZ | Patient/Doctor apps |
| 4772 | risa-care-hospital-admin | ✅ | - | Hospital admin dashboard |
| 4773 | risa-care-telemedicine | ✅ | HOJAI, RABTUL | Video consultations |
| 4774 | risa-care-marketplace | ✅ | RABTUL | Health products |
| 4775 | risa-care-insurance-aggregator | ✅ | RABTUL | Insurance compare/buy |
| 4776 | risa-care-homecare | ✅ | - | Home nursing, caregivers |
| 4777 | risa-care-diagnostics | ✅ | - | Lab tests, booking |
| 4778 | risa-care-emr-service | ✅ | - | Electronic Medical Records |
| 4779 | risa-care-patient-portal | ✅ | RABTUL | Patient records portal |
| 4780 | risa-care-provider-directory | ✅ | - | Doctor/hospital search |
| 4781 | risa-care-health-wallet | ✅ | RABTUL | Savings, rewards |

### MyRisa - Personal Wellbeing Intelligence

**Tagline:** "Your Health. Understood."

#### MyRisa 7 Domains

| Domain | Icon | Service Port | Description |
|--------|------|--------------|-------------|
| **Women's Health** | 🌸 | 4820 | Cycle, Fertility, Pregnancy, PCOS, Menopause |
| **Sexual Wellness** | 💜 | 4821 | Libido, Contraception, Intimacy, Reproductive |
| **Mental Wellness** | 🧠 | 4722 | Mood, Stress, Therapy, Crisis Support |
| **Sleep** | 😴 | 4729 | Sleep tracking, analysis, recommendations |
| **Lifestyle** | 🏃 | 4703 | Exercise, Nutrition, Habits |
| **Work-Life Balance** | ⚡ | 4822 | Burnout, Energy, Productivity, PTO |
| **Relationships** | ❤️ | 4823 | Partner, Quality Time, Intimacy |

#### MyRisa Services

| Port | Service | Description |
|------|---------|-------------|
| 4900 | myrisa-app | Consumer interface |
| 4800 | myrisa-universal-memory | All domains memory |
| 4820 | myrisa-womens-health-service | Cycle, fertility, pregnancy |
| 4821 | myrisa-sexual-wellness-service | Libido, contraception |
| 4822 | myrisa-worklife-service | Burnout, energy, PTO |
| 4823 | myrisa-relationships-service | Partner, quality time |
| 4824 | myrisa-human-twin-service | Unified health twin |
| 4825 | myrisa-consultation-copilot | Pre/post-visit intelligence |
| 4910 | myrisa-auth-service | RABTUL integration |
| 4920 | myrisa-genie-health | AI health assistant |
| 4930 | myrisa-family-service | Family management |

---

# =============================================================================
# SECTION 7: STAYOWN - COMPLETE
# =============================================================================

## StayOwn - "Hospitality & Living"

**Role:** Provides hospitality and living services

### StayOwn Products

| Product | Type | Purpose |
|---------|------|---------|
| **StayOwn Hotels** | Product | Hotel management |
| **StayOwn Vacation** | Product | Vacation rentals |
| **StayOwn Living** | Product | Long-term rentals |
| **StayOwn Experience** | Product | Experiences and tours |

---

# =============================================================================
# SECTION 8: RISNAESTATE - COMPLETE
# =============================================================================

## RisnaEstate - "AI-Powered Real Estate"

**Role:** Provides real estate marketplace and CRM

### RisnaEstate Products

| Product | Type | Purpose |
|---------|------|---------|
| **Property Marketplace** | Platform | Buy/rent properties |
| **Agent CRM** | Product | Agent management |
| **Property Valuation** | Product | AI valuation |
| **Virtual Tours** | Product | 3D property tours |

---

# =============================================================================
# SECTION 9: REZ CONSUMER - COMPLETE
# =============================================================================

## REZ Consumer - "Consumer Super App"

**Role:** Provides shopping, wallet, rewards to consumers

### REZ Consumer Products

| Product | Type | Purpose |
|---------|------|---------|
| **REZ Shop** | Product | Shopping marketplace |
| **REZ Wallet** | Product | Digital wallet |
| **REZ Rewards** | Product | Loyalty program |
| **REZ Deals** | Product | Deals and offers |
| **REZ Express** | Product | Quick delivery |

---

# =============================================================================
# SECTION 10: REZ MERCHANT - COMPLETE
# =============================================================================

## REZ Merchant - "Merchant Commerce Platform"

**Role:** Provides POS, KDS, QR Cloud to merchants

### REZ Merchant Products

| Product | Type | Purpose |
|---------|------|---------|
| **REZ POS** | Product | Point of sale |
| **REZ KDS** | Product | Kitchen display system |
| **REZ QR** | Product | QR ordering |
| **REZ Payments** | Product | Payment collection |
| **REZ Inventory** | Product | Inventory management |

---

# =============================================================================
# SECTION 11: KHAIRMOVE - COMPLETE
# =============================================================================

## KHAIRMOVE - "Mobility OS"

**Role:** Provides ride, driver, fleet, logistics services

### KHAIRMOVE Products

| Product | Type | Purpose |
|---------|------|---------|
| **KHAIRMOVE Ride** | Product | Ride sharing |
| **KHAIRMOVE Driver** | Product | Driver app |
| **KHAIRMOVE Fleet** | Product | Fleet management |
| **KHAIRMOVE Logistics** | Product | Delivery logistics |
| **KHAIRMOVE Connect** | Product | API integrations |

---

# =============================================================================
# SECTION 12: LAWGENS - COMPLETE
# =============================================================================

## LawGens - "Legal AI"

**Role:** Provides legal research, contracts, compliance

### LawGens Products

| Product | Type | Purpose |
|---------|------|---------|
| **LawGens Research** | Product | AI legal research |
| **LawGens Contracts** | Product | Contract analysis |
| **LawGens Compliance** | Product | Compliance checking |
| **LawGens Courts** | Product | Court case tracking |

---

# =============================================================================
# SECTION 13: RIDZA - COMPLETE
# =============================================================================

## RIDZA - "The CFO Who Finally Saw Everything"

**Role:** Provides credit, insurance, lending services

### RIDZA Products

| Product | Type | Purpose |
|---------|------|---------|
| **RIDZA Credit** | Product | Credit assessment |
| **RIDZA Insurance** | Product | Insurance products |
| **RIDZA Lending** | Product | Lending platform |
| **RIDZA Analytics** | Product | Financial analytics |

---

# =============================================================================
# SECTION 14: ASSETMIND - COMPLETE
# =============================================================================

## AssetMind - "Financial Intelligence"

**Role:** Provides Bloomberg-like platform and digital twins

### AssetMind Products

| Product | Type | Purpose |
|---------|------|---------|
| **AssetMind Terminal** | Platform | Financial terminal |
| **AssetMind Twins** | Product | Asset digital twins |
| **AssetMind Insights** | Product | Market insights |
| **AssetMind Portfolio** | Product | Portfolio management |

---

# =============================================================================
# SECTION 15: AXOM - COMPLETE
# =============================================================================

## Axom - "Trust, Social & BPO"

**Role:** Provides trust scores, social features, BPO services

### Axom Products

| Product | Type | Purpose |
|---------|------|---------|
| **BuzzLocal** | Product | Local business reviews |
| **Z-Events** | Product | Event management |
| **Cosmic OS** | Product | Social operating system |
| **Axom Trust** | Product | Trust scoring |

---

# =============================================================================
# SECTION 16: KARMA FOUNDATION - COMPLETE
# =============================================================================

## Karma Foundation - "Social Impact"

**Role:** Provides education, healthcare, community services

### Karma Foundation Products

| Product | Type | Purpose |
|---------|------|---------|
| **Karma Education** | Product | Educational programs |
| **Karma Healthcare** | Product | Healthcare access |
| **Karma Community** | Product | Community building |
| **Karma Impact** | Product | Impact tracking |

---

# =============================================================================
# SECTION 17: REZ INTELLIGENCE - COMPLETE
# =============================================================================

## REZ Intelligence - "Intent Graph & AI"

**Role:** Provides intent prediction and health expertise

### REZ Intelligence Services

| Service | Port | Purpose |
|---------|------|---------|
| Health Expert | 3011 | Medical interpretation |
| Intent Graph | 3014 | Care recommendations |
| Memory Layer | 4201 | Health timeline |

---

# =============================================================================
# SECTION 18: RTNM PRODUCTS & FEATURES AUDIT
# =============================================================================

## Complete Products & Features by Company

### HOJAI AI Products & Features

#### HOJAI Core (12 Platforms)
| Feature | Description |
|---------|-------------|
| **API Gateway** | Routing, auth, rate limiting, load balancing |
| **Event Bus** | Pub/sub, streaming, real-time events |
| **Memory** | Vector store, timeline, semantic search |
| **Intelligence** | ML predictions, anomaly detection |
| **Agents** | Agent orchestration, scheduling, execution |
| **Workflows** | Automation, triggers, conditions |
| **Communications** | WhatsApp, SMS, Email, Push |
| **Hyperlocal** | Geo intelligence, location services |
| **Data** | Feature store, data pipeline |
| **Governance** | RBAC, audit logs, permissions |
| **Identity** | Identity management, verification |
| **Analytics** | Dashboards, metrics, reporting |

#### MemoryOS Features
| Feature | Description |
|---------|-------------|
| **Conversation Memory** | Chat history, context persistence |
| **Preference Memory** | User likes, dislikes, settings |
| **Interaction Memory** | Behavioral patterns, usage data |
| **Knowledge Memory** | Facts, entities, relationships |
| **Cross-Device Sync** | Seamless memory across devices |

#### TwinOS Features
| Feature | Description |
|---------|-------------|
| **Human Twin** | Employee/customer digital twin |
| **Agent Twin** | AI employee digital twin |
| **Hybrid Twin** | Human + Agent team composition |
| **Organization Twin** | Company-level digital twin |
| **Asset Twin** | Product, inventory, equipment twins |
| **Relationship Graph** | Entity relationships, social graph |

#### FlowOS Features
| Feature | Description |
|---------|-------------|
| **Visual Workflow Builder** | Drag-and-drop workflow creation |
| **Pre-built Templates** | Healthcare, e-commerce, finance |
| **Conditional Logic** | If/else, switch, merge |
| **Integrations** | 100+ integrations |
| **Version Control** | Git-like versioning |
| **Collaboration** | Team workflows |

#### GenieOS Features
| Feature | Description |
|---------|-------------|
| **Personal AI Assistant** | Contextual help, task automation |
| **Proactive Suggestions** | Based on behavior patterns |
| **Cross-Platform** | Web, mobile, desktop |
| **Privacy-First** | Local processing options |
| **Learning** | Adapts to user preferences |

#### SkillNet Features
| Feature | Description |
|---------|-------------|
| **Skill Registry** | Browse, install, update skills |
| **Training Pipeline** | Train skills with data |
| **Evaluation** | Benchmark skill performance |
| **Evolution** | Auto-improve skills |
| **Marketplace** | Buy/sell skills |

#### HOJAI Voice Features (19 Services)
| Service | Features |
|---------|----------|
| **Voice Core** | STT, TTS, conversation, IVR, dialer, bot |
| **Voice Analytics** | Quality, recording, screening, coaching |
| **Voice Compliance** | Recording, audit, compliance |
| **Voice Enterprise** | Support, AI features, integrations |

#### HOJAI Bridge Features
| Feature | Description |
|---------|-------------|
| **Universal Connector** | Connect all products to SkillNet |
| **Product Integration** | BrandPulse, HIB, AssetMind, Nexha, RisaCare |
| **Cross-Product Insights** | Unified intelligence |
| **Service Discovery** | Auto-discover services |

### RABTUL Products & Features

| Product | Features |
|---------|----------|
| **RABTUL Pay** | UPI, cards, net banking, wallets, EMI |
| **RABTUL Auth** | JWT, SSO, MFA, OAuth, Social login |
| **RABTUL Wallet** | Balance, REZ Coins, transactions, history |
| **RABTUL Connect** | Bank API, balance check, transfers |
| **RABTUL Lending** | BNPL, EMI, credit line, instant approval |
| **RABTUL Notify** | SMS, email, WhatsApp, push notifications |

### AdBazaar Products & Features

| Product | Features |
|---------|----------|
| **Intent Exchange** | Real-time bidding, audience targeting |
| **Retail Media** | Digital signage, proximity marketing |
| **Performance Marketing** | ROI tracking, A/B testing, optimization |
| **Content Engine** | AI content generation, SEO optimization |

### Nexha Products & Features

| Product | Features |
|---------|----------|
| **Nexha Distribute** | Inventory, logistics, tracking |
| **Nexha Franchise** | Multi-brand, reporting, commission |
| **Nexha Procure** | Vendor management, PO, approvals |
| **Nexha Supply** | Demand forecasting, optimization |

### CorpPerks Products & Features

| Product | Features |
|---------|----------|
| **Human Twin** | Employee profile, preferences, history |
| **Agent Twin** | AI agent, capabilities, performance |
| **Hybrid Twin** | Team composition, collaboration |
| **Workforce OS** | Payroll, attendance, performance |

### RisaCare Products & Features

**Full features list:** [RISACARE-FEATURES-LIST.md](RISACARE-FEATURES-LIST.md)

#### Core Healthcare Features
| Category | Features |
|----------|----------|
| **B2C Core** | Profiles, records, wellness, visits, consent, care circle, medications |
| **B2C Healthcare** | Chronic care, elderly, mental health, teleconsult, insurance, nutrition |
| **B2B Enterprise** | Hospital, doctor practice, lab, pharmacy |
| **AI & Intelligence** | RCM, predictive, AI scribe, FHIR, ambient audio |
| **Patient Apps** | Mobile backend, telemedicine, marketplace, diagnostics, EMR |

#### MyRisa Features (7 Domains)
| Domain | Features |
|--------|----------|
| **Women's Health** | Cycle, fertility, pregnancy, PCOS, menopause |
| **Sexual Wellness** | Libido, contraception, intimacy, reproductive |
| **Mental Wellness** | Mood, stress, therapy, crisis support |
| **Sleep** | Tracking, analysis, recommendations |
| **Lifestyle** | Exercise, nutrition, habits |
| **Work-Life Balance** | Burnout, energy, productivity |
| **Relationships** | Partner, quality time, intimacy |

### StayOwn Products & Features

| Product | Features |
|---------|----------|
| **StayOwn Hotels** | Booking, PMS, channel manager |
| **StayOwn Vacation** | Listings, calendar, reviews |
| **StayOwn Living** | Long-term, roommate matching |
| **StayOwn Experience** | Tours, activities, guides |

### Other Companies Summary

| Company | Key Products | Key Features |
|---------|--------------|---------------|
| **RisnaEstate** | Marketplace, CRM, Valuation | Property AI, virtual tours |
| **REZ Consumer** | Shop, Wallet, Rewards | One-click checkout, coins |
| **REZ Merchant** | POS, KDS, QR | Inventory, analytics |
| **KHAIRMOVE** | Ride, Driver, Fleet | Real-time tracking, routing |
| **LawGens** | Research, Contracts | AI analysis, compliance |
| **RIDZA** | Credit, Insurance, Lending | Scoring, instant approval |
| **AssetMind** | Terminal, Twins, Insights | Bloomberg-like, portfolio |
| **Axom** | BuzzLocal, Z-Events | Trust scores, events |
| **Karma** | Education, Healthcare | Impact tracking, community |

---

# =============================================================================
# SECTION 19: WHITE-LABEL SOLUTION
# =============================================================================

## RisaCare White-Label Healthcare Platform

**Tagline:** "Your Brand. Our Platform. Better Healthcare."

### White-Label Packages

| Package | For | Price |
|---------|-----|-------|
| **Hospital Pro** | Multi-specialty hospitals | ₹X Lakhs/year |
| **Clinic Express** | Single/multi-chain clinics | ₹25,000/month |
| **Lab Network** | Diagnostic chains | ₹X Lakhs/year |

### White-Label Documentation

| Document | Purpose |
|----------|---------|
| [RISACARE-WHITE-LABEL-SOLUTION.md](RISACARE-WHITE-LABEL-SOLUTION.md) | Complete white-label guide |
| [white-label/index.html](white-label/index.html) | Demo landing page |
| [white-label/pricing-calculator.html](white-label/pricing-calculator.html) | Pricing calculator |
| [white-label/SALES-PITCH-DECK.md](white-label/SALES-PITCH-DECK.md) | Sales pitch deck |
| [white-label/CONTRACT-TEMPLATES.md](white-label/CONTRACT-TEMPLATES.md) | Legal templates |
| [white-label/tenant-config.js](white-label/tenant-config.js) | Tenant configs |

---

# =============================================================================
# SECTION 20: DEPLOYMENT & DOCUMENTATION
# =============================================================================

## Deployment

### Docker Compose (Full Stack)

```bash
# Start all 56 services
cd RisaCare
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop all
docker-compose -f docker-compose.production.yml down
```

### Node.js (Development)

```bash
# Start individual service
cd risa-care-second-opinion-service
npm install mongoose
npm run dev

# Test health check
curl http://localhost:4726/health
```

## Environment Variables

```env
# RisaCare
PORT=4726
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/risa_care_second_opinion

# HOJAI
HOJAI_LLM_URL=http://localhost:4730
HOJAI_VOICE_URL=http://localhost:4590

# RABTUL
RABTUL_AUTH_URL=http://localhost:4002
RABTUL_PAYMENT_URL=http://localhost:4001
RABTUL_NOTIFICATION_URL=http://localhost:4011

# REZ Intelligence
REZ_INTELLIGENCE_URL=http://localhost:3000
HEALTH_EXPERT_URL=http://localhost:3011
```

---

## Related Documentation

| Document | Purpose |
|---------|---------|
| [SOT.md](SOT.md) | Source of Truth - Complete registry |
| [MONGODB-AUDIT.md](MONGODB-AUDIT.md) | MongoDB integration audit |
| [docker-compose.production.yml](docker-compose.production.yml) | Production Docker deployment |
| [PRODUCTION-AUDIT.md](PRODUCTION-AUDIT.md) | Production readiness audit |
| [RISACARE-FEATURES-LIST.md](RISACARE-FEATURES-LIST.md) | Complete features list |
| [MYRISA-COMPLETE-DOCUMENTATION.md](MYRISA-COMPLETE-DOCUMENTATION.md) | MyRisa personal wellbeing |
| [RTNM-COMPANIES-AUDIT.md](RTNM-COMPANIES-AUDIT.md) | Full RTNM ecosystem audit |
| [RTNM-PRODUCTS-FEATURES-AUDIT.md](RTNM-PRODUCTS-FEATURES-AUDIT.md) | Complete features audit |
| [RISACARE-WHITE-LABEL-SOLUTION.md](RISACARE-WHITE-LABEL-SOLUTION.md) | White-label solution |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 5.1.0 | June 12, 2026 | Added complete RTNM ecosystem data, white-label package |
| 5.0.0 | June 12, 2026 | Production ready with all 56+ services, K8s, security hardening |
| 4.0.0 | June 7, 2026 | All 56 services MongoDB, Docker deployment |
| 3.0.0 | June 5, 2026 | Ecosystem integration, 50+ services |
| 2.0.0 | June 2, 2026 | MongoDB upgrade |
| 1.0.0 | Initial | B2C launch |

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

**License:** Proprietary - RTNM Digital
**GitHub:** github.com/imrejaul007/RisaCare
---

# RisaCare Dental Services - SmileCraft Integration (Added June 14, 2026)

## New Dental Services

| Service | Port | Purpose | Location |
|---------|------|---------|----------|
| Dental Twin | 4751 | Tooth records, oral health | `risa-care-dental-twin-service/` |
| Dental Inventory | 4752 | Supplies, auto-reorder | `risa-care-dental-inventory-service/` |

## Dental Twin Service

**File:** `risa-care-dental-twin-service/src/index.js`

### Features

| Category | Features |
|---------|----------|
| Tooth Records | 32 teeth mapping, position, sensitivity, mobility, prognosis |
| Treatment History | 15 types (filling, root canal, implant, etc.) |
| X-Ray Management | 7 types, AI analysis, comparison |
| Oral Health | Gum health, cavity risk, predictions |

### Quick Commands

```bash
cd companies/RisaCare/risa-care-dental-twin-service
npm install && npm start  # Port 4751

# Initialize patient teeth
curl -X POST http://localhost:4751/api/dental/init \
  -H "Content-Type: application/json" \
  -d '{"patientId": "xxx"}'

# Get dental summary
curl http://localhost:4751/api/dental/summary/xxx

# Generate predictions
curl -X POST http://localhost:4751/api/dental/predict \
  -d '{"patientId": "xxx"}'
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dental/init` | POST | Initialize 32 teeth |
| `/api/dental/summary/:patientId` | GET | Get summary |
| `/api/dental/predict` | POST | Generate predictions |
| `/api/tooth/:id/:num/treatment` | POST | Add treatment |
| `/api/xray` | POST | Add X-ray |
| `/api/xray/compare` | POST | Compare X-rays |

## Dental Inventory Service

**File:** `risa-care-dental-inventory-service/src/index.js`

### Features

| Category | Features |
|---------|----------|
| Supplies Catalog | 40+ SKUs (implants, anesthetics, whitening, etc.) |
| Inventory | Stock tracking, low-stock alerts |
| Auto-Reorder | Nexha integration for procurement |

### Quick Commands

```bash
cd companies/RisaCare/risa-care-dental-inventory-service
npm install && npm start  # Port 4752

# Initialize clinic inventory
curl -X POST http://localhost:4752/api/inventory/init \
  -d '{"clinicId": "xxx"}'

# Get low stock
curl http://localhost:4752/api/inventory/xxx/low-stock

# Get catalog
curl http://localhost:4752/api/inventory/catalog
```

### Supply Categories

| Category | SKUs | Example |
|----------|------|---------|
| Implants | 5 | Titanium Implant (₹2,500) |
| Anesthetics | 4 | Lidocaine 2% (₹25) |
| Whitening | 3 | Professional Gel (₹1,200) |
| Surgical | 5 | Forceps (₹800) |
| Restorative | 6 | Composite Resin (₹800) |
| Preventive | 4 | Sealant (₹600) |
| Orthodontic | 3 | Brackets (₹3,000) |
| Lab | 3 | Dental Stone (₹200) |
| General | 8 | Gloves (₹250) |

## Story Flow - Services

| Time | Event | Service | Status |
|------|-------|---------|--------|
| 6:00 AM | Twin predictions | Dental Twin | ✅ |
| 11:30 AM | Patient context | Dental Twin | ✅ |
| 11:40 AM | Digital scan | Dental Twin + HOJAI | ✅ |
| 1:00 PM | Inventory notice | Dental Inventory | ✅ |
| 1:00 PM | Auto-reorder | Nexha | ✅ |

---

*Last Updated: June 14, 2026*
*SmileCraft Dental Clinic - All Services Integrated*
