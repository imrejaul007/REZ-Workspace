/**
 * REZ Memory Cloud - Extract Service (Content Extraction)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';

export interface ExtractionResult {
  content: string;
  title?: string;
  description?: string;
  author?: string;
  publishedDate?: string;
  images: string[];
  links: { text: string; url: string }[];
  metadata: Record<string, unknown>;
}

export interface PDFExtractionResult {
  content: string;
  pages: number;
  title?: string;
  author?: string;
  metadata: Record<string, unknown>;
}

export class ExtractService {
  /**
   * Extract content from a web page
   */
  async extractFromUrl(url: string): Promise<ExtractionResult> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'REZ Memory Cloud/1.0 (https://rez.money)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      const html = response.data as string;
      const $ = cheerio.load(html);

      // Extract title
      const title =
        $('meta[property="og:title"]').attr('content') ||
        $('title').text() ||
        $('h1').first().text();

      // Extract description
      const description =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        '';

      // Extract author
      const author =
        $('meta[name="author"]').attr('content') ||
        $('meta[property="article:author"]').attr('content') ||
        $('[rel="author"]').text() ||
        '';

      // Extract published date
      const publishedDate =
        $('meta[property="article:published_time"]').attr('content') ||
        $('meta[name="publishdate"]').attr('content') ||
        '';

      // Extract main content
      const content = this.extractMainContent($);

      // Extract images
      const images: string[] = [];
      $('img').each((_, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src');
        if (src && src.startsWith('http')) {
          images.push(src);
        }
      });

      // Extract links
      const links: { text: string; url: string }[] = [];
      $('a').each((_, a) => {
        const href = $(a).attr('href');
        const text = $(a).text().trim();
        if (href && href.startsWith('http') && text) {
          links.push({ text, url: href });
        }
      });

      // Extract metadata
      const metadata: Record<string, unknown> = {};
      $('meta').each((_, el) => {
        const name = $(el).attr('name') || $(el).attr('property');
        const content = $(el).attr('content');
        if (name && content) {
          metadata[name] = content;
        }
      });

      logger.info({ msg: 'URL extracted', url, title: title?.slice(0, 50) });

      return {
        content,
        title: title?.trim(),
        description: description?.trim(),
        author: author?.trim(),
        publishedDate: publishedDate?.trim(),
        images: images.slice(0, 20), // Limit images
        links: links.slice(0, 50), // Limit links
        metadata,
      };
    } catch (error) {
      logger.error({ msg: 'URL extraction failed', url, error });
      throw new Error(`Failed to extract from URL: ${url}`);
    }
  }

  /**
   * Extract text from PDF buffer
   */
  async extractFromPdf(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      // Dynamic import for pdf-parse
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);

      logger.info({
        msg: 'PDF extracted',
        pages: data.numpages,
        title: data.info?.title,
      });

      return {
        content: data.text,
        pages: data.numpages,
        title: data.info?.title,
        author: data.info?.author,
        metadata: data.info || {},
      };
    } catch (error) {
      logger.error({ msg: 'PDF extraction failed', error });
      throw new Error('Failed to extract from PDF');
    }
  }

  /**
   * Extract text from plain text
   */
  extractFromText(text: string): { content: string; wordCount: number } {
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    return {
      content: text.trim(),
      wordCount,
    };
  }

  /**
   * Extract structured data from text (basic NER-like)
   */
  extractStructured(text: string): {
    emails: string[];
    urls: string[];
    phoneNumbers: string[];
    hashtags: string[];
    mentions: string[];
  } {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const urlRegex = /https?:\/\/[^\s]+/g;
    const phoneRegex = /(\+?91[-.\s]?)?\d{10}|\(\d{3}\)[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const mentionRegex = /@[a-zA-Z0-9_]+/g;

    return {
      emails: text.match(emailRegex) || [],
      urls: text.match(urlRegex) || [],
      phoneNumbers: text.match(phoneRegex) || [],
      hashtags: text.match(hashtagRegex) || [],
      mentions: text.match(mentionRegex) || [],
    };
  }

  /**
   * Extract main content from HTML (removing scripts, styles, nav, footer)
   */
  private extractMainContent($: cheerio.CheerioAPI): string {
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, iframe, noscript').remove();

    // Try to find main content
    const mainSelectors = [
      'article',
      '[role="main"]',
      'main',
      '.content',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content',
    ];

    for (const selector of mainSelectors) {
      const main = $(selector);
      if (main.length > 0) {
        return this.cleanText(main.text());
      }
    }

    // Fallback to body
    return this.cleanText($('body').text());
  }

  /**
   * Clean extracted text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

export const extractService = new ExtractService();
