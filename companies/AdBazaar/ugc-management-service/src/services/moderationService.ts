import { UGCContent, IUGCContent, UGCCampaign } from '../models';
import { logger } from '../config/logger';

interface ModerationResult {
  approved: boolean;
  reason?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;
}

class ModerationService {
  /**
   * Apply auto-moderation rules based on campaign settings
   */
  async autoModerate(campaignId: string): Promise<{ processed: number; approved: number; rejected: number }> {
    const campaign = await UGCCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const rules = campaign.moderationRules;

    // Get all pending content for this campaign
    const pendingContent = await UGCContent.find({
      campaignId,
      status: 'pending_review'
    });

    let approved = 0;
    let rejected = 0;

    for (const content of pendingContent) {
      const result = await this.moderateContent(content, rules);

      if (campaign.approvalRequired) {
        // Just apply tags, keep as pending for manual review
        content.sentiment = result.sentiment;
        content.sentimentScore = result.sentimentScore;
        content.moderationNotes = result.reason;
        await content.save();
      } else {
        // Auto-approve or reject
        content.status = result.approved ? 'approved' : 'rejected';
        content.sentiment = result.sentiment;
        content.sentimentScore = result.sentimentScore;
        content.moderationNotes = result.reason;
        if (result.approved) {
          content.approvedAt = new Date();
          approved++;
        } else {
          rejected++;
        }
        await content.save();
      }
    }

    logger.info(`Auto-moderation completed for campaign ${campaignId}`, { approved, rejected, processed: pendingContent.length });

    return { processed: pendingContent.length, approved, rejected };
  }

  /**
   * Moderate a single piece of content based on rules
   */
  async moderateContent(
    content: IUGCContent,
    rules?: UGCCampaign['moderationRules']
  ): Promise<ModerationResult> {
    const result: ModerationResult = {
      approved: true,
      sentiment: 'neutral',
      sentimentScore: 0
    };

    // Check minimum followers
    if (rules?.minFollowers && content.author.followerCount < rules.minFollowers) {
      result.approved = false;
      result.reason = `Follower count ${content.author.followerCount} below minimum ${rules.minFollowers}`;
      return result;
    }

    // Check maximum followers
    if (rules?.maxFollowers && content.author.followerCount > rules.maxFollowers) {
      result.approved = false;
      result.reason = `Follower count ${content.author.followerCount} above maximum ${rules.maxFollowers}`;
      return result;
    }

    // Check exclude hashtags
    if (rules?.excludeHashtags?.length) {
      const contentHashtags = content.hashtags.map(h => h.toLowerCase());
      const excludedFound = rules.excludeHashtags.filter(h =>
        contentHashtags.includes(h.toLowerCase())
      );
      if (excludedFound.length > 0) {
        result.approved = false;
        result.reason = `Contains excluded hashtags: ${excludedFound.join(', ')}`;
        return result;
      }
    }

    // Check require hashtags
    if (rules?.requireHashtags?.length) {
      const contentHashtags = content.hashtags.map(h => h.toLowerCase());
      const requiredFound = rules.requireHashtags.filter(h =>
        contentHashtags.includes(h.toLowerCase())
      );
      if (requiredFound.length === 0) {
        result.approved = false;
        result.reason = `Missing required hashtags: ${rules.requireHashtags.join(', ')}`;
        return result;
      }
    }

    // Check exclude accounts
    if (rules?.excludeAccounts?.length) {
      if (rules.excludeAccounts.includes(content.author.username)) {
        result.approved = false;
        result.reason = `Author ${content.author.username} is in exclusion list`;
        return result;
      }
    }

    // Calculate sentiment (simplified - in production use NLP)
    const sentimentResult = this.analyzeSentiment(content.caption);
    result.sentiment = sentimentResult.sentiment;
    result.sentimentScore = sentimentResult.score;

    // Check sentiment threshold
    if (rules?.sentimentThreshold !== undefined && sentimentResult.score < rules.sentimentThreshold) {
      result.approved = false;
      result.reason = `Sentiment score ${sentimentResult.score} below threshold ${rules.sentimentThreshold}`;
      return result;
    }

    // Check for spam indicators
    if (this.isSpam(content)) {
      result.approved = false;
      result.reason = 'Content flagged as potential spam';
      return result;
    }

    return result;
  }

  /**
   * Simple sentiment analysis (placeholder - use NLP in production)
   */
  private analyzeSentiment(text: string): { sentiment: 'positive' | 'neutral' | 'negative'; score: number } {
    const positiveWords = ['amazing', 'love', 'great', 'excellent', 'best', 'awesome', 'beautiful', 'perfect', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing', 'poor', 'ugly', 'wrong'];

    const lowerText = text.toLowerCase();
    let score = 0;

    for (const word of positiveWords) {
      if (lowerText.includes(word)) score += 0.2;
    }
    for (const word of negativeWords) {
      if (lowerText.includes(word)) score -= 0.2;
    }

    // Clamp score between -1 and 1
    score = Math.max(-1, Math.min(1, score));

    let sentiment: 'positive' | 'neutral' | 'negative';
    if (score > 0.2) {
      sentiment = 'positive';
    } else if (score < -0.2) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }

    return { sentiment, score };
  }

  /**
   * Spam detection
   */
  private isSpam(content: IUGCContent): boolean {
    const spamIndicators = [
      /buy now/i,
      /click here/i,
      /limited time/i,
      /act now/i,
      /free money/i,
      /make money fast/i,
      /http:\/\/[^\s]+/gi, // Multiple URLs
    ];

    for (const pattern of spamIndicators) {
      if (pattern.test(content.caption)) {
        return true;
      }
    }

    // Check for excessive hashtags (>10)
    if (content.hashtags.length > 10) {
      return true;
    }

    // Check for excessive caps
    const capsRatio = (content.caption.match(/[A-Z]/g) || []).length / content.caption.length;
    if (capsRatio > 0.5 && content.caption.length > 20) {
      return true;
    }

    return false;
  }

  /**
   * Manual approval of content
   */
  async approveContent(contentId: string, approvedBy: string, notes?: string): Promise<IUGCContent> {
    const content = await UGCContent.findById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    content.status = 'approved';
    content.approvedBy = approvedBy;
    content.approvedAt = new Date();
    if (notes) {
      content.moderationNotes = notes;
    }

    await content.save();

    // Update campaign stats
    if (content.campaignId) {
      await UGCCampaign.findByIdAndUpdate(content.campaignId, {
        $inc: { 'stats.approved': 1 }
      });
    }

    logger.info(`Content ${contentId} approved by ${approvedBy}`);
    return content;
  }

  /**
   * Manual rejection of content
   */
  async rejectContent(contentId: string, rejectedBy: string, reason?: string): Promise<IUGCContent> {
    const content = await UGCContent.findById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    content.status = 'rejected';
    content.moderationNotes = reason || 'Rejected by moderator';

    await content.save();

    logger.info(`Content ${contentId} rejected by ${rejectedBy}`, { reason });
    return content;
  }

  /**
   * Bulk moderate content
   */
  async bulkModerate(
    contentIds: string[],
    action: 'approve' | 'reject',
    moderatedBy: string
  ): Promise<{ processed: number; successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    for (const contentId of contentIds) {
      try {
        if (action === 'approve') {
          await this.approveContent(contentId, moderatedBy);
        } else {
          await this.rejectContent(contentId, moderatedBy);
        }
        successful++;
      } catch (error) {
        logger.error(`Failed to ${action} content ${contentId}`, { error });
        failed++;
      }
    }

    logger.info(`Bulk moderation completed`, { action, processed: contentIds.length, successful, failed });

    return { processed: contentIds.length, successful, failed };
  }
}

export const moderationService = new ModerationService();