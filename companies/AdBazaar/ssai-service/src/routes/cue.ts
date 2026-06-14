import { Router, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { scte35Service } from '../services/index.js';
import { SCTE35ProcessRequestSchema } from '../validators/index.js';
import { recordSCTE35Cue } from '../middleware/metrics.js';
import type { ApiResponse, SCTE35CueMessage } from '../types/index.js';

const router = Router();

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validationResult = SCTE35ProcessRequestSchema.safeParse(req.body);

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

    const cueMessage = await scte35Service.processCue(validationResult.data);

    recordSCTE35Cue(cueMessage.spliceEventType);

    const response: ApiResponse<SCTE35CueMessage> = {
      success: true,
      data: cueMessage,
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error processing SCTE-35 cue:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to process SCTE-35 cue',
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(500).json(response);
  }
});

router.get('/stream/:streamId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const streamId = req.params.streamId ?? '';
    const limit = Math.min(parseInt(req.query.limit as string ?? '100', 10), 1000);

    const cues = await scte35Service.getCueHistory(streamId, limit);

    const response: ApiResponse<SCTE35CueMessage[]> = {
      success: true,
      data: cues,
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Error getting cue history:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get cue history',
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(500).json(response);
  }
});

router.get('/:cueId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cueId = req.params.cueId ?? '';

    const cue = await scte35Service.getCueById(cueId);

    if (!cue) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `SCTE-35 cue ${cueId} not found`,
        },
        meta: {
          requestId: req.headers['x-request-id'] as string ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<SCTE35CueMessage> = {
      success: true,
      data: cue,
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Error getting SCTE-35 cue:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get SCTE-35 cue',
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(500).json(response);
  }
});

router.get('/segmentation-type/:typeId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const typeIdStr = req.params.typeId ?? '0';
    const typeId = parseInt(typeIdStr, 10);

    if (isNaN(typeId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid segmentation type ID',
        },
        meta: {
          requestId: req.headers['x-request-id'] as string ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
      return;
    }

    const typeName = scte35Service.getSegmentationTypeName(typeId);

    const response: ApiResponse<{ typeId: number; typeName: string }> = {
      success: true,
      data: {
        typeId,
        typeName,
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Error getting segmentation type:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get segmentation type',
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(500).json(response);
  }
});

router.post('/generate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { spliceEventId, breakDurationSeconds, spliceExecuteFlag } = req.body;

    if (!spliceEventId || !breakDurationSeconds) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'spliceEventId and breakDurationSeconds are required',
        },
        meta: {
          requestId: req.headers['x-request-id'] as string ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
      return;
    }

    const hexData = scte35Service.generateSCTE35SpliceInsert(
      spliceEventId,
      breakDurationSeconds,
      spliceExecuteFlag ?? true
    );

    const response: ApiResponse<{ hexData: string; spliceEventId: number; breakDuration: number }> = {
      success: true,
      data: {
        hexData,
        spliceEventId,
        breakDuration: breakDurationSeconds,
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Error generating SCTE-35 message:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate SCTE-35 message',
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