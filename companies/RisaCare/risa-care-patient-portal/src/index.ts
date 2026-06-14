/**
 * RisaCare Patient Portal
 * Patient-facing health records and management
 */
import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { RisaCareEcosystemClient } from '../../risa-care-shared/src/index';

const ecosystem = new RisaCareEcosystemClient();
const PORT = parseInt(process.env.PORT || '4779', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_patient_portal';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
app.use(express.json());

// Patient Schema
const PatientPortalSchema = new mongoose.Schema({
  portalId: String, userId: String, name: String, email: String, phone: String,
  dateOfBirth: Date, gender: String, bloodGroup: String, allergies: [String],
  emergencyContact: { name: String, phone: String, relationship: String },
  documents: [{
    type: String, name: String, url: String, uploadedAt: Date
  }],
  insurancePolicy: { provider: String, policyNumber: String, expiryDate: Date }
});

const PortalRecordSchema = new mongoose.Schema({
  recordId: String, portalId: String, type: String, title: String,
  date: Date, doctor: String, hospital: String, summary: String, fileUrl: String
});

const PortalAppointmentSchema = new mongoose.Schema({
  appointmentId: String, portalId: String, doctor: String, specialization: String,
  hospital: String, date: Date, time: String, status: String, notes: String
});

const PortalPrescriptionSchema = new mongoose.Schema({
  prescriptionId: String, portalId: String, doctor: String,
  date: Date, diagnosis: String, medicines: [{
    name: String, dosage: String, frequency: String, duration: String, instructions: String
  }]
});

const Portal = mongoose.model('Portal', PatientPortalSchema);
const PortalRecord = mongoose.model('PortalRecord', PortalRecordSchema);
const PortalAppointment = mongoose.model('PortalAppointment', PortalAppointmentSchema);
const PortalPrescription = mongoose.model('PortalPrescription', PortalPrescriptionSchema);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'patient-portal' }));

// Profile
app.post('/api/portal', async (req, res) => {
  const portal = await Portal.create({ portalId: `portal_${uuidv4()}`, ...req.body });
  res.status(201).json({ success: true, portal });
});

app.get('/api/portal/:userId', async (req, res) => {
  const portal = await Portal.findOne({ userId: req.params.userId });
  if (!portal) return res.status(404).json({ error: 'Portal not found' });
  res.json({ success: true, portal });
});

// Records
app.get('/api/portal/:userId/records', async (req, res) => {
  const portal = await Portal.findOne({ userId: req.params.userId });
  if (!portal) return res.status(404).json({ error: 'Not found' });
  const records = await PortalRecord.find({ portalId: portal.portalId }).sort({ date: -1 });
  res.json({ success: true, records });
});

app.post('/api/records', async (req, res) => {
  const record = await PortalRecord.create({ recordId: `rec_${uuidv4()}`, ...req.body });
  res.status(201).json({ success: true, record });
});

// Appointments
app.get('/api/portal/:userId/appointments', async (req, res) => {
  const portal = await Portal.findOne({ userId: req.params.userId });
  if (!portal) return res.status(404).json({ error: 'Not found' });
  const appointments = await PortalAppointment.find({ portalId: portal.portalId }).sort({ date: -1 });
  res.json({ success: true, appointments });
});

// Prescriptions
app.get('/api/portal/:userId/prescriptions', async (req, res) => {
  const portal = await Portal.findOne({ userId: req.params.userId });
  if (!portal) return res.status(404).json({ error: 'Not found' });
  const prescriptions = await PortalPrescription.find({ portalId: portal.portalId }).sort({ date: -1 });
  res.json({ success: true, prescriptions });
});

// Dashboard
app.get('/api/portal/:userId/dashboard', async (req, res) => {
  const portal = await Portal.findOne({ userId: req.params.userId });
  if (!portal) return res.status(404).json({ error: 'Not found' });

  const [records, appointments, prescriptions] = await Promise.all([
    PortalRecord.find({ portalId: portal.portalId }).sort({ date: -1 }).limit(5),
    PortalAppointment.find({ portalId: portal.portalId }).sort({ date: -1 }).limit(3),
    PortalPrescription.find({ portalId: portal.portalId }).sort({ date: -1 }).limit(3)
  ]);

  res.json({
    success: true,
    dashboard: {
      patient: portal,
      upcomingAppointments: appointments,
      recentRecords: records,
      activePrescriptions: prescriptions,
      healthSummary: {
        lastVisit: records[0]?.date,
        totalRecords: records.length
      }
    }
  });
});

async function start() {
  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => logger.info(`Patient Portal started on port ${PORT}`));
}
start();
export default app;
