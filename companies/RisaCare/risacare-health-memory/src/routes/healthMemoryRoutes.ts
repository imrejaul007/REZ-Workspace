/**
 * Health Memory API Routes
 *
 * REST API endpoints for health memory operations
 */

import { Router, Request, Response } from 'express';
import { healthMemoryService } from '../services/healthMemoryService.js';
import { ApiResponse, PaginatedResponse } from '../types/index.js';

const router = Router();

// ============================================
// PERSON ROUTES
// ============================================

/**
 * GET /api/health/person
 * Get or create person by CorpID
 */
router.get('/person', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getOrCreatePerson(corpId);
    res.json({
      success: true,
      data: person,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof person>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get person',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/health/person
 * Update person profile
 */
router.put('/person', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const updated = await healthMemoryService.updatePerson(person.id, req.body);
    res.json({
      success: true,
      data: updated,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof updated>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update person',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// MEDICAL REPORTS ROUTES
// ============================================

/**
 * POST /api/health/reports
 * Add a medical report
 */
router.post('/reports', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const report = await healthMemoryService.addMedicalReport(person.id, req.body);
    res.status(201).json({
      success: true,
      data: report,
      message: 'Medical report added successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof report>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add medical report',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/reports
 * Get all medical reports
 */
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const reports = await healthMemoryService.getMedicalReports(person.id, {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      type: req.query.type as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    });

    res.json({
      success: true,
      data: reports,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof reports>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get medical reports',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// MEDICATIONS ROUTES
// ============================================

/**
 * POST /api/health/medications
 * Add a medication
 */
router.post('/medications', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const medication = await healthMemoryService.addMedication(person.id, req.body);
    res.status(201).json({
      success: true,
      data: medication,
      message: 'Medication added successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof medication>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add medication',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/medications
 * Get all medications
 */
router.get('/medications', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const activeOnly = req.query.active === 'true';
    const medications = await healthMemoryService.getMedications(person.id, activeOnly);

    res.json({
      success: true,
      data: medications,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof medications>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get medications',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PATCH /api/health/medications/:id
 * Update medication status
 */
router.patch('/medications/:id', async (req: Request, res: Response) => {
  try {
    const { isActive } = req.body;
    const medication = await healthMemoryService.updateMedicationStatus(req.params.id, isActive);

    if (!medication) {
      return res.status(404).json({
        success: false,
        error: 'Medication not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: medication,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof medication>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update medication',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// SYMPTOMS ROUTES
// ============================================

/**
 * POST /api/health/symptoms
 * Log a symptom
 */
router.post('/symptoms', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const symptom = await healthMemoryService.logSymptom(person.id, req.body);
    res.status(201).json({
      success: true,
      data: symptom,
      message: 'Symptom logged successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof symptom>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to log symptom',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/symptoms
 * Get all symptoms
 */
router.get('/symptoms', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const symptoms = await healthMemoryService.getSymptoms(person.id, {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    });

    res.json({
      success: true,
      data: symptoms,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof symptoms>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get symptoms',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// CONDITIONS ROUTES
// ============================================

/**
 * POST /api/health/conditions
 * Add a condition/diagnosis
 */
router.post('/conditions', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const condition = await healthMemoryService.addCondition(person.id, req.body);
    res.status(201).json({
      success: true,
      data: condition,
      message: 'Condition added successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof condition>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add condition',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/conditions
 * Get all conditions
 */
router.get('/conditions', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const activeOnly = req.query.active === 'true';
    const conditions = await healthMemoryService.getConditions(person.id, activeOnly);

    res.json({
      success: true,
      data: conditions,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof conditions>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get conditions',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// APPOINTMENTS ROUTES
// ============================================

/**
 * POST /api/health/appointments
 * Schedule an appointment
 */
router.post('/appointments', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const appointment = await healthMemoryService.scheduleAppointment(person.id, req.body);
    res.status(201).json({
      success: true,
      data: appointment,
      message: 'Appointment scheduled successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof appointment>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to schedule appointment',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/appointments
 * Get all appointments
 */
router.get('/appointments', async (req: Request, res: Response) => {
 try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const upcoming = req.query.upcoming === 'true';
    const appointments = await healthMemoryService.getAppointments(person.id, upcoming);

    res.json({
      success: true,
      data: appointments,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof appointments>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get appointments',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// ALLERGIES ROUTES
// ============================================

/**
 * POST /api/health/allergies
 * Add an allergy
 */
router.post('/allergies', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const allergy = await healthMemoryService.addAllergy(person.id, req.body);
    res.status(201).json({
      success: true,
      data: allergy,
      message: 'Allergy added successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof allergy>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add allergy',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/allergies
 * Get all allergies
 */
router.get('/allergies', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const allergies = await healthMemoryService.getAllergies(person.id);

    res.json({
      success: true,
      data: allergies,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof allergies>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get allergies',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// WOMEN'S HEALTH ROUTES
// ============================================

/**
 * POST /api/health/menstrual
 * Log menstrual cycle
 */
router.post('/menstrual', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const cycle = await healthMemoryService.logMenstrualCycle(person.id, req.body);
    res.status(201).json({
      success: true,
      data: cycle,
      message: 'Menstrual cycle logged successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof cycle>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to log menstrual cycle',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/menstrual
 * Get menstrual cycles
 */
router.get('/menstrual', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const cycles = await healthMemoryService.getMenstrualCycles(person.id, limit);

    res.json({
      success: true,
      data: cycles,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof cycles>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get menstrual cycles',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/health/pregnancy
 * Create pregnancy record
 */
router.post('/pregnancy', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const pregnancy = await healthMemoryService.createPregnancy(person.id, req.body);
    res.status(201).json({
      success: true,
      data: pregnancy,
      message: 'Pregnancy record created successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof pregnancy>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create pregnancy record',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/pregnancy
 * Get pregnancy records
 */
router.get('/pregnancy', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const pregnancies = await healthMemoryService.getPregnancies(person.id);

    res.json({
      success: true,
      data: pregnancies,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof pregnancies>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get pregnancy records',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/health/fertility
 * Record fertility window
 */
router.post('/fertility', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const window = await healthMemoryService.recordFertilityWindow(person.id, req.body);
    res.status(201).json({
      success: true,
      data: window,
      message: 'Fertility window recorded successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof window>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to record fertility window',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// FAMILY HEALTH ROUTES
// ============================================

/**
 * POST /api/health/family
 * Add family member
 */
router.post('/family', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const member = await healthMemoryService.addFamilyMember(person.id, req.body);
    res.status(201).json({
      success: true,
      data: member,
      message: 'Family member added successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof member>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add family member',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/family
 * Get family members
 */
router.get('/family', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const members = await healthMemoryService.getFamilyMembers(person.id);

    res.json({
      success: true,
      data: members,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof members>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get family members',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// LIFE EVENTS ROUTES
// ============================================

/**
 * POST /api/health/life-events
 * Record life event
 */
router.post('/life-events', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const event = await healthMemoryService.recordLifeEvent(person.id, req.body);
    res.status(201).json({
      success: true,
      data: event,
      message: 'Life event recorded successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof event>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to record life event',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/life-events
 * Get life events
 */
router.get('/life-events', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const events = await healthMemoryService.getLifeEvents(person.id);

    res.json({
      success: true,
      data: events,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof events>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get life events',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// HEALTH TIMELINE & SUMMARY
// ============================================

/**
 * GET /api/health/timeline
 * Get health timeline
 */
router.get('/timeline', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const timeline = await healthMemoryService.getHealthTimeline({
      personId: person.id,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      includeConditions: req.query.includeConditions !== 'false',
      includeMedications: true,
      includeSymptoms: req.query.includeSymptoms !== 'false',
      includeReports: req.query.includeReports !== 'false',
      includeLifeEvents: req.query.includeLifeEvents !== 'false'
    });

    res.json({
      success: true,
      data: timeline,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof timeline>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get health timeline',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/summary
 * Get health summary
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const corpId = req.headers['x-corp-id'] as string;
    if (!corpId) {
      return res.status(401).json({
        success: false,
        error: 'CorpID required',
        timestamp: new Date().toISOString()
      });
    }

    const person = await healthMemoryService.getPersonByCorpId(corpId);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        timestamp: new Date().toISOString()
      });
    }

    const period = (req.query.period as 'week' | 'month' | 'quarter' | 'year' | 'all') || 'month';
    const summary = await healthMemoryService.getHealthSummary(person.id, period);

    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof summary>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get health summary',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;