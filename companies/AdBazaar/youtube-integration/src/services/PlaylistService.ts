import { v4 as uuidv4 } from 'uuid';
import { YouTubePlaylist, IYouTubePlaylist } from '../models/YouTubePlaylist.js';
import { youtubeService } from './YouTubeService.js';
import { channelService } from './ChannelService.js';
import logger from '../config/logger.js';

export class PlaylistService {
  async createPlaylist(params: {
    youtubeChannelId: string;
    title: string;
    description?: string;
    privacyStatus?: 'public' | 'unlisted' | 'private';
  }): Promise<IYouTubePlaylist> {
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
      const youtubePlaylist = await youtubeService.createPlaylist({
        title: params.title,
        description: params.description,
        privacyStatus: params.privacyStatus,
        accessToken: accessToken!,
      });

      // Create local record
      const playlist = new YouTubePlaylist({
        id: uuidv4(),
        youtubePlaylistId: youtubePlaylist.id!,
        youtubeChannelId: params.youtubeChannelId,
        title: params.title,
        description: params.description || '',
        privacyStatus: params.privacyStatus || 'private',
        thumbnailUrl: youtubePlaylist.snippet?.thumbnails?.default?.url,
      });

      await playlist.save();

      logger.info('Playlist created', { playlistId: playlist.id });

      return playlist;
    } catch (error) {
      logger.error('Failed to create playlist', {
        youtubeChannelId: params.youtubeChannelId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getPlaylists(filters?: {
    youtubeChannelId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    playlists: IYouTubePlaylist[];
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

      const [playlists, total] = await Promise.all([
        YouTubePlaylist.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        YouTubePlaylist.countDocuments(query),
      ]);

      return {
        playlists,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error('Failed to get playlists', { error: (error as Error).message });
      throw error;
    }
  }

  async getPlaylistById(id: string): Promise<IYouTubePlaylist | null> {
    try {
      const playlist = await YouTubePlaylist.findOne({ id });
      return playlist;
    } catch (error) {
      logger.error('Failed to get playlist by ID', { id, error: (error as Error).message });
      throw error;
    }
  }

  async addVideoToPlaylist(playlistId: string, videoId: string): Promise<IYouTubePlaylist> {
    try {
      const playlist = await YouTubePlaylist.findOne({ id: playlistId });

      if (!playlist) {
        throw new Error('Playlist not found');
      }

      // Get channel for access token
      const channel = await channelService.getChannelByYoutubeId(playlist.youtubeChannelId);

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

      // Add video on YouTube
      await youtubeService.addVideoToPlaylist(
        playlist.youtubePlaylistId!,
        videoId,
        accessToken
      );

      // Update local record
      playlist.videoCount += 1;
      await playlist.save();

      logger.info('Video added to playlist', { playlistId, videoId });

      return playlist;
    } catch (error) {
      logger.error('Failed to add video to playlist', {
        playlistId,
        videoId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<IYouTubePlaylist> {
    try {
      const playlist = await YouTubePlaylist.findOne({ id: playlistId });

      if (!playlist) {
        throw new Error('Playlist not found');
      }

      // Update local count
      playlist.videoCount = Math.max(0, playlist.videoCount - 1);
      await playlist.save();

      logger.info('Video removed from playlist', { playlistId, videoId });

      return playlist;
    } catch (error) {
      logger.error('Failed to remove video from playlist', {
        playlistId,
        videoId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async deletePlaylist(id: string): Promise<void> {
    try {
      await YouTubePlaylist.findOneAndDelete({ id });
      logger.info('Playlist deleted', { playlistId: id });
    } catch (error) {
      logger.error('Failed to delete playlist', { id, error: (error as Error).message });
      throw error;
    }
  }
}

export const playlistService = new PlaylistService();
export default playlistService;