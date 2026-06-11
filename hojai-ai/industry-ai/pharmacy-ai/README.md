# PharmacyAI

**Location:** `/hojai-ai/industry-ai/pharmacy-ai/`
**Parent:** HOJAI Healthcare AI (carecode)
**Status:** Wrapper for REZ-Merchant Pharmacy Services

---

## Overview

PharmacyAI is a wrapper layer that connects REZ-Merchant pharmacy services to the HOJAI AI ecosystem. The core pharmacy functionality is provided by REZ-Merchant's `rez-pharmacy-service` (port 4008), with additional intelligence from `carecode` (Healthcare AI).

---

## Architecture

```
PharmacyAI (Wrapper)
    │
    ├── Connects to REZ-Merchant Pharmacy Services
    │   ├── rez-pharmacy-service (4008)
    │   ├── rez-pharmacy-inventory-service
    │   ├── rez-pharmacy-prescription-service
    │   └── rez-pharmacy-web
    │
    └── Leverages carecode Healthcare AI
        ├── Drug interaction checking
        ├── Prescription verification
        └── Patient safety
```

---

## Products & Services

### REZ-Merchant Pharmacy Services

| Port | Service | Purpose |
|------|---------|---------|
| 4008 | rez-pharmacy-service | Core pharmacy - medicine inventory, prescriptions |
| - | rez-pharmacy-inventory-service | Dedicated inventory management |
| - | rez-pharmacy-prescription-service | Prescription management |
| - | rez-pharmacy-web | Pharmacy web dashboard |
| - | rez-mind-pharmacy-service | AI intelligence for pharmacy |

### RisaCare Pharmacy Services

| Port | Service | Purpose |
|------|---------|---------|
| 4743 | risa-care-pharmacy-management-service | B2B pharmacy management |

### HOJAI Healthcare AI (carecode)

Pharmacy capabilities are integrated into carecode:
- Drug interaction checking
- Prescription verification
- Patient safety alerts
- Inventory optimization

---

## Quick Start

```bash
# Start REZ-Merchant pharmacy service
cd REZ-Merchant/industry-os/rez-pharmacy-service && npm run dev  # Port 4008

# Access pharmacy web dashboard
open http://localhost:4008  # Or the configured port
```

---

## AI Employees

Pharmacy AI employees are provided by **carecode**:

| Employee | Purpose |
|----------|---------|
| Pharmacist AI | Prescription verification, drug interactions |
| Inventory Agent | Stock management, expiry tracking |
| Compliance Agent | Regulatory compliance, audit trails |

---

## Documentation

| Document | Purpose |
|----------|---------|
| REZ-Merchant/industry-os/ | Complete pharmacy service documentation |
| RisaCare/SOT.md | RisaCare pharmacy services |
| carecode/SOT.md | Healthcare AI (includes pharmacy) |

---

**Note:** This directory exists as a wrapper/connector to the pharmacy services. The actual pharmacy intelligence is provided by REZ-Merchant services and carecode (Healthcare AI).
