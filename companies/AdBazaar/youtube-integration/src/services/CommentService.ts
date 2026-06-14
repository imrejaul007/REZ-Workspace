import { v4 as uuidv4 } from 'uuid';
import { YouTubeComment, IYouTubeComment, CommentModerationStatus } from '../models/YouTubeComment.js';
import { youtubeService } from './YouTubeService.js';
import { channelService } from './ChannelService.js';
import logger from '../config/logger.js';

export class CommentService {
  async getComments(params: {
    videoId?: string;
    youtubeChannelId?: string;
    status?: CommentModerationStatus;
    page?: number;
    limit?: number;
  }): Promise<{
    comments: IYouTubeComment[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;

      const query: Record<string, unknown> = {};
      if (params.videoId) {
        query.youtubeVideoId = params.videoId;
      }
      if (params.youtubeChannelId) {
        query.youtubeChannelId = params.youtubeChannelId;
      }
      if (params.status) {
        query.moderationStatus = params.status;
      }

      const [comments, total] = await Promise.all([
        YouTubeComment.find(query).sort({ publishedAt: -1 }).skip(skip).limit(limit),
        YouTubeComment.countDocuments(query),
      ]);

      return {
        comments,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error('Failed to get comments', { error: (error as Error).message });
      throw error;
    }
  }

  async syncCommentsFromYouTube(youtubeVideoId: string): Promise<number> {
    try {
      // Get video to find channel
      const video = await import('../models/YouTubeVideo.js').then(m => m.YouTubeVideo)
        .then(model => model.findOne({ youtubeVideoId }));

      if (!video) {
        throw new Error('Video not found');
      }

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

      const youtubeComments = await youtubeService.getComments(youtubeVideoId, accessToken);

      let syncedCount = 0;

      for (const comment of youtubeComments) {
        const snippet = comment.snippet;
        if (!snippet) continue;

        const existingComment = await YouTubeComment.findOne({
          youtubeCommentId: snippet.commentId,
        });

        if (existingComment) {
          // Update existing comment
          existingComment.likeCount = parseInt(snippet.likeCount || '0', 10);
          await existingComment.save();
        } else {
          // Create new comment
          const newComment = new YouTubeComment({
            id: uuidv4(),
            youtubeCommentId: snippet.commentId || '',
            youtubeVideoId: snippet.videoId || '',
            youtubeChannelId: video.youtubeChannelId,
            authorName: snippet.authorDisplayName || 'Anonymous',
            authorChannelId: snippet.authorChannelId?.value,
            text: snippet.textDisplay || '',
            likeCount: parseInt(snippet.likeCount || '0', 10),
            publishedAt: new Date(snippet.publishedAt || Date.now()),
            moderationStatus: 'approved', // Already approved by YouTube by default
          });

          await newComment.save();
          syncedCount++;
        }
      }

      logger.info('Comments synced from YouTube', {
        youtubeVideoId,
        syncedCount,
        totalComments: youtubeComments.length,
      });

      return syncedCount;
    } catch (error) {
      logger.error('Failed to sync comments', {
        youtubeVideoId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async moderateComment(
    commentId: string,
    action: 'approve' | 'reject' | 'flag',
    note?: string
  ): Promise<IYouTubeComment> {
    try {
      const comment = await YouTubeComment.findOne({ id: commentId });

      if (!comment) {
        throw new Error('Comment not found');
      }

      // Get channel for access token
      const channel = await channelService.getChannelByYoutubeId(comment.youtubeChannelId);

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

      // Moderate on YouTube
      let youtubeAction: 'approve' | 'hold' | 'spam';
      switch (action) {
        case 'approve':
          youtubeAction = 'approve';
          comment.moderationStatus = 'approved';
          break;
        case 'reject':
          youtubeAction = 'spam';
          comment.moderationStatus = 'rejected';
          break;
        case 'flag':
        default:
          youtubeAction = 'hold';
          comment.moderationStatus = 'flagged';
          break;
      }

      await youtubeService.moderateComment(comment.youtubeCommentId, youtubeAction, accessToken);

      // Update local record
      comment.moderationStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged';
      comment.moderationNote = note;
      comment.moderatedAt = new Date();
      comment.moderationAction = action;

      await comment.save();

      logger.info('Comment moderated', { commentId, action });

      return comment;
    } catch (error) {
      logger.error('Failed to moderate comment', {
        commentId,
        action,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async moderateBatch(
    commentIds: string[],
    action: 'approve' | 'reject' | 'flag',
    note?: string
  ): Promise<{
    succeeded: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const succeeded: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const commentId of commentIds) {
      try {
        await this.moderateComment(commentId, action, note);
        succeeded.push(commentId);
      } catch (error) {
        failed.push({
          id: commentId,
          error: (error as Error).message,
        });
      }
    }

    logger.info('Batch moderation completed', {
      succeeded: succeeded.length,
      failed: failed.length,
    });

    return { succeeded, failed };
  }

  async getCommentStats(youtubeChannelId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    flagged: number;
  }> {
    try {
      const result = await YouTubeComment.aggregate([
        { $match: { youtubeChannelId } },
        {
          $group: {
            _id: '$moderationStatus',
            count: { $sum: 1 },
          },
        },
      ]);

      const stats = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        flagged: 0,
      };

      for (const item of result) {
        stats[item._id as keyof typeof stats] = item.count;
        stats.total += item.count;
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get comment stats', {
        youtubeChannelId,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const commentService = new CommentService();
export default commentService;