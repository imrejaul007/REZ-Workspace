import { logger } from '../../shared/logger';
/**
 * RisaCare Healthcare OS API
 * Port: 4800
 */

import express, { Request, Response } from 'express';
import { risaCareHub } from './hub-client';

const app = express();
app.use(express.json());
const PORT = parseInt(process.env.PORT || '4800', 10);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'RisaCare', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  try {
    await risaCareHub.getWalletBalance('health-check');
    res.json({ status: 'ready', unifiedHub: true });
  } catch {
    res.json({ status: 'ready', unifiedHub: false });
  }
});

// Patient Registration
app.post('/api/patients/register', async (req: Request, res: Response) => {
  try {
    const patientData = req.body;
    const patient = await risaCareHub.registerPatient(patientData);
    await risaCareHub.createPatientTwin(patient.id, patientData);
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/patients/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const profile = await risaCareHub.getPatientProfile(patientId);
    const twin = await risaCareHub.getPatientTwin(patientId);
    const history = await risaCareHub.getPatientHistory(patientId);
    res.json({ success: true, data: { profile, twin, history } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Appointments
app.post('/api/appointments', async (req: Request, res: Response) => {
  try {
    const appointment = await risaCareHub.bookAppointment(req.body);
    await risaCareHub.trackEvent(req.body.patient_id, 'appointment.booked', appointment);
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/appointments/:patientId', async (req: Request, res: Response) => {
  try {
    const appointments = await risaCareHub.getAppointments(req.params.patientId);
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Telemedicine
app.post('/api/telemedicine/sessions', async (req: Request, res: Response) => {
  try {
    const session = await risaCareHub.startTelemedicineSession(req.body);
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// AI Health Assistant
app.post('/api/health-assistant', async (req: Request, res: Response) => {
  try {
    const { patient_id, message } = req.body;
    const response = await risaCareHub.chatWithHealthAssistant(patient_id, message);
    await risaCareHub.remember(patient_id, `Health query: ${message}`);
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Wallet
app.get('/api/patients/:patientId/wallet', async (req: Request, res: Response) => {
  try {
    const balance = await risaCareHub.getWalletBalance(req.params.patientId);
    const points = await risaCareHub.getLoyaltyPoints(req.params.patientId);
    res.json({ success: true, data: { balance, points } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.listen(PORT, () => {
  logger.info(`\n🏥 RISACARE HEALTHCARE OS (${PORT}) - Running ✅`);
  logger.info(`Unified Hub: ${process.env.UNIFIED_HUB_URL || 'http://localhost:4600'}`);
});

export { app };
export default app;