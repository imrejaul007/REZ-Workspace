import { v4 as uuidv4 } from 'uuid';
import {
  UnifiedPost,
  PlatformPost,
  CalendarEvent,
  CalendarView,
  CalendarFilters,
  Conflict,
  TimeSlot,
  Platform,
  PostStatus,
  ApiResponse,
  PaginatedResponse,
  BulkOperation,
  BulkOperationResult,
  CalendarAnalytics,
  UserCalendarSettings,
  PLATFORM_COLORS,
} from '../types';
import { calendarLogger as logger } from '../utils/logger';
import { PlatformConnectorService } from './platform-connector.service';

// In-memory storage
const posts: Map<string, UnifiedPost> = new Map();
const conflicts: Map<string, Conflict> = new Map();
const userSettings: Map<string, UserCalendarSettings> = new Map();

export class CalendarService {
  private platformConnector: PlatformConnectorService;

  constructor() {
    this.platformConnector = new PlatformConnectorService();
  }

  // Initialize service and sync posts from all platforms
  async initialize(): Promise<void> {
    logger.info('Initializing calendar service...');
    try {
      await this.syncAllPlatforms();
      logger.info('Calendar service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize calendar service', { error });
      throw error;
    }
  }

  // Sync posts from all connected platforms
  async syncAllPlatforms(): Promise<void> {
    const platforms: Platform[] = ['twitter', 'instagram', 'linkedin', 'tiktok', 'facebook', 'whatsapp'];

    for (const platform of platforms) {
      try {
        const posts = await this.platformConnector.fetchPosts(platform);
        for (const post of posts) {
          await this.addOrUpdatePost(post);
        }
        logger.info(`Synced posts from ${platform}`, { count: posts.length });
      } catch (error) {
        logger.error(`Failed to sync posts from ${platform}`, { error });
      }
    }

    // Detect conflicts after syncing
    await this.detectAllConflicts();
  }

  // Add or update a post
  async addOrUpdatePost(platformPost: PlatformPost): Promise<UnifiedPost> {
    const unifiedPost: UnifiedPost = {
      ...platformPost,
      userId: 'default', // In production, get from auth context
      isConflict: false,
      platformSpecificData: this.generatePlatformSpecificData(platformPost),
    };

    // Check for conflicts
    const hasConflict = await this.checkConflict(unifiedPost);
    unifiedPost.isConflict = hasConflict;

    posts.set(unifiedPost.id, unifiedPost);

    // Update conflicts if needed
    if (hasConflict) {
      await this.createOrUpdateConflict(unifiedPost);
    } else {
      // Remove from conflicts if exists
      await this.removePostFromConflicts(unifiedPost.id);
    }

    logger.info('Post added/updated', { postId: unifiedPost.id, platform: unifiedPost.platform });
    return unifiedPost;
  }

  // Generate platform-specific preview data
  private generatePlatformSpecificData(post: PlatformPost): UnifiedPost['platformSpecificData'] {
    const text = post.content.text;
    const hashtags = post.hashtags || [];
    const mentions = post.mentions || [];
    const mediaCount = post.content.media?.length || 0;

    const baseData = {
      previewText: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    };

    switch (post.platform) {
      case 'twitter':
        return {
          twitter: {
            characterCount: text.length,
            hashtagsCount: hashtags.length,
            mentionsCount: mentions.length,
            mediaCount,
            previewText: baseData.previewText,
          },
        };
      case 'instagram':
        return {
          instagram: {
            captionLength: text.length,
            hashtagCount: hashtags.length,
            mediaCount,
            previewText: baseData.previewText,
          },
        };
      case 'linkedin':
        return {
          linkedin: {
            characterCount: text.length,
            previewText: baseData.previewText,
            visibility: 'public',
          },
        };
      case 'tiktok':
        return {
          tiktok: {
            captionLength: text.length,
            hashtagsCount: hashtags.length,
          },
        };
      case 'facebook':
        return {
          facebook: {
            characterCount: text.length,
            previewText: baseData.previewText,
            audience: 'public',
          },
        };
      case 'whatsapp':
        return {
          whatsapp: {
            templateName: undefined,
            variables: undefined,
          },
        };
      default:
        return undefined;
    }
  }

  // Check if a post conflicts with existing posts
  private async checkConflict(post: UnifiedPost): Promise<boolean> {
    const conflictWindow = 15 * 60 * 1000; // 15 minutes
    const postTime = new Date(post.scheduledTime).getTime();

    for (const existingPost of posts.values()) {
      if (existingPost.id === post.id) continue;
      if (existingPost.platform === post.platform) continue; // Same platform posts don't conflict

      const existingTime = new Date(existingPost.scheduledTime).getTime();
      const timeDiff = Math.abs(postTime - existingTime);

      if (timeDiff < conflictWindow) {
        return true;
      }
    }
    return false;
  }

  // Detect conflicts for all posts
  async detectAllConflicts(): Promise<Conflict[]> {
    const detectedConflicts: Conflict[] = [];
    const processedPairs = new Set<string>();

    // Clear existing conflicts
    conflicts.clear();

    for (const post of posts.values()) {
      const postTime = new Date(post.scheduledTime).getTime();
      const conflictWindow = 15 * 60 * 1000;

      const conflictingPosts: UnifiedPost[] = [];

      for (const existingPost of posts.values()) {
        if (existingPost.id === post.id) continue;
        if (existingPost.platform === post.platform) continue;

        const pairKey = [post.id, existingPost.id].sort().join('-');
        if (processedPairs.has(pairKey)) continue;

        const existingTime = new Date(existingPost.scheduledTime).getTime();
        const timeDiff = Math.abs(postTime - existingTime);

        if (timeDiff < conflictWindow) {
          conflictingPosts.push(existingPost);
          processedPairs.add(pairKey);
        }
      }

      if (conflictingPosts.length > 0) {
        const conflict: Conflict = {
          id: uuidv4(),
          timeSlot: {
            start: new Date(Math.min(postTime, ...conflictingPosts.map(p => new Date(p.scheduledTime).getTime()))),
            end: new Date(Math.max(postTime, ...conflictingPosts.map(p => new Date(p.scheduledTime).getTime()))),
          },
          posts: [post, ...conflictingPosts],
          severity: this.calculateConflictSeverity(conflictingPosts.length),
          message: `Potential overlap: ${post.platform} and ${conflictingPosts.map(p => p.platform).join(', ')} posts scheduled within 15 minutes`,
          resolved: false,
        };

        conflicts.set(conflict.id, conflict);
        detectedConflicts.push(conflict);

        // Update post conflict flags
        post.isConflict = true;
        post.conflictingPosts = conflictingPosts.map(p => p.id);
        posts.set(post.id, post);
      }
    }

    logger.info('Conflict detection complete', { conflictCount: detectedConflicts.length });
    return detectedConflicts;
  }

  // Calculate conflict severity
  private calculateConflictSeverity(count: number): 'high' | 'medium' | 'low' {
    if (count >= 3) return 'high';
    if (count >= 2) return 'medium';
    return 'low';
  }

  // Create or update conflict
  private async createOrUpdateConflict(post: UnifiedPost): Promise<void> {
    const conflictWindow = 15 * 60 * 1000;
    const postTime = new Date(post.scheduledTime).getTime();

    for (const existingPost of posts.values()) {
      if (existingPost.id === post.id) continue;
      if (existingPost.platform === post.platform) continue;

      const existingTime = new Date(existingPost.scheduledTime).getTime();
      const timeDiff = Math.abs(postTime - existingTime);

      if (timeDiff < conflictWindow) {
        // Find existing conflict or create new one
        const existingConflict = Array.from(conflicts.values()).find(c =>
          c.posts.some(p => p.id === existingPost.id) && !c.resolved
        );

        if (existingConflict) {
          if (!existingConflict.posts.some(p => p.id === post.id)) {
            existingConflict.posts.push(post);
            existingConflict.severity = this.calculateConflictSeverity(existingConflict.posts.length - 1);
            conflicts.set(existingConflict.id, existingConflict);
          }
        }
      }
    }
  }

  // Remove post from conflicts
  private async removePostFromConflicts(postId: string): Promise<void> {
    for (const [conflictId, conflict] of conflicts.entries()) {
      if (conflict.posts.some(p => p.id === postId)) {
        conflict.posts = conflict.posts.filter(p => p.id !== postId);
        if (conflict.posts.length < 2) {
          conflicts.delete(conflictId);
          // Update remaining post's conflict flag
          conflict.posts.forEach(p => {
            p.isConflict = false;
            p.conflictingPosts = [];
            posts.set(p.id, p);
          });
        } else {
          conflict.severity = this.calculateConflictSeverity(conflict.posts.length - 1);
          conflicts.set(conflictId, conflict);
        }
      }
    }
  }

  // Get calendar view with events
  async getCalendarView(filters: CalendarFilters): Promise<CalendarView> {
    const allPosts = Array.from(posts.values());
    const filteredPosts = this.applyFilters(allPosts, filters);

    const events: CalendarEvent[] = filteredPosts.map(post => this.postToEvent(post));

    return {
      start: filters.dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: filters.dateRange?.end || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      events,
      filters,
    };
  }

  // Apply filters to posts
  private applyFilters(posts: UnifiedPost[], filters: CalendarFilters): UnifiedPost[] {
    return posts.filter(post => {
      // Platform filter
      if (filters.platforms && filters.platforms.length > 0) {
        if (!filters.platforms.includes(post.platform)) return false;
      }

      // Status filter
      if (filters.statuses && filters.statuses.length > 0) {
        if (!filters.statuses.includes(post.status)) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const postTime = new Date(post.scheduledTime).getTime();
        const startTime = new Date(filters.dateRange.start).getTime();
        const endTime = new Date(filters.dateRange.end).getTime();
        if (postTime < startTime || postTime > endTime) return false;
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = `${post.content.text} ${post.title || ''} ${post.description || ''}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      // User filter
      if (filters.userId && post.userId !== filters.userId) return false;

      return true;
    });
  }

  // Convert post to calendar event
  private postToEvent(post: UnifiedPost): CalendarEvent {
    const scheduledTime = new Date(post.scheduledTime);
    const endTime = new Date(scheduledTime.getTime() + 30 * 60 * 1000); // 30 min default duration

    return {
      id: `event-${post.id}`,
      postId: post.id,
      title: post.title || post.content.text.substring(0, 50),
      start: scheduledTime,
      end: endTime,
      platform: post.platform,
      status: post.status,
      isConflict: post.isConflict,
      color: PLATFORM_COLORS[post.platform],
      extendedProps: { post },
    };
  }

  // Reschedule a post
  async reschedulePost(postId: string, newScheduledTime: Date, reason?: string): Promise<ApiResponse<UnifiedPost>> {
    const post = posts.get(postId);
    if (!post) {
      return {
        success: false,
        error: 'Post not found',
        timestamp: new Date(),
      };
    }

    logger.info('Rescheduling post', { postId, newScheduledTime, reason });

    // Update the post
    post.scheduledTime = newScheduledTime;
    post.updatedAt = new Date();
    posts.set(postId, post);

    // Re-sync with platform
    try {
      await this.platformConnector.updateSchedule(post.platform, post.externalId || post.id, newScheduledTime);
    } catch (error) {
      logger.error('Failed to update platform schedule', { error, postId });
    }

    // Re-detect conflicts
    await this.detectAllConflicts();

    return {
      success: true,
      data: post,
      timestamp: new Date(),
    };
  }

  // Get single post
  async getPost(postId: string): Promise<ApiResponse<UnifiedPost>> {
    const post = posts.get(postId);
    if (!post) {
      return {
        success: false,
        error: 'Post not found',
        timestamp: new Date(),
      };
    }
    return {
      success: true,
      data: post,
      timestamp: new Date(),
    };
  }

  // Get all posts with pagination
  async getAllPosts(
    page: number = 1,
    limit: number = 50,
    filters?: CalendarFilters
  ): Promise<PaginatedResponse<UnifiedPost>> {
    let filteredPosts = Array.from(posts.values());

    if (filters) {
      filteredPosts = this.applyFilters(filteredPosts, filters);
    }

    // Sort by scheduled time
    filteredPosts.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

    const total = filteredPosts.length;
    const startIndex = (page - 1) * limit;
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: paginatedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Delete a post
  async deletePost(postId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const post = posts.get(postId);
    if (!post) {
      return {
        success: false,
        error: 'Post not found',
        timestamp: new Date(),
      };
    }

    // Delete from platform
    try {
      await this.platformConnector.deletePost(post.platform, post.externalId || postId);
    } catch (error) {
      logger.error('Failed to delete post from platform', { error, postId });
    }

    // Remove from conflicts
    await this.removePostFromConflicts(postId);

    // Delete from storage
    posts.delete(postId);

    logger.info('Post deleted', { postId });
    return {
      success: true,
      data: { deleted: true },
      timestamp: new Date(),
    };
  }

  // Bulk operations
  async performBulkOperation(operation: BulkOperation): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      operationId: uuidv4(),
      totalItems: operation.ids.length,
      successfulItems: [],
      failedItems: [],
    };

    logger.info('Starting bulk operation', { operationId: result.operationId, action: operation.action });

    for (const id of operation.ids) {
      try {
        switch (operation.action) {
          case 'publish':
            await this.publishPost(id);
            result.successfulItems.push(id);
            break;
          case 'delete':
            const deleteResult = await this.deletePost(id);
            if (deleteResult.success) {
              result.successfulItems.push(id);
            } else {
              result.failedItems.push({ id, error: deleteResult.error || 'Unknown error' });
            }
            break;
          case 'reschedule':
            if (operation.newValues?.scheduledTime) {
              const rescheduleResult = await this.reschedulePost(
                id,
                new Date(operation.newValues.scheduledTime)
              );
              if (rescheduleResult.success) {
                result.successfulItems.push(id);
              } else {
                result.failedItems.push({ id, error: rescheduleResult.error || 'Unknown error' });
              }
            }
            break;
          case 'change_status':
            const post = posts.get(id);
            if (post && operation.newValues?.status) {
              post.status = operation.newValues.status;
              post.updatedAt = new Date();
              posts.set(id, post);
              result.successfulItems.push(id);
            } else {
              result.failedItems.push({ id, error: 'Post not found or invalid status' });
            }
            break;
        }
      } catch (error) {
        result.failedItems.push({ id, error: String(error) });
      }
    }

    logger.info('Bulk operation complete', {
      operationId: result.operationId,
      successful: result.successfulItems.length,
      failed: result.failedItems.length,
    });

    return result;
  }

  // Publish a post immediately
  async publishPost(postId: string): Promise<ApiResponse<UnifiedPost>> {
    const post = posts.get(postId);
    if (!post) {
      return {
        success: false,
        error: 'Post not found',
        timestamp: new Date(),
      };
    }

    try {
      const result = await this.platformConnector.publishPost(post.platform, post.externalId || postId);
      if (result.success) {
        post.status = 'published';
        post.updatedAt = new Date();
        posts.set(postId, post);
        return {
          success: true,
          data: post,
          timestamp: new Date(),
        };
      } else {
        post.status = 'failed';
        post.updatedAt = new Date();
        posts.set(postId, post);
        return {
          success: false,
          error: result.error,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      post.status = 'failed';
      post.updatedAt = new Date();
      posts.set(postId, post);
      return {
        success: false,
        error: String(error),
        timestamp: new Date(),
      };
    }
  }

  // Get all conflicts
  async getConflicts(includeResolved: boolean = false): Promise<Conflict[]> {
    const allConflicts = Array.from(conflicts.values());
    if (includeResolved) {
      return allConflicts;
    }
    return allConflicts.filter(c => !c.resolved);
  }

  // Resolve a conflict
  async resolveConflict(
    conflictId: string,
    resolution: Conflict['resolution']
  ): Promise<ApiResponse<Conflict>> {
    const conflict = conflicts.get(conflictId);
    if (!conflict) {
      return {
        success: false,
        error: 'Conflict not found',
        timestamp: new Date(),
      };
    }

    conflict.resolved = true;
    conflict.resolution = resolution;
    conflicts.set(conflictId, conflict);

    // Update affected posts
    conflict.posts.forEach(post => {
      post.isConflict = false;
      post.conflictingPosts = [];
      posts.set(post.id, post);
    });

    logger.info('Conflict resolved', { conflictId, resolution: resolution.action });
    return {
      success: true,
      data: conflict,
      timestamp: new Date(),
    };
  }

  // Get analytics
  async getAnalytics(): Promise<CalendarAnalytics> {
    const allPosts = Array.from(posts.values());
    const now = new Date().getTime();

    const postsByPlatform: Record<Platform, number> = {
      twitter: 0,
      instagram: 0,
      linkedin: 0,
      tiktok: 0,
      facebook: 0,
      whatsapp: 0,
    };

    const postsByStatus: Record<PostStatus, number> = {
      draft: 0,
      scheduled: 0,
      published: 0,
      failed: 0,
      pending_review: 0,
    };

    let upcomingPosts = 0;
    let pastPosts = 0;

    allPosts.forEach(post => {
      postsByPlatform[post.platform]++;
      postsByStatus[post.status]++;
      const postTime = new Date(post.scheduledTime).getTime();
      if (postTime > now) {
        upcomingPosts++;
      } else {
        pastPosts++;
      }
    });

    return {
      totalPosts: allPosts.length,
      postsByPlatform,
      postsByStatus,
      conflictCount: Array.from(conflicts.values()).filter(c => !c.resolved).length,
      upcomingPosts,
      pastPosts,
    };
  }

  // User settings
  async getUserSettings(userId: string): Promise<UserCalendarSettings> {
    return userSettings.get(userId) || {
      userId,
      defaultView: 'month',
      timezone: 'UTC',
      workingHours: { start: '09:00', end: '17:00' },
      notificationPreferences: { conflicts: true, reminders: true, failedPosts: true },
      platformOrder: ['twitter', 'instagram', 'linkedin', 'tiktok', 'facebook', 'whatsapp'],
    };
  }

  async updateUserSettings(userId: string, settings: Partial<UserCalendarSettings>): Promise<void> {
    const current = await this.getUserSettings(userId);
    userSettings.set(userId, { ...current, ...settings });
  }
}

export const calendarService = new CalendarService();
