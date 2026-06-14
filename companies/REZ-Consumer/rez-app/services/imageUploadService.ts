// Image Upload Service
// Handles image uploads to backend (Cloudinary)

import { Platform } from 'react-native';
import { FILE_SIZE_LIMITS, UPLOAD_TIMEOUTS, formatFileSize } from '@/utils/fileUploadConstants';
import { getAuthToken } from '@/utils/authStorage';
import apiClient from './apiClient';

const UPLOAD_TIMEOUT = UPLOAD_TIMEOUTS.IMAGE; // Use centralized timeout

interface UploadResult {
  success: boolean;
  avatarUrl?: string;
  error?: string;
}

export const uploadProfileImage = async (imageUri: string, token?: string): Promise<UploadResult> => {
  const startTime = Date.now();
  
  try {
    // Try to get token from parameter first, then secure auth storage
    let authToken = token;
    if (!authToken) {
      authToken = (await getAuthToken()) ?? undefined;
    }

    if (!authToken) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Create FormData
    const formData = new FormData();

    // Handle image file based on platform
    const filename = imageUri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    if (Platform.OS === 'web') {
      // On web, imageUri is a blob URL, we need to fetch it first
      const blob = await fetch(imageUri).then(r => r.blob());

      // Check file size using centralized limit
      if (blob.size > FILE_SIZE_LIMITS.MAX_IMAGE_SIZE) {
        return {
          success: false,
          error: `Image too large. Please select an image smaller than ${formatFileSize(FILE_SIZE_LIMITS.MAX_IMAGE_SIZE)}.`
        };
      }
      
      formData.append('avatar', blob, filename);
    } else {
      // On mobile (React Native)
      // CA-SEC-FIX: Proper typing for React Native file object instead of `as any`
      formData.append('avatar', {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        name: filename,
        type,
      } as unknown as Blob);
    }


    const data = await apiClient.post<{ profile?: { avatar?: string }; avatar?: string }>(
      '/user/auth/upload-avatar',
      formData,
      { timeout: UPLOAD_TIMEOUT }
    );

    const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!data.success) {
      // API returns { success: false, message: string }
      const msg = (data as { message?: string }).message;
      return {
        success: false,
        error: msg || 'Upload failed'
      };
    }

    return {
      success: true,
      avatarUrl: data.data?.profile?.avatar || data.data?.avatar
    };
  } catch (error) {
    const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Upload timeout. Please check your internet connection and try again with a smaller image.'
        };
      }
      
      if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Network error. Please check your internet connection and try again.'
        };
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed. Please try again.'
    };
  }
};
