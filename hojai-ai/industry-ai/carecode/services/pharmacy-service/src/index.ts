/**
 * CARECODE - Pharmacy Service
 * Pharmacy inventory, dispensing, and prescription management service
 * "AI That Ensures Every Prescription Is Filled"
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4821;

app.use(express.json());

// ============================================
// TYPES
// ============================================

interface Medication {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  form: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'cream' | 'drops' | 'inhaler' | 'patch';
  manufacturer: string;
  category: string;
  ndc?: string;
  controlled: boolean;
  schedule?: 'II' | 'III' | 'IV' | 'V';
  unitPrice: number;
  stock: number;
  minStock: number;
  expiryDate?: string;
  storage: string;
  sideEffects?: string[];
  interactions?: string[];
}

interface Prescription {
  id: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
  prescriberId: string;
  prescriberName: string;
  status: 'pending' | 'verified' | 'dispensed' | 'cancelled';
  refills: number;
  refillsRemaining: number;
  prescribedDate: string;
  dispensedDate?: string;
  pharmacistId?: string;
  notes?: string;
}

interface DispenseRecord {
  id: string;
  prescriptionId: string;
  medicationId: string;
  medicationName: string;
  quantity: number;
  patientId: string;
  dispensedBy: string;
  dispensedAt: string;
  instructions: string;
}

// ============================================
// IN-MEMORY DATABASE
// ============================================

const medications = new Map<string, Medication>();
const prescriptions = new Map<string, Prescription>();
const dispenseRecords = new Map<string, DispenseRecord>();

// Sample medications
const sampleMedications: Medication[] = [
  { id: 'med-001', name: 'Metformin 500mg', genericName: 'Metformin', strength: '500mg', form: 'tablet', manufacturer: 'GenericPharma', category: 'Antidiabetic', controlled: false, unitPrice: 2.50, stock: 500, minStock: 100, expiryDate: '2027-12-31', storage: 'Room Temperature', sideEffects: ['Nausea', 'Diarrhea'], interactions: ['Contrast dye'] },
  { id: 'med-002', name: 'Amlodipine 5mg', genericName: 'Amlodipine', strength: '5mg', form: 'tablet', manufacturer: 'HeartCare Inc', category: 'Antihypertensive', controlled: false, unitPrice: 3.00, stock: 300, minStock: 50, expiryDate: '2027-06-30', storage: 'Room Temperature', sideEffects: ['Dizziness', 'Swelling'], interactions: ['Simvastatin'] },
  { id: 'med-003', name: 'Omeprazole 20mg', genericName: 'Omeprazole', strength: '20mg', form: 'capsule', manufacturer: 'GastroHealth', category: 'PPI', controlled: false, unitPrice: 4.00, stock: 400, minStock: 80, expiryDate: '2027-09-30', storage: 'Room Temperature', sideEffects: ['Headache', 'Nausea'], interactions: ['Clopidogrel'] },
  { id: 'med-004', name: 'Azithromycin 250mg', genericName: 'Azithromycin', strength: '250mg', form: 'tablet', manufacturer: 'AntibioCorp', category: 'Antibiotic', controlled: false, unitPrice: 8.50, stock: 200, minStock: 40, expiryDate: '2027-03-31', storage: 'Room Temperature', sideEffects: ['Nausea', 'Diarrhea', 'Abdominal pain'], interactions: ['Warfarin', 'Antacids'] },
  { id: 'med-005', name: 'Tramadol 50mg', genericName: 'Tramadol', strength: '50mg', form: 'tablet', manufacturer: 'PainCare', category: 'Analgesic', controlled: true, schedule: 'IV', unitPrice: 5.00, stock: 100, minStock: 20, expiryDate: '2026-12-31', storage: 'Room Temperature', sideEffects: ['Drowsiness', 'Nausea', 'Constipation'], interactions: ['SSRIs', 'MAOIs'] },
  { id: 'med-006', name: 'Lisinopril 10mg', genericName: 'Lisinopril', strength: '10mg', form: 'tablet', manufacturer: 'CardioMed', category: 'ACE Inhibitor', controlled: false, unitPrice: 3.50, stock: 350, minStock: 70, expiryDate: '2027-08-31', storage: 'Room Temperature', sideEffects: ['Dry cough', 'Dizziness'], interactions: ['Potassium supplements', 'NSAIDs'] },
  { id: 'med-007', name: 'Cetirizine 10mg', genericName: 'Cetirizine', strength: '10mg', form: 'tablet', manufacturer: 'Allergy Relief Co', category: 'Antihistamine', controlled: false, unitPrice: 2.00, stock: 600, minStock: 100, expiryDate: '2028-01-31', storage: 'Room Temperature', sideEffects: ['Drowsiness', 'Dry mouth'], interactions: [] },
  { id: 'med-008', name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', strength: '500mg', form: 'capsule', manufacturer: 'AntibioCorp', category: 'Antibiotic', controlled: false, unitPrice: 5.00, stock: 250, minStock: 50, expiryDate: '2027-04-30', storage: 'Room Temperature', sideEffects: ['Nausea', 'Diarrhea', 'Rash'], interactions: ['Warfarin', 'Methotrexate'] }
];

sampleMedications.forEach(m => medications.set(m.id, m));

// ============================================
// UTILITY FUNCTIONS
// ============================================

function checkDrugInteractions(medication: Medication, currentMeds: string[]): string[] {
  const warnings: string[] = [];
  if (!medication.interactions) return warnings;

  currentMeds.forEach(current => {
    if (medication.interactions!.some(interaction =>
      current.toLowerCase().includes(interaction.toLowerCase())
    )) {
      warnings.push(`Potential interaction with ${current}`);
    }
  });

  return warnings;
}

// ============================================
// API ROUTES
// ============================================

/**
 * Get all medications
 */
app.get('/api/medications', (req: Request, res: Response) => {
  try {
    const { category, search, lowStock, controlled } = req.query;
    let result = Array.from(medications.values());

    if (category) {
      result = result.filter(m => m.category.toLowerCase() === String(category).toLowerCase());
    }
    if (search) {
      const searchLower = String(search).toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(searchLower) ||
        m.genericName.toLowerCase().includes(searchLower)
      );
    }
    if (lowStock === 'true') {
      result = result.filter(m => m.stock <= m.minStock);
    }
    if (controlled === 'true') {
      result = result.filter(m => m.controlled);
    }

    res.json({
      success: true,
      medications: result,
      count: result.length
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

    // Get related prescriptions
    const relatedPrescriptions = Array.from(prescriptions.values())
      .filter(p => p.medicationId === req.params.id)
      .slice(0, 10);

    res.json({
      success: true,
      medication,
      relatedPrescriptions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get medication' });
  }
});

/**
 * Update medication stock
 */
app.patch('/api/medications/:id/stock', (req: Request, res: Response) => {
  try {
    const { adjustment, reason } = req.body;
    const medication = medications.get(req.params.id);

    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    const newStock = medication.stock + (adjustment || 0);
    if (newStock < 0) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    medication.stock = newStock;
    medications.set(medication.id, medication);

    console.log(`[${new Date().toISOString()}] Stock adjustment for ${medication.name}: ${adjustment}. Reason: ${reason || 'Manual adjustment'}`);

    res.json({
      success: true,
      medication,
      message: `Stock ${adjustment > 0 ? 'added' : 'reduced'} by ${Math.abs(adjustment)}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

/**
 * Create prescription
 */
app.post('/api/prescriptions', (req: Request, res: Response) => {
  try {
    const { patientId, patientName, medicationId, dosage, frequency, duration, quantity, instructions, prescriberId, prescriberName, refills = 0, notes } = req.body;

    if (!patientId || !medicationId || !dosage || !frequency || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const medication = medications.get(medicationId);
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    const prescriptionId = `RX-${Date.now().toString(36).toUpperCase()}`;

    const prescription: Prescription = {
      id: uuidv4(),
      prescriptionId,
      patientId,
      patientName,
      medicationId,
      medicationName: medication.name,
      dosage,
      frequency,
      duration,
      quantity: quantity || 30,
      instructions: instructions || `Take ${dosage} ${frequency}`,
      prescriberId,
      prescriberName: prescriberName || 'Unknown',
      status: 'pending',
      refills,
      refillsRemaining: refills,
      prescribedDate: new Date().toISOString().split('T')[0],
      notes
    };

    prescriptions.set(prescription.id, prescription);

    res.status(201).json({
      success: true,
      prescription,
      medication: {
        id: medication.id,
        name: medication.name,
        unitPrice: medication.unitPrice,
        estimatedCost: medication.unitPrice * (quantity || 30)
      },
      message: `Prescription ${prescriptionId} created`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

/**
 * Get prescriptions
 */
app.get('/api/prescriptions', (req: Request, res: Response) => {
  try {
    const { patientId, status, prescriberId, medicationId } = req.query;
    let result = Array.from(prescriptions.values());

    if (patientId) result = result.filter(p => p.patientId === patientId);
    if (status) result = result.filter(p => p.status === status);
    if (prescriberId) result = result.filter(p => p.prescriberId === prescriberId);
    if (medicationId) result = result.filter(p => p.medicationId === medicationId);

    result.sort((a, b) => new Date(b.prescribedDate).getTime() - new Date(a.prescribedDate).getTime());

    res.json({
      success: true,
      prescriptions: result,
      count: result.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get prescriptions' });
  }
});

/**
 * Get prescription by ID
 */
app.get('/api/prescriptions/:id', (req: Request, res: Response) => {
  try {
    const prescription = prescriptions.get(req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const medication = medications.get(prescription.medicationId);

    res.json({
      success: true,
      prescription,
      medication,
      warnings: medication ? checkDrugInteractions(medication, []) : []
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get prescription' });
  }
});

/**
 * Verify prescription
 */
app.post('/api/prescriptions/:id/verify', (req: Request, res: Response) => {
  try {
    const prescription = prescriptions.get(req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const medication = medications.get(prescription.medicationId);
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    // Verification checks
    const checks: { name: string; passed: boolean; message: string }[] = [];

    // Stock check
    if (medication.stock < prescription.quantity) {
      checks.push({ name: 'Stock', passed: false, message: `Insufficient stock. Available: ${medication.stock}` });
    } else {
      checks.push({ name: 'Stock', passed: true, message: 'Sufficient stock available' });
    }

    // Expiry check
    if (medication.expiryDate) {
      const expiry = new Date(medication.expiryDate);
      const duration = parseInt(prescription.duration) || 30;
      const neededDate = new Date();
      neededDate.setDate(neededDate.getDate() + duration);

      if (expiry < neededDate) {
        checks.push({ name: 'Expiry', passed: false, message: `Medication expires before prescription ends (${medication.expiryDate})` });
      } else {
        checks.push({ name: 'Expiry', passed: true, message: 'Medication valid for prescription duration' });
      }
    }

    // Controlled substance check
    if (medication.controlled) {
      checks.push({ name: 'Controlled', passed: true, message: `Schedule ${medication.schedule} - requires pharmacist verification` });
    }

    const allPassed = checks.every(c => c.passed);

    if (allPassed) {
      prescription.status = 'verified';
      prescriptions.set(prescription.id, prescription);
    }

    res.json({
      success: allPassed,
      prescription,
      checks,
      message: allPassed ? 'Prescription verified successfully' : 'Prescription verification failed - review checks'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify prescription' });
  }
});

/**
 * Dispense prescription
 */
app.post('/api/prescriptions/:id/dispense', (req: Request, res: Response) => {
  try {
    const { pharmacistId, notes } = req.body;

    const prescription = prescriptions.get(req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    if (prescription.status !== 'verified') {
      return res.status(400).json({ error: 'Prescription must be verified before dispensing' });
    }

    if (prescription.refillsRemaining <= 0 && prescription.refills > 0) {
      return res.status(400).json({ error: 'No refills remaining' });
    }

    const medication = medications.get(prescription.medicationId);
    if (!medication || medication.stock < prescription.quantity) {
      return res.status(400).json({ error: 'Insufficient medication stock' });
    }

    // Update medication stock
    medication.stock -= prescription.quantity;
    medications.set(medication.id, medication);

    // Create dispense record
    const dispenseRecord: DispenseRecord = {
      id: uuidv4(),
      prescriptionId: prescription.prescriptionId,
      medicationId: prescription.medicationId,
      medicationName: prescription.medicationName,
      quantity: prescription.quantity,
      patientId: prescription.patientId,
      dispensedBy: pharmacistId || 'pharmacist',
      dispensedAt: new Date().toISOString(),
      instructions: prescription.instructions
    };

    dispenseRecords.set(dispenseRecord.id, dispenseRecord);

    // Update prescription
    if (prescription.refillsRemaining > 0) {
      prescription.refillsRemaining--;
      prescription.status = 'verified';
    } else {
      prescription.status = 'dispensed';
    }
    prescription.dispensedDate = new Date().toISOString().split('T')[0];
    prescription.pharmacistId = pharmacistId;
    if (notes) prescription.notes = notes;

    prescriptions.set(prescription.id, prescription);

    console.log(`[${new Date().toISOString()}] Dispensed: ${prescription.medicationName} x${prescription.quantity} to ${prescription.patientName}`);

    res.json({
      success: true,
      prescription,
      dispenseRecord,
      remainingStock: medication.stock,
      message: `Dispensed ${prescription.quantity} units of ${prescription.medicationName}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to dispense prescription' });
  }
});

/**
 * Get dispense records
 */
app.get('/api/dispense-records', (req: Request, res: Response) => {
  try {
    const { patientId, medicationId, date, limit = 50 } = req.query;
    let result = Array.from(dispenseRecords.values());

    if (patientId) result = result.filter(r => r.patientId === patientId);
    if (medicationId) result = result.filter(r => r.medicationId === medicationId);
    if (date) result = result.filter(r => r.dispensedAt.startsWith(String(date)));

    result.sort((a, b) => new Date(b.dispensedAt).getTime() - new Date(a.dispensedAt).getTime());

    res.json({
      success: true,
      records: result.slice(0, Number(limit)),
      count: result.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get records' });
  }
});

/**
 * Get low stock alerts
 */
app.get('/api/alerts/low-stock', (req: Request, res: Response) => {
  try {
    const alerts = Array.from(medications.values())
      .filter(m => m.stock <= m.minStock)
      .map(m => ({
        medication: m,
        currentStock: m.stock,
        minStock: m.minStock,
        deficit: m.minStock - m.stock
      }));

    res.json({
      success: true,
      alerts,
      count: alerts.length,
      message: alerts.length > 0 ? `${alerts.length} medications below minimum stock` : 'All medications adequately stocked'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

/**
 * Get expiry alerts
 */
app.get('/api/alerts/expiry', (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + Number(days));

    const alerts = Array.from(medications.values())
      .filter(m => m.expiryDate && new Date(m.expiryDate) <= cutoffDate)
      .map(m => ({
        medication: m,
        expiryDate: m.expiryDate,
        daysUntilExpiry: Math.floor((new Date(m.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    res.json({
      success: true,
      alerts,
      count: alerts.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get expiry alerts' });
  }
});

/**
 * Get pharmacy statistics
 */
app.get('/api/stats', (req: Request, res: Response) => {
  try {
    const allMeds = Array.from(medications.values());
    const allRx = Array.from(prescriptions.values());
    const allDispense = Array.from(dispenseRecords.values());

    const totalRevenue = allDispense.reduce((sum, record) => {
      const med = medications.get(record.medicationId);
      return sum + (med ? med.unitPrice * record.quantity : 0);
    }, 0);

    res.json({
      success: true,
      stats: {
        medications: {
          total: allMeds.length,
          lowStock: allMeds.filter(m => m.stock <= m.minStock).length,
          expiringSoon: allMeds.filter(m => {
            if (!m.expiryDate) return false;
            const daysUntil = Math.floor((new Date(m.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return daysUntil <= 30 && daysUntil >= 0;
          }).length
        },
        prescriptions: {
          total: allRx.length,
          pending: allRx.filter(r => r.status === 'pending').length,
          verified: allRx.filter(r => r.status === 'verified').length,
          dispensed: allRx.filter(r => r.status === 'dispensed').length
        },
        dispensing: {
          totalRecords: allDispense.length,
          today: allDispense.filter(r => r.dispensedAt.startsWith(new Date().toISOString().split('T')[0])).length,
          estimatedRevenue: Math.round(totalRevenue * 100) / 100
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'carecode-pharmacy-service',
    version: '1.0.0',
    port: PORT,
    stats: {
      totalMedications: medications.size,
      totalPrescriptions: prescriptions.size,
      totalDispenseRecords: dispenseRecords.size
    }
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'CARECODE Pharmacy Service',
    description: 'Pharmacy inventory and dispensing management',
    version: '1.0.0',
    endpoints: {
      medications: {
        list: 'GET /api/medications',
        get: 'GET /api/medications/:id',
        updateStock: 'PATCH /api/medications/:id/stock'
      },
      prescriptions: {
        create: 'POST /api/prescriptions',
        list: 'GET /api/prescriptions',
        verify: 'POST /api/prescriptions/:id/verify',
        dispense: 'POST /api/prescriptions/:id/dispense'
      },
      dispenseRecords: 'GET /api/dispense-records',
      alerts: {
        lowStock: 'GET /api/alerts/low-stock',
        expiry: 'GET /api/alerts/expiry'
      },
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
║           CARECODE PHARMACY SERVICE v1.0.0             ║
║                                                         ║
║  Tagline: "AI That Ensures Every Prescription Is Filled"║
║  Port: ${PORT}                                               ║
║                                                         ║
║  Capabilities:                                         ║
║  • Medication Inventory                                ║
║  • Prescription Management                             ║
║  • Dispensing Workflow                                 ║
║  • Stock Alerts                                       ║
║  • Expiry Tracking                                    ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export { app, medications, prescriptions, dispenseRecords };