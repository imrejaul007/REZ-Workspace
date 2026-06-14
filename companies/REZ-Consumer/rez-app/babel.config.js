module.exports = function (api) {
  api.cache(true);

  const isWeb = process.env.EXPO_OS === 'web' || process.env.PLATFORM === 'web';

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Replace import.meta with globalThis.__ExpoImportMetaRegistry
          // (set up by expo/src/winter/runtime) so Metro's CJS web bundle
          // doesn't throw "Cannot use 'import.meta' outside a module"
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: [
      // NOTE: react-native-reanimated/plugin MUST be last
      'react-native-reanimated/plugin',
    ],
  };
};
