/**
 * Hotel OS - Rooms Routes
 */

const express = require('express');
const router = express.Router();

let rooms = [
  { id: 'ROOM-101', number: '101', type: 'deluxe', floor: 1, status: 'occupied', guest: 'John Doe', checkIn: '2024-01-15', checkOut: '2024-01-18', price: 5000 },
  { id: 'ROOM-102', number: '102', type: 'standard', floor: 1, status: 'available', price: 3500 },
  { id: 'ROOM-201', number: '201', type: 'suite', floor: 2, status: 'occupied', guest: 'Jane Smith', checkIn: '2024-01-14', checkOut: '2024-01-20', price: 8500 },
  { id: 'ROOM-202', number: '202', type: 'deluxe', floor: 2, status: 'maintenance', price: 5000 }
];

router.get('/', (req, res) => {
  const { type, status, floor } = req.query;
  let filtered = [...rooms];
  if (type) filtered = filtered.filter(r => r.type === type);
  if (status) filtered = filtered.filter(r => r.status === status);
  if (floor) filtered = filtered.filter(r => r.floor === parseInt(floor));
  res.json({ rooms: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

router.post('/', (req, res) => {
  const { number, type, floor, price } = req.body;
  if (!number || !type || !price) return res.status(400).json({ error: 'number, type, price required' });
  const newRoom = { id: `ROOM-${Date.now()}`, number, type, floor: floor || 1, status: 'available', price };
  rooms.push(newRoom);
  res.status(201).json(newRoom);
});

router.put('/:id', (req, res) => {
  const index = rooms.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Room not found' });
  rooms[index] = { ...rooms[index], ...req.body };
  res.json(rooms[index]);
});

router.patch('/:id/status', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  room.status = req.body.status;
  res.json(room);
});

router.patch('/:id/checkin', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  room.status = 'occupied';
  room.guest = req.body.guest;
  room.checkIn = req.body.checkIn;
  room.checkOut = req.body.checkOut;
  res.json(room);
});

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
