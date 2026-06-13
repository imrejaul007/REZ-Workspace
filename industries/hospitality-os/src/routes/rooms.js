/**
 * Hospitality OS - Rooms Routes
 */

const express = require('express');
const router = express.Router();

let rooms = [
  { id: 'ROOM-101', type: 'deluxe', status: 'occupied', guest: 'Rahul Sharma', checkIn: '2024-01-15', checkOut: '2024-01-18', price: 5000, floor: 1 },
  { id: 'ROOM-102', type: 'standard', status: 'available', price: 3500, floor: 1 },
  { id: 'ROOM-201', type: 'suite', status: 'occupied', guest: 'Priya Patel', checkIn: '2024-01-14', checkOut: '2024-01-20', price: 8500, floor: 2 },
  { id: 'ROOM-202', type: 'deluxe', status: 'available', price: 5000, floor: 2 }
];

// GET /api/rooms
router.get('/', (req, res) => {
  const { type, status, floor } = req.query;
  let filtered = [...rooms];
  if (type) filtered = filtered.filter(r => r.type === type);
  if (status) filtered = filtered.filter(r => r.status === status);
  if (floor) filtered = filtered.filter(r => r.floor === parseInt(floor));
  res.json({ rooms: filtered, count: filtered.length });
});

// GET /api/rooms/:id
router.get('/:id', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

// POST /api/rooms
router.post('/', (req, res) => {
  const { type, price, floor } = req.body;
  if (!type || !price) return res.status(400).json({ error: 'type and price required' });

  const newRoom = { id: `ROOM-${Date.now()}`, type, status: 'available', price, floor: floor || 1 };
  rooms.push(newRoom);
  res.status(201).json(newRoom);
});

// PUT /api/rooms/:id
router.put('/:id', (req, res) => {
  const index = rooms.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Room not found' });
  rooms[index] = { ...rooms[index], ...req.body };
  res.json(rooms[index]);
});

// PATCH /api/rooms/:id/status
router.patch('/:id/status', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  room.status = req.body.status;
  res.json(room);
});

// PATCH /api/rooms/:id/checkin
router.patch('/:id/checkin', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  room.status = 'occupied';
  room.guest = req.body.guest;
  room.checkIn = req.body.checkIn;
  room.checkOut = req.body.checkOut;
  res.json(room);
});

// PATCH /api/rooms/:id/checkout
router.patch('/:id/checkout', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  room.status = 'available';
  room.guest = null;
  room.checkIn = null;
  room.checkOut = null;
  res.json(room);
});

module.exports = router;