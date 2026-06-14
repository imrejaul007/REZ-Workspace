/**
 * RisaCare Hospital Admin Dashboard
 * Hospital management and administration
 */

import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { RisaCareEcosystemClient } from '../../risa-care-shared/src/index';

const ecosystem = new RisaCareEcosystemClient();
const PORT = parseInt(process.env.PORT || '4772', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_hospital_admin';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
app.use(express.json());

// Schemas
const DepartmentSchema = new mongoose.Schema({
  departmentId: String, hospitalId: String, name: String, head: String, beds: Number, occupied: Number, staff: [String]
});

const BedSchema = new mongoose.Schema({
  bedId: String, room: String, ward: String, floor: Number, type: String, status: String, patientId: String, admittedAt: Date
});

const AdmissionSchema = new mongoose.Schema({
  admissionId: String, patientId: String, patientName: String, bedId: String, department: String, diagnosis: String, admittedAt: Date, status: String
});

const SurgerySchema = new mongoose.Schema({
  surgeryId: String, patientId: String, surgeon: String, type: String, scheduledAt: Date, duration: Number, status: String, room: String
});

const Department = mongoose.model('Department', DepartmentSchema);
const Bed = mongoose.model('Bed', BedSchema);
const Admission = mongoose.model('Admission', AdmissionSchema);
const Surgery = mongoose.model('Surgery', SurgerySchema);

app.get('/health', async (req, res) => {
  res.json({ status: 'healthy', service: 'hospital-admin', version: '1.0.0' });
});

// Dashboard
app.get('/api/dashboard', async (req, res) => {
  const [departments, beds, admissions, surgeries] = await Promise.all([
    Department.find(), Bed.find(), Admission.find({ status: 'admitted' }), Surgery.find({ status: 'scheduled' })
  ]);

  res.json({
    success: true,
    dashboard: {
      occupancy: { total: beds.length, occupied: beds.filter(b => b.status === 'occupied').length },
      admissions: admissions.length,
      surgeries: surgeries.length,
      departments: departments.map(d => ({ name: d.name, beds: d.beds, occupied: d.occupied }))
    }
  });
});

// Departments
app.post('/api/departments', async (req, res) => {
  const dept = await Department.create({ departmentId: `dept_${uuidv4()}`, ...req.body });
  res.status(201).json({ success: true, department: dept });
});

app.get('/api/departments', async (req, res) => {
  const departments = await Department.find();
  res.json({ success: true, departments });
});

// Beds
app.get('/api/beds', async (req, res) => {
  const { status, ward } = req.query;
  const query: any = {};
  if (status) query.status = status;
  if (ward) query.ward = ward;
  const beds = await Bed.find(query);
  res.json({ success: true, beds });
});

app.post('/api/beds', async (req, res) => {
  const bed = await Bed.create({ bedId: `bed_${uuidv4()}`, status: 'available', ...req.body });
  res.status(201).json({ success: true, bed });
});

// Admissions
app.post('/api/admissions', async (req, res) => {
  const admission = await Admission.create({ admissionId: `adm_${uuidv4()}`, admittedAt: new Date(), status: 'admitted', ...req.body });

  // Update bed
  await Bed.findOneAndUpdate({ bedId: req.body.bedId }, { status: 'occupied', patientId: req.body.patientId, admittedAt: new Date() });

  res.status(201).json({ success: true, admission });
});

app.patch('/api/admissions/:id/discharge', async (req, res) => {
  const admission = await Admission.findOneAndUpdate({ admissionId: req.params.id }, { status: 'discharged' }, { new: true });
  if (admission) {
    await Bed.findOneAndUpdate({ bedId: admission.bedId }, { status: 'available', patientId: null });
  }
  res.json({ success: true, admission });
});

// Surgeries
app.post('/api/surgeries', async (req, res) => {
  const surgery = await Surgery.create({ surgeryId: `surg_${uuidv4()}`, status: 'scheduled', ...req.body });
  res.status(201).json({ success: true, surgery });
});

app.get('/api/surgeries', async (req, res) => {
  const { date, status } = req.query;
  const query: any = {};
  if (status) query.status = status;
  if (date) {
    const start = new Date(date as string);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    query.scheduledAt = { $gte: start, $lt: end };
  }
  const surgeries = await Surgery.find(query).sort({ scheduledAt: 1 });
  res.json({ success: true, surgeries });
});

async function start() {
  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => logger.info(`Hospital Admin started on port ${PORT}`));
}
start();
export default app;
