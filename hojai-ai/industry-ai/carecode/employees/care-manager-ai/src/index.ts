/**
 * Care Manager AI - Patient Care Coordination
 * Part of CARECODE - Healthcare AI Operating System
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4851;

app.use(express.json());

// Types
interface CarePlan {
  id: string;
  patientId: string;
  conditions: string[];
  goals: string[];
  interventions: string[];
  medications: Medication[];
  followUps: FollowUp[];
  status: 'active' | 'completed' | 'on-hold';
  startDate: string;
  endDate?: string;
  assignedNurse?: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

interface FollowUp {
  id: string;
  date: string;
  type: 'phone' | 'in-person' | 'video';
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface PatientMetrics {
  patientId: string;
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  bloodSugar?: number;
  weight?: number;
  temperature?: number;
  recordedAt: string;
}

// In-memory stores
const carePlans = new Map<string, CarePlan>();
const patientMetrics = new Map<string, PatientMetrics[]>();

// AI: Create Care Plan
app.post('/api/ai/care/plan/create', async (req, res) => {
  try {
    const { patientId, conditions, goals, interventions, medications, durationDays = 30 } = req.body;

    const carePlan: CarePlan = {
      id: uuidv4(),
      patientId,
      conditions: conditions || [],
      goals: goals || [],
      interventions: interventions || [],
      medications: medications || [],
      followUps: [],
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    carePlans.set(carePlan.id, carePlan);

    res.json({
      success: true,
      carePlan,
      aiMessage: `Care plan created for patient ${patientId}. ` +
        `Plan includes ${goals.length} goals and ${interventions.length} interventions. ` +
        `Follow-ups scheduled for next ${durationDays} days.`
    });
  } catch (error) {
    res.status(500).json({ error: 'Care plan creation failed' });
  }
});

// AI: Get Care Plan
app.get('/api/ai/care/plan/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const plans = Array.from(carePlans.values()).filter(p => p.patientId === patientId);

    if (plans.length === 0) {
      return res.status(404).json({ error: 'No care plan found for patient' });
    }

    const activePlan = plans.find(p => p.status === 'active') || plans[0];

    res.json({
      success: true,
      carePlan: activePlan,
      allPlans: plans
    });
  } catch (error) {
    res.status(500).json({ error: 'Care plan retrieval failed' });
  }
});

// AI: Add Follow-up
app.post('/api/ai/care/followup/add', async (req, res) => {
  try {
    const { carePlanId, date, type, reason } = req.body;

    const carePlan = carePlans.get(carePlanId);
    if (!carePlan) {
      return res.status(404).json({ error: 'Care plan not found' });
    }

    const followUp: FollowUp = {
      id: uuidv4(),
      date,
      type,
      reason,
      status: 'scheduled'
    };

    carePlan.followUps.push(followUp);

    res.json({
      success: true,
      followUp,
      aiMessage: `Follow-up scheduled for ${date} (${type}). Reason: ${reason}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Follow-up creation failed' });
  }
});

// AI: Record Patient Metrics
app.post('/api/ai/care/metrics/record', async (req, res) => {
  try {
    const { patientId, bloodPressure, heartRate, bloodSugar, weight, temperature } = req.body;

    const metrics: PatientMetrics = {
      patientId,
      bloodPressure,
      heartRate,
      bloodSugar,
      weight,
      temperature,
      recordedAt: new Date().toISOString()
    };

    const existing = patientMetrics.get(patientId) || [];
    existing.push(metrics);
    patientMetrics.set(patientId, existing);

    const alerts = analyzeMetrics(metrics);

    res.json({
      success: true,
      metrics,
      alerts,
      aiMessage: alerts.length > 0
        ? `Alert: ${alerts.join('. ')}`
        : 'Metrics recorded successfully. All values within normal range.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Metrics recording failed' });
  }
});

function analyzeMetrics(metrics: PatientMetrics): string[] {
  const alerts: string[] = [];

  if (metrics.bloodPressure) {
    if (metrics.bloodPressure.systolic > 140 || metrics.bloodPressure.diastolic > 90) {
      alerts.push('High blood pressure detected - consider medication review');
    }
    if (metrics.bloodPressure.systolic < 90 || metrics.bloodPressure.diastolic < 60) {
      alerts.push('Low blood pressure detected - monitor closely');
    }
  }

  if (metrics.heartRate && (metrics.heartRate > 100 || metrics.heartRate < 60)) {
    alerts.push('Abnormal heart rate detected');
  }

  if (metrics.bloodSugar && (metrics.bloodSugar > 180 || metrics.bloodSugar < 70)) {
    alerts.push('Blood sugar outside normal range - check medication compliance');
  }

  if (metrics.temperature && metrics.temperature > 38.5) {
    alerts.push('Fever detected - monitor for infection');
  }

  return alerts;
}

// AI: Get Health Trends
app.get('/api/ai/care/metrics/trends/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const days = parseInt(req.query.days as string) || 7;
    const metrics = patientMetrics.get(patientId) || [];

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentMetrics = metrics.filter(m => new Date(m.recordedAt) >= cutoffDate);

    const trends = {
      bloodPressure: recentMetrics
        .filter(m => m.bloodPressure)
        .map(m => ({ date: m.recordedAt, ...m.bloodPressure })),
      heartRate: recentMetrics
        .filter(m => m.heartRate)
        .map(m => ({ date: m.recordedAt, value: m.heartRate })),
      bloodSugar: recentMetrics
        .filter(m => m.bloodSugar)
        .map(m => ({ date: m.recordedAt, value: m.bloodSugar })),
      weight: recentMetrics
        .filter(m => m.weight)
        .map(m => ({ date: m.recordedAt, value: m.weight }))
    };

    res.json({
      success: true,
      patientId,
      period: `${days} days`,
      dataPoints: recentMetrics.length,
      trends
    });
  } catch (error) {
    res.status(500).json({ error: 'Trends analysis failed' });
  }
});

// AI: Update Care Plan Status
app.patch('/api/ai/care/plan/:planId/status', async (req, res) => {
  try {
    const { planId } = req.params;
    const { status, notes } = req.body;

    const carePlan = carePlans.get(planId);
    if (!carePlan) {
      return res.status(404).json({ error: 'Care plan not found' });
    }

    carePlan.status = status;
    if (status === 'completed') {
      carePlan.endDate = new Date().toISOString().split('T')[0];
    }

    res.json({
      success: true,
      carePlan,
      aiMessage: `Care plan ${status}. ${notes || ''}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Status update failed' });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CARECODE - Care Manager AI',
    version: '1.0.0',
    port: PORT,
    stats: {
      activePlans: Array.from(carePlans.values()).filter(p => p.status === 'active').length,
      totalPlans: carePlans.size,
      patientsMonitored: patientMetrics.size
    }
  });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              CARECODE - Care Manager AI v1.0.0            ║
║                                                         ║
║  Port: ${PORT}                                               ║
║  Features:                                              ║
║  • Care Plan Creation & Management                       ║
║  • Patient Metrics Monitoring                            ║
║  • Health Trends Analysis                                ║
║  • Follow-up Scheduling                                  ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
