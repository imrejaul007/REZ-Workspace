/**
 * Website Scraper - Cheerio-based merchant website scraper
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface WebsiteScraperResult {
  title?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  images?: string[];
  pricing?: string;
  products?: string[];
  content?: string;
}

export class WebsiteScraper {
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

  async scrape(url: string, extractFields?: Record<string, string>): Promise<WebsiteScraperResult> {
    try {
      const response = await this.axiosInstance.get(url, { responseType: 'text' });
      const $ = cheerio.load(response.data);

      const result: WebsiteScraperResult = {};

      // Title
      result.title = $('title').first().text().trim() || undefined;
      result.description = $('meta[name="description"]').attr('content')?.trim();

      // Contact info
      result.phone = this.extractPhone($);
      result.email = this.extractEmail($);
      result.address = this.extractAddress($);

      // Business hours
      result.hours = this.extractHours($);

      // Social links
      result.socialLinks = this.extractSocialLinks($);

      // Images
      result.images = this.extractImages($, url);

      // Custom fields
      if (extractFields) {
        result.products = this.extractCustomFields($, extractFields);
      }

      // Content preview
      result.content = $('main, article, .content, .post, #content')
        .first()
        .text()
        .trim()
        .slice(0, 2000) || undefined;

      return result;
    } catch (error: any) {
      throw new Error(`Failed to scrape ${url}: ${error.message}`);
    }
  }

  private extractPhone($: cheerio.CheerioAPI): string | undefined {
    // Look for phone numbers in href
    const phoneLink = $('a[href^="tel:"]').first().attr('href');
    if (phoneLink) {
      return phoneLink.replace('tel:', '').trim();
    }

    // Look in text for phone patterns
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const text = $('body').text();
    const matches = text.match(phoneRegex);
    return matches?.[0];
  }

  private extractEmail($: cheerio.CheerioAPI): string | undefined {
    const emailLink = $('a[href^="mailto:"]').first().attr('href');
    if (emailLink) {
      return emailLink.replace('mailto:', '').trim();
    }

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const text = $('body').text();
    const matches = text.match(emailRegex);
    return matches?.[0];
  }

  private extractAddress($: cheerio.CheerioAPI): string | undefined {
    // Look for address in common selectors
    const addressSelectors = [
      'address',
      '.address',
      '#address',
      '[itemprop="address"]',
      '.location',
      '.contact-address'
    ];

    for (const selector of addressSelectors) {
      const address = $(selector).first().text().trim();
      if (address && address.length > 5) {
        return address;
      }
    }

    return undefined;
  }

  private extractHours($: cheerio.CheerioAPI): string | undefined {
    // Look for business hours
    const hoursSelectors = [
      '[itemprop="openingHours"]',
      '.hours',
      '.business-hours',
      '.working-hours',
      '.opening-hours'
    ];

    for (const selector of hoursSelectors) {
      const hours = $(selector).first().text().trim();
      if (hours && hours.length > 5) {
        return hours;
      }
    }

    return undefined;
  }

  private extractSocialLinks($: cheerio.CheerioAPI): WebsiteScraperResult['socialLinks'] {
    const links: WebsiteScraperResult['socialLinks'] = {};

    const socialSelectors = [
      { selector: 'a[href*="facebook.com"], a[href*="fb.com"]', key: 'facebook' },
      { selector: 'a[href*="instagram.com"]', key: 'instagram' },
      { selector: 'a[href*="twitter.com"], a[href*="x.com"]', key: 'twitter' },
      { selector: 'a[href*="linkedin.com"]', key: 'linkedin' },
      { selector: 'a[href*="youtube.com"]', key: 'youtube' },
    ];

    for (const { selector, key } of socialSelectors) {
      const href = $(selector).first().attr('href');
      if (href) {
        (links as any)[key] = href;
      }
    }

    return Object.keys(links).length > 0 ? links : undefined;
  }

  private extractImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const images: string[] = [];

    $('img[src]').each((_, el) => {
      let src = $(el).attr('src');
      if (src) {
        // Make relative URLs absolute
        if (src.startsWith('/')) {
          try {
            src = new URL(src, baseUrl).href;
          } catch {
            // Ignore invalid URLs
          }
        }
        if (src.startsWith('http')) {
          images.push(src);
        }
      }
    });

    return images.slice(0, 20);
  }

  private extractCustomFields($: cheerio.CheerioAPI, fields: Record<string, string>): string[] {
    const results: string[] = [];

    for (const [field, selector] of Object.entries(fields)) {
      const elements = $(selector);
      elements.each((_, el) => {
        const text = $(el).text().trim();
        if (text) results.push(text);
      });
    }

    return results;
  }
}
