# Karma Foundation - karma-web

> **Tagline:** "Impact, Trust & Community Good"
> **Purpose:** Consumer-facing web app for social impact tracking

---

## Company

**Name:** Karma Foundation
**Git Repo:** `karma-foundation/karma-web`
**Framework:** Next.js 14 (App Router)

---

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui components

---

## Quick Start

```bash
cd karma-web
npm install
npm run dev
```

---

## Project Structure

```
karma-web/
├── src/
│   ├── app/
│   │   ├── karma/               # Consumer routes
│   │   │   ├── home/            # Dashboard
│   │   │   ├── my-karma/       # Karma passport
│   │   │   ├── explore/        # Event discovery
│   │   │   ├── event/[id]/     # Event detail
│   │   │   ├── missions/        # Missions
│   │   │   ├── micro-actions/  # Quick actions
│   │   │   ├── leaderboard/    # Rankings
│   │   │   ├── wallet/         # Karma coins
│   │   │   ├── scan/           # QR scanner
│   │   │   └── communities/    # Cause communities
│   │   └── admin/              # Admin routes
│   ├── components/
│   │   └── ui/                 # shadcn/ui
│   └── lib/
│       └── karmaApi.ts         # API client
└── package.json
```

---

## Pages

### Consumer (11 pages)

| Page | Route | Description |
|------|-------|-------------|
| Home | `/karma/home` | Dashboard with karma overview |
| My Karma | `/karma/my-karma` | Passport & earn history |
| Explore | `/karma/explore` | Event discovery |
| Event Detail | `/karma/event/[id]` | Event information |
| Missions | `/karma/missions` | Available missions |
| Micro Actions | `/karma/micro-actions` | Daily quick actions |
| Leaderboard | `/karma/leaderboard` | Rankings |
| Wallet | `/karma/wallet` | Karma coins balance |
| Communities | `/karma/communities` | Cause communities |
| Community | `/karma/communities/[slug]` | Community detail |
| Lost Items | `/karma/lost-items` | Lost & found |

### Admin (4 pages)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/karma/corp` | Corporate hub |
| Wallet | `/karma/corp/wallet` | CSR wallet |
| Benefits | `/karma/corp/benefits` | Employee benefits |
| Hotels | `/karma/corp/hotels` | Partner hotels |

---

## Environment Variables

```env
NEXT_PUBLIC_API_URL=https://karma-foundation-api.onrender.com
NEXT_PUBLIC_AUTH_URL=https://rez-auth-service.onrender.com
```

---

## Brand Identity

| Element | Value |
|---------|-------|
| **Primary** | `#22C55E` Fresh Green |
| **Secondary** | `#FACC15` Warm Gold |
| **Trust** | `#3B82F6` Sky Blue |
| **Tagline** | "Impact, Trust & Community Good" |

---

## Security

- ✅ AES-GCM token encryption
- ✅ SHA-256 token hashing
- ✅ CSRF protection (Next.js built-in)
- ✅ Helmet security headers

### Audit Findings (To Fix)
- ❌ `navigator.userAgent` in key derivation
- ❌ No CSP headers
- ❌ No rate limiting

---

## API Integration

Calls `karma-service` at:
```
https://karma-foundation-api.onrender.com
```

Endpoints:
- `/api/karma/user/:userId` - Profile
- `/api/karma/verify/checkin` - Check-in
- `/api/karma/verify/checkout` - Check-out
- `/api/karma/leaderboard` - Rankings
- `/api/karma/communities` - Communities

---

## Related Services

| Service | Purpose |
|---------|---------|
| karma-service | Backend API |
| karma-mobile | Mobile app |
| karma-loyalty-bridge | Coin conversion |

---

## Social Programs

| Program | Description |
|---------|-------------|
| Education | School support, tutoring |
| Healthcare | Medical camps, awareness |
| Environment | Tree planting, cleanup |
| Community Welfare | Local initiatives |
| Disaster Relief | Emergency response |
| Women Empowerment | Skills training |
| Food Donation | Meal programs |
| Sustainability | Green initiatives |

---

**Last Updated:** May 27, 2026
