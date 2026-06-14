import { UGCContent, IUGCContent, UGCCampaign } from '../models';
import { logger } from '../config/logger';

interface DisplayConfig {
  displayType: 'wall' | 'ticker' | 'grid' | 'carousel';
  maxItems: number;
  showCaption: boolean;
  showAuthor: boolean;
  showEngagement: boolean;
  autoRotate: boolean;
  rotationInterval: number;
  filterBy?: {
    sentiment?: 'positive' | 'neutral' | 'negative';
    minEngagement?: number;
    platforms?: string[];
  };
}

interface DisplayEmbed {
  embedId: string;
  config: DisplayConfig;
  items: DisplayItem[];
  campaignId?: string;
  generatedAt: Date;
  expiresAt: Date;
}

interface DisplayItem {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  author: {
    username: string;
    displayName: string;
    profileImage?: string;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  platform: string;
  originalUrl: string;
  rightsStatus: string;
  displayAttribution: string;
}

class DisplayService {
  /**
   * Generate a display embed for UGC content
   */
  async generateDisplayEmbed(
    campaignId: string,
    config: DisplayConfig
  ): Promise<DisplayEmbed> {
    // Build query for approved content with rights
    const query: any = {
      status: { $in: ['approved', 'displayed'] },
      rightsStatus: 'granted',
      campaignId
    };

    if (config.filterBy) {
      if (config.filterBy.sentiment) {
        query.sentiment = config.filterBy.sentiment;
      }
      if (config.filterBy.minEngagement) {
        query['engagement.likes'] = { $gte: config.filterBy.minEngagement };
      }
      if (config.filterBy.platforms?.length) {
        query.platform = { $in: config.filterBy.platforms };
      }
    }

    const content = await UGCContent.find(query)
      .sort({ 'engagement.likes': -1 })
      .limit(config.maxItems);

    // Format items for display
    const items: DisplayItem[] = content.map(c => ({
      id: c._id.toString(),
      mediaUrl: c.mediaUrl,
      mediaType: c.mediaType,
      caption: c.caption.substring(0, 280), // Truncate for display
      author: {
        username: c.author.username,
        displayName: c.author.displayName,
        profileImage: c.author.profileImage
      },
      engagement: c.engagement,
      platform: c.platform,
      originalUrl: c.originalUrl,
      rightsStatus: c.rightsStatus,
      displayAttribution: this.generateAttribution(c)
    }));

    const embedId = this.generateEmbedId();
    const now = new Date();

    const embed: DisplayEmbed = {
      embedId,
      config,
      items,
      campaignId,
      generatedAt: now,
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour
    };

    logger.info(`Display embed generated: ${embedId}`, {
      campaignId,
      itemCount: items.length,
      displayType: config.displayType
    });

    return embed;
  }

  /**
   * Generate HTML embed code
   */
  async generateEmbedCode(
    campaignId: string,
    displayType: 'wall' | 'ticker' | 'grid' | 'carousel',
    options?: {
      width?: string;
      height?: string;
      theme?: 'light' | 'dark';
      showCaptions?: boolean;
    }
  ): Promise<string> {
    const embed = await this.generateDisplayEmbed(campaignId, {
      displayType,
      maxItems: 20,
      showCaption: options?.showCaptions ?? true,
      showAuthor: true,
      showEngagement: true,
      autoRotate: displayType === 'ticker' || displayType === 'carousel',
      rotationInterval: 5000
    });

    // Generate HTML based on display type
    const theme = options?.theme || 'light';
    const width = options?.width || '100%';
    const height = options?.height || (displayType === 'ticker' ? '200px' : '600px');

    const embedCode = this.generateHTMLEmbed(embed, {
      width,
      height,
      theme,
      displayType
    });

    return embedCode;
  }

  /**
   * Get random content for display rotation
   */
  async getRandomDisplayContent(
    campaignId: string,
    count: number,
    excludeIds: string[] = []
  ): Promise<DisplayItem[]> {
    const content = await UGCContent.aggregate([
      {
        $match: {
          campaignId: new (await import('mongoose')).Types.ObjectId(campaignId),
          status: { $in: ['approved', 'displayed'] },
          rightsStatus: 'granted',
          _id: { $nin: excludeIds.map(id => new (await import('mongoose')).Types.ObjectId(id)) }
        }
      },
      { $sample: { size: count } }
    ]);

    return content.map(c => ({
      id: c._id.toString(),
      mediaUrl: c.mediaUrl,
      mediaType: c.mediaType,
      caption: c.caption.substring(0, 280),
      author: {
        username: c.author.username,
        displayName: c.author.displayName,
        profileImage: c.author.profileImage
      },
      engagement: c.engagement,
      platform: c.platform,
      originalUrl: c.originalUrl,
      rightsStatus: c.rightsStatus,
      displayAttribution: this.generateAttribution(c)
    }));
  }

  /**
   * Generate JSON feed for external integrations
   */
  async generateJSONFeed(
    campaignId: string,
    limit: number = 50
  ): Promise<{
    campaign: any;
    items: DisplayItem[];
    pagination: {
      total: number;
      limit: number;
      hasMore: boolean;
    };
  }> {
    const campaign = await UGCCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const [content, total] = await Promise.all([
      UGCContent.find({
        campaignId: campaign._id,
        status: { $in: ['approved', 'displayed'] },
        rightsStatus: 'granted'
      })
        .sort({ approvedAt: -1 })
        .limit(limit),
      UGCContent.countDocuments({
        campaignId: campaign._id,
        status: { $in: ['approved', 'displayed'] },
        rightsStatus: 'granted'
      })
    ]);

    const items: DisplayItem[] = content.map(c => ({
      id: c._id.toString(),
      mediaUrl: c.mediaUrl,
      mediaType: c.mediaType,
      caption: c.caption,
      author: {
        username: c.author.username,
        displayName: c.author.displayName,
        profileImage: c.author.profileImage
      },
      engagement: c.engagement,
      platform: c.platform,
      originalUrl: c.originalUrl,
      rightsStatus: c.rightsStatus,
      displayAttribution: this.generateAttribution(c)
    }));

    return {
      campaign: {
        id: campaign._id,
        name: campaign.name,
        brandId: campaign.brandId
      },
      items,
      pagination: {
        total,
        limit,
        hasMore: total > limit
      }
    };
  }

  /**
   * Generate RSS feed for UGC content
   */
  async generateRSSFeed(campaignId: string): Promise<string> {
    const feed = await this.generateJSONFeed(campaignId, 50);

    const itemsXml = feed.items.map(item => `
      <item>
        <title><![CDATA[${item.caption.substring(0, 100)}...]]></title>
        <link>${item.originalUrl}</link>
        <description><![CDATA[${item.caption}]]></description>
        <media:content url="${item.mediaUrl}" type="${item.mediaType === 'video' ? 'video/mp4' : 'image/jpeg'}" />
        <author>${item.author.username}</author>
        <pubDate>${new Date().toUTCString()}</pubDate>
      </item>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${feed.campaign.name} - UGC Feed</title>
    <link>https://adbazaar.com/ugc/campaigns/${campaignId}</link>
    <description>User Generated Content from ${feed.campaign.name}</description>
    ${itemsXml}
  </channel>
</rss>`;
  }

  /**
   * Generate attribution text
   */
  private generateAttribution(content: any): string {
    const platformNames: Record<string, string> = {
      instagram: 'Instagram',
      twitter: 'X/Twitter',
      facebook: 'Facebook',
      tiktok: 'TikTok'
    };

    const platformName = platformNames[content.platform] || content.platform;
    return `Photo via @${content.author.username} on ${platformName}`;
  }

  /**
   * Generate unique embed ID
   */
  private generateEmbedId(): string {
    return `ugc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate HTML embed code
   */
  private generateHTMLEmbed(
    embed: DisplayEmbed,
    options: {
      width: string;
      height: string;
      theme: 'light' | 'dark';
      displayType: string;
    }
  ): string {
    const bgColor = options.theme === 'dark' ? '#1a1a1a' : '#ffffff';
    const textColor = options.theme === 'dark' ? '#ffffff' : '#333333';

    return `<div id="${embed.embedId}" style="width:${options.width};height:${options.height};background:${bgColor};color:${textColor};overflow:hidden;">
  <style>
    .ugc-${embed.embedId} .ugc-item { display: ${options.displayType === 'grid' ? 'inline-block' : 'block'}; }
    .ugc-${embed.embedId} .ugc-caption { font-size: 14px; line-height: 1.4; }
    .ugc-${embed.embedId} .ugc-author { font-weight: bold; }
    .ugc-${embed.embedId} .ugc-engagement { color: #666; }
    .ugc-${embed.embedId} .ugc-attribution { font-size: 12px; color: #999; }
  </style>
  <div class="ugc-${embed.embedId}">
    <div class="ugc-content" data-ugc-embed="${embed.embedId}" data-config='${JSON.stringify(embed.config)}'>
      ${embed.items.map(item => `
        <div class="ugc-item" data-id="${item.id}">
          ${options.displayType === 'ticker' ? `
            <span>${item.caption} - @${item.author.username}</span>
          ` : `
            <img src="${item.mediaUrl}" alt="${item.caption}" style="max-width:100%;" />
            ${embed.config.showCaption ? `<p class="ugc-caption">${item.caption}</p>` : ''}
            ${embed.config.showAuthor ? `<p class="ugc-author">@${item.author.username}</p>` : ''}
            ${embed.config.showEngagement ? `<p class="ugc-engagement">${item.engagement.likes} likes</p>` : ''}
            <p class="ugc-attribution">${item.displayAttribution}</p>
          `}
        </div>
      `).join('')}
    </div>
  </div>
  <script src="https://cdn.adbazaar.com/ugc-embed.js"></script>
</div>`;
  }
}

export const displayService = new DisplayService();