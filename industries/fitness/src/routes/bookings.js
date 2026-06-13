const express = require('express');
const router = express.Router();

let bookings = [
  { id: '1', memberId: 'M001', classId: '1', date: '2024-06-10', time: '9AM', status: 'confirmed' },
  { id: '2', memberId: 'M002', classId: '2', date: '2024-06-11', time: '6PM', status: 'confirmed' },
  { id: '3', memberId: 'M003', classId: '3', date: '2024-06-12', time: '7AM', status: 'pending' }
];

// GET all bookings
router.get('/', (req, res) => {
  res.json(bookings);
});

// GET single booking
router.get('/:id', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(booking);
});

// POST new booking
router.post('/', (req, res) => {
  const newBooking = {
    id: String(bookings.length + 1),
    memberId: req.body.memberId,
    classId: req.body.classId,
    date: req.body.date,
    time: req.body.time,
    status: req.body.status || 'pending'
  };
  bookings.push(newBooking);
  res.status(201).json(newBooking);
});

// PUT update booking
router.put('/:id', (req, res) => {
  const index = bookings.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Booking not found' });
  bookings[index] = { ...bookings[index], ...req.body };
  res.json(bookings[index]);
});

// DELETE booking
router.delete('/:id', (req, res) => {
  const index = bookings.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Booking not found' });
  bookings.splice(index, 1);
  res.json({ message: 'Booking deleted successfully' });
});

module.exports = router;
