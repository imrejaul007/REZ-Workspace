# RTNM Digital - Complete Port Documentation

**Version:** 2.0
**Date:** June 10, 2026
**Total Ports:** 100+

---

## NEW SERVICES (June 2026)

| Port | Service | Company | Category | Description |
|------|---------|---------|----------|-------------|
| **4100** | devportal-api | HOJAI | Platform | Developer Platform - APIs, SDKs, Docs |
| **4150** | agent-wallet-api | HOJAI | Finance | Agent Wallet - Payments, Escrow, Payout |
| **4160** | agent-identity-api | HOJAI | Identity | Agent Identity - Registry, Certification |
| **4170** | arabic-ai-api | HOJAI | AI | Arabic AI - STT, TTS, NLU, Voice Twin |
| **4180** | marketplace-api | HOJAI | Platform | Agent Marketplace 2.0 - Ratings, Reviews |
| **4190** | trust-network-gateway | RTNM | Trust | RTNM Trust Network - Identity, Score, Rep |

---

## PORT RANGES BY COMPANY

### HOJAI AI (4500-4899)
Core AI infrastructure services

| Port | Service | Description |
|------|---------|-------------|
| 4500 | hojai-api-gateway | Routing, auth |
| 4510 | hojai-event-bus | Pub/sub |
| 4520 | hojai-memory | Vector store, RAG |
| 4530 | hojai-intelligence | ML predictions |
| 4550 | hojai-agents | Agent orchestration |
| 4560 | hojai-workflows | Automation |
| 4570 | hojai-communications | WhatsApp, SMS, Email |
| 4720 | hojai-vector | Vector embeddings |
| 4850 | voice-os | Voice platform |

### RABTUL (4000-4099)
Financial infrastructure

| Port | Service | Description |
|------|---------|-------------|
| 4000 | api-gateway | Central routing |
| 4001 | rez-payment-service | UPI, Razorpay |
| 4002 | rez-auth-service | JWT, OTP |
| 4004 | rez-wallet-service | Coins, balance |
| 4006 | rez-order-service | Orders |
| 4007 | rez-catalog-service | Products |
| 4008 | rez-search-service | Search |
| 4009 | rez-delivery-service | Delivery |
| 4011 | rez-notifications | Push, SMS |

### AdBazaar (4800-4999)
Marketing & advertising

| Port | Service | Description |
|------|---------|-------------|
| 4800 | intent-exchange | Intent signals |
| 4805 | audience-twin-service | Behavioral simulation |
| 4900 | data-clean-room | Privacy-safe data |
| 4960 | marketing-os | Marketing platform |

### REZ Intelligence (4018, 4123, 4201)
AI/ML services

| Port | Service | Description |
|------|---------|-------------|
| 4018 | REZ Intent Predictor | Intent prediction |
| 4123 | REZ Predictive Engine | ML predictions |
| 4201 | REZ Memory Layer | Intent memory |

### RIDZA (4500-4540)
Financial marketplace

| Port | Service | Description |
|------|---------|-------------|
| 4500 | ridza-core | Lead distribution |
| 4501 | ridza-partner-api | Partner API |
| 4502 | ridza-agent-portal | Agent CRM |
| 4507 | ridza-compliance | Consent, RBAC |
| 4510 | ridza-fraud | Fraud detection |
| 4520 | ridza-insurance | Insurance |
| **4530** | islamic-finance-api | Islamic Finance |
| **4540** | remittance-api | Remittance |

### REZ Merchant (4005, 4080-4081, 5150-5172)
Merchant platform

| Port | Service | Description |
|------|---------|-------------|
| 4005 | rez-merchant-service | Merchant API |
| 4080 | REZ-kitchen-display | KDS |
| 4081 | rez-pos-service | Universal POS |
| 5150 | REZ-atlas-gateway | Atlas AI |

### BuzzLocal / Axom (4000-4021)
Social & community

| Port | Service | Description |
|------|---------|-------------|
| 4000 | buzzlocal-feed-service | Feed |
| 4003 | buzzlocal-vibe-service | Vibe Map |
| 4004 | buzzlocal-community | Community |
| 4020 | buzzlocal-api-gateway | API gateway |
| 4021 | buzzlocal-crisis | Crisis management |

### CorpPerks (4700-4712)
HR & workforce

| Port | Service | Description |
|------|---------|-------------|
| 4701 | corpid-api-gateway | CorpID gateway |
| 4702 | corpid-identity | Identity |
| 4704 | corpid-ci-score | CI Score |
| 4706 | corpid-trust-graph | Trust relationships |
| 4712 | corpid-admin | Admin dashboard |

### RisaCare (4700-4759)
Healthcare

| Port | Service | Description |
|------|---------|-------------|
| 4700 | risacare-patient | Patient platform |
| 4701 | risacare-clinic | Clinic platform |
| 4702 | risacare-hospital | Hospital platform |
| 4750 | risacare-telemedicine | Telemedicine |

### StayOwn (3000-3010)
Hospitality

| Port | Service | Description |
|------|---------|-------------|
| 3007 | hotel-habixo-service | Hotel OS |
| 4101 | stayown-booking | Booking |

### RisnaEstate (4100-4113)
Real estate

| Port | Service | Description |
|------|---------|-------------|
| 4100 | risnaestate-gateway | Gateway |
| 4101 | risna-property-service | Property |
| 4102 | risna-visa-service | Visa |
| 4105 | risna-crm-service | CRM |

### KHAIRMOVE (4600-4606)
Mobility

| Port | Service | Description |
|------|---------|-------------|
| 4601 | khaimove-ride-service | Ride-hailing |
| 4602 | khaimove-fleet-service | Fleet management |
| 4606 | buzzlocal-rides | Community rides |

### REZ Consumer (3002-3018, 4200)
Consumer app

| Port | Service | Description |
|------|---------|-------------|
| 3002 | go4food-api | Food comparison |
| 3003 | REZ-inbox | Email parser |
| 3011 | REZ-assistant | AI chat |
| 4200 | rider-circle-api | RiderCircle |

---

## SPECIAL SERVICES

### Cosmic OS (4163-4167)
Life app

| Port | Service | Description |
|------|---------|-------------|
| 4163 | Cosmic Context API | Main cosmic data |
| 4167 | Life Story Engine | Narrative generation |

### RTNM Platform (6000-6007)
Platform administration

| Port | Service | Description |
|------|---------|-------------|
| 6000 | rtnm-company-registry | 22 companies |
| 6001 | rtnm-inter-company-graph | Who pays whom |
| 6004 | rtnm-inter-company-ledger | Revenue tracking |
| 6007 | rtnm-company-trust | Company trust scores |

---

## QUICK REFERENCE

### All New Services (June 2026)

```
4100 → devportal-api       (Developer Platform)
4150 → agent-wallet-api    (Agent Finance)
4160 → agent-identity-api  (Agent Identity)
4170 → arabic-ai-api       (Arabic AI)
4180 → marketplace-api     (Agent Marketplace)
4190 → trust-network-gateway (Trust Network)
4530 → islamic-finance-api (Islamic Finance)
4540 → remittance-api      (Remittance)
```

### Health Check All Services

```bash
# Check single service
curl http://localhost:4190/health

# Check all new services
for port in 4100 4150 4160 4170 4180 4190 4530 4540; do
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health 2>/dev/null)
  echo "Port $port: $status"
done
```

### Start All New Services

```bash
./scripts/start-all-services.sh start
./scripts/start-all-services.sh health
```

---

**Last Updated:** June 10, 2026