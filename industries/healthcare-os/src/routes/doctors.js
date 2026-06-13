/**
 * Doctor Routes
 */

import { Router } from 'express';

export const doctorRoutes = Router();

const doctors = new Map([
  ['DOC-001', { id: 'DOC-001', name: 'Dr. Amit Singh', specialization: 'Cardiology', experience: 15, status: 'available', schedule: ['Mon', 'Wed', 'Fri'] }],
  ['DOC-002', { id: 'DOC-002', name: 'Dr. Priya Verma', specialization: 'General Medicine', experience: 10, status: 'available', schedule: ['Mon', 'Tue', 'Thu', 'Fri'] }]
]);

doctorRoutes.get('/', (req, res) => {
  res.json({ doctors: Array.from(doctors.values()), total: doctors.size });
});

doctorRoutes.get('/:id', (req, res) => {
  const doctor = doctors.get(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  res.json(doctor);
});

doctorRoutes.get('/:id/availability', (req, res) => {
  const doctor = doctors.get(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  res.json({ id: doctor.id, available: doctor.status === 'available', schedule: doctor.schedule });
});
