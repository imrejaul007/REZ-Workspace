/**
 * Hospitality OS - Bookings Routes
 */

const express = require('express');
const router = express.Router();

let bookings = [
  { id: 'BOOK-001', guestId: 'GUEST-001', roomId: 'ROOM-101', checkIn: '2024-01-15', checkOut: '2024-01-18', status: 'confirmed', total: 15000, createdAt: '2024-01-10T10:00:00Z' }
];

// GET /api/bookings
router.get('/', (req, res) => {
  const { guestId, roomId, status } = req.query;
  let filtered = [...bookings];
  if (guestId) filtered = filtered.filter(b => b.guestId === guestId);
  if (roomId) filtered = filtered.filter(b => b.roomId === roomId);
  if (status) filtered = filtered.filter(b => b.status === status);
  res.json({ bookings: filtered, count: filtered.length });
});

// GET /api/bookings/:id
router.get('/:id', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(booking);
});

// POST /api/bookings
router.post('/', (req, res) => {
  const { guestId, roomId, checkIn, checkOut, total } = req.body;
  if (!guestId || !roomId || !checkIn || !checkOut) return res.status(400).json({ error: 'guestId, roomId, checkIn, checkOut required' });

  const newBooking = { id: `BOOK-${Date.now()}`, guestId, roomId, checkIn, checkOut, status: 'confirmed', total: total || 0, createdAt: new Date().toISOString() };
  bookings.push(newBooking);
  res.status(201).json(newBooking);
});

// PUT /api/bookings/:id
router.put('/:id', (req, res) => {
  const index = bookings.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Booking not found' });
  bookings[index] = { ...bookings[index], ...req.body };
  res.json(bookings[index]);
});

// PATCH /api/bookings/:id/status
router.patch('/:id/status', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  booking.status = req.body.status;
  res.json(booking);
});

// DELETE /api/bookings/:id
router.delete('/:id', (req, res) => {
  const index = bookings.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Booking not found' });
  bookings.splice(index, 1);
  res.json({ message: 'Booking cancelled' });
});

module.exports = router;