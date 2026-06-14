import { Router, Request, Response } from 'express';
import { zapierService } from '../services/zapier.service';
import { authService } from '../services/auth.service';
import { ApiResponse, CreatePostInput, GetAnalyticsInput, SchedulePostInput } from '../types';

const router = Router();

const getTenantId = (req: Request): string => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return tenantId;
};

const authenticate = async (req: Request, res: Response, next: () => void) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
    });
  }

  const validKey = await authService.validateApiKey(apiKey);
  if (!validKey) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired API key',
    });
  }

  (req as Request & { apiKey: typeof validKey }).apiKey = validKey;
  next();
};

// Get available actions and triggers (public)
router.get('/actions', (_req: Request, res: Response) => {
  const response: ApiResponse<ReturnType<typeof zapierService.getAvailableActions>> = {
    success: true,
    data: zapierService.getAvailableActions(),
  };
  res.json(response);
});

router.get('/triggers', (_req: Request, res: Response) => {
  const response: ApiResponse<ReturnType<typeof zapierService.getAvailableTriggers>> = {
    success: true,
    data: zapierService.getAvailableTriggers(),
  };
  res.json(response);
});

// Create post action
router.post('/actions/create_post', authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const input = req.body as CreatePostInput;

    const result = await zapierService.createPost(tenantId, input);
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Post created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create post',
    };
    res.status(400).json(response);
  }
});

// Get analytics action
router.post('/actions/get_analytics', authenticate, async (req: Request, res: Response) => {
  try {
    const input = req.body as GetAnalyticsInput;

    if (!input.startDate || !input.endDate) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'startDate and endDate are required',
      };
      return res.status(400).json(response);
    }

    const result = await zapierService.getAnalytics(input);
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get analytics',
    };
    res.status(400).json(response);
  }
});

// Schedule post action
router.post('/actions/schedule_post', authenticate, async (req: Request, res: Response) => {
  try {
    const input = req.body as SchedulePostInput;

    const result = await zapierService.schedulePost(input);
    if (!result) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Post not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Post scheduled successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to schedule post',
    };
    res.status(400).json(response);
  }
});

// Get posts
router.get('/posts', authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const posts = await zapierService.getAllPosts(tenantId);
    const response: ApiResponse<typeof posts> = {
      success: true,
      data: posts,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch posts',
    };
    res.status(500).json(response);
  }
});

// Get post by ID
router.get('/posts/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const post = await zapierService.getPost(req.params.id);
    if (!post) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Post not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<typeof post> = {
      success: true,
      data: post,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch post',
    };
    res.status(500).json(response);
  }
});

export default router;
