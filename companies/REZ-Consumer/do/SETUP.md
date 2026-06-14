# Do App - Complete Setup Guide

## Prerequisites

1. Node.js 18+
2. npm or yarn
3. Expo CLI (`npm install -g expo-cli`)
4. EAS CLI (`npm install -g eas-cli`)
5. Expo account (https://expo.dev)

---

## Quick Start

```bash
cd do-app

# Install dependencies
npm install

# Generate app icons
npm run generate:icons

# Start development
npm start
```

---

## Full Setup

### 1. Clone & Install

```bash
git clone git@github.com:imrejaul007/do.git
cd do
npm install
```

### 2. Backend Setup

```bash
cd do-backend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start development
npm run dev
```

### 3. Configure Backend (.env)

Edit `do-backend/.env`:

```env
# ReZ Services (production URLs)
REZ_GATEWAY_URL=https://rez-api-gateway.onrender.com/api
REZ_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
REZ_WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
REZ_ORDER_SERVICE_URL=https://rez-order-service-hz18.onrender.com
REZ_CATALOG_SERVICE_URL=https://rez-catalog-service-1.onrender.com
REZ_GAMIFICATION_SERVICE_URL=https://rez-gamification-service-3b5d.onrender.com
REZ_SEARCH_SERVICE_URL=https://rez-search-service.onrender.com
REZ_INTENT_CAPTURE_URL=https://rez-intent-graph.onrender.com
REZ_MERCHANT_SERVICE_URL=https://rez-merchant-service-n3q2.onrender.com

# SMS Provider (choose one)

# Option A: Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Option B: MSG91
MSG91_API_KEY=your_api_key
MSG91_SENDER_ID=DOAPP
```

### 4. Frontend Environment

Create `do-app/.env`:

```env
EXPO_PUBLIC_API_URL=https://api.rez.money
EXPO_PUBLIC_DO_WS_URL=wss://api.rez.money/do/stream
```

---

## Building for iOS

### 1. Configure EAS

```bash
# Login to Expo
eas login

# Configure project
cd do-app
eas build:configure
```

### 2. Build for Simulator (Development)

```bash
eas build --platform ios --profile development
```

### 3. Build for Device (Preview)

```bash
eas build --platform ios --profile preview
```

### 4. Build for App Store (Production)

```bash
eas build --platform ios --profile production
```

---

## Building for Android

### 1. Generate Keystore (first time)

```bash
eas credentials --platform android
# Select "Generate new keystore"
```

### 2. Build APK (Preview)

```bash
eas build --platform android --profile preview
```

### 3. Build AAB (Production)

```bash
eas build --platform android --profile production
```

---

## Submit to Stores

### iOS App Store

```bash
# Submit latest build
eas submit --platform ios --profile production --latest

# Or submit specific build
eas submit --platform ios --profile production --id <build-id>
```

### Android Google Play

```bash
# First time: Create service account (see Google Play Console setup)
# Then submit

eas submit --platform android --profile production --latest
```

---

## Google Play Console Setup

1. Go to [Google Play Console](https://play.google.com/console)
2. Create developer account ($25)
3. Create app with package name: `com.do.app`
4. Set up API access:

```bash
# In Google Cloud Console:
# 1. Create project or select existing
# 2. Enable "Google Play Android Developer API"
# 3. Create Service Account (IAM > Service Accounts)
# 4. Download JSON key
# 5. In Play Console: Settings > API Access > Link service account
```

---

## Apple Developer Setup

1. Go to [Apple Developer](https://developer.apple.com)
2. Enroll ($99/year)
3. Create App ID: `com.do.app`
4. Create Provisioning Profile
5. Upload to EAS:

```bash
eas credentials --platform ios
```

---

## Service URLs (from SOURCE-OF-TRUTH)

| Service | URL |
|---------|-----|
| Gateway | https://rez-api-gateway.onrender.com/api |
| Auth | https://rez-auth-service.onrender.com |
| Wallet | https://rez-wallet-service-36vo.onrender.com |
| Catalog | https://rez-catalog-service-1.onrender.com |
| Order | https://rez-order-service-hz18.onrender.com |
| Gamification | https://rez-gamification-service-3b5d.onrender.com |
| Search | https://rez-search-service.onrender.com |
| Intent | https://rez-intent-graph.onrender.com |
| Merchant | https://rez-merchant-service-n3q2.onrender.com |

---

## Troubleshooting

### Build fails with missing dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### iOS simulator won't start
```bash
npx expo run:ios --configuration Debug
```

### Android APK not installing
- Enable "Install from unknown sources" in device settings
- Check if device architecture is compatible

### API connection errors
- Verify service URLs are correct
- Check if services are running
- Check network/firewall settings

---

## Common Commands

```bash
# Development
npm start              # Start Expo
npm run dev            # Dev mode

# Builds
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Submit
eas submit --platform ios --profile production --latest
eas submit --platform android --profile production --latest

# Credentials
eas credentials --platform ios
eas credentials --platform android
```

---

## Bundle IDs

- **iOS**: `com.do.app`
- **Android**: `com.do.app`

---

## Support

For issues, check:
1. Expo documentation: https://docs.expo.dev
2. EAS documentation: https://docs.expo.dev/eas
3. ReZ Source of Truth: `../SOURCE-OF-TRUTH/`
