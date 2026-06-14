import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const CLOUDINARY_API = 'https://api.cloudinary.com/v1_1';
const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '';

export interface UploadOptions {
  folder?: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  createdAt: string;
}

export interface DeleteResult {
  result: 'ok' | 'not_found' | 'error';
  message?: string;
}

/**
 * Compress and resize an image before upload
 */
export async function compressImage(
  uri: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {}
): Promise<string> {
  const { width = 1200, height, quality = 0.8, format = 'webp' } = options;

  const manipOptions: Parameters<typeof manipulateAsync>[1][0] = {
    resize: {
      width,
      ...(height ? { height } : {}),
    },
    compress: quality * 100,
    format: format === 'webp' ? SaveFormat.WEBP : format === 'jpg' ? SaveFormat.JPEG : SaveFormat.PNG,
  };

  const result = await manipulateAsync(uri, [manipOptions]);
  return result.uri;
}

/**
 * Pick image from gallery with optional compression
 */
export async function pickImage(options: UploadOptions = {}): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Media library permission denied');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const originalUri = result.assets[0].uri;

  // Compress if options specified
  if (options.width || options.quality) {
    return compressImage(originalUri, {
      width: options.width,
      height: options.height,
      quality: options.quality,
      format: options.format,
    });
  }

  return originalUri;
}

/**
 * Take photo with camera
 */
export async function takePhoto(options: UploadOptions = {}): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Camera permission denied');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 1,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const originalUri = result.assets[0].uri;

  if (options.width || options.quality) {
    return compressImage(originalUri, {
      width: options.width,
      height: options.height,
      quality: options.quality,
      format: options.format,
    });
  }

  return originalUri;
}

/**
 * Upload a single image to Cloudinary
 */
export async function uploadImage(
  uri: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { folder = 'general', width = 1200, quality = 0.8, format = 'webp', onProgress } = options;

  if (!CLOUD_NAME) {
    throw new Error('Cloudinary cloud name not configured. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME');
  }

  // Compress image first
  let imageUri = uri;
  if (uri.startsWith('file://') || uri.startsWith('content://')) {
    try {
      imageUri = await compressImage(uri, { width, quality, format });
    } catch {
      // Use original if compression fails
      imageUri = uri;
    }
  }

  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Build Cloudinary upload URL
  const uploadUrl = `${CLOUDINARY_API}/${CLOUD_NAME}/image/upload`;

  // Create form data
  const formData = new FormData();
  formData.append('file', `data:image/${format === 'jpg' ? 'jpeg' : format};base64,${base64}`);
  formData.append('folder', folder);
  formData.append('transformation', `w_${width},q_${Math.round(quality * 100)},f_${format}`);
  formData.append('eager', `w_400,h_400,c_fill,f_${format}|w_800,h_800,c_limit,f_${format}`);
  formData.append('eager_async', 'true');
  formData.append('timestamp', Date.now().toString());

  // Simulate progress for base64 uploads (Cloudinary API doesn't support direct progress)
  onProgress?.(50);

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    onProgress?.(90);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Upload failed: ${response.status}`);
    }

    const data = await response.json();

    onProgress?.(100);

    return {
      publicId: data.public_id,
      url: data.url,
      secureUrl: data.secure_url,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes,
      createdAt: data.created_at,
    };
  } catch (error) {
    onProgress?.(0);
    throw error;
  }
}

/**
 * Upload multiple images to Cloudinary
 */
export async function uploadMultiple(
  uris: string[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const total = uris.length;

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];

    // Individual progress within batch
    const result = await uploadImage(uri, {
      ...options,
      onProgress: (progress) => {
        const batchProgress = ((i + progress / 100) / total) * 100;
        options.onProgress?.(batchProgress);
      },
    });

    results.push(result);
  }

  return results;
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<DeleteResult> {
  if (!CLOUD_NAME) {
    throw new Error('Cloudinary cloud name not configured. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME');
  }

  // Note: In production, this should go through your backend to keep API secret secure
  // This direct API call only works if unsigned uploads are allowed
  const deleteUrl = `${CLOUDINARY_API}/${CLOUD_NAME}/image/destroy`;

  try {
    const response = await fetch(deleteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_id: publicId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        result: 'error',
        message: error.error?.message || `Delete failed: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      result: data.result,
      message: data.message,
    };
  } catch (error) {
    return {
      result: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get public ID from Cloudinary URL
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!url.includes('cloudinary.com')) {
    return null;
  }

  // Pattern: .../upload/v1234567890/folder/public_id.format
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match ? match[1] : null;
}

/**
 * Get optimized URL for specific size
 */
export function getOptimizedUrl(
  url: string,
  options: { width?: number; height?: number; format?: 'webp' | 'jpg' } = {}
): string {
  if (!url.includes('cloudinary.com')) {
    return url;
  }

  const transformations: string[] = [];

  if (options.width) {
    transformations.push(`w_${options.width}`);
  }
  if (options.height) {
    transformations.push(`h_${options.height}`);
  }
  if (options.format) {
    transformations.push(`f_${options.format}`);
  }

  if (transformations.length === 0) {
    return url;
  }

  const transformString = transformations.join(',');
  return url.replace('/upload/', `/upload/${transformString}/`);
}

/**
 * Upload product images (pre-configured for products)
 */
export async function uploadProductImage(
  uri: string,
  productId: string,
  index?: number,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const folder = `products/${productId}`;
  const filename = index !== undefined ? `image_${index}` : `image_${Date.now()}`;

  return uploadImage(uri, {
    folder,
    width: 1200,
    quality: 0.8,
    format: 'webp',
    onProgress,
  });
}

/**
 * Upload profile/avatar image (pre-configured for profiles)
 */
export async function uploadProfileImage(
  uri: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  return uploadImage(uri, {
    folder: `profiles/${userId}`,
    width: 400,
    height: 400,
    quality: 0.9,
    format: 'jpg',
    onProgress,
  });
}
