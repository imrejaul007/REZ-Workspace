/**
 * Home Healthcare Service - Core business logic
 */
import { v4 as uuidv4 } from 'uuid';
import {
  CareRequest,
  Caregiver,
  CareVisit,
  CarePlan,
  EquipmentRequest,
  VitalReading,
  Review,
  ServiceType,
  VitalType,
} from '../models/homeHealthcare.js';

// In-memory storage (also duplicated in routes for standalone use)
const careRequests: Map<string, CareRequest> = new Map();
const caregivers: Map<string, Caregiver> = new Map();
const visits: Map<string, CareVisit> = new Map();
const carePlans: Map<string, CarePlan> = new Map();
const equipmentRequests: Map<string, EquipmentRequest> = new Map();
const vitals: Map<string, VitalReading> = new Map();
const reviews: Map<string, Review> = new Map();

// Care request operations
export const createCareRequest = (input: Partial<CareRequest>): CareRequest => {
  const request: CareRequest = {
    requestId: uuidv4(),
    patientId: input.patientId!,
    serviceType: input.serviceType!,
    startDate: new Date(input.startDate!),
    endDate: new Date(input.endDate!),
    frequency: input.frequency!,
    address: input.address!,
    careLevel: input.careLevel!,
    status: 'pending',
    diagnosis: input.diagnosis,
    specialRequirements: input.specialRequirements,
    emergencyContact: input.emergencyContact,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  careRequests.set(request.requestId, request);
  return request;
};

export const getCareRequest = (requestId: string): CareRequest | undefined => {
  return careRequests.get(requestId);
};

export const getPatientCareRequests = (patientId: string): CareRequest[] => {
  return Array.from(careRequests.values())
    .filter(r => r.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const updateCareRequest = (requestId: string, updates: Partial<CareRequest>): CareRequest | undefined => {
  const request = careRequests.get(requestId);
  if (!request) return undefined;
  const updated = { ...request, ...updates, requestId, updatedAt: new Date() };
  careRequests.set(requestId, updated);
  return updated;
};

export const cancelCareRequest = (requestId: string): boolean => {
  const request = careRequests.get(requestId);
  if (!request) return false;
  request.status = 'cancelled';
  request.updatedAt = new Date();
  careRequests.set(requestId, request);
  return true;
};

// Caregiver operations
export const getCaregivers = (filters?: { serviceType?: ServiceType; city?: string; minRating?: number }): Caregiver[] => {
  let results = Array.from(caregivers.values()).filter(cg => cg.isActive);
  if (filters?.serviceType) {
    results = results.filter(cg => cg.services.includes(filters.serviceType));
  }
  if (filters?.city) {
    results = results.filter(cg => cg.location?.city.toLowerCase().includes(filters.city.toLowerCase()));
  }
  if (filters?.minRating) {
    results = results.filter(cg => cg.rating >= filters.minRating!);
  }
  return results;
};

export const getCaregiver = (caregiverId: string): Caregiver | undefined => {
  return caregivers.get(caregiverId);
};

// Visit operations
export const createVisit = (input: Partial<CareVisit>): CareVisit => {
  const visit: CareVisit = {
    visitId: uuidv4(),
    requestId: input.requestId!,
    caregiverId: input.caregiverId!,
    patientId: input.patientId!,
    scheduledAt: new Date(input.scheduledAt!),
    notes: input.notes || '',
    vitals: [],
    tasks: input.tasks || [],
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  visits.set(visit.visitId, visit);
  return visit;
};

export const getVisit = (visitId: string): CareVisit | undefined => {
  return visits.get(visitId);
};

export const getPatientVisits = (patientId: string): CareVisit[] => {
  return Array.from(visits.values())
    .filter(v => v.patientId === patientId)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
};

export const startVisit = (visitId: string): CareVisit | undefined => {
  const visit = visits.get(visitId);
  if (!visit) return undefined;
  visit.status = 'in_progress';
  visit.startedAt = new Date();
  visit.updatedAt = new Date();
  visits.set(visitId, visit);
  return visit;
};

export const endVisit = (visitId: string, data?: { notes?: string; vitals?: any[]; tasks?: any[] }): CareVisit | undefined => {
  const visit = visits.get(visitId);
  if (!visit) return undefined;
  visit.status = 'completed';
  visit.endedAt = new Date();
  if (visit.startedAt) {
    visit.duration = Math.floor((visit.endedAt.getTime() - new Date(visit.startedAt).getTime()) / (1000 * 60));
  }
  if (data?.notes) visit.notes = data.notes;
  if (data?.vitals) visit.vitals = data.vitals;
  if (data?.tasks) visit.tasks = data.tasks;
  visit.updatedAt = new Date();
  visits.set(visitId, visit);
  return visit;
};

// Care plan operations
export const createCarePlan = (input: Partial<CarePlan>): CarePlan => {
  const plan: CarePlan = {
    planId: uuidv4(),
    patientId: input.patientId!,
    services: input.services!,
    goals: input.goals || [],
    duration: {
      startDate: new Date(input.duration!.startDate),
      endDate: new Date(input.duration!.endDate),
    },
    caregiverId: input.caregiverId,
    status: 'active',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  carePlans.set(plan.planId, plan);
  return plan;
};

export const getCarePlan = (planId: string): CarePlan | undefined => {
  return carePlans.get(planId);
};

export const getCarePlanProgress = (planId: string) => {
  const plan = carePlans.get(planId);
  if (!plan) return undefined;

  const planVisits = Array.from(visits.values()).filter(v => v.requestId === planId);
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

  return {
    plan,
    completedVisits: completedVisits.length,
    totalVisits,
    nextVisit,
    goalProgress,
  };
};

// Equipment operations
export const requestEquipment = (input: Partial<EquipmentRequest>): EquipmentRequest => {
  const request: EquipmentRequest = {
    requestId: uuidv4(),
    patientId: input.patientId!,
    equipmentType: input.equipmentType!,
    status: 'requested',
    address: input.address!,
    quantity: input.quantity || 1,
    notes: input.notes,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  equipmentRequests.set(request.requestId, request);
  return request;
};

export const getPatientEquipment = (patientId: string): EquipmentRequest[] => {
  return Array.from(equipmentRequests.values())
    .filter(r => r.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Vitals operations
export const recordVital = (input: Partial<VitalReading>): VitalReading => {
  const vital: VitalReading = {
    readingId: uuidv4(),
    patientId: input.patientId!,
    caregiverId: input.caregiverId,
    visitId: input.visitId,
    type: input.type!,
    value: input.value!,
    unit: input.unit!,
    recordedAt: new Date(),
    notes: input.notes,
  };
  vitals.set(vital.readingId, vital);
  return vital;
};

export const getPatientVitals = (patientId: string, type?: VitalType): VitalReading[] => {
  let result = Array.from(vitals.values())
    .filter(v => v.patientId === patientId)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  if (type) {
    result = result.filter(v => v.type === type);
  }
  return result;
};

export const getVitalTrends = (patientId: string, days: number = 30): Record<string, any> => {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const patientVitals = Array.from(vitals.values())
    .filter(v => v.patientId === patientId && new Date(v.recordedAt) >= cutoff);

  const trendsByType: Record<string, any> = {};
  const grouped = new Map<string, VitalReading[]>();

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

  return trendsByType;
};

// Review operations
export const createReview = (input: Partial<Review>): Review => {
  const review: Review = {
    reviewId: uuidv4(),
    caregiverId: input.caregiverId!,
    patientId: input.patientId!,
    visitId: input.visitId,
    rating: input.rating!,
    comment: input.comment,
    categories: input.categories || {
      punctuality: input.rating!,
      professionalism: input.rating!,
      careQuality: input.rating!,
      communication: input.rating!,
    },
    createdAt: new Date(),
  };
  reviews.set(review.reviewId, review);

  // Update caregiver rating
  const caregiver = caregivers.get(input.caregiverId!);
  if (caregiver) {
    const caregiverReviews = Array.from(reviews.values()).filter(r => r.caregiverId === input.caregiverId);
    const totalRating = caregiverReviews.reduce((sum, r) => sum + r.rating, 0);
    caregiver.rating = totalRating / caregiverReviews.length;
    caregiver.totalReviews = caregiverReviews.length;
    caregivers.set(caregiver.caregiverId, caregiver);
  }

  return review;
};

export const getCaregiverReviews = (caregiverId: string): Review[] => {
  return Array.from(reviews.values())
    .filter(r => r.caregiverId === caregiverId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Seed initial caregivers
export const seedCaregivers = (caregiverList: Caregiver[]): void => {
  caregiverList.forEach(cg => caregivers.set(cg.caregiverId, cg));
};
