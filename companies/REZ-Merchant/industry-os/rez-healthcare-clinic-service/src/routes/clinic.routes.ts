import { Router, Request, Response } from 'express';
import { ClinicModel } from '../models/Clinic';
import { DepartmentModel } from '../models/Department';
import { CreateClinicSchema } from '../types';
import { ZodError } from 'zod';

const router = Router();

router.get('/clinics', async (_req: Request, res: Response) => {
  try {
    const clinics = await ClinicModel.find({ status: 'active' });
    res.json({ success: true, data: clinics });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/clinics/:id', async (req: Request, res: Response) => {
  try {
    const clinic = await ClinicModel.findById(req.params.id);
    if (!clinic) { res.status(404).json({ success: false, error: 'Clinic not found' }); return; }
    res.json({ success: true, data: clinic });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/clinics', async (req: Request, res: Response) => {
  try {
    const data = await CreateClinicSchema.parseAsync(req.body);
    const clinic = new ClinicModel(data);
    await clinic.save();
    res.status(201).json({ success: true, data: clinic, message: 'Clinic created' });
  } catch (error) {
    if (error instanceof ZodError) { res.status(400).json({ success: false, error: 'Validation failed', details: error.errors }); return; }
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/departments', async (_req: Request, res: Response) => {
  try {
    const departments = await DepartmentModel.find({ status: 'active' });
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/departments', async (req: Request, res: Response) => {
  try {
    const department = new DepartmentModel(req.body);
    await department.save();
    res.status(201).json({ success: true, data: department, message: 'Department created' });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;
