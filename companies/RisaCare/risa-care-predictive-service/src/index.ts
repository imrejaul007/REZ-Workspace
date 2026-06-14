import { logger } from ;
/**
 * RisaCare Predictive Health Engine
 * AI-powered clinical decision support
 *
 * Features:
 * - NEWS2 deterioration scoring
 * - qSOFA sepsis screening
 * - Fall risk assessment
 * - ASCVD cardiovascular risk
 * - Readmission risk prediction
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import { RisaCareEcosystemClient } from '../../risa-care-shared/src/index';

const ecosystem = new RisaCareEcosystemClient({
  hojaiLlmUrl: process.env.LLM_SERVICE_URL || 'http://localhost:4730'
});

const PORT = parseInt(process.env.PORT || '4754', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_predictive';

// Database connection
let dbConnected = false;

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    dbConnected = true;
    logger.info('✅ MongoDB connected for Predictive Service');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    dbConnected = false;
  }
}

// Prediction Log Schema
const PredictionLogSchema = new mongoose.Schema({
  type: String,
  patientId: String,
  score: Number,
  risk: String,
  details: mongoose.Schema.Types.Mixed,
  recommendation: String,
  timestamp: { type: Date, default: Date.now }
});

const PredictionLog = mongoose.model('PredictionLog', PredictionLogSchema);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'predictive-service',
    version: '1.0.0',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// ===== NEWS2 DETERIORATION SCORE =====
// National Early Warning Score 2
app.post('/api/predict/news2', (req, res) => {
  const { respiratoryRate, oxygenSaturation, supplementalOxygen, temperature, systolicBP, diastolicBP, heartRate, consciousness } = req.body;

  let score = 0;
  const details: any = {};

  // Respiratory rate
  if (respiratoryRate <= 8) { score += 3; details.respiratoryRate = { value: respiratoryRate, score: 3 }; }
  else if (respiratoryRate <= 11) { score += 1; details.respiratoryRate = { value: respiratoryRate, score: 1 }; }
  else if (respiratoryRate <= 20) { details.respiratoryRate = { value: respiratoryRate, score: 0 }; }
  else if (respiratoryRate <= 24) { score += 2; details.respiratoryRate = { value: respiratoryRate, score: 2 }; }
  else { score += 3; details.respiratoryRate = { value: respiratoryRate, score: 3 }; }

  // Oxygen saturation
  if (oxygenSaturation <= 91) { score += 3; details.oxygenSaturation = { value: oxygenSaturation, score: 3 }; }
  else if (oxygenSaturation <= 93) { score += 2; details.oxygenSaturation = { value: oxygenSaturation, score: 2 }; }
  else if (oxygenSaturation <= 95) { score += 1; details.oxygenSaturation = { value: oxygenSaturation, score: 1 }; }
  else { details.oxygenSaturation = { value: oxygenSaturation, score: 0 }; }

  // Supplemental oxygen
  if (supplementalOxygen) { score += 2; details.supplementalOxygen = { value: true, score: 2 }; }

  // Systolic BP
  if (systolicBP <= 90) { score += 3; details.systolicBP = { value: systolicBP, score: 3 }; }
  else if (systolicBP <= 100) { score += 2; details.systolicBP = { value: systolicBP, score: 2 }; }
  else if (systolicBP <= 110) { score += 1; details.systolicBP = { value: systolicBP, score: 1 }; }
  else if (systolicBP <= 219) { details.systolicBP = { value: systolicBP, score: 0 }; }
  else { score += 3; details.systolicBP = { value: systolicBP, score: 3 }; }

  // Heart rate
  if (heartRate <= 40) { score += 3; details.heartRate = { value: heartRate, score: 3 }; }
  else if (heartRate <= 50) { score += 1; details.heartRate = { value: heartRate, score: 1 }; }
  else if (heartRate <= 90) { details.heartRate = { value: heartRate, score: 0 }; }
  else if (heartRate <= 110) { score += 1; details.heartRate = { value: heartRate, score: 1 }; }
  else if (heartRate <= 130) { score += 2; details.heartRate = { value: heartRate, score: 2 }; }
  else { score += 3; details.heartRate = { value: heartRate, score: 3 }; }

  // Consciousness
  if (consciousness === 'confused' || consciousness === 'new') { score += 3; details.consciousness = { value: consciousness, score: 3 }; }

  let risk = 'Low';
  if (score >= 7) risk = 'High';
  else if (score >= 5) risk = 'Medium';

  logger.info('NEWS2 calculated', { score, risk });

  res.json({
    success: true,
    score,
    risk,
    details,
    recommendation: score >= 7 ? 'Urgent escalation required' : score >= 5 ? 'Senior review recommended' : 'Continue monitoring'
  });
});

// ===== qSOFA SEPSIS SCREENING =====
app.post('/api/predict/qsofa', (req, res) => {
  const { respiratoryRate, bloodPressure, mentalStatus } = req.body;

  let score = 0;
  const details: any = {};

  if (respiratoryRate >= 22) { score += 1; details.respiratoryRate = true; }
  if (bloodPressure <= 100) { score += 1; details.bloodPressure = true; }
  if (mentalStatus === 'altered') { score += 1; details.mentalStatus = true; }

  const risk = score >= 2 ? 'High risk of sepsis' : score === 1 ? 'Moderate risk' : 'Low risk';

  res.json({ success: true, score, risk, details });
});

// ===== FALL RISK ASSESSMENT (Morse Scale) =====
app.post('/api/predict/fall-risk', (req, res) => {
  const { history, secondary, ambulatory, mobility, mental, visual, medications } = req.body;

  let score = 0;
  const details: any = {};

  if (history) { score += 25; details.history = 25; }
  if (secondary) { score += 15; details.secondary = 15; }
  if (mobility === 'assisted') { score += 15; details.mobility = 15; }
  else if (mobility === 'wheelchair') { score += 30; details.mobility = 30; }
  if (mental === 'forgetful') { score += 15; details.mental = 15; }
  if (visual) { score += 20; details.visual = 20; }
  if (medications >= 4) { score += 20; details.medications = 20; }

  const risk = score >= 45 ? 'High' : score >= 25 ? 'Medium' : 'Low';

  res.json({ success: true, score, risk, details });
});

// ===== ASCVD CARDIOVASCULAR RISK =====
app.post('/api/predict/ascvd', (req, res) => {
  const { age, sex, totalCholesterol, hdlCholesterol, systolicBP, treatment, diabetes, smoker } = req.body;

  // Simplified ASCVD calculation
  const baseRisk = (age - 40) * 0.04 + (sex === 'male' ? 2 : 0);
  const cholRisk = (totalCholesterol - 200) * 0.01;
  const bpRisk = (systolicBP - 120) * 0.02;
  const diabetesRisk = diabetes ? 2 : 0;
  const smokerRisk = smoker ? 1.5 : 0;

  const risk = Math.min(30, Math.max(1, baseRisk + cholRisk + bpRisk + diabetesRisk + smokerRisk));

  res.json({
    success: true,
    risk: Math.round(risk * 10) / 10 + '%',
    recommendation: risk > 10 ? 'Consider statin therapy' : 'Lifestyle modifications recommended'
  });
});

// ===== READMISSION RISK =====
app.post('/api/predict/readmission', (req, res) => {
  const { age, priorAdmission, lengthOfStay, chronicConditions, emergencyAdmit } = req.body;

  let risk = 0;
  if (age > 65) risk += 2;
  if (priorAdmission) risk += 1;
  if (lengthOfStay > 5) risk += 2;
  if (chronicConditions > 3) risk += 2;
  if (emergencyAdmit) risk += 1;

  const probability = Math.min(0.99, risk * 0.15);

  res.json({
    success: true,
    riskScore: risk,
    probability: Math.round(probability * 100) + '%',
    recommendation: probability > 0.5 ? 'High risk - ensure discharge planning' : 'Standard discharge'
  });
});

// ===== AI HEALTH ANALYSIS =====
app.post('/api/predict/analyze', async (req, res) => {
  const { vitals, labResults, symptoms } = req.body;

  const result = await ecosystem.hojai.chat([
    { role: 'system', content: 'You are a medical AI. Analyze patient data and provide clinical insights. Return JSON.' },
    { role: 'user', content: JSON.stringify({ vitals, labResults, symptoms }) }
  ], { temperature: 0.3 });

  if (result.success && result.content) {
    try {
      res.json({ success: true, analysis: JSON.parse(result.content) });
    } catch {
      res.json({ success: true, analysis: { summary: result.content } });
    }
  } else {
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Start server with database connection
async function startServer(): Promise<void> {
  await connectToDatabase();

  app.listen(PORT, () => {
    logger.info(`Predictive Health Engine started on port ${PORT}`);
    logger.info(`Database: ${dbConnected ? 'connected' : 'disconnected'}`);
  });
}

startServer().catch(console.error);

export default app;
