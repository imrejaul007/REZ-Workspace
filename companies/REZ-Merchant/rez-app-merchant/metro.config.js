const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// SUPPORT ALL PLATFORMS: web is needed per app.config.js platforms: ['ios', 'android', 'web']
// Keep all platforms for full Expo Router web support
config.resolver.platforms = ['ios', 'android', 'web'];

config.resolver.alias = {
  ...config.resolver.alias,
  '@': path.resolve(__dirname),
  // Ensure native draggable-flatlist is used (not web fallback)
  'react-native-draggable-flatlist': 'react-native-draggable-flatlist',
  // Polyfill crypto for React Native (required by some dependencies)
  'crypto': path.resolve(__dirname, 'node_modules/react-native-get-random-values'),
  // @rez/shared-types - built from packages/shared-types
  '@rez/shared-types': path.resolve(__dirname, '../packages/shared-types/dist'),
};

config.transformer = {
  ...config.transformer,
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  // Enable source maps for debugging
  sourceMapUrl: (url) => {
    // Remove .map suffix from source map URLs for web compatibility
    return url.replace('.map', '');
  },
};

// Properly handle ESM resolution for both native and web
// react-native takes precedence, then browser (for web), then main (Node/CJS)
config.resolver.resolverMainFields = ['react-native', 'browser', 'module', 'main'];

// Enable proper sourceExts handling for TypeScript/React Native
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

// Fix: Disable unstable_enablePackageExports to prevent import.meta issues
// This resolves a known Metro bundler issue with package.json exports field
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
