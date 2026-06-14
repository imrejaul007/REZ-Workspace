import { Router, Request, Response, NextFunction } from 'express';
import { localizationService } from '../services/localizationService';
import { authMiddleware, validateBody, createLocalizationSchema, updateLocalizationSchema, translateSchema } from '../middleware/auth';
import { logger } from 'utils/logger.js';

const router = Router();
router.use(authMiddleware);

// Create localization
router.post('/', validateBody(createLocalizationSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const localization = await localizationService.create(req.body);
    res.status(201).json({ success: true, data: localization });
  } catch (error) {
    next(error);
  }
});

// Get all localizations
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sourceLocale = req.query.sourceLocale as string;
    const targetLocale = req.query.targetLocale as string;
    const localizations = await localizationService.findByLocale(sourceLocale, targetLocale);
    res.json({ success: true, data: localizations });
  } catch (error) {
    next(error);
  }
});

// Get localization by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const localization = await localizationService.findById(req.params.id);
    if (!localization) return res.status(404).json({ success: false, error: 'Localization not found' });
    res.json({ success: true, data: localization });
  } catch (error) {
    next(error);
  }
});

// Update localization
router.put('/:id', validateBody(updateLocalizationSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const localization = await localizationService.update(req.params.id, req.body);
    if (!localization) return res.status(404).json({ success: false, error: 'Localization not found' });
    logger.info('Localization updated via API', { localizationId: req.params.id });
    res.json({ success: true, data: localization });
  } catch (error) {
    next(error);
  }
});

// Translate content
router.post('/:id/translate', validateBody(translateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const localization = await localizationService.translate(req.params.id, req.body);
    if (!localization) return res.status(404).json({ success: false, error: 'Localization not found' });
    logger.info('Translations added via API', { localizationId: req.params.id });
    res.json({ success: true, data: localization });
  } catch (error) {
    next(error);
  }
});

// Get localization versions
router.get('/:id/versions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const versions = await localizationService.getVersions(req.params.id);
    res.json({ success: true, data: versions });
  } catch (error) {
    next(error);
  }
});

// Create version
router.post('/:id/versions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { createdBy, changes } = req.body;
    const version = await localizationService.createVersion(req.params.id, createdBy, changes);
    if (!version) return res.status(404).json({ success: false, error: 'Localization not found' });
    res.status(201).json({ success: true, data: version });
  } catch (error) {
    next(error);
  }
});

// Get localizations by content ID
router.get('/content/:contentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const localizations = await localizationService.findByContentId(req.params.contentId);
    res.json({ success: true, data: localizations });
  } catch (error) {
    next(error);
  }
});

// Get locales
router.get('/locales/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locales = await localizationService.getLocales();
    res.json({ success: true, data: locales });
  } catch (error) {
    next(error);
  }
});

// Create locale
router.post('/locales', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locale = await localizationService.createLocale(req.body);
    res.status(201).json({ success: true, data: locale });
  } catch (error) {
    next(error);
  }
});

export const localizationRoutes = router;