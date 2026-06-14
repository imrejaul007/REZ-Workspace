/**
 * Google Reviews Scraper
 *
 * Scrapes Google Maps reviews for merchant intelligence
 * Uses Puppeteer for JS rendering
 */

import puppeteer, { Browser, Page } from 'puppeteer';

export interface Review {
  author: string;
  rating: number;
  date: string;
  text: string;
  likes: number;
  response?: string;
}

export interface GoogleReviewsResult {
  placeName: string;
  address?: string;
  phone?: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  lastScraped: string;
}

export class GoogleReviewsScraper {
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.connected) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async scrape(googleMapsUrl: string): Promise<GoogleReviewsResult> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    const result: GoogleReviewsResult = {
      placeName: '',
      rating: 0,
      reviewCount: 0,
      reviews: [],
      lastScraped: new Date().toISOString()
    };

    try {
      // Set viewport
      await page.setViewport({ width: 1280, height: 800 });

      // Navigate to Google Maps
      await page.goto(googleMapsUrl, { waitUntil: 'networkidle2', timeout: 60000 });

      // Wait for page to load
      await page.waitForSelector('h1', { timeout: 10000 }).catch(() => {});

      // Get place name
      result.placeName = await page.$eval('h1', (el) => el.textContent?.trim() || '').catch(() => '');

      // Get rating
      const ratingText = await page.$eval('[aria-label*="stars"], [class*="rating"]', (el) => el.textContent).catch(() => '');
      const ratingMatch = ratingText?.match(/(\d+\.?\d*)/);
      if (ratingMatch) {
        result.rating = parseFloat(ratingMatch[1]);
      }

      // Get review count
      const countText = await page.$eval('[aria-label*="reviews"]', (el) => el.textContent).catch(() => '');
      const countMatch = countText?.match(/([\d,]+)/);
      if (countMatch) {
        result.reviewCount = parseInt(countMatch[1].replace(/,/g, ''));
      }

      // Click on reviews tab if exists
      const reviewsTab = await page.$('[aria-label*="Reviews"], [data-tab-index]');
      if (reviewsTab) {
        await reviewsTab.click();
        await page.waitForTimeout(2000);
      }

      // Scroll to load more reviews
      await this.scrollToLoadReviews(page);

      // Extract reviews
      const reviewsData = await page.evaluate(() => {
        const reviews: any[] = [];
        const reviewCards = document.querySelectorAll('[data-review-id]');

        reviewCards.forEach((card) => {
          const author = card.querySelector('.d4r55, [class*="author"]')?.textContent?.trim() || '';
          const ratingEl = card.querySelector('[aria-label*="star"], [class*="rating"]');
          const rating = ratingEl ? parseFloat(ratingEl.getAttribute('aria-label')?.match(/(\d+\.?\d*)/)?.[1] || '0') : 0;
          const date = card.querySelector('.rsqaWe, [class*="date"]')?.textContent?.trim() || '';
          const text = card.querySelector('.wiI7pd, [class*="review"]')?.textContent?.trim() || '';
          const likes = parseInt(card.querySelector('.xk9m9b, [class*="like"]')?.textContent?.match(/\d+/)?.[0] || '0');

          if (text) {
            reviews.push({ author, rating, date, text, likes });
          }
        });

        return reviews;
      });

      result.reviews = reviewsData.slice(0, 20); // Limit to 20 reviews

    } catch (error: any) {
      console.error('Google Reviews scrape error:', error.message);
    } finally {
      await page.close();
    }

    return result;
  }

  async searchAndScrape(businessName: string, location?: string): Promise<GoogleReviewsResult[]> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    const results: GoogleReviewsResult[] = [];

    try {
      // Set viewport
      await page.setViewport({ width: 1280, height: 800 });

      // Search on Google Maps
      const query = location ? `${businessName} ${location}` : businessName;
      await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // Wait for search results
      await page.waitForSelector('[data-result-index]', { timeout: 10000 }).catch(() => {});

      // Get top 3 results
      const topResults = await page.$$eval('[data-result-index]', (elements) => {
        return elements.slice(0, 3).map((el) => {
          const link = el.querySelector('a')?.href || '';
          const name = el.querySelector('[class*="title"]')?.textContent?.trim() || '';
          return { link, name };
        });
      });

      // Scrape each result
      for (const result of topResults) {
        if (result.link) {
          try {
            const data = await this.scrape(result.link);
            results.push(data);
          } catch (e) {
            console.error(`Failed to scrape ${result.name}:`, e);
          }
        }
      }

    } catch (error: any) {
      console.error('Google search error:', error.message);
    } finally {
      await page.close();
    }

    return results;
  }

  private async scrollToLoadReviews(page: Page): Promise<void> {
    // Scroll down to trigger lazy loading
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        const container = document.querySelector('[class*="section-layout"], [class*="reviews"]');
        if (container) {
          container.scrollTop += 500;
        } else {
          window.scrollBy(0, 500);
        }
      });
      await page.waitForTimeout(1000);
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
