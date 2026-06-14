import { Announcement, AnnouncementDocument } from '../models/Announcement.js';
import {
  generateAnnouncementId,
  CreateAnnouncementDTO,
  UpdateAnnouncementDTO,
  AnnouncementCategory,
  AnnouncementPriority,
} from '../types/index.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

export class AnnouncementService {
  /**
   * Create a new announcement
   */
  async createAnnouncement(data: CreateAnnouncementDTO): Promise<AnnouncementDocument> {
    const announcementId = generateAnnouncementId();

    // Generate summary if not provided
    const summary = data.summary || this.generateSummary(data.content);

    const announcement = new Announcement({
      announcementId,
      title: data.title,
      content: data.content,
      summary,
      category: data.category,
      priority: data.priority || 'normal',
      departmentIds: data.departmentIds || [],
      companyId: data.companyId,
      authorId: data.authorId,
      authorName: data.authorName,
      authorAvatar: data.authorAvatar,
      attachments: data.attachments || [],
      views: 0,
      viewedBy: [],
      reactions: [],
      scheduledFor: data.scheduledFor,
      expiresAt: data.expiresAt,
      isPublished: !data.scheduledFor,
    });

    await announcement.save();
    return announcement;
  }

  /**
   * Get announcement by ID
   */
  async getAnnouncement(announcementId: string): Promise<AnnouncementDocument> {
    const announcement = await Announcement.findOne({ announcementId });

    if (!announcement) {
      throw new NotFoundError('Announcement', announcementId);
    }

    return announcement;
  }

  /**
   * Get announcement by MongoDB _id
   */
  async getAnnouncementById(id: string): Promise<AnnouncementDocument> {
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      throw new NotFoundError('Announcement', id);
    }

    return announcement;
  }

  /**
   * List announcements for a company
   */
  async listAnnouncements(
    companyId: string,
    options: {
      category?: AnnouncementCategory;
      priority?: AnnouncementPriority;
      departmentId?: string;
      page?: number;
      limit?: number;
      includeExpired?: boolean;
    } = {}
  ): Promise<{
    announcements: AnnouncementDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20 } = options;

    const result = await Announcement.findByCompany(companyId, options);

    return {
      announcements: result.announcements,
      total: result.total,
      page,
      limit,
    };
  }

  /**
   * Get announcements by category
   */
  async getByCategory(
    companyId: string,
    category: AnnouncementCategory,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ announcements: AnnouncementDocument[]; total: number }> {
    return Announcement.findByCompany(companyId, { category, ...options });
  }

  /**
   * Get priority announcements
   */
  async getPriorityAnnouncements(
    companyId: string,
    options: { limit?: number } = {}
  ): Promise<AnnouncementDocument[]> {
    const { limit = 5 } = options;
    return Announcement.find({
      companyId,
      isPublished: true,
      priority: { $in: ['high', 'urgent'] },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: new Date() } },
      ],
    })
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit);
  }

  /**
   * Update an announcement
   */
  async updateAnnouncement(
    announcementId: string,
    userId: string,
    data: UpdateAnnouncementDTO
  ): Promise<AnnouncementDocument> {
    const announcement = await this.getAnnouncement(announcementId);

    // Only author can update
    if (announcement.authorId !== userId) {
      throw new ForbiddenError('Only the author can update this announcement');
    }

    if (data.title !== undefined) {
      announcement.title = data.title;
    }
    if (data.content !== undefined) {
      announcement.content = data.content;
      if (!data.summary) {
        announcement.summary = this.generateSummary(data.content);
      }
    }
    if (data.summary !== undefined) {
      announcement.summary = data.summary;
    }
    if (data.category !== undefined) {
      announcement.category = data.category;
    }
    if (data.priority !== undefined) {
      announcement.priority = data.priority;
    }
    if (data.departmentIds !== undefined) {
      announcement.departmentIds = data.departmentIds;
    }
    if (data.isPublished !== undefined) {
      announcement.isPublished = data.isPublished;
    }
    if (data.expiresAt !== undefined) {
      announcement.expiresAt = data.expiresAt;
    }

    await announcement.save();
    return announcement;
  }

  /**
   * Delete an announcement
   */
  async deleteAnnouncement(announcementId: string, userId: string): Promise<void> {
    const announcement = await this.getAnnouncement(announcementId);

    if (announcement.authorId !== userId) {
      throw new ForbiddenError('Only the author can delete this announcement');
    }

    await Announcement.deleteOne({ announcementId });
  }

  /**
   * Track a view for an announcement
   */
  async trackView(announcementId: string, userId: string): Promise<AnnouncementDocument> {
    const announcement = await this.getAnnouncement(announcementId);

    announcement.addView(userId);
    await announcement.save();

    return announcement;
  }

  /**
   * Add reaction to an announcement
   */
  async addReaction(
    announcementId: string,
    userId: string,
    userName: string,
    emoji: string
  ): Promise<AnnouncementDocument> {
    const announcement = await this.getAnnouncement(announcementId);

    // Check if already reacted
    const existingReaction = announcement.reactions.find(
      (r: { emoji: string; odId: string }) => r.emoji === emoji && r.odId === userId
    );

    if (existingReaction) {
      // Remove reaction
      announcement.reactions = announcement.reactions.filter(
        (r: { emoji: string; odId: string }) => !(r.emoji === emoji && r.odId === userId)
      );
    } else {
      // Add reaction
      announcement.addReaction(emoji, userId, userName);
    }

    await announcement.save();
    return announcement;
  }

  /**
   * Get unread announcements count for a user
   */
  async getUnreadCount(companyId: string, userId: string): Promise<number> {
    return Announcement.getUnreadCount(companyId, userId);
  }

  /**
   * Get announcement statistics
   */
  async getStats(companyId: string): Promise<{
    totalAnnouncements: number;
    byCategory: Record<AnnouncementCategory, number>;
    totalViews: number;
    avgViewsPerAnnouncement: number;
    topAnnouncements: Array<{ announcementId: string; title: string; views: number }>;
  }> {
    return Announcement.getStats(companyId);
  }

  /**
   * Get recent announcements
   */
  async getRecent(
    companyId: string,
    options: { limit?: number; userId?: string } = {}
  ): Promise<AnnouncementDocument[]> {
    const { limit = 10 } = options;

    return Announcement.find({
      companyId,
      isPublished: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: new Date() } },
      ],
    })
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get announcements for a department
   */
  async getForDepartment(
    departmentId: string,
    companyId: string,
    options: { limit?: number } = {}
  ): Promise<AnnouncementDocument[]> {
    const { limit = 20 } = options;

    return Announcement.find({
      companyId,
      departmentIds: { $in: [departmentId] },
      isPublished: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: new Date() } },
      ],
    })
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit);
  }

  /**
   * Publish a scheduled announcement
   */
  async publish(announcementId: string): Promise<AnnouncementDocument> {
    const announcement = await this.getAnnouncement(announcementId);
    announcement.isPublished = true;
    await announcement.save();
    return announcement;
  }

  /**
   * Generate a summary from content
   */
  private generateSummary(content: string, maxLength = 200): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength).trim() + '...';
  }
}

export const announcementService = new AnnouncementService();
