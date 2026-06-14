import { Video, IVideoDocument } from '../models';
import { CreateVideoRequest, UpdateVideoRequest, PaginationParams, PaginatedResponse } from '../types';
import { logger } from '../utils/logger';
import { recordVideoCreated } from '../utils/metrics';
import { v4 as uuidv4 } from 'uuid';

export class VideoService {
  /**
   * Create a new video
   */
  async createVideo(data: CreateVideoRequest): Promise<IVideoDocument> {
    logger.info('Creating new video', { title: data.title, createdBy: data.createdBy });

    const video = new Video({
      ...data,
      sponsors: [],
      status: 'draft',
      visibility: data.visibility || 'private',
    });

    await video.save();
    recordVideoCreated('draft');

    logger.info('Video created successfully', { videoId: video._id });
    return video;
  }

  /**
   * Get video by ID
   */
  async getVideoById(id: string): Promise<IVideoDocument | null> {
    logger.debug('Fetching video by ID', { videoId: id });
    return Video.findById(id);
  }

  /**
   * Get video by ID or throw error
   */
  async getVideoOrFail(id: string): Promise<IVideoDocument> {
    const video = await this.getVideoById(id);
    if (!video) {
      const error = new Error(`Video not found: ${id}`);
      (error as any).code = 'VIDEO_NOT_FOUND';
      throw error;
    }
    return video;
  }

  /**
   * List videos with pagination and filtering
   */
  async listVideos(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
    advertiserId?: string;
    category?: string;
    tags?: string[];
    search?: string;
  }): Promise<PaginatedResponse<IVideoDocument>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      advertiserId,
      category,
      tags,
      search,
    } = params;

    const query: Record<string, any> = {};

    if (status) query.status = status;
    if (advertiserId) query.advertiserId = advertiserId;
    if (category) query.category = category;
    if (tags && tags.length > 0) query.tags = { $in: tags };
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      Video.find(query).sort(sort).skip(skip).limit(limit),
      Video.countDocuments(query),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update video
   */
  async updateVideo(id: string, data: UpdateVideoRequest): Promise<IVideoDocument> {
    logger.info('Updating video', { videoId: id });

    const video = await this.getVideoOrFail(id);

    Object.assign(video, data);
    await video.save();

    logger.info('Video updated successfully', { videoId: id });
    return video;
  }

  /**
   * Delete video (soft delete by archiving)
   */
  async deleteVideo(id: string): Promise<IVideoDocument> {
    logger.info('Archiving video', { videoId: id });

    const video = await this.getVideoOrFail(id);
    video.status = 'archived';
    await video.save();

    logger.info('Video archived successfully', { videoId: id });
    return video;
  }

  /**
   * Activate video
   */
  async activateVideo(id: string): Promise<IVideoDocument> {
    logger.info('Activating video', { videoId: id });

    const video = await this.getVideoOrFail(id);

    if (!video.url) {
      const error = new Error('Cannot activate video without URL');
      (error as any).code = 'MISSING_VIDEO_URL';
      throw error;
    }

    video.status = 'active';
    await video.save();
    recordVideoCreated('active');

    logger.info('Video activated successfully', { videoId: id });
    return video;
  }

  /**
   * Pause video
   */
  async pauseVideo(id: string): Promise<IVideoDocument> {
    logger.info('Pausing video', { videoId: id });

    const video = await this.getVideoOrFail(id);
    video.status = 'paused';
    await video.save();

    logger.info('Video paused successfully', { videoId: id });
    return video;
  }

  /**
   * Add sponsor to video
   */
  async addSponsor(videoId: string, sponsorId: string): Promise<IVideoDocument> {
    logger.info('Adding sponsor to video', { videoId, sponsorId });

    const video = await this.getVideoOrFail(videoId);

    if (!video.sponsors.includes(sponsorId)) {
      video.sponsors.push(sponsorId);
      await video.save();
    }

    logger.info('Sponsor added to video', { videoId, sponsorId });
    return video;
  }

  /**
   * Remove sponsor from video
   */
  async removeSponsor(videoId: string, sponsorId: string): Promise<IVideoDocument> {
    logger.info('Removing sponsor from video', { videoId, sponsorId });

    const video = await this.getVideoOrFail(videoId);

    video.sponsors = video.sponsors.filter((s) => s !== sponsorId);
    await video.save();

    logger.info('Sponsor removed from video', { videoId, sponsorId });
    return video;
  }

  /**
   * Get videos by advertiser
   */
  async getVideosByAdvertiser(advertiserId: string): Promise<IVideoDocument[]> {
    return Video.find({ advertiserId }).sort({ createdAt: -1 });
  }

  /**
   * Get active videos count
   */
  async getActiveVideosCount(): Promise<number> {
    return Video.countDocuments({ status: 'active' });
  }

  /**
   * Get video statistics
   */
  async getVideoStats(videoId: string): Promise<{
    totalSponsors: number;
    activeSponsors: number;
    totalViews: number;
    totalEngagement: number;
  }> {
    const video = await this.getVideoOrFail(videoId);

    // These would be calculated from analytics in a real implementation
    return {
      totalSponsors: video.sponsors.length,
      activeSponsors: video.sponsors.length, // Would filter by active status
      totalViews: 0,
      totalEngagement: 0,
    };
  }
}

export const videoService = new VideoService();
export default videoService;