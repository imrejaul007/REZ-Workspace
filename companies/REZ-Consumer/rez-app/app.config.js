// Dynamic Expo config — imports brand constants for easy rebranding
// Deployment-specific identifiers (slug, bundleIdentifier, package, merchantIdentifier)
// are left hardcoded — they require manual store/infra changes to rebrand.

const fs = require('fs');
const path = require('path');

const BRAND_NAME = 'Rez';

// ─── Production debug-flag guard ──────────────────────────────────────────────
// Warn loudly at build/config-load time when debug flags that should never
// ship to production are still enabled.  We do NOT modify .env here because
// it is environment-specific; instead we surface a clear console warning so
// that CI / the developer notices before a production build is published.
const _env = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';
const _isProduction = _env === 'production';
const _debugFlagsOn =
  process.env.EXPO_PUBLIC_DEBUG_MODE === 'true' ||
  process.env.EXPO_PUBLIC_SHOW_DEV_TOOLS === 'true' ||
  (process.env.EXPO_PUBLIC_LOG_LEVEL || '').toLowerCase() === 'debug';

if (_isProduction && _debugFlagsOn) {
  // Log to stdout (not stderr) — EAS treats stderr output as config failure
  console.log('[WARNING] Debug flags are ENABLED in a production build. Set EXPO_PUBLIC_DEBUG_MODE=false before App Store release.');
}
// ──────────────────────────────────────────────────────────────────────────────

// Firebase plugin requires google-services.json (Android) / GoogleService-Info.plist (iOS).
// Skip plugin when missing to prevent instant crash on app launch.
const hasFirebaseAndroid = fs.existsSync(path.join(__dirname, 'google-services.json'));
const hasFirebaseIos = fs.existsSync(path.join(__dirname, 'GoogleService-Info.plist'));
const hasFirebaseConfig = hasFirebaseAndroid || hasFirebaseIos;

if (!hasFirebaseIos) {
  // Log to stdout (not stderr) — EAS treats stderr output as config failure
  console.log('[WARNING] GoogleService-Info.plist is MISSING. iOS Firebase/FCM push notifications will be DISABLED on this build. Add GoogleService-Info.plist to the project root before building for the App Store.');
}
if (!hasFirebaseAndroid) {
  console.log('[WARNING] google-services.json is MISSING. Android Firebase/FCM push notifications will be DISABLED on this build. Add google-services.json to the project root before building for the Play Store.');
}

module.exports = {
  expo: {
    name: BRAND_NAME,
    slug: 'rez', // App store identifier
    version: process.env.APP_VERSION || '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'rezapp', // Deep link scheme — must match EXPO_PUBLIC_DEEP_LINK_SCHEME=rezapp
    // Explicit entry point: prevents Metro from falling back to expo/AppEntry.js
    // which requires a root App.tsx. Expo Router apps use expo-router/entry instead.
    entryPoint: 'expo-router/entry',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    // PRODUCTION OPTIMIZATION: Enable Hermes for better performance
    ios: {
      supportsTablet: true,
      userInterfaceStyle: 'light',
      bundleIdentifier: 'money.rez.app', // App Store identifier
      buildNumber: process.env.BUILD_NUMBER || '1',
      googleServicesFile: './GoogleService-Info.plist',
      // PRODUCTION FIX: Enable Hermes bytecode compilation for faster startup
      hermesEnabled: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: `${BRAND_NAME} needs camera access to scan QR codes for store payments`,
        NSLocationWhenInUseUsageDescription: `${BRAND_NAME} needs your location to show nearby stores and offers`,
        NSPhotoLibraryUsageDescription: `${BRAND_NAME} needs photo access to upload profile pictures and bills`,
        NSLocationAlwaysAndWhenInUseUsageDescription: `${BRAND_NAME} needs your location to show nearby stores and offers`,
        NSMicrophoneUsageDescription: `${BRAND_NAME} needs microphone access for video features`,
        NSPhotoLibraryAddUsageDescription: `${BRAND_NAME} needs permission to save media to your photo library`,
        NSFaceIDUsageDescription: `${BRAND_NAME} uses Face ID to securely authenticate your identity`,
      },
    },
    android: {
      googleServicesFile: './google-services.json',
      userInterfaceStyle: 'light',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#1a3a52',
      },
      edgeToEdgeEnabled: true,
      // PRODUCTION FIX: Enable Hermes bytecode compilation for faster startup
      hermesEnabled: true,
      package: 'money.rez.app', // Play Store identifier
      versionCode: parseInt(process.env.VERSION_CODE || '1'),
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'https', host: 'rezapp.in', pathPrefix: '/' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'https', host: 'menu.rez.money', pathPrefix: '/' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'https', host: 'now.rez.money', pathPrefix: '/' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'https', host: 'adsqr.rezapp.com', pathPrefix: '/' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        // Room QR Deep Linking - Hotel Services
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'https', host: 'room.rez.money', pathPrefix: '/' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        // Custom scheme for app-to-app linking
        {
          action: 'VIEW',
          autoVerify: false,
          data: [{ scheme: 'rez', host: 'room' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      permissions: [
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.CAMERA',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.VIBRATE',
        'android.permission.POST_NOTIFICATIONS',
      ],
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    updates: {
      url: `https://u.expo.dev/${process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'cf84e3b3-4a96-4c9b-a438-465c29fbf720'}`,
      enabled: true,
      fallbackToCacheTimeout: 3000,
      requestHeaders: {
        'expo-channel-name': process.env.EXPO_PUBLIC_CHANNEL || 'production',
      },
    },
    runtimeVersion: process.env.EXPO_RUNTIME_VERSION || '1.0.0',
    plugins: [
      // react-native-reanimated 3.16+ ships a TypeScript/ESM config plugin that
      // Node's CJS require() cannot parse. Use a local stub instead — the Babel
      // plugin (babel.config.js) handles all runtime transforms for expo start,
      // and Expo SDK 53 New Architecture auto-links the native module for builds.
      './plugins/reanimated',
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#1a3a52',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: `Allow ${BRAND_NAME} to use your camera for QR code scanning`,
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: `Allow ${BRAND_NAME} to use your location to find nearby stores and offers`,
        },
      ],
      // expo-notifications requires Firebase/FCM on Android — skip when google-services.json missing
      ...(hasFirebaseConfig
        ? [
            [
              'expo-notifications',
              {
                color: '#1a3a52',
              },
            ],
          ]
        : []),
      [
        'expo-image-picker',
        {
          photosPermission: `Allow ${BRAND_NAME} to access your photos for profile pictures and bill uploads`,
        },
      ],
      // Stripe plugin — only include if the package is installed
      ...((() => {
        try { require.resolve('@stripe/stripe-react-native'); return true; } catch { return false; }
      })() ? [[
        '@stripe/stripe-react-native',
        {
          merchantIdentifier: 'merchant.com.rez.app',
          enableGooglePay: true,
        },
      ]] : []),
      // Firebase plugin — only apply when google-services.json exists (prevents Android crash)
      ...(hasFirebaseConfig
        ? [
            [
              '@react-native-firebase/app',
              {
                android: { googleServicesFile: './google-services.json' },
                ios: { googleServicesFile: './GoogleService-Info.plist' },
              },
            ],
          ]
        : []),
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'cf84e3b3-4a96-4c9b-a438-465c29fbf720',
        schemes: ['rezapp', 'https://rezapp.com', 'https://now.rez.money', 'https://adsqr.rezapp.com'],
      },
      router: {
        origin: false,
      },
    },
  },
};
