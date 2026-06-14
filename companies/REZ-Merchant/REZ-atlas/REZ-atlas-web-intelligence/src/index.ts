/**
 * REZ Atlas Web Intelligence Bridge
 *
 * Connects REZ Atlas to HOJAI Web Intelligence for:
 * - Competitor monitoring
 * - Review aggregation
 * - News tracking
 * - Social presence detection
 */

import axios from 'axios';

const WEB_INTELLIGENCE_URL = process.env.WEB_INTELLIGENCE_URL || 'http://localhost:4595';

export interface MerchantIntelligence {
  merchantId: string;
  url: string;
  competitors: CompetitorData[];
  reviews: ReviewData[];
  news: NewsArticle[];
  social: SocialData;
  webPresence: WebPresence;
}

export interface CompetitorData {
  name: string;
  url: string;
  pricing?: string;
  products?: string[];
  lastScraped: string;
}

export interface ReviewData {
  source: 'google' | 'yelp' | 'zomato' | 'trustpilot';
  rating: number;
  count: number;
  recentReviews: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface NewsArticle {
  title: string;
  url: string;
  date: string;
  source: string;
}

export interface SocialData {
  website?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

export interface WebPresence {
  hasWebsite: boolean;
  hasSocialMedia: boolean;
  hasGoogleListing: boolean;
  hasZomato: boolean;
  hasSwiggy: boolean;
  searchVisibility: number;
  lastUpdated: string;
}

export class AtlasWebIntelligenceBridge {
  private webIntelligence: axios.AxiosInstance;

  constructor() {
    this.webIntelligence = axios.create({
      baseURL: WEB_INTELLIGENCE_URL,
      timeout: 30000,
    });
  }

  /**
   * Get merchant intelligence from web sources
   */
  async getMerchantIntelligence(merchantId: string, merchantUrl: string): Promise<MerchantIntelligence> {
    const [competitors, reviews, news, social, webPresence] = await Promise.all([
      this.getCompetitorData(merchantUrl),
      this.getReviewData(merchantUrl),
      this.getNewsForMerchant(merchantUrl),
      this.getSocialPresence(merchantUrl),
      this.getWebPresence(merchantUrl),
    ]);

    return {
      merchantId,
      url: merchantUrl,
      competitors,
      reviews,
      news,
      social,
      webPresence,
    };
  }

  /**
   * Scrape competitor websites
   */
  async getCompetitorData(merchantUrl: string): Promise<CompetitorData[]> {
    try {
      // Search for competitor news
      const response = await this.webIntelligence.get('/api/news/search', {
        params: {
          query: `nearby business ${merchantUrl}`,
          maxResults: 10,
        },
      });

      return response.data.data.map((article: any) => ({
        name: article.domain,
        url: article.url,
        lastScraped: article.seendate,
      }));
    } catch (error) {
      console.error('Failed to get competitor data:', error);
      return [];
    }
  }

  /**
   * Get reviews from various platforms
   */
  async getReviewData(merchantUrl: string): Promise<ReviewData[]> {
    const reviews: ReviewData[] = [];

    // Scrape Google Reviews (if available)
    try {
      const response = await this.webIntelligence.post('/api/scrape/simple', {
        url: `https://www.google.com/search?q=${encodeURIComponent(merchantUrl)}+reviews`,
        selectors: {
          content: '.review-link, .w83bc, [data-ved]',
        },
      });

      // Parse review data
      if (response.data.success) {
        // Simplified parsing - in production, use more sophisticated extraction
        reviews.push({
          source: 'google',
          rating: 0, // Would be extracted from structured data
          count: 0,
          recentReviews: [],
          sentiment: 'neutral',
        });
      }
    } catch (error) {
      // Google scraping may be blocked - this is expected
    }

    return reviews;
  }

  /**
   * Get news about merchant/company
   */
  async getNewsForMerchant(merchantUrl: string): Promise<NewsArticle[]> {
    try {
      // Extract domain for news search
      const domain = new URL(merchantUrl).hostname.replace('www.', '');

      const response = await this.webIntelligence.get('/api/news/search', {
        params: {
          query: domain,
          maxResults: 20,
        },
      });

      return response.data.data.map((article: any) => ({
        title: article.title,
        url: article.url,
        date: article.seendate,
        source: article.domain,
      }));
    } catch (error) {
      console.error('Failed to get news:', error);
      return [];
    }
  }

  /**
   * Detect social media presence
   */
  async getSocialPresence(merchantUrl: string): Promise<SocialData> {
    try {
      // Scrape the merchant website for social links
      const response = await this.webIntelligence.post('/api/scrape/simple', {
        url: merchantUrl,
        selectors: {
          content: 'a[href*="facebook"], a[href*="instagram"], a[href*="twitter"], a[href*="linkedin"]',
        },
      });

      const social: SocialData = {};

      if (response.data.success?.data?.links) {
        const links = response.data.data.links;

        links.forEach((link: string) => {
          if (link.includes('facebook.com') || link.includes('fb.com')) {
            social.facebook = link;
          } else if (link.includes('instagram.com')) {
            social.instagram = link;
          } else if (link.includes('twitter.com') || link.includes('x.com')) {
            social.twitter = link;
          } else if (link.includes('linkedin.com')) {
            social.linkedin = link;
          }
        });
      }

      return social;
    } catch (error) {
      return {};
    }
  }

  /**
   * Check overall web presence
   */
  async getWebPresence(merchantUrl: string): Promise<WebPresence> {
    const presence: WebPresence = {
      hasWebsite: false,
      hasSocialMedia: false,
      hasGoogleListing: false,
      hasZomato: false,
      hasSwiggy: false,
      searchVisibility: 0,
      lastUpdated: new Date().toISOString(),
    };

    try {
      // Check if website exists
      const response = await this.webIntelligence.post('/api/scrape/simple', {
        url: merchantUrl,
      });

      presence.hasWebsite = response.data.success;

      // Check for Zomato/Swiggy presence
      const foodDeliveryCheck = await this.webIntelligence.get('/api/news/search', {
        params: {
          query: `${merchantUrl} zomato OR swiggy`,
          maxResults: 5,
        },
      });

      if (foodDeliveryCheck.data.data?.length > 0) {
        const text = JSON.stringify(foodDeliveryCheck.data.data).toLowerCase();
        presence.hasZomato = text.includes('zomato');
        presence.hasSwiggy = text.includes('swiggy');
      }

      // Calculate search visibility score
      presence.searchVisibility = presence.hasWebsite ? 50 : 0;
      presence.searchVisibility += presence.hasZomato ? 20 : 0;
      presence.searchVisibility += presence.hasSwiggy ? 20 : 0;
      presence.searchVisibility += presence.hasSocialMedia ? 10 : 0;

    } catch (error) {
      // Website doesn't exist or is blocked
    }

    return presence;
  }

  /**
   * Get competitor pricing from their website
   */
  async getCompetitorPricing(competitorUrl: string): Promise<string | null> {
    try {
      const response = await this.webIntelligence.post('/api/scrape/simple', {
        url: competitorUrl,
        extractFields: {
          pricing: '.price, .amount, [class*="price"]',
        },
      });

      if (response.data.success && response.data.data.extracted?.pricing) {
        return response.data.data.extracted.pricing;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update REZ Atlas signals based on web intelligence
   */
  async updateAtlasSignals(merchantId: string, merchantUrl: string): Promise<{
    signals: string[];
    score: number;
  }> {
    const intelligence = await this.getMerchantIntelligence(merchantId, merchantUrl);
    const signals: string[] = [];
    let scoreModifier = 0;

    // Generate signals based on web presence
    if (!intelligence.webPresence.hasWebsite) {
      signals.push('NO_WEBSITE');
      scoreModifier -= 10;
    }

    if (!intelligence.webPresence.hasGoogleListing) {
      signals.push('NO_GOOGLE_LISTING');
      scoreModifier -= 5;
    }

    if (intelligence.reviews.length === 0) {
      signals.push('NO_REVIEWS');
      scoreModifier -= 5;
    }

    if (!intelligence.webPresence.hasZomato && !intelligence.webPresence.hasSwiggy) {
      signals.push('NO_FOOD_DELIVERY');
    }

    // Check for opportunity signals
    if (intelligence.webPresence.searchVisibility < 30) {
      signals.push('LOW_ONLINE_VISIBILITY');
    }

    if (intelligence.news.length > 0) {
      signals.push('HAS_NEWS_COVERAGE');
      scoreModifier += 5;
    }

    return {
      signals,
      score: scoreModifier,
    };
  }
}

export default AtlasWebIntelligenceBridge;
