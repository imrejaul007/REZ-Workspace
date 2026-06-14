import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { reviewsCore } from '../services/reviewsCore.js';
import { ReviewSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/reviews', (req, res) => {
  try {
    const review = ReviewSchema.parse(req.body);
    res.status(201).json({ success: true, data: reviewsCore.createReview(review) });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else res.status(500).json({ success: false, error: 'Failed to create review' });
  }
});

router.get('/reviews/:id', (req, res) => {
  const review = reviewsCore.getReview(req.params.id);
  review ? res.json({ success: true, data: review }) : res.status(404).json({ success: false, error: 'Not found' });
});

router.get('/reviews/entity/:type/:id', (req, res) => {
  const { type, id } = req.params;
  const { limit, offset, sort } = req.query;
  res.json({ success: true, data: reviewsCore.getEntityReviews(type, id, { limit: Number(limit), offset: Number(offset), sort: sort as unknown }) });
});

router.patch('/reviews/:id/helpful', (req, res) => {
  const success = reviewsCore.markHelpful(req.params.id);
  res.json({ success, message: success ? 'Marked helpful' : 'Review not found' });
});

router.post('/reviews/:id/replies', (req, res) => {
  const { userId, content } = req.body;
  const success = reviewsCore.addReply(req.params.id, userId, content);
  res.json({ success, message: success ? 'Reply added' : 'Review not found' });
});

router.delete('/reviews/:id', (req, res) => {
  const deleted = reviewsCore.deleteReview(req.params.id);
  res.json({ success: deleted });
});

export default router;
