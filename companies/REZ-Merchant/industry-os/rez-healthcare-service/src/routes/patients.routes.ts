import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PatientService, CreatePatientInput, UpdatePatientInput } from '../services/PatientService';
import { logger } from '../config/logger';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();
const patientService = new PatientService();

// Apply authentication to all routes - HIPAA requires proper auth for PHI access
router.use(authenticateToken);

// Validation schemas
const createPatientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().datetime().or(z.date()),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }).optional(),
  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
    email: z.string().email().optional(),
  }).optional(),
  insurance: z.object({
    provider: z.string(),
    policyNumber: z.string(),
    groupNumber: z.string().optional(),
    expirationDate: z.string().datetime(),
    primaryHolder: z.string().optional(),
  }).optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  preferredLanguage: z.string().optional(),
  userId: z.string().optional(),
});

const updatePatientSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }).optional(),
  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
    email: z.string().email().optional(),
  }).optional(),
  insurance: z.object({
    provider: z.string(),
    policyNumber: z.string(),
    groupNumber: z.string().optional(),
    expirationDate: z.string().datetime(),
    primaryHolder: z.string().optional(),
  }).optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  primaryPhysician: z.string().optional(),
  preferredLanguage: z.string().optional(),
});

// Create patient
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createPatientSchema.parse(req.body);
    const patient = await patientService.createPatient({
      ...validatedData,
      dateOfBirth: new Date(validatedData.dateOfBirth),
    } as CreatePatientInput);

    res.status(201).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    } else {
      logger.error('Failed to create patient', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to create patient',
      });
    }
  }
});

// Get patient by ID
router.get('/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const patient = await patientService.getPatientById(patientId);

    if (!patient) {
      res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
      return;
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    logger.error('Failed to get patient', { error, patientId: req.params.patientId });
    res.status(500).json({
      success: false,
      error: 'Failed to get patient',
    });
  }
});

// Get patient by email
router.get('/email/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const patient = await patientService.getPatientByEmail(decodeURIComponent(email));

    if (!patient) {
      res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
      return;
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    logger.error('Failed to get patient by email', { error, email: req.params.email });
    res.status(500).json({
      success: false,
      error: 'Failed to get patient',
    });
  }
});

// Search patients
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, page, limit } = req.query;
    const result = await patientService.searchPatients({
      search: search as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to search patients', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to search patients',
    });
  }
});

// Update patient
router.put('/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const validatedData = updatePatientSchema.parse(req.body);
    const patient = await patientService.updatePatient(patientId, validatedData as UpdatePatientInput);

    if (!patient) {
      res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
      return;
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    } else {
      logger.error('Failed to update patient', { error, patientId: req.params.patientId });
      res.status(500).json({
        success: false,
        error: 'Failed to update patient',
      });
    }
  }
});

// Give consent
router.post('/:patientId/consent', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { consentGiven = true } = req.body;
    const patient = await patientService.giveConsent(patientId, consentGiven);

    if (!patient) {
      res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
      return;
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    logger.error('Failed to update consent', { error, patientId: req.params.patientId });
    res.status(500).json({
      success: false,
      error: 'Failed to update consent',
    });
  }
});

// Get patient medical summary
router.get('/:patientId/summary', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const summary = await patientService.getPatientMedicalSummary(patientId);

    if (!summary.patient) {
      res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
      return;
    }

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Failed to get patient summary', { error, patientId: req.params.patientId });
    res.status(500).json({
      success: false,
      error: 'Failed to get patient summary',
    });
  }
});

// Deactivate patient
router.delete('/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const success = await patientService.deactivatePatient(patientId);

    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Patient deactivated successfully',
    });
  } catch (error) {
    logger.error('Failed to deactivate patient', { error, patientId: req.params.patientId });
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate patient',
    });
  }
});

export default router;
