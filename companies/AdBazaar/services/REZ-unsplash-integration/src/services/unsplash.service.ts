import axios, { AxiosInstance } from 'axios';
import { UnsplashPhoto, SearchResult, SearchOptions } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('UnsplashService');

export class UnsplashService {
  private client: AxiosInstance;
  private accessKey: string;

  constructor() {
    this.accessKey = process.env.UNSPLASH_ACCESS_KEY || '';
    this.client = axios.create({
      baseURL: process.env.UNSPLASH_API_URL || 'https://api.unsplash.com',
      headers: {
        'Authorization': `Client-ID ${this.accessKey}`,
        'Accept-Version': 'v1',
      },
    });
  }

  async searchPhotos(options: SearchOptions): Promise<SearchResult> {
    try {
      const params: Record<string, string | number | undefined> = {
        query: options.query,
        page: options.page || 1,
        per_page: options.perPage || 20,
        order_by: options.orderBy || 'relevant',
        content_filter: options.contentFilter || 'low',
      };

      if (options.color) {
        params.color = options.color;
      }
      if (options.orientation) {
        params.orientation = options.orientation;
      }

      const response = await this.client.get<SearchResult>('/search/photos', { params });

      logger.info('Photos search completed', {
        query: options.query,
        total: response.data.total,
        results: response.data.results.length,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to search photos', {
        query: options.query,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to search Unsplash photos');
    }
  }

  async getPhoto(photoId: string): Promise<UnsplashPhoto> {
    try {
      const response = await this.client.get<UnsplashPhoto>(`/photos/${photoId}`);

      logger.info('Photo retrieved', { photoId });

      return response.data;
    } catch (error) {
      logger.error('Failed to get photo', {
        photoId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to get Unsplash photo');
    }
  }

  async getRandomPhotos(options?: {
    query?: string;
    count?: number;
    orientation?: string;
  }): Promise<UnsplashPhoto[]> {
    try {
      const params: Record<string, string | number | undefined> = {
        count: options?.count || 1,
      };

      if (options?.query) {
        params.query = options.query;
      }
      if (options?.orientation) {
        params.orientation = options.orientation;
      }

      const response = await this.client.get<UnsplashPhoto[]>('/photos/random', { params });

      logger.info('Random photos retrieved', { count: response.data.length });

      return response.data;
    } catch (error) {
      logger.error('Failed to get random photos', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to get random Unsplash photos');
    }
  }

  async downloadPhoto(photoId: string): Promise<{ url: string; location: string }> {
    try {
      // First, track the download with Unsplash
      await this.client.get(`/photos/${photoId}/download`);

      // Get the photo to retrieve download link
      const photo = await this.getPhoto(photoId);

      logger.info('Photo download tracked', { photoId });

      return {
        url: photo.urls.full,
        location: photo.links.downloadLocation,
      };
    } catch (error) {
      logger.error('Failed to track photo download', {
        photoId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to download Unsplash photo');
    }
  }

  async getPhotoStats(photoId: string): Promise<{
    downloads: { total: number; history: { date: string; total: number }[] };
    views: { total: number; history: { date: string; total: number }[] };
    likes: { total: number };
  }> {
    try {
      const response = await this.client.get(`/photos/${photoId}/statistics`);

      logger.info('Photo stats retrieved', { photoId });

      return response.data;
    } catch (error) {
      logger.error('Failed to get photo stats', {
        photoId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to get Unsplash photo statistics');
    }
  }

  async trackDownload(photoId: string, downloadLocation: string): Promise<void> {
    try {
      await this.client.get(downloadLocation);

      logger.info('Download tracked with Unsplash', { photoId });
    } catch (error) {
      logger.error('Failed to track download', {
        photoId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - tracking failure shouldn't block the download
    }
  }

  // Get attribution info for a photo
  getAttribution(photo: UnsplashPhoto): {
    photographerName: string;
    photographerUsername: string;
    photographerUrl: string;
    sourceUrl: string;
    license: string;
  } {
    return {
      photographerName: photo.user.name,
      photographerUsername: photo.user.username,
      photographerUrl: `${photo.user.links.html}?utm_source=rez&utm_medium=referral`,
      sourceUrl: `${photo.links.html}?utm_source=rez&utm_medium=referral`,
      license: 'Unsplash License (https://unsplash.com/license)',
    };
  }
}

export const unsplashService = new UnsplashService();
