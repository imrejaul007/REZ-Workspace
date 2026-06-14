# Karma by ReZ - Web App

Consumer-facing web app for the Karma gamification feature - social impact tracking for charitable giving and social good initiatives.

**Version**: 1.0.0 | **Last Updated**: May 2026

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | TailwindCSS |
| **State** | React Context + Hooks |
| **Auth** | JWT with ReZ Auth Service |

---

## Pages & Routes

### Consumer Routes (`/karma/*`)

| Route | Description |
|-------|-------------|
| `/karma/home` | Main hub with karma overview |
| `/karma/my-karma` | Karma passport & earn history |
| `/karma/explore` | Event listing & discovery |
| `/karma/event/[id]` | Event detail page |
| `/karma/missions` | Available missions |
| `/karma/micro-actions` | Quick micro actions |
| `/karma/leaderboard` | Community rankings |
| `/karma/wallet` | Karma wallet balance |
| `/karma/scan` | QR code scanner |
| `/karma/communities` | Community list |
| `/karma/communities/[slug]` | Community detail |

### Admin Routes (`/admin/*`)

| Route | Description |
|-------|-------------|
| `/admin` | Admin dashboard |
| `/admin/karma-score` | KarmaScore administration |
| `/admin/perks` | Perk management |

---

## Build & Run

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Type check
npm run type-check
```

---

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://rez-karma-service.onrender.com
NEXT_PUBLIC_AUTH_URL=https://rez-auth-service.onrender.com
```

---

## Key Features

- **Karma Tracking**: Earn karma points for social good actions
- **Event Discovery**: Browse and join impact initiatives
- **QR Verification**: Check-in/check-out via QR scanning
- **Leaderboard**: Community rankings and competition
- **Missions**: Structured social impact challenges
- **Wallet**: View karma balance and history

---

## Brand Identity

> **"Do Good. Get Rewarded."**

| Element | Value |
|---------|-------|
| Primary (Impact) | `#22C55E` Fresh Green |
| Secondary (Reward) | `#FACC15` Warm Gold |
| Trust | `#3B82F6` Sky Blue |

---

## Related Services

- **rez-karma-service** - Backend microservice (port 3009)
- **rez-auth-service** - Authentication
- **rez-wallet-service** - Wallet/balance management

---

## License

MIT
