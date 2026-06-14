/**
 * Social Media Scraper
 *
 * Detects and scrapes social media presence from websites
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SocialMediaProfile {
  platform: string;
  url: string;
  handle?: string;
  followers?: number;
  verified?: boolean;
}

export interface SocialMediaResult {
  hasWebsite: boolean;
  websiteUrl?: string;
  platforms: SocialMediaProfile[];
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  pinterest?: string;
  scrapedAt: string;
}

export class SocialMediaScraper {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; REZ-Atlas/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      }
    });
  }

  async scrapeFromWebsite(url: string): Promise<SocialMediaResult> {
    try {
      const response = await this.axiosInstance.get(url);
      const $ = cheerio.load(response.data);

      const result: SocialMediaResult = {
        hasWebsite: true,
        websiteUrl: url,
        platforms: [],
        scrapedAt: new Date().toISOString()
      };

      // Find all social media links
      const socialPlatforms = [
        { pattern: /facebook\.com|fb\.com/, name: 'Facebook', key: 'facebook' },
        { pattern: /instagram\.com/, name: 'Instagram', key: 'instagram' },
        { pattern: /twitter\.com|x\.com/, name: 'Twitter', key: 'twitter' },
        { pattern: /linkedin\.com/, name: 'LinkedIn', key: 'linkedin' },
        { pattern: /youtube\.com/, name: 'YouTube', key: 'youtube' },
        { pattern: /pinterest\.com/, name: 'Pinterest', key: 'pinterest' },
      ];

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';

        for (const platform of socialPlatforms) {
          if (platform.pattern.test(href)) {
            const profile: SocialMediaProfile = {
              platform: platform.name,
              url: href.startsWith('http') ? href : `https://${href}`,
 };

            // Extract handle from URL
            const handleMatch = href.match(/\/(?:@|company\/|([^/]+))\/?$/);
            if (handleMatch && handleMatch[1]) {
              profile.handle = handleMatch[1];
            }

            result.platforms.push(profile);
            (result as any)[platform.key] = profile.url;
          }
        }
      });

      // Also check meta tags for social links
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage) {
        // Site has Open Graph tags - good sign
      }

      return result;
    } catch (error: any) {
      throw new Error(`Failed to scrape social media: ${error.message}`);
    }
  }

  async searchProfiles(businessName: string): Promise<SocialMediaResult> {
    const result: SocialMediaResult = {
      hasWebsite: false,
      platforms: [],
      scrapedAt: new Date().toISOString()
    };

    // Known social media search patterns
    const searchQueries = [
      { platform: 'Facebook', url: `https://www.facebook.com/search/top?q=${encodeURIComponent(businessName)}` },
      { platform: 'Instagram', url: `https://www.instagram.com/${encodeURIComponent(businessName.replace(/\s+/g, ''))}/` },
      { platform: 'LinkedIn', url: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(businessName)}` },
    ];

    for (const query of searchQueries) {
      try {
        const response = await this.axiosInstance.head(query.url, { timeout: 10000 });
        if (response.status === 200) {
          const profile: SocialMediaProfile = {
            platform: query.platform,
            url: query.url,
          };
          result.platforms.push(profile);

          const key = query.platform.toLowerCase();
          (result as any)[key] = query.url;
        }
      } catch {
        // Page not found or redirected - profile may not exist
      }
    }

    return result;
  }

  async getProfileDetails(profileUrl: string): Promise<SocialMediaProfile | null> {
    try {
      const response = await this.axiosInstance.get(profileUrl);
      const $ = cheerio.load(response.data);

      const profile: SocialMediaProfile = {
        platform: '',
        url: profileUrl,
      };

      // Extract platform name from URL
      if (profileUrl.includes('facebook')) profile.platform = 'Facebook';
      else if (profileUrl.includes('instagram')) profile.platform = 'Instagram';
      else if (profileUrl.includes('twitter')) profile.platform = 'Twitter';
      else if (profileUrl.includes('linkedin')) profile.platform = 'LinkedIn';
      else if (profileUrl.includes('youtube')) profile.platform = 'YouTube';
      else if (profileUrl.includes('pinterest')) profile.platform = 'Pinterest';

      // Try to extract followers count
      const followersEl = $('[data-testid="followers"], .followers, [class*="follower"]');
      const followersText = followersEl.text();
      const followersMatch = followersText.match(/([\d,]+)\s*(?:followers?|subscriber)?/i);
      if (followersMatch) {
        profile.followers = parseInt(followersMatch[1].replace(/,/g, ''));
      }

      // Check for verified badge
      const verifiedEl = $('[data-testid="verified"], .verified, [class*="verified"]');
      profile.verified = verifiedEl.length > 0;

      return profile;
    } catch (error: any) {
      return null;
    }
  }
}
