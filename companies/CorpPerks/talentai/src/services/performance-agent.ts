/**
 * Performance AI Agent - Port 4018
 * Reviews, ratings, career development
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Store reviews
const reviews: Map<string, any> = new Map();
const reviewCycles: Map<string, any> = new Map();

// Sample cycles
reviewCycles.set('q1_2026', {
  id: 'q1_2026',
  name: 'Q1 2026',
  startDate: '2026-01-01',
  endDate: '2026-03-31',
  status: 'active',
  completionRate: 67,
});

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', agent: 'performance', port: 4018 }));

// Get review cycles
app.get('/cycles', (_, res) => {
  res.json({ cycles: Array.from(reviewCycles.values()) });
});

// Create review
app.post('/review', (req, res) => {
  const { employeeId, managerId, cycleId, type } = req.body;

  const reviewId = `rev_${Date.now()}`;
  const review = {
    id: reviewId,
    employeeId,
    managerId,
    cycleId: cycleId || 'q1_2026',
    type: type || 'annual', // annual, mid-year, probation, project
    status: 'pending', // pending, self_review, manager_review, completed
    ratings: {},
    comments: {},
    overallRating: null,
    createdAt: new Date(),
    dueDate: '2026-03-15',
  };

  reviews.set(reviewId, review);

  res.json({ review });
});

// Submit self review
app.post('/review/:id/self', (req, res) => {
  const review = reviews.get(req.params.id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const { ratings, comments, accomplishments, challenges } = req.body;

  review.selfReview = {
    ratings,
    comments,
    accomplishments,
    challenges,
    submittedAt: new Date(),
  };
  review.status = review.managerId ? 'manager_review' : 'completed';

  res.json({ review });
});

// Submit manager review
app.post('/review/:id/manager', (req, res) => {
  const review = reviews.get(req.params.id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const { ratings, comments, overallRating, recommendation } = req.body;

  review.managerReview = {
    ratings,
    comments,
    overallRating,
    recommendation,
    submittedAt: new Date(),
  };

  // Calculate overall rating
  review.overallRating = overallRating || calculateOverallRating(ratings);
  review.status = 'completed';

  res.json({ review });
});

// Get review
app.get('/review/:id', (req, res) => {
  const review = reviews.get(req.params.id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }
  res.json({ review });
});

// Get employee reviews
app.get('/reviews/employee/:employeeId', (req, res) => {
  const employeeReviews = Array.from(reviews.values())
    .filter(r => r.employeeId === req.params.employeeId);

  res.json({ reviews: employeeReviews });
});

// AI rating suggestions
app.post('/suggest/ratings', (req, res) => {
  const { employeeId, competencies } = req.body;

  // Simulated AI suggestions
  const suggestions = {
    technical: 4.2,
    communication: 3.8,
    teamwork: 4.5,
    leadership: 3.5,
    problemSolving: 4.0,
    initiative: 4.3,
  };

  res.json({
    suggestions,
    basedOn: ['Peer feedback', 'Project outcomes', 'Goal achievements'],
    confidence: 85,
  });
});

// Promotion prediction
app.post('/predict/promotion', (req, res) => {
  const { employeeId } = req.body;

  // Simulated prediction
  const score = 72;
  const factors = [
    { name: 'Performance History', contribution: '+15%', positive: true },
    { name: 'Tenure', contribution: '+10%', positive: true },
    { name: 'Leadership Potential', contribution: '+8%', positive: true },
    { name: 'Skill Gap', contribution: '-5%', positive: false },
    { name: 'Company Growth', contribution: '+12%', positive: true },
  ];

  res.json({
    employeeId,
    promotionLikelihood: score,
    tier: score >= 80 ? 'highly_likely' : score >= 60 ? 'likely' : score >= 40 ? 'possible' : 'unlikely',
    factors,
    timeline: score >= 70 ? 'Within 6 months' : '12-18 months',
    recommendations: [
      'Take on leadership responsibilities',
      'Complete advanced certification',
      'Mentor junior team members',
    ],
  });
});

// Compensation adjustment
app.post('/suggest/compensation', (req, res) => {
  const { employeeId, currentCtc, rating, marketData } = req.body;

  const ratingMultiplier = {
    5: 1.25,
    4.5: 1.15,
    4: 1.10,
    3.5: 1.05,
    3: 1.0,
    below: 0.95,
  };

  const baseMultiplier = rating >= 5 ? ratingMultiplier[5] :
    rating >= 4.5 ? ratingMultiplier[4.5] :
      rating >= 4 ? ratingMultiplier[4] :
        rating >= 3.5 ? ratingMultiplier[3.5] :
          rating >= 3 ? ratingMultiplier[3] : ratingMultiplier.below;

  const suggestedCtc = Math.round(currentCtc * baseMultiplier);
  const increment = suggestedCtc - currentCtc;
  const incrementPercent = Math.round((increment / currentCtc) * 100);

  res.json({
    employeeId,
    currentCtc,
    suggestedCtc,
    increment,
    incrementPercent,
    effectiveDate: 'April 1, 2026',
    justification: `Based on ${rating} rating and market benchmarks`,
  });
});

// Helper function
function calculateOverallRating(ratings: Record<string, number>): number {
  const values = Object.values(ratings);
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

const PORT = 4018;
app.listen(PORT, () => logger.info(`Performance Agent running on port ${PORT}`));
