/**
 * Medical Records Routes
 */

import { Router } from 'express';

export const medicalRoutes = Router();

const records = new Map();

medicalRoutes.get('/patient/:patientId', (req, res) => {
  res.json({
    patientId: req.params.patientId,
    records: [
      { id: 'REC-001', date: '2024-01-15', type: 'checkup', doctor: 'Dr. Singh', diagnosis: 'Hypertension - controlled' },
      { id: 'REC-002', date: '2024-02-20', type: 'followup', doctor: 'Dr. Kumar', diagnosis: 'BP stable, continue medication' }
    ]
  });
});

medicalRoutes.post('/', (req, res) => {
  const id = `REC-${Date.now()}`;
  records.set(id, { id, ...req.body });
  res.status(201).json(records.get(id));
});

medicalRoutes.get('/:id', (req, res) => {
  res.json(records.get(req.params.id) || { error: 'Record not found' });
});
