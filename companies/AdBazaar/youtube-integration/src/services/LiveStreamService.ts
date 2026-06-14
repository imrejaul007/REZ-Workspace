import { v4 as uuidv4 } from 'uuid';
import { LiveStream, ILiveStream, LiveStreamStatus } from '../models/LiveStream.js';
import { youtubeService } from './YouTubeService.js';
import { channelService } from './ChannelService.js';
import logger from '../config/logger.js';

export class LiveStreamService {
  async createLiveStream(params: {
    youtubeChannelId: string;
    title: string;
    description?: string;
    scheduledStartTime?: Date;
    privacyStatus?: 'public' | 'unlisted' | 'private';
  }): Promise<ILiveStream> {
    try {
      // Get channel to access tokens
      const channel = await channelService.getChannelByYoutubeId(params.youtubeChannelId);

      if (!channel) {
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

      // Create on YouTube
      const { broadcastId, streamId } = await youtubeService.createLiveBroadcast({
        title: params.title,
        description: params.description,
        scheduledStartTime: params.scheduledStartTime?.toISOString(),
        privacyStatus: params.privacyStatus,
        accessToken: accessToken!,
      });

      // Create local record
      const stream = new LiveStream({
        id: uuidv4(),
        streamKey: streamId,
        youtubeChannelId: params.youtubeChannelId,
        youtubeBroadcastId: broadcastId,
        title: params.title,
        description: params.description,
        privacyStatus: params.privacyStatus || 'public',
        scheduledStartTime: params.scheduledStartTime,
        status: 'created',
      });

      await stream.save();

      logger.info('Live stream created', { streamId: stream.id, broadcastId });

      return stream;
    } catch (error) {
      logger.error('Failed to create live stream', {
        youtubeChannelId: params.youtubeChannelId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async startLiveStream(id: string): Promise<ILiveStream> {
    try {
      const stream = await LiveStream.findOne({ id });

      if (!stream) {
        throw new Error('Live stream not found');
      }

      if (stream.status === 'live') {
        throw new Error('Stream already live');
      }

      // Get channel for access token
      const channel = await channelService.getChannelByYoutubeId(stream.youtubeChannelId);

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

      // Transition to live
      if (stream.youtubeBroadcastId) {
        await youtubeService.transitionBroadcast(stream.youtubeBroadcastId, 'live', accessToken);
      }

      // Update local record
      stream.status = 'live';
      stream.actualStartTime = new Date();
      await stream.save();

      logger.info('Live stream started', { streamId: id });

      return stream;
    } catch (error) {
      logger.error('Failed to start live stream', { id, error: (error as Error).message });
      throw error;
    }
  }

  async endLiveStream(id: string): Promise<ILiveStream> {
    try {
      const stream = await LiveStream.findOne({ id });

      if (!stream) {
        throw new Error('Live stream not found');
      }

      if (stream.status !== 'live') {
        throw new Error('Stream is not live');
      }

      // Get channel for access token
      const channel = await channelService.getChannelByYoutubeId(stream.youtubeChannelId);

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

      // Transition to complete
      if (stream.youtubeBroadcastId) {
        await youtubeService.transitionBroadcast(stream.youtubeBroadcastId, 'complete', accessToken);
      }

      // Update local record
      stream.status = 'completed';
      stream.actualEndTime = new Date();
      await stream.save();

      logger.info('Live stream ended', { streamId: id });

      return stream;
    } catch (error) {
      logger.error('Failed to end live stream', { id, error: (error as Error).message });
      throw error;
    }
  }

  async getLiveStreamStats(id: string): Promise<{
    status: LiveStreamStatus;
    currentViewers?: number;
    peakViewers?: number;
    totalViews?: number;
    duration?: number;
  }> {
    try {
      const stream = await LiveStream.findOne({ id });

      if (!stream) {
        throw new Error('Live stream not found');
      }

      if (!stream.youtubeBroadcastId) {
        return {
          status: stream.status,
          currentViewers: stream.currentViewers,
          peakViewers: stream.peakViewers,
          totalViews: stream.totalViews,
        };
      }

      // Get channel for access token
      const channel = await channelService.getChannelByYoutubeId(stream.youtubeChannelId);

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

      // Get live stats from YouTube
      const stats = await youtubeService.getLiveStats(stream.youtubeBroadcastId, accessToken);

      // Update local record
      if (stats.concurrentViewers !== undefined) {
        stream.currentViewers = stats.concurrentViewers;
        if (stats.concurrentViewers > (stream.peakViewers || 0)) {
          stream.peakViewers = stats.concurrentViewers;
        }
      }
      if (stats.totalViews !== undefined) {
        stream.totalViews = stats.totalViews;
      }

      await stream.save();

      // Calculate duration if live
      let duration: number | undefined;
      if (stream.status === 'live' && stream.actualStartTime) {
        duration = Math.floor((Date.now() - stream.actualStartTime.getTime()) / 1000);
      }

      return {
        status: stream.status,
        currentViewers: stream.currentViewers,
        peakViewers: stream.peakViewers,
        totalViews: stream.totalViews,
        duration,
      };
    } catch (error) {
      logger.error('Failed to get live stream stats', { id, error: (error as Error).message });
      throw error;
    }
  }

  async getLiveStreams(filters?: {
    youtubeChannelId?: string;
    status?: LiveStreamStatus;
    page?: number;
    limit?: number;
  }): Promise<{
    streams: ILiveStream[];
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

      const [streams, total] = await Promise.all([
        LiveStream.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        LiveStream.countDocuments(query),
      ]);

      return {
        streams,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error('Failed to get live streams', { error: (error as Error).message });
      throw error;
    }
  }

  async getLiveStreamById(id: string): Promise<ILiveStream | null> {
    try {
      const stream = await LiveStream.findOne({ id });
      return stream;
    } catch (error) {
      logger.error('Failed to get live stream by ID', { id, error: (error as Error).message });
      throw error;
    }
  }

  async getCurrentLiveStream(youtubeChannelId: string): Promise<ILiveStream | null> {
    try {
      const stream = await LiveStream.findOne({
        youtubeChannelId,
        status: 'live',
      });
      return stream;
    } catch (error) {
      logger.error('Failed to get current live stream', {
        youtubeChannelId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async deleteLiveStream(id: string): Promise<void> {
    try {
      await LiveStream.findOneAndDelete({ id });
      logger.info('Live stream deleted', { streamId: id });
    } catch (error) {
      logger.error('Failed to delete live stream', { id, error: (error as Error).message });
      throw error;
    }
  }
}

export const liveStreamService = new LiveStreamService();
export default liveStreamService;