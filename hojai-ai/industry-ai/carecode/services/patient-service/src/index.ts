/**
 * CARECODE - Patient Service
 * Core patient management service for healthcare AI operating system
 * "AI That Knows Every Patient"
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4820;

app.use(express.json());

// ============================================
// TYPES
// ============================================

interface Patient {
  id: string;
  patientId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  insurance?: Insurance;
  allergies: string[];
  conditions: string[];
  bloodType?: string;
  height?: string;
  weight?: string;
  status: 'active' | 'inactive' | 'deceased';
  registrationDate: string;
  lastVisit?: string;
  totalVisits: number;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

interface Insurance {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  memberId?: string;
  copay?: number;
  deductible?: number;
  expirationDate?: string;
}

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

interface Vitals {
  id: string;
  patientId: string;
  date: string;
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
}

// ============================================
// IN-MEMORY DATABASE
// ============================================

const patients = new Map<string, Patient>();
const vitals = new Map<string, Vitals[]>();
const appointments = new Map<string, Appointment[]>();

// Sample data
const samplePatients: Patient[] = [
  {
    id: '1',
    patientId: 'PAT-001',
    name: 'Rahul Sharma',
    firstName: 'Rahul',
    lastName: 'Sharma',
    dateOfBirth: '1985-06-15',
    age: 40,
    gender: 'male',
    phone: '9876543210',
    email: 'rahul.sharma@email.com',
    address: {
      street: '123 MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001'
    },
    emergencyContact: {
      name: 'Priya Sharma',
      relationship: 'Spouse',
      phone: '9876543211'
    },
    insurance: {
      provider: 'HealthPlus Insurance',
      policyNumber: 'HP123456',
      copay: 30,
      deductible: 1000
    },
    allergies: ['Penicillin', 'Dust'],
    conditions: ['Hypertension', 'Type 2 Diabetes'],
    bloodType: 'O+',
    height: '175cm',
    weight: '78kg',
    status: 'active',
    registrationDate: '2025-01-15',
    lastVisit: '2026-05-20',
    totalVisits: 12,
    tags: ['diabetic', 'hypertensive'],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2026-05-20T14:30:00Z'
  },
  {
    id: '2',
    patientId: 'PAT-002',
    name: 'Priya Patel',
    firstName: 'Priya',
    lastName: 'Patel',
    dateOfBirth: '1990-03-22',
    age: 36,
    gender: 'female',
    phone: '9876543212',
    email: 'priya.patel@email.com',
    allergies: ['Sulfa drugs'],
    conditions: [],
    bloodType: 'A+',
    status: 'active',
    registrationDate: '2025-06-01',
    totalVisits: 5,
    tags: [],
    createdAt: '2025-06-01T09:00:00Z',
    updatedAt: '2026-04-10T11:00:00Z'
  },
  {
    id: '3',
    patientId: 'PAT-003',
    name: 'Anita Verma',
    firstName: 'Anita',
    lastName: 'Verma',
    dateOfBirth: '1978-11-08',
    age: 47,
    gender: 'female',
    phone: '9876543213',
    allergies: [],
    conditions: ['Asthma'],
    bloodType: 'B+',
    status: 'active',
    registrationDate: '2024-03-10',
    totalVisits: 18,
    tags: ['asthma'],
    createdAt: '2024-03-10T08:30:00Z',
    updatedAt: '2026-05-25T16:00:00Z'
  }
];

samplePatients.forEach(p => patients.set(p.id, p));

// ============================================
// UTILITY FUNCTIONS
// ============================================

function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function generatePatientId(): string {
  return `PAT-${Date.now().toString(36).toUpperCase()}`;
}

function searchPatients(query: string): Patient[] {
  const queryLower = query.toLowerCase();
  return Array.from(patients.values()).filter(p =>
    p.name.toLowerCase().includes(queryLower) ||
    p.patientId.toLowerCase().includes(queryLower) ||
    p.phone.includes(query) ||
    p.email?.toLowerCase().includes(queryLower) ||
    p.conditions.some(c => c.toLowerCase().includes(queryLower)) ||
    p.tags.some(t => t.toLowerCase().includes(queryLower))
  );
}

// ============================================
// API ROUTES
// ============================================

/**
 * Register new patient
 */
app.post('/api/patients', (req: Request, res: Response) => {
  try {
    const {
      name,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      emergencyContact,
      insurance,
      allergies = [],
      conditions = [],
      bloodType,
      height,
      weight,
      tags = [],
      notes
    } = req.body;

    if (!name || !dateOfBirth || !gender || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, dateOfBirth, gender, phone'
      });
    }

    const patientId = generatePatientId();
    const now = new Date().toISOString();

    const patient: Patient = {
      id: uuidv4(),
      patientId,
      name: name || `${firstName || ''} ${lastName || ''}`.trim(),
      firstName,
      lastName,
      dateOfBirth,
      age: calculateAge(dateOfBirth),
      gender,
      phone,
      email,
      address,
      emergencyContact,
      insurance,
      allergies,
      conditions,
      bloodType,
      height,
      weight,
      status: 'active',
      registrationDate: now.split('T')[0],
      totalVisits: 0,
      tags,
      notes,
      createdAt: now,
      updatedAt: now
    };

    patients.set(patient.id, patient);
    vitals.set(patient.id, []);
    appointments.set(patient.id, []);

    console.log(`[${now}] New patient registered: ${patientId} - ${patient.name}`);

    res.status(201).json({
      success: true,
      patient,
      message: `Patient ${patientId} registered successfully`
    });
  } catch (error) {
    console.error('Patient registration error:', error);
    res.status(500).json({ success: false, error: 'Failed to register patient' });
  }
});

/**
 * Get all patients
 */
app.get('/api/patients', (req: Request, res: Response) => {
  try {
    const { search, status, condition, tag } = req.query;
    let result = Array.from(patients.values());

    if (search) {
      result = searchPatients(String(search));
    }

    if (status) {
      result = result.filter(p => p.status === status);
    }

    if (condition) {
      result = result.filter(p =>
        p.conditions.some(c => c.toLowerCase().includes(String(condition).toLowerCase()))
      );
    }

    if (tag) {
      result = result.filter(p => p.tags.includes(String(tag)));
    }

    result.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      patients: result,
      count: result.length,
      total: patients.size
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get patients' });
  }
});

/**
 * Get patient by ID
 */
app.get('/api/patients/:id', (req: Request, res: Response) => {
  try {
    const patient = patients.get(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    // Get related data
    const patientVitals = vitals.get(patient.id) || [];
    const patientAppointments = appointments.get(patient.id) || [];

    res.json({
      success: true,
      patient,
      recentVitals: patientVitals.slice(-5),
      upcomingAppointments: patientAppointments
        .filter(a => new Date(a.date) >= new Date())
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5),
      stats: {
        totalVisits: patient.totalVisits,
        lastVisit: patient.lastVisit,
        conditionsCount: patient.conditions.length,
        allergiesCount: patient.allergies.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get patient' });
  }
});

/**
 * Get patient by patientId
 */
app.get('/api/patients/id/:patientId', (req: Request, res: Response) => {
  try {
    const patient = Array.from(patients.values()).find(p => p.patientId === req.params.patientId);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get patient' });
  }
});

/**
 * Update patient
 */
app.patch('/api/patients/:id', (req: Request, res: Response) => {
  try {
    const patient = patients.get(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const allowedUpdates = [
      'name', 'firstName', 'lastName', 'phone', 'email', 'address',
      'emergencyContact', 'insurance', 'allergies', 'conditions',
      'bloodType', 'height', 'weight', 'tags', 'notes', 'status'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        (patient as any)[field] = req.body[field];
      }
    });

    if (req.body.dateOfBirth) {
      patient.age = calculateAge(req.body.dateOfBirth);
    }

    patient.updatedAt = new Date().toISOString();
    patients.set(patient.id, patient);

    res.json({
      success: true,
      patient,
      message: 'Patient updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update patient' });
  }
});

/**
 * Delete patient (soft delete)
 */
app.delete('/api/patients/:id', (req: Request, res: Response) => {
  try {
    const patient = patients.get(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    patient.status = 'inactive';
    patient.updatedAt = new Date().toISOString();
    patients.set(patient.id, patient);

    res.json({
      success: true,
      message: 'Patient deactivated'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to deactivate patient' });
  }
});

/**
 * Add allergies
 */
app.post('/api/patients/:id/allergies', (req: Request, res: Response) => {
  try {
    const { allergies } = req.body;
    if (!allergies || !Array.isArray(allergies)) {
      return res.status(400).json({ success: false, error: 'Allergies array required' });
    }

    const patient = patients.get(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    patient.allergies = [...new Set([...patient.allergies, ...allergies])];
    patient.updatedAt = new Date().toISOString();
    patients.set(patient.id, patient);

    res.json({
      success: true,
      allergies: patient.allergies,
      message: `${allergies.length} allergy/allergies added`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add allergies' });
  }
});

/**
 * Add conditions
 */
app.post('/api/patients/:id/conditions', (req: Request, res: Response) => {
  try {
    const { conditions } = req.body;
    if (!conditions || !Array.isArray(conditions)) {
      return res.status(400).json({ success: false, error: 'Conditions array required' });
    }

    const patient = patients.get(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    patient.conditions = [...new Set([...patient.conditions, ...conditions])];
    patient.updatedAt = new Date().toISOString();
    patients.set(patient.id, patient);

    res.json({
      success: true,
      conditions: patient.conditions,
      message: `${conditions.length} condition(s) added`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add conditions' });
  }
});

/**
 * Record vitals
 */
app.post('/api/patients/:id/vitals', (req: Request, res: Response) => {
  try {
    const patient = patients.get(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const { bloodPressure, heartRate, temperature, weight, height, oxygenSaturation } = req.body;

    const vital: Vitals = {
      id: uuidv4(),
      patientId: patient.id,
      date: new Date().toISOString(),
      bloodPressure,
      heartRate,
      temperature,
      weight,
      height,
      oxygenSaturation
    };

    const patientVitals = vitals.get(patient.id) || [];
    patientVitals.push(vital);
    vitals.set(patient.id, patientVitals);

    // Update patient weight/height if provided
    if (weight) patient.weight = `${weight}kg`;
    if (height) patient.height = `${height}cm`;
    patient.updatedAt = new Date().toISOString();
    patients.set(patient.id, patient);

    res.status(201).json({
      success: true,
      vital,
      message: 'Vitals recorded successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to record vitals' });
  }
});

/**
 * Get vitals history
 */
app.get('/api/patients/:id/vitals', (req: Request, res: Response) => {
  try {
    const patient = patients.get(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const patientVitals = vitals.get(patient.id) || [];
    const { limit = 30 } = req.query;

    const sortedVitals = patientVitals
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, Number(limit));

    // Calculate trends
    const trends = {
      bloodPressure: patientVitals.filter(v => v.bloodPressure).slice(-7).map(v => ({
        date: v.date,
        systolic: v.bloodPressure!.systolic,
        diastolic: v.bloodPressure!.diastolic
      })),
      heartRate: patientVitals.filter(v => v.heartRate).slice(-7).map(v => ({
        date: v.date,
        value: v.heartRate
      })),
      weight: patientVitals.filter(v => v.weight).slice(-7).map(v => ({
        date: v.date,
        value: v.weight
      }))
    };

    res.json({
      success: true,
      vitals: sortedVitals,
      trends,
      count: patientVitals.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get vitals' });
  }
});

/**
 * Record visit
 */
app.post('/api/patients/:id/visit', (req: Request, res: Response) => {
  try {
    const patient = patients.get(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    patient.totalVisits++;
    patient.lastVisit = new Date().toISOString().split('T')[0];
    patient.updatedAt = new Date().toISOString();
    patients.set(patient.id, patient);

    res.json({
      success: true,
      patient,
      message: `Visit #${patient.totalVisits} recorded for ${patient.name}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to record visit' });
  }
});

/**
 * Get patient summary
 */
app.get('/api/patients/:id/summary', (req: Request, res: Response) => {
  try {
    const patient = patients.get(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const patientVitals = vitals.get(patient.id) || [];
    const latestVitals = patientVitals[patientVitals.length - 1];

    res.json({
      success: true,
      summary: {
        patientId: patient.patientId,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        bloodType: patient.bloodType,
        status: patient.status,
        conditions: patient.conditions,
        allergies: patient.allergies,
        totalVisits: patient.totalVisits,
        lastVisit: patient.lastVisit,
        insurance: patient.insurance ? {
          provider: patient.insurance.provider,
          policyNumber: patient.insurance.policyNumber
        } : null,
        latestVitals: latestVitals || null,
        riskFactors: analyzeRiskFactors(patient, patientVitals)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get summary' });
  }
});

function analyzeRiskFactors(patient: Patient, patientVitals: Vitals[]): string[] {
  const risks: string[] = [];

  if (patient.conditions.includes('Hypertension')) {
    risks.push('Cardiovascular risk - monitor BP');
  }
  if (patient.conditions.includes('Type 2 Diabetes')) {
    risks.push('Diabetic risk - monitor blood sugar');
  }
  if (patient.conditions.includes('Asthma')) {
    risks.push('Respiratory risk - keep inhaler available');
  }
  if (patient.allergies.includes('Penicillin') || patient.allergies.includes('Sulfa drugs')) {
    risks.push('Drug allergy - avoid certain antibiotics');
  }

  // Check latest vitals
  const latest = patientVitals[patientVitals.length - 1];
  if (latest?.bloodPressure && (latest.bloodPressure.systolic > 140 || latest.bloodPressure.diastolic > 90)) {
    risks.push('Elevated blood pressure detected');
  }
  if (latest?.oxygenSaturation && latest.oxygenSaturation < 95) {
    risks.push('Low oxygen saturation');
  }

  return risks;
}

/**
 * Search patients
 */
app.get('/api/search', (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter q required' });
    }

    const results = searchPatients(String(q));

    res.json({
      success: true,
      results,
      count: results.length,
      query: q
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

/**
 * Get patient statistics
 */
app.get('/api/stats', (req: Request, res: Response) => {
  try {
    const allPatients = Array.from(patients.values());

    const stats = {
      total: allPatients.length,
      active: allPatients.filter(p => p.status === 'active').length,
      inactive: allPatients.filter(p => p.status === 'inactive').length,
      byGender: {
        male: allPatients.filter(p => p.gender === 'male').length,
        female: allPatients.filter(p => p.gender === 'female').length,
        other: allPatients.filter(p => p.gender === 'other').length
      },
      byAgeGroup: {
        '0-18': allPatients.filter(p => p.age < 18).length,
        '19-35': allPatients.filter(p => p.age >= 19 && p.age <= 35).length,
        '36-50': allPatients.filter(p => p.age >= 36 && p.age <= 50).length,
        '51-65': allPatients.filter(p => p.age >= 51 && p.age <= 65).length,
        '65+': allPatients.filter(p => p.age > 65).length
      },
      commonConditions: getConditionCounts(allPatients),
      totalVisits: allPatients.reduce((sum, p) => sum + p.totalVisits, 0),
      registrationsThisMonth: allPatients.filter(p => {
        const regDate = new Date(p.registrationDate);
        const now = new Date();
        return regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear();
      }).length
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

function getConditionCounts(patients: Patient[]): { condition: string; count: number }[] {
  const counts = new Map<string, number>();
  patients.forEach(p => {
    p.conditions.forEach(c => {
      counts.set(c, (counts.get(c) || 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .map(([condition, count]) => ({ condition, count }))
    .sort((a, b) => b.count - a.count);
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'carecode-patient-service',
    version: '1.0.0',
    port: PORT,
    stats: {
      totalPatients: patients.size,
      activePatients: Array.from(patients.values()).filter(p => p.status === 'active').length,
      totalVitals: Array.from(vitals.values()).reduce((sum, v) => sum + v.length, 0)
    }
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'CARECODE Patient Service',
    description: 'Core patient management service for healthcare AI',
    version: '1.0.0',
    endpoints: {
      patients: {
        register: 'POST /api/patients',
        list: 'GET /api/patients',
        get: 'GET /api/patients/:id',
        update: 'PATCH /api/patients/:id',
        delete: 'DELETE /api/patients/:id'
      },
      vitals: {
        record: 'POST /api/patients/:id/vitals',
        history: 'GET /api/patients/:id/vitals'
      },
      allergies: 'POST /api/patients/:id/allergies',
      conditions: 'POST /api/patients/:id/conditions',
      visit: 'POST /api/patients/:id/visit',
      summary: 'GET /api/patients/:id/summary',
      search: 'GET /api/search?q=...',
      stats: 'GET /api/stats'
    }
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           CARECODE PATIENT SERVICE v1.0.0                 ║
║                                                         ║
║  Tagline: "AI That Knows Every Patient"                ║
║  Port: ${PORT}                                               ║
║                                                         ║
║  Capabilities:                                         ║
║  • Patient Registration                               ║
║  • Medical History Management                          ║
║  • Vitals Tracking                                     ║
║  • Condition & Allergy Management                      ║
║  • Patient Search & Analytics                          ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export { app, patients, vitals };