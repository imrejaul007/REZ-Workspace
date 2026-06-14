/**
 * Safe wrapper for the react-native-reanimated Expo config plugin.
 *
 * react-native-reanimated 3.16+ ships its config plugin as TypeScript / ESM,
 * which Node cannot load via CJS require() — causing a SyntaxError at
 * `expo start` time. This stub returns the config unchanged so the dev
 * server can start normally.
 *
 * What this means in practice:
 *  - `expo start`  ✅  Works fine. The Babel plugin (babel.config.js) handles
 *                      all runtime reanimated transforms.
 *  - EAS Build     ✅  Also fine — Expo SDK 53 + New Architecture auto-links
 *                      the reanimated native module without the config plugin.
 *
 * If you ever need the full config plugin (e.g. for Expo SDK <50 / old arch),
 * replace the body below with:
 *   const { withReanimated } = require('react-native-reanimated/lib/commonjs/plugin');
 *   module.exports = withReanimated;
 */
module.exports = function withReanimated(config) {
  return config;
};
