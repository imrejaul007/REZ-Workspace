// @ts-nocheck
// Habixo Photo Upload API Service
// Handles property photo uploads for Habixo listings

import { Platform } from 'react-native';
import { getAuthToken } from '@/utils/authStorage';
import apiClient from './apiClient';

const HABIXO_API_BASE = process.env.EXPO_PUBLIC_HABIXO_API_URL || 'http://localhost:3007';
const UPLOAD_TIMEOUT = 60000; // 60 seconds for photo uploads

export interface PropertyPhoto {
  photoId: string;
  propertyId: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface UploadPhotoResponse {
  success: boolean;
  data?: {
    photos: PropertyPhoto[];
    urls: string[];
  };
  message?: string;
  errors?: string[];
}

export interface PhotoUploadOptions {
  caption?: string;
  isPrimary?: boolean;
}

class HabixoPhotoApiService {
  /**
   * Get all photos for a property
   */
  async getPropertyPhotos(propertyId: string): Promise<{
    success: boolean;
    data?: PropertyPhoto[];
    error?: string;
  }> {
    try {
      const response = await apiClient.get<{ data: PropertyPhoto[] }>(
        `${HABIXO_API_BASE}/api/habixo/properties/${propertyId}/photos`
      );

      if (response.success && response.data) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.message || 'Failed to fetch photos' };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to fetch photos' };
    }
  }

  /**
   * Upload photos to a property
   */
  async uploadPhotos(
    propertyId: string,
    photos: { uri: string; name: string; type: string }[],
    options: PhotoUploadOptions = {}
  ): Promise<UploadPhotoResponse> {
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        return { success: false, message: 'Authentication required' };
      }

      const formData = new FormData();

      // Append photos
      photos.forEach((photo) => {
        if (Platform.OS === 'web') {
          // For web, we need to fetch the blob
          formData.append('photos', {
            uri: photo.uri,
            name: photo.name,
            type: photo.type,
          } as unknown);
        } else {
          // For mobile
          formData.append('photos', {
            uri: Platform.OS === 'android' ? photo.uri : photo.uri.replace('file://', ''),
            name: photo.name,
            type: photo.type,
          } as unknown);
        }
      });

      // Append options
      if (options.caption) {
        formData.append('caption', options.caption);
      }
      if (options.isPrimary !== undefined) {
        formData.append('isPrimary', String(options.isPrimary));
      }

      const response = await fetch(
        `${HABIXO_API_BASE}/api/habixo/properties/${propertyId}/photos`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
          timeout: UPLOAD_TIMEOUT,
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          data: data.data,
          message: data.message,
          errors: data.errors,
        };
      }

      return {
        success: false,
        message: data.message || 'Failed to upload photos',
        errors: data.errors,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to upload photos',
      };
    }
  }

  /**
   * Delete a photo
   */
  async deletePhoto(propertyId: string, photoId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(
        `${HABIXO_API_BASE}/api/habixo/properties/${propertyId}/photos/${photoId}`
      );

      if (response.success) {
        return { success: true };
      }
      return { success: false, error: response.message || 'Failed to delete photo' };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to delete photo' };
    }
  }

  /**
   * Reorder photos
   */
  async reorderPhotos(propertyId: string, photoIds: string[]): Promise<{
    success: boolean;
    data?: PropertyPhoto[];
    error?: string;
  }> {
    try {
      const response = await apiClient.put<{ success: boolean; data: PropertyPhoto[] }>(
        `${HABIXO_API_BASE}/api/habixo/properties/${propertyId}/photos/reorder`,
        { photoIds }
      );

      if (response.success && response.data) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.message || 'Failed to reorder photos' };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to reorder photos' };
    }
  }

  /**
   * Set a photo as primary
   */
  async setPrimaryPhoto(propertyId: string, photoId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await apiClient.put<{ success: boolean }>(
        `${HABIXO_API_BASE}/api/habixo/properties/${propertyId}/photos/${photoId}/primary`
      );

      if (response.success) {
        return { success: true };
      }
      return { success: false, error: response.message || 'Failed to set primary photo' };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to set primary photo' };
    }
  }

  /**
   * Update photo caption
   */
  async updatePhotoCaption(
    propertyId: string,
    photoId: string,
    caption: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>(
        `${HABIXO_API_BASE}/api/habixo/properties/${propertyId}/photos/${photoId}`,
        { caption }
      );

      if (response.success) {
        return { success: true };
      }
      return { success: false, error: response.message || 'Failed to update caption' };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to update caption' };
    }
  }

  /**
   * Get presigned URL for direct Cloudinary upload
   */
  async getPresignedUrl(propertyId: string): Promise<{
    success: boolean;
    data?: {
      uploadUrl: string;
      cloudName?: string;
      uploadPreset?: string;
      folder?: string;
    };
    error?: string;
  }> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: {
          uploadUrl: string;
          cloudName?: string;
          uploadPreset?: string;
          folder?: string;
        };
      }>(`${HABIXO_API_BASE}/api/habixo/properties/${propertyId}/photos/upload-url`);

      if (response.success && response.data) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.message || 'Failed to get upload URL' };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to get upload URL' };
    }
  }
}

export const habixoPhotoApi = new HabixoPhotoApiService();
export default habixoPhotoApi;
