// Web shim for react-native-maps
// react-native-maps uses UIManager (native only) and cannot run on web or in
// Expo Router's SSR renderer. This stub returns null/no-op placeholders so
// the bundler succeeds — actual map features are not available on web.
import React from 'react';

const Noop = () => null;

export const MapView = Noop;
export const Marker = Noop;
export const Callout = Noop;
export const CalloutSubview = Noop;
export const Circle = Noop;
export const Overlay = Noop;
export const Polygon = Noop;
export const Polyline = Noop;
export const Heatmap = Noop;
export const PROVIDER_DEFAULT = null;
export const PROVIDER_GOOGLE = 'google';
export const MAP_TYPES = {
  STANDARD: 'standard',
  SATELLITE: 'satellite',
  HYBRID: 'hybrid',
  TERRAIN: 'terrain',
  NONE: 'none',
  MUTEDSTANDARD: 'mutedStandard',
};
export const AnimatedRegion = class {
  constructor(region) { Object.assign(this, region); }
  timing() { return { start: () => {}, stop: () => {} }; }
  spring() { return { start: () => {}, stop: () => {} }; }
};
export const enableLatestRenderer = () => {};

export default MapView;
