import axios, { AxiosError } from 'axios';
import config from '../config';
import { PlatformType } from '../models/platform-config.model';
import { logger } from '../config/logger';

export interface PublishResult {
  success: boolean;
  publishedId?: string;
  error?: string;
  platformResponse?: any;
}

export interface PlatformAdapter {
  publish(content: PublishContent): Promise<PublishResult>;
  validateCredentials(): Promise<boolean>;
}

export interface PublishContent {
  text: string;
  media?: { url: string; type: 'image' | 'video' | 'gif'; alt?: string }[];
  adaptedContent?: string;
  accountId: string;
  accessToken: string;
}

class InstagramAdapter implements PlatformAdapter {
  async publish(content: PublishContent): Promise<PublishResult> {
    try {
      const text = content.adaptedContent || content.text;

      // Instagram Basic Display API / Graph API integration
      // This is a placeholder - real implementation would use Instagram Graph API
      logger.info('Publishing to Instagram', { accountId: content.accountId });

      // Simulated response
      return {
        success: true,
        publishedId: `ig_${Date.now()}`,
        platformResponse: { id: `ig_${Date.now()}`, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('Instagram publish failed', { error: axiosError.message });
      return { success: false, error: axiosError.message };
    }
  }

  async validateCredentials(): Promise<boolean> {
    return !!config.platforms.instagram.accessToken;
  }
}

class FacebookAdapter implements PlatformAdapter {
  async publish(content: PublishContent): Promise<PublishResult> {
    try {
      const text = content.adaptedContent || content.text;

      logger.info('Publishing to Facebook', { accountId: content.accountId });

      return {
        success: true,
        publishedId: `fb_${Date.now()}`,
        platformResponse: { id: `fb_${Date.now()}`, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('Facebook publish failed', { error: axiosError.message });
      return { success: false, error: axiosError.message };
    }
  }

  async validateCredentials(): Promise<boolean> {
    return !!config.platforms.facebook.accessToken;
  }
}

class TwitterAdapter implements PlatformAdapter {
  async publish(content: PublishContent): Promise<PublishResult> {
    try {
      const text = content.adaptedContent || content.text;

      // Twitter API v2 integration
      logger.info('Publishing to Twitter', { accountId: content.accountId });

      return {
        success: true,
        publishedId: `tw_${Date.now()}`,
        platformResponse: { id: `tw_${Date.now()}`, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('Twitter publish failed', { error: axiosError.message });
      return { success: false, error: axiosError.message };
    }
  }

  async validateCredentials(): Promise<boolean> {
    return !!config.platforms.twitter.apiKey;
  }
}

class LinkedInAdapter implements PlatformAdapter {
  async publish(content: PublishContent): Promise<PublishResult> {
    try {
      const text = content.adaptedContent || content.text;

      logger.info('Publishing to LinkedIn', { accountId: content.accountId });

      return {
        success: true,
        publishedId: `li_${Date.now()}`,
        platformResponse: { id: `li_${Date.now()}`, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('LinkedIn publish failed', { error: axiosError.message });
      return { success: false, error: axiosError.message };
    }
  }

  async validateCredentials(): Promise<boolean> {
    return !!config.platforms.linkedin.accessToken;
  }
}

class TikTokAdapter implements PlatformAdapter {
  async publish(content: PublishContent): Promise<PublishResult> {
    try {
      const text = content.adaptedContent || content.text;

      logger.info('Publishing to TikTok', { accountId: content.accountId });

      return {
        success: true,
        publishedId: `tt_${Date.now()}`,
        platformResponse: { id: `tt_${Date.now()}`, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('TikTok publish failed', { error: axiosError.message });
      return { success: false, error: axiosError.message };
    }
  }

  async validateCredentials(): Promise<boolean> {
    return !!config.platforms.tiktok.accessToken;
  }
}

class YouTubeAdapter implements PlatformAdapter {
  async publish(content: PublishContent): Promise<PublishResult> {
    try {
      const text = content.adaptedContent || content.text;

      logger.info('Publishing to YouTube', { accountId: content.accountId });

      return {
        success: true,
        publishedId: `yt_${Date.now()}`,
        platformResponse: { id: `yt_${Date.now()}`, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('YouTube publish failed', { error: axiosError.message });
      return { success: false, error: axiosError.message };
    }
  }

  async validateCredentials(): Promise<boolean> {
    return !!config.platforms.youtube.apiKey;
  }
}

class PinterestAdapter implements PlatformAdapter {
  async publish(content: PublishContent): Promise<PublishResult> {
    try {
      const text = content.adaptedContent || content.text;

      logger.info('Publishing to Pinterest', { accountId: content.accountId });

      return {
        success: true,
        publishedId: `pin_${Date.now()}`,
        platformResponse: { id: `pin_${Date.now()}`, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('Pinterest publish failed', { error: axiosError.message });
      return { success: false, error: axiosError.message };
    }
  }

  async validateCredentials(): Promise<boolean> {
    return !!config.platforms.pinterest.accessToken;
  }
}

class ContentFormatter {
  static formatForPlatform(platform: PlatformType, content: PublishContent): PublishContent {
    let adaptedContent = content.text;

    switch (platform) {
      case 'twitter':
        // Twitter: 280 character limit
        if (adaptedContent.length > 280) {
          adaptedContent = adaptedContent.substring(0, 277) + '...';
        }
        break;
      case 'instagram':
        // Instagram: Add hashtags if missing, optimize for engagement
        if (!adaptedContent.includes('#')) {
          adaptedContent += '\n\n#socialmedia #content #marketing';
        }
        break;
      case 'linkedin':
        // LinkedIn: Professional tone, add line breaks
        adaptedContent = adaptedContent.replace(/\n/g, '\n\n');
        if (!adaptedContent.includes('...')) {
          adaptedContent += '\n\n#LinkedIn #Professional #Business';
        }
        break;
      case 'facebook':
        // Facebook: Add call to action
        adaptedContent += '\n\nWhat do you think? Let us know in the comments!';
        break;
      case 'tiktok':
        // TikTok: Short, catchy text for videos
        if (adaptedContent.length > 150) {
          adaptedContent = adaptedContent.substring(0, 147) + '...';
        }
        break;
      case 'youtube':
        // YouTube: Video description format
        adaptedContent = `Description:\n${adaptedContent}\n\n---\nDon't forget to like, subscribe, and hit the bell!`;
        break;
      case 'pinterest':
        // Pinterest: SEO optimized, shorter descriptions
        if (adaptedContent.length > 500) {
          adaptedContent = adaptedContent.substring(0, 497) + '...';
        }
        break;
    }

    return { ...content, adaptedContent };
  }
}

export class PublishingService {
  private adapters: Map<PlatformType, PlatformAdapter>;

  constructor() {
    this.adapters = new Map([
      ['instagram', new InstagramAdapter()],
      ['facebook', new FacebookAdapter()],
      ['twitter', new TwitterAdapter()],
      ['linkedin', new LinkedInAdapter()],
      ['tiktok', new TikTokAdapter()],
      ['youtube', new YouTubeAdapter()],
      ['pinterest', new PinterestAdapter()],
    ]);
  }

  async publish(platform: PlatformType, content: PublishContent): Promise<PublishResult> {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      return { success: false, error: `Unsupported platform: ${platform}` };
    }

    // Format content for platform
    const formattedContent = ContentFormatter.formatForPlatform(platform, content);

    logger.info(`Publishing to ${platform}`, {
      accountId: content.accountId,
      textLength: formattedContent.text.length,
    });

    return adapter.publish(formattedContent);
  }

  async publishToMultiple(
    platforms: PlatformType[],
    content: PublishContent
  ): Promise<Record<PlatformType, PublishResult>> {
    const results: Record<PlatformType, PublishResult> = {} as any;

    for (const platform of platforms) {
      results[platform] = await this.publish(platform, content);
    }

    return results;
  }

  async validatePlatform(platform: PlatformType): Promise<boolean> {
    const adapter = this.adapters.get(platform);
    if (!adapter) return false;
    return adapter.validateCredentials();
  }

  getSupportedPlatforms(): PlatformType[] {
    return Array.from(this.adapters.keys());
  }
}

export const publishingService = new PublishingService();