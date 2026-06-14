import { google, youtube_v3, YouTube } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { config } from '../config/index.js';
import logger from '../config/logger.js';
import { YouTubeChannel } from '../models/YouTubeChannel.js';
import { YouTubeVideo } from '../models/YouTubeVideo.js';
import { LiveStream } from '../models/LiveStream.js';
import { YouTubePlaylist } from '../models/YouTubePlaylist.js';

export class YouTubeService {
  private youtube: YouTube;

  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: config.youtube.apiKey,
    });
  }

  createOAuth2Client(): OAuth2Client {
    return new google.auth.OAuth2(
      config.youtube.clientId,
      config.youtube.clientSecret,
      config.youtube.redirectUri
    );
  }

  getAuthUrl(state?: string): string {
    const oauth2Client = this.createOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: config.youtubeScopes,
      prompt: 'consent',
      state,
    });
  }

  async getTokenFromCode(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expiry_date: number;
  }> {
    const oauth2Client = this.createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    logger.info('Tokens received from YouTube OAuth', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
    });

    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date!,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expiry_date: number;
  }> {
    const oauth2Client = this.createOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    logger.info('Access token refreshed successfully');

    return {
      access_token: credentials.access_token!,
      expiry_date: credentials.expiry_date!,
    };
  }

  getAuthenticatedClient(accessToken: string, refreshToken?: string): OAuth2Client {
    const oauth2Client = this.createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return oauth2Client;
  }

  async getChannelDetails(channelId: string, accessToken?: string): Promise<youtube_v3.Schema$Channel> {
    try {
      const auth = accessToken
        ? this.getAuthenticatedClient(accessToken)
        : undefined;

      const response = await this.youtube.channels.list({
        part: ['snippet', 'contentDetails', 'statistics', 'brandingSettings'],
        id: [channelId],
        auth,
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error(`Channel not found: ${channelId}`);
      }

      return response.data.items[0];
    } catch (error) {
      logger.error('Failed to get channel details', { channelId, error: (error as Error).message });
      throw error;
    }
  }

  async searchChannels(query: string): Promise<youtube_v3.Schema$SearchResult[]> {
    try {
      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        type: ['channel'],
        maxResults: 10,
      });

      return response.data.items || [];
    } catch (error) {
      logger.error('Failed to search channels', { query, error: (error as Error).message });
      throw error;
    }
  }

  async uploadVideo(params: {
    filePath: string;
    title: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
    privacyStatus?: 'public' | 'unlisted' | 'private';
    accessToken: string;
  }): Promise<youtube_v3.Schema$Video> {
    try {
      const { filePath, title, description, tags, categoryId, privacyStatus, accessToken } = params;

      const auth = this.getAuthenticatedClient(accessToken);

      // For resumable upload, we need to use the direct upload method
      const requestBody: youtube_v3.Schema$Video = {
        snippet: {
          title,
          description: description || '',
          tags: tags,
          categoryId: categoryId || '22',
        },
        status: {
          privacyStatus: privacyStatus || 'private',
          selfDeclaredMadeForKids: false,
        },
      };

      const media = {
        mimeType: 'video/*',
        body: require('fs').createReadStream(filePath),
      };

      const response = await this.youtube.videos.insert(
        {
          part: ['snippet', 'status'],
          requestBody,
        },
        media
      );

      logger.info('Video uploaded successfully', { videoId: response.data.id });

      return response.data;
    } catch (error) {
      logger.error('Failed to upload video', { error: (error as Error).message });
      throw error;
    }
  }

  async updateVideo(
    videoId: string,
    params: {
      title?: string;
      description?: string;
      tags?: string[];
      categoryId?: string;
      privacyStatus?: 'public' | 'unlisted' | 'private';
      accessToken: string;
    }
  ): Promise<youtube_v3.Schema$Video> {
    try {
      const auth = this.getAuthenticatedClient(params.accessToken);

      const updateParams: youtube_v3.Params$Videos$Update = {
        part: ['snippet', 'status'],
      };

      const requestBody: youtube_v3.Schema$Video = {
        id: videoId,
        snippet: {
          title: params.title,
          description: params.description,
          tags: params.tags,
          categoryId: params.categoryId,
        },
        status: {
          privacyStatus: params.privacyStatus,
        },
      };

      const response = await this.youtube.videos.update(updateParams, { requestBody });

      logger.info('Video updated successfully', { videoId });

      return response.data;
    } catch (error) {
      logger.error('Failed to update video', { videoId, error: (error as Error).message });
      throw error;
    }
  }

  async getVideoDetails(videoId: string): Promise<youtube_v3.Schema$Video> {
    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics', 'status', 'fileDetails'],
        id: [videoId],
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error(`Video not found: ${videoId}`);
      }

      return response.data.items[0];
    } catch (error) {
      logger.error('Failed to get video details', { videoId, error: (error as Error).message });
      throw error;
    }
  }

  async deleteVideo(videoId: string, accessToken: string): Promise<void> {
    try {
      const auth = this.getAuthenticatedClient(accessToken);

      await this.youtube.videos.delete({
        id: [videoId],
        auth,
      });

      logger.info('Video deleted successfully', { videoId });
    } catch (error) {
      logger.error('Failed to delete video', { videoId, error: (error as Error).message });
      throw error;
    }
  }

  async getVideoAnalytics(videoId: string, accessToken: string): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
    estimatedMinutesWatched: number;
    averageViewDuration: number;
  }> {
    try {
      const auth = this.getAuthenticatedClient(accessToken);

      const response = await this.youtube.videos.list({
        part: ['statistics', 'contentDetails'],
        id: [videoId],
        auth,
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error(`Video not found: ${videoId}`);
      }

      const video = response.data.items[0];
      const statistics = video.statistics || {};
      const contentDetails = video.contentDetails || {};

      return {
        views: parseInt(statistics.viewCount || '0', 10),
        likes: parseInt(statistics.likeCount || '0', 10),
        comments: parseInt(statistics.commentCount || '0', 10),
        shares: parseInt(statistics.shareCount || '0', 10) || 0,
        estimatedMinutesWatched: 0,
        averageViewDuration: 0,
      };
    } catch (error) {
      logger.error('Failed to get video analytics', { videoId, error: (error as Error).message });
      throw error;
    }
  }

  async setThumbnail(videoId: string, imagePath: string, accessToken: string): Promise<string> {
    try {
      const auth = this.getAuthenticatedClient(accessToken);

      const response = await this.youtube.thumbnails.set({
        videoId,
        auth,
        media: {
          mimeType: 'image/jpeg',
          body: require('fs').createReadStream(imagePath),
        },
      });

      logger.info('Thumbnail set successfully', { videoId });

      return response.data.items?.[0]?.url || '';
    } catch (error) {
      logger.error('Failed to set thumbnail', { videoId, error: (error as Error).message });
      throw error;
    }
  }

  async createPlaylist(params: {
    title: string;
    description?: string;
    privacyStatus?: 'public' | 'unlisted' | 'private';
    accessToken: string;
  }): Promise<youtube_v3.Schema$Playlist> {
    try {
      const auth = this.getAuthenticatedClient(params.accessToken);

      const response = await this.youtube.playlists.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: params.title,
            description: params.description || '',
          },
          status: {
            privacyStatus: params.privacyStatus || 'private',
          },
        },
      });

      logger.info('Playlist created successfully', { playlistId: response.data.id });

      return response.data;
    } catch (error) {
      logger.error('Failed to create playlist', { error: (error as Error).message });
      throw error;
    }
  }

  async addVideoToPlaylist(playlistId: string, videoId: string, accessToken: string): Promise<void> {
    try {
      const auth = this.getAuthenticatedClient(accessToken);

      await this.youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId,
            },
          },
        },
      });

      logger.info('Video added to playlist', { playlistId, videoId });
    } catch (error) {
      logger.error('Failed to add video to playlist', { playlistId, videoId, error: (error as Error).message });
      throw error;
    }
  }

  async getComments(videoId: string, accessToken: string): Promise<youtube_v3.Schema$CommentThread[]> {
    try {
      const auth = this.getAuthenticatedClient(accessToken);

      const response = await this.youtube.commentThreads.list({
        part: ['snippet', 'replies'],
        videoId,
        maxResults: 100,
        auth,
      });

      return response.data.items || [];
    } catch (error) {
      logger.error('Failed to get comments', { videoId, error: (error as Error).message });
      throw error;
    }
  }

  async moderateComment(commentId: string, action: 'approve' | 'hold' | 'spam', accessToken: string): Promise<void> {
    try {
      const auth = this.getAuthenticatedClient(accessToken);

      if (action === 'approve') {
        await this.youtube.comments.setModerationStatus({
          id: commentId,
          moderationStatus: 'published',
          auth,
        });
      } else if (action === 'hold') {
        await this.youtube.comments.setModerationStatus({
          id: commentId,
          moderationStatus: 'heldForReview',
          auth,
        });
      } else {
        await this.youtube.comments.setModerationStatus({
          id: commentId,
          moderationStatus: 'rejected',
          auth,
        });
      }

      logger.info('Comment moderated', { commentId, action });
    } catch (error) {
      logger.error('Failed to moderate comment', { commentId, action, error: (error as Error).message });
      throw error;
    }
  }

  async createLiveBroadcast(params: {
    title: string;
    description?: string;
    scheduledStartTime?: string;
    privacyStatus?: 'public' | 'unlisted' | 'private';
    accessToken: string;
  }): Promise<{ broadcastId: string; streamId: string }> {
    try {
      const auth = this.getAuthenticatedClient(params.accessToken);

      // Create broadcast
      const broadcastResponse = await this.youtube.liveBroadcasts.insert({
        part: ['snippet', 'status', 'contentDetails'],
        requestBody: {
          snippet: {
            title: params.title,
            description: params.description || '',
            scheduledStartTime: params.scheduledStartTime || new Date().toISOString(),
          },
          status: {
            privacyStatus: params.privacyStatus || 'public',
            selfDeclaredMadeForKids: false,
          },
          contentDetails: {
            enableAutoStart: true,
            enableAutoStop: true,
          },
        },
      });

      const broadcastId = broadcastResponse.data.id!;

      // Create bound stream
      const streamResponse = await this.youtube.liveStreams.insert({
        part: ['snippet', 'cdn'],
        requestBody: {
          snippet: {
            title: params.title,
          },
          cdn: {
            ingestionType: 'rtmp',
            resolution: '1080p',
            frameRate: '30fps',
          },
        },
      });

      const streamId = streamResponse.data.id!;

      // Bind broadcast to stream
      await this.youtube.liveBroadcasts.bind({
        id: broadcastId,
        part: ['snippet', 'status', 'contentDetails'],
        streamId,
      });

      logger.info('Live broadcast created', { broadcastId, streamId });

      return { broadcastId, streamId };
    } catch (error) {
      logger.error('Failed to create live broadcast', { error: (error as Error).message });
      throw error;
    }
  }

  async transitionBroadcast(broadcastId: string, transition: 'testing' | 'live' | 'complete', accessToken: string): Promise<void> {
    try {
      const auth = this.getAuthenticatedClient(accessToken);

      await this.youtube.liveBroadcasts.transition({
        broadcastStatus: transition,
        id: broadcastId,
        part: ['snippet', 'status', 'contentDetails'],
        auth,
      });

      logger.info('Broadcast transitioned', { broadcastId, transition });
    } catch (error) {
      logger.error('Failed to transition broadcast', { broadcastId, transition, error: (error as Error).message });
      throw error;
    }
  }

  async getLiveStats(broadcastId: string, accessToken: string): Promise<{
    status: string;
    concurrentViewers?: number;
    totalViews?: number;
  }> {
    try {
      const auth = this.getAuthenticatedClient(accessToken);

      const response = await this.youtube.liveBroadcasts.list({
        part: ['snippet', 'status', 'contentDetails', 'liveStreamingDetails'],
        id: [broadcastId],
        auth,
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error(`Broadcast not found: ${broadcastId}`);
      }

      const broadcast = response.data.items[0];
      const liveDetails = broadcast.liveStreamingDetails || {};

      return {
        status: broadcast.status?.lifeCycleStatus || 'unknown',
        concurrentViewers: liveDetails.concurrentViewers ? parseInt(liveDetails.concurrentViewers, 10) : undefined,
        totalViews: liveDetails.viewCount ? parseInt(liveDetails.viewCount, 10) : undefined,
      };
    } catch (error) {
      logger.error('Failed to get live stats', { broadcastId, error: (error as Error).message });
      throw error;
    }
  }

  async insertCaption(videoId: string, language: string, filePath: string, accessToken: string): Promise<string> {
    try {
      const auth = this.getAuthenticatedClient(accessToken);

      const response = await this.youtube.captions.insert(
        {
          part: ['snippet'],
          requestBody: {
            snippet: {
              videoId,
              language,
              isDraft: false,
              name: language.toUpperCase(),
            },
          },
        },
        {
          mimeType: 'application/vnd.youtube.timedtext',
          body: require('fs').createReadStream(filePath),
        }
      );

      logger.info('Caption inserted', { videoId, language, captionId: response.data.id });

      return response.data.id || '';
    } catch (error) {
      logger.error('Failed to insert caption', { videoId, language, error: (error as Error).message });
      throw error;
    }
  }

  async publishCommunityPost(channelId: string, message: string, accessToken: string): Promise<string> {
    try {
      const auth = this.getAuthenticatedClient(accessToken);

      // Note: Community posts require the YouTube Data API v3 which has limited support
      // This would typically use the YouTube Partner API or Content ID API
      logger.warn('Community posts require additional API permissions');

      return '';
    } catch (error) {
      logger.error('Failed to publish community post', { channelId, error: (error as Error).message });
      throw error;
    }
  }
}

export const youtubeService = new YouTubeService();
export default youtubeService;