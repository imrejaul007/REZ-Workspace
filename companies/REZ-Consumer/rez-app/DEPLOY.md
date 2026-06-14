# REZ App Deployment Guide

## Prerequisites

1. **EAS CLI** installed:
```bash
npm install -g eas-cli
```

2. **Expo account** at https://expo.dev

3. **EAS Build** configured in `eas.json`

---

## Quick Deploy

### 1. Install Dependencies
```bash
cd REZ-Consumer/REZ-App
npm install
```

### 2. Build for iOS (Simulator)
```bash
eas build --platform ios --profile preview --local
```

### 3. Build for Android (APK)
```bash
eas build --platform android --profile preview --local
```

### 4. Build for Production
```bash
# iOS Production
eas build --platform ios --profile production

# Android Production
eas build --platform android --profile production
```

---

## Environment Setup

### Copy environment file:
```bash
cp .env.example .env
```

### Required Environment Variables:

```bash
# API Gateway
EXPO_PUBLIC_API_BASE_URL=https://rez-api-gateway.onrender.com/api

# REZ Intelligence
EXPO_PUBLIC_TASTE_PROFILE_URL=https://rez-taste-profile.onrender.com
EXPO_PUBLIC_CARE_SERVICE_URL=https://REZ-care-service.onrender.com
EXPO_PUBLIC_FEEDBACK_SERVICE_URL=https://REZ-feedback-service.onrender.com

# RABTUL Infrastructure
EXPO_PUBLIC_FEATURE_FLAGS_URL=https://REZ-feature-flags.onrender.com
EXPO_PUBLIC_EMAIL_SERVICE_URL=https://REZ-email-service.onrender.com

# REZ Media
EXPO_PUBLIC_JOURNEY_SERVICE_URL=https://REZ-journey-service.onrender.com
EXPO_PUBLIC_ATTRIBUTION_SERVICE_URL=https://REZ-attribution-hub.onrender.com

# CorpPerks
EXPO_PUBLIC_CORPORATE_SERVICE_URL=https://rez-corporate-service.onrender.com

# Google & Maps
GOOGLE_MAPS_API_KEY=your_key
GOOGLE_PLACES_API_KEY=your_key

# Payment
RAZORPAY_KEY_ID=your_key
```

---

## Backend Services to Deploy

Deploy these services before building:

### REZ Intelligence
| Service | URL | Port |
|---------|-----|------|
| rez-taste-profile | https://rez-taste-profile.onrender.com | 4041 |
| REZ-care-service | https://REZ-care-service.onrender.com | 4055 |
| REZ-feedback-service | https://REZ-feedback-service.onrender.com | 4066 |

### RABTUL Infrastructure
| Service | URL | Port |
|---------|-----|------|
| REZ-feature-flags | https://REZ-feature-flags.onrender.com | 4060 |
| REZ-email-service | https://REZ-email-service.onrender.com | 4015 |

### REZ Media
| Service | URL | Port |
|---------|-----|------|
| REZ-journey-service | https://REZ-journey-service.onrender.com | 4019 |
| REZ-attribution-hub | https://REZ-attribution-hub.onrender.com | 4068 |

### CorpPerks
| Service | URL | Port |
|---------|-----|------|
| rez-corporate-service | https://rez-corporate-service.onrender.com | 4056 |

---

## Deploy Backend Services

### Option 1: Render.com Auto-Deploy

Each service has a `render.yaml` for auto-deployment:

```bash
# Navigate to service directory
cd REZ-Intelligence/REZ-taste-profile

# Connect to Render.com via GitHub
# 1. Push to GitHub
git add .
git commit -m "Add render.yaml"
git push

# 2. Go to render.com, connect repo, enable auto-deploy
```

### Option 2: Manual Deploy

```bash
# Install Render CLI
npm install -g @render/render-cli

# Deploy each service
render blueprint apply -f render.yaml
```

---

## Build Status

- [ ] iOS Simulator Build
- [ ] iOS Production Build
- [ ] Android APK Build
- [ ] Android Production Build (AAB for Play Store)
- [ ] TestFlight Upload (iOS)
- [ ] Play Store Upload (Android)

---

## Troubleshooting

### Build fails with TypeScript errors
These are pre-existing and don't block the build. Expo uses Babel which ignores TS errors.

### Missing environment variables
Copy `.env.example` to `.env` and fill in real values.

### Module resolution errors
These are cosmetic for expo-router lazy imports. Components exist and work.

### Pod install fails (iOS)
```bash
cd ios
pod install
cd ..
eas build --platform ios
```

---

## Post-Build

1. **Download builds** from https://expo.dev/builds
2. **Install on device**:
   - iOS: Scan QR code or use Finder
   - Android: Install APK directly or use Play Store
3. **Test the app** with production environment
4. **Monitor** with Sentry and observability dashboards
