import { Router, Request, Response } from 'express';
import { AppointmentModel } from '../models/Appointment';

const router = Router();

router.get('/therapist/:therapistId', async (req: Request, res: Response) => {
  try {
    const { therapistId } = req.params;
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    const targetDate = new Date(date);

    const appointments = await AppointmentModel.findByTherapistAndDate(therapistId, targetDate);

    const slots = [];
    const startHour = 9;
    const endHour = 21;

    for (let hour = startHour; hour < endHour; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const existingBooking = appointments.find(apt => apt.startTime === time);

      slots.push({
        time,
        isAvailable: !existingBooking,
        appointment: existingBooking || null
      });
    }

    res.json({
      success: true,
      data: {
        date,
        therapistId,
        slots
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/service/:serviceId', async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const date = req.query.date as string || new Date().toISOString().split('T')[0];

    const appointments = await AppointmentModel.find({
      serviceId,
      date: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      },
      status: { $nin: ['cancelled'] }
    });

    res.json({
      success: true,
      data: {
        date,
        serviceId,
        totalBookings: appointments.length,
        appointments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.post('/slots', async (req: Request, res: Response) => {
  try {
    const { date, duration = 60, therapistId } = req.body;
    const targetDate = new Date(date);

    const query: Record<string, unknown> = {
      date: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      },
      status: { $nin: ['cancelled', 'no_show'] }
    };

    if (therapistId) {
      query.therapistId = therapistId;
    }

    const appointments = await AppointmentModel.find(query).sort({ startTime: 1 });

    const slots = [];
    const startHour = 9;
    const endHour = 21;

    for (let hour = startHour; hour < endHour; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const isBooked = appointments.some(apt => apt.startTime === time);

      slots.push({
        time,
        isAvailable: !isBooked,
        therapistId: therapistId || null
      });
    }

    res.json({
      success: true,
      data: {
        date,
        duration,
        slots: slots.filter(slot => slot.isAvailable)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/daily/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    const appointments = await AppointmentModel.findByDate(targetDate);

    const summary = {
      date,
      totalAppointments: appointments.length,
      byStatus: {} as Record<string, number>,
      byTherapist: {} as Record<string, number>
    };

    appointments.forEach(apt => {
      summary.byStatus[apt.status] = (summary.byStatus[apt.status] || 0) + 1;
      summary.byTherapist[apt.therapistId] = (summary.byTherapist[apt.therapistId] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        summary,
        appointments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
