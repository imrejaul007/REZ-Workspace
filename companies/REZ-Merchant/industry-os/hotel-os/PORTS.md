# 🏨 REZ Hotel OS - Port Registry

**Version:** 1.0.0  
**Date:** June 13, 2026  
**Status:** CONSOLIDATED from StayOwn-Hospitality

---

## Port Assignments

All hotel services use ports in range **4800-4899** to avoid conflicts with main REZ-Merchant services (4000-4799).

### Core Services (4800-4809)

| Service | Port | Source | Notes |
|---------|------|--------|-------|
| rez-booking | **4801** | StayOwn | Main hotel booking engine |
| rez-pms | **4802** | StayOwn | Property Management (deprecated, use rez-booking) |
| rez-hotel-service | **4803** | REZ | Basic hotel service |
| rez-analytics | **4804** | StayOwn | Hotel analytics |

### Guest Experience (4810-4819)

| Service | Port | Source | Notes |
|---------|------|--------|-------|
| rez-digital-key | **4810** | StayOwn | Smart lock integration |
| rez-restaurant-hotel | **4811** | StayOwn | Hotel restaurant booking |
| rez-spa | **4812** | StayOwn | Spa booking |
| rez-concierge | **4813** | StayOwn | Concierge desk |
| rez-room-controls | **4814** | StayOwn | Room controls |
| rez-parking | **4815** | StayOwn | Parking management |
| rez-lost-found | **4816** | StayOwn | Lost & found |
| rez-upsell | **4817** | StayOwn | Upsell engine |
| rez-minibar | **4818** | StayOwn | Minibar service |
| rez-pre-arrival | **4819** | StayOwn | Pre-arrival automation |

### Feedback & Reviews (4820-4829)

| Service | Port | Source | Notes |
|---------|------|--------|-------|
| rez-reviews | **4820** | StayOwn | Review manager |
| rez-surveys | **4821** | StayOwn | Feedback surveys |
| rez-hotel-reviews | **4822** | REZ | Basic reviews |
| rez-self-checkout | **4823** | StayOwn | Express checkout |
| rez-digital-checkin | **4824** | StayOwn | Digital check-in |

### Operations (4830-4839)

| Service | Port | Source | Notes |
|---------|------|--------|-------|
| rez-housekeeping | **4830** | StayOwn | AI-powered housekeeping |
| rez-maintenance | **4831** | REZ | Maintenance requests |
| rez-hotel-housekeeping | **4832** | REZ | Basic housekeeping |
| rez-hotel-messaging | **4833** | REZ | Guest messaging |

### AI Services (4840-4849)

| Service | Port | Source | Notes |
|---------|------|--------|-------|
| rez-staybot | **4840** | StayOwn | AI chatbot/concierge |
| rez-staybot-router | **4841** | StayOwn | Service router |
| rez-voice-agent | **4842** | StayOwn | Voice AI agent |
| rez-hotel-genie | **4843** | StayOwn | AI genie |
| rez-ai-frontdesk | **4844** | StayOwn | AI front desk |

### Intelligence (4850-4859)

| Service | Port | Source | Notes |
|---------|------|--------|-------|
| rez-guest-memory | **4850** | StayOwn | Guest memory |
| rez-guest-memory-hotel | **4851** | StayOwn | Hotel-specific memory |
| rez-guest-twin | **4852** | StayOwn | Guest digital twin |
| rez-business-twin | **4853** | StayOwn | Hotel business twin |

### Integrations (4860-4869)

| Service | Port | Source | Notes |
|---------|------|--------|-------|
| rez-channel-manager | **4860** | REZ | Channel manager |
| rez-google-ads | **4861** | REZ | Google Hotel Ads |
| rez-corp-integration | **4862** | StayOwn | CorpPerks bridge |
| rez-airzy-bridge | **4863** | StayOwn | KHAIRMOVE/Airzy bridge |
| rez-hotel-gateway | **4864** | StayOwn | Integration gateway |
| rez-stayown-bridge | **4865** | StayOwn | Legacy bridge |

### Payments (4870-4879)

| Service | Port | Source | Notes |
|---------|------|--------|-------|
| rez-hotel-payment | **4870** | StayOwn | Hotel payments |

---

## Port Conflict Resolution

### Before Consolidation

| Service | Old Port | Conflict |
|---------|----------|----------|
| rez-booking | 4016 | Conflict with REZ-Merchant |
| rez-analytics | 4025 | Conflict with REZ-franchise |
| rez-pms | 4031 | Conflict with REZ-Merchant |
| rez-hotel-service | 4020 | Conflict |

### After Consolidation

All ports updated to **4800-4899** range.

---

## Quick Commands

```bash
# Check all hotel service ports
grep -r "PORT.*=.*48" industry-os/hotel-os/*/src/index.ts

# Update all ports to new scheme
find industry-os/hotel-os -name "index.ts" -exec sed -i '' 's/PORT.*=.*402/PORT = 48/g' {} \;
```

---

## Environment Variables

Each service expects:

```env
PORT=XXXX                    # Service port
MONGODB_URI=mongodb://...    # MongoDB connection
REDIS_URL=redis://...        # Redis
NODE_ENV=production         # Environment
INTERNAL_SERVICE_TOKEN=...   # Internal auth
```

---

**Last Updated:** June 13, 2026
