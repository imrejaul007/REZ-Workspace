# REZ Gamification Service

**Version:** 1.0
**Date:** May 11, 2026

---

## Overview

Gamification microservice handling coins, streaks, achievements, and leaderboards for the ReZ ecosystem.

---

## Features

| Feature | Description |
|---------|-------------|
| Coins | Manage multiple coin types (REZ, BRANDED, CASHBACK, etc.) |
| Streaks | Track user activity streaks |
| Achievements | Badge and achievement system |
| Leaderboards | Real-time leaderboard rankings |
| Points System | Configurable points and rewards |

---

## Coin Types

| Coin | Expiry |
|------|--------|
| REZ | Never |
| BRANDED | 180 days |
| CASHBACK | 365 days |
| PROMO | 90 days |
| PRIVE | 365 days |
| REFERRAL | 180 days |

---

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Production build
npm run build

# Start production
npm start

# Run tests
npm test
```

---

## Environment Variables

```bash
PORT=3005
NODE_ENV=development
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017/rez-gamification
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/coins` | GET/POST | Manage coins |
| `/api/streaks` | GET/POST | Track streaks |
| `/api/achievements` | GET/POST | Manage achievements |
| `/api/leaderboard` | GET | Get leaderboard |
| `/api/points` | GET/POST | Manage points |
| `/health` | GET | Health check |

---

## Deployment

### Render

```
1. Connect GitHub repo
2. Add env vars
3. Deploy
```

---

**Built for scale, designed for growth.**
