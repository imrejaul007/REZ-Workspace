/**
 * Healthcare OS - Full Industry Operating System
 * Part of RTMN Ecosystem
 *
 * Features:
 * - Digital Twins (Patient, Appointment, Medical, Doctor, Billing)
 * - AI Agents (Scheduling, Claims, Diagnosis, Inventory)
 * - Business Copilot (6 interfaces)
 * - BOA Executive Intelligence
 */

import express from 'express';
import cors from 'cors';
import { patientRoutes } from './routes/patients.js';
import { appointmentRoutes } from './routes/appointments.js';
import { medicalRoutes } from './routes/medical.js';
import { doctorRoutes } from './routes/doctors.js';
import { billingRoutes } from './routes/billing.js';
import { inventoryRoutes } from './routes/inventory.js';
import { analyticsRoutes } from './routes/analytics.js';
import { digitalTwinsRoutes } from './routes/twins.js';
import { agentRoutes } from './routes/agents.js';

const app = express();
const PORT = process.env.PORT || 5020;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[Healthcare OS] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'healthcare-os',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    stats: {
      patientsToday: 45,
      appointmentsToday: 28,
      bedsOccupied: 42,
      surgeriesScheduled: 5
    }
  });
});

// Dashboard
app.get('/api/dashboard', (req, res) => {
  res.json({
    overview: {
      patientsToday: 45,
      appointmentsToday: 28,
      emergencyCases: 8,
      admissions: 12,
      discharges: 10,
      avgWaitTime: '18 min'
    },
    departments: {
      emergency: { patients: 8, capacity: 15 },
      icu: { patients: 6, beds: 10 },
      general: { patients: 28, beds: 50 }
    },
    staff: {
      doctorsOnDuty: 15,
      nursesOnDuty: 32,
      available: 5
    },
    alerts: [
      { type: 'bed', message: 'ICU at 90% capacity', severity: 'warning' },
      { type: 'inventory', message: 'Stock low: O-negative blood', severity: 'critical' }
    ]
  });
});

// Routes
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', digitalTwinsRoutes);
app.use('/api/agents', agentRoutes);

// AI Copilot endpoints
app.post('/api/copilot/query', (req, res) => {
  const { query, context } = req.body;

  const queryLower = (query || '').toLowerCase();
  let response = 'Processing your query...';

  if (queryLower.includes('patient') || queryLower.includes('appointment')) {
    response = `**Patient & Appointment Overview**\n\n📅 Today's Schedule:\n• Total Appointments: 28\n• Completed: 15\n• Pending: 13\n\n👥 Patient Stats:\n• Today's Patients: 45\n• Emergency: 8\n• Admissions: 12\n\n⏱️ Avg Wait Time: 18 minutes\n\nRecommendations:\n• Add 2 more doctors for evening shift\n• Consider telemedicine for follow-ups`;
  } else if (queryLower.includes('icu') || queryLower.includes('bed')) {
    response = `**Bed Management**\n\n🛏️ ICU Status:\n• Occupied: 6/10 beds\n• Capacity: 90%\n\n📊 Ward Status:\n• General: 28/50 beds\n• Private: 8/15 beds\n\n⚠️ Alert: ICU approaching capacity`;
  } else if (queryLower.includes('doctor') || queryLower.includes('staff')) {
    response = `**Staff Dashboard**\n\n👨‍⚕️ Doctors On Duty: 15\n👩‍⚕️ Nurses On Duty: 32\n\n📅 Schedule:\n• Morning Shift: 8 doctors\n• Evening Shift: 7 doctors\n• Night Shift: 5 doctors\n\nRecommendations:\n• 2 additional nurses needed for ICU\n• Consider overtime for evening shift`;
  } else if (queryLower.includes('inventory') || queryLower.includes('pharmacy')) {
    response = `**Inventory Alert**\n\n🚨 Critical Stock:\n• O-negative blood: 2 units (need 5)\n• Paracetamol 500mg: Low\n\n📦 Available:\n• General medicines: OK\n• Surgical supplies: OK\n\n💊 Today's pharmacy: 85 prescriptions processed`;
  } else if (queryLower.includes('billing') || queryLower.includes('insurance')) {
    response = `**Billing Overview**\n\n💰 Today's Collections: ₹2,45,000\n📋 Pending Claims: ₹8,50,000\n\n⏳ Insurance Processing:\n• Submitted: 12 claims\n• Approved: 8 claims\n• Pending: 4 claims\n\n💳 Collection Breakdown:\n• Cash: ₹45,000\n• Card: ₹1,20,000\n• Insurance: ₹80,000`;
  } else {
    response = `**Healthcare Dashboard**\n\n📊 Today's Stats:\n• Patients: 45\n• Appointments: 28\n• Emergency: 8\n• Avg Wait: 18 min\n\nWhat would you like to analyze?`;
  }

  res.json({
    response,
    query,
    sources: ['healthcare-os', 'twins', 'patients', 'appointments'],
    confidence: 0.92,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[Healthcare OS Error]', err);
  res.status(500).json({ error: 'Internal server error', service: 'healthcare-os' });
});

app.listen(PORT, () => {
  console.log(`🏥 Healthcare OS running on port ${PORT}`);
  console.log(`   Dashboard: http://localhost:${PORT}/api/dashboard`);
  console.log(`   Twins: http://localhost:${PORT}/api/twins`);
  console.log(`   Copilot: http://localhost:${PORT}/api/copilot/query`);
});

export default app;
