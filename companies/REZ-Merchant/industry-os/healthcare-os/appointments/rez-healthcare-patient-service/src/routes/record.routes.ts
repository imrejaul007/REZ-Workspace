import { Router, Request, Response } from 'express';
import { MedicalRecordModel } from '../models/MedicalRecord';

const router = Router();

router.post('/records', async (req: Request, res: Response) => {
  try {
    const record = new MedicalRecordModel(req.body);
    await record.save();
    res.status(201).json({ success: true, data: record, message: 'Record created' });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/records/:id', async (req: Request, res: Response) => {
  try {
    const record = await MedicalRecordModel.findById(req.params.id);
    if (!record) { res.status(404).json({ success: false, error: 'Record not found' }); return; }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;
