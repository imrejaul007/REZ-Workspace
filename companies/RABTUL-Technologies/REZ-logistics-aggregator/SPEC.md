# REZ Logistics Aggregator - SPEC.md

**Version:** 1.0.0
**Port:** 4052
**Company:** RABTUL-Technologies
**Category:** Logistics

---

## Overview

Multi-carrier shipping aggregation service. Provides unified rates, tracking, and label generation across multiple shipping carriers.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  REZ Logistics Aggregator                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Carriers:                                                                │
│  ├── Delhivery                                                          │
│  ├── Shadowfax                                                           │
│  ├── DTDC                                                               │
│  ├── BlueDart                                                            │
│  └── Ecom Express                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Shipping Rates
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rates` | Get shipping rates |
| POST | `/api/rates/compare` | Compare carrier rates |

### Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/track/:awb` | Track shipment |
| POST | `/api/track/batch` | Batch tracking |

### Labels
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/labels` | Generate label |
| GET | `/api/labels/:id` | Get label PDF |

### Pickup
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pickup/request` | Request pickup |
| GET | `/api/pickup/:id` | Get pickup status |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "cors": "^2.8.5"
}
```

---

## Status

- [x] Multi-carrier support
- [x] Rate comparison
- [x] Tracking integration
- [x] Label generation
- [x] Pickup scheduling
