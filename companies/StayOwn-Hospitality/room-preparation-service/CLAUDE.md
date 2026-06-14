# CLAUDE.md - Room Preparation Service

## Project Overview

**Name:** Room Preparation Service
**Company:** StayOwn-Hospitality
**Type:** Orchestration Service
**Port:** 4901
**Status:** ✅ Built (June 14, 2026)

## Description

Connects Memory → Room Twin → Room Ready for personalized guest experience.

## Tech Stack

- Node.js 18+
- Express.js
- TypeScript
- Axios

## Services Connected

| Service | Port |
|---------|------|
| Memory Service | 4520 |
| Room Twin | 8447 |
| Smart Lock | 3825 |
| Room Controls | 3814 |
| Housekeeping | 3826 |
| Pre-Arrival | 3828 |

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server (port 4901) |
| `npm run build` | Build for production |
| `npm start` | Production server |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prepare` | Prepare room for guest |
| GET | `/api/prepare/:prepId` | Get preparation status |
| GET | `/api/prepare/guest/:guestId` | Guest preparations |
| GET | `/api/prepare/room/:roomId` | Room preparations |
| POST | `/api/story/prepare-sarah` | Chapter 4 simulation |

## File Structure

```
room-preparation-service/
├── src/
│   └── index.ts           # Main server
├── package.json
├── tsconfig.json
├── README.md
└── CLAUDE.md
```

## Story Coverage

| Chapter | Description | Status |
|---------|------------|--------|
| Ch 4 | Sarah arrives, room ready | ✅ Working |
| Ch 17 | Memory retrieval | ✅ Working |

---

**Last Updated:** June 14, 2026
