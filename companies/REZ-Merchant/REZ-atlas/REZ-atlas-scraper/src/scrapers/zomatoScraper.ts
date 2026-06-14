/**
 * Zomato Scraper
 *
 * Scrapes restaurant data from Zomato for merchant intelligence
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ZomatoRestaurant {
  name: string;
  url: string;
  rating: number;
  votes: string;
  cuisine: string[];
  costForTwo: string;
  address: string;
  phone?: string;
  hours?: string;
  photos: string[];
  menu?: string[];
}

export interface ZomatoSearchResult {
  city: string;
  query: string;
  restaurants: ZomatoRestaurant[];
  scrapedAt: string;
}

export class ZomatoScraper {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
  }

  async scrape(url: string): Promise<ZomatoRestaurant> {
    try {
      const response = await this.axiosInstance.get(url);
      const $ = cheerio.load(response.data);

      const restaurant: ZomatoRestaurant = {
        name: '',
        url,
        rating: 0,
        votes: '',
        cuisine: [],
        costForTwo: '',
        address: '',
        photos: [],
        menu: []
      };

      // Name
      restaurant.name = $('h1, .restaurant-name').first().text().trim() || '';

      // Rating
      const ratingEl = $('[data-test-attribute="star-rating"], .rating');
      const ratingText = ratingEl.text();
      const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
      if (ratingMatch) {
        restaurant.rating = parseFloat(ratingMatch[1]);
      }

      // Votes
      const votesEl = $('[data-test-attribute="rating-votes"], .votes');
      restaurant.votes = votesEl.text().trim() || '';

      // Cuisine
      const cuisineEl = $('[data-test-attribute=" cuisines"], .cuisine');
      const cuisineText = cuisineEl.text().trim();
      if (cuisineText) {
        restaurant.cuisine = cuisineText.split(',').map(c => c.trim());
      }

      // Cost for two
      const costEl = $('[data-test-attribute=" cost"], .cost');
      restaurant.costForTwo = costEl.text().trim() || '';

      // Address
      const addressEl = $('[data-test-attribute=" address"], address, .address');
      restaurant.address = addressEl.text().trim() || '';

      // Phone
      const phoneEl = $('a[href^="tel:"]');
      if (phoneEl.length) {
        restaurant.phone = phoneEl.first().attr('href')?.replace('tel:', '').trim();
      }

      // Hours
      const hoursEl = $('[data-test-attribute=" opening hours"], .hours, .timing');
      restaurant.hours = hoursEl.text().trim() || '';

      // Photos
      $('img[src*="zomato"], img[src*="b.z"], .photo img').each((_, el) => {
        const src = $(el).attr('src');
        if (src && src.startsWith('http')) {
          restaurant.photos.push(src);
        }
      });

      return restaurant;
    } catch (error: any) {
      throw new Error(`Failed to scrape Zomato restaurant: ${error.message}`);
    }
  }

  async search(query: string, city: string): Promise<ZomatoSearchResult> {
    try {
      const searchUrl = `https://www.zomato.com/${city}/search?q=${encodeURIComponent(query)}`;
      const response = await this.axiosInstance.get(searchUrl);
      const $ = cheerio.load(response.data);

      const restaurants: ZomatoRestaurant[] = [];

      // Parse search results
      $('[data-test-attribute="search-results"], .search-result, .restaurant-card').each((_, el) => {
        const nameEl = $(el).find('[data-test-attribute="name"], .name');
        const linkEl = $(el).find('a').first();
        const ratingEl = $(el).find('[data-test-attribute="rating"], .rating');
        const cuisineEl = $(el).find('[data-test-attribute=" cuisines"], .cuisine');
        const costEl = $(el).find('[data-test-attribute=" cost"], .cost');

        const name = nameEl.text().trim();
        const link = linkEl.attr('href') || '';

        if (name && link) {
          const ratingText = ratingEl.text();
          const ratingMatch = ratingText.match(/(\d+\.?\d*)/);

          restaurants.push({
            name,
            url: link.startsWith('http') ? link : `https://www.zomato.com${link}`,
            rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
            votes: '',
            cuisine: cuisineEl.text().split(',').map(c => c.trim()).filter(Boolean),
            costForTwo: costEl.text().trim(),
            address: '',
            photos: []
          });
        }
      });

      return {
        city,
        query,
        restaurants: restaurants.slice(0, 20),
        scrapedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to search Zomato: ${error.message}`);
    }
  }
}