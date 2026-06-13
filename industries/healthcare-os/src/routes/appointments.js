/**
 * Appointment Routes
 */

import { Router } from 'express';

export const appointmentRoutes = Router();

const appointments = new Map();

appointments.set('APT-001', {
  id: 'APT-001',
  patientId: 'PAT-001',
  patientName: 'Ramesh Kumar',
  doctorId: 'DOC-001',
  doctorName: 'Dr. Amit Singh',
  department: 'Cardiology',
  date: new Date().toISOString().split('T')[0],
  time: '09:30',
  duration: 15,
  type: 'checkup',
  status: 'scheduled',
  notes: 'Follow-up for BP'
});

appointments.set('APT-002', {
  id: 'APT-002',
  patientId: 'PAT-002',
  patientName: 'Priya Sharma',
  doctorId: 'DOC-002',
  doctorName: 'Dr. Priya Verma',
  department: 'General Medicine',
  date: new Date().toISOString().split('T')[0],
  time: '10:00',
  duration: 20,
  type: 'consultation',
  status: 'completed'
});

// Get appointments
appointmentRoutes.get('/', (req, res) => {
  const { date, doctorId, status } = req.query;
  let result = Array.from(appointments.values());

  if (date) result = result.filter(a => a.date === date);
  if (doctorId) result = result.filter(a => a.doctorId === doctorId);
  if (status) result = result.filter(a => a.status === status);

  res.json({ appointments: result, total: result.length });
});

// Get single
appointmentRoutes.get('/:id', (req, res) => {
  const appointment = appointments.get(req.params.id);
  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
  res.json(appointment);
});

// Create
appointmentRoutes.post('/', (req, res) => {
  const id = `APT-${String(appointments.size + 1).padStart(3, '0')}`;
  const appointment = { id, ...req.body, createdAt: new Date().toISOString() };
  appointments.set(id, appointment);
  res.status(201).json(appointment);
});

// Update status
appointmentRoutes.patch('/:id/status', (req, res) => {
  const appointment = appointments.get(req.params.id);
  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
  appointment.status = req.body.status;
  res.json(appointment);
});

// Get doctor schedule
appointmentRoutes.get('/doctor/:doctorId/schedule', (req, res) => {
  const { date } = req.query;
  const doctorAppts = Array.from(appointments.values())
    .filter(a => a.doctorId === req.params.doctorId)
    .filter(a => !date || a.date === date);

  res.json({ appointments: doctorAppts, total: doctorAppts.length });
});

// Find slot
appointmentRoutes.post('/find-slot', (req, res) => {
  const { doctorId, date, duration } = req.body;
  const slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00'];
  const booked = Array.from(appointments.values())
    .filter(a => a.doctorId === doctorId && a.date === date)
    .map(a => a.time);

  const available = slots.filter(s => !booked.includes(s));

  res.json({ available, booked, date, doctorId });
});
