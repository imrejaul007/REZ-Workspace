/**
 * Reservation Routes
 */

import { Router } from 'express';

export const reservationRoutes = Router();

const reservations = new Map();

// Initialize sample data
reservations.set('RES-001', {
  id: 'RES-001',
  customerName: 'Rahul Sharma',
  phone: '9876543210',
  date: new Date().toISOString().split('T')[0],
  time: '19:30',
  partySize: 4,
  status: 'confirmed',
  table: 'T5',
  notes: 'Birthday celebration'
});

reservations.set('RES-002', {
  id: 'RES-002',
  customerName: 'Priya Patel',
  phone: '9876543211',
  date: new Date().toISOString().split('T')[0],
  time: '20:00',
  partySize: 2,
  status: 'confirmed',
  table: 'T8',
  notes: ''
});

// Get all reservations
reservationRoutes.get('/', (req, res) => {
  const { date, status } = req.query;
  let result = Array.from(reservations.values());

  if (date) {
    result = result.filter(r => r.date === date);
  }
  if (status) {
    result = result.filter(r => r.status === status);
  }

  res.json({ reservations: result, total: result.length });
});

// Get single reservation
reservationRoutes.get('/:id', (req, res) => {
  const reservation = reservations.get(req.params.id);
  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }
  res.json(reservation);
});

// Create reservation
reservationRoutes.post('/', (req, res) => {
  const { customerName, phone, date, time, partySize, table, notes } = req.body;

  const id = `RES-${String(reservations.size + 1).padStart(3, '0')}`;
  const reservation = {
    id,
    customerName,
    phone,
    date,
    time,
    partySize,
    table,
    notes,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  reservations.set(id, reservation);
  res.status(201).json(reservation);
});

// Update reservation
reservationRoutes.patch('/:id', (req, res) => {
  const reservation = reservations.get(req.params.id);
  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  const updated = { ...reservation, ...req.body, updatedAt: new Date().toISOString() };
  reservations.set(req.params.id, updated);
  res.json(updated);
});

// Cancel reservation
reservationRoutes.delete('/:id', (req, res) => {
  const reservation = reservations.get(req.params.id);
  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  reservation.status = 'cancelled';
  reservations.set(req.params.id, reservation);
  res.json({ success: true, reservation });
});

// Check availability
reservationRoutes.post('/check-availability', (req, res) => {
  const { date, time, partySize } = req.body;

  const existing = Array.from(reservations.values()).filter(
    r => r.date === date && r.time === time && r.status !== 'cancelled'
  );

  const availableTables = 25 - existing.length;

  res.json({
    available: availableTables > 0,
    availableTables,
    suggestions: availableTables === 0 ? ['Try 7:00 PM or 8:30 PM'] : []
  });
});

// Waitlist
reservationRoutes.get('/waitlist', (req, res) => {
  const waitlist = Array.from(reservations.values())
    .filter(r => r.status === 'waitlist')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  res.json({ waitlist, total: waitlist.length });
});

reservationRoutes.post('/waitlist/add', (req, res) => {
  const { customerName, phone, partySize, date, time } = req.body;

  const id = `WL-${Date.now()}`;
  const entry = {
    id,
    customerName,
    phone,
    partySize,
    date,
    time,
    status: 'waitlist',
    position: reservations.size + 1,
    createdAt: new Date().toISOString()
  };

  reservations.set(id, entry);
  res.status(201).json(entry);
});
