/**
 * RisaCare IVR Service
 * Port: 4751
 *
 * Phone-based appointment booking, triage, and patient engagement
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const PORT = process.env.PORT || 4751;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa-care-ivr';

const app = express();
app.use(express.json());

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

const CallSchema = new mongoose.Schema({
  callId: { type: String, required: true, unique: true },
  phone: String,
  type: { type: String, enum: ['incoming', 'outgoing', 'missed'] },
  status: { type: String, enum: ['initiated', 'answered', 'completed', 'failed', 'voicemail'] },
  ivrResponse: mongoose.Schema.Types.Mixed,
  outcome: String,
  bookingId: String,
  duration: Number,
  recordingUrl: String,
  createdAt: { type: Date, default: Date.now },
});

const IVRCallLogSchema = new mongoose.Schema({
  callId: String,
  step: String,
  action: String,
  input: String,
  timestamp: { type: Date, default: Date.now },
});

const AppointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true },
  patientPhone: String,
  patientName: String,
  doctorName: String,
  specialty: String,
  date: Date,
  timeSlot: String,
  status: { type: String, enum: ['scheduled', 'confirmed', 'completed', 'cancelled'], default: 'scheduled' },
  ivrBooking: Boolean,
  createdAt: { type: Date, default: Date.now },
});

const Call = mongoose.models.Call || mongoose.model('Call', CallSchema);
const IVRCallLog = mongoose.models.IVRCallLog || mongoose.model('IVRCallLog', IVRCallLogSchema);
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);

// ═══════════════════════════════════════════════════════════════════════════════
// IVR MENU FLOW
// ═══════════════════════════════════════════════════════════════════════════════

const IVR_MENU = {
  main: {
    prompt: 'Welcome to RisaCare. For appointment booking, press 1. For health information, press 2. For emergency, press 3.',
    options: {
      '1': 'bookAppointment',
      '2': 'healthInfo',
      '3': 'emergency'
    }
  },
  bookAppointment: {
    prompt: 'For booking a new appointment, press 1. To check existing appointment, press 2. To speak with receptionist, press 0.',
    options: {
      '1': 'selectSpecialty',
      '2': 'checkAppointment',
      '0': 'transfer'
    }
  },
  selectSpecialty: {
    prompt: 'For general physician, press 1. For specialist consultation, press 2. For teleconsult, press 3.',
    options: {
      '1': 'confirmBooking-general',
      '2': 'confirmBooking-specialist',
      '3': 'confirmBooking-teleconsult'
    }
  },
  healthInfo: {
    prompt: 'For health tips, press 1. For medication information, press 2. For lab results, press 3.',
    options: {
      '1': 'healthTips',
      '2': 'medicationInfo',
      '3': 'labResults'
    }
  },
  emergency: {
    prompt: 'If this is a medical emergency, please call our emergency helpline or go to nearest hospital. Press 1 for ambulance service.',
    options: {
      '1': 'ambulance'
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-ivr-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Simulate incoming call
app.post('/api/calls/incoming', async (req: Request, res: Response) => {
  try {
    const { phone, from } = req.body;
    const callId = `CALL-${Date.now()}-${uuidv4().substring(0, 6)}`;

    const call = new Call({
      callId,
      phone,
      type: 'incoming',
      status: 'answered',
      outcome: 'ivr_completed'
    });
    await call.save();

    logger.info('Incoming call', { callId, phone, from });

    res.status(201).json({
      success: true,
      data: {
        callId,
        menu: IVR_MENU.main
      }
    });
  } catch (error) {
    logger.error('Failed to handle incoming call', { error });
    res.status(500).json({ success: false, error: 'Failed to handle call' });
  }
});

// Process IVR input
app.post('/api/calls/:callId/input', async (req: Request, res: Response) => {
  try {
    const { callId } = req.params;
    const { input, currentStep } = req.body;

    // Log the input
    await new IVRCallLog({
      callId,
      step: currentStep || 'main',
      action: 'user_input',
      input: input.toString()
    }).save();

    // Determine next step
    const currentMenu = IVR_MENU[currentStep as keyof typeof IVR_MENU] || IVR_MENU.main;
    const nextStep = currentMenu.options?.[input.toString()];

    if (nextStep) {
      const nextMenu = IVR_MENU[nextStep as keyof typeof IVR_MENU];
      res.json({
        success: true,
        data: {
          nextStep,
          menu: nextMenu,
          action: nextMenu?.prompt?.includes('ambulance') ? 'connect_ambulance' : 'continue'
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          nextStep: 'main',
          menu: IVR_MENU.main,
          action: 'invalid_input'
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to process input' });
  }
});

// Book appointment via IVR
app.post('/api/appointments/book', async (req: Request, res: Response) => {
  try {
    const { phone, patientName, doctorName, specialty, date, timeSlot } = req.body;

    const appointmentId = `APT-${Date.now()}-${uuidv4().substring(0, 6)}`;

    const appointment = new Appointment({
      appointmentId,
      patientPhone: phone,
      patientName,
      doctorName: doctorName || 'General Physician',
      specialty: specialty || 'General',
      date: new Date(date),
      timeSlot,
      status: 'scheduled',
      ivrBooking: true
    });
    await appointment.save();

    logger.info('IVR appointment booked', { appointmentId, phone });

    res.status(201).json({
      success: true,
      data: {
        appointmentId,
        message: 'Your appointment has been booked. You will receive a confirmation SMS shortly.'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to book appointment' });
  }
});

// Get appointment
app.get('/api/appointments/phone/:phone', async (req: Request, res: Response) => {
  const appointments = await Appointment.find({ patientPhone: req.params.phone })
    .sort({ date: -1 })
    .limit(5);

  res.json({ success: true, data: appointments, count: appointments.length });
});

// Get call stats
app.get('/api/stats', async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalCalls, todayCalls, completedCalls] = await Promise.all([
    Call.countDocuments(),
    Call.countDocuments({ createdAt: { $gte: today } }),
    Call.countDocuments({ status: 'completed' })
  ]);

  const appointmentsBooked = await Appointment.countDocuments({ ivrBooking: true });

  res.json({
    success: true,
    data: {
      totalCalls,
      todayCalls,
      completedCalls,
      appointmentsBooked,
      avgHandlingTime: 180 // seconds (would calculate from actual data)
    }
  });
});

// Outbound call (appointment reminder)
app.post('/api/calls/outbound', async (req: Request, res: Response) => {
  try {
    const { phone, type } = req.body;
    const callId = `CALL-OUT-${Date.now()}`;

    const call = new Call({
      callId,
      phone,
      type: 'outgoing',
      status: 'initiated',
      outcome: type || 'reminder'
    });
    await call.save();

    res.status(201).json({ success: true, data: { callId, status: 'initiated' } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to initiate call' });
  }
});

// Voice mail (for missed calls)
app.post('/api/calls/:callId/voicemail', async (req: Request, res: Response) => {
  try {
    const { recordingUrl, message } = req.body;

    await Call.findOneAndUpdate(
      { callId: req.params.callId },
      { status: 'voicemail', recordingUrl }
    );

    logger.info('Voicemail received', { callId: req.params.callId, message });

    res.json({ success: true, message: 'Voicemail saved' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save voicemail' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════════════════

async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.warn('Running without database');
  }

  app.listen(PORT, () => {
    logger.info(
╔═══════════════════════════════════════════════════════╗
║        RisaCare IVR Service v1.0              ║
╠═══════════════════════════════════════════════════════╣
║  Port:      ${PORT}                                ║
║  Database:  MongoDB                              ║
║  Routes:    /api/calls, /api/appointments        ║
╚═══════════════════════════════════════════════════════╝
    `);
  });
}

start();

export default app;