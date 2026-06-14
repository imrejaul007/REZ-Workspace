# AssetMind Mobile App Store Submission Guide

**Version:** 1.0.0  
**Last Updated:** June 12, 2026

---

## Overview

This guide covers preparing the AssetMind mobile app for submission to the Apple App Store and Google Play Store.

## Prerequisites

- Apple Developer Account ($99/year)
- Google Play Developer Account ($25 one-time)
- EAS CLI installed (`npm install -g eas-cli`)
- Expo project configured

---

## Step 1: Configure EAS Build

### Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Configure eas.json

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "android": {
        "gradleCommand": ":app:assembleRelease",
        "buildType": "app-bundle"
      },
      "ios": {
        "buildType": "release"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./path-to-service-account.json",
        "track": "production"
      },
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "1234567890"
      }
    }
  }
}
```

---

## Step 2: Environment Configuration

### Production Environment Variables

```bash
# .env.production
EXPO_PUBLIC_API_URL=https://api.assetmind.ai
EXPO_PUBLIC_WS_URL=wss://api.assetmind.ai
APP_ENV=production
```

### Update App Configuration

```json
// app.json
{
  "expo": {
    "name": "AssetMind",
    "slug": "assetmind",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0A1628"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "ai.assetmind.app",
      "infoPlist": {
        "NSCameraUsageDescription": "AssetMind needs camera access for document scanning",
        "NSFaceIDUsageDescription": "Use Face ID for secure login"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0A1628"
      },
      "package": "ai.assetmind.app",
      "permissions": [
        "CAMERA",
        "USE_BIOMETRIC",
        "USE_FINGERPRINT"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

---

## Step 3: Build for iOS

### Local Build (Mac required)

```bash
# Generate native project
npx expo prebuild --platform ios

# Build with Xcode
cd ios
xcodebuild -workspace AssetMind.xcworkspace \
  -scheme AssetMind \
  -configuration Release \
  -archivePath build/AssetMind.xcarchive \
  archive

# Export for submission
xcodebuild -exportArchive \
  -archivePath build/AssetMind.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath output
```

### EAS Build (Recommended)

```bash
# Build for iOS simulator
eas build --platform ios --profile preview

# Build for production
eas build --platform ios --profile production
```

### Apple ID Setup

1. Create App Store Connect API Key
2. Go to: https://appstoreconnect.apple.com/access/api
3. Create a new key with "App Manager" role
4. Download the .p8 file
5. Note your Key ID and Issuer ID

```bash
# Configure EAS with API Key
eas credentials --platform ios
```

---

## Step 4: Build for Android

### Local Build

```bash
# Generate native project
npx expo prebuild --platform android

# Build release APK
cd android
./gradlew assembleRelease

# Build AAB (for Play Store)
./gradlew bundleRelease
```

### EAS Build

```bash
# Build for internal testing
eas build --platform android --profile preview

# Build for production
eas build --platform android --profile production
```

### Google Play Console Setup

1. Create a new app in Google Play Console
2. Get the JSON key file from:
   - Setup → API access → Service accounts
   - Create new Google Cloud project
   - Download JSON key
3. Upload key to EAS or use locally

---

## Step 5: App Store Screenshots

### iOS App Store (Required)

| Size | Device | Count |
|------|--------|-------|
| 6.7" (1290 x 2796) | iPhone 14 Pro Max | 3-10 |
| 6.5" (1284 x 2778) | iPhone 11 Pro Max, XS Max | 3-10 |
| 5.5" (1242 x 2208) | iPhone 8 Plus | 3-10 |
| 12.9" (2048 x 2732) | iPad Pro | 3-10 |

### Google Play Store

| Size | Required |
|------|----------|
| Phone screenshots (16:9 or 9:16) | 2 minimum, 8 maximum |
| 7" tablet screenshots | Optional |
| 10" tablet screenshots | Optional |
| Feature graphic (1024 x 500) | Required |
| App icon (512 x 512) | Required |

---

## Step 6: App Metadata

### App Information

```json
{
  "name": "AssetMind",
  "tagline": "AI-Powered Investment Intelligence",
  "description": "Track your portfolio, get AI-powered recommendations, and stay ahead of market trends with AssetMind - the world's most advanced financial intelligence platform.",
  "keywords": "finance, investment, portfolio, stocks, crypto, trading, AI, market",
  "category": "Finance",
  "subcategory": "Investing"
}
```

### Content Rating

Complete the questionnaire:
- Cartoons/Fantasy Violence: No
- Horror/Fear Themes: No
- Medical/Treatment Information: No
- Profanity/Crude Humor: No
- User-Generated Content: No
- Gambling: Simulated only
- Alcohol/Tobacco/Drugs: No
- Sexual Content/Nudity: No
- Violence/Blood: No

---

## Step 7: Submit to App Store

### Submit with EAS

```bash
# Submit to iOS
eas submit --platform ios --latest

# Submit to Android
eas submit --platform android --latest

# Submit to both
eas submit --platform all --latest
```

### Manual Submission (iOS)

1. Go to App Store Connect
2. Select your app
3. Go to the "App Privacy" section and complete the questionnaire
4. Upload screenshots
5. Fill in metadata
6. Select build
7. Submit for review

### Manual Submission (Android)

1. Go to Google Play Console
2. Select your app
3. Go to "Production" → "Create Release"
4. Upload AAB file
5. Complete store listing
6. Complete content rating
7. Set up pricing and distribution
8. Submit for review

---

## Review Process

### Typical Review Times
- **iOS**: 24-48 hours (can take up to 7 days)
- **Android**: 2-7 days (can take longer for complex apps)

### Common Rejection Reasons

1. **Incomplete account information**
   - Provide complete developer info
   - Add privacy policy URL
   - Include support email

2. **Login issues**
   - Test with demo account
   - Ensure all buttons work
   - Check error handling

3. **Missing information**
   - Complete all metadata fields
   - Upload required screenshots
   - Add privacy policy

---

## Post-Launch

### Monitoring

```bash
# Check app status
eas submit --platform ios --latest --wait

# Monitor crashes
# Set up Crashlytics or Sentry
```

### Updates

```bash
# Build and submit update
eas build --platform ios --profile production
eas submit --platform ios --latest
```

---

## Checklist

### Pre-Submission

- [ ] All screens implemented and functional
- [ ] Privacy policy URL created and hosted
- [ ] Support email configured
- [ ] Screenshots created for all sizes
- [ ] App icon and splash screen ready
- [ ] Test flight/production build successful
- [ ] No console errors or crashes
- [ ] All links working

### App Store Connect (iOS)

- [ ] App record created
- [ ] Privacy questionnaire completed
- [ ] Screenshots uploaded
- [ ] Metadata filled in
- [ ] Category selected
- [ ] Content rating completed
- [ ] Build selected
- [ ] Pricing set
- [ ] Submission submitted

### Google Play Console (Android)

- [ ] App created
- [ ] Store listing completed
- [ ] Graphics uploaded
- [ ] Content rating completed
- [ ] Pricing set
- [ ] AAB uploaded
- [ ] Release created

---

## Support

- iOS: [App Store Connect Help](https://developer.apple.com/app-store-connect/)
- Android: [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- Expo: [EAS Documentation](https://docs.expo.dev/eas/)

---

*Generated by Claude Code*  
*Last updated: June 12, 2026*