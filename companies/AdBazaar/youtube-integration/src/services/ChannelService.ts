import { v4 as uuidv4 } from 'uuid';
import { YouTubeChannel, IYouTubeChannel } from '../models/YouTubeChannel.js';
import { youtubeService } from './YouTubeService.js';
import logger from '../config/logger.js';

export class ChannelService {
  async connectChannel(params: {
    youtubeChannelId: string;
    accessToken: string;
    refreshToken?: string;
  }): Promise<IYouTubeChannel> {
    try {
      // Fetch channel details from YouTube
      const channelDetails = await youtubeService.getChannelDetails(
        params.youtubeChannelId,
        params.accessToken
      );

      // Check if channel already exists
      const existingChannel = await YouTubeChannel.findOne({
        youtubeChannelId: params.youtubeChannelId,
      });

      if (existingChannel) {
        // Update existing channel
        existingChannel.accessToken = params.accessToken;
        if (params.refreshToken) {
          existingChannel.refreshToken = params.refreshToken;
        }
        existingChannel.title = channelDetails.snippet?.title || existingChannel.title;
        existingChannel.description = channelDetails.snippet?.description || existingChannel.description;
        existingChannel.thumbnailUrl = channelDetails.snippet?.thumbnails?.default?.url;
        existingChannel.customUrl = channelDetails.snippet?.customUrl;
        existingChannel.subscriberCount = parseInt(channelDetails.statistics?.subscriberCount || '0', 10);
        existingChannel.videoCount = parseInt(channelDetails.statistics?.videoCount || '0', 10);
        existingChannel.viewCount = parseInt(channelDetails.statistics?.viewCount || '0', 10);
        existingChannel.country = channelDetails.snippet?.country;

        await existingChannel.save();
        logger.info('Channel updated', { channelId: existingChannel.id });
        return existingChannel;
      }

      // Create new channel
      const channel = new YouTubeChannel({
        id: uuidv4(),
        youtubeChannelId: params.youtubeChannelId,
        title: channelDetails.snippet?.title || 'Unknown Channel',
        description: channelDetails.snippet?.description || '',
        thumbnailUrl: channelDetails.snippet?.thumbnails?.default?.url,
        customUrl: channelDetails.snippet?.customUrl,
        subscriberCount: parseInt(channelDetails.statistics?.subscriberCount || '0', 10),
        videoCount: parseInt(channelDetails.statistics?.videoCount || '0', 10),
        viewCount: parseInt(channelDetails.statistics?.viewCount || '0', 10),
        country: channelDetails.snippet?.country,
        connectedAt: new Date(),
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
      });

      await channel.save();
      logger.info('Channel connected', { channelId: channel.id });

      return channel;
    } catch (error) {
      logger.error('Failed to connect channel', {
        youtubeChannelId: params.youtubeChannelId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getChannels(filters?: {
    page?: number;
    limit?: number;
  }): Promise<{
    channels: IYouTubeChannel[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      const [channels, total] = await Promise.all([
        YouTubeChannel.find().sort({ connectedAt: -1 }).skip(skip).limit(limit),
        YouTubeChannel.countDocuments(),
      ]);

      return {
        channels,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error('Failed to get channels', { error: (error as Error).message });
      throw error;
    }
  }

  async getChannelById(id: string): Promise<IYouTubeChannel | null> {
    try {
      const channel = await YouTubeChannel.findOne({ id });
      return channel;
    } catch (error) {
      logger.error('Failed to get channel by ID', { id, error: (error as Error).message });
      throw error;
    }
  }

  async getChannelByYoutubeId(youtubeChannelId: string): Promise<IYouTubeChannel | null> {
    try {
      const channel = await YouTubeChannel.findOne({ youtubeChannelId });
      return channel;
    } catch (error) {
      logger.error('Failed to get channel by YouTube ID', { youtubeChannelId, error: (error as Error).message });
      throw error;
    }
  }

  async refreshChannelStats(id: string): Promise<IYouTubeChannel | null> {
    try {
      const channel = await YouTubeChannel.findOne({ id });

      if (!channel) {
        throw new Error('Channel not found');
      }

      // Get fresh stats from YouTube
      const channelDetails = await youtubeService.getChannelDetails(
        channel.youtubeChannelId,
        channel.accessToken
      );

      channel.subscriberCount = parseInt(channelDetails.statistics?.subscriberCount || '0', 10);
      channel.videoCount = parseInt(channelDetails.statistics?.videoCount || '0', 10);
      channel.viewCount = parseInt(channelDetails.statistics?.viewCount || '0', 10);

      await channel.save();

      logger.info('Channel stats refreshed', { channelId: id });

      return channel;
    } catch (error) {
      logger.error('Failed to refresh channel stats', { id, error: (error as Error).message });
      throw error;
    }
  }

  async disconnectChannel(id: string): Promise<void> {
    try {
      await YouTubeChannel.findOneAndDelete({ id });
      logger.info('Channel disconnected', { channelId: id });
    } catch (error) {
      logger.error('Failed to disconnect channel', { id, error: (error as Error).message });
      throw error;
    }
  }

  async searchChannels(query: string): Promise<Array<{
    channelId: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
  }>> {
    try {
      const results = await youtubeService.searchChannels(query);

      return results.map((item) => ({
        channelId: item.snippet?.channelId || '',
        title: item.snippet?.channelTitle || '',
        description: item.snippet?.description || '',
        thumbnailUrl: item.snippet?.thumbnails?.default?.url,
      }));
    } catch (error) {
      logger.error('Failed to search channels', { query, error: (error as Error).message });
      throw error;
    }
  }
}

export const channelService = new ChannelService();
export default channelService;