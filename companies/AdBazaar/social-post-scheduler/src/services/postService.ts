import { Post, IPost, Platform } from '../models';
import { createChildLogger } from '../utils/logger';
import { postsCreatedTotal } from '../utils/metrics';

const logger = createChildLogger('PostService');

export interface CreatePostInput {
  userId: string;
  content: string;
  mediaUrls?: string[];
  platform: Platform;
  metadata?: {
    hashtags?: string[];
    mentions?: string[];
    location?: string;
    link?: string;
  };
}

export interface UpdatePostInput {
  content?: string;
  mediaUrls?: string[];
  metadata?: {
    hashtags?: string[];
    mentions?: string[];
    location?: string;
    link?: string;
  };
}

export class PostService {
  async create(input: CreatePostInput): Promise<IPost> {
    logger.info('Creating new post', { userId: input.userId, platform: input.platform });

    const post = new Post({
      userId: input.userId,
      content: input.content,
      mediaUrls: input.mediaUrls || [],
      platform: input.platform,
      status: 'draft',
      metadata: input.metadata || {}
    });

    await post.save();
    postsCreatedTotal.inc({ platform: input.platform });

    logger.info('Post created successfully', { postId: post._id });
    return post;
  }

  async findById(id: string): Promise<IPost | null> {
    return Post.findById(id);
  }

  async findByUser(userId: string, options?: { limit?: number; skip?: number; status?: string }): Promise<IPost[]> {
    const query: Record<string, unknown> = { userId };
    if (options?.status) {
      query.status = options.status;
    }

    return Post.find(query)
      .sort({ createdAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50);
  }

  async update(id: string, input: UpdatePostInput): Promise<IPost | null> {
    const updateData: Record<string, unknown> = {};

    if (input.content !== undefined) updateData.content = input.content;
    if (input.mediaUrls !== undefined) updateData.mediaUrls = input.mediaUrls;
    if (input.metadata) updateData.metadata = input.metadata;

    return Post.findByIdAndUpdate(id, updateData, { new: true });
  }

  async updateStatus(id: string, status: IPost['status']): Promise<IPost | null> {
    const updateData: Record<string, unknown> = { status };

    if (status === 'published') {
      updateData.publishedAt = new Date();
    }

    return Post.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Post.findByIdAndDelete(id);
    return !!result;
  }

  async getUpcomingPosts(userId: string, limit: number = 10): Promise<IPost[]> {
    return Post.find({
      userId,
      status: 'scheduled',
      scheduledAt: { $gte: new Date() }
    })
      .sort({ scheduledAt: 1 })
      .limit(limit);
  }
}

export const postService = new PostService();