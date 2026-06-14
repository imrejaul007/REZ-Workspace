# 🏨 REZ Hotel OS

**Unified Hotel Management Platform** - Part of REZ Merchant OS

## Overview

REZ Hotel OS provides comprehensive hotel management capabilities integrated with the REZ ecosystem.

## Directory Structure

```
hotel-os/
├── core/              # Main PMS & booking
├── guest-experience/  # Guest-facing services
├── room-services/     # F&B & in-hotel services
├── operations/       # Operational services
├── ai/               # AI-powered services
├── intelligence/     # Data & analytics
├── payments/         # Payment processing
├── feedback/         # Reviews & surveys
├── integrations/     # External integrations
└── shared/           # Common utilities
```

## Migration

This directory was consolidated from:
- **StayOwn-Hospitality** (archived June 13, 2026)
- **REZ-Merchant/industry-os/** (existing hotel services)

## Services (Migrated)

| Service | Category | Source | LOC |
|---------|----------|--------|-----|
| rez-booking | core | StayOwn | 3,082 |
| rez-staybot | ai | StayOwn | 1,267 |
| pre-arrival | guest-experience | StayOwn | 658 |
| predictive-housekeeping | operations | StayOwn | 682 |
| hotel-business-twin | intelligence | StayOwn | 658 |
| guest-twin | intelligence | StayOwn | 602 |
| voice-agent | ai | StayOwn | 744 |
| rez-payment | payments | StayOwn | 590 |
| rez-channel-manager | integrations | REZ-Merchant | 1,323 |
| rez-maintenance | operations | REZ-Merchant | 502 |

## Documentation

- [Feature Comparison](../docs/HOTEL-SERVICES-COMPLETE.md)
- [Consolidation Plan](../docs/HOTEL-CONSOLIDATION-PLAN.md)

## Port Assignments

| Service | Port |
|---------|------|
| rez-booking | 4031 |
| rez-staybot | 4840 |
| rez-pre-arrival | 4828 |
| rez-digital-key | 4825 |
| rez-minibar | 4810 |
| rez-restaurant | 4811 |
| rez-spa | 4812 |
| rez-concierge | 4821 |
| rez-housekeeping | 4826 |
| rez-analytics | 4818 |

---

**Migrated:** June 13, 2026
