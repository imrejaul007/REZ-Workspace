import { Router, Request, Response } from 'express';
import { tagService } from '../services/tag.service';
import { ApiResponse, VersionTag } from '../types';

const router = Router();

const getUserId = (req: Request): string => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    throw new Error('User ID is required');
  }
  return userId;
};

// Create tag for version
router.post('/:contentId/versions/:versionId/tags', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const tag = await tagService.create(
      req.params.contentId,
      req.params.versionId,
      userId,
      req.body
    );

    const response: ApiResponse<VersionTag> = {
      success: true,
      data: tag,
      message: 'Tag created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create tag',
    };
    res.status(400).json(response);
  }
});

// Get tags for content
router.get('/:contentId/tags', async (req: Request, res: Response) => {
  try {
    const tags = await tagService.findByContentItem(req.params.contentId);
    const response: ApiResponse<VersionTag[]> = {
      success: true,
      data: tags,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tags',
    };
    res.status(500).json(response);
  }
});

// Get tags for version
router.get('/:contentId/versions/:versionId/tags', async (req: Request, res: Response) => {
  try {
    const tags = await tagService.findByVersion(req.params.contentId, req.params.versionId);
    const response: ApiResponse<VersionTag[]> = {
      success: true,
      data: tags,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tags',
    };
    res.status(500).json(response);
  }
});

// Update tag description
router.put('/:contentId/tags/:tagId', async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    const tag = await tagService.updateDescription(req.params.tagId, description);

    if (!tag) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Tag not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<VersionTag> = {
      success: true,
      data: tag,
      message: 'Tag updated successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update tag',
    };
    res.status(400).json(response);
  }
});

// Delete tag
router.delete('/:contentId/tags/:tagId', async (req: Request, res: Response) => {
  try {
    const deleted = await tagService.delete(req.params.tagId);

    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Tag not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Tag deleted successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete tag',
    };
    res.status(500).json(response);
  }
});

export default router;
