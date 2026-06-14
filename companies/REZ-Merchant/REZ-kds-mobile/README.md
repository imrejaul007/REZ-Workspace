# REZ KDS Mobile

Kitchen Display System Mobile App for the REZ ecosystem. Built with Expo and React Native.

## Features

- **Real-time Order Queue** - Live updates with WebSocket support
- **Color-coded Priority** - Visual indicators for urgent, high, normal, and low priority orders
- **Order Timer** - Track time since order was placed with color-coded warnings
- **Bump Orders** - Swipe or tap to mark orders as acknowledged, in-progress, ready, or completed
- **Voice Announcements** - Text-to-speech for new orders and priority alerts
- **Multi-station Support** - Filter orders by station (Grill, Fry, Salad, etc.)
- **Offline Mode** - Cache orders locally and sync when back online
- **Tablet-optimized UI** - Landscape-first design for kitchen displays
- **Kitchen Printer Support** - ESC/POS ticket printing

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Expo SDK 52 | Framework and build tooling |
| React Native 0.76 | Cross-platform mobile |
| Zustand | State management |
| React Navigation 7 | Navigation |
| React Native Reanimated 3 | Animations |
| Expo Notifications | Push notifications & sounds |
| Expo Speech | Text-to-speech |
| Expo AV | Audio playback |
| Axios | HTTP client |
| date-fns | Date utilities |

## Project Structure

```
REZ-kds-mobile/
├── App.tsx                 # Main app entry point
├── app.json                # Expo configuration
├── package.json            # Dependencies
├── babel.config.js         # Babel configuration
├── tsconfig.json           # TypeScript configuration
└── src/
    ├── components/         # Reusable UI components
    │   ├── OrderCard.tsx
    │   ├── OrderCardGrid.tsx
    │   ├── StationFilter.tsx
    │   ├── Header.tsx
    │   ├── EmptyState.tsx
    │   └── LoadingOverlay.tsx
    ├── hooks/              # Custom React hooks
    │   └── useOrders.ts
    ├── screens/            # Screen components
    │   ├── KitchenScreen.tsx
    │   └── OrderDetail.tsx
    ├── services/           # API and external services
    │   ├── api.ts
    │   ├── notifications.ts
    │   └── printer.ts
    ├── store/              # Zustand state store
    │   └── kdsStore.ts
    ├── types/              # TypeScript definitions
    │   └── index.ts
    └── utils/              # Utility functions
        ├── constants.ts
        └── helpers.ts
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for iOS development)
- Android Emulator or device (for Android development)

### Installation

```bash
# Clone the repository
cd REZ-Merchant/REZ-kds-mobile

# Install dependencies
npm install

# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_URL=https://api.rezapp.com
EXPO_PUBLIC_WS_URL=wss://ws.rezapp.com/kds
EXPO_PUBLIC_INTERNAL_TOKEN=your-internal-service-token
```

## Configuration

### Order Status Flow

```
PENDING -> ACKNOWLEDGED -> IN_PROGRESS -> READY -> COMPLETED
    |           |              |           |
    v           v              v           v
  (New)      (Seen)        (Cooking)   (Served)
```

### Priority Levels

| Priority | Color | Use Case |
|----------|-------|----------|
| Urgent | Red (#F44336) | VIP customers, rush orders |
| High | Orange (#FF9800) | Online orders, time-sensitive |
| Normal | Blue (#2196F3) | Standard orders |
| Low | Green (#4CAF50) | Pre-orders, future timing |

### Timer Thresholds

| Threshold | Time | Color |
|-----------|------|-------|
| Normal | < 10 min | Green |
| Warning | 10-15 min | Yellow |
| Critical | 15-20 min | Orange |
| Urgent | > 20 min | Red |

## API Integration

The app connects to the REZ backend API. Configure the base URL in `src/services/api.ts`:

```typescript
const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.rezapp.com',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};
```

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/kds/orders` | GET | Fetch orders with filters |
| `/api/v1/kds/orders/:id` | GET | Get single order |
| `/api/v1/kds/orders/:id/bump` | POST | Bump order to next status |
| `/api/v1/kds/orders/:id/recall` | POST | Recall completed order |
| `/api/v1/kds/stations/:station/orders` | GET | Orders for specific station |
| `/api/v1/kds/stats` | GET | Kitchen statistics |

## Push Notifications

Configure notification channels in `app.json`:

```json
{
  "plugins": [
    ["expo-notifications", {
      "sounds": [
        "./assets/sounds/new-order.wav",
        "./assets/sounds/urgent-order.wav",
        "./assets/sounds/order-bumped.wav"
      ]
    }]
  ]
}
```

## Offline Mode

The app caches orders locally using AsyncStorage. When offline:

1. Orders are displayed from cache
2. Bump actions are queued locally
3. On reconnect, queued actions are synced to server
4. Cache is refreshed with latest data

## Tablet Optimization

The UI automatically adapts to screen size:

| Screen Width | Columns | Card Size |
|--------------|---------|-----------|
| >= 1200px | 5 | Medium |
| >= 900px | 4 | Medium |
| >= 600px | 3 | Compact |
| < 600px | 2 | Compact |

## Kitchen Printer

ESC/POS commands are used for ticket printing. Configure printer in `src/services/printer.ts`:

```typescript
const printer = {
  type: 'network',
  name: 'Kitchen Printer',
  address: '192.168.1.100',
  port: 9100,
};
```

## Voice Announcements

Text-to-speech announcements are configured in settings:

```typescript
const voiceConfig = {
  enabled: true,
  language: 'en-IN',
  rate: 0.9,
  pitch: 1.0,
  announcePriority: true,
  announceOrderNumber: true,
  announceItems: true,
};
```

## Build for Production

### iOS

```bash
# Generate native iOS project
npx expo prebuild --platform ios

# Build with Xcode
cd ios && xcodebuild -workspace REZkdsmobile.xcworkspace -scheme REZkdsmobile -configuration Release archive
```

### Android

```bash
# Generate native Android project
npx expo prebuild --platform android

# Build APK
cd android && ./gradlew assembleRelease
```

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage
```

## Troubleshooting

### Push Notifications Not Working

1. Check notification permissions
2. Verify FCM/APNs credentials
3. Check notification channel configuration

### Offline Mode Issues

1. Clear AsyncStorage cache
2. Check network connectivity
3. Verify sync endpoint

### Printer Not Printing

1. Verify printer network connectivity
2. Check ESC/POS command compatibility
3. Test with print server directly

## License

Proprietary - REZ Technologies Pvt. Ltd.

## Support

For technical support, contact:
- Email: support@rezapp.com
- Documentation: docs.rezapp.com
