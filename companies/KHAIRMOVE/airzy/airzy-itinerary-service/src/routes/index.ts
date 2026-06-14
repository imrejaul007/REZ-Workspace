import { Router, Request, Response } from 'express';
import { param, body, validationResult } from 'express-validator';
import { itineraryService } from '../services/itineraryService';
import { asyncHandler } from '../utils/errors';

const router = Router();

const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: errors.array() } });
  next();
};

// Create itinerary
router.post('/',
  [body('title').notEmpty(), body('startDate').matches(/^\d{4}-\d{2}-\d{2}$/), body('endDate').matches(/^\d{4}-\d{2}-\d{2}$/)],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub || 'guest';
    const itinerary = await itineraryService.createItinerary(userId, req.body.title, req.body.startDate, req.body.endDate, req.body.description);
    res.status(201).json({ success: true, data: itinerary, meta: { requestId: req.requestId, timestamp: Date.now() } });
  })
);

// Get user itineraries
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
  const result = await itineraryService.getUserItineraries(userId, { page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 20, status: req.query.status as string });
  res.json({ success: true, data: result.itineraries, meta: { requestId: req.requestId, timestamp: Date.now(), total: result.total } });
}));

// Get itinerary by ID
router.get('/:id', [param('id').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const itinerary = await itineraryService.getItineraryById(req.params.id, req.user?.sub);
  if (!itinerary) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: itinerary, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

// Add item to itinerary
router.post('/:id/items', [param('id').notEmpty(), body('type').isIn(['flight', 'hotel', 'transfer', 'lounge', 'activity', 'restaurant']), body('title').notEmpty(), body('date').matches(/^\d{4}-\d{2}-\d{2}$/)],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const itinerary = await itineraryService.addItem(req.params.id, req.body);
    if (!itinerary) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    res.status(201).json({ success: true, data: itinerary, meta: { requestId: req.requestId, timestamp: Date.now() } });
  })
);

// Update item
router.put('/:id/items/:itemId', [param('id').notEmpty(), param('itemId').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const itinerary = await itineraryService.updateItem(req.params.id, req.params.itemId, req.body);
  if (!itinerary) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: itinerary, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

// Remove item
router.delete('/:id/items/:itemId', [param('id').notEmpty(), param('itemId').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const itinerary = await itineraryService.removeItem(req.params.id, req.params.itemId);
  if (!itinerary) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: itinerary, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

// Share itinerary
router.post('/:id/share', [param('id').notEmpty(), body('emails').isArray()], validate, asyncHandler(async (req: Request, res: Response) => {
  const itinerary = await itineraryService.shareItinerary(req.params.id, req.body.emails);
  if (!itinerary) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: itinerary, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

// Add reminder
router.post('/:id/reminders', [param('id').notEmpty(), body('date').matches(/^\d{4}-\d{2}-\d{2}$/), body('message').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const itinerary = await itineraryService.addReminder(req.params.id, req.body.date, req.body.message);
  if (!itinerary) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.status(201).json({ success: true, data: itinerary, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

// Delete itinerary
router.delete('/:id', [param('id').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub || '';
  const deleted = await itineraryService.deleteItinerary(req.params.id, userId);
  if (!deleted) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, message: 'Itinerary deleted', meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

export default router;