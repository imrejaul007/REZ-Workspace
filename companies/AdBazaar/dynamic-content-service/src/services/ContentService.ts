import { v4 as uuidv4 } from 'uuid';
import { Content, IContent, Variation, IVariation, Personalization, IPersonalization } from '../models';
import { createServiceLogger } from 'utils/logger.js';

const logger = createServiceLogger('ContentService');

export class ContentService {
  async createContent(data: Partial<IContent>): Promise<IContent> {
    const contentId = `cnt_${uuidv4()}`;
    const content = new Content({ ...data, contentId });
    await content.save();
    logger.info('Content created', { contentId, name: data.name });
    return content;
  }

  async getContentById(contentId: string): Promise<IContent | null> {
    return Content.findOne({ contentId });
  }

  async updateContent(contentId: string, data: Partial<IContent>): Promise<IContent | null> {
    const content = await Content.findOneAndUpdate({ contentId }, data, { new: true });
    if (content) logger.info('Content updated', { contentId });
    return content;
  }

  async getAllContent(companyId: string, status?: string): Promise<IContent[]> {
    const query: Record<string, unknown> = { companyId };
    if (status) query['status'] = status;
    return Content.find(query).sort({ createdAt: -1 });
  }

  async createVariation(contentId: string, data: Partial<IVariation>): Promise<IVariation> {
    const variationId = `var_${uuidv4()}`;
    const variation = new Variation({ ...data, contentId, variationId });
    await variation.save();
    await Content.updateOne({ contentId }, { $push: { variants: variationId } });
    logger.info('Variation created', { variationId, contentId });
    return variation;
  }

  async getVariationsByContent(contentId: string): Promise<IVariation[]> {
    return Variation.find({ contentId });
  }

  async personalizeContent(contentId: string, userId: string, companyId: string, context: Record<string, unknown>): Promise<IPersonalization> {
    const content = await this.getContentById(contentId);
    if (!content) throw new Error('Content not found');

    const variations = await this.getVariationsByContent(contentId);
    let selectedVariation: IVariation | null = null;

    if (variations.length > 0) {
      const totalWeight = variations.reduce((sum, v) => sum + v.weight, 0);
      let random = Math.random() * totalWeight;
      for (const variation of variations) {
        random -= variation.weight;
        if (random <= 0) {
          selectedVariation = variation;
          break;
        }
      }
      if (selectedVariation) {
        await Variation.updateOne({ variationId: selectedVariation.variationId }, { $inc: { impressions: 1 } });
      }
    }

    const personalizedElements = content.elements.map(el => ({
      originalElement: el.content,
      personalizedContent: this.applyPersonalization(el.content, context),
      reason: 'Context-based personalization'
    }));

    const personalizationId = `pers_${uuidv4()}`;
    const personalization = new Personalization({
      personalizationId,
      contentId,
      userId,
      companyId,
      variationId: selectedVariation?.variationId,
      context: context as IPersonalization['context'],
      personalizedElements
    });

    await personalization.save();
    await Content.updateOne({ contentId }, { $inc: { impressionCount: 1 } });
    logger.info('Content personalized', { personalizationId, contentId, userId });
    return personalization;
  }

  private applyPersonalization(content: string, context: Record<string, unknown>): string {
    let result = content;
    if (context['firstName'] && result.includes('{{firstName}}')) {
      result = result.replace('{{firstName}}', context['firstName'] as string);
    }
    if (context['location'] && result.includes('{{location}}')) {
      result = result.replace('{{location}}', context['location'] as string);
    }
    if (context['timeOfDay'] && result.includes('{{greeting}}')) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
      result = result.replace('{{greeting}}', greeting);
    }
    return result;
  }

  async trackClick(contentId: string, variationId?: string): Promise<void> {
    if (variationId) {
      await Variation.updateOne({ variationId }, { $inc: { clicks: 1 } });
    }
    await Content.updateOne({ contentId }, { $inc: { clickRate: 1 } });
  }

  async trackConversion(contentId: string, variationId?: string): Promise<void> {
    if (variationId) {
      const variation = await Variation.findOne({ variationId });
      if (variation) {
        variation.conversions++;
        variation.conversionRate = variation.impressions > 0 ? variation.conversions / variation.impressions : 0;
        await variation.save();
      }
    }
  }

  async previewContent(contentId: string, variationId?: string): Promise<IContent | null> {
    const content = await this.getContentById(contentId);
    if (!content) return null;

    if (variationId) {
      const variation = await Variation.findOne({ variationId });
      if (variation) {
        return { ...content.toObject(), elements: variation.elements } as IContent;
      }
    }
    return content;
  }

  async getContentStats(contentId: string): Promise<{ impressions: number; clicks: number; conversions: number; ctr: number }> {
    const content = await this.getContentById(contentId);
    const variations = await this.getVariationsByContent(contentId);
    const totalClicks = variations.reduce((sum, v) => sum + v.clicks, 0);
    const totalConversions = variations.reduce((sum, v) => sum + v.conversions, 0);
    return {
      impressions: content?.impressionCount || 0,
      clicks: totalClicks,
      conversions: totalConversions,
      ctr: content?.impressionCount ? (totalClicks / content.impressionCount) * 100 : 0
    };
  }
}

export const contentService = new ContentService();