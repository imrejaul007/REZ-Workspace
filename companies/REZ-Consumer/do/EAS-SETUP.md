# EAS Build Setup Guide

## Prerequisites

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure your project:
```bash
cd do-app
eas build:configure
```

## iOS Setup

### 1. Create Apple Developer Account
- Go to [Apple Developer](https://developer.apple.com)
- Enroll in the Apple Developer Program ($99/year)

### 2. Create App Store Connect App
- Go to [App Store Connect](https://appstoreconnect.apple.com)
- Create a new app with bundle ID: `com.do.app`

### 3. Generate Certificates (or let EAS auto-generate)

#### Option A: Let EAS handle it (Recommended)
Just run:
```bash
eas build --platform ios --profile production
```
EAS will prompt you to create necessary certificates.

#### Option B: Manual certificates
1. Create App IDs in Apple Developer Portal
2. Create Provisioning Profiles
3. Create Certificates
4. Run `eas credentials` to upload

### 4. Update eas.json
Update the `submit.production.ios` section:
```json
{
  "appleId": "your-apple-id@email.com",
  "ascAppId": "1234567890"
}
```

## Android Setup

### 1. Create Google Play Console Account
- Go to [Google Play Console](https://play.google.com/console)
- Create a developer account ($25 one-time)

### 2. Create Android App
- Create app with package name: `com.do.app`

### 3. Create Service Account for EAS

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Google Play Android Developer API"
4. Create Service Account:
   - IAM & Admin > Service Accounts > Create
   - Grant "Service Account User" role
   - Create JSON key
5. In Google Play Console:
   - Settings > Developer account > API access
   - Link the service account
   - Grant permissions

### 4. Download Service Account JSON
Save as `do-app/android-service-account.json`

### 5. Update eas.json
```json
{
  "android": {
    "serviceAccountKeyPath": "./android-service-account.json"
  }
}
```

## Build Commands

### Development Build (Simulator)
```bash
eas build --platform ios --profile development
```

### Preview Build (Internal Testing)
```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

### Production Build (App Store)
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Submit to Stores

#### iOS (App Store)
```bash
eas submit --platform ios --profile production --latest
```

#### Android (Google Play)
```bash
eas submit --platform android --profile production --latest
```

## Environment Variables

Create `.env` for production:
```bash
EXPO_PUBLIC_API_URL=https://api.rez.money
EXPO_PUBLIC_DO_WS_URL=wss://api.rez.money/do/stream
```

For EAS builds, add secrets:
```bash
eas secret:create --name EXPO_PUBLIC_API_URL --value https://api.rez.money
```

## Troubleshooting

### iOS Build Failures

**Error: No profiles found**
- Run `eas credentials` and select "Create new profile"
- Or manually create provisioning profile in Apple Developer Portal

**Error: Invalid certificate**
- Delete existing certificates in Apple Developer Portal
- Run build again to regenerate

### Android Build Failures

**Error: No keystore**
- EAS will create one automatically
- Or upload your own keystore via `eas credentials`

**Error: Package name conflict**
- Ensure package name `com.do.app` is unique
- Or change in `app.json`

## Resources

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [iOS Setup Guide](https://docs.expo.dev/app-signing/get-expo-keys/)
- [Android Setup Guide](https://docs.expo.dev/app-signing/keystore-credentials/)
