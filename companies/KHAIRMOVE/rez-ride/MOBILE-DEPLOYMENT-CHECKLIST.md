# ReZ Ride - Production Deployment Checklist

**Date:** May 23, 2026
**Apps:** user-app, driver-app

---

## Pre-Deployment Verification

### Security (MUST PASS)

- [ ] **Secure Storage**
  - [ ] `expo-secure-store` installed
  - [ ] Tokens stored using `SecureStore` (not AsyncStorage)
  - [ ] Refresh token implemented
  - [ ] Token auto-refresh on 401

- [ ] **Biometric Auth**
  - [ ] `expo-local-authentication` integrated
  - [ ] Fallback to PIN/password
  - [ ] Secure credential retrieval

- [ ] **API Security**
  - [ ] No hardcoded URLs (use `app.json` extra)
  - [ ] HTTPS only in production
  - [ ] Certificate pinning (optional)
  - [ ] Request signing (optional)

- [ ] **Deep Links**
  - [ ] URL validation implemented
  - [ ] Parameter sanitization
  - [ ] Fallback for invalid links

### Performance (MUST PASS)

- [ ] **Hermes Engine**
  - [ ] `app.json`: `"newArchEnabled": true`
  - [ ] JS bundle bundled with Hermes
  - [ ] No `--minify false` in production

- [ ] **Bundle Size**
  - [ ] Total < 30MB (iOS)
  - [ ] Total < 25MB (Android)
  - [ ] No duplicate packages
  - [ ] Tree shaking enabled

- [ ] **Startup Time**
  - [ ] Cold start < 3 seconds
  - [ ] Splash screen implemented
  - [ ] Lazy loading screens
  - [ ] Heavy computations deferred

- [ ] **Memory**
  - [ ] No WebSocket memory leaks
  - [ ] Proper cleanup on unmount
  - [ ] Image caching configured
  - [ ] List virtualization

### Network (MUST PASS)

- [ ] **Retry Logic**
  - [ ] Exponential backoff implemented
  - [ ] Max retries: 3
  - [ ] Rate limit handling
  - [ ] Timeout: 30 seconds

- [ ] **Offline Support**
  - [ ] Network status detection
  - [ ] Request queue for offline
  - [ ] Graceful degradation
  - [ ] Queue processing on reconnect

- [ ] **API Caching**
  - [ ] Static data cached
  - [ ] Cache invalidation
  - [ ] Stale-while-revalidate

### Error Handling (MUST PASS)

- [ ] **Crash Reporting**
  - [ ] Sentry configured
  - [ ] Source maps uploaded
  - [ ] User context set
  - [ ] Breadcrumbs enabled

- [ ] **Error Boundaries**
  - [ ] Global boundary added
  - [ ] Screen-level boundaries
  - [ ] Graceful fallback UI

- [ ] **Analytics**
  - [ ] Events batched
  - [ ] Offline queue
  - [ ] Critical events guaranteed

---

## Expo EAS Build Configuration

### app.json

```json
{
  "expo": {
    "name": "ReZ Ride",
    "slug": "rez-ride",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.rezride.app",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "We need your location to find nearby rides",
        "NSLocationAlwaysUsageDescription": "We need your location for ride tracking",
        "NSCameraUsageDescription": "We need camera for document verification",
        "NSFaceIDUsageDescription": "Use Face ID for secure login"
      }
    },
    "android": {
      "package": "com.rezride.app",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "CAMERA",
        "RECORD_AUDIO",
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED"
      ],
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow ReZ Ride to use your location"
        }
      ],
      "expo-local-authentication",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#6B4EFF"
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "usesCleartextTraffic": false,
            "enableProguardInReleaseBuilds": true,
            "enableHermes": true
          },
          "ios": {
            "enableHermes": true,
            "newArchEnabled": true
          }
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      },
      "API_URL": "https://api.rezride.com",
      "WS_URL": "wss://api.rezride.com"
    }
  }
}
```

---

## Environment Variables

### Development (.env.development)
```bash
API_URL=http://localhost:4000
WS_URL=ws://localhost:4000/ride
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Staging (.env.staging)
```bash
API_URL=https://staging-api.rezride.com
WS_URL=wss://staging-api.rezride.com
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Production (.env.production)
```bash
API_URL=https://api.rezride.com
WS_URL=wss://api.rezride.com
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## EAS Build Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to EAS
eas login

# Configure EAS
eas build:configure

# Development build (local)
eas build --platform ios --profile development --local

# Development build (cloud)
eas build --platform ios --profile development

# Staging build
eas build --platform ios --profile staging
eas build --platform android --profile staging

# Production build
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to App Store (iOS)
eas submit --platform ios --latest

# Submit to Play Store (Android)
eas submit --platform android --latest
```

### eas.json Configuration

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "staging": {
      "distribution": "internal",
      "env": {
        "API_URL": "https://staging-api.rezride.com"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "API_URL": "https://api.rezride.com"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "1234567890"
      },
      "android": {
        "serviceAccountKeyPath": "./path/to/service-account.json",
        "track": "production"
      }
    }
  }
}
```

---

## Post-Deployment Verification

### iOS App Store

- [ ] TestFlight external tester build
- [ ] Privacy manifest uploaded
- [ ] App Store Connect metadata
- [ ] Age rating configured
- [ ] Screenshot sizes correct
- [ ] Review submission

### Google Play Store

- [ ] Internal testing track
- [ ] Closed beta track
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Target API level 34
- [ ] App signing configured

### Monitoring

- [ ] Sentry dashboards
- [ ] Crash-free rate > 99.5%
- [ ] Performance monitoring
- [ ] API error rates
- [ ] WebSocket connection stats

---

## Emergency Rollback

### iOS
1. App Store Connect → App → Version History
2. Select previous version
3. Reject current build
4. Push hotfix

### Android
1. Play Console → Release → Management
2. Roll back to previous version
3. Push hotfix

---

## Sign-Off

| Checkpoint | Status | Date |
|------------|--------|------|
| Security Review | ☐ Pass / ☐ Fail | |
| Performance Review | ☐ Pass / ☐ Fail | |
| QA Sign-Off | ☐ Pass / ☐ Fail | |
| Product Sign-Off | ☐ Pass / ☐ Fail | |
| Go-Live Approval | ☐ Pass / ☐ Fail | |

**Production Deployment Date:** _________________

**Approved By:** _________________
