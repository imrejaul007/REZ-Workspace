import { Router, Request, Response } from 'express';
import { PrescriptionModel } from '../models/Prescription';
import { VerificationModel } from '../models/Verification';
import { CreatePrescriptionSchema } from '../types';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/prescriptions', async (req: Request, res: Response) => {
  try {
    const patientId = req.query.patientId as string;
    const status = req.query.status as string;
    const query: Record<string, unknown> = {};
    if (patientId) query.patientId = patientId;
    if (status) query.status = status;
    const prescriptions = await PrescriptionModel.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/prescriptions/:id', async (req: Request, res: Response) => {
  try {
    const prescription = await PrescriptionModel.findById(req.params.id);
    if (!prescription) { res.status(404).json({ success: false, error: 'Prescription not found' }); return; }
    res.json({ success: true, data: prescription });
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
      status: 'pending'
    });
    await prescription.save();
    res.status(201).json({ success: true, data: prescription, message: 'Prescription created' });
  } catch (error) {
    if (error instanceof ZodError) { res.status(400).json({ success: false, error: 'Validation failed', details: error.errors }); return; }
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.patch('/prescriptions/:id/verify', async (req: Request, res: Response) => {
  try {
    const { isValid, notes, verifiedBy } = req.body;
    const prescription = await PrescriptionModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status: isValid ? 'verified' : 'rejected', verifiedBy, verifiedAt: new Date() } },
      { new: true }
    );
    if (!prescription) { res.status(404).json({ success: false, error: 'Prescription not found' }); return; }

    const verification = new VerificationModel({ prescriptionId: prescription._id, verifiedBy, isValid, notes });
    await verification.save();

    res.json({ success: true, data: prescription, message: 'Prescription verified' });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;
