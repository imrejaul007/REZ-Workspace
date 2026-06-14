// Module declarations for untyped npm packages and assets

declare module 'react-native-razorpay' {
  const RazorpayCheckout;
  export default RazorpayCheckout;
}

declare module '@/assets/images/deal.png' {
  const value: number;
  export default value;
}

// Expo package type declarations
// These packages ship their own .d.ts files but moduleResolution: bundler
// can't always resolve them through the exports field.
declare module '@expo/vector-icons';
declare module 'expo-linear-gradient';
declare module 'expo-font';
declare module 'expo-constants';
declare module 'expo-secure-store';
declare module 'expo-web-browser';
declare module 'expo-sharing';
declare module '@expo-google-fonts/poppins';
declare module '@expo-google-fonts/inter';
declare module 'expo-image-picker' {
  export interface ImagePickerAsset {
    uri: string;
    width?: number;
    height?: number;
    fileName?: string;
    type?: string;
    base64?: string;
    expires?: number;
    metadata?: Record<string, string>;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
  }
  export interface ImagePickerOptions {
    mediaTypes?: 'Images' | 'Videos' | 'All' | 'images' | 'videos' | 'mixed' | ('Images' | 'Videos' | 'All' | 'images' | 'videos' | 'mixed')[];
    allowsEditing?: boolean;
    allowsMultipleSelection?: boolean;
    quality?: number;
    selectionLimit?: number;
    videoMaxDuration?: number;
    base64?: boolean;
    aspect?: [number, number];
    exif?: boolean;
  }
  export interface ImagePickerResult {
    canceled: boolean;
    assets: ImagePickerAsset[] | null;
  }
  export interface PermissionResponse {
    status: 'granted' | 'denied' | 'undetermined' | 'limited';
    granted: boolean;
    canAskAgain?: boolean;
    expires?: 'never' | number;
  }
  export const MediaTypeOptions: {
    Images: 'Images';
    Videos: 'Videos';
    All: 'All';
  };
  export function launchImageLibraryAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
  export function launchCameraAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
  export function getCameraPermissionsAsync(): Promise<PermissionResponse>;
  export function getMediaLibraryPermissionsAsync(writeOnly?: boolean): Promise<PermissionResponse>;
  export function requestCameraPermissionsAsync(): Promise<PermissionResponse>;
  export function requestMediaLibraryPermissionsAsync(writeOnly?: boolean): Promise<PermissionResponse>;
  export const useMediaLibraryPermissions: () => PermissionResponse;
  export const useCameraPermissions: () => PermissionResponse;
  export function getPendingResultAsync(): Promise<ImagePickerResult[]>;
  export enum PermissionStatus {
    UNDETERMINED = 'undetermined',
    GRANTED = 'granted',
    DENIED = 'denied',
    LIMITED = 'limited',
  }
  export enum MediaType {
    ALL = 'All',
    IMAGES = 'Images',
    VIDEOS = 'Videos',
  }
}
declare module 'expo-clipboard';
declare module 'expo-haptics';
declare module 'expo-document-picker';
declare module 'expo-image' {
  import { Component, CSSProperties } from 'react';
  import { ImageStyle as RNImageStyle, ViewStyle, StyleProp } from 'react-native';
  export type ImageSource = { uri?: string | null; width?: number; height?: number; scale?: number; bundle?: string } | number;
  export interface ImageProps {
    source?: ImageSource | string | number | { uri: string };
    contentFit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    transition?: number;
    fadeDuration?: number;
    blurRadius?: number;
    onLoadStart?: () => void;
    onLoad?: (event: { source: { width: number; height: number } }) => void;
    onError?: (error: Error) => void;
    onLoadEnd?: () => void;
    style?: StyleProp<RNImageStyle>;
    className?: string;
    placeholder?: string | { uri: string } | { blurhash: string } | null;
    cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
    priority?: 'low' | 'normal' | 'high';
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
    tintColor?: string;
    accessibilityLabel?: string;
    testID?: string;
    recyclingKey?: string;
    portal_tag?: string;
  }
  export class Image extends Component<ImageProps> {
    static prefetch(url: string | string[], options?: { cachePolicy?: 'memory' | 'disk' | 'memory-disk' | 'none' }): Promise<boolean>;
  }
  export { ImageStyle as ImageStyle };
}
declare module 'expo-blur';
declare module 'expo-local-authentication';
declare module 'expo-linking';
declare module 'expo-brightness';
declare module 'expo-media-library';
declare module 'expo-crypto';
declare module 'expo-device';
declare module 'expo-application';
declare module 'expo-store-review';
declare module 'expo-image-manipulator';
declare module '@react-navigation/native';
