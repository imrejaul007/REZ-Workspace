# Do App - Complete Specification

**Version:** 3.0.0
**Last Updated:** May 13, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [App Structure](#app-structure)
4. [Features](#features)
5. [Screens](#screens)
6. [Services](#services)
7. [API Routes](#api-routes)
8. [REZ Mind Integration](#rez-mind-integration)
9. [Environment Variables](#environment-variables)
10. [Setup & Running](#setup--running)

---

## Overview

**Do App** is an AI-powered conversational commerce app for the ReZ ecosystem. Users can discover venues, book experiences, and manage their wallet through a chat-first interface with personalized recommendations.

### Key Capabilities
- Natural language booking through chat
- Personalized style-based recommendations
- Multi-venue discovery (restaurants, spas, events, etc.)
- Wallet with coins and karma rewards
- Real-time notifications
- Dormancy detection and revival

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Expo (React Native) |
| **Navigation** | Expo Router |
| **State** | Zustand, React Query |
| **Animations** | Moti, Lottie, Reanimated |
| **Styling** | StyleSheet + Linear Gradient |
| **Backend** | Node.js/Express |
| **Real-time** | WebSocket (ws) |
| **Push** | Expo Notifications |
| **Images** | expo-image-picker |

---

## App Structure

```
REZ-Consumer/do-app/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx               # Redirects to tabs or chat
│   ├── onboarding/
│   │   └── index.tsx           # Onboarding with style prefs
│   ├── auth/
│   │   └── index.tsx           # Auth flow
│   ├── (tabs)/
│   │   └── _layout.tsx         # Tab navigator
│   ├── booking/[id].tsx        # Booking detail
│   ├── complaints/
│   │   └── index.tsx           # Complaints list
│   ├── refunds/
│   │   └── index.tsx           # Refunds list
│   └── settings/
│       ├── notifications.tsx    # Notification preferences
│       ├── addresses.tsx       # Address management
│       └── edit-profile.tsx     # Profile editor
│
├── src/
│   ├── components/
│   │   ├── chat/              # Chat UI components
│   │   ├── explore/            # Explore components
│   │   ├── wallet/            # Wallet components
│   │   ├── auth/              # Auth components
│   │   ├── NudgeBanner.tsx     # Real-time nudges
│   │   └── AgentInsights.tsx  # AI scores display
│   │
│   ├── screens/
│   │   ├── ChatScreen.tsx
│   │   ├── ExploreScreen.tsx
│   │   ├── WalletScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── BookingDetailScreen.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useReZMind.ts       # REZ Mind integration hooks
│   │
│   ├── services/
│   │   ├── rezApi.ts           # Main API client
│   │   ├── rezMindService.ts    # REZ Mind client
│   │   ├── eventTracking.ts     # Event capture
│   │   ├── agentOrchestrator.ts # Agent OS client
│   │   ├── nudgeEngine.ts       # Real-time nudges
│   │   ├── attributionTracking.ts # Attribution
│   │   ├── websocketService.ts  # WebSocket client
│   │   ├── avatarService.ts     # Avatar upload
│   │   └── notifications.ts      # Push notifications
│   │
│   ├── stores/
│   │   └── index.ts             # Zustand stores
│   │
│   └── theme/
│       └── ThemeProvider.tsx      # Theme system
│
└── do-backend/                  # Express backend
    └── src/
        ├── api/routes/           # API endpoints
        ├── middleware/           # Auth, rate limiting
        ├── services/             # Business logic
        ├── integrations/         # ReZ service clients
        └── utils/               # Config, logging
```

---

## Features

### 1. Authentication
- [x] Phone + OTP verification
- [x] JWT token management
- [x] Token refresh
- [x] Session persistence

### 2. Chat Interface
- [x] Natural language booking
- [x] Style Advisor mode
- [x] Quick actions
- [x] Message bubbles
- [x] Entity cards
- [x] Reward cards
- [x] Typing indicators
- [x] Location-aware suggestions

### 3. Discovery
- [x] Venue search
- [x] Trending venues
- [x] Nearby venues
- [x] Mood-based discovery
- [x] For You personalized section
- [x] Category browsing
- [x] Trend predictions

### 4. Booking
- [x] View booking details
- [x] QR code display
- [x] Share booking
- [x] Cancel booking
- [x] Get directions
- [x] Call venue
- [x] Add to calendar
- [x] Reschedule flow

### 5. Wallet
- [x] Coin balance display
- [x] Karma tier badge
- [x] Transaction history
- [x] Earn/Spend quick actions
- [x] Loyalty benefits display

### 6. Style Preferences
- [x] Vibe selection (casual, formal, trendy, etc.)
- [x] Occasion selection (date, party, office, etc.)
- [x] Cuisine preferences (indian, chinese, etc.)
- [x] Persistent storage

### 7. Settings
- [x] Notification preferences
- [x] Address management
- [x] Profile editing
- [x] Avatar upload
- [x] Haptic feedback toggle
- [x] Sound effects toggle

### 8. REZ Mind Integration
- [x] Intent capture (all events)
- [x] Dormancy detection
- [x] Automated revival
- [x] ML recommendations
- [x] Behavioral profiling
- [x] Real-time nudges
- [x] Attribution tracking
- [x] Predictive scoring (churn, LTV)

---

## Screens

### Public Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Onboarding | `/onboarding` | Welcome + style preferences |
| Auth | `/auth` | Phone + OTP login |

### Tab Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Chat | `/(tabs)` or `/index` | Main chat interface |
| Explore | `/explore` | Venue discovery |
| Wallet | `/wallet` | Coins + karma |
| Profile | `/profile` | User profile |

### Detail Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Booking Detail | `/booking/[id]` | Full booking info + actions |
| Complaints | `/complaints` | View/create complaints |
| Refunds | `/refunds` | Refund requests |

### Settings Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Notifications | `/settings/notifications` | Push + in-app toggles |
| Addresses | `/settings/addresses` | Manage addresses |
| Edit Profile | `/settings/edit-profile` | Name, email, avatar |
| Avatar Upload | `/profile/avatar` | Photo picker |

---

## Services

### Frontend Services

| Service | Purpose |
|---------|---------|
| `rezApi.ts` | Main API client (Auth, Profile, Wallet, Bookings) |
| `rezMindService.ts` | REZ Mind API client |
| `eventTracking.ts` | Track all user events |
| `agentOrchestrator.ts` | Connect to 38 AI agents |
| `nudgeEngine.ts` | Generate real-time nudges |
| `attributionTracking.ts` | Track conversions |
| `websocketService.ts` | Real-time WebSocket |
| `avatarService.ts` | Image picker + upload |
| `notifications.ts` | Push notification handling |

### React Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Authentication state |
| `useReZMindSetup` | Initialize REZ Mind |
| `useIntentTracking` | Track user events |
| `useDormancyDetection` | Check dormancy status |
| `useRecommendations` | Get ML recommendations |
| `useBehavioralProfile` | Get user personality |
| `usePredictiveScoring` | Churn, LTV, probability |
| `useNudgeEngine` | Real-time nudges |
| `useAttribution` | Track conversions |
| `useAppLifecycle` | App open/close tracking |

### Backend Services

| Service | Purpose |
|---------|---------|
| `authService` | OTP generation/verification |
| `walletService` | Coin balance/transfer |
| `karmaService` | Loyalty tiers |
| `mockDiscovery` | Venue discovery |
| `mockBookings` | Booking management |
| `workflowEngine` | AI chat processing |
| `salesAgent` | Sales recommendations |
| `unifiedIntentDetector` | Intent classification |
| `complaintRefundHandler` | Complaints + refunds |

---

## API Routes

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/otp/send` | Public | Send OTP |
| POST | `/auth/otp/verify` | Public | Verify OTP |
| GET | `/auth/me` | JWT | Current user |
| POST | `/auth/logout` | JWT | Invalidate session |
| POST | `/auth/refresh` | Public | Refresh JWT |

### Chat

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/do/chat/message` | JWT | Send message |
| GET | `/do/chat/history` | JWT | Chat history |

### Discovery

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/discovery` | - | Search venues |
| GET | `/discovery/trending` | - | Trending |
| GET | `/discovery/trends` | - | AI predictions |
| GET | `/discovery/nearby` | - | Nearby |
| GET | `/discovery/mood/:mood` | - | Mood-based |

### Wallet

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/wallet` | JWT | Balance |
| GET | `/wallet/transactions` | JWT | History |
| POST | `/wallet/debit` | JWT | Spend coins |
| POST | `/wallet/credit` | JWT | Earn coins |
| GET | `/wallet/karma` | JWT | Karma status |
| GET | `/wallet/karma/achievements` | JWT | Badges |

### Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/bookings` | JWT | List bookings |
| GET | `/bookings/:id` | JWT | Booking detail |
| POST | `/bookings` | JWT | Create booking |
| DELETE | `/bookings/:id` | JWT | Cancel booking |

### Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile` | JWT | Full profile |
| PATCH | `/profile/preferences` | JWT | Update prefs |
| GET | `/profile/style-preferences` | JWT | Get styles |
| PATCH | `/profile/style-preferences` | JWT | Update styles |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/notifications/register-token` | JWT | Push token |
| DELETE | `/notifications/unregister-token` | JWT | Remove token |
| GET | `/notifications/preferences` | JWT | Get prefs |
| PATCH | `/notifications/preferences` | JWT | Update prefs |

### Complaints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/do/complaints` | JWT | List |
| GET | `/do/complaints/:id` | JWT | Detail |
| POST | `/do/complaints` | JWT | Create |
| DELETE | `/do/complaints/:id` | JWT | Close |

---

## REZ Mind Integration

### Connected Services

| Service | URL | Purpose |
|---------|-----|---------|
| Intent Graph | `rez-intent-graph.onrender.com` | Intent capture, ML scoring |
| User Intelligence | `REZ-user-intelligence.onrender.com` | Behavioral profiles |
| Agent Orchestrator | `rez-agent-orchestrator.onrender.com` | 38 AI agents |
| Campaign Service | `rez-campaign-service.onrender.com` | Push/communications |

### Events Tracked

| Event | Trigger |
|-------|---------|
| `chat_message` | User sends message |
| `discovery_view_entity` | User views venue |
| `discovery_save_entity` | User saves venue |
| `discovery_search` | User searches |
| `booking_start` | User starts booking |
| `booking_completed` | Booking confirmed |
| `booking_cancelled` | Booking cancelled |
| `payment_success` | Payment completed |
| `wallet_transaction` | Wallet change |
| `profile_view` | User views profile |
| `style_preferences_set` | Preferences saved |
| `onboarding_complete` | Onboarding done |
| `app_open` | App starts |
| `app_close` | App closes |

### AI Agents Connected (38 total)

**User Intelligence (15):**
- PersonalizationAgent, SegmentClassifierAgent, RecommendationQualityAgent
- EngagementScoreAgent, SessionAnalyzerAgent, SearchIntentAgent
- BrowsePatternAgent, PurchasePredictorAgent, AbandonmentDetectorAgent
- RetentionTriggerAgent, WinBackAgent, ReferralPotentialAgent
- SurveyTriggerAgent, FeedbackAnalyzerAgent, NPSPredictorAgent

**Commerce (15):**
- DemandSignalAgent, ScarcityAgent, PriceElasticityAgent
- ReorderPredictorAgent, TasteEvolutionAgent, ChurnRiskAgent
- LTVPredictorAgent, InventoryAlertAgent, DemandForecastAgent
- CompetitorMonitorAgent, TrendDetectorAgent, PriceOptimizerAgent
- OfferMatcherAgent, CrossSellAgent, UrgencyTriggerAgent

**Autonomous (8):**
- DemandSignal, Scarcity, Personalization, Attribution
- AdaptiveScoring, FeedbackLoop, NetworkEffect, RevenueAttribution

---

## Environment Variables

### Frontend (.env)

```bash
# API URLs
EXPO_PUBLIC_DO_API_URL=http://localhost:3000
EXPO_PUBLIC_DO_WS_URL=ws://localhost:3000/stream

# REZ Intelligence
EXPO_PUBLIC_REZ_INTENT_URL=https://rez-intent-graph.onrender.com
EXPO_PUBLIC_REZ_USER_INTELLIGENCE_URL=https://REZ-user-intelligence.onrender.com
EXPO_PUBLIC_REZ_AGENT_ORCHESTRATOR_URL=https://rez-agent-orchestrator.onrender.com
EXPO_PUBLIC_REZ_CAMPAIGN_URL=https://rez-campaign-service.onrender.com

# ReZ Services
EXPO_PUBLIC_AUTH_URL=https://rez-auth-service.onrender.com
EXPO_PUBLIC_PROFILE_URL=https://rezprofile.onrender.com
EXPO_PUBLIC_WALLET_URL=https://rez-wallet-service-36vo.onrender.com
EXPO_PUBLIC_REE_URL=https://rez-economic-engine.onrender.com
```

### Backend (.env)

```bash
NODE_ENV=development
PORT=3000

JWT_SECRET=your-jwt-secret-32-chars-minimum
OTP_SECRET=your-otp-secret-32-chars-minimum
CORS_ORIGIN=http://localhost:3000

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

REZ_API_KEY=your-api-key
INTERNAL_SERVICE_TOKENS_JSON={}
```

---

## Setup & Running

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB (for production)
- Redis (optional)

### Installation

```bash
# Clone and install
cd REZ-Consumer/do-app
npm install

# Install backend
cd do-backend
npm install
```

### Development

```bash
# Frontend
cd REZ-Consumer/do-app
npm run start

# Backend
cd REZ-Consumer/do-app/do-backend
npm run dev
```

### Build

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### Testing

```bash
# Backend tests
cd do-backend
npm test
```

---

## Security

- [x] JWT authentication (32+ char secret)
- [x] OTP with expiration
- [x] Rate limiting
- [x] Input validation (Zod)
- [x] CORS protection
- [x] No OTP bypass
- [x] Idempotency keys for transactions
- [x] Token refresh flow

---

## Monitoring

### Metrics to Track

| Metric | Target |
|--------|--------|
| Intent capture rate | > 90% |
| Dormancy detection accuracy | > 80% |
| Revival campaign success | > 15% |
| Recommendation CTR | > 10% |
| Chat response time | < 2s |

### Logs to Monitor

```
[REZ Mind] Intent captured: user_123, chat_message
[REZ Mind] Dormancy detected: user_456, 14 days inactive
[REZ Mind] Revival triggered: user_456, push notification sent
[Attribution] Conversion tracked: booking_789, push channel
```

---

## Next Steps

- [ ] A/B testing integration
- [ ] Custom agent creation
- [ ] Advanced segmentation
- [ ] Webhook for real-time updates
- [ ] Analytics dashboard
- [ ] Admin panel for support

---

*Last Updated: May 13, 2026*
