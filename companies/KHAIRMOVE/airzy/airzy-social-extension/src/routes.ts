/**
 * Traveler Social Routes
 * API endpoints for community features
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  Review,
  ItineraryShare,
  Tip,
  Comment,
  DESTINATIONS,
  REVIEW_TAGS,
} from './types';

const router = Router();

// In-memory stores
const reviews = new Map<string, Review>();
const itineraries = new Map<string, ItineraryShare>();
const tips = new Map<string, Tip>();
const comments = new Map<string, Comment>();

/**
 * Health check
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'airzy-social-extension' });
});

/**
 * Get popular destinations
 */
router.get('/destinations', (_req: Request, res: Response) => {
  res.json({ destinations: DESTINATIONS });
});

/**
 * Get review tags
 */
router.get('/tags', (_req: Request, res: Response) => {
  res.json({ tags: REVIEW_TAGS });
});

// ===== REVIEWS =====

/**
 * Get reviews
 */
router.get('/reviews', (req: Request, res: Response) => {
  const { type, entityId, destination, sort } = req.query;

  let allReviews = Array.from(reviews.values());

  // Filter
  if (type) {
    allReviews = allReviews.filter(r => r.type === type);
  }
  if (entityId) {
    allReviews = allReviews.filter(r => r.entityId === entityId);
  }
  if (destination) {
    allReviews = allReviews.filter(r =>
      r.entityLocation?.toLowerCase().includes((destination as string).toLowerCase())
    );
  }

  // Sort
  if (sort === 'helpful') {
    allReviews.sort((a, b) => b.helpful - a.helpful);
  } else if (sort === 'rating') {
    allReviews.sort((a, b) => b.rating - a.rating);
  } else {
    allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({ reviews: allReviews.slice(0, 20) });
});

/**
 * Get single review
 */
router.get('/reviews/:id', (req: Request, res: Response) => {
  const review = reviews.get(req.params.id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }
  res.json({ review });
});

/**
 * Create review
 */
router.post('/reviews', (req: Request, res: Response) => {
  const { type, entityId, entityName, rating, title, content } = req.body;

  if (!type || !entityId || !rating || !title) {
    return res.status(400).json({ error: 'type, entityId, rating, and title are required' });
  }

  const review: Review = {
    id: uuidv4(),
    type,
    entityId,
    entityName,
    entityLocation: req.body.entityLocation,
    userId: req.body.userId || 'anonymous',
    userName: req.body.userName || 'Traveler',
    userAvatar: req.body.userAvatar,
    rating,
    title,
    content: content || '',
    photos: req.body.photos,
    tags: req.body.tags,
    helpful: 0,
    notHelpful: 0,
    verified: req.body.verified,
    createdAt: new Date().toISOString(),
  };

  reviews.set(review.id, review);

  res.status(201).json({ review });
});

/**
 * Mark review as helpful
 */
router.post('/reviews/:id/helpful', (req: Request, res: Response) => {
  const review = reviews.get(req.params.id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }
  review.helpful++;
  reviews.set(review.id, review);
  res.json({ review });
});

// ===== ITINERARIES =====

/**
 * Get itineraries
 */
router.get('/itineraries', (req: Request, res: Response) => {
  const { destination, type, sort } = req.query;

  let allItineraries = Array.from(itineraries.values());

  if (destination) {
    allItineraries = allItineraries.filter(i =>
      i.destination.toLowerCase().includes((destination as string).toLowerCase())
    );
  }
  if (type) {
    allItineraries = allItineraries.filter(i => i.type === type);
  }

  if (sort === 'likes') {
    allItineraries.sort((a, b) => b.likes - a.likes);
  } else if (sort === 'views') {
    allItineraries.sort((a, b) => b.views - a.views);
  } else {
    allItineraries.sort((a, b) => b.saved - a.saved);
  }

  res.json({ itineraries: allItineraries.slice(0, 20) });
});

/**
 * Create itinerary
 */
router.post('/itineraries', (req: Request, res: Response) => {
  const { userId, title, destination, days } = req.body;

  if (!userId || !title || !destination) {
    return res.status(400).json({ error: 'userId, title, and destination are required' });
  }

  const itinerary: ItineraryShare = {
    id: uuidv4(),
    userId,
    userName: req.body.userName || 'Traveler',
    userAvatar: req.body.userAvatar,
    title,
    description: req.body.description,
    destination,
    duration: days?.length || 1,
    budget: req.body.budget,
    season: req.body.season || 'any',
    type: req.body.type || 'solo',
    days: days || [],
    likes: 0,
    views: 0,
    saved: 0,
    comments: 0,
    tags: req.body.tags,
    createdAt: new Date().toISOString(),
  };

  itineraries.set(itinerary.id, itinerary);

  res.status(201).json({ itinerary });
});

/**
 * Get single itinerary
 */
router.get('/itineraries/:id', (req: Request, res: Response) => {
  const itinerary = itineraries.get(req.params.id);
  if (!itinerary) {
    return res.status(404).json({ error: 'Itinerary not found' });
  }
  itinerary.views++;
  itineraries.set(itinerary.id, itinerary);
  res.json({ itinerary });
});

/**
 * Like itinerary
 */
router.post('/itineraries/:id/like', (req: Request, res: Response) => {
  const itinerary = itineraries.get(req.params.id);
  if (!itinerary) {
    return res.status(404).json({ error: 'Itinerary not found' });
  }
  itinerary.likes++;
  itineraries.set(itinerary.id, itinerary);
  res.json({ itinerary });
});

/**
 * Save itinerary
 */
router.post('/itineraries/:id/save', (req: Request, res: Response) => {
  const itinerary = itineraries.get(req.params.id);
  if (!itinerary) {
    return res.status(404).json({ error: 'Itinerary not found' });
  }
  itinerary.saved++;
  itineraries.set(itinerary.id, itinerary);
  res.json({ itinerary });
});

// ===== TIPS =====

/**
 * Get tips
 */
router.get('/tips', (req: Request, res: Response) => {
  const { destination, category } = req.query;

  let allTips = Array.from(tips.values());

  if (destination) {
    allTips = allTips.filter(t =>
      t.destination.toLowerCase().includes((destination as string).toLowerCase())
    );
  }
  if (category) {
    allTips = allTips.filter(t => t.category === category);
  }

  allTips.sort((a, b) => b.helpful - a.helpful);

  res.json({ tips: allTips.slice(0, 20) });
});

/**
 * Create tip
 */
router.post('/tips', (req: Request, res: Response) => {
  const { userId, category, destination, title, content } = req.body;

  if (!userId || !destination || !title) {
    return res.status(400).json({ error: 'userId, destination, and title are required' });
  }

  const tip: Tip = {
    id: uuidv4(),
    userId,
    userName: req.body.userName || 'Traveler',
    category: category || 'general',
    destination,
    title,
    content: content || '',
    helpful: 0,
    tags: req.body.tags,
    createdAt: new Date().toISOString(),
  };

  tips.set(tip.id, tip);

  res.status(201).json({ tip });
});

// ===== COMMENTS =====

/**
 * Get comments
 */
router.get('/comments', (req: Request, res: Response) => {
  const { targetType, targetId } = req.query;

  let allComments = Array.from(comments.values());

  if (targetType) {
    allComments = allComments.filter(c => c.targetType === targetType);
  }
  if (targetId) {
    allComments = allComments.filter(c => c.targetId === targetId);
  }

  allComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  res.json({ comments: allComments });
});

/**
 * Create comment
 */
router.post('/comments', (req: Request, res: Response) => {
  const { targetType, targetId, userId, content } = req.body;

  if (!targetType || !targetId || !userId || !content) {
    return res.status(400).json({ error: 'targetType, targetId, userId, and content are required' });
  }

  const comment: Comment = {
    id: uuidv4(),
    targetType,
    targetId,
    userId,
    userName: req.body.userName || 'Traveler',
    userAvatar: req.body.userAvatar,
    content,
    likes: 0,
    createdAt: new Date().toISOString(),
  };

  comments.set(comment.id, comment);

  res.status(201).json({ comment });
});

/**
 * Like comment
 */
router.post('/comments/:id/like', (req: Request, res: Response) => {
  const comment = comments.get(req.params.id);
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  comment.likes++;
  comments.set(comment.id, comment);
  res.json({ comment });
});

// ===== STATS =====

/**
 * Get stats
 */
router.get('/stats', (_req: Request, res: Response) => {
  res.json({
    reviews: reviews.size,
    itineraries: itineraries.size,
    tips: tips.size,
    comments: comments.size,
  });
});

export default router;
