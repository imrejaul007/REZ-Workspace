# Expo SDK 53 → 56 Upgrade Guide

## Current State
- **Current SDK:** 53.0.27
- **Target SDK:** 56.0.x
- **Status:** Manual upgrade required

## Why Upgrade?
- Latest Expo features and performance improvements
- Security patches and bug fixes
- Better React Native 0.80+ compatibility
- New Expo Router features

## Recommended Upgrade Path

### Option 1: Interactive Web Upgrade (Recommended)
1. Go to https://codeshell.dev/expo-upgrade
2. Enter your project path: `/Users/rejaulkarim/Documents/ReZ Full App/REZ-Consumer/rez-app`
3. Follow the interactive prompts
4. This handles all package updates automatically

### Option 2: Manual Upgrade

#### Step 1: Update Expo CLI
```bash
npm install expo@latest @expo/cli@latest --legacy-peer-deps
```

#### Step 2: Run Pre-Upgrade Check
```bash
npx expo-doctor@latest
```

#### Step 3: Update All Expo Packages
```bash
# Update all expo-* packages to latest compatible versions
npx expo install --fix
```

#### Step 4: Update React Native
```bash
npx react-native upgrade
```

#### Step 5: Update Native Modules
```bash
# Update Firebase packages
npm install @react-native-firebase/app@latest @react-native-firebase/auth@latest @react-native-firebase/analytics@latest --legacy-peer-deps

# Update Sentry
npm install @sentry/react-native@latest --legacy-peer-deps
```

#### Step 6: Verify with Expo Doctor
```bash
npx expo-doctor@latest
```

## Package Updates Required

### Critical Updates (Expo SDK 56)
| Package | Current | Target |
|---------|---------|--------|
| expo | ^53.0.27 | ^56.0.8 |
| @expo/cli | ^0.24.24 | ^0.24.x |
| expo-router | ~5.1.11 | ~5.2.x |
| expo-modules-core | ~2.5.0 | ~2.2.x |
| @expo/metro-runtime | ~5.0.5 | ~5.2.x |

### Recommended Updates
| Package | Current | Target |
|---------|---------|--------|
| @sentry/react-native | ~8.13.0 | ~8.13.0 (current) |
| @react-native-firebase/* | ^21.14.0 | ^21.14.0 (current) |

### Expo Packages to Update
```bash
expo install \
  expo-av \
  expo-blur \
  expo-brightness \
  expo-camera \
  expo-clipboard \
  expo-constants \
  expo-crypto \
  expo-dev-client \
  expo-device \
  expo-document-picker \
  expo-file-system \
  expo-font \
  expo-haptics \
  expo-image \
  expo-image-manipulator \
  expo-image-picker \
  expo-linear-gradient \
  expo-linking \
  expo-local-authentication \
  expo-location \
  expo-media-library \
  expo-notifications \
  expo-secure-store \
  expo-sharing \
  expo-speech \
  expo-splash-screen \
  expo-status-bar \
  expo-store-review \
  expo-symbols \
  expo-system-ui \
  expo-updates \
  expo-web-browser
```

## Breaking Changes to Handle

### 1. React Native 0.80+ Changes
- New architecture is now default
- May need to update native code for TurboModules
- Bridge modules are deprecated

### 2. Expo Router 5.x Changes
- Review file-based routing changes
- Update layout patterns if needed

### 3. TypeScript Changes
- Expo SDK 56 requires TypeScript 5.7+
- Update if needed: `npm install typescript@latest`

## Testing After Upgrade

### 1. Run TypeScript Check
```bash
npx tsc --noEmit
```

### 2. Build iOS
```bash
npx expo run:ios --no-build-cache
```

### 3. Build Android
```bash
npx expo run:android --no-build-cache
```

### 4. Test Key Flows
- [ ] App launch
- [ ] Authentication
- [ ] Navigation between screens
- [ ] API calls
- [ ] Push notifications
- [ ] Deep linking

## Rollback Plan
If upgrade fails:
```bash
git checkout HEAD -- package.json package-lock.json
npm install --legacy-peer-deps
```

## Estimated Time
- **Prep & Planning:** 1-2 hours
- **Execution:** 2-4 hours
- **Testing:** 2-4 hours
- **Total:** 5-10 hours

## Need Help?
- Expo Docs: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/
- Expo Forums: https://forums.expo.dev/
- Discord: https://discord.gg/expo