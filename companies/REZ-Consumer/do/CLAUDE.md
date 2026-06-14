# CLAUDE.md - Do App

**AI-powered chat app for the ReZ ecosystem.**

---

## Project Overview

**Version**: 3.0.0 | **SDK**: Expo 53 | **Last Updated**: June 1, 2026

### Purpose
AI-powered conversational commerce app that leverages existing ReZ services through natural chat interface with personalized style recommendations.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Expo SDK 53 (React Native) |
| **Navigation** | Expo Router |
| **Voice** | expo-av |
| **Biometric** | expo-local-authentication |
| **State** | Zustand, React Query |
| **Animations** | Moti, Lottie, Reanimated |
| **Styling** | StyleSheet + Linear Gradient |
| **Backend** | Node.js/Express |
| **Real-time** | WebSocket (ws) |
| **Images** | expo-image-picker |
| **Push** | expo-notifications |

---

## Build & Run

```bash
# Frontend
cd REZ-Consumer/do-app
npm install
npm run start           # Start Expo DevTools

# Backend
cd REZ-Consumer/do-app/do-backend
npm install
npm run dev             # Development with watch

# Build native
eas build --platform ios
eas build --platform android
```

---

## Project Structure

```
REZ-Consumer/do-app/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout + REZ Mind init
│   ├── index.tsx           # Redirects to tabs
│   ├── onboarding/         # Onboarding with style prefs
│   ├── auth/               # Auth flow
│   ├── (tabs)/            # Tab navigator
│   │   └── _layout.tsx
│   ├── booking/[id].tsx    # Booking detail + actions
│   ├── complaints/          # Complaints
│   ├── refunds/            # Refunds
│   ├── settings/
│   │   ├── notifications.tsx  # Notification prefs
│   │   ├── addresses.tsx      # Address management
│   │   └── edit-profile.tsx   # Profile editor
│   └── profile/avatar/     # Avatar upload
│
├── src/
│   ├── components/
│   │   ├── chat/           # Chat components
│   │   ├── NudgeBanner.tsx  # Real-time nudges
│   │   └── AgentInsights.tsx # AI scores display
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
│   │   ├── useReZMind.ts    # All REZ Mind hooks
│   │   ├── useBiometricAuth.ts  # Face ID / Touch ID
│   │   ├── useVoiceInput.ts     # Speech to text
│   │   ├── useDeepLinking.ts    # Deep link handling
│   │   └── useDraft.ts          # Draft saving
│   │
│   ├── components/
│   │   ├── VoiceInputButton.tsx  # Animated mic
│   │   ├── CharacterCounter.tsx   # 500 char limit
│   │   ├── VenueMarker.tsx       # Map marker
│   │   └── ExploreMapScreen.tsx  # Map view
│   │
│   ├── services/
│   │   ├── rezApi.ts         # Main API client
│   │   ├── rezMindService.ts # REZ Mind client
│   │   ├── eventTracking.ts  # Event capture
│   │   ├── agentOrchestrator.ts # Agent OS
│   │   ├── nudgeEngine.ts    # Real-time nudges
│   │   ├── attributionTracking.ts # Attribution
│   │   ├── websocketService.ts # WebSocket
│   │   ├── avatarService.ts  # Avatar upload
│   │   └── notifications.ts  # Push notifications
│   │
│   ├── stores/
│   │   └── index.ts          # Zustand stores
│   │
│   └── theme/
│       └── ThemeProvider.tsx
│
└── do-backend/                # Express backend
    └── src/
        ├── api/routes/
        │   ├── auth.ts
        │   ├── chat.ts
        │   ├── complaints.ts
        │   ├── discover.ts
        │   ├── notifications.ts
        │   ├── profile.ts
        │   ├── wallet.ts
        │   └── bookings.ts
        ├── middleware/
        │   ├── auth.ts
        │   └── rateLimit.ts
        ├── services/
        │   ├── workflowEngine.ts
        │   ├── salesAgent.ts
        │   ├── unifiedIntentDetector.ts
        │   └── complaintRefundHandler.ts
        ├── integrations/
        │   └── rezIntegrations.ts
        └── utils/
            ├── config.ts
            └── logger.ts
```

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
JWT_SECRET=your-32-char-minimum-secret
OTP_SECRET=your-32-char-minimum-secret
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
REZ_API_KEY=your-api-key
INTERNAL_SERVICE_TOKENS_JSON={}
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/otp/send` | Public | Send OTP |
| POST | `/auth/otp/verify` | Public | Verify OTP |
| GET | `/auth/me` | JWT | Current user |
| POST | `/auth/logout` | JWT | Logout |
| POST | `/auth/refresh` | Public | Refresh token |

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
| GET | `/discovery/mood/:mood` | - | Mood discovery |

### Wallet

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/wallet` | JWT | Balance |
| GET | `/wallet/transactions` | JWT | History |
| POST | `/wallet/debit` | JWT | Spend (idempotent) |
| POST | `/wallet/credit` | JWT | Earn (idempotent) |
| GET | `/wallet/karma` | JWT | Karma status |

### Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/bookings` | JWT | List |
| GET | `/bookings/:id` | JWT | Detail |
| POST | `/bookings` | JWT | Create |
| DELETE | `/bookings/:id` | JWT | Cancel |

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

## WebSocket Protocol

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3000/stream?token=<jwt>&sessionId=<id>');
```

### Message Types

**Client → Server:**
```json
{ "type": "message", "payload": { "text": "...", "location": { "lat": 0, "lng": 0 } } }
{ "type": "typing", "payload": { "isTyping": true } }
{ "type": "heartbeat" }
```

**Server → Client:**
```json
{ "type": "connected", "payload": { "sessionId": "...", "userId": "..." } }
{ "type": "typing", "payload": { "isTyping": true } }
{ "type": "message", "payload": { "messages": [...] } }
{ "type": "error", "payload": { "code": "...", "message": "..." } }
```

---

## REZ Mind Integration

### Services Connected

| Service | Do App Usage |
|---------|-------------|
| **Intent Graph** | Track all user events |
| **User Intelligence** | Behavioral profiles |
| **Agent Orchestrator** | 38 AI agents |
| **Campaign Service** | Push notifications |

### Quick Usage

```typescript
// Import all hooks
import {
  useIntentTracking,
  useDormancyDetection,
  useRecommendations,
  useBehavioralProfile,
  usePredictiveScoring,
  useNudgeEngine,
  useAttribution,
} from '@/hooks/useReZMind';

// Track events
const { trackChatIntent } = useIntentTracking();
await trackChatIntent("I'm looking for Italian food");

// Get recommendations
const { getRecommendations } = useRecommendations();
const recs = await getRecommendations({ types: ['restaurants'] });

// Check dormancy
const { checkDormantStatus } = useDormancyDetection();
const status = await checkDormantStatus();

// Show nudges
const { nudges } = useNudgeEngine();
nudges.map(n => <NudgeBanner nudge={n} />);
```

### Intent Events

| Event | Trigger |
|-------|---------|
| `chat_message` | User sends message |
| `entity_view` | User views venue |
| `search` | User searches |
| `booking_complete` | Booking confirmed |
| `style_preferences_set` | Preferences saved |

---

## Connected ReZ Services

| Service | Purpose | Production URL |
|---------|---------|----------------|
| Auth | Phone + JWT | https://rez-auth-service.onrender.com |
| Profile | User data | https://rezprofile.onrender.com |
| Wallet | Coins, balance | https://rez-wallet-service-36vo.onrender.com |
| REE | Subscriptions | https://rez-economic-engine.onrender.com |
| Intent Graph | User context | https://rez-intent-graph.onrender.com |

---

## New Features (v3.1.0)

### Biometric Authentication
```typescript
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

const { authenticate, enableBiometric } = useBiometricAuth();
// Authenticate with Face ID / Touch ID
const success = await authenticate();
```

### Voice Input
```typescript
import { useVoiceInput } from '@/hooks/useVoiceInput';

const { startListening, stopListening, transcript } = useVoiceInput();
await startListening();
// transcript contains recognized speech
```

### Deep Linking
```typescript
import { useDeepLinking } from '@/hooks/useDeepLinking';

// Supported: do://chat, do://wallet, do://profile, do://explore, do://booking/:id
```

### Draft Saving
```typescript
import { useDraft } from '@/hooks/useDraft';

const { saveDraft, getDraft, clearDraft } = useDraft();
// Auto-saves drafts, clears on send
```

### Character Counter
```typescript
// Shows in ChatInput when text > 50 chars
// Colors: gray (<80%), orange (80-100%), red (>100%)
```
| User Intelligence | Profiles | https://REZ-user-intelligence.onrender.com |
| Agent Orchestrator | AI agents | https://rez-agent-orchestrator.onrender.com |
| Communications | Push, SMS | https://rez-communications.onrender.com |

---

## Style Preferences

### User Style Profile
```typescript
interface StylePreferences {
  vibes: string[];       // ['casual', 'trendy', 'minimal']
  occasions: string[];    // ['date', 'office', 'party']
  cuisines: string[];      // ['indian', 'italian']
}
```

### Available Vibes
- `casual` - Relaxed, comfortable
- `formal` - Professional, elegant
- `trendy` - Modern, fashion-forward
- `minimal` - Clean, simple
- `bold` - Statement, vibrant
- `classic` - Timeless, traditional

### Available Occasions
- `date` - Date Night
- `office` - Work/Professional
- `party` - Parties
- `family` - Family Time
- `fitness` - Fitness
- `relax` - Relaxation

### Available Cuisines
- `indian`, `chinese`, `italian`, `japanese`, `continental`, `cafe`, `fastfood`, `healthy`

---

## Security Rules

1. **Never log sensitive data** - passwords, tokens, OTPs
2. **Always validate input** - Use Zod schemas
3. **Never skip auth checks** - Verify JWT on protected routes
4. **Never skip WebSocket auth** - Always verify tokens
5. **Never skip input validation** - Use Zod schemas for all user input

### Required for Production

- [x] `JWT_SECRET` - Minimum 32 characters
- [x] `OTP_SECRET` - Minimum 32 characters
- [x] `CORS_ORIGIN` - Specific domain, not `*`
- [x] `NODE_ENV=production` - Enables security checks

---

## Testing

```bash
# Backend tests
cd do-backend
npm test

# Run specific test file
npm test -- test/api/auth.test.ts
```

---

## Related Documentation

- [SPEC.md](./DO-APP-SPEC.md) - Full specification
- [DO-TECHNICAL-INTEGRATION.md](./DO-TECHNICAL-INTEGRATION.md) - API details
- [REZ-MIND-INTEGRATION.md](./DO-APP-REZ-MIND-INTEGRATION.md) - REZ Mind guide
- [SECURITY.md](./do-backend/SECURITY.md) - Security guidelines
- [SECURITY-AUDIT.md](./SECURITY-AUDIT.md) - Vulnerability audit
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment checklist
- [CHANGELOG.md](./CHANGELOG.md) - Version history

---

## AI Agents (38 Total)

### User Intelligence (15)
PersonalizationAgent, SegmentClassifierAgent, RecommendationQualityAgent, EngagementScoreAgent, SessionAnalyzerAgent, SearchIntentAgent, BrowsePatternAgent, PurchasePredictorAgent, AbandonmentDetectorAgent, RetentionTriggerAgent, WinBackAgent, ReferralPotentialAgent, SurveyTriggerAgent, FeedbackAnalyzerAgent, NPSPredictorAgent

### Commerce (15)
DemandSignalAgent, ScarcityAgent, PriceElasticityAgent, ReorderPredictorAgent, TasteEvolutionAgent, ChurnRiskAgent, LTVPredictorAgent, InventoryAlertAgent, DemandForecastAgent, CompetitorMonitorAgent, TrendDetectorAgent, PriceOptimizerAgent, OfferMatcherAgent, CrossSellAgent, UrgencyTriggerAgent

### Autonomous (8)
DemandSignal, Scarcity, Personalization, Attribution, AdaptiveScoring, FeedbackLoop, NetworkEffect, RevenueAttribution

---

*Last Updated: June 1, 2026*
