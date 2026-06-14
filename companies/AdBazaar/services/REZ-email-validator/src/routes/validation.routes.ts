import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validatorService } from '../services/validator.service';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('ValidationRoutes');

// Validation schemas
const ValidateEmailSchema = z.object({
  email: z.string().email(),
  options: z.object({
    checkMX: z.boolean().optional(),
    checkSMTP: z.boolean().optional(),
    checkDisposable: z.boolean().optional(),
  }).optional(),
});

const BulkValidateSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(100),
  options: z.object({
    checkMX: z.boolean().optional(),
    checkSMTP: z.boolean().optional(),
    checkDisposable: z.boolean().optional(),
  }).optional(),
});

// Single email validation
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, options } = ValidateEmailSchema.parse(req.body);

    const result = await validatorService.validate(email, options || {});

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
});

// Bulk email validation
router.post('/validate/bulk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emails, options } = BulkValidateSchema.parse(req.body);

    const result = await validatorService.validateBulk(emails, options || {});

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
});

// Check if email is disposable
router.get('/disposable/:email', (req: Request, res: Response) => {
  const { email } = req.params;

  try {
    const result = validatorService.validate(email, {
      checkMX: false,
      checkSMTP: false,
      checkDisposable: true,
    }).then((validation) => ({
      isDisposable: validation.disposable?.isDisposable || false,
      provider: validation.disposable?.provider,
      email,
    }));

    result.then((data) => {
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    logger.error('Disposable check failed', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check disposable status',
      timestamp: new Date().toISOString(),
    });
  }
});

// Get cache statistics
router.get('/cache/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      size: validatorService.getCacheSize(),
    },
    timestamp: new Date().toISOString(),
  });
});

// Clear cache
router.delete('/cache', (req: Request, res: Response) => {
  validatorService.clearCache();
  res.json({
    success: true,
    message: 'Cache cleared',
    timestamp: new Date().toISOString(),
  });
});

export default router;
