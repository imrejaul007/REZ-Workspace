import { Product } from '../models';
import { CustomerStyle, CustomerStyleDocument } from '../models';
import { ProductCategory } from '../types';
import logger from '../utils/logger';

export interface StyleRecommendationResult {
  recommendations: Array<{
    productId: string;
    name: string;
    category: ProductCategory;
    matchScore: number;
    reason: string;
  }>;
  styleProfile: {
    bodyType?: string;
    preferredStyles: string[];
    colorPalette: string[];
    budgetRange?: { min: number; max: number };
  };
}

class StyleAdvisorService {
  async getRecommendations(customerId: string, merchantId: string): Promise<StyleRecommendationResult> {
    logger.info('Getting style recommendations', { customerId, merchantId });

    // Get customer's style profile
    const profile = await CustomerStyle.findOne({ customerId, merchantId });
    if (!profile) {
      return {
        recommendations: [],
        styleProfile: { preferredStyles: [], colorPalette: [] },
      };
    }

    // Build product query based on preferences
    const query: Record<string, unknown> = {
      merchantId,
      status: 'active',
      stock: { $gt: 0 },
    };

    // Category preference
    if (profile.favoriteCategories.length > 0) {
      query.category = { $in: profile.favoriteCategories };
    }

    // Budget range
    if (profile.budgetRange) {
      query.sellingPrice = {
        $gte: profile.budgetRange.min,
        $lte: profile.budgetRange.max,
      };
    }

    // Get matching products
    const products = await Product.find(query).limit(20);

    // Score and rank recommendations
    const recommendations = products.map(product => {
      let matchScore = 50;
      let reasons: string[] = [];

      // Category match
      if (profile.favoriteCategories.includes(product.category as ProductCategory)) {
        matchScore += 20;
        reasons.push('Matches preferred category');
      }

      // Color match
      if (product.colors.some(c => profile.colorPreferences.includes(c))) {
        matchScore += 15;
        reasons.push('Matches preferred color');
      }

      // Size availability
      const preferredSizes = Object.entries(profile.sizePreferences)
        .filter(([, pref]) => pref > 0.3)
        .map(([size]) => size.toUpperCase());
      const availableSizes = product.sizes.map(s => s.toUpperCase());
      const hasPreferredSize = preferredSizes.some(s => availableSizes.includes(s));
      if (hasPreferredSize) {
        matchScore += 10;
        reasons.push('Your preferred size available');
      }

      // Occasion match
      if (profile.occasionPreferences.length > 0 && product.tags) {
        const occasionMatch = profile.occasionPreferences.some(occ =>
          product.tags?.some(tag => tag.toLowerCase().includes(occ.toLowerCase()))
        );
        if (occasionMatch) {
          matchScore += 5;
          reasons.push('Suitable for preferred occasions');
        }
      }

      return {
        productId: product.productId,
        name: product.name,
        category: product.category as ProductCategory,
        matchScore: Math.min(100, matchScore),
        reason: reasons.length > 0 ? reasons[0] : 'Matches your style profile',
      };
    }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);

    return {
      recommendations,
      styleProfile: {
        bodyType: profile.bodyType,
        preferredStyles: profile.stylePreferences,
        colorPalette: profile.colorPreferences,
        budgetRange: profile.budgetRange,
      },
    };
  }

  async createOrUpdateProfile(
    customerId: string,
    merchantId: string,
    profileData: {
      bodyType?: string;
      stylePreferences?: string[];
      favoriteCategories?: ProductCategory[];
      sizePreferences?: Record<string, number>;
      occasionPreferences?: string[];
      colorPreferences?: string[];
      budgetRange?: { min: number; max: number };
    }
  ): Promise<CustomerStyleDocument> {
    let profile = await CustomerStyle.findOne({ customerId, merchantId });

    if (profile) {
      Object.assign(profile, profileData);
      await profile.save();
      logger.info('Style profile updated', { styleId: profile.styleId });
    } else {
      profile = new CustomerStyle({
        customerId,
        merchantId,
        ...profileData,
      });
      await profile.save();
      logger.info('Style profile created', { styleId: profile.styleId });
    }

    return profile;
  }

  async analyzeCustomerStyle(customerId: string, merchantId: string): Promise<{
    styleScore: number;
    segment: string;
    insights: string[];
    suggestions: string[];
  }> {
    const profile = await CustomerStyle.findOne({ customerId, merchantId });
    if (!profile) {
      return { styleScore: 0, segment: 'new', insights: [], suggestions: [] };
    }

    const insights: string[] = [];
    const suggestions: string[] = [];

    // Profile completeness
    if (profile.styleScore < 50) {
      insights.push('Style profile is incomplete - consider adding more preferences');
      suggestions.push('Complete your style profile for better recommendations');
    } else {
      insights.push('Well-defined style profile - personalized recommendations available');
    }

    // Category preferences
    if (profile.favoriteCategories.length > 2) {
      insights.push('Diverse fashion interests across multiple categories');
    } else if (profile.favoriteCategories.length === 1) {
      insights.push('Focused on specific category - could explore more');
      suggestions.push('Consider browsing related categories');
    }

    // Budget analysis
    if (profile.budgetRange) {
      const avgPrice = profile.budgetRange.max / 2;
      if (avgPrice < 2000) {
        insights.push('Budget-conscious shopper');
      } else if (avgPrice > 5000) {
        insights.push('Premium fashion preferences');
      }
    }

    // Size preferences
    const topSizes = Object.entries(profile.sizePreferences)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([size]) => size);
    if (topSizes.length > 0) {
      insights.push(`Preferred sizes: ${topSizes.join(', ')}`);
    }

    // Segment determination
    let segment = 'casual';
    if (profile.stylePreferences.includes('formal') || profile.stylePreferences.includes('business')) {
      segment = 'formal';
    } else if (profile.stylePreferences.includes('ethnic') || profile.stylePreferences.includes('traditional')) {
      segment = 'ethnic';
    } else if (profile.stylePreferences.includes('trendy') || profile.stylePreferences.includes('streetwear')) {
      segment = 'trendy';
    }

    return {
      styleScore: profile.styleScore,
      segment,
      insights,
      suggestions,
    };
  }
}

export const styleAdvisorService = new StyleAdvisorService();
export default styleAdvisorService;