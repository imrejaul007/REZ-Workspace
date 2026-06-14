/**
 * React Native StyleSheet Type Augmentation
 *
 * This file fixes TypeScript strictness issues with React Native's StyleSheet.create.
 * In strict mode, StyleSheet.create returns styles that are unions of ViewStyle | TextStyle | ImageStyle,
 * but components expect specific style types.
 *
 * This augmentation allows StyleSheet.create to return properly typed styles.
 */

import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

// Extend the StyleSheet module with a fixed version
declare module 'react-native' {
  interface StyleSheet {
    /**
     * Fixed create method that returns properly typed styles.
     * Each style object is now typed based on its actual properties.
     */
    create<Styles extends StyleSheet.NamedStyles<Styles>>(
      styles: Styles | { [key: string]: ViewStyle | TextStyle | ImageStyle | undefined }
    ): Styles;
  }
}

/**
 * Helper type to convert a union style object to a union of proper typed styles.
 * This ensures View styles use ViewStyle, Text styles use TextStyle, etc.
 */
export type StyledView<T extends Record<string, ViewStyle | TextStyle | ImageStyle>> = {
  [K in keyof T]: T[K] extends ViewStyle ? T[K] : never;
};

export type StyledText<T extends Record<string, ViewStyle | TextStyle | ImageStyle>> = {
  [K in keyof T]: T[K] extends TextStyle ? T[K] : never;
};

// Re-export for convenience
export type { ViewStyle, TextStyle, ImageStyle };
