import { Router, Request, Response } from 'express';
import { PatientModel } from '../models/Patient';
import { MedicalRecordModel } from '../models/MedicalRecord';
import { CreatePatientSchema } from '../types';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/patients', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    const query: Record<string, unknown> = { status: 'active' };
    if (search) query.$text = { $search: search };
    const patients = await PatientModel.find(query).sort({ name: 1 });
    res.json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/patients/:id', async (req: Request, res: Response) => {
  try {
    const patient = await PatientModel.findById(req.params.id);
    if (!patient) { res.status(404).json({ success: false, error: 'Patient not found' }); return; }
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/patients', async (req: Request, res: Response) => {
  try {
    const data = await CreatePatientSchema.parseAsync(req.body);
    const patient = new PatientModel({
      patientId: `PT-${uuidv4().substring(0, 8).toUpperCase()}`,
      ...data,
      dateOfBirth: new Date(data.dateOfBirth),
      allergies: data.allergies || []
    });
    await patient.save();
    res.status(201).json({ success: true, data: patient, message: 'Patient created' });
  } catch (error) {
    if (error instanceof ZodError) { res.status(400).json({ success: false, error: 'Validation failed', details: error.errors }); return; }
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/patients/:id/records', async (req: Request, res: Response) => {
  try {
    const records = await MedicalRecordModel.find({ patientId: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;
