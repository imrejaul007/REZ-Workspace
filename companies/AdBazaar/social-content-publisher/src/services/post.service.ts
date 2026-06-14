import { v4 as uuidv4 } from 'uuid';
import UnifiedPostModel, { IUnifiedPostDocument } from '../models/unified-post.model';
import { IContent, IPlatformConfig } from '../models';
import { CreatePostInput, UpdatePostInput, PaginationInput } from '../middleware/validation.middleware';
import { NotFoundError, ConflictError } from '../middleware/error.middleware';
import { logger } from '../config/logger';
import { postsCreatedTotal } from '../config/metrics';

export interface CreatePostData {
  title: string;
  content: IContent;
  platforms: IPlatformConfig[];
  scheduledTime?: Date;
  userId: string;
  companyId: string;
}

export interface UpdatePostData {
  title?: string;
  content?: IContent;
  platforms?: IPlatformConfig[];
  scheduledTime?: Date | null;
}

export interface PostFilters {
  status?: string;
  workflowStatus?: string;
  startDate?: Date;
  endDate?: Date;
  companyId: string;
}

export class PostService {
  async create(data: CreatePostData): Promise<IUnifiedPostDocument> {
    const post = new UnifiedPostModel({
      userId: data.userId,
      companyId: data.companyId,
      title: data.title,
      content: data.content,
      platforms: data.platforms,
      scheduledTime: data.scheduledTime,
      status: data.scheduledTime ? 'scheduled' : 'draft',
      workflow: {
        status: 'pending',
      },
      versionHistory: [
        {
          version: 1,
          content: data.content,
          updatedBy: data.userId,
          updatedAt: new Date(),
          changeNote: 'Initial version',
        },
      ],
    });

    await post.save();
    postsCreatedTotal.inc({ company_id: data.companyId });
    logger.info('Post created', { postId: post.id, companyId: data.companyId });

    return post;
  }

  async findById(id: string): Promise<IUnifiedPostDocument> {
    const post = await UnifiedPostModel.findById(id);
    if (!post) {
      throw new NotFoundError(`Post not found: ${id}`);
    }
    return post;
  }

  async findByIdAndCompany(id: string, companyId: string): Promise<IUnifiedPostDocument> {
    const post = await UnifiedPostModel.findOne({ _id: id, companyId });
    if (!post) {
      throw new NotFoundError(`Post not found: ${id}`);
    }
    return post;
  }

  async findAll(filters: PostFilters, pagination: PaginationInput) {
    const query: any = { companyId: filters.companyId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.workflowStatus) {
      query['workflow.status'] = filters.workflowStatus;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const sortField = pagination.sortBy === 'scheduledTime' ? 'scheduledTime' : pagination.sortBy;
    const sortDirection = pagination.sortOrder === 'asc' ? 1 : -1;

    const [posts, total] = await Promise.all([
      UnifiedPostModel.find(query)
        .sort({ [sortField]: sortDirection })
        .skip((pagination.page - 1) * pagination.limit)
        .limit(pagination.limit)
        .lean(),
      UnifiedPostModel.countDocuments(query),
    ]);

    return {
      posts,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async update(id: string, userId: string, data: UpdatePostData): Promise<IUnifiedPostDocument> {
    const post = await this.findById(id);

    // Check if post is editable (not already published)
    if (['published', 'publishing'].includes(post.status)) {
      throw new ConflictError('Cannot edit a post that is already published or publishing');
    }

    // Save current version to history
    const currentVersion = post.versionHistory?.length || 0;
    post.versionHistory = [
      ...(post.versionHistory || []),
      {
        version: currentVersion + 1,
        content: post.content,
        updatedBy: userId,
        updatedAt: new Date(),
        changeNote: `Updated to version ${currentVersion + 1}`,
      },
    ];

    // Update fields
    if (data.title !== undefined) post.title = data.title;
    if (data.content !== undefined) post.content = data.content;
    if (data.platforms !== undefined) post.platforms = data.platforms;
    if (data.scheduledTime !== undefined) {
      post.scheduledTime = data.scheduledTime;
      post.status = data.scheduledTime ? 'scheduled' : 'draft';
    }

    await post.save();
    logger.info('Post updated', { postId: id, userId });

    return post;
  }

  async delete(id: string): Promise<void> {
    const post = await this.findById(id);

    // Check if post is currently publishing
    if (post.status === 'publishing') {
      throw new ConflictError('Cannot delete a post that is currently publishing');
    }

    await UnifiedPostModel.findByIdAndDelete(id);
    logger.info('Post deleted', { postId: id });
  }

  async submitForReview(id: string, userId: string): Promise<IUnifiedPostDocument> {
    const post = await this.findById(id);

    if (post.status !== 'draft' && post.status !== 'scheduled') {
      throw new ConflictError('Can only submit draft or scheduled posts for review');
    }

    post.workflow.status = 'review';
    await post.save();

    logger.info('Post submitted for review', { postId: id, userId });
    return post;
  }

  async approve(id: string, reviewerId: string, notes?: string): Promise<IUnifiedPostDocument> {
    const post = await this.findById(id);

    if (post.workflow.status !== 'review') {
      throw new ConflictError('Can only approve posts that are in review');
    }

    post.workflow.status = 'approved';
    post.workflow.reviewedBy = reviewerId;
    post.workflow.reviewedAt = new Date();
    post.workflow.reviewNotes = notes;

    await post.save();
    logger.info('Post approved', { postId: id, reviewerId });

    return post;
  }

  async reject(id: string, reviewerId: string, notes: string): Promise<IUnifiedPostDocument> {
    const post = await this.findById(id);

    if (post.workflow.status !== 'review') {
      throw new ConflictError('Can only reject posts that are in review');
    }

    post.workflow.status = 'rejected';
    post.workflow.reviewedBy = reviewerId;
    post.workflow.reviewedAt = new Date();
    post.workflow.reviewNotes = notes;

    await post.save();
    logger.info('Post rejected', { postId: id, reviewerId, notes });

    return post;
  }

  async getCalendarData(companyId: string, startDate: Date, endDate: Date) {
    const posts = await UnifiedPostModel.find({
      companyId,
      $or: [
        { scheduledTime: { $gte: startDate, $lte: endDate } },
        { createdAt: { $gte: startDate, $lte: endDate }, status: 'draft' },
      ],
    })
      .select('title content scheduledTime status workflow platforms')
      .sort({ scheduledTime: 1 })
      .lean();

    return posts.map((post) => ({
      id: post._id.toString(),
      title: post.title,
      date: post.scheduledTime || post.createdAt,
      status: post.status,
      workflowStatus: post.workflow.status,
      platforms: post.platforms.map((p) => p.platform),
    }));
  }

  async getVersionHistory(id: string): Promise<any[]> {
    const post = await this.findById(id);
    return post.versionHistory || [];
  }

  async checkConflicts(
    companyId: string,
    scheduledTime: Date,
    excludePostId?: string
  ): Promise<{ hasConflict: boolean; conflictingPosts?: any[] }> {
    const timeWindow = 30 * 60 * 1000; // 30 minutes
    const startTime = new Date(scheduledTime.getTime() - timeWindow);
    const endTime = new Date(scheduledTime.getTime() + timeWindow);

    const query: any = {
      companyId,
      status: { $in: ['scheduled', 'approved'] },
      scheduledTime: { $gte: startTime, $lte: endTime },
    };

    if (excludePostId) {
      query._id = { $ne: excludePostId };
    }

    const conflictingPosts = await UnifiedPostModel.find(query)
      .select('title scheduledTime platforms')
      .lean();

    return {
      hasConflict: conflictingPosts.length > 0,
      conflictingPosts: conflictingPosts.length > 0 ? conflictingPosts : undefined,
    };
  }
}

export const postService = new PostService();