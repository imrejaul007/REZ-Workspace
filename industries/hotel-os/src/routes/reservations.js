/**
 * Hotel OS - Reservations Routes
 */

const express = require('express');
const router = express.Router();

let reservations = [
  { id: 'RES-001', guestId: 'GUEST-001', roomId: 'ROOM-101', checkIn: '2024-01-15', checkOut: '2024-01-18', status: 'confirmed', guests: 2, total: 15000, createdAt: '2024-01-10' },
  { id: 'RES-002', guestId: 'GUEST-002', roomId: 'ROOM-201', checkIn: '2024-01-14', checkOut: '2024-01-20', status: 'checked-in', guests: 1, total: 51000, createdAt: '2024-01-08' }
];

router.get('/', (req, res) => {
  const { guestId, roomId, status } = req.query;
  let filtered = [...reservations];
  if (guestId) filtered = filtered.filter(r => r.guestId === guestId);
  if (roomId) filtered = filtered.filter(r => r.roomId === roomId);
  if (status) filtered = filtered.filter(r => r.status === status);
  res.json({ reservations: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const reservation = reservations.find(r => r.id === req.params.id);
  if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
  res.json(reservation);
});

router.post('/', (req, res) => {
  const { guestId, roomId, checkIn, checkOut, guests } = req.body;
  if (!guestId || !roomId || !checkIn || !checkOut) return res.status(400).json({ error: 'guestId, roomId, checkIn, checkOut required' });
  const newReservation = { id: `RES-${Date.now()}`, guestId, roomId, checkIn, checkOut, guests: guests || 1, status: 'confirmed', total: 0, createdAt: new Date().toISOString() };
  reservations.push(newReservation);
  res.status(201).json(newReservation);
});

router.put('/:id', (req, res) => {
  const index = reservations.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Reservation not found' });
  reservations[index] = { ...reservations[index], ...req.body };
  res.json(reservations[index]);
});

router.patch('/:id/status', (req, res) => {
  const reservation = reservations.find(r => r.id === req.params.id);
  if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
  reservation.status = req.body.status;
  res.json(reservation);
});

router.delete('/:id', (req, res) => {
  const index = reservations.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Reservation not found' });
  reservations.splice(index, 1);
  res.json({ message: 'Reservation cancelled' });
});

module.exports = router;
