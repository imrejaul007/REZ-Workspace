/**
 * REZ Mind Pharmacy Service
 * AI-powered pharmacy recommendations and drug interaction checking
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Drug interaction schema
const drugInteractionSchema = new mongoose.Schema({
  drug1: String,
  drug2: String,
  severity: { type: String, enum: ['low', 'moderate', 'high', 'contraindicated'] },
  description: String,
  recommendation: String
});
const DrugInteraction = mongoose.models.DrugInteraction || mongoose.model('DrugInteraction', drugInteractionSchema);

// Prescription schema
const prescriptionSchema = new mongoose.Schema({
  prescriptionId: String,
  patientId: String,
  merchantId: String,
  doctorId: String,
  medications: [{
    drugName: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  diagnosis: String,
  status: { type: String, enum: ['pending', 'verified', 'dispensed', 'completed'] },
  interactions: [{
    drug1: String,
    drug2: String,
    severity: String,
    warning: String
  }],
  createdAt: Date,
  updatedAt: Date
});
const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-mind-pharmacy-service', timestamp: new Date().toISOString() });
});

// Check drug interactions
app.post('/api/interactions/check', async (req: Request, res: Response) => {
  try {
    const { medications } = req.body;
    const interactions = [];
    
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const found = await DrugInteraction.findOne({
          $or: [
            { drug1: medications[i].drugName, drug2: medications[j].drugName },
            { drug1: medications[j].drugName, drug2: medications[i].drugName }
          ]
        });
        if (found) {
          interactions.push({
            drug1: medications[i].drugName,
            drug2: medications[j].drugName,
            severity: found.severity,
            description: found.description,
            recommendation: found.recommendation
          });
        }
      }
    }
    
    res.json({ success: true, data: { interactions, hasInteractions: interactions.length > 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get prescription recommendations
app.post('/api/recommendations', async (req: Request, res: Response) => {
  try {
    const { symptoms, diagnosis, patientHistory } = req.body;
    
    // Mock AI recommendations
    const recommendations = [];
    
    if (symptoms?.includes('fever')) {
      recommendations.push({
        drug: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Every 6 hours',
        reason: 'First-line antipyretic'
      });
    }
    
    if (symptoms?.includes('infection') || symptoms?.includes('bacterial')) {
      recommendations.push({
        drug: 'Amoxicillin',
        dosage: '500mg',
        frequency: 'Every 8 hours',
        reason: 'Broad-spectrum antibiotic'
      });
    }
    
    res.json({ success: true, data: { recommendations } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Verify prescription
app.post('/api/prescriptions/verify', async (req: Request, res: Response) => {
  try {
    const prescription = new Prescription({
      ...req.body,
      status: 'verified',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await prescription.save();
    
    // Check for interactions
    const medications = req.body.medications || [];
    const warnings = [];
    
    if (medications.length > 1) {
      for (let i = 0; i < medications.length; i++) {
        for (let j = i + 1; j < medications.length; j++) {
          warnings.push({
            drug1: medications[i].drugName,
            drug2: medications[j].drugName,
            severity: 'moderate',
            warning: 'Potential interaction - verify with pharmacist'
          });
        }
      }
    }
    
    res.json({ success: true, data: { prescription, warnings } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get prescriptions
app.get('/api/prescriptions/:merchantId', async (req: Request, res: Response) => {
  try {
    const { status, patientId } = req.query;
    const query: any = { merchantId: req.params.merchantId };
    if (status) query.status = status;
    if (patientId) query.patientId = patientId;
    
    const prescriptions = await Prescription.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Drug database search
app.get('/api/drugs/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    // Mock drug database
    const drugs = [
      { name: 'Paracetamol', type: 'Analgesic', dosage: '500mg' },
      { name: 'Amoxicillin', type: 'Antibiotic', dosage: '500mg' },
      { name: 'Omeprazole', type: 'PPI', dosage: '20mg' },
      { name: 'Metformin', type: 'Antidiabetic', dosage: '500mg' },
      { name: 'Amlodipine', type: 'Antihypertensive', dosage: '5mg' }
    ];
    
    const results = q 
      ? drugs.filter(d => d.name.toLowerCase().includes((q as string).toLowerCase()))
      : drugs;
    
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

const PORT = process.env.PORT || 4070;
app.listen(PORT, () => logger.info(`rez-mind-pharmacy-service running on port ${PORT}`));

export default app;
