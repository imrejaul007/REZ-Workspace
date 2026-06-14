# karma-mobile - Features & Screens

**Package:** karma-mobile  
**Framework:** Expo (React Native)  
**Purpose:** Mobile app for on-the-go karma tracking  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Screens Overview](#1-screens-overview)
2. [Screen Details](#2-screen-details)
3. [Services](#3-services)
4. [Components](#4-components)
5. [API Integration](#5-api-integration)
6. [Authentication](#6-authentication)
7. [Environment Configuration](#7-environment-configuration)
8. [Build & Deployment](#8-build--deployment)
9. [Security Features](#9-security-features)

---

## 1. Screens Overview

### Consumer Screens

| Screen | Route | Purpose | Status |
|--------|-------|---------|--------|
| Login | `/login` | Authentication | ✅ |
| Home | `/karma/home` | Main hub | ✅ |
| My Karma | `/karma/my-karma` | Passport & history | ✅ |
| Explore | `/karma/explore` | Event listing | ✅ |
| Event Detail | `/karma/event/[id]` | Event info | ✅ |
| Missions | `/karma/missions` | Challenges | ✅ |
| Micro Actions | `/karma/micro-actions` | Quick actions | ✅ |
| Leaderboard | `/karma/leaderboard` | Rankings | ✅ |
| Wallet | `/karma/wallet` | Balance | ✅ |
| QR Scan | `/karma/scan` | Scanner | ✅ |
| Communities | `/karma/communities` | List | ✅ |
| Community Detail | `/karma/communities/[slug]` | Detail | ✅ |

### Admin Screens

| Screen | Route | Purpose | Status |
|--------|-------|---------|--------|
| Dashboard | `/admin` | Admin hub | ✅ |
| Karma Score | `/admin/karma-score` | Score admin | ✅ |
| Perks | `/admin/perks` | Perk management | ✅ |

---

## 2. Screen Details

### Login (`/login`)

**Purpose:** User authentication

**Features:**
- Email/password login
- Biometric authentication (fingerprint/face)
- Social login options
- Forgot password
- Sign up link

**Components:**
- Logo header
- Email input
- Password input
- Login button
- Biometric button
- Forgot password link
- Sign up link

**API Calls:**
- `POST /api/auth/login`
- `POST /api/auth/biometric`

---

### Home (`/karma/home`)

**Purpose:** Main dashboard

**Features:**
- Karma score display
- Level progress
- Recent activity
- Quick actions
- Upcoming events
- Leaderboard preview

**Components:**
- KarmaCard
- LevelProgress
- ActivityFeed
- QuickActions
- EventsCarousel
- LeaderboardPreview

**API Calls:**
- `GET /api/karma/user/:userId`
- `GET /api/karma/score`
- `GET /api/karma/events?limit=5`

---

### My Karma (`/karma/my-karma`)

**Purpose:** Personal karma passport

**Features:**
- Karma passport view
- Trust score gauge
- Earn history
- Level progress
- Badges display
- Impact resume

**Components:**
- PassportCard
- TrustGauge
- HistoryList
- LevelProgress
- BadgesGrid
- ImpactResumeButton

**API Calls:**
- `GET /api/karma/user/:userId`
- `GET /api/karma/user/:userId/level`
- `GET /api/karma/user/:userId/history`
- `GET /api/karma/badges/my`

---

### Explore (`/karma/explore`)

**Purpose:** Discover events

**Features:**
- Search events
- Filter by category
- Filter by date
- Filter by distance
- Map view
- List view toggle

**Components:**
- SearchBar
- CategoryTabs
- DateFilter
- DistanceFilter
- EventList
- MapView

**API Calls:**
- `GET /api/karma/events`
- `GET /api/karma/events/nearby`

---

### Event Detail (`/karma/event/[id]`)

**Purpose:** Event information

**Features:**
- Event details
- Location map
- Join event
- Leave event
- Share event
- View participants

**Components:**
- EventHeader
- EventInfo
- LocationMap
- JoinButton
- ShareButton
- ParticipantsList

**API Calls:**
- `GET /api/karma/events/:id`
- `POST /api/karma/event/join`
- `DELETE /api/karma/event/:id/leave`

---

### Missions (`/karma/missions`)

**Purpose:** Daily and weekly challenges

**Features:**
- Active missions
- Mission progress
- Mission categories
- Completion rewards
- Streak display

**Components:**
- MissionCard
- ProgressIndicator
- CategoryTabs
- StreakCounter
- RewardPreview

**API Calls:**
- `GET /api/karma/missions`
- `POST /api/karma/missions/:id/complete`

---

### Micro Actions (`/karma/micro-actions`)

**Purpose:** Quick daily actions

**Features:**
- Daily actions list
- Quick claim
- Points preview
- Action history

**Components:**
- ActionCard
- ClaimButton
- PointsPreview
- HistoryList

**API Calls:**
- `GET /api/karma/micro-actions`
- `POST /api/karma/micro-actions/claim`

---

### Leaderboard (`/karma/leaderboard`)

**Purpose:** Rankings

**Features:**
- Top rankings
- User rank
- Period filter
- Refresh

**Components:**
- PodiumDisplay
- RankingList
- PeriodFilter
- UserRankCard

**API Calls:**
- `GET /api/karma/leaderboard`
- `GET /api/karma/leaderboard/me`

---

### Wallet (`/karma/wallet`)

**Purpose:** Karma coins

**Features:**
- Balance display
- Transaction history
- Convert karma
- Redeem coins

**Components:**
- BalanceCard
- TransactionList
- ConvertButton
- RedeemButton

**API Calls:**
- `GET /api/karma/wallet/balance`
- `GET /api/karma/wallet/transactions`

---

### QR Scan (`/karma/scan`)

**Purpose:** QR code scanner

**Features:**
- Camera scanner
- QR code validation
- Check-in confirmation
- Auto check-out

**Components:**
- CameraView
- QRScanner
- ConfirmDialog
- SuccessAnimation

**API Calls:**
- `POST /api/karma/verify/checkin`
- `POST /api/karma/verify/checkout`

---

### Communities (`/karma/communities`)

**Purpose:** Cause communities

**Features:**
- Community list
- Category filter
- Search
- Join/Leave

**Components:**
- CommunityList
- CategoryFilter
- SearchBar
- JoinButton

**API Calls:**
- `GET /api/karma/communities`
- `POST /api/karma/communities/:slug/follow`

---

### Community Detail (`/karma/communities/[slug]`)

**Purpose:** Community feed

**Features:**
- Community info
- Posts feed
- Create post
- Members list

**Components:**
- CommunityHeader
- PostFeed
- CreatePostButton
- MembersList

**API Calls:**
- `GET /api/karma/communities/:slug`
- `GET /api/karma/communities/:slug/feed`
- `POST /api/karma/communities/:slug/posts`

---

### Admin Dashboard (`/admin`)

**Purpose:** Admin hub

**Features:**
- Overview stats
- Event management
- Booking approvals
- Leaderboard data
- CSR info
- Community management

**Components:**
- StatsCards
- EventManager
- BookingApprovals
- LeaderboardData
- CSRDashboard
- CommunityManager

**Security:** Requires admin role

---

### Admin Karma Score (`/admin/karma-score`)

**Purpose:** Karma score administration

**Features:**
- Score lookup
- Score adjustment
- Score history
- Bulk operations

**Components:**
- UserSearch
- ScoreCard
- AdjustmentForm
- HistoryList

**Security:** Requires admin role

---

### Admin Perks (`/admin/perks`)

**Purpose:** Perk management

**Features:**
- Perk list
- Create perk
- Edit perk
- Claim monitoring

**Components:**
- PerkList
- CreatePerkForm
- EditPerkForm
- ClaimStats

**Security:** Requires admin role

---

## 3. Services

### API Client Services

| Service | Purpose | Status |
|---------|---------|--------|
| apiClient | HTTP requests | ✅ |
| karmaService | Karma operations | ✅ |
| authContext | Authentication | ✅ |
| cache | Offline caching | ✅ |

---

## 4. Components

### Core Components

| Component | Purpose | Status |
|-----------|---------|--------|
| KarmaCard | Display karma score | ✅ |
| LevelBadge | Show level indicator | ✅ |
| TrustGauge | Trust score visualization | ✅ |
| EventCard | Event listing card | ✅ |
| MissionCard | Mission display | ✅ |
| LeaderboardRow | Ranking entry | ✅ |
| CommunityCard | Community preview | ✅ |
| CoinBalance | Coin display | ✅ |
| ProgressBar | Level progress | ✅ |
| ActivityFeed | Recent activity | ✅ |
| BadgeGrid | Achievement badges | ✅ |
| TransactionList | Wallet transactions | ✅ |

---

## 5. API Integration

### API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/api/karma/user/:userId` | User profile |
| `/api/karma/score` | Karma score |
| `/api/karma/events` | Events listing |
| `/api/karma/leaderboard` | Rankings |
| `/api/karma/communities` | Communities |
| `/api/karma/wallet/*` | Wallet operations |
| `/api/karma/verify/*` | Check-in/out |

---

## 6. Authentication

### Auth Flow

1. User enters credentials
2. Authenticate with RABTUL Auth
3. Receive JWT token
4. Store token securely in SecureStore
5. Optional biometric for subsequent logins

### Biometric Support

- Fingerprint authentication
- Face ID recognition
- Fallback to password

---

## 7. Environment Configuration

### app.json extra

```json
{
  "extra": {
    "apiUrl": "https://karma-foundation-api.onrender.com/v1/karma",
    "authUrl": "https://rez-auth-service.onrender.com"
  }
}
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| EXPO_PUBLIC_API_URL | Yes | Karma API URL |
| EXPO_PUBLIC_AUTH_URL | Yes | Auth service URL |

---

## 8. Build & Deployment

### Android

| Profile | Command | Status |
|---------|---------|--------|
| Development | `eas build --platform android` | ✅ |
| Preview | `eas build --platform android --profile preview` | ✅ |
| Production | `eas build --platform android --profile production` | ✅ |

### iOS

| Profile | Command | Status |
|---------|---------|--------|
| Development | `eas build --platform ios` | ✅ |
| Preview | `eas build --platform ios --profile preview` | ✅ |
| Production | `eas build --platform ios --profile production` | ✅ |

### EAS Build Configuration

```json
// eas.json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## 9. Security Features

| Feature | Status | Description |
|---------|--------|-------------|
| Secure Storage | ✅ | expo-secure-store |
| Biometric Auth | ✅ | Fingerprint/Face |
| Admin Guard | ✅ | Role verification |
| HTTPS Only | ✅ | SSL enforced |
| Token Encryption | ✅ | AES encryption |
| Offline Security | ✅ | Encrypted cache |

---

## Offline Support

| Feature | Status | Description |
|---------|--------|-------------|
| Request Queue | ✅ | Queue requests when offline |
| Cache | ✅ | Cache responses |
| Retry | ✅ | Retry failed requests |

---

## Quick Start

```bash
# Install dependencies
npm install

# Start Expo
npx expo start

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

---

## File Structure

```
karma-mobile/
├── app/
│   ├── _layout.tsx
│   ├── login/
│   ├── karma/
│   │   ├── home/
│   │   ├── explore/
│   │   ├── missions/
│   │   ├── leaderboard/
│   │   ├── wallet/
│   │   ├── scan/
│   │   ├── communities/
│   │   ├── event/[id]/
│   │   └── my-karma/
│   └── admin/
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── karma-score.tsx
│       └── perks.tsx
├── services/
│   ├── apiClient.ts
│   ├── karmaService.ts
│   ├── authContext.tsx
│   └── cache.ts
├── components/
├── constants/
│   └── theme.ts
├── package.json
├── app.json
└── eas.json
```

---

**Last Updated:** June 12, 2026