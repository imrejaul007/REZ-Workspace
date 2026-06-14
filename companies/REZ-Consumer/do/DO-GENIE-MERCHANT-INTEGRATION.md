# 🎯 DO APP - GENIE - MERCHANT INTEGRATION GUIDE

**Version:** 1.0 | **Date:** June 7, 2026

---

## 📋 INTEGRATION OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DO APP (Consumer)                           │
│                                                                      │
│   DO App ───────────────────────────────────────────►  │
│   ├── Tap mic → Speak                                      │
│   ├── Browse → Select                                    │
│   └── Manual → Type                                        │
└──────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       GENIE OS LAYER                               │
│                                                                      │
│   genie-sdk ──────────────────────────────────────────► │
│   ├── Personal Twin (4520)                                     │
│   ├── Commerce Graph (4521)                                  │
│   ├── Behavior Engine (4522)                                 │
│   ├── Memory Graph (4703)                                    │
│   └── Flow SDK (4033)                                         │
└────────────────────────────────────────────────────────────┘
                              │
        ┌───────────────────────┬─────────────────┐
        │                       │                 │
        ▼                       ▼                 ▼
┌───────────────┐    ┌─────────────┐    ┌──────────┐
│  WAITRON     │    │  STAYBOT  │    │  CARECODE│
│  (Restaurant)│    │  (Hotel)   │    │(Healthcare)│
│  4830        │    │  4840      │    │  4850     │
└───────────────┘    └─────────────┘    └──────────┘

        ┌───────────────────────┬─────────────────┐
        │                       │                 │
        ▼                       ▼                 ▼
┌───────────────┐    ┌─────────────┐    ┌──────────┐
│  LEDGERAI    │    │ CorpPerks │    │  LawGens │
│  (Accounting)│    │  (HRMS)   │    │ (Legal)  │
│  4890        │    │  4006     │    │  5099   │
└───────────────┘    └─────────────┘    └──────────┘
```

---

## 🔗 CONNECTIONS

### DO App → Genie OS

| From | To | Port | Purpose |
|------|----|------|---------|
| DO App | Personal Twin | 4520 | User identity |
| DO App | Commerce Graph | 4521 | Orders, karma |
| DO App | Behavior Engine | 4522 | Behaviors |
| DO App | Memory Graph | 4703 | Memories |
| DO App | Flow SDK | 4033 | Voice STT/TTS |

### Genie OS → Unified Gateway

| From | To | Port | Purpose |
|------|----|------|---------|
| Twin | Gateway | 4500 | Intent routing |
| Commerce | Gateway | 4500 | Commerce commands |
| Memory | Gateway | 4500 | Recall requests |

### Gateway → Industry AI

| From | To | Port | Purpose |
|------|----|------|---------|
| Gateway | WAITRON | 4830 | Restaurant commands |
| Gateway | STAYBOT | 4840 | Hotel commands |
| Gateway | CARECODE | 4850 | Healthcare commands |
| Gateway | LEDGERAI | 4890 | Accounting |
| Gateway | CorpPerks | 4006 | HR/Payroll |
| Gateway | LawGens | 5099 | Legal |

### Industry AI → REZ Merchant

| From | To | Port | Purpose |
|------|----|------|---------|
| WAITRON | REZ-Merchant | 4005 | Inventory, POS |
| STAYBOT | REZ-Merchant | 4005 | Bookings |
| CARECODE | RisaCare | 4700 | Patient records |
| LEDGERAI | RABTUL | 4004 | Payments |

---

## 🔄 INTEGRATION FLOWS

### Flow 1: "Book Table"

```
User: "Book table at La Pinoz"
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                    DO APP                                    │
│    ├── Voice captured via Flow SDK (4033)                   │
│    ├── STT: "Book table at La Pinoz"                      │
│    └── Routes to Genie                                   │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  PERSONAL TWIN (4520)                       │
│    ├── Check user preferences                              │
│    ├── Check dietary restrictions                          │
│    └── Learn: "Books restaurants frequently"              │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│              COMMERCE GRAPH (4521)                         │
│    ├── Check karma balance                               │
│    ├── Record transaction                               │
│    └── Update merchant preference                       │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│              UNIFIED GATEWAY (4500)                       │
│    └── Intent: "book_restaurant" → WAITRON (4830)         │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  WAITRON (4830)                            │
│    ├── Check table availability                         │
│    ├── Apply user preferences                          │
│    └── Return available slots                          │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│              REZ-MERCHANT                                  │
│    ├── Table booking service                           │
│    └── Inventory check                                 │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  RABTUL (4004)                            │
│    └── Payment processing                               │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────┐
│                    DO APP                                │
│    └── Confirmation: "Table booked! Earned 60 karma"    │
└─────────────────────────────────────────────────┘
```

### Flow 2: "Process Payroll"

```
User: "Process payroll for June"
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                    DO APP (Business)                        │
│    └── Routes to Finance dashboard                          │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  UNIFIED GATEWAY (4500)                       │
│    └── Intent: "payroll" → CorpPerks (4006)                 │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  CORPPERKS (4006)                            │
│    ├── Employee data                                    │
│    ├── Salary calculations                              │
│    └── PF/ESI/TDS deductions                           │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  LEDGERAI (4890)                           │
│    └── Accounting entries                               │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  RABTUL (4004)                             │
│    └── Salary disbursement                               │
└─────────────────────────────────────────────────────┘
```

### Flow 3: "Book Hotel"

```
User: "Book Taj Hotel for 2 nights"
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                    DO APP                                    │
│    └── Gateway routing                                    │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│              PERSONAL TWIN (4520)                             │
│    ├── Check travel preferences                           │
│    ├── Check budget range                                │
│    └── Learn: "Books luxury hotels"                     │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  STAYBOT (4840)                             │
│    ├── Hotel availability                               │
│    ├── Room recommendations                            │
│    └── Loyalty program                                 │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  RABTUL (4004)                             │
│    └── Payment processing                               │
└─────────────────────────────────────────────────────┘
```

### Flow 4: "Medical Appointment"

```
User: "Book appointment with Dr. Sharma"
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                    DO APP (Healthcare)                        │
│    └── Gateway routing                                  │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  CARECODE (4850)                            │
│    ├── Doctor availability                              │
│    ├── Patient history                                 │
│    └── Insurance check                                │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  RISACARE (4700)                            │
│    └── Appointment scheduling                           │
└─────────────────────────────────────────────────────┘
```

### Flow 5: "Legal Review"

```
User: "Review this contract"
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                    DO APP (Legal)                             │
│    └── Gateway routing                                   │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  LAWGENS (5099)                            │
│    ├── Contract analysis                                │
│    ├── Risk assessment                                 │
│    └── Compliance check                                │
└─────────────────────────────────────────────────────┘
```

---

## 📦 SDK INTEGRATION

### Install Dependencies

```bash
cd REZ-Consumer/do
npm install @hojai/genie-sdk @hojai/flow-sdk @hojai/gateway-sdk
```

### Configure Environment

```bash
# .env
GENIE_TWIN_URL=http://localhost:4520
GENIE_COMMERCE_URL=http://localhost:4521
GENIE_BEHAVIOR_URL=http://localhost:4522
GENIE_MEMORY_URL=http://localhost:4703
FLOW_URL=http://localhost:4033
GATEWAY_URL=http://localhost:4500
```

### Initialize Genie in DO App

```typescript
// src/lib/genie.ts
import { createGenieOS } from '@hojai/genie-os-sdk';
import { createGatewayClient } from '@hojai/gateway-sdk';

export const genie = createGenieOS(userId, {
  twinUrl: process.env.GENIE_TWIN_URL,
  commerceUrl: process.env.GENIE_COMMERCE_URL,
  behaviorUrl: process.env.GENIE_BEHAVIOR_URL,
  memoryUrl: process.env.GENIE_MEMORY_URL,
});

export const gateway = createGatewayClient({
  baseURL: process.env.GATEWAY_URL,
});
```

---

## 🎯 CONNECTED SERVICES

| Service | Port | Company | Connected |
|---------|------|---------|-----------|
| Personal Twin | 4520 | HOJAI | ✅ |
| Commerce Graph | 4521 | HOJAI | ✅ |
| Behavior Engine | 4522 | HOJAI | ✅ |
| Memory Graph | 4703 | HOJAI | ✅ |
| Flow SDK | 4033 | HOJAI | ✅ |
| Gateway | 4500 | HOJAI | ✅ |
| WAITRON | 4830 | HOJAI | ✅ |
| STAYBOT | 4840 | HOJAI | ✅ |
| LEDGERAI | 4890 | HOJAI | ✅ |
| CorpPerks | 4006 | CorpPerks | ✅ |
| LawGens | 5099 | LawGens | ✅ |
| RABTUL | 4004 | RABTUL | ✅ |
| REZ-Merchant | 4005 | REZ-Merchant | ✅ |
| RisaCare | 4700 | RisaCare | ✅ |

---

**Last Updated:** June 7, 2026
**Status:** COMPLETE ✅