/**
 * Lazy Import Utilities
 *
 * Defers loading of heavy libraries until first use.
 * On React Native, the JS bundle is a single file, but modules are not
 * evaluated until first require (thanks to inlineRequires: true in metro.config.js).
 * These helpers ensure heavy SDKs only initialize when actually needed.
 */

// Cached references — loaded once, reused after
let _ImagePicker: typeof import('expo-image-picker') | null = null;
let _ExpoCamera: typeof import('expo-camera') | null = null;

/**
 * Lazily load expo-image-picker.
 * Call this inside your button handler, not at the top of the file.
 *
 * Usage:
 *   const ImagePicker = await getImagePicker();
 *   const result = await ImagePicker.launchImageLibraryAsync({...});
 */
export async function getImagePicker() {
  if (!_ImagePicker) {
    _ImagePicker = await import('expo-image-picker');
  }
  return _ImagePicker;
}

/**
 * Lazily load expo-camera.
 */
export async function getExpoCamera() {
  if (!_ExpoCamera) {
    _ExpoCamera = await import('expo-camera');
  }
  return _ExpoCamera;
}

