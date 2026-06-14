/**
 * FlexSense Responsive Utilities
 * Provides device-aware helpers for truly fluid UI across all screen sizes
 */

import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Device size breakpoints
export const DEVICE_WIDTHS = {
  SMALL: 360,     // Galaxy A series, iPhone SE
  MEDIUM: 414,    // most Androids, iPhone standard
  LARGE: 500,     // iPhone Pro Max, Galaxy Ultra
};

export const isSmallDevice = SCREEN_W < DEVICE_WIDTHS.SMALL;
export const isMediumDevice = SCREEN_W >= DEVICE_WIDTHS.SMALL && SCREEN_W < DEVICE_WIDTHS.MEDIUM;
export const isLargeDevice = SCREEN_W >= DEVICE_WIDTHS.MEDIUM;

/**
 * Width percentage utility — converts percentage to pixels
 * @param pct - percentage of screen width (0-100)
 * @returns pixel value
 */
export const wp = (pct: number): number => Math.round((SCREEN_W * pct) / 100);

/**
 * Height percentage utility — converts percentage to pixels
 * @param pct - percentage of screen height (0-100)
 * @returns pixel value
 */
export const hp = (pct: number): number => Math.round((SCREEN_H * pct) / 100);

/**
 * Responsive font size based on design baseline
 * @param baseSize - font size for iPhone 14 (390px width)
 * @returns responsive font size
 */
export const responsiveFontSize = (baseSize: number): number => {
  const DESIGN_BASE = 390;
  return Math.round(baseSize * (SCREEN_W / DESIGN_BASE));
};

/**
 * Responsive spacing/padding
 * @param baseValue - value for iPhone 14 (390px width)
 * @returns responsive spacing
 */
export const responsiveSpacing = (baseValue: number): number => {
  const DESIGN_BASE = 390;
  return Math.round(baseValue * (SCREEN_W / DESIGN_BASE));
};

/**
 * Get responsive card width for grid layout
 * @param numColumns - number of columns
 * @param containerPadding - total horizontal padding of container
 * @param gap - gap between cards
 * @returns card width in pixels
 */
export const getResponsiveCardWidth = (
  numColumns: number,
  containerPadding: number = 36,
  gap: number = 14
): number => {
  return (SCREEN_W - containerPadding - gap * (numColumns - 1)) / numColumns;
};

/**
 * Get responsive image height (maintains aspect ratio)
 * @param baseHeight - height for iPhone 14 (390px width)
 * @returns responsive height
 */
export const responsiveImageHeight = (baseHeight: number): number => {
  const DESIGN_BASE = 390;
  return Math.round(baseHeight * (SCREEN_W / DESIGN_BASE));
};

/**
 * Get safe modal height (doesn't overflow screen)
 * @param maxPercent - max height as % of screen (default 85)
 * @returns safe max height
 */
export const responsiveModalHeight = (maxPercent: number = 85): number => {
  return Math.round((SCREEN_H * maxPercent) / 100);
};

export const SCREEN_HEIGHT = SCREEN_H;
export const SCREEN_WIDTH = SCREEN_W;

/**
 * Clamp a value between min and max for responsive behavior
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};
