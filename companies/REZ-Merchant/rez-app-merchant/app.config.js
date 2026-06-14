module.exports = {
  name: "Rez Merchant App",
  slug: "rez-merchant-app",
  version: "1.0.0",
  description: "Complete merchant management solution for Rez platform. Manage products, orders, analytics, team, and more.",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "rez-merchant",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  platforms: ['ios', 'android', 'web'],
  primaryColor: "#7C3AED",
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#7C3AED"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.rez.merchant",
    buildNumber: "1",
    requireFullScreen: false,
    associatedDomains: ['applinks:merchant.rez.money', 'applinks:rez.money'],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription: "Allow Rez Merchant to use your camera to scan barcodes and take product photos.",
      NSPhotoLibraryUsageDescription: "Allow Rez Merchant to access your photo library to upload product images.",
      NSPhotoLibraryAddUsageDescription: "Allow Rez Merchant to save product images to your photo library.",
      NSBluetoothAlwaysUsageDescription: "REZ Merchant needs Bluetooth to connect to receipt printers.",
      NSBluetoothPeripheralUsageDescription: "REZ Merchant needs Bluetooth to connect to receipt printers.",
      NSLocationWhenInUseUsageDescription: "REZ Merchant uses your location to show nearby store analytics and delivery radius.",
      NSLocationAlwaysAndWhenInUseUsageDescription: "REZ Merchant uses your location to show nearby store analytics and delivery radius.",
      NSUserNotificationsUsageDescription: "REZ Merchant uses notifications to alert you about new orders, low stock, and important updates."
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#7C3AED"
    },
    edgeToEdgeEnabled: true,
    package: "com.rez.merchant",
    versionCode: 1,
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: 'merchant.rez.money' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
    permissions: [
      "CAMERA", "INTERNET", "ACCESS_NETWORK_STATE", "VIBRATE",
      "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "POST_NOTIFICATIONS",
      "RECEIVE_BOOT_COMPLETED", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO",
      "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"
    ]
  },
  web: {
    bundler: "metro",
    favicon: "./assets/images/favicon.png",
    name: "Rez Merchant",
    shortName: "Rez Merchant",
    lang: "en",
    themeColor: "#7C3AED",
    backgroundColor: "#ffffff"
  },
  updates: {
    url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID || '77203219-4cd5-4ca3-9210-1cc89b7456fc'}`,
    enabled: true,
    requestHeaders: {
      'expo-channel-name': process.env.EXPO_PUBLIC_CHANNEL || 'production',
    },
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-camera",
      { cameraPermission: "Allow Rez Merchant to use your camera to scan barcodes and take product photos." }
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Allow Rez Merchant to access your photo library to upload product images.",
        cameraPermission: "Allow Rez Merchant to use your camera to scan barcodes and take product photos."
      }
    ],
    [
      "expo-notifications",
      { icon: "./assets/notification-icon.png", color: "#7C3AED" }
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission: "REZ Merchant uses your location to show nearby store analytics and delivery radius.",
        locationWhenInUsePermission: "REZ Merchant uses your location to show nearby store analytics and delivery radius."
      }
    ]
  ],
  extra: {
    eas: { projectId: "72014a96-74fd-4bef-b678-a23ee3febd1d" },
    router: { appDir: "app" },
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://rez-api-gateway.onrender.com/api',
    apiTimeout: process.env.EXPO_PUBLIC_API_TIMEOUT || '60000',
    socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL || 'https://rez-api-gateway.onrender.com',
    socketTimeout: process.env.EXPO_PUBLIC_SOCKET_TIMEOUT || '5000',
    privacyPolicyUrl: "https://rezmerchant.com/privacy",
    termsOfServiceUrl: "https://rezmerchant.com/terms",
    supportEmail: "support@rezmerchant.com",
  },
};
