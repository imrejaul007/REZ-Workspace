/**
 * RisaCare Nursing Home Suite v2
 * With MongoDB and Ecosystem Integration
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

import { RisaCareEcosystemClient } from '../../risa-care-shared/src/index';

const ecosystem = new RisaCareEcosystemClient();

const PORT = parseInt(process.env.PORT || '4760', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_nursing_home';
const NODE_ENV = process.env.NODE_ENV || 'development';

const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// ============================================
// MONGOOSE SCHEMAS
// ============================================

const ResidentSchema = new mongoose.Schema({
  residentId: String,
  facilityId: String,
  name: String,
  dateOfBirth: Date,
  gender: String,
  roomNumber: String,
  bedNumber: String,
  admissionDate: Date,
  status: { type: String, enum: ['active', 'discharged', 'deceased', 'transferred'], default: 'active' },
  careLevel: { type: String, enum: ['level_1', 'level_2', 'level_3', 'level_4', 'dementia'], default: 'level_2' },
  diagnosis: [String],
  allergies: [String],
  emergencyContacts: [{
    name: String, relationship: String, phone: String, email: String
  }],
  functionalStatus: {
    mobility: String,
    cognitive: String,
    fallRisk: String,
    adl: mongoose.Schema.Types.Mixed
  },
  preferences: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const CarePlanSchema = new mongoose.Schema({
  carePlanId: String,
  residentId: String,
  version: Number,
  status: { type: String, enum: ['draft', 'active', 'review', 'completed'], default: 'draft' },
  goals: [{
    id: String, domain: String, description: String, status: String, progress: Number
  }],
  interventions: [{
    id: String, goalId: String, description: String, frequency: String, responsible: String
  }]
}, { timestamps: true });

const IncidentSchema = new mongoose.Schema({
  incidentId: String,
  facilityId: String,
  residentId: String,
  reportedBy: String,
  dateTime: Date,
  type: { type: String, enum: ['fall', 'medication_error', 'pressure_ulcer', 'infection', 'elopement', 'other'] },
  severity: { type: String, enum: ['minor', 'moderate', 'major', 'critical'] },
  description: String,
  status: { type: String, enum: ['reported', 'investigating', 'resolved', 'closed'], default: 'reported' }
}, { timestamps: true });

const StaffSchema = new mongoose.Schema({
  staffId: String,
  facilityId: String,
  name: String,
  role: String,
  phone: String,
  email: String,
  schedule: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['active', 'on_leave', 'terminated'], default: 'active' }
}, { timestamps: true });

const MedicationAdminSchema = new mongoose.Schema({
  adminId: String,
  residentId: String,
  medication: mongoose.Schema.Types.Mixed,
  scheduledTime: Date,
  status: { type: String, enum: ['scheduled', 'given', 'refused', 'missed'] },
  administeredBy: String
}, { timestamps: true });

const Resident = mongoose.model('Resident', ResidentSchema);
const CarePlan = mongoose.model('CarePlan', CarePlanSchema);
const Incident = mongoose.model('Incident', IncidentSchema);
const Staff = mongoose.model('Staff', StaffSchema);
const MedicationAdmin = mongoose.model('MedicationAdmin', MedicationAdminSchema);

// ============================================
// ROUTES
// ============================================

app.get('/health', async (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: 'healthy',
    service: 'nursing-home-service',
    version: '2.0.0',
    database: dbState === 1 ? 'connected' : 'disconnected'
  });
});

// ===== RESIDENTS =====

app.post('/api/residents', async (req: Request, res: Response) => {
  const resident = await Resident.create({
    residentId: `res_${uuidv4()}`,
    ...req.body
  });

  ecosystem.rez.emitIntent({
    intent: 'resident_admitted',
    entities: { residentId: resident.residentId, facilityId: req.body.facilityId },
    confidence: 1.0,
    userId: req.body.facilityId,
    timestamp: new Date()
  }).catch(() => {});

  res.status(201).json({ success: true, resident });
});

app.get('/api/residents', async (req: Request, res: Response) => {
  const { facilityId, status, careLevel } = req.query;
  const query: any = {};
  if (facilityId) query.facilityId = facilityId;
  if (status) query.status = status;
  if (careLevel) query.careLevel = careLevel;

  const residents = await Resident.find(query).sort({ createdAt: -1 });
  res.json({ success: true, residents, total: residents.length });
});

app.get('/api/residents/:id', async (req: Request, res: Response) => {
  const resident = await Resident.findOne({ residentId: req.params.id });
  if (!resident) return res.status(404).json({ error: 'Resident not found' });

  const carePlan = await CarePlan.findOne({ residentId: req.params.id, status: 'active' });
  const incidents = await Incident.find({ residentId: req.params.id }).sort({ dateTime: -1 }).limit(5);

  res.json({ success: true, resident, carePlan, recentIncidents: incidents });
});

app.patch('/api/residents/:id', async (req: Request, res: Response) => {
  const resident = await Resident.findOneAndUpdate(
    { residentId: req.params.id },
    req.body,
    { new: true }
  );
  if (!resident) return res.status(404).json({ error: 'Resident not found' });
  res.json({ success: true, resident });
});

// ===== CARE PLANS =====

app.post('/api/care-plans', async (req: Request, res: Response) => {
  const carePlan = await CarePlan.create({
    carePlanId: `cp_${uuidv4()}`,
    version: 1,
    ...req.body
  });
  res.status(201).json({ success: true, carePlan });
});

app.get('/api/residents/:id/care-plan', async (req: Request, res: Response) => {
  const carePlan = await CarePlan.findOne({ residentId: req.params.id, status: 'active' });
  if (!carePlan) return res.status(404).json({ error: 'No active care plan' });
  res.json({ success: true, carePlan });
});

app.patch('/api/care-plans/:id', async (req: Request, res: Response) => {
  const carePlan = await CarePlan.findOneAndUpdate(
    { carePlanId: req.params.id },
    req.body,
    { new: true }
  );
  if (!carePlan) return res.status(404).json({ error: 'Care plan not found' });
  res.json({ success: true, carePlan });
});

// ===== INCIDENTS =====

app.post('/api/incidents', async (req: Request, res: Response) => {
  const incident = await Incident.create({
    incidentId: `inc_${uuidv4()}`,
    dateTime: new Date(),
    ...req.body
  });

  // Alert on critical incidents
  if (req.body.severity === 'critical') {
    ecosystem.rabtul.sendPushNotification(
      req.body.facilityId,
      'Critical Incident',
      `Critical ${req.body.type} incident reported for resident ${req.body.residentId}`
    ).catch(() => {});
  }

  logger.info('Incident reported', { incidentId: incident.incidentId, type: incident.type });
  res.status(201).json({ success: true, incident });
});

app.get('/api/incidents', async (req: Request, res: Response) => {
  const { facilityId, type, severity, status } = req.query;
  const query: any = {};
  if (facilityId) query.facilityId = facilityId;
  if (type) query.type = type;
  if (severity) query.severity = severity;
  if (status) query.status = status;

  const incidents = await Incident.find(query).sort({ dateTime: -1 });
  res.json({ success: true, incidents, total: incidents.length });
});

// ===== STAFF =====

app.post('/api/staff', async (req: Request, res: Response) => {
  const staff = await Staff.create({
    staffId: `staff_${uuidv4()}`,
    ...req.body
  });
  res.status(201).json({ success: true, staff });
});

app.get('/api/staff', async (req: Request, res: Response) => {
  const { facilityId, role, status } = req.query;
  const query: any = {};
  if (facilityId) query.facilityId = facilityId;
  if (role) query.role = role;
  if (status) query.status = status;

  const staff = await Staff.find(query);
  res.json({ success: true, staff, total: staff.length });
});

// ===== MEDICATIONS =====

app.post('/api/medications/administer', async (req: Request, res: Response) => {
  const admin = await MedicationAdmin.create({
    adminId: `med_${uuidv4()}`,
    scheduledTime: new Date(),
    status: 'given',
    ...req.body
  });
  res.status(201).json({ success: true, admin });
});

app.get('/api/residents/:id/medications', async (req: Request, res: Response) => {
  const meds = await MedicationAdmin.find({ residentId: req.params.id })
    .sort({ scheduledTime: -1 }).limit(20);
  res.json({ success: true, medications: meds });
});

// ===== DASHBOARD =====

app.get('/api/dashboard/:facilityId', async (req: Request, res: Response) => {
  const residents = await Resident.find({
    facilityId: req.params.facilityId,
    status: 'active'
  });

  const incidents = await Incident.find({ facilityId: req.params.facilityId });
  const staff = await Staff.find({ facilityId: req.params.facilityId, status: 'active' });

  const today = new Date();
  const last24h = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  res.json({
    success: true,
    dashboard: {
      occupancy: {
        total: residents.length,
        highRisk: residents.filter(r => r.functionalStatus?.fallRisk === 'high' || r.functionalStatus?.fallRisk === 'very_high').length
      },
      incidents: {
        total: incidents.length,
        last24h: incidents.filter(i => i.dateTime >= last24h).length,
        critical: incidents.filter(i => i.severity === 'critical').length
      },
      staff: {
        total: staff.length,
        onDuty: staff.length
      }
    }
  });
});

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Nursing Home Service connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`Nursing Home v2 started on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start', { error });
    process.exit(1);
  }
}

startServer();
export default app;
