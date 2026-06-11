import { Router, Request, Response } from 'express';
import { Drug, seedDrugs } from '../models/Drug';
import { interactionService } from '../services/interactionService';
import { verificationService } from '../services/verificationService';
import winston from 'winston';

const router = Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

router.get('/drugs/search', async (req: Request, res: Response) => {
  try {
    const { q, category, schedule, limit = 20 } = req.query;

    const query: Record<string, unknown> = {};

    if (q) {
      query.$text = { $search: q as string };
    }

    if (category) {
      query.category = category;
    }

    if (schedule) {
      query.schedule = schedule;
    }

    await seedDrugs();

    const drugs = await Drug.find(query)
      .limit(Number(limit))
      .lean()
      .exec();

    res.json({
      success: true,
      count: drugs.length,
      data: drugs
    });
  } catch (error) {
    logger.error('Error searching drugs:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to search drugs'
    });
  }
});

router.get('/drugs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const drug = await Drug.findById(id).lean().exec();

    if (!drug) {
      return res.status(404).json({
        success: false,
        error: 'Drug not found'
      });
    }

    res.json({
      success: true,
      data: drug
    });
  } catch (error) {
    logger.error('Error getting drug:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get drug'
    });
  }
});

router.post('/interactions/check', async (req: Request, res: Response) => {
  try {
    const { drugIds } = req.body;

    if (!drugIds || !Array.isArray(drugIds) || drugIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 drug IDs are required'
      });
    }

    const result = await interactionService.checkInteractions(drugIds);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error checking interactions:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to check drug interactions'
    });
  }
});

router.post('/prescription/verify', async (req: Request, res: Response) => {
  try {
    const { prescriptionId, patientId, doctorId, doctorName, medications, diagnosis, notes } = req.body;

    if (!patientId || !doctorId || !doctorName || !medications) {
      return res.status(400).json({
        success: false,
        error: 'patientId, doctorId, doctorName, and medications are required'
      });
    }

    let prescription;
    if (prescriptionId) {
      prescription = await verificationService.getPrescription(prescriptionId);
    }

    if (!prescription) {
      prescription = await verificationService.createPrescription({
        prescriptionId,
        patientId,
        doctorId,
        doctorName,
        medications,
        diagnosis,
        notes
      });
    }

    const pharmacistId = req.headers['x-pharmacist-id'] as string;
    const result = await verificationService.verifyPrescription(prescription.prescriptionId, pharmacistId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error verifying prescription:', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify prescription'
    });
  }
});

router.get('/prescriptions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const prescription = await verificationService.getPrescription(id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found'
      });
    }

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    logger.error('Error getting prescription:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get prescription'
    });
  }
});

router.get('/prescriptions/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const prescriptions = await verificationService.getPatientPrescriptions(patientId);

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (error) {
    logger.error('Error getting patient prescriptions:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get prescriptions'
    });
  }
});

router.post('/prescriptions/:id/dispense', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const prescription = await verificationService.dispensePrescription(id);

    res.json({
      success: true,
      message: 'Prescription dispensed successfully',
      data: prescription
    });
  } catch (error) {
    logger.error('Error dispensing prescription:', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to dispense prescription'
    });
  }
});

router.get('/pharmacies/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 5, type = 'all' } = req.query;

    const pharmacies = [
      {
        id: 'pharm-001',
        name: 'Apollo Pharmacy',
        address: '123 Main Street',
        city: 'Mumbai',
        distance: 0.5,
        rating: 4.5,
        isOpen: true,
        services: ['prescription', 'otc', 'delivery'],
        phone: '+91-9876543210'
      },
      {
        id: 'pharm-002',
        name: 'MedPlus',
        address: '456 Park Road',
        city: 'Mumbai',
        distance: 1.2,
        rating: 4.2,
        isOpen: true,
        services: ['prescription', 'otc'],
        phone: '+91-9876543211'
      },
      {
        id: 'pharm-003',
        name: 'Netmeds',
        address: '789 Market Lane',
        city: 'Mumbai',
        distance: 2.0,
        rating: 4.0,
        isOpen: false,
        services: ['prescription', 'otc', 'delivery', 'online'],
        phone: '+91-9876543212'
      },
      {
        id: 'pharm-004',
        name: '1mg Pharmacy',
        address: '321 Health Avenue',
        city: 'Mumbai',
        distance: 3.5,
        rating: 4.3,
        isOpen: true,
        services: ['prescription', 'otc', 'delivery', 'consultation'],
        phone: '+91-9876543213'
      },
      {
        id: 'pharm-005',
        name: 'Pharmeasy',
        address: '555 Wellness Blvd',
        city: 'Mumbai',
        distance: 4.2,
        rating: 4.1,
        isOpen: true,
        services: ['prescription', 'otc', 'delivery', 'online'],
        phone: '+91-9876543214'
      }
    ];

    let filteredPharmacies = pharmacies;
    if (type !== 'all') {
      filteredPharmacies = pharmacies.filter(p =>
        p.services.includes(type as string)
      );
    }

    res.json({
      success: true,
      count: filteredPharmacies.length,
      data: filteredPharmacies
    });
  } catch (error) {
    logger.error('Error finding nearby pharmacies:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to find nearby pharmacies'
    });
  }
});

router.post('/orders', async (req: Request, res: Response) => {
  try {
    const { patientId, prescriptionId, items, pharmacyId, deliveryAddress, notes } = req.body;

    if (!patientId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'patientId and items are required'
      });
    }

    const order = {
      orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      patientId,
      prescriptionId,
      pharmacyId: pharmacyId || 'pharm-001',
      items,
      status: 'pending',
      deliveryAddress,
      notes,
      createdAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000)
    };

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    logger.error('Error creating order:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

export { router as pharmacyRouter };
