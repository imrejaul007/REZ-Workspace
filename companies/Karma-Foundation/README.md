# Karma Foundation

> **Tagline:** "Impact, Trust & Community Good"
> **Positioning:** "India's Premier Social Impact & NGO Ecosystem"

---

## Company Overview

**Purpose:** Social impact and NGO ecosystem enabling:
- Volunteer engagement and tracking
- Karma point gamification
- NGO partnerships and programs
- ESG compliance tracking
- Community welfare initiatives

---

## Quick Start

```bash
# Backend
cd karma-service && npm install && npm run build && npm start

# Web App
cd karma-web && npm install && npm run dev

# Mobile App
cd karma-mobile && npm install && npx expo start

# Loyalty Bridge
cd karma-loyalty-bridge && npm install && npm start
```

---

## Components

| Component | Port | Tech Stack | Purpose |
|-----------|------|------------|---------|
| **karma-service** | 3009 | Node.js, Express, MongoDB | Backend API |
| **karma-web** | 3000 | Next.js 14 | Consumer web app |
| **karma-mobile** | - | Expo (React Native) | Mobile app |
| **karma-loyalty-bridge** | 4098 | Node.js, Express | Coin conversion |

---

## Social Programs (13.1)

| Program | Description |
|---------|-------------|
| **Education** | School support, tutoring, scholarships |
| **Healthcare** | Medical camps, health awareness |
| **Environment** | Tree planting, cleanup drives, sustainability |
| **Community Welfare** | Local community support initiatives |
| **Disaster Relief** | Emergency response and relief operations |
| **Women Empowerment** | Skills training, support programs |
| **Food Donation** | Food drives, meal programs |
| **Sustainability** | Green initiatives, eco-programs |

---

## Karma Systems (13.2)

| System | Purpose |
|--------|---------|
| **Karma Points** | Gamified impact scoring |
| **Volunteer Systems** | Event participation tracking |
| **Mission Systems** | Challenges and goals |
| **NGO Partnerships** | Corporate social responsibility |
| **Social Trust** | Verification and trust scores |
| **ESG Programs** | Environmental, Social, Governance tracking |

---

## Level System

| Level | Active Karma | Conversion Rate |
|-------|-------------|-----------------|
| L1 | 0-999 | 25% |
| L2 | 1000-2999 | 50% |
| L3 | 3000-5999 | 75% |
| L4 | 6000+ | 100% |

---

## Brand Identity

| Element | Value |
|---------|-------|
| **Primary Color** | `#22C55E` Fresh Green |
| **Secondary Color** | `#FACC15` Warm Gold |
| **Trust Color** | `#3B82F6` Sky Blue |

---

## Git Repository

**Remote:** `github.com/imrejaul007/Karma-Foundation`
**Company:** Karma Foundation
**Purpose:** Social impact and NGO ecosystem

---

## Documentation

| Document | Purpose |
|----------|---------|
| [CLAUDE.md](CLAUDE.md) | Development guide |
| [SPEC.md](SPEC.md) | Technical specification |
| [karma-service/CLAUDE.md](karma-service/CLAUDE.md) | Service docs |
| [karma-web/CLAUDE.md](karma-web/CLAUDE.md) | Web app docs |
| [karma-mobile/CLAUDE.md](karma-mobile/CLAUDE.md) | Mobile app docs |
| [karma-loyalty-bridge/SPEC.md](karma-loyalty-bridge/SPEC.md) | Bridge docs |

---

## Environment Setup

### karma-service
```env
PORT=3009
MONGODB_URI=mongodb://localhost:27017/karma_foundation
REDIS_URL=redis://localhost:6379
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
JWT_SECRET=<min-32-chars>
INTERNAL_SERVICE_TOKEN=<secret>
QR_SECRET=<hmac-secret>
SENTRY_DSN=<sentry-key>
```

### karma-loyalty-bridge
```env
PORT=4098
MONGODB_URI=mongodb://localhost:27017/karma_loyalty
RABTUL_URL=http://localhost:4004
KARMA_URL=http://localhost:3009
```

---

## Related Companies

| Company | Relationship |
|---------|--------------|
| **RABTUL Technologies** | Infrastructure provider (Auth, Wallet, Payments) |
| **REZ-Intelligence** | AI/ML services |
| **REZ-Consumer** | Consumer app integration |

---

## Last Updated

**May 27, 2026**
