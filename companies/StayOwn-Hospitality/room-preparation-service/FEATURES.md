# Room Preparation Service - Features

**Company:** StayOwn-Hospitality
**Type:** Orchestration Service
**Port:** 4901
**Status:** ✅ Built

---

## Core Features

### 1. Guest Preferences
- [x] Fetch from Memory Service
- [x] Temperature: 22°C
- [x] Pillow type: soft
- [x] Water: sparkling
- [x] Breakfast: healthy
- [x] Dietary restrictions
- [x] Special requests

### 2. Room Setup
- [x] Temperature control
- [x] Minibar preparation
- [x] Amenities configuration
- [x] Breakfast scheduling
- [x] Housekeeping queue

### 3. Integration
- [x] Memory → Preferences
- [x] Room Twin → Updates
- [x] Smart Lock → Access
- [x] Room Controls → Settings
- [x] Housekeeping → Tasks

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prepare` | Prepare room |
| GET | `/api/prepare/:prepId` | Get status |
| GET | `/api/prepare/guest/:guestId` | Guest history |
| GET | `/api/prepare/room/:roomId` | Room history |
| POST | `/api/story/prepare-sarah` | Story simulation |

---

## Story Coverage

| Chapter | Description | Status |
|---------|------------|--------|
| Ch 4 | Room ready for Sarah | ✅ |
| Ch 17 | Memory retrieval | ✅ |

---

**Last Updated:** June 14, 2026
