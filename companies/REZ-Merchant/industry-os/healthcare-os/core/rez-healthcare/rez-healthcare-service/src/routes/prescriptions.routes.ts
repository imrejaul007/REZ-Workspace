import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PharmacyService, CreatePrescriptionInput } from '../services/PharmacyService';
import { logger } from '../config/logger';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();
const pharmacyService = new PharmacyService();

// Apply authentication to all routes - HIPAA requires proper auth for PHI access
router.use(authenticateToken);

// Validation schemas
const createPrescriptionSchema = z.object({
  patientId: z.string().min(1),
  appointmentId: z.string().optional(),
  providerId: z.string().min(1),
  providerName: z.string().min(1),
  medications: z.array(z.object({
    name: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    instructions: z.string().optional(),
    quantity: z.number().min(1),
    refills: z.number().min(0).optional(),
  })).min(1),
  diagnosis: z.string().min(1),
  notes: z.string().optional(),
  pharmacyId: z.string().optional(),
  pharmacyName: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const refillPrescriptionSchema = z.object({
  medicationIndex: z.number().min(0),
});

// Create prescription
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createPrescriptionSchema.parse(req.body);

    const input: CreatePrescriptionInput = {
      ...validatedData,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
    };

    const prescription = await pharmacyService.createPrescription(input);

    res.status(201).json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    } else {
      logger.error('Failed to create prescription', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to create prescription',
      });
    }
  }
});

// Get prescription by ID
router.get('/:prescriptionId', async (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;
    const prescription = await pharmacyService.getPrescriptionById(prescriptionId);

    if (!prescription) {
      res.status(404).json({
        success: false,
        error: 'Prescription not found',
      });
      return;
    }

    res.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    logger.error('Failed to get prescription', { error, prescriptionId: req.params.prescriptionId });
    res.status(500).json({
      success: false,
      error: 'Failed to get prescription',
    });
  }
});

// Get patient prescriptions
router.get('/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { status, page, limit } = req.query;

    const result = await pharmacyService.getPatientPrescriptions(patientId, {
      status: status as unknown,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to get patient prescriptions', { error, patientId: req.params.patientId });
    res.status(500).json({
      success: false,
      error: 'Failed to get patient prescriptions',
    });
  }
});

// Cancel prescription
router.post('/:prescriptionId/cancel', async (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;
    const prescription = await pharmacyService.cancelPrescription(prescriptionId);

    if (!prescription) {
      res.status(404).json({
        success: false,
        error: 'Prescription not found or already cancelled',
      });
      return;
    }

    res.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    logger.error('Failed to cancel prescription', { error, prescriptionId: req.params.prescriptionId });
    res.status(500).json({
      success: false,
      error: 'Failed to cancel prescription',
    });
  }
});

// Refill prescription
router.post('/:prescriptionId/refill', async (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;
    const validatedData = refillPrescriptionSchema.parse(req.body);

    const prescription = await pharmacyService.refillPrescription(
      prescriptionId,
      validatedData.medicationIndex
    );

    if (!prescription) {
      res.status(404).json({
        success: false,
        error: 'Prescription not found or no refills available',
      });
      return;
    }

    res.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    } else {
      logger.error('Failed to refill prescription', { error, prescriptionId: req.params.prescriptionId });
      res.status(500).json({
        success: false,
        error: 'Failed to refill prescription',
      });
    }
  }
});

// Check medication availability
router.get('/inventory/check', async (req: Request, res: Response) => {
  try {
    const { medication, pharmacyId } = req.query;

    if (!medication) {
      res.status(400).json({
        success: false,
        error: 'medication query parameter is required',
      });
      return;
    }

    const availability = await pharmacyService.checkMedicationAvailability(
      medication as string,
      pharmacyId as string | undefined
    );

    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    logger.error('Failed to check medication availability', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to check medication availability',
    });
  }
});

export default router;
