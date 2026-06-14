import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import twitterService from '../services/twitter.service';
import logger from '../utils/logger';
import { ApiResponse, CreateTweetRequest, ThreadRequest } from '../types';

const router = Router();

// Middleware to extract tenant ID
const extractTenantId = (req: Request): string | null => {
  return req.headers['x-tenant-id'] as string || null;
};

// POST /tweets - Create a new tweet
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = extractTenantId(req);

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_ID',
          message: 'X-Tenant-ID header is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const tweetData: CreateTweetRequest = req.body;

    if (!tweetData.text) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TEXT',
          message: 'Tweet text is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const tweet = await twitterService.createTweet(tenantId, tweetData);

    const response: ApiResponse<typeof tweet> = {
      success: true,
      data: tweet,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to create tweet', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'CREATE_TWEET_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create tweet',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// POST /tweets/thread - Create a thread
router.post('/thread', async (req: Request, res: Response) => {
  try {
    const tenantId = extractTenantId(req);

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_ID',
          message: 'X-Tenant-ID header is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const threadData: ThreadRequest = req.body;

    if (!threadData.tweets || threadData.tweets.length < 2) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_THREAD',
          message: 'Thread must have at least 2 tweets',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const tweets = await twitterService.createThread(tenantId, threadData);

    const response: ApiResponse<typeof tweets> = {
      success: true,
      data: tweets,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to create thread', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'CREATE_THREAD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create thread',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /tweets/:id - Get a tweet by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = extractTenantId(req);

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_ID',
          message: 'X-Tenant-ID header is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const { id } = req.params;
    const tweet = await twitterService.getTweet(tenantId, id);

    const response: ApiResponse<typeof tweet> = {
      success: true,
      data: tweet,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get tweet', { tweetId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_TWEET_ERROR',
        message: error instanceof Error ? error.message : 'Tweet not found',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(error instanceof Error && error.message === 'Tweet not found' ? 404 : 500).json(response);
  }
});

// DELETE /tweets/:id - Delete a tweet
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = extractTenantId(req);

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_ID',
          message: 'X-Tenant-ID header is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const { id } = req.params;
    await twitterService.deleteTweet(tenantId, id);

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to delete tweet', { tweetId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DELETE_TWEET_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete tweet',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// POST /tweets/:id/quote - Quote a tweet
router.post('/:id/quote', async (req: Request, res: Response) => {
  try {
    const tenantId = extractTenantId(req);

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_ID',
          message: 'X-Tenant-ID header is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const { id } = req.params;
    const { text } = req.body;
    const tweet = await twitterService.quoteTweet(tenantId, id, text);

    const response: ApiResponse<typeof tweet> = {
      success: true,
      data: tweet,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to quote tweet', { tweetId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'QUOTE_TWEET_ERROR',
        message: error instanceof Error ? error.message : 'Failed to quote tweet',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// POST /tweets/:id/retweet - Retweet
router.post('/:id/retweet', async (req: Request, res: Response) => {
  try {
    const tenantId = extractTenantId(req);

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_ID',
          message: 'X-Tenant-ID header is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const { id } = req.params;
    await twitterService.retweet(tenantId, id);

    const response: ApiResponse<{ retweeted: boolean }> = {
      success: true,
      data: { retweeted: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to retweet', { tweetId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'RETWEET_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retweet',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// DELETE /tweets/:id/retweet - Unretweet
router.delete('/:id/retweet', async (req: Request, res: Response) => {
  try {
    const tenantId = extractTenantId(req);

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_ID',
          message: 'X-Tenant-ID header is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const { id } = req.params;
    await twitterService.unretweet(tenantId, id);

    const response: ApiResponse<{ unretweeted: boolean }> = {
      success: true,
      data: { unretweeted: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to unretweet', { tweetId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UNRETWEET_ERROR',
        message: error instanceof Error ? error.message : 'Failed to unretweet',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// POST /tweets/:id/like - Like a tweet
router.post('/:id/like', async (req: Request, res: Response) => {
  try {
    const tenantId = extractTenantId(req);

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_ID',
          message: 'X-Tenant-ID header is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const { id } = req.params;
    await twitterService.likeTweet(tenantId, id);

    const response: ApiResponse<{ liked: boolean }> = {
      success: true,
      data: { liked: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to like tweet', { tweetId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'LIKE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to like tweet',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// DELETE /tweets/:id/like - Unlike a tweet
router.delete('/:id/like', async (req: Request, res: Response) => {
  try {
    const tenantId = extractTenantId(req);

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_ID',
          message: 'X-Tenant-ID header is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const { id } = req.params;
    await twitterService.unlikeTweet(tenantId, id);

    const response: ApiResponse<{ unliked: boolean }> = {
      success: true,
      data: { unliked: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to unlike tweet', { tweetId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UNLIKE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to unlike tweet',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

export default router;
