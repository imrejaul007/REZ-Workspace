/**
 * CARECODE - Pharmacist AI Employee
 * Medication verification, drug interactions, and pharmacy management
 * "AI That Ensures Safe & Accurate Medication"
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4852;

app.use(express.json());

// ============================================
// TYPES
// ============================================

interface Medication {
  id: string;
  name: string;
  genericName?: string;
  strength: string;
  form: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'cream' | 'drops' | 'inhaler';
  manufacturer?: string;
  ndc?: string; // National Drug Code
  rxNorm?: string;
  category: string;
  controlledSubstance: boolean;
  schedule?: 'II' | 'III' | 'IV' | 'V';
  storageConditions?: string;
  shelfLife?: string;
  price?: number;
  inStock: boolean;
  quantity?: number;
}

interface Prescription {
  id: string;
  patientId: string;
  medicationId: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescriberId: string;
  status: 'pending' | 'verified' | 'dispensed' | 'cancelled';
  refills: number;
  refillsRemaining: number;
  prescribedDate: string;
  expiryDate: string;
  notes?: string;
}

interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'severe' | 'moderate' | 'mild';
  description: string;
  recommendation: string;
}

interface SideEffect {
  name: string;
  frequency: 'common' | 'less-common' | 'rare';
  severity: 'mild' | 'moderate' | 'severe';
}

// ============================================
// MEDICATION DATABASE (Sample)
// ============================================

const medications = new Map<string, Medication>();

// Add some common medications
const commonMedications: Medication[] = [
  {
    id: 'med-001',
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    strength: '500mg',
    form: 'tablet',
    manufacturer: 'Generic Pharma',
    category: 'Antidiabetic',
    controlledSubstance: false,
    inStock: true,
    quantity: 500
  },
  {
    id: 'med-002',
    name: 'Amlodipine',
    genericName: 'Amlodipine Besylate',
    strength: '5mg',
    form: 'tablet',
    manufacturer: 'HeartCare Inc',
    category: 'Antihypertensive',
    controlledSubstance: false,
    inStock: true,
    quantity: 300
  },
  {
    id: 'med-003',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    strength: '20mg',
    form: 'capsule',
    manufacturer: 'GastroHealth',
    category: 'Proton Pump Inhibitor',
    controlledSubstance: false,
    inStock: true,
    quantity: 450
  },
  {
    id: 'med-004',
    name: 'Azithromycin',
    genericName: 'Azithromycin',
    strength: '250mg',
    form: 'tablet',
    manufacturer: 'AntibioCorp',
    category: 'Antibiotic',
    controlledSubstance: false,
    inStock: true,
    quantity: 200
  },
  {
    id: 'med-005',
    name: 'Tramadol',
    genericName: 'Tramadol Hydrochloride',
    strength: '50mg',
    form: 'tablet',
    manufacturer: 'PainCare',
    category: 'Analgesic',
    controlledSubstance: true,
    schedule: 'IV',
    inStock: true,
    quantity: 100
  }
];

commonMedications.forEach(med => medications.set(med.id, med));

const prescriptions = new Map<string, Prescription>();

// ============================================
// DRUG INTERACTION DATABASE
// ============================================

const drugInteractions: DrugInteraction[] = [
  {
    drug1: 'Warfarin',
    drug2: 'Aspirin',
    severity: 'severe',
    description: 'Increased risk of bleeding when combined',
    recommendation: 'Avoid combination or monitor INR closely'
  },
  {
    drug1: 'Metformin',
    drug2: 'Contrast Dye',
    severity: 'severe',
    description: 'Risk of lactic acidosis',
    recommendation: 'Hold metformin 48 hours before/after contrast procedures'
  },
  {
    drug1: 'ACE Inhibitors',
    drug2: 'Potassium Supplements',
    severity: 'moderate',
    description: 'Risk of hyperkalemia',
    recommendation: 'Monitor potassium levels regularly'
  },
  {
    drug1: 'SSRI',
    drug2: 'Tramadol',
    severity: 'severe',
    description: 'Risk of serotonin syndrome',
    recommendation: 'Avoid combination or use alternative analgesic'
  },
  {
    drug1: 'Statins',
    drug2: 'Grapefruit',
    severity: 'moderate',
    description: 'Increased statin toxicity',
    recommendation: 'Avoid grapefruit consumption'
  }
];

// ============================================
// AI VERIFICATION ENGINE
// ============================================

interface VerificationResult {
  safe: boolean;
  warnings: string[];
  alerts: string[];
  recommendations: string[];
  drugInteractions: DrugInteraction[];
  allergiesFlagged: string[];
}

function verifyPrescription(
  medicationId: string,
  patientAllergies: string[] = [],
  currentMedications: string[] = []
): VerificationResult {
  const result: VerificationResult = {
    safe: true,
    warnings: [],
    alerts: [],
    recommendations: [],
    drugInteractions: [],
    allergiesFlagged: []
  };

  const medication = medications.get(medicationId);
  if (!medication) {
    result.safe = false;
    result.alerts.push('Medication not found in database');
    return result;
  }

  // Check allergies (basic keyword matching)
  patientAllergies.forEach(allergy => {
    const allergyLower = allergy.toLowerCase();
    if (
      medication.name.toLowerCase().includes(allergyLower) ||
      (medication.genericName && medication.genericName.toLowerCase().includes(allergyLower))
    ) {
      result.allergiesFlagged.push(allergy);
      result.alerts.push(`Patient has documented allergy: ${allergy}`);
      result.safe = false;
    }
  });

  // Check drug interactions
  drugInteractions.forEach(interaction => {
    if (
      medication.name.toLowerCase().includes(interaction.drug1.toLowerCase()) ||
      medication.genericName?.toLowerCase().includes(interaction.drug1.toLowerCase()) ||
      currentMedications.some(cur =>
        cur.toLowerCase().includes(interaction.drug2.toLowerCase()) ||
        cur.toLowerCase().includes(interaction.drug1.toLowerCase())
      )
    ) {
      result.drugInteractions.push(interaction);
      if (interaction.severity === 'severe') {
        result.alerts.push(`SEVERE: ${interaction.description}`);
        result.safe = false;
      } else if (interaction.severity === 'moderate') {
        result.warnings.push(`MODERATE: ${interaction.description}`);
      } else {
        result.warnings.push(`MILD: ${interaction.description}`);
      }
    }
  });

  // Check stock
  if (!medication.inStock) {
    result.warnings.push('Medication out of stock');
  }

  // Generate recommendations
  if (!result.safe) {
    result.recommendations.push('Consult with prescribing physician before dispensing');
  }
  if (result.drugInteractions.some(i => i.severity === 'moderate')) {
    result.recommendations.push('Monitor patient closely for adverse effects');
  }
  if (medication.controlledSubstance) {
    result.recommendations.push('Verify prescriber DEA license for controlled substances');
  }

  return result;
}

// ============================================
// API ROUTES
// ============================================

/**
 * Get all medications
 */
app.get('/api/medications', (req: Request, res: Response) => {
  try {
    const { category, inStock, search } = req.query;
    let result = Array.from(medications.values());

    if (category) {
      result = result.filter(m => m.category.toLowerCase() === String(category).toLowerCase());
    }
    if (inStock !== undefined) {
      result = result.filter(m => m.inStock === (inStock === 'true'));
    }
    if (search) {
      const searchLower = String(search).toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(searchLower) ||
        m.genericName?.toLowerCase().includes(searchLower) ||
        m.category.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      medications: result,
      total: result.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get medications' });
  }
});

/**
 * Get medication by ID
 */
app.get('/api/medications/:id', (req: Request, res: Response) => {
  try {
    const medication = medications.get(req.params.id);
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    // Get related interactions
    const interactions = drugInteractions.filter(i =>
      medication.name.toLowerCase().includes(i.drug1.toLowerCase()) ||
      medication.name.toLowerCase().includes(i.drug2.toLowerCase()) ||
      medication.genericName?.toLowerCase().includes(i.drug1.toLowerCase()) ||
      medication.genericName?.toLowerCase().includes(i.drug2.toLowerCase())
    );

    res.json({
      success: true,
      medication,
      interactions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get medication' });
  }
});

/**
 * Add new medication
 */
app.post('/api/medications', (req: Request, res: Response) => {
  try {
    const medication: Medication = {
      ...req.body,
      id: `med-${uuidv4().slice(0, 8)}`,
      inStock: req.body.inStock ?? true
    };

    medications.set(medication.id, medication);

    res.status(201).json({
      success: true,
      medication,
      message: 'Medication added to pharmacy database'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add medication' });
  }
});

/**
 * Verify prescription (AI-powered)
 */
app.post('/api/prescriptions/verify', (req: Request, res: Response) => {
  try {
    const { medicationId, patientAllergies, currentMedications } = req.body;

    if (!medicationId) {
      return res.status(400).json({ error: 'Medication ID required' });
    }

    const verification = verifyPrescription(
      medicationId,
      patientAllergies || [],
      currentMedications || []
    );

    // Log for audit
    console.log(`[${new Date().toISOString()}] Prescription verification: ${medicationId}`);
    console.log(`  Safe: ${verification.safe}`);
    if (verification.alerts.length > 0) {
      console.log(`  Alerts: ${verification.alerts.join(', ')}`);
    }

    res.json({
      success: true,
      verification,
      message: verification.safe
        ? 'Prescription verified - safe to dispense'
        : 'Prescription flagged - requires pharmacist review'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify prescription' });
  }
});

/**
 * Create new prescription
 */
app.post('/api/prescriptions', (req: Request, res: Response) => {
  try {
    const { patientId, medicationId, dosage, frequency, duration, instructions, prescriberId, refills = 0 } = req.body;

    if (!patientId || !medicationId || !dosage || !frequency || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const medication = medications.get(medicationId);
    if (!medication) {
      return res.status(404).json({ error: 'Medication not in database' });
    }

    const prescription: Prescription = {
      id: `rx-${uuidv4().slice(0, 8)}`,
      patientId,
      medicationId,
      dosage,
      frequency,
      duration,
      instructions: instructions || 'As directed by physician',
      prescriberId,
      status: 'pending',
      refills,
      refillsRemaining: refills,
      prescribedDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    prescriptions.set(prescription.id, prescription);

    res.status(201).json({
      success: true,
      prescription,
      message: 'Prescription created - awaiting verification'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

/**
 * Verify and dispense prescription
 */
app.post('/api/prescriptions/:id/verify', (req: Request, res: Response) => {
  try {
    const prescription = prescriptions.get(req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const verification = verifyPrescription(prescription.medicationId);

    if (verification.safe) {
      prescription.status = 'verified';
      prescriptions.set(prescription.id, prescription);

      res.json({
        success: true,
        prescription,
        verification,
        message: 'Prescription verified successfully'
      });
    } else {
      res.json({
        success: false,
        prescription: { ...prescription, status: 'pending' },
        verification,
        message: 'Verification failed - requires pharmacist intervention',
        requiresReview: true
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify prescription' });
  }
});

/**
 * Dispense prescription
 */
app.post('/api/prescriptions/:id/dispense', (req: Request, res: Response) => {
  try {
    const prescription = prescriptions.get(req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    if (prescription.status !== 'verified') {
      return res.status(400).json({
        error: 'Prescription must be verified before dispensing',
        currentStatus: prescription.status
      });
    }

    if (prescription.refillsRemaining <= 0) {
      return res.status(400).json({ error: 'No refills remaining' });
    }

    prescription.status = 'dispensed';
    prescription.refillsRemaining--;

    // Update medication stock
    const medication = medications.get(prescription.medicationId);
    if (medication && medication.quantity && medication.quantity > 0) {
      medication.quantity--;
      medications.set(medication.id, medication);
    }

    prescriptions.set(prescription.id, prescription);

    res.json({
      success: true,
      prescription,
      message: 'Prescription dispensed successfully',
      refillsRemaining: prescription.refillsRemaining
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to dispense prescription' });
  }
});

/**
 * Get prescriptions for patient
 */
app.get('/api/prescriptions/patient/:patientId', (req: Request, res: Response) => {
  try {
    const { status, active } = req.query;
    const { patientId } = req.params;
    let result = Array.from(prescriptions.values())
      .filter(p => p.patientId === patientId);
    if (status) {
      result = result.filter(p => p.status === status);
    }
    if (active === 'true') {
      result = result.filter(p => p.status !== 'cancelled' && p.refillsRemaining >= 0);
    }

    res.json({
      success: true,
      prescriptions: result
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get prescriptions' });
  }
});

/**
 * Check drug interactions
 */
app.post('/api/interactions/check', (req: Request, res: Response) => {
  try {
    const { drug1, drug2, medications } = req.body;

    let results = drugInteractions;

    if (drug1 && drug2) {
      results = results.filter(i =>
        (i.drug1.toLowerCase().includes(drug1.toLowerCase()) && i.drug2.toLowerCase().includes(drug2.toLowerCase())) ||
        (i.drug1.toLowerCase().includes(drug2.toLowerCase()) && i.drug2.toLowerCase().includes(drug1.toLowerCase()))
      );
    }

    if (medications && Array.isArray(medications)) {
      results = results.filter(i =>
        medications.some(m => m.toLowerCase().includes(i.drug1.toLowerCase()) || m.toLowerCase().includes(i.drug2.toLowerCase()))
      );
    }

    res.json({
      success: true,
      interactions: results,
      severityCounts: {
        severe: results.filter(r => r.severity === 'severe').length,
        moderate: results.filter(r => r.severity === 'moderate').length,
        mild: results.filter(r => r.severity === 'mild').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check interactions' });
  }
});

/**
 * Low stock alert
 */
app.get('/api/inventory/alerts', (req: Request, res: Response) => {
  try {
    const { threshold = 50 } = req.query;
    const alerts: Medication[] = [];

    medications.forEach(med => {
      if (med.quantity && med.quantity < Number(threshold)) {
        alerts.push(med);
      }
    });

    res.json({
      success: true,
      alerts,
      message: alerts.length > 0
        ? `${alerts.length} medications below threshold`
        : 'All medications adequately stocked'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check inventory' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'pharmacist-ai',
    version: '1.0.0',
    port: PORT,
    capabilities: [
      'Medication database management',
      'Drug interaction checking',
      'Prescription verification',
      'Dispensing workflow',
      'Inventory tracking'
    ],
    stats: {
      medicationsInDB: medications.size,
      activePrescriptions: Array.from(prescriptions.values()).filter(p => p.status !== 'cancelled').length,
      verifiedToday: Array.from(prescriptions.values()).filter(p => p.status === 'verified').length
    }
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'CARECODE Pharmacist AI',
    description: 'AI-powered medication verification and pharmacy management',
    version: '1.0.0',
    endpoints: {
      medications: 'GET /api/medications',
      verify: 'POST /api/prescriptions/verify',
      create: 'POST /api/prescriptions',
      dispense: 'POST /api/prescriptions/:id/dispense',
      interactions: 'POST /api/interactions/check',
      inventory: 'GET /api/inventory/alerts'
    }
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              CARECODE PHARMACIST AI v1.0.0             ║
║                                                         ║
║  Tagline: "AI That Ensures Safe & Accurate Medication" ║
║  Port: ${PORT}                                               ║
║                                                         ║
║  Capabilities:                                         ║
║  • Drug Interaction Checking                          ║
║  • Prescription Verification                          ║
║  • Allergen Screening                                 ║
║  • Dispensing Workflow                                ║
║  • Inventory Management                               ║
╚════════════════════════════════════��═════════════════════════╝
  `);
});

export { app, verifyPrescription, medications, prescriptions };
