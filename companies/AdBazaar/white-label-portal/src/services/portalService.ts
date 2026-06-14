import { v4 as uuidv4 } from 'uuid';
import { WhiteLabelPortal, IWhiteLabelPortal, IPortalSettings } from '../models';
import { logger } from 'utils/logger.js';

export interface CreatePortalDTO {
  agencyId: string;
  name: string;
  slug: string;
  domain?: string;
  settings?: Partial<IPortalSettings>;
  createdBy: string;
}

export interface UpdatePortalDTO {
  name?: string;
  domain?: string;
  status?: 'active' | 'inactive' | 'suspended';
  settings?: Partial<IPortalSettings>;
}

export class PortalService {
  /**
   * Create a new white label portal
   */
  async createPortal(data: CreatePortalDTO): Promise<IWhiteLabelPortal> {
    logger.info('Creating white label portal', { agencyId: data.agencyId, slug: data.slug });

    // Check if slug is already taken
    const existing = await WhiteLabelPortal.findOne({ slug: data.slug });
    if (existing) {
      throw new Error(`Portal with slug '${data.slug}' already exists`);
    }

    const portal = new WhiteLabelPortal({
      agencyId: data.agencyId,
      name: data.name,
      slug: data.slug.toLowerCase(),
      domain: data.domain,
      status: 'active',
      settings: {
        allowCustomDomain: true,
        allowSubdomains: true,
        maxClients: 100,
        maxCampaigns: 50,
        features: {
          analytics: true,
          reporting: true,
          whiteLabelReports: true,
          customBranding: true,
          apiAccess: false,
        },
        limits: {
          impressions: 1000000,
          clicks: 100000,
          campaigns: 50,
        },
        ...data.settings,
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: data.createdBy,
      },
      stats: {
        totalClients: 0,
        activeCampaigns: 0,
        totalImpressions: 0,
        totalClicks: 0,
      },
    });

    await portal.save();
    logger.info('Portal created successfully', { portalId: portal._id, slug: portal.slug });

    return portal;
  }

  /**
   * Get portal by ID
   */
  async getPortalById(portalId: string): Promise<IWhiteLabelPortal | null> {
    return WhiteLabelPortal.findById(portalId);
  }

  /**
   * Get portal by slug
   */
  async getPortalBySlug(slug: string): Promise<IWhiteLabelPortal | null> {
    return WhiteLabelPortal.findOne({ slug: slug.toLowerCase() });
  }

  /**
   * Get portal by domain
   */
  async getPortalByDomain(domain: string): Promise<IWhiteLabelPortal | null> {
    return WhiteLabelPortal.findOne({ domain: domain.toLowerCase() });
  }

  /**
   * List portals for an agency
   */
  async listPortals(
    agencyId: string,
    options: {
      page?: number;
      limit?: number;
      status?: 'active' | 'inactive' | 'suspended';
    } = {}
  ): Promise<{ portals: IWhiteLabelPortal[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { agencyId };
    if (status) {
      query.status = status;
    }

    const [portals, total] = await Promise.all([
      WhiteLabelPortal.find(query).skip(skip).limit(limit).sort({ 'metadata.createdAt': -1 }),
      WhiteLabelPortal.countDocuments(query),
    ]);

    return {
      portals,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update portal
   */
  async updatePortal(portalId: string, data: UpdatePortalDTO): Promise<IWhiteLabelPortal | null> {
    logger.info('Updating portal', { portalId });

    const updateData: Record<string, unknown> = {
      'metadata.updatedAt': new Date(),
    };

    if (data.name) updateData.name = data.name;
    if (data.domain) updateData.domain = data.domain;
    if (data.status) updateData.status = data.status;
    if (data.settings) {
      updateData.settings = data.settings;
    }

    const portal = await WhiteLabelPortal.findByIdAndUpdate(
      portalId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (portal) {
      logger.info('Portal updated successfully', { portalId });
    }

    return portal;
  }

  /**
   * Delete portal (soft delete by setting status to suspended)
   */
  async deletePortal(portalId: string): Promise<boolean> {
    logger.info('Deleting portal', { portalId });

    const portal = await WhiteLabelPortal.findByIdAndUpdate(
      portalId,
      {
        $set: {
          status: 'suspended',
          'metadata.updatedAt': new Date(),
        },
      },
      { new: true }
    );

    return !!portal;
  }

  /**
   * Update portal stats
   */
  async updatePortalStats(
    portalId: string,
    stats: {
      totalClients?: number;
      activeCampaigns?: number;
      totalImpressions?: number;
      totalClicks?: number;
    }
  ): Promise<IWhiteLabelPortal | null> {
    const updateData: Record<string, unknown> = {};
    if (stats.totalClients !== undefined) updateData['stats.totalClients'] = stats.totalClients;
    if (stats.activeCampaigns !== undefined) updateData['stats.activeCampaigns'] = stats.activeCampaigns;
    if (stats.totalImpressions !== undefined) updateData['stats.totalImpressions'] = stats.totalImpressions;
    if (stats.totalClicks !== undefined) updateData['stats.totalClicks'] = stats.totalClicks;

    return WhiteLabelPortal.findByIdAndUpdate(
      portalId,
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Get portal health status
   */
  async getPortalHealth(portalId: string): Promise<{
    status: string;
    uptime: number;
    lastActivity: Date | null;
  }> {
    const portal = await WhiteLabelPortal.findById(portalId);
    if (!portal) {
      throw new Error('Portal not found');
    }

    return {
      status: portal.status,
      uptime: Date.now() - new Date(portal.metadata.createdAt).getTime(),
      lastActivity: portal.metadata.lastAccessedAt || null,
    };
  }

  /**
   * Validate slug format
   */
  validateSlug(slug: string): { valid: boolean; error?: string } {
    const slugRegex = /^[a-z0-9][a-z0-9-]{2,30}[a-z0-9]$/;
    if (!slugRegex.test(slug)) {
      return {
        valid: false,
        error: 'Slug must be 4-32 characters, lowercase alphanumeric with hyphens allowed (not at start/end)',
      };
    }
    return { valid: true };
  }

  /**
   * Check if portal can add more clients
   */
  async canAddClients(portalId: string): Promise<boolean> {
    const portal = await WhiteLabelPortal.findById(portalId);
    if (!portal) return false;
    return portal.stats.totalClients < portal.settings.maxClients;
  }

  /**
   * Check if portal can add more campaigns
   */
  async canAddCampaigns(portalId: string): Promise<boolean> {
    const portal = await WhiteLabelPortal.findById(portalId);
    if (!portal) return false;
    return portal.stats.activeCampaigns < portal.settings.maxCampaigns;
  }
}

export const portalService = new PortalService();
