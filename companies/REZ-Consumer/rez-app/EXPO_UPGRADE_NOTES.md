# Expo SDK Dependency Audit — Consumer App (Nuqta)

**Audit Date:** March 2026
**Current SDK Version:** Expo 53.0.26
**React Native Version:** 0.79.6

## Overview

This audit covers all Expo SDK packages, React Native dependencies, and plugins used in the consumer application. The app is well-maintained with mostly pinned or tilde-locked versions.

## Expo SDK (v53) — Status: GOOD

All expo-* packages are compatible with SDK 53 and follow recommended versioning.

### Core Packages
- `expo` ~53.0.26 ✓
- `expo-router` ~5.1.11 ✓ (matches Expo 53)
- `expo-modules-core` ~2.4.4 ✓

### Commonly Used Packages
- `expo-camera` ~16.1.11 ✓
- `expo-image-picker` ~16.1.4 ✓
- `expo-file-system` ~18.1.9 ✓
- `expo-location` ~18.1.6 ✓
- `expo-notifications` ~0.31.5 ✓
- `expo-media-library` ~17.1.7 ✓
- `expo-device` ~7.1.4 ✓
- `expo-constants` ~17.1.8 ✓
- `expo-sharing` ~13.1.5 ✓
- `expo-document-picker` ~13.1.6 ✓
- `expo-av` ~15.1.7 ✓
- `expo-linking` ~7.1.7 ✓

## React Native & Navigation — Status: GOOD

- `react-native` 0.79.6 ✓ (correct for Expo 53)
- `react` 19.0.0 ✓
- `react-native-web` ^0.20.0 ✓
- `@react-navigation/*` ^7.x ✓ (all pinned correctly)

## Animation & Performance

- `react-native-reanimated` ~3.17.4 ✓
  - **CRITICAL:** Babel plugin is now configured in `babel.config.js`
  - Must be the **last** plugin in the plugins array
  - Required for Reanimated to work correctly with Expo

## Native Plugins & Community Packages

### React Native Community
- `@react-native-async-storage/async-storage` 2.1.2 ✓
- `@react-native-community/datetimepicker` 8.3.0 ✓
- `@react-native-community/netinfo` ^11.4.1 ✓
- `@react-native-community/slider` 4.5.5 ✓

### Third-Party Native Modules
- `@stripe/stripe-react-native` 0.40.0 ✓ (compatible with RN 0.79)
- `react-native-maps` ~1.20.1 ✓ (compatible with RN 0.79)
- `react-native-gesture-handler` ~2.24.0 ✓
- `react-native-screens` ~4.11.1 ✓
- `react-native-safe-area-context` 5.4.0 ✓
- `react-native-qrcode-svg` ^6.3.15 ✓
- `react-native-webview` 13.13.5 ✓

### Firebase & Monitoring
- `@react-native-firebase/app` ^21.6.1 ✓
- `@react-native-firebase/analytics` ^21.6.1 ✓
- `@sentry/react-native` ~6.15.0 ✓ (updated for RN 0.79)

## Icon & Font Packages

- `@expo/vector-icons` ^14.1.0 ✓
- `@expo-google-fonts/inter` ^0.4.2 ✓
- `@expo-google-fonts/poppins` ^0.4.1 ✓

## Testing & Development

- `jest-expo` ~53.0.5 ✓ (matches Expo SDK 53)
- `@testing-library/react-native` ^13.3.3 ✓
- `eslint-config-expo` ~9.2.0 ✓
- TypeScript ~5.8.3 ✓

## Known Issues & Notes

### 1. Babel Configuration (FIXED)
- **Issue:** `react-native-reanimated/plugin` was missing from babel.config.js
- **Impact:** Reanimated animations may not work optimally without plugin integration
- **Fix:** Added plugin to babel.config.js (must be LAST in plugins array)

### 2. Peer Dependencies
All peer dependencies are satisfied:
- `react-native-reanimated` requires `react-native` 0.71+ ✓
- `@react-navigation/*` requires `react-native` ^0.64.0 ✓
- Firebase packages compatible with current versions ✓

### 3. Lock File Status
- **package-lock.json** should be committed
- Run `npm ci` (not `npm install`) in CI/production environments
- Local development can use `npm install` for flexibility

## Upgrade Path (If Future Upgrade Needed)

### To Expo 54 (Not Now)
1. Update `expo` to ~54.0.x
2. Verify all `expo-*` packages have compatible versions for SDK 54
3. Check React Native version requirement (likely 0.80+ or 0.81+)
4. Run `npm install` and test thoroughly
5. Review breaking changes in each package's CHANGELOG

### Version Alignment Tips
- Always check https://docs.expo.dev/versions/ for SDK version requirements
- Use `npx expo-doctor` to check for compatibility issues (after Expo CLI install)
- Most Expo packages follow SDK versioning: expo-package@~X.Y.Z matches SDK X

## Testing Checklist (Before Production Deployment)

- [ ] Run `npm install` and verify no errors
- [ ] Run type check: `npx tsc --noEmit`
- [ ] Test on iOS device/simulator with Reanimated animations
- [ ] Test on Android device/emulator with Reanimated animations
- [ ] Verify Firebase initialization (analytics & app)
- [ ] Test camera and location permissions
- [ ] Test notifications on both platforms
- [ ] Check offline functionality (netinfo)
- [ ] Verify Stripe integration
- [ ] Test QR code generation (qrcode-svg)

## Recommendations

1. **No immediate upgrades needed** — all packages are compatible and up-to-date for Expo 53
2. **Monitor for critical updates** — watch for security patches in Firebase, Stripe, and Sentry
3. **Keep babel.config.js as-is** — the Reanimated plugin placement is critical
4. **Test thoroughly after any package update** — especially animations and native modules
5. **Use npm ci in CI/CD** — ensures lock file consistency across environments

## Running npm install Safely

```bash
# Local development (flexible)
npm install

# CI/production (deterministic)
npm ci

# After making dependency changes
npm install --package-lock-only
npm ci  # Then verify
```

---

**Next Review:** March 2027 or when Expo SDK 55+ is released
