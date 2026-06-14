/**
 * REZ Memory Cloud - Extract Routes (Content Extraction)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { extractService } from '../services/extractService.js';
import { memoryService } from '../services/memoryService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * POST /api/extract/url - Extract content from a URL
 */
router.post('/url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, userId, category } = req.body;

    if (!url) {
      throw new AppError('url is required', 400, 'MISSING_PARAMETER');
    }

    const extraction = await extractService.extractFromUrl(url);

    // Optionally save to memory
    if (userId) {
      await memoryService.create({
        userId: userId as string,
        content: extraction.content,
        summary: extraction.title || extraction.description || 'Extracted from URL',
        category: (category || 'fact') as 'conversation' | 'fact' | 'preference' | 'event' | 'decision' | 'idea' | 'learning' | 'personal' | 'work' | 'social',
        tags: [],
        entities: [],
        importance: 'medium',
        source: 'extraction',
        context: `Source: ${url}`,
        metadata: {
          url,
          title: extraction.title,
          author: extraction.author,
          publishedDate: extraction.publishedDate,
        },
        ttlType: 'default',
      });
    }

    res.json({
      success: true,
      data: extraction,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/extract/pdf - Extract text from PDF
 */
router.post('/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, base64, userId, category } = req.body;

    if (!url && !base64) {
      throw new AppError('url or base64 is required', 400, 'MISSING_PARAMETER');
    }

    let buffer: Buffer;

    if (base64) {
      buffer = Buffer.from(base64, 'base64');
    } else {
      // Fetch PDF from URL
      const response = await fetch(url as string);
      if (!response.ok) {
        throw new AppError('Failed to fetch PDF', 500, 'FETCH_ERROR');
      }
      buffer = Buffer.from(await response.arrayBuffer());
    }

    const extraction = await extractService.extractFromPdf(buffer);

    // Optionally save to memory
    if (userId) {
      await memoryService.create({
        userId: userId as string,
        content: extraction.content,
        summary: extraction.title || 'Extracted from PDF',
        category: (category || 'document') as 'conversation' | 'fact' | 'preference' | 'event' | 'decision' | 'idea' | 'learning' | 'personal' | 'work' | 'social',
        tags: [],
        entities: [],
        importance: 'medium',
        source: 'extraction',
        metadata: {
          title: extraction.title,
          author: extraction.author,
          pages: extraction.pages,
        },
        ttlType: 'default',
      });
    }

    res.json({
      success: true,
      data: extraction,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/extract/text - Extract structured data from text
 */
router.post('/text', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, userId, category } = req.body;

    if (!text) {
      throw new AppError('text is required', 400, 'MISSING_PARAMETER');
    }

    const result = extractService.extractFromText(text);
    const structured = extractService.extractStructured(text);

    // Optionally save to memory
    if (userId) {
      await memoryService.create({
        userId: userId as string,
        content: text as string,
        summary: result.content.slice(0, 200),
        category: (category || 'fact') as 'conversation' | 'fact' | 'preference' | 'event' | 'decision' | 'idea' | 'learning' | 'personal' | 'work' | 'social',
        tags: [],
        entities: [],
        importance: 'medium',
        source: 'user_input',
        metadata: {
          wordCount: result.wordCount,
          structured,
        },
        ttlType: 'default',
      });
    }

    res.json({
      success: true,
      data: {
        content: result.content,
        wordCount: result.wordCount,
        structured,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/extract/entities - Extract entities from text
 */
router.post('/entities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;

    if (!text) {
      throw new AppError('text is required', 400, 'MISSING_PARAMETER');
    }

    const structured = extractService.extractStructured(text);

    res.json({
      success: true,
      data: {
        emails: structured.emails,
        urls: structured.urls,
        phoneNumbers: structured.phoneNumbers,
        hashtags: structured.hashtags,
        mentions: structured.mentions,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
