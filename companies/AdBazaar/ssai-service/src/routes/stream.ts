import { Router, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { adInsertionService } from '../services/index.js';
import { ManifestProcessRequestSchema } from '../validators/index.js';
import type { ApiResponse, AdBreak, ManifestProcessResponse } from '../types/index.js';

const router = Router();

router.get('/:streamId/manifest', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const streamId = req.params.streamId ?? '';

    if (!streamId) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Stream ID is required' },
        meta: { requestId: req.headers['x-request-id'] as string ?? 'unknown', timestamp: new Date().toISOString() },
      };
      res.status(400).json(response);
      return;
    }

    const manifestUrl = await adInsertionService.getModifiedManifest(streamId);

    if (!manifestUrl) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'STREAM_NOT_FOUND',
          message: `Stream ${streamId} not found`,
        },
        meta: {
          requestId: req.headers['x-request-id'] as string ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<{ manifestUrl: string; streamId: string }> = {
      success: true,
      data: {
        manifestUrl,
        streamId,
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Error getting manifest:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get manifest',
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(500).json(response);
  }
});

router.post('/splice/:streamId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const streamId = req.params.streamId ?? '';
    const { spliceEventId, breakDuration, startTime, endTime, assets } = req.body;

    if (!spliceEventId || !breakDuration) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'spliceEventId and breakDuration are required',
        },
        meta: {
          requestId: req.headers['x-request-id'] as string ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
      return;
    }

    const adBreak = await adInsertionService.spliceInsert({
      streamId,
      spliceEventId,
      breakDuration,
      startTime,
      endTime,
      assets,
    });

    const response: ApiResponse<AdBreak> = {
      success: true,
      data: adBreak,
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error creating splice:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create splice',
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(500).json(response);
  }
});

router.get('/:streamId/break', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const streamId = req.params.streamId ?? '';
    const adBreakId = req.query.adBreakId as string | undefined;

    const adBreak = await adInsertionService.getAdBreak(streamId, adBreakId);

    if (!adBreak) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: adBreakId
            ? `Ad break ${adBreakId} not found`
            : `No ad breaks found for stream ${streamId}`,
        },
        meta: {
          requestId: req.headers['x-request-id'] as string ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<AdBreak | AdBreak[]> = {
      success: true,
      data: adBreak,
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Error getting ad break:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get ad break',
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(500).json(response);
  }
});

router.post('/:streamId/break/complete', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const streamId = req.params.streamId ?? '';
    const { adBreakId, completedAds, totalDuration, exitPosition } = req.body;

    if (!adBreakId || !completedAds || !totalDuration) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'adBreakId, completedAds, and totalDuration are required',
        },
        meta: {
          requestId: req.headers['x-request-id'] as string ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
      return;
    }

    const adBreak = await adInsertionService.completeAdBreak(streamId, {
      adBreakId,
      completedAds,
      totalDuration,
      exitPosition,
    });

    if (!adBreak) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Ad break ${adBreakId} not found`,
        },
        meta: {
          requestId: req.headers['x-request-id'] as string ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<AdBreak> = {
      success: true,
      data: adBreak,
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Error completing ad break:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to complete ad break',
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(500).json(response);
  }
});

router.get('/:streamId/slate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const streamId = req.params.streamId ?? '';

    const slateInfo = await adInsertionService.getSlateUrl(streamId);

    if (!slateInfo) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'STREAM_NOT_FOUND',
          message: `Stream ${streamId} not found`,
        },
        meta: {
          requestId: req.headers['x-request-id'] as string ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<{ slateUrl: string; duration: number }> = {
      success: true,
      data: slateInfo,
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Error getting slate:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get slate',
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(500).json(response);
  }
});

router.post('/:streamId/slate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const streamId = req.params.streamId ?? '';
    const { slateUrl } = req.body;

    if (!slateUrl) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'slateUrl is required',
        },
        meta: {
          requestId: req.headers['x-request-id'] as string ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
      return;
    }

    const success = await adInsertionService.setSlateUrl(streamId, slateUrl);

    if (!success) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'STREAM_NOT_FOUND',
          message: `Stream ${streamId} not found`,
        },
        meta: {
          requestId: req.headers['x-request-id'] as string ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<{ slateUrl: string }> = {
      success: true,
      data: { slateUrl },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Error setting slate:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to set slate',
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(500).json(response);
  }
});

router.post('/manifest/process', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validationResult = ManifestProcessRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validationResult.error.flatten().fieldErrors,
        },
        meta: {
          requestId: req.headers['x-request-id'] as string ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
      return;
    }

    const result = await adInsertionService.processManifest(validationResult.data);

    const response: ApiResponse<ManifestProcessResponse> = {
      success: true,
      data: result,
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error processing manifest:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to process manifest',
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(500).json(response);
  }
});

router.post('/:streamId/deactivate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const streamId = req.params.streamId ?? '';

    const success = await adInsertionService.deactivateStream(streamId);

    if (!success) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'STREAM_NOT_FOUND',
          message: `Stream ${streamId} not found`,
        },
        meta: {
          requestId: req.headers['x-request-id'] as string ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<{ streamId: string; status: string }> = {
      success: true,
      data: {
        streamId,
        status: 'inactive',
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Error deactivating stream:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to deactivate stream',
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(500).json(response);
  }
});

export default router;