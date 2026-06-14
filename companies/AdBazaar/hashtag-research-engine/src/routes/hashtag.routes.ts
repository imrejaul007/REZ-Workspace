import { Router, Request, Response } from 'express';
import {
  searchHashtags,
  getHashtagDetails,
  getTrendingHashtags,
  suggestHashtags,
  checkBannedHashtags,
  analyzeContent,
  getRelatedHashtags,
  createHashtagMix,
  initializeSampleData,
} from '../services/hashtag.service';
import {
  listHashtagSets,
  createHashtagSet,
  getHashtagSetById,
  updateHashtagSet,
  deleteHashtagSet,
  searchHashtagSets,
  getPopularHashtagSets,
  initializeTemplateSets,
} from '../services/hashtag-set.service';
import { asyncHandler } from '../middleware';
import {
  searchHashtagsSchema,
  suggestHashtagsSchema,
  getHashtagDetailsSchema,
  getTrendingHashtagsSchema,
  createHashtagSetSchema,
  checkBannedHashtagsSchema,
  analyzeContentSchema,
} from '../utils/validators';
import { logger } from 'utils/logger.js';
import { hashtagSearchCounter } from '../config/prometheus';

const router = Router();

// Initialize data on first request
let dataInitialized = false;
const initData = async () => {
  if (!dataInitialized) {
    await initializeSampleData();
    await initializeTemplateSets();
    dataInitialized = true;
  }
};

// Search hashtags
router.post(
  '/search',
  asyncHandler(async (req: Request, res: Response) => {
    await initData();

    const validated = searchHashtagsSchema.parse(req.body);
    const hashtags = await searchHashtags({
      query: validated.query,
      limit: validated.limit,
      category: validated.category,
      includeBanned: validated.includeBanned,
    });

    hashtagSearchCounter.inc({ type: 'search' });

    res.json({
      success: true,
      data: {
        hashtags,
        count: hashtags.length,
      },
    });
  })
);

// Suggest hashtags
router.post(
  '/suggest',
  asyncHandler(async (req: Request, res: Response) => {
    await initData();

    const validated = suggestHashtagsSchema.parse(req.body);
    const suggestions = await suggestHashtags(
      validated.content,
      validated.type,
      validated.count,
      validated.includeNiche
    );

    hashtagSearchCounter.inc({ type: 'suggest' });

    // Categorize by type
    const high = suggestions.filter((s) => s.type === 'high');
    const medium = suggestions.filter((s) => s.type === 'medium');
    const niche = suggestions.filter((s) => s.type === 'niche');

    res.json({
      success: true,
      data: {
        suggestions,
        mix: { high, medium, niche },
        totalReaches: suggestions.reduce((sum, s) => sum + s.reachEstimate, 0),
      },
    });
  })
);

// Get hashtag details
router.get(
  '/:tag',
  asyncHandler(async (req: Request, res: Response) => {
    await initData();

    const { tag } = getHashtagDetailsSchema.parse(req.params);
    const hashtag = await getHashtagDetails(tag);

    if (!hashtag) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Hashtag #${tag} not found`,
      });
      return;
    }

    // Get related hashtags
    const related = await getRelatedHashtags(tag, 10);

    res.json({
      success: true,
      data: {
        ...hashtag,
        relatedHashtags: related,
      },
    });
  })
);

// Get trending hashtags
router.post(
  '/trending',
  asyncHandler(async (req: Request, res: Response) => {
    await initData();

    const validated = getTrendingHashtagsSchema.parse(req.body);
    const trending = await getTrendingHashtags(
      validated.category,
      validated.limit,
      validated.direction
    );

    hashtagSearchCounter.inc({ type: 'trending' });

    res.json({
      success: true,
      data: {
        trending,
        count: trending.length,
      },
    });
  })
);

// Check banned hashtags
router.post(
  '/check',
  asyncHandler(async (req: Request, res: Response) => {
    const validated = checkBannedHashtagsSchema.parse(req.body);
    const result = await checkBannedHashtags(validated.hashtags);

    res.json({
      success: true,
      data: result,
    });
  })
);

// Analyze content
router.post(
  '/analyze',
  asyncHandler(async (req: Request, res: Response) => {
    await initData();

    const validated = analyzeContentSchema.parse(req.body);
    const analysis = await analyzeContent(
      validated.content,
      validated.title,
      validated.imageDescription,
      validated.targetAudience
    );

    hashtagSearchCounter.inc({ type: 'analyze' });

    res.json({
      success: true,
      data: analysis,
    });
  })
);

// Get hashtag mix
router.post(
  '/mix',
  asyncHandler(async (req: Request, res: Response) => {
    await initData();

    const { primaryTag, count } = req.body;
    if (!primaryTag) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'primaryTag is required',
      });
      return;
    }

    const mix = await createHashtagMix(primaryTag, count || 10);

    res.json({
      success: true,
      data: mix,
    });
  })
);

// Health check endpoint for hashtag data
router.get('/init/health', async (_req: Request, res: Response) => {
  const isInitialized = dataInitialized;
  res.json({
    success: true,
    data: {
      initialized: isInitialized,
      service: 'hashtag-research-engine',
      version: '1.0.0',
    },
  });
});

export default router;