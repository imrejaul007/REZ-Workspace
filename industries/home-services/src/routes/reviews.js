const express = require('express');
const router = express.Router();

let reviews = [
  { id: '1', bookingId: '1', providerId: '1', customerId: '1', rating: 5, comment: 'Excellent plumbing work, very professional', date: '2024-06-15' },
  { id: '2', bookingId: '2', providerId: '3', customerId: '2', rating: 4, comment: 'Good cleaning, took a bit longer than expected', date: '2024-06-16' },
  { id: '3', bookingId: '3', providerId: '4', customerId: '3', rating: 5, comment: 'AC works perfectly now, great service', date: '2024-06-17' }
];

// GET all reviews
router.get('/', (req, res) => {
  res.json(reviews);
});

// GET single review
router.get('/:id', (req, res) => {
  const review = reviews.find(r => r.id === req.params.id);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  res.json(review);
});

// POST new review
router.post('/', (req, res) => {
  const newReview = {
    id: String(reviews.length + 1),
    bookingId: req.body.bookingId,
    providerId: req.body.providerId,
    customerId: req.body.customerId,
    rating: req.body.rating,
    comment: req.body.comment,
    date: new Date().toISOString().split('T')[0]
  };
  reviews.push(newReview);
  res.status(201).json(newReview);
});

// PUT update review
router.put('/:id', (req, res) => {
  const index = reviews.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Review not found' });
  reviews[index] = { ...reviews[index], ...req.body };
  res.json(reviews[index]);
});

// DELETE review
router.delete('/:id', (req, res) => {
  const index = reviews.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Review not found' });
  reviews.splice(index, 1);
  res.json({ message: 'Review deleted successfully' });
});

module.exports = router;