import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { reviewsService } from '../services/reviewsService.js';
import { ReviewSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/reviews', (req, res) => {
  try {
    const review = ReviewSchema.parse(req.body);
    const created = reviewsService.createReview(review);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else res.status(500).json({ success: false, error: 'Failed to create review' });
  }
});

router.get('/reviews/:id', (req, res) => {
  const review = reviewsService.getReview(req.params.id);
  review ? res.json({ success: true, data: review }) : res.status(404).json({ success: false, error: 'Not found' });
});

router.get('/products/:productId/reviews', (req, res) => {
  const { limit, offset, rating, sort } = req.query;
  const result = reviewsService.getProductReviews(req.params.productId, {
    limit: Number(limit),
    offset: Number(offset),
    rating: rating ? Number(rating) : undefined,
    sort: sort as any
  });
  res.json({ success: true, data: result });
});

router.patch('/reviews/:id', (req, res) => {
  const review = reviewsService.updateReview(req.params.id, req.body);
  review ? res.json({ success: true, data: review }) : res.status(404).json({ success: false, error: 'Not found' });
});

router.delete('/reviews/:id', (req, res) => {
  const deleted = reviewsService.deleteReview(req.params.id);
  res.json({ success: deleted });
});

router.post('/reviews/:id/helpful', (req, res) => {
  const review = reviewsService.markHelpful(req.params.id);
  review ? res.json({ success: true, data: review }) : res.status(404).json({ success: false, error: 'Not found' });
});

router.post('/reviews/:id/not-helpful', (req, res) => {
  const review = reviewsService.markNotHelpful(req.params.id);
  review ? res.json({ success: true, data: review }) : res.status(404).json({ success: false, error: 'Not found' });
});

router.post('/reviews/:id/replies', (req, res) => {
  const { authorName, content } = req.body;
  const review = reviewsService.addReply(req.params.id, authorName, content);
  review ? res.json({ success: true, data: review }) : res.status(404).json({ success: false, error: 'Not found' });
});

router.patch('/reviews/:id/moderate', (req, res) => {
  const { status } = req.body;
  const review = reviewsService.moderateReview(req.params.id, status);
  review ? res.json({ success: true, data: review }) : res.status(404).json({ success: false, error: 'Not found' });
});

router.get('/stats', (req, res) => {
  const { productId } = req.query;
  res.json({ success: true, data: reviewsService.getStats(productId as string) });
});

export default router;
