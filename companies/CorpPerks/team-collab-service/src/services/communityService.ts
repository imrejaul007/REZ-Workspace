import { Community, CommunityMember, CommunityPost, ICommunity, ICommunityMember, ICommunityPost } from '../models/Community.js';
import { generateId } from '../types/index.js';
import { NotFoundError, ConflictError } from '../middleware/errorHandler.js';

export class CommunityService {
  // ============= COMMUNITIES =============

  /**
   * Create a new community
   */
  async createCommunity(data: {
    companyId: string;
    name: string;
    description: string;
    ownerId: string;
    ownerName: string;
    type?: 'public' | 'private' | 'hidden';
    category?: 'interest' | 'project' | 'department' | 'location' | 'other';
    icon?: string;
    coverImage?: string;
    tags?: string[];
    rules?: string[];
  }): Promise<ICommunity> {
    const community = new Community({
      communityId: generateId('COMM'),
      ...data,
      type: data.type || 'public',
      category: data.category || 'interest',
      icon: data.icon || 'users',
      tags: data.tags || [],
      memberCount: 1,
      postCount: 0,
      isActive: true,
    });

    await community.save();

    // Add owner as admin member
    await this.addMember(community.communityId, {
      userId: data.ownerId,
      userName: data.ownerName,
      role: 'admin',
    });

    return community;
  }

  /**
   * Get communities with filters
   */
  async getCommunities(
    companyId: string,
    options: {
      type?: 'public' | 'private' | 'hidden';
      category?: string;
      userId?: string;
      search?: string;
      limit?: number;
      page?: number;
    } = {}
  ): Promise<{ communities: ICommunity[]; total: number }> {
    const { type, category, userId, search, limit = 20, page = 1 } = options;

    const filter: Record<string, unknown> = { companyId, isActive: true };

    // Only show public communities to non-members
    if (type) {
      filter.type = type;
    } else if (!userId) {
      filter.type = 'public';
    }

    if (category) filter.category = category;

    if (search) {
      filter.$text = { $search: search };
    }

    const [communities, total] = await Promise.all([
      Community.find(filter)
        .sort({ memberCount: -1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Community.countDocuments(filter),
    ]);

    return { communities: communities as ICommunity[], total };
  }

  /**
   * Get community by ID
   */
  async getCommunityById(communityId: string): Promise<ICommunity> {
    const community = await Community.findOne({ communityId }).lean();
    if (!community) throw new NotFoundError('Community', communityId);
    return community as ICommunity;
  }

  /**
   * Update community
   */
  async updateCommunity(
    communityId: string,
    updates: Partial<{
      name: string;
      description: string;
      icon: string;
      coverImage: string;
      type: 'public' | 'private' | 'hidden';
      category: 'interest' | 'project' | 'department' | 'location' | 'other';
      rules: string[];
      tags: string[];
    }>
  ): Promise<ICommunity> {
    const community = await Community.findOne({ communityId });
    if (!community) throw new NotFoundError('Community', communityId);

    Object.assign(community, updates);
    await community.save();

    return community;
  }

  /**
   * Delete community
   */
  async deleteCommunity(communityId: string): Promise<void> {
    const community = await Community.findOne({ communityId });
    if (!community) throw new NotFoundError('Community', communityId);

    community.isActive = false;
    await community.save();

    // Soft delete posts
    await CommunityPost.updateMany({ communityId }, { isHidden: true });
  }

  // ============= MEMBERS =============

  /**
   * Add member to community
   */
  async addMember(communityId: string, data: {
    userId: string;
    userName: string;
    role?: 'member' | 'moderator' | 'admin';
  }): Promise<ICommunityMember> {
    // Check if already member
    const existing = await CommunityMember.findOne({
      communityId,
      userId: data.userId,
    });

    if (existing) {
      throw new ConflictError('User is already a member of this community');
    }

    const member = new CommunityMember({
      communityId,
      userId: data.userId,
      userName: data.userName,
      role: data.role || 'member',
      joinedAt: new Date(),
      notificationsEnabled: true,
    });

    await member.save();

    // Update member count
    await Community.findOneAndUpdate(
      { communityId },
      { $inc: { memberCount: 1 } }
    );

    return member;
  }

  /**
   * Remove member from community
   */
  async removeMember(communityId: string, userId: string): Promise<void> {
    const result = await CommunityMember.findOneAndDelete({ communityId, userId });

    if (!result) {
      throw new NotFoundError('Member');
    }

    // Update member count
    await Community.findOneAndUpdate(
      { communityId },
      { $inc: { memberCount: -1 } }
    );
  }

  /**
   * Get community members
   */
  async getMembers(
    communityId: string,
    options: { role?: string; limit?: number; page?: number } = {}
  ): Promise<{ members: ICommunityMember[]; total: number }> {
    const { role, limit = 50, page = 1 } = options;

    const filter: Record<string, unknown> = { communityId };
    if (role) filter.role = role;

    const [members, total] = await Promise.all([
      CommunityMember.find(filter)
        .sort({ joinedAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CommunityMember.countDocuments(filter),
    ]);

    return { members: members as ICommunityMember[], total };
  }

  /**
   * Check if user is member
   */
  async isMember(communityId: string, userId: string): Promise<boolean> {
    const member = await CommunityMember.findOne({ communityId, userId });
    return !!member;
  }

  /**
   * Get user's communities
   */
  async getUserCommunities(userId: string, companyId: string): Promise<ICommunity[]> {
    const memberships = await CommunityMember.find({ userId });
    const communityIds = memberships.map((m) => m.communityId);

    return Community.find({
      communityId: { $in: communityIds },
      companyId,
      isActive: true,
    }).lean() as Promise<ICommunity[]>;
  }

  // ============= POSTS =============

  /**
   * Create post
   */
  async createPost(data: {
    communityId: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    type?: 'text' | 'image' | 'link' | 'poll';
    attachments?: Array<{
      id: string;
      filename: string;
      url: string;
      mimeType: string;
    }>;
  }): Promise<ICommunityPost> {
    const post = new CommunityPost({
      postId: generateId('POST'),
      ...data,
      type: data.type || 'text',
      attachments: data.attachments || [],
      likeCount: 0,
      commentCount: 0,
      isPinned: false,
      isHidden: false,
    });

    await post.save();

    // Update community post count
    await Community.findOneAndUpdate(
      { communityId: data.communityId },
      { $inc: { postCount: 1 } }
    );

    // Update member last active
    await CommunityMember.findOneAndUpdate(
      { communityId: data.communityId, userId: data.authorId },
      { lastActiveAt: new Date() }
    );

    return post;
  }

  /**
   * Get community posts
   */
  async getPosts(
    communityId: string,
    options: { limit?: number; page?: number } = {}
  ): Promise<{ posts: ICommunityPost[]; total: number }> {
    const { limit = 20, page = 1 } = options;

    const [posts, total] = await Promise.all([
      CommunityPost.find({ communityId, isHidden: false })
        .sort({ isPinned: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CommunityPost.countDocuments({ communityId, isHidden: false }),
    ]);

    return { posts: posts as ICommunityPost[], total };
  }

  /**
   * Get post by ID
   */
  async getPostById(postId: string): Promise<ICommunityPost> {
    const post = await CommunityPost.findOne({ postId, isHidden: false }).lean();
    if (!post) throw new NotFoundError('Post', postId);
    return post as ICommunityPost;
  }

  /**
   * Delete post
   */
  async deletePost(postId: string): Promise<void> {
    const post = await CommunityPost.findOne({ postId });
    if (!post) throw new NotFoundError('Post', postId);

    await post.deleteOne();

    // Update community post count
    await Community.findOneAndUpdate(
      { communityId: post.communityId },
      { $inc: { postCount: -1 } }
    );
  }

  /**
   * Get user's posts across communities
   */
  async getUserPosts(
    userId: string,
    options: { limit?: number; page?: number } = {}
  ): Promise<{ posts: ICommunityPost[]; total: number }> {
    const { limit = 20, page = 1 } = options;

    const [posts, total] = await Promise.all([
      CommunityPost.find({ authorId: userId, isHidden: false })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CommunityPost.countDocuments({ authorId: userId, isHidden: false }),
    ]);

    return { posts: posts as ICommunityPost[], total };
  }
}

export const communityService = new CommunityService();
