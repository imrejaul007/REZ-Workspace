const express = require('express');
const router = express.Router();

let bookings = [
  { id: '1', packageId: '1', travelers: 2, date: '2024-07-15', status: 'confirmed', totalPrice: 5000 },
  { id: '2', packageId: '2', travelers: 2, date: '2024-08-01', status: 'confirmed', totalPrice: 6400 },
  { id: '3', packageId: '3', travelers: 4, date: '2024-09-10', status: 'pending', totalPrice: 18000 },
  { id: '4', packageId: '4', travelers: 2, date: '2024-07-20', status: 'confirmed', totalPrice: 13000 }
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
    packageId: req.body.packageId,
    travelers: req.body.travelers,
    date: req.body.date,
    status: req.body.status || 'pending',
    totalPrice: req.body.totalPrice
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