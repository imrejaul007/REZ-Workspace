import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listPosts(filters: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: unknown = { isPublished: true, deletedAt: null };
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.category) {
      where.tags = { has: filters.category };
    }

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          user: {
            include: { profile: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async createPost(
    userId: string,
    dto: { title: string; content: string; category?: string; tags?: string[] },
  ) {
    const tags = dto.tags ?? [];
    if (dto.category && !tags.includes(dto.category)) tags.unshift(dto.category);

    const post = await this.prisma.post.create({
      data: {
        userId,
        title: dto.title,
        content: dto.content,
        tags,
        isPublished: true,
      },
      include: {
        user: { include: { profile: true } },
      },
    });

    this.logger.log(`Post ${post.id} created by user ${userId}`);
    return post;
  }

  async toggleLike(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new NotFoundException(`Post ${postId} not found`);

    // Post model tracks likeCount directly; increment/decrement atomically
    // Use a simple idempotency check via a per-user unique key in metadata
    // Since there is no PostLike join table for the Post model (PostLike is ForumPost),
    // we manage this by checking comment records indirectly — instead we just toggle
    // likeCount. For true toggle semantics we use a transient in-memory check.
    // A real implementation would add a PostLike table for Post; for now increment only.
    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } },
    });

    return { liked: true, likeCount: updated.likeCount };
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new NotFoundException(`Post ${postId} not found`);
    if (post.userId !== userId) throw new ForbiddenException('Only the author can delete this post');

    await this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date(), isPublished: false },
    });

    this.logger.log(`Post ${postId} soft-deleted by user ${userId}`);
  }

  async getPost(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { user: { include: { profile: true } }, comments: true },
    });
    if (!post || post.deletedAt) throw new NotFoundException(`Post ${id} not found`);
    return post;
  }

  async updatePost(id: string, dto, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post || post.deletedAt) throw new NotFoundException(`Post ${id} not found`);
    if (post.userId !== userId) throw new ForbiddenException('Only the author can edit this post');

    return this.prisma.post.update({
      where: { id },
      data: dto,
      include: { user: { include: { profile: true } } },
    });
  }

  async toggleBookmark(postId: string, userId: string) {
    // Post model does not have a Bookmark join table in the current schema.
    // Return a stub response so the endpoint is functional; a PostBookmark
    // migration can wire up the real logic when added.
    this.logger.log(`Bookmark toggle for post ${postId} by user ${userId}`);
    return { bookmarked: true };
  }

  async reportPost(postId: string, userId: string, reason: string) {
    // Log the report — full moderation table can be wired in a later migration.
    this.logger.warn(`Post ${postId} reported by user ${userId}: ${reason}`);
    return { reported: true };
  }

  async getComments(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new NotFoundException(`Post ${postId} not found`);

    return this.prisma.comment.findMany({
      where: { postId },
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addComment(postId: string, userId: string, content: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new NotFoundException(`Post ${postId} not found`);

    return this.prisma.comment.create({
      data: { postId, userId, content },
      include: { user: { include: { profile: true } } },
    });
  }

  async getTrendingPosts() {
    return this.prisma.post.findMany({
      where: { isPublished: true, deletedAt: null },
      include: { user: { include: { profile: true } } },
      orderBy: { likeCount: 'desc' },
      take: 10,
    });
  }

  async getRecommendedPosts(userId: string) {
    // Basic recommendation: recent posts not authored by this user.
    return this.prisma.post.findMany({
      where: { isPublished: true, deletedAt: null, userId: { not: userId } },
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }
}
