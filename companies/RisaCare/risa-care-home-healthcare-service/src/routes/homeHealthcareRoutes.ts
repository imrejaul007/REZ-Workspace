/**
 * Home Healthcare Service Routes
 */
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as homeHealthcareService from '../services/homeHealthcareService.js';
import {
  CareRequest,
  Caregiver,
  CareVisit,
  CarePlan,
  EquipmentRequest,
  VitalReading,
  Review,
  ServiceType,
  CareLevel,
  RequestStatus,
  VisitStatus,
  EquipmentStatus,
  PlanStatus,
} from '../models/homeHealthcare.js';

const router = Router();

// Helper for async handler errors
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response) => fn(req, res).catch((err: Error) => {
    res.status(500).json({ success: false, error: err.message });
  });

// In-memory storage
const careRequests: Map<string, CareRequest> = new Map();
const caregivers: Map<string, Caregiver> = new Map();
const visits: Map<string, CareVisit> = new Map();
const carePlans: Map<string, CarePlan> = new Map();
const equipmentRequests: Map<string, EquipmentRequest> = new Map();
const vitals: Map<string, VitalReading> = new Map();
const reviews: Map<string, Review> = new Map();

// Seed sample caregivers
const seedCaregivers = () => {
  const sampleCaregivers: Caregiver[] = [
    {
      caregiverId: 'cg001',
      name: 'Priya Sharma',
      services: ['nursing', 'wound_care', 'post_surgery_care'],
      certifications: ['RN', 'BSN', 'Wound Care Certified'],
      experience: 8,
      rating: 4.8,
      totalReviews: 156,
      availability: {
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' },
        saturday: null,
        sunday: null,
      },
      hourlyRate: 800,
      languages: ['Hindi', 'English', 'Marathi'],
      bio: 'Experienced registered nurse specializing in post-operative care and wound management.',
      photoUrl: 'https://example.com/photos/priya.jpg',
      location: { city: 'Mumbai', state: 'Maharashtra', zipCode: '400001' },
      isActive: true,
      createdAt: new Date(),
    },
    {
      caregiverId: 'cg002',
      name: 'Rajesh Kumar',
      services: ['physiotherapy'],
      certifications: ['MPT', 'Sports Physiotherapy'],
      experience: 12,
      rating: 4.9,
      totalReviews: 203,
      availability: {
        monday: { start: '09:00', end: '19:00' },
        tuesday: { start: '09:00', end: '19:00' },
        wednesday: { start: '09:00', end: '19:00' },
        thursday: { start: '09:00', end: '19:00' },
        friday: { start: '09:00', end: '19:00' },
        saturday: { start: '10:00', end: '14:00' },
        sunday: null,
      },
      hourlyRate: 1200,
      languages: ['Hindi', 'English', 'Tamil'],
      bio: 'Master of Physiotherapy with expertise in orthopedic and neurological rehabilitation.',
      photoUrl: 'https://example.com/photos/rajesh.jpg',
      location: { city: 'Chennai', state: 'Tamil Nadu', zipCode: '600001' },
      isActive: true,
      createdAt: new Date(),
    },
    {
      caregiverId: 'cg003',
      name: 'Anita Desai',
      services: ['caregiver', 'companion_care'],
      certifications: ['CNA', 'Elder Care Specialist'],
      experience: 5,
      rating: 4.7,
      totalReviews: 89,
      availability: {
        monday: { start: '07:00', end: '20:00' },
        tuesday: { start: '07:00', end: '20:00' },
        wednesday: { start: '07:00', end: '20:00' },
        thursday: { start: '07:00', end: '20:00' },
        friday: { start: '07:00', end: '20:00' },
        saturday: { start: '07:00', end: '20:00' },
        sunday: { start: '07:00', end: '20:00' },
      },
      hourlyRate: 500,
      languages: ['Hindi', 'English', 'Gujarati'],
      bio: 'Compassionate caregiver specializing in elderly care and companionship.',
      photoUrl: 'https://example.com/photos/anita.jpg',
      location: { city: 'Ahmedabad', state: 'Gujarat', zipCode: '380001' },
      isActive: true,
      createdAt: new Date(),
    },
  ];

  sampleCaregivers.forEach(cg => caregivers.set(cg.caregiverId, cg));
};

// ============== CARE REQUESTS ==============

/**
 * POST /care-requests - Create a new care request
 */
router.post('/care-requests', asyncHandler(async (req: Request, res: Response) => {
  const careRequest: CareRequest = {
    requestId: uuidv4(),
    patientId: req.body.patientId,
    serviceType: req.body.serviceType,
    startDate: new Date(req.body.startDate),
    endDate: new Date(req.body.endDate),
    frequency: req.body.frequency,
    address: req.body.address,
    careLevel: req.body.careLevel,
    status: 'pending',
    diagnosis: req.body.diagnosis,
    specialRequirements: req.body.specialRequirements,
    emergencyContact: req.body.emergencyContact,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  careRequests.set(careRequest.requestId, careRequest);
  res.status(201).json({ success: true, data: careRequest });
}));

/**
 * GET /care-requests/:patientId - Get patient's care requests
 */
router.get('/care-requests/:patientId', asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const requests = Array.from(careRequests.values())
    .filter(r => r.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, data: requests, count: requests.length });
}));

/**
 * GET /care-requests/request/:requestId - Get specific care request
 */
router.get('/care-requests/request/:requestId', asyncHandler(async (req: Request, res: Response) => {
  const request = careRequests.get(req.params.requestId);
  if (!request) {
    return res.status(404).json({ success: false, error: 'Care request not found' });
  }
  res.json({ success: true, data: request });
}));

/**
 * PUT /care-requests/:requestId - Update care request
 */
router.put('/care-requests/:requestId', asyncHandler(async (req: Request, res: Response) => {
  const request = careRequests.get(req.params.requestId);
  if (!request) {
    return res.status(404).json({ success: false, error: 'Care request not found' });
  }

  const updated: CareRequest = {
    ...request,
    ...req.body,
    requestId: request.requestId,
    updatedAt: new Date(),
  };
  careRequests.set(request.requestId, updated);
  res.json({ success: true, data: updated });
}));

/**
 * DELETE /care-requests/:requestId - Cancel care request
 */
router.delete('/care-requests/:requestId', asyncHandler(async (req: Request, res: Response) => {
  const request = careRequests.get(req.params.requestId);
  if (!request) {
    return res.status(404).json({ success: false, error: 'Care request not found' });
  }
  request.status = 'cancelled';
  request.updatedAt = new Date();
  careRequests.set(request.requestId, request);
  res.json({ success: true, message: 'Care request cancelled' });
}));

// ============== CAREGIVERS ==============

/**
 * GET /caregivers - List all caregivers
 */
router.get('/caregivers', asyncHandler(async (req: Request, res: Response) => {
  const allCaregivers = Array.from(caregivers.values()).filter(cg => cg.isActive);
  res.json({ success: true, data: allCaregivers, count: allCaregivers.length });
}));

/**
 * GET /caregivers/search - Search caregivers by service and location
 */
router.get('/caregivers/search', asyncHandler(async (req: Request, res: Response) => {
  const { serviceType, city, state, minRating } = req.query;
  let results = Array.from(caregivers.values()).filter(cg => cg.isActive);

  if (serviceType) {
    results = results.filter(cg => cg.services.includes(serviceType as ServiceType));
  }
  if (city) {
    results = results.filter(cg => cg.location?.city.toLowerCase().includes((city as string).toLowerCase()));
  }
  if (state) {
    results = results.filter(cg => cg.location?.state.toLowerCase().includes((state as string).toLowerCase()));
  }
  if (minRating) {
    results = results.filter(cg => cg.rating >= parseFloat(minRating as string));
  }

  res.json({ success: true, data: results, count: results.length });
}));

/**
 * GET /caregivers/:caregiverId - Get caregiver details
 */
router.get('/caregivers/:caregiverId', asyncHandler(async (req: Request, res: Response) => {
  const caregiver = caregivers.get(req.params.caregiverId);
  if (!caregiver) {
    return res.status(404).json({ success: false, error: 'Caregiver not found' });
  }
  res.json({ success: true, data: caregiver });
}));

// ============== VISITS ==============

/**
 * POST /visits - Create a new visit
 */
router.post('/visits', asyncHandler(async (req: Request, res: Response) => {
  const visit: CareVisit = {
    visitId: uuidv4(),
    requestId: req.body.requestId,
    caregiverId: req.body.caregiverId,
    patientId: req.body.patientId,
    scheduledAt: new Date(req.body.scheduledAt),
    notes: req.body.notes || '',
    vitals: [],
    tasks: req.body.tasks || [],
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  visits.set(visit.visitId, visit);
  res.status(201).json({ success: true, data: visit });
}));

/**
 * GET /visits/:patientId - Get patient's visits
 */
router.get('/visits/:patientId', asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const patientVisits = Array.from(visits.values())
    .filter(v => v.patientId === patientId)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  res.json({ success: true, data: patientVisits, count: patientVisits.length });
}));

/**
 * GET /visits/detail/:visitId - Get visit details with caregiver info
 */
router.get('/visits/detail/:visitId', asyncHandler(async (req: Request, res: Response) => {
  const visit = visits.get(req.params.visitId);
  if (!visit) {
    return res.status(404).json({ success: false, error: 'Visit not found' });
  }

  const caregiver = caregivers.get(visit.caregiverId);
  res.json({
    success: true,
    data: {
      visit,
      caregiver: caregiver ? { caregiverId: caregiver.caregiverId, name: caregiver.name, photoUrl: caregiver.photoUrl } : null,
      patient: { patientId: visit.patientId, name: 'Patient', phone: 'Not available' },
    },
  });
}));

/**
 * PUT /visits/:visitId - Update visit
 */
router.put('/visits/:visitId', asyncHandler(async (req: Request, res: Response) => {
  const visit = visits.get(req.params.visitId);
  if (!visit) {
    return res.status(404).json({ success: false, error: 'Visit not found' });
  }

  const updated: CareVisit = {
    ...visit,
    ...req.body,
    visitId: visit.visitId,
    updatedAt: new Date(),
  };
  visits.set(visit.visitId, updated);
  res.json({ success: true, data: updated });
}));

/**
 * POST /visits/:visitId/start - Start visit
 */
router.post('/visits/:visitId/start', asyncHandler(async (req: Request, res: Response) => {
  const visit = visits.get(req.params.visitId);
  if (!visit) {
    return res.status(404).json({ success: false, error: 'Visit not found' });
  }

  visit.status = 'in_progress';
  visit.startedAt = new Date();
  visit.updatedAt = new Date();
  visits.set(visit.visitId, visit);
  res.json({ success: true, data: visit });
}));

/**
 * POST /visits/:visitId/end - End visit
 */
router.post('/visits/:visitId/end', asyncHandler(async (req: Request, res: Response) => {
  const visit = visits.get(req.params.visitId);
  if (!visit) {
    return res.status(404).json({ success: false, error: 'Visit not found' });
  }

  visit.status = 'completed';
  visit.endedAt = new Date();
  if (visit.startedAt) {
    visit.duration = Math.floor((visit.endedAt.getTime() - new Date(visit.startedAt).getTime()) / (1000 * 60));
  }
  visit.notes = req.body.notes || visit.notes;
  visit.vitals = req.body.vitals || visit.vitals;
  visit.tasks = req.body.tasks || visit.tasks;
  visit.updatedAt = new Date();
  visits.set(visit.visitId, visit);
  res.json({ success: true, data: visit });
}));

// ============== CARE PLANS ==============

/**
 * POST /care-plans - Create care plan
 */
router.post('/care-plans', asyncHandler(async (req: Request, res: Response) => {
  const plan: CarePlan = {
    planId: uuidv4(),
    patientId: req.body.patientId,
    services: req.body.services,
    goals: req.body.goals || [],
    duration: {
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
    },
    caregiverId: req.body.caregiverId,
    status: 'active',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  carePlans.set(plan.planId, plan);
  res.status(201).json({ success: true, data: plan });
}));

/**
 * GET /care-plans/:planId - Get care plan
 */
router.get('/care-plans/:planId', asyncHandler(async (req: Request, res: Response) => {
  const plan = carePlans.get(req.params.planId);
  if (!plan) {
    return res.status(404).json({ success: false, error: 'Care plan not found' });
  }
  res.json({ success: true, data: plan });
}));

/**
 * PUT /care-plans/:planId - Update care plan
 */
router.put('/care-plans/:planId', asyncHandler(async (req: Request, res: Response) => {
  const plan = carePlans.get(req.params.planId);
  if (!plan) {
    return res.status(404).json({ success: false, error: 'Care plan not found' });
  }

  const updated: CarePlan = {
    ...plan,
    ...req.body,
    planId: plan.planId,
    updatedAt: new Date(),
  };
  carePlans.set(plan.planId, updated);
  res.json({ success: true, data: updated });
}));

/**
 * GET /care-plans/:planId/progress - Get care plan progress
 */
router.get('/care-plans/:planId/progress', asyncHandler(async (req: Request, res: Response) => {
  const plan = carePlans.get(req.params.planId);
  if (!plan) {
    return res.status(404).json({ success: false, error: 'Care plan not found' });
  }

  const planVisits = Array.from(visits.values()).filter(v => v.requestId === plan.planId);
  const completedVisits = planVisits.filter(v => v.status === 'completed');
  const totalVisits = planVisits.length;

  const goalProgress = plan.goals.map(goal => ({
    goalId: goal.goalId,
    description: goal.description,
    status: goal.status,
    progress: goal.progress,
  }));

  const nextVisit = planVisits
    .filter(v => v.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  res.json({
    success: true,
    data: {
      plan,
      completedVisits: completedVisits.length,
      totalVisits,
      nextVisit,
      goalProgress,
    },
  });
}));

// ============== EQUIPMENT ==============

/**
 * POST /equipment - Request medical equipment
 */
router.post('/equipment', asyncHandler(async (req: Request, res: Response) => {
  const request: EquipmentRequest = {
    requestId: uuidv4(),
    patientId: req.body.patientId,
    equipmentType: req.body.equipmentType,
    status: 'requested',
    address: req.body.address,
    quantity: req.body.quantity || 1,
    notes: req.body.notes,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  equipmentRequests.set(request.requestId, request);
  res.status(201).json({ success: true, data: request });
}));

/**
 * GET /equipment/:patientId - Get patient's equipment requests
 */
router.get('/equipment/:patientId', asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const requests = Array.from(equipmentRequests.values())
    .filter(r => r.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, data: requests, count: requests.length });
}));

/**
 * PUT /equipment/:requestId - Update equipment request
 */
router.put('/equipment/:requestId', asyncHandler(async (req: Request, res: Response) => {
  const request = equipmentRequests.get(req.params.requestId);
  if (!request) {
    return res.status(404).json({ success: false, error: 'Equipment request not found' });
  }

  const updated: EquipmentRequest = {
    ...request,
    ...req.body,
    requestId: request.requestId,
    updatedAt: new Date(),
  };
  equipmentRequests.set(request.requestId, updated);
  res.json({ success: true, data: updated });
}));

// ============== VITALS ==============

/**
 * POST /vitals - Record vital signs
 */
router.post('/vitals', asyncHandler(async (req: Request, res: Response) => {
  const vital: VitalReading = {
    readingId: uuidv4(),
    patientId: req.body.patientId,
    caregiverId: req.body.caregiverId,
    visitId: req.body.visitId,
    type: req.body.type,
    value: req.body.value,
    unit: req.body.unit,
    recordedAt: new Date(),
    notes: req.body.notes,
  };

  vitals.set(vital.readingId, vital);
  res.status(201).json({ success: true, data: vital });
}));

/**
 * GET /vitals/:patientId - Get patient's vitals history
 */
router.get('/vitals/:patientId', asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const patientVitals = Array.from(vitals.values())
    .filter(v => v.patientId === patientId)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  res.json({ success: true, data: patientVitals, count: patientVitals.length });
}));

/**
 * GET /vitals/:patientId/trends - Get vital trends
 */
router.get('/vitals/:patientId/trends', asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { type, days } = req.query;
  const daysNum = days ? parseInt(days as string) : 30;
  const cutoff = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

  let patientVitals = Array.from(vitals.values())
    .filter(v => v.patientId === patientId && new Date(v.recordedAt) >= cutoff);

  if (type) {
    patientVitals = patientVitals.filter(v => v.type === type);
  }

  // Group by type and calculate trends
  const trendsByType: Record<string, any> = {};
  const grouped = new Map<string, typeof patientVitals>();

  patientVitals.forEach(v => {
    const existing = grouped.get(v.type) || [];
    existing.push(v);
    grouped.set(v.type, existing);
  });

  grouped.forEach((vitalsList, vitalType) => {
    const values = vitalsList.map(v => ({ value: v.value, recordedAt: v.recordedAt }));
    const numValues = values.map(v => v.value);
    trendsByType[vitalType] = {
      type: vitalType,
      values,
      average: numValues.reduce((a, b) => a + b, 0) / numValues.length,
      min: Math.min(...numValues),
      max: Math.max(...numValues),
      unit: vitalsList[0].unit,
    };
  });

  res.json({ success: true, data: trendsByType });
}));

// ============== REVIEWS ==============

/**
 * POST /reviews - Create a review
 */
router.post('/reviews', asyncHandler(async (req: Request, res: Response) => {
  const review: Review = {
    reviewId: uuidv4(),
    caregiverId: req.body.caregiverId,
    patientId: req.body.patientId,
    visitId: req.body.visitId,
    rating: req.body.rating,
    comment: req.body.comment,
    categories: req.body.categories || {
      punctuality: req.body.rating,
      professionalism: req.body.rating,
      careQuality: req.body.rating,
      communication: req.body.rating,
    },
    createdAt: new Date(),
  };

  reviews.set(review.reviewId, review);
  res.status(201).json({ success: true, data: review });
}));

/**
 * GET /reviews/caregiver/:caregiverId - Get caregiver reviews
 */
router.get('/reviews/caregiver/:caregiverId', asyncHandler(async (req: Request, res: Response) => {
  const caregiverReviews = Array.from(reviews.values())
    .filter(r => r.caregiverId === req.params.caregiverId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, data: caregiverReviews, count: caregiverReviews.length });
}));

// Initialize seed data
seedCaregivers();

export default router;
