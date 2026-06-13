/**
 * Patient Routes
 */

import { Router } from 'express';

export const patientRoutes = Router();

const patients = new Map();

patients.set('PAT-001', {
  id: 'PAT-001',
  name: 'Ramesh Kumar',
  age: 45,
  gender: 'M',
  phone: '9876543210',
  email: 'ramesh@example.com',
  bloodGroup: 'B+',
  allergies: ['Penicillin'],
  conditions: ['Hypertension', 'Diabetes'],
  emergencyContact: { name: 'Sita Kumar', phone: '9876543211', relation: 'Wife' },
  insurance: { provider: 'Star Health', policyNo: 'POL-12345', validTill: '2025-12-31' },
  admitDate: null,
  status: 'outpatient'
});

patients.set('PAT-002', {
  id: 'PAT-002',
  name: 'Priya Sharma',
  age: 32,
  gender: 'F',
  phone: '9876543212',
  email: 'priya@example.com',
  bloodGroup: 'O+',
  allergies: [],
  conditions: [],
  emergencyContact: { name: 'Anil Sharma', phone: '9876543213', relation: 'Husband' },
  insurance: { provider: 'ICICI Lombard', policyNo: 'POL-67890', validTill: '2025-06-30' },
  admitDate: new Date().toISOString(),
  ward: 'ICU-2',
  status: 'inpatient'
});

// Get all patients
patientRoutes.get('/', (req, res) => {
  const { status, search } = req.query;
  let result = Array.from(patients.values());

  if (status) result = result.filter(p => p.status === status);
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(s) || p.id.toLowerCase().includes(s));
  }

  res.json({ patients: result, total: result.length });
});

// Get single patient
patientRoutes.get('/:id', (req, res) => {
  const patient = patients.get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

// Create patient
patientRoutes.post('/', (req, res) => {
  const id = `PAT-${String(patients.size + 1).padStart(3, '0')}`;
  const patient = { id, ...req.body, createdAt: new Date().toISOString() };
  patients.set(id, patient);
  res.status(201).json(patient);
});

// Update patient
patientRoutes.patch('/:id', (req, res) => {
  const patient = patients.get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  const updated = { ...patient, ...req.body, updatedAt: new Date().toISOString() };
  patients.set(req.params.id, updated);
  res.json(updated);
});

// Admit patient
patientRoutes.post('/:id/admit', (req, res) => {
  const patient = patients.get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  patient.status = 'inpatient';
  patient.admitDate = new Date().toISOString();
  patient.ward = req.body.ward;
  patient.bed = req.body.bed;

  res.json(patient);
});

// Discharge patient
patientRoutes.post('/:id/discharge', (req, res) => {
  const patient = patients.get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  patient.status = 'outpatient';
  patient.dischargeDate = new Date().toISOString();
  delete patient.ward;
  delete patient.bed;

  res.json(patient);
});

// Get patient history
patientRoutes.get('/:id/history', (req, res) => {
  res.json({
    patientId: req.params.id,
    visits: [
      { date: '2024-01-15', type: 'checkup', notes: 'Routine checkup', doctor: 'Dr. Singh' },
      { date: '2024-02-20', type: 'followup', notes: 'BP followup', doctor: 'Dr. Kumar' }
    ],
    prescriptions: [],
    labResults: []
  });
});
