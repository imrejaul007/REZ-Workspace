# Karma Foundation - karma-mobile

> **Tagline:** "Impact, Trust & Community Good"
> **Purpose:** Mobile app for social impact tracking on-the-go

---

## Company

**Name:** Karma Foundation
**Git Repo:** `karma-foundation/karma-mobile`
**Framework:** Expo (React Native)

---

## Tech Stack

- Expo (React Native)
- TypeScript
- React Navigation
- Expo Secure Store

---

## Quick Start

```bash
cd karma-mobile
npm install
npx expo start
```

---

## Project Structure

```
karma-mobile/
├── app/
│   ├── _layout.tsx          # Root layout
│   ├── index.tsx            # Redirect to karma
│   ├── login.tsx            # Authentication
│   ├── karma/               # Karma routes
│   │   ├── home.tsx        # Dashboard
│   │   ├── my-karma.tsx    # Karma passport
│   │   ├── explore.tsx     # Event listing
│   │   ├── event/[id].tsx  # Event detail
│   │   ├── missions.tsx    # Missions
│   │   ├── micro-actions.tsx # Quick actions
│   │   ├── leaderboard.tsx # Rankings
│   │   ├── wallet.tsx      # Balance
│   │   ├── scan.tsx        # QR scanner
│   │   ├── communities.tsx  # List
│   │   └── communities/[slug].tsx # Detail
│   └── admin/               # Admin screens
│       ├── index.tsx       # Dashboard
│       ├── karma-score.tsx # Score admin
│       └── perks.tsx       # Perk management
├── services/
│   ├── karmaService.ts     # API calls
│   ├── apiClient.ts       # Axios client
│   ├── authContext.tsx    # Auth state
│   └── cache.ts           # Offline support
└── app.json
```

---

## Screens

### Consumer (11 screens)

| Screen | Route | Description |
|--------|-------|-------------|
| Login | `/login` | Authentication |
| Home | `/karma/home` | Main hub |
| My Karma | `/karma/my-karma` | Passport & history |
| Explore | `/karma/explore` | Event listing |
| Event Detail | `/karma/event/[id]` | Event info |
| Missions | `/karma/missions` | Challenges |
| Micro Actions | `/karma/micro-actions` | Quick actions |
| Leaderboard | `/karma/leaderboard` | Rankings |
| Wallet | `/karma/wallet` | Balance |
| QR Scan | `/karma/scan` | Scanner |
| Communities | `/karma/communities` | List |

### Admin (3 screens)

| Screen | Route | Description |
|--------|-------|-------------|
| Dashboard | `/admin` | Admin hub |
| Karma Score | `/admin/karma-score` | Score admin |
| Perks | `/admin/perks` | Perk management |

---

## Environment Variables

```env
API_URL=https://karma-foundation-api.onrender.com
AUTH_URL=https://rez-auth-service.onrender.com
```

---

## Brand Identity

| Element | Value |
|---------|-------|
| **Primary** | `#22C55E` Fresh Green |
| **Secondary** | `#FACC15` Warm Gold |
| **Trust** | `#3B82F6` Sky Blue |
| **Tagline** | "Impact, Trust & Community Good" |

### iOS
- **Bundle ID:** `com.karma.foundation`

### Android
- **Package:** `com.karma.foundation`
- **Scheme:** `karmafoundation`

---

## Security

- ✅ Biometric auth support
- ✅ Offline queue with retry
- ✅ API response caching
- ✅ Sentry crash reporting

### Audit Findings (To Fix)
- ❌ Tokens in AsyncStorage → Secure Store
- ❌ No biometric lock
- ❌ No certificate pinning

---

## API Integration

Calls `karma-service` at:
```
https://karma-foundation-api.onrender.com
```

---

## Related Services

| Service | Purpose |
|---------|---------|
| karma-service | Backend API |
| karma-web | Web app |
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
