/**
 * Hospitality OS - Guests Routes
 */

const express = require('express');
const router = express.Router();

let guests = [
  { id: 'GUEST-001', name: 'Rahul Sharma', email: 'rahul@email.com', phone: '9876543210', loyaltyPoints: 2500, tier: 'gold', preferences: { roomType: 'deluxe' } },
  { id: 'GUEST-002', name: 'Priya Patel', email: 'priya@email.com', phone: '9876543211', loyaltyPoints: 1200, tier: 'silver', preferences: { roomType: 'suite' } }
];

// GET /api/guests
router.get('/', (req, res) => {
  const { tier } = req.query;
  let filtered = [...guests];
  if (tier) filtered = filtered.filter(g => g.tier === tier);
  res.json({ guests: filtered, count: filtered.length });
});

// GET /api/guests/:id
router.get('/:id', (req, res) => {
  const guest = guests.find(g => g.id === req.params.id);
  if (!guest) return res.status(404).json({ error: 'Guest not found' });
  res.json(guest);
});

// POST /api/guests
router.post('/', (req, res) => {
  const { name, email, phone, preferences } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  const newGuest = { id: `GUEST-${Date.now()}`, name, email: email || null, phone: phone || null, loyaltyPoints: 0, tier: 'bronze', preferences: preferences || {} };
  guests.push(newGuest);
  res.status(201).json(newGuest);
});

// PUT /api/guests/:id
router.put('/:id', (req, res) => {
  const index = guests.findIndex(g => g.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Guest not found' });
  guests[index] = { ...guests[index], ...req.body };
  res.json(guests[index]);
});

// POST /api/guests/:id/points
router.post('/:id/points', (req, res) => {
  const guest = guests.find(g => g.id === req.params.id);
  if (!guest) return res.status(404).json({ error: 'Guest not found' });
  guest.loyaltyPoints += req.body.points || 0;
  res.json(guest);
});

module.exports = router;