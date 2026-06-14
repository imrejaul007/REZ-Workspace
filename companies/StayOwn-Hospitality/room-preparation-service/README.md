# Room Preparation Service

**Company:** StayOwn-Hospitality
**Type:** Orchestration Service
**Port:** 4901
**Status:** ✅ Built (June 14, 2026)

---

## Overview

Room Preparation Service connects Memory → Room Twin → Room Ready.

### Tagline
> "The room already knows her"

---

## Flow

```
Guest Books → Memory Service → Preferences → Room Preparation → Room Ready
                                    ↓
                              Room Twin
                              Smart Lock
                              Housekeeping
                              Room Controls
```

---

## Capabilities

### Guest Preferences
- [x] Fetch from Memory Service
- [x] Temperature (22°C)
- [x] Pillow type (soft)
- [x] Water preference (sparkling)
- [x] Breakfast preference (healthy)
- [x] Dietary restrictions
- [x] Special requests

### Room Preparation
- [x] Set temperature
- [x] Prepare minibar
- [x] Configure amenities
- [x] Schedule breakfast
- [x] Queue housekeeping

### Integration
- [x] Memory Service (Port 4520)
- [x] Room Twin (Port 8447)
- [x] Smart Lock (Port 3825)
- [x] Room Controls (Port 3814)
- [x] Housekeeping (Port 3826)
- [x] Pre-Arrival (Port 3828)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prepare` | Prepare room |
| GET | `/api/prepare/:prepId` | Get preparation |
| GET | `/api/prepare/guest/:guestId` | Guest preparations |
| GET | `/api/prepare/room/:roomId` | Room preparations |
| POST | `/api/story/prepare-sarah` | Story simulation |

---

## Quick Start

```bash
cd room-preparation-service
npm install
npm run dev
```

---

## Story Coverage

| Chapter | Description | Status |
|---------|------------|--------|
| Ch 4 | Sarah arrives, room ready | ✅ Working |
| Ch 17 | Memory retrieval | ✅ Working |

---

**Last Updated:** June 14, 2026
