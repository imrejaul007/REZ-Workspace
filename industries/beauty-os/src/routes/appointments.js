/**
 * Beauty OS - Appointments Routes
 */

const express = require('express');
const router = express.Router();

let appointments = [
  { id: 'APT-001', clientId: 'CLI-001', staffId: 'STF-001', serviceId: 'SVC-001', date: '2024-01-15', time: '10:00', duration: 60, status: 'confirmed', price: 1500 },
  { id: 'APT-002', clientId: 'CLI-002', staffId: 'STF-002', serviceId: 'SVC-002', date: '2024-01-15', time: '11:00', duration: 90, status: 'confirmed', price: 2500 }
];

router.get('/', (req, res) => {
  const { clientId, staffId, date, status } = req.query;
  let filtered = [...appointments];
  if (clientId) filtered = filtered.filter(a => a.clientId === clientId);
  if (staffId) filtered = filtered.filter(a => a.staffId === staffId);
  if (date) filtered = filtered.filter(a => a.date === date);
  if (status) filtered = filtered.filter(a => a.status === status);
  res.json({ appointments: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const apt = appointments.find(a => a.id === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });
  res.json(apt);
});

router.post('/', (req, res) => {
  const { clientId, staffId, serviceId, date, time, duration } = req.body;
  if (!clientId || !staffId || !serviceId || !date || !time) return res.status(400).json({ error: 'clientId, staffId, serviceId, date, time required' });
  const newApt = { id: `APT-${Date.now()}`, clientId, staffId, serviceId, date, time, duration: duration || 60, status: 'pending', price: 0 };
  appointments.push(newApt);
  res.status(201).json(newApt);
});

router.patch('/:id/status', (req, res) => {
  const apt = appointments.find(a => a.id === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });
  apt.status = req.body.status;
  res.json(apt);
});

module.exports = router;