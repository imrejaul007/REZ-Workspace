# REZ Consumer App (Nuqta)

<!-- Trigger deployment: main — unified branch strategy, all audit fixes consolidated -->

React Native/Expo mobile application for the REZ consumer platform. Buy products, earn cashback, manage wallet, and referral rewards.

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- Expo CLI: `npm install -g expo-cli`
- iOS/Android emulator or physical device with Expo Go app

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit with your backend API URL and Firebase credentials
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

   Then press:
   - `i` — iOS simulator
   - `a` — Android emulator
   - `w` — Web browser

   Or scan QR code with Expo Go app

## Project Structure

```
app/                     # Expo Router file-based navigation
├── (auth)/              # Authentication screens (login, signup, OTP)
├── (tabs)/              # Main tab navigation
│   ├── home/            # Home feed & offers
│   ├── wallet/          # Balance, transactions, referral
│   ├── orders/          # Purchase history & tracking
│   └── profile/         # Settings & preferences
├── product/             # Product details & reviews
├── checkout/            # Cart & payment flow
└── _layout.tsx          # Root navigation config

services/                # API client classes
├── apiClient.ts         # Main HTTP client with auth/retry logic
├── servicesApi.ts       # Service-related endpoints
├── serviceBookingApi.ts # Appointment booking
└── ...

utils/
├── apiClient.ts         # Utility functions for API calls
├── authStorage.ts       # Token persistence
├── connectionUtils.ts   # Network error handling
├── requestDeduplicator.ts # Prevent duplicate requests
└── ...

types/
├── api.types.ts         # TypeScript response types
├── api-integration.ts   # Integration test types
└── index.ts             # Re-exports

hooks/                   # React hooks
├── useAuth.ts           # Authentication context
├── useApi.ts            # API request wrapper
├── useLocation.ts       # Geolocation
└── ...

config/
├── env.ts               # Environment variables
├── sentry.ts            # Error tracking
├── firebase.ts          # Firebase/FCM config
└── ...

__tests__/               # Jest test suite
├── integration/         # API integration tests
├── services/            # Hook & utility tests
└── mocks/               # Mock API handlers (MSW)
```

## Key Features

- **Authentication** — Phone/email OTP, JWT token persistence, auto-refresh
- **Product Browsing** — Category search, filters, recommendations, price comparison
- **Cart & Checkout** — Multi-item cart, saved addresses, payment methods
- **Wallet & Cashback** — Balance tracking, transaction history, reward details
- **Referral Program** — Unique code generation, tracking, tier benefits
- **Notifications** — Push (Firebase FCM), in-app alerts
- **Order Management** — Real-time tracking, returns, complaint filing
- **User Profile** — Preferences, saved addresses, KYC verification

### RABTUL Integration Services

| Service | File | Port | Description |
|---------|------|------|-------------|
| **Delivery** | `deliveryApi.ts` | 4009 | Real-time delivery tracking |
| **Unified Booking** | `unifiedBookingApi.ts` | 4020 | Hotels, flights, trains, events |
| **Observability** | `observabilityApi.ts` | 4025 | Metrics, logs, tracing |
| **Checkout Optimization** | `checkoutApi.ts` | 4050 | 1-Click checkout, cart recovery |
| **Intent Graph** | `intentGraphApi.ts` | 3001 | AI recommendations |
| **Workflow Builder** | - | 4045 | Journey automation |
| **RFM Plus** | - | 4055 | Customer segmentation, LTV |
| **Logistics Aggregator** | - | 4052 | Multi-carrier rates |
| **Gamification** | - | 4018 | Points, badges, challenges |
| **Economic Engine** | - | 4019 | Dynamic pricing |

### REZ-Media Services (Marketing & Engagement)

| Service | Description |
|---------|-------------|
| **Karma** | Impact economy, community rewards |
| **Ads** | Advertising platform |
| **Engagement** | Loyalty, offers, referrals |
| **Support Tools Hub** | Zendesk, Freshdesk, Intercom |
| **CRM Hub** | HubSpot, Zoho integration |
| **Attribution** | Campaign attribution |
| **WhatsApp Commerce** | WhatsApp shopping |

### REZ-Intelligence Services (AI & ML)

| Service | Description |
|---------|-------------|
| **Intent Graph** | AI recommendations, personalization |
| **Feedback Collector** | User feedback |
| **Lead Intelligence** | Lead scoring |
| **CDP** | Customer data platform |
| **Personalization Engine** | Real-time personalization |
| **Recommendation Engine** | Product recommendations |

### RTNM-Group Services (Core Platform)

| Service | Description |
|---------|-------------|
| **Identity Service** | User identity graph |
| **Central Permissions** | RBAC/ABAC |
| **Capital Service** | Restaurant lending |
| **Support Dashboard** | Unified support |

### StayOwn-Hospitality Services

| Service | Description |
|---------|-------------|
| **Hotel OTA** | Hotel booking |
| **Room QR** | Hotel room access |

## API Integration

### Response Format

All API responses follow standardized shape:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: { [key: string]: string[] };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    timestamp?: string;
  };
}
```

### Making API Calls

Use the main ApiClient:

```typescript
import { apiClient } from '@/services/apiClient';

// GET request
const response = await apiClient.request<Product[]>(
  '/products',
  { method: 'GET' }
);

// POST with body
const order = await apiClient.request<Order>(
  '/orders',
  {
    method: 'POST',
    body: { items: [...], addressId: '...' }
  }
);
```

**Type Safety:** All API responses are typed. If backend response shape doesn't match the TypeScript interface, TypeScript will error.

### Request Features

- **Auto-authentication:** Tokens injected from secure storage
- **Deduplication:** Identical concurrent requests collapse to one (prevent double-submit)
- **Concurrency limiting:** Max 5 parallel requests to prevent connection exhaustion
- **Retry logic:** Auto-retry failed requests (3 attempts, exponential backoff)
- **Timeout:** Default 30 seconds (configurable per request)
- **Region-aware:** Automatically selects regional API endpoint based on user location

## Development

### Run Tests
```bash
npm test              # All tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Linting & Formatting
```bash
npm run lint         # ESLint
npm run format       # Prettier format
npm run type-check   # TypeScript check
```

### Build for Production
```bash
eas build --platform ios
eas build --platform android
```

## Environment Variables

Create `.env.local` (never commit!):

```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api  # Dev
# EXPO_PUBLIC_API_BASE_URL=https://api.rez.app/api  # Prod

# Firebase (for push notifications)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=

# Sentry (error tracking)
EXPO_PUBLIC_SENTRY_DSN=

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_MIN_APP_VERSION=1.0.0
```

## Deployment

### Staging
```bash
eas build --platform all --profile staging
eas submit --platform ios --profile staging
```

### Production
```bash
eas build --platform all --profile production
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

### Over-the-Air Updates
```bash
eas update --branch production
```

## Known TODOs & Issues

- **Push Notification Delivery Tracking:** Currently sends but doesn't confirm delivery
- **Deep Link Testing:** Limited coverage for notification → app navigation
- **Offline Support:** Basic caching, but no full offline mode yet
- **Performance:** Large product lists may scroll slowly on older devices

## Regression Safety

**Before Releasing:**
- [ ] Run full test suite: `npm test`
- [ ] Verify API response types match backend (check .env for correct API URL)
- [ ] Test payment flow end-to-end with test Razorpay credentials
- [ ] Verify push notifications are received
- [ ] Check that wallet balance updates in real-time after purchase
- [ ] Test refresh token rotation (close app, reopen after 15 mins)

**Monitoring:**
- Sentry alerts on unhandled errors
- Analytics track key user flows (login, checkout, cashback claim)
- API endpoint performance tracked in New Relic

## Support

- Backend API docs: See backend README
- TypeScript setup: `tsconfig.json` strict mode enabled
- Testing: Jest + React Testing Library + MSW (mock API)

---

**Version:** 1.0.0
**Last Updated:** 2026-03-23
**Platform:** React Native/Expo (iOS & Android)
**Maintainer:** Release Engineering (Priya Menon)
# trigger debug
