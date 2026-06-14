import { Router, Request, Response } from 'express';
import { PrescriptionModel } from '../models/Prescription';
import { MedicineModel } from '../models/Medicine';
import { CreatePrescriptionSchema } from '../types';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/prescriptions', async (req: Request, res: Response) => {
  try {
    const patientId = req.query.patientId as string;
    const query: Record<string, unknown> = { status: 'active' };
    if (patientId) query.patientId = patientId;
    const prescriptions = await PrescriptionModel.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/prescriptions', async (req: Request, res: Response) => {
  try {
    const data = await CreatePrescriptionSchema.parseAsync(req.body);
    const prescription = new PrescriptionModel({
      prescriptionId: `RX-${uuidv4().substring(0, 8).toUpperCase()}`,
      ...data,
      validUntil: new Date(data.validUntil),
      status: 'active'
    });
    await prescription.save();
    res.status(201).json({ success: true, data: prescription, message: 'Prescription created' });
  } catch (error) {
    if (error instanceof ZodError) { res.status(400).json({ success: false, error: 'Validation failed', details: error.errors }); return; }
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/medicines', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    const query: Record<string, unknown> = {};
    if (search) query.$text = { $search: search };
    const medicines = await MedicineModel.find(query).sort({ name: 1 });
    res.json({ success: true, data: medicines });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;
