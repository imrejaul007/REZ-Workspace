/**
 * Staff Routes
 */

import { Router } from 'express';

export const staffRoutes = Router();

const staff = new Map([
  ['STAFF-001', { id: 'STAFF-001', name: 'Rajesh Kumar', role: 'Head Chef', phone: '9876543210', status: 'on-duty', shift: 'evening' }],
  ['STAFF-002', { id: 'STAFF-002', name: 'Priya Singh', role: 'Server', phone: '9876543211', status: 'on-duty', shift: 'evening' }]
]);

staffRoutes.get('/', (req, res) => {
  const { role, status } = req.query;
  let result = Array.from(staff.values());
  if (role) result = result.filter(s => s.role === role);
  if (status) result = result.filter(s => s.status === status);
  res.json({ staff: result, total: result.length });
});

staffRoutes.post('/', (req, res) => {
  const id = `STAFF-${String(staff.size + 1).padStart(3, '0')}`;
  const s = { id, ...req.body };
  staff.set(id, s);
  res.status(201).json(s);
});

staffRoutes.patch('/:id/status', (req, res) => {
  const s = staff.get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Staff not found' });
  s.status = req.body.status;
  res.json(s);
});

staffRoutes.get('/schedule', (req, res) => {
  res.json({
    shifts: [
      { shift: 'morning', start: '06:00', end: '14:00', staff: ['STAFF-003'] },
      { shift: 'evening', start: '16:00', end: '23:00', staff: ['STAFF-001', 'STAFF-002'] }
    ]
  });
});
