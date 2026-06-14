import { DealTerms, IDealTerms, IDealTermsDocument } from '../models/DealTerms';
import { logger } from '../utils/logger';

export const termsService = {
  async createTerms(dealId: string, data: Partial<IDealTerms>): Promise<IDealTermsDocument> {
    const terms = new DealTerms({
      ...data,
      dealId,
      impressions: data.impressions || { guaranteed: 0, nonGuaranteed: 0, total: 0 },
      pacing: data.pacing || { strategy: 'even' },
    });

    await terms.save();
    logger.info('Deal terms created', { dealId });
    return terms;
  },

  async getTerms(dealId: string): Promise<IDealTermsDocument | null> {
    return DealTerms.findOne({ dealId });
  },

  async updateTerms(dealId: string, data: Partial<IDealTerms>): Promise<IDealTermsDocument | null> {
    const terms = await DealTerms.findOneAndUpdate(
      { dealId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (terms) {
      logger.info('Deal terms updated', { dealId, updates: Object.keys(data) });
    }
    return terms;
  },

  async deleteTerms(dealId: string): Promise<boolean> {
    const result = await DealTerms.deleteOne({ dealId });
    if (result.deletedCount > 0) {
      logger.info('Deal terms deleted', { dealId });
      return true;
    }
    return false;
  },

  async updateTargeting(dealId: string, targeting: IDealTerms['targeting']): Promise<IDealTermsDocument | null> {
    return DealTerms.findOneAndUpdate(
      { dealId },
      { $set: { targeting } },
      { new: true }
    );
  },

  async updatePricing(dealId: string, pricing: IDealTerms['pricing']): Promise<IDealTermsDocument | null> {
    return DealTerms.findOneAndUpdate(
      { dealId },
      { $set: { pricing } },
      { new: true }
    );
  },

  async updatePacing(dealId: string, pacing: IDealTerms['pacing']): Promise<IDealTermsDocument | null> {
    return DealTerms.findOneAndUpdate(
      { dealId },
      { $set: { pacing } },
      { new: true }
    );
  },

  async updateImpressions(
    dealId: string,
    impressions: Partial<IDealTerms['impressions']>
  ): Promise<IDealTermsDocument | null> {
    const update: Record<string, any> = {};
    if (impressions.guaranteed !== undefined) update['impressions.guaranteed'] = impressions.guaranteed;
    if (impressions.nonGuaranteed !== undefined) update['impressions.nonGuaranteed'] = impressions.nonGuaranteed;
    if (impressions.total !== undefined) update['impressions.total'] = impressions.total;

    return DealTerms.findOneAndUpdate(
      { dealId },
      { $inc: update },
      { new: true }
    );
  },

  async addDiscount(
    dealId: string,
    discount: IDealTerms['pricing'] extends { discounts: infer D } ? D extends Array<infer T> ? T : never : never
  ): Promise<IDealTermsDocument | null> {
    return DealTerms.findOneAndUpdate(
      { dealId },
      { $push: { 'pricing.discounts': discount } },
      { new: true }
    );
  },

  async removeDiscount(dealId: string, discountName: string): Promise<IDealTermsDocument | null> {
    return DealTerms.findOneAndUpdate(
      { dealId },
      { $pull: { 'pricing.discounts': { name: discountName } } },
      { new: true }
    );
  },

  async addExcludedCategory(dealId: string, category: string): Promise<IDealTermsDocument | null> {
    return DealTerms.findOneAndUpdate(
      { dealId },
      { $addToSet: { 'restrictions.excludedCategories': category } },
      { new: true }
    );
  },

  async addExcludedAdvertiser(dealId: string, advertiserId: string): Promise<IDealTermsDocument | null> {
    return DealTerms.findOneAndUpdate(
      { dealId },
      { $addToSet: { 'restrictions.excludedAdvertisers': advertiserId } },
      { new: true }
    );
  },

  async addThirdPartyUrl(dealId: string, url: string): Promise<IDealTermsDocument | null> {
    return DealTerms.findOneAndUpdate(
      { dealId },
      { $addToSet: { 'measurement.thirdPartyUrls': url } },
      { new: true }
    );
  },

  async validateTerms(dealId: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const terms = await DealTerms.findOne({ dealId });
    if (!terms) {
      return { valid: false, errors: ['Terms not found'] };
    }

    const errors: string[] = [];

    if (terms.pricing.basePrice < 0) {
      errors.push('Base price cannot be negative');
    }

    if (terms.pricing.floorPrice && terms.pricing.floorPrice > terms.pricing.basePrice) {
      errors.push('Floor price cannot be greater than base price');
    }

    if (terms.pricing.ceilingPrice && terms.pricing.ceilingPrice < terms.pricing.basePrice) {
      errors.push('Ceiling price cannot be less than base price');
    }

    if (terms.impressions.total < terms.impressions.guaranteed) {
      errors.push('Total impressions cannot be less than guaranteed impressions');
    }

    if (terms.attribution.window < 1) {
      errors.push('Attribution window must be at least 1 day');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  async getTermsByDealIds(dealIds: string[]): Promise<IDealTermsDocument[]> {
    return DealTerms.find({ dealId: { $in: dealIds } });
  },

  async duplicateTerms(sourceDealId: string, targetDealId: string): Promise<IDealTermsDocument | null> {
    const sourceTerms = await DealTerms.findOne({ dealId: sourceDealId });
    if (!sourceTerms) return null;

    const targetTerms = new DealTerms({
      ...sourceTerms.toObject(),
      _id: undefined,
      dealId: targetDealId,
    });

    await targetTerms.save();
    logger.info('Deal terms duplicated', { sourceDealId, targetDealId });
    return targetTerms;
  },
};