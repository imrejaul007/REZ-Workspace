const express = require('express');
const router = express.Router();

let bookings = [
  { id: '1', customerId: '1', providerId: '1', serviceId: '1', date: '2024-06-15', status: 'confirmed', price: 75 },
  { id: '2', customerId: '2', providerId: '3', serviceId: '3', date: '2024-06-16', status: 'pending', price: 55 },
  { id: '3', customerId: '3', providerId: '4', serviceId: '4', date: '2024-06-17', status: 'confirmed', price: 120 },
  { id: '4', customerId: '4', providerId: '2', serviceId: '2', date: '2024-06-18', status: 'completed', price: 80 }
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
    customerId: req.body.customerId,
    providerId: req.body.providerId,
    serviceId: req.body.serviceId,
    date: req.body.date,
    status: req.body.status || 'pending',
    price: req.body.price
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