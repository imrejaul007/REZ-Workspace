import { v4 as uuidv4 } from 'uuid';
import { RepurposedContent } from '../models/index.js';
import { RepurposingTemplate } from '../models/index.js';
import { contentAdaptationService } from './contentAdaptation.js';
import { highlightsExtractionService } from './highlightsExtraction.js';
import { logger } from 'utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { contentRepurposingTotal, processingQueueSize } from '../middleware/metrics.js';

export interface RepurposeRequest {
  originalContentId: string;
  originalPlatform: string;
  targetPlatform: string;
  content: {
    title: string;
    description: string;
    hashtags?: string[];
    aspectRatio?: string;
    mediaUrl?: string;
  };
  templateId?: string;
}

export interface BatchRepurposeRequest {
  originalContentId: string;
  originalPlatform: string;
  targets: string[];
  content: {
    title: string;
    description: string;
    hashtags?: string[];
    aspectRatio?: string;
    mediaUrl?: string;
  };
}

export class RepurposingService {
  /**
   * Repurpose content for a target platform
   */
  async repurpose(request: RepurposeRequest): Promise<RepurposedContent> {
    const { originalContentId, originalPlatform, targetPlatform, content, templateId } = request;

    logger.info('Repurposing content', {
      originalContentId,
      originalPlatform,
      targetPlatform,
    });

    // Get template if provided
    let template = null;
    if (templateId) {
      template = await RepurposingTemplate.findOne({ id: templateId, isActive: true });
      if (!template) {
        throw new NotFoundError('Template');
      }
    }

    // Adapt content for target platform
    const adapted = contentAdaptationService.adaptContent(content, targetPlatform);

    // Create repurposed content document
    const repurposedContent = new RepurposedContent({
      id: uuidv4(),
      originalContentId,
      originalPlatform,
      targetPlatform,
      adaptedContent: {
        title: adapted.title,
        description: adapted.description,
        hashtags: adapted.hashtags,
      },
      mediaUrl: content.mediaUrl || '',
      mediaFormat: adapted.mediaFormat,
      aspectRatio: adapted.aspectRatio,
      status: 'ready',
    });

    await repurposedContent.save();

    // Update metrics
    contentRepurposingTotal.inc({
      source_platform: originalPlatform,
      target_platform: targetPlatform,
      status: 'success',
    });

    logger.info('Content repurposed successfully', {
      id: repurposedContent.id,
      targetPlatform,
    });

    return repurposedContent;
  }

  /**
   * Batch repurpose content for multiple platforms
   */
  async batchRepurpose(request: BatchRepurposeRequest): Promise<RepurposedContent[]> {
    const { originalContentId, originalPlatform, targets, content } = request;

    logger.info('Batch repurposing content', {
      originalContentId,
      targetCount: targets.length,
    });

    processingQueueSize.inc(targets.length);

    const results = await Promise.allSettled(
      targets.map(async (targetPlatform) => {
        return this.repurpose({
          originalContentId,
          originalPlatform,
          targetPlatform,
          content,
        });
      })
    );

    processingQueueSize.dec(targets.length);

    const successful: RepurposedContent[] = [];
    const failed: { platform: string; error: string }[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          platform: targets[index],
          error: result.reason.message,
        });
      }
    });

    logger.info('Batch repurposing completed', {
      originalContentId,
      successful: successful.length,
      failed: failed.length,
    });

    return successful;
  }

  /**
   * Get repurposed content by ID
   */
  async getById(id: string): Promise<RepurposedContent> {
    const content = await RepurposedContent.findOne({ id });
    if (!content) {
      throw new NotFoundError('RepurposedContent');
    }
    return content;
  }

  /**
   * Get repurposing history
   */
  async getHistory(options: {
    originalContentId?: string;
    originalPlatform?: string;
    targetPlatform?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: RepurposedContent[]; total: number }> {
    const { originalContentId, originalPlatform, targetPlatform, limit = 20, offset = 0 } = options;

    const query: Record<string, unknown> = {};
    if (originalContentId) query.originalContentId = originalContentId;
    if (originalPlatform) query.originalPlatform = originalPlatform;
    if (targetPlatform) query.targetPlatform = targetPlatform;

    const [items, total] = await Promise.all([
      RepurposedContent.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit),
      RepurposedContent.countDocuments(query),
    ]);

    return { items, total };
  }

  /**
   * Update repurposed content status
   */
  async updateStatus(id: string, status: 'processing' | 'ready' | 'published' | 'failed'): Promise<RepurposedContent> {
    const content = await RepurposedContent.findOneAndUpdate(
      { id },
      {
        status,
        ...(status === 'published' ? { publishedAt: new Date() } : {}),
      },
      { new: true }
    );

    if (!content) {
      throw new NotFoundError('RepurposedContent');
    }

    return content;
  }

  /**
   * Delete repurposed content
   */
  async delete(id: string): Promise<void> {
    const result = await RepurposedContent.deleteOne({ id });
    if (result.deletedCount === 0) {
      throw new NotFoundError('RepurposedContent');
    }
  }

  /**
   * Adapt single content piece (without saving)
   */
  async adaptContent(
    content: {
      title: string;
      description: string;
      hashtags?: string[];
      aspectRatio?: string;
    },
    targetPlatform: string
  ): Promise<ReturnType<typeof contentAdaptationService.adaptContent>> {
    return contentAdaptationService.adaptContent(content, targetPlatform);
  }
}

export const repurposingService = new RepurposingService();