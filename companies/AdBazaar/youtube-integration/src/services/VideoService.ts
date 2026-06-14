import { v4 as uuidv4 } from 'uuid';
import { YouTubeVideo, IYouTubeVideo, PrivacyStatus } from '../models/YouTubeVideo.js';
import { youtubeService } from './YouTubeService.js';
import { channelService } from './ChannelService.js';
import logger from '../config/logger.js';

export class VideoService {
  async uploadVideo(params: {
    youtubeChannelId: string;
    filePath: string;
    title: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
    privacyStatus?: PrivacyStatus;
  }): Promise<IYouTubeVideo> {
    try {
      // Get channel to access tokens
      const channel = await channelService.getChannelByYoutubeId(params.youtubeChannelId);

      if (!channel) {
        throw new Error('Channel not connected');
      }

      // Check if we need to refresh the access token
      let accessToken = channel.accessToken;
      if (channel.refreshToken) {
        try {
          const refreshed = await youtubeService.refreshAccessToken(channel.refreshToken);
          accessToken = refreshed.access_token;
          channel.accessToken = refreshed.access_token;
          await channel.save();
        } catch {
          // If refresh fails, use existing token
          logger.warn('Failed to refresh access token, using existing');
        }
      }

      // Create local record first
      const video = new YouTubeVideo({
        id: uuidv4(),
        youtubeChannelId: params.youtubeChannelId,
        title: params.title,
        description: params.description || '',
        tags: params.tags || [],
        categoryId: params.categoryId || '22',
        privacyStatus: params.privacyStatus || 'private',
        status: 'uploading',
        localFilePath: params.filePath,
      });

      await video.save();

      try {
        // Upload to YouTube
        const youtubeResponse = await youtubeService.uploadVideo({
          filePath: params.filePath,
          title: params.title,
          description: params.description,
          tags: params.tags,
          categoryId: params.categoryId,
          privacyStatus: params.privacyStatus,
          accessToken: accessToken!,
        });

        // Update record with YouTube response
        video.youtubeVideoId = youtubeResponse.id!;
        video.status = 'published';
        video.publishedAt = new Date();
        video.thumbnailUrl = youtubeResponse.snippet?.thumbnails?.default?.url;
        video.duration = this.parseDuration(youtubeResponse.contentDetails?.duration || '');
        video.youtubeResponse = youtubeResponse as unknown as Record<string, unknown>;

        await video.save();

        logger.info('Video uploaded successfully', {
          videoId: video.id,
          youtubeVideoId: video.youtubeVideoId,
        });

        return video;
      } catch (uploadError) {
        // Mark as failed
        video.status = 'failed';
        video.errorMessage = (uploadError as Error).message;
        await video.save();

        throw uploadError;
      }
    } catch (error) {
      logger.error('Failed to upload video', {
        youtubeChannelId: params.youtubeChannelId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async updateVideo(
    id: string,
    params: {
      title?: string;
      description?: string;
      tags?: string[];
      categoryId?: string;
      privacyStatus?: PrivacyStatus;
    }
  ): Promise<IYouTubeVideo> {
    try {
      const video = await YouTubeVideo.findOne({ id });

      if (!video) {
        throw new Error('Video not found');
      }

      if (!video.youtubeVideoId) {
        throw new Error('Video not yet uploaded to YouTube');
      }

      // Get channel for access token
      const channel = await channelService.getChannelByYoutubeId(video.youtubeChannelId);

      if (!channel || !channel.accessToken) {
        throw new Error('Channel not connected');
      }

      let accessToken = channel.accessToken;
      if (channel.refreshToken) {
        try {
          const refreshed = await youtubeService.refreshAccessToken(channel.refreshToken);
          accessToken = refreshed.access_token;
          channel.accessToken = refreshed.access_token;
          await channel.save();
        } catch {
          logger.warn('Failed to refresh access token');
        }
      }

      // Update on YouTube
      await youtubeService.updateVideo(video.youtubeVideoId, {
        title: params.title,
        description: params.description,
        tags: params.tags,
        categoryId: params.categoryId,
        privacyStatus: params.privacyStatus,
        accessToken: accessToken,
      });

      // Update local record
      if (params.title) video.title = params.title;
      if (params.description !== undefined) video.description = params.description;
      if (params.tags) video.tags = params.tags;
      if (params.categoryId) video.categoryId = params.categoryId;
      if (params.privacyStatus) video.privacyStatus = params.privacyStatus;

      await video.save();

      logger.info('Video updated', { videoId: id });

      return video;
    } catch (error) {
      logger.error('Failed to update video', { id, error: (error as Error).message });
      throw error;
    }
  }

  async getVideos(filters?: {
    youtubeChannelId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    videos: IYouTubeVideo[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      const query: Record<string, unknown> = {};
      if (filters?.youtubeChannelId) {
        query.youtubeChannelId = filters.youtubeChannelId;
      }
      if (filters?.status) {
        query.status = filters.status;
      }

      const [videos, total] = await Promise.all([
        YouTubeVideo.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        YouTubeVideo.countDocuments(query),
      ]);

      return {
        videos,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error('Failed to get videos', { error: (error as Error).message });
      throw error;
    }
  }

  async getVideoById(id: string): Promise<IYouTubeVideo | null> {
    try {
      const video = await YouTubeVideo.findOne({ id });
      return video;
    } catch (error) {
      logger.error('Failed to get video by ID', { id, error: (error as Error).message });
      throw error;
    }
  }

  async getVideoByYoutubeId(youtubeVideoId: string): Promise<IYouTubeVideo | null> {
    try {
      const video = await YouTubeVideo.findOne({ youtubeVideoId });
      return video;
    } catch (error) {
      logger.error('Failed to get video by YouTube ID', { youtubeVideoId, error: (error as Error).message });
      throw error;
    }
  }

  async deleteVideo(id: string): Promise<void> {
    try {
      const video = await YouTubeVideo.findOne({ id });

      if (!video) {
        throw new Error('Video not found');
      }

      if (video.youtubeVideoId) {
        // Get channel for access token
        const channel = await channelService.getChannelByYoutubeId(video.youtubeChannelId);

        if (channel && channel.accessToken) {
          let accessToken = channel.accessToken;
          if (channel.refreshToken) {
            try {
              const refreshed = await youtubeService.refreshAccessToken(channel.refreshToken);
              accessToken = refreshed.access_token;
            } catch {
              logger.warn('Failed to refresh access token for deletion');
            }
          }

          await youtubeService.deleteVideo(video.youtubeVideoId, accessToken);
        }
      }

      await YouTubeVideo.findOneAndDelete({ id });

      logger.info('Video deleted', { videoId: id });
    } catch (error) {
      logger.error('Failed to delete video', { id, error: (error as Error).message });
      throw error;
    }
  }

  async getVideoAnalytics(id: string): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
    estimatedMinutesWatched: number;
    averageViewDuration: number;
  }> {
    try {
      const video = await YouTubeVideo.findOne({ id });

      if (!video) {
        throw new Error('Video not found');
      }

      if (!video.youtubeVideoId) {
        throw new Error('Video not yet uploaded to YouTube');
      }

      // Get channel for access token
      const channel = await channelService.getChannelByYoutubeId(video.youtubeChannelId);

      if (!channel || !channel.accessToken) {
        throw new Error('Channel not connected');
      }

      let accessToken = channel.accessToken;
      if (channel.refreshToken) {
        try {
          const refreshed = await youtubeService.refreshAccessToken(channel.refreshToken);
          accessToken = refreshed.access_token;
        } catch {
          logger.warn('Failed to refresh access token');
        }
      }

      const analytics = await youtubeService.getVideoAnalytics(video.youtubeVideoId, accessToken);

      // Update local stats
      video.viewCount = analytics.views;
      video.likeCount = analytics.likes;
      video.commentCount = analytics.comments;
      await video.save();

      return analytics;
    } catch (error) {
      logger.error('Failed to get video analytics', { id, error: (error as Error).message });
      throw error;
    }
  }

  async setThumbnail(id: string, imagePath: string): Promise<IYouTubeVideo> {
    try {
      const video = await YouTubeVideo.findOne({ id });

      if (!video) {
        throw new Error('Video not found');
      }

      if (!video.youtubeVideoId) {
        throw new Error('Video not yet uploaded to YouTube');
      }

      // Get channel for access token
      const channel = await channelService.getChannelByYoutubeId(video.youtubeChannelId);

      if (!channel || !channel.accessToken) {
        throw new Error('Channel not connected');
      }

      let accessToken = channel.accessToken;
      if (channel.refreshToken) {
        try {
          const refreshed = await youtubeService.refreshAccessToken(channel.refreshToken);
          accessToken = refreshed.access_token;
        } catch {
          logger.warn('Failed to refresh access token');
        }
      }

      const thumbnailUrl = await youtubeService.setThumbnail(video.youtubeVideoId, imagePath, accessToken);

      video.thumbnailUrl = thumbnailUrl;
      await video.save();

      logger.info('Thumbnail set', { videoId: id });

      return video;
    } catch (error) {
      logger.error('Failed to set thumbnail', { id, error: (error as Error).message });
      throw error;
    }
  }

  async addCaption(
    id: string,
    params: {
      language: string;
      filePath: string;
    }
  ): Promise<IYouTubeVideo> {
    try {
      const video = await YouTubeVideo.findOne({ id });

      if (!video) {
        throw new Error('Video not found');
      }

      if (!video.youtubeVideoId) {
        throw new Error('Video not yet uploaded to YouTube');
      }

      // Get channel for access token
      const channel = await channelService.getChannelByYoutubeId(video.youtubeChannelId);

      if (!channel || !channel.accessToken) {
        throw new Error('Channel not connected');
      }

      let accessToken = channel.accessToken;
      if (channel.refreshToken) {
        try {
          const refreshed = await youtubeService.refreshAccessToken(channel.refreshToken);
          accessToken = refreshed.access_token;
        } catch {
          logger.warn('Failed to refresh access token');
        }
      }

      const captionId = await youtubeService.insertCaption(
        video.youtubeVideoId,
        params.language,
        params.filePath,
        accessToken
      );

      video.captions = video.captions || [];
      video.captions.push({
        language: params.language,
        isAutoGenerated: false,
        captionId,
      });

      await video.save();

      logger.info('Caption added', { videoId: id, language: params.language });

      return video;
    } catch (error) {
      logger.error('Failed to add caption', { id, error: (error as Error).message });
      throw error;
    }
  }

  private parseDuration(isoDuration: string): number {
    if (!isoDuration) return 0;

    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }
}

export const videoService = new VideoService();
export default videoService;