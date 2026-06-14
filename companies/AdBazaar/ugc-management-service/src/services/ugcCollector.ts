import axios from 'axios';
import { UGCContent, IUGCContent } from '../models';
import { logger } from '../config/logger';
import { config } from '../config';

interface PlatformPost {
  id: string;
  caption?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  author: {
    platformUserId: string;
    username: string;
    displayName: string;
    followerCount: number;
    profileImage?: string;
  };
  hashtags: string[];
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  originalUrl: string;
}

class UGCCollectorService {
  /**
   * Collect UGC from Instagram using hashtag search
   */
  async collectFromInstagram(hashtags: string[], campaignId?: string): Promise<IUGCContent[]> {
    if (!config.instagram.accessToken || !config.instagram.businessAccountId) {
      logger.warn('Instagram API credentials not configured');
      return [];
    }

    const collected: IUGCContent[] = [];

    for (const hashtag of hashtags) {
      try {
        // Get hashtag ID
        const hashtagResponse = await axios.get(
          `https://graph.facebook.com/v18.0/ig_hashtag_search`,
          {
            params: {
              user_id: config.instagram.businessAccountId,
              q: hashtag,
              access_token: config.instagram.accessToken
            }
          }
        );

        if (!hashtagResponse.data.data?.length) {
          continue;
        }

        const hashtagId = hashtagResponse.data.data[0].id;

        // Get recent media with this hashtag
        const mediaResponse = await axios.get(
          `https://graph.facebook.com/v18.0/${hashtagId}/recent_media`,
          {
            params: {
              user_id: config.instagram.businessAccountId,
              fields: 'id,caption,media_type,media_url,permalink,username,like_count,comments_count,owner',
              access_token: config.instagram.accessToken
            }
          }
        );

        const posts = mediaResponse.data.data || [];

        for (const post of posts) {
          const existingContent = await UGCContent.findOne({ originalUrl: post.permalink });
          if (existingContent) continue;

          const ugcContent = await this.createUGCFromInstagram(post, campaignId);
          if (ugcContent) {
            collected.push(ugcContent);
          }
        }

        logger.info(`Collected ${posts.length} posts from Instagram hashtag #${hashtag}`);
      } catch (error) {
        logger.error(`Error collecting from Instagram hashtag #${hashtag}`, { error });
      }
    }

    return collected;
  }

  /**
   * Collect UGC from Twitter/X
   */
  async collectFromTwitter(hashtags: string[], campaignId?: string): Promise<IUGCContent[]> {
    if (!config.twitter.bearerToken) {
      logger.warn('Twitter API credentials not configured');
      return [];
    }

    const collected: IUGCContent[] = [];

    for (const hashtag of hashtags) {
      try {
        const response = await axios.get(
          'https://api.twitter.com/2/tweets/search/recent',
          {
            headers: {
              'Authorization': `Bearer ${config.twitter.bearerToken}`
            },
            params: {
              query: `#${hashtag} has:media -is:retweet`,
              'tweet.fields': 'public_metrics,created_at,author_id,entities',
              'expansions': 'author_id,attachments.media_keys',
              'user.fields': 'name,username,profile_image_url,public_metrics',
              'media.fields': 'url,preview_image_url,type'
            }
          }
        );

        const tweets = response.data.data || [];
        const users = response.data.includes?.users || [];
        const media = response.data.includes?.media || [];

        const userMap = new Map(users.map((u: any) => [u.id, u]));
        const mediaMap = new Map(media.map((m: any) => [m.media_key, m]));

        for (const tweet of tweets) {
          const existingContent = await UGCContent.findOne({
            originalUrl: `https://twitter.com/i/web/status/${tweet.id}`
          });
          if (existingContent) continue;

          const author = userMap.get(tweet.author_id);
          const tweetMedia = tweet.data?.attachments?.media_keys
            ?.map((k: string) => mediaMap.get(k))
            ?.filter(Boolean) || [];

          const ugcContent = await this.createUGCFromTwitter(tweet, author, tweetMedia, campaignId);
          if (ugcContent) {
            collected.push(ugcContent);
          }
        }

        logger.info(`Collected ${tweets.length} tweets from hashtag #${hashtag}`);
      } catch (error) {
        logger.error(`Error collecting from Twitter hashtag #${hashtag}`, { error });
      }
    }

    return collected;
  }

  /**
   * Collect UGC from TikTok
   */
  async collectFromTikTok(hashtags: string[], campaignId?: string): Promise<IUGCContent[]> {
    // TikTok API implementation placeholder
    // TikTok has limited public API access, would need official partnership
    logger.warn('TikTok collection not implemented - requires official API partnership');
    return [];
  }

  /**
   * Collect UGC from Facebook
   */
  async collectFromFacebook(hashtags: string[], campaignId?: string): Promise<IUGCContent[]> {
    if (!config.facebook.accessToken || !config.facebook.pageId) {
      logger.warn('Facebook API credentials not configured');
      return [];
    }

    const collected: IUGCContent[] = [];

    // Facebook hashtag search requires additional permissions
    // Using page posts as a fallback
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${config.facebook.pageId}/posts`,
        {
          params: {
            fields: 'id,message,full_picture,type,link,created_time,from,likes.summary(true),comments.summary(true),shares',
            access_token: config.facebook.accessToken
          }
        }
      );

      const posts = response.data.data || [];

      for (const post of posts) {
        const existingContent = await UGCContent.findOne({
          originalUrl: post.link || `https://facebook.com/${config.facebook.pageId}/posts/${post.id}`
        });
        if (existingContent) continue;

        const ugcContent = await this.createUGCFromFacebook(post, campaignId);
        if (ugcContent) {
          collected.push(ugcContent);
        }
      }

      logger.info(`Collected ${posts.length} posts from Facebook page`);
    } catch (error) {
      logger.error('Error collecting from Facebook', { error });
    }

    return collected;
  }

  /**
   * Collect from all platforms
   */
  async collectUGC(
    platforms: Array<'instagram' | 'twitter' | 'facebook' | 'tiktok'>,
    hashtags: string[],
    campaignId?: string
  ): Promise<{ collected: number; byPlatform: Record<string, number> }> {
    const byPlatform: Record<string, number> = {};

    for (const platform of platforms) {
      let results: IUGCContent[] = [];

      switch (platform) {
        case 'instagram':
          results = await this.collectFromInstagram(hashtags, campaignId);
          break;
        case 'twitter':
          results = await this.collectFromTwitter(hashtags, campaignId);
          break;
        case 'facebook':
          results = await this.collectFromFacebook(hashtags, campaignId);
          break;
        case 'tiktok':
          results = await this.collectFromTikTok(hashtags, campaignId);
          break;
      }

      byPlatform[platform] = results.length;
    }

    const total = Object.values(byPlatform).reduce((sum, count) => sum + count, 0);

    // Update campaign stats
    if (campaignId) {
      const { UGCCampaign } = await import('../models');
      await UGCCampaign.findByIdAndUpdate(campaignId, {
        $inc: { 'stats.collected': total }
      });
    }

    logger.info('UGC collection completed', { total, byPlatform });

    return { collected: total, byPlatform };
  }

  private async createUGCFromInstagram(post: any, campaignId?: string): Promise<IUGCContent | null> {
    try {
      const hashtags = this.extractHashtags(post.caption || '');

      return await UGCContent.create({
        platform: 'instagram',
        originalUrl: post.permalink,
        mediaUrl: post.media_type === 'VIDEO' ? post.video_url : post.media_url,
        mediaType: post.media_type === 'VIDEO' ? 'video' : 'image',
        caption: post.caption || '',
        author: {
          platformUserId: post.owner?.id || '',
          username: post.username,
          displayName: post.username,
          followerCount: 0 // Requires additional API call
        },
        hashtags,
        engagement: {
          likes: post.like_count || 0,
          comments: post.comments_count || 0,
          shares: 0
        },
        campaignId,
        status: 'pending_review'
      });
    } catch (error) {
      logger.error('Error creating UGC from Instagram post', { error, postId: post.id });
      return null;
    }
  }

  private async createUGCFromTwitter(
    tweet: any,
    author: any,
    media: any[],
    campaignId?: string
  ): Promise<IUGCContent | null> {
    try {
      const hashtags = tweet.entities?.hashtags?.map((h: any) => h.tag) || [];

      return await UGCContent.create({
        platform: 'twitter',
        originalUrl: `https://twitter.com/i/web/status/${tweet.id}`,
        mediaUrl: media[0]?.url || media[0]?.preview_image_url || '',
        mediaType: media[0]?.type === 'video' ? 'video' : 'image',
        caption: tweet.text || '',
        author: {
          platformUserId: author?.id || tweet.author_id,
          username: author?.username || '',
          displayName: author?.name || '',
          followerCount: author?.public_metrics?.followers_count || 0,
          profileImage: author?.profile_image_url
        },
        hashtags,
        engagement: {
          likes: tweet.public_metrics?.like_count || 0,
          comments: tweet.public_metrics?.reply_count || 0,
          shares: tweet.public_metrics?.retweet_count || 0
        },
        campaignId,
        status: 'pending_review'
      });
    } catch (error) {
      logger.error('Error creating UGC from Twitter post', { error, tweetId: tweet.id });
      return null;
    }
  }

  private async createUGCFromFacebook(post: any, campaignId?: string): Promise<IUGCContent | null> {
    try {
      const hashtags = this.extractHashtags(post.message || '');

      return await UGCContent.create({
        platform: 'facebook',
        originalUrl: post.link || `https://facebook.com/${post.id}`,
        mediaUrl: post.full_picture || '',
        mediaType: post.type === 'video' ? 'video' : 'image',
        caption: post.message || '',
        author: {
          platformUserId: post.from?.id || '',
          username: post.from?.name || '',
          displayName: post.from?.name || '',
          followerCount: 0
        },
        hashtags,
        engagement: {
          likes: post.likes?.summary?.total_count || 0,
          comments: post.comments?.summary?.total_count || 0,
          shares: post.shares?.count || 0
        },
        campaignId,
        status: 'pending_review'
      });
    } catch (error) {
      logger.error('Error creating UGC from Facebook post', { error, postId: post.id });
      return null;
    }
  }

  private extractHashtags(text: string): string[] {
    const regex = /#[\w]+/g;
    return (text.match(regex) || []).map(tag => tag.toLowerCase().replace('#', ''));
  }
}

export const ugcCollectorService = new UGCCollectorService();