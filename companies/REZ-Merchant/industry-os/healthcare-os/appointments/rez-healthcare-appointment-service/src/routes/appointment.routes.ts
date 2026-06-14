import { Router, Request, Response } from 'express';
import { AppointmentModel } from '../models/Appointment';
import { CreateAppointmentSchema } from '../types';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/appointments', async (req: Request, res: Response) => {
  try {
    const doctorId = req.query.doctorId as string;
    const patientId = req.query.patientId as string;
    const date = req.query.date as string;
    const query: Record<string, unknown> = {};
    if (doctorId) query.doctorId = doctorId;
    if (patientId) query.patientId = patientId;
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    const appointments = await AppointmentModel.find(query).sort({ date: 1, startTime: 1 });
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/appointments', async (req: Request, res: Response) => {
  try {
    const data = await CreateAppointmentSchema.parseAsync(req.body);
    const appointment = new AppointmentModel({
      appointmentId: `APT-${uuidv4().substring(0, 8).toUpperCase()}`,
      ...data,
      date: new Date(data.date),
      endTime: data.startTime,
      status: 'scheduled'
    });
    await appointment.save();
    res.status(201).json({ success: true, data: appointment, message: 'Appointment created' });
  } catch (error) {
    if (error instanceof ZodError) { res.status(400).json({ success: false, error: 'Validation failed', details: error.errors }); return; }
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.patch('/appointments/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const appointment = await AppointmentModel.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    if (!appointment) { res.status(404).json({ success: false, error: 'Appointment not found' }); return; }
    res.json({ success: true, data: appointment, message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;
