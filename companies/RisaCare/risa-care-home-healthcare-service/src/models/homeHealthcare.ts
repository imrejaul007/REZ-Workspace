// Home Healthcare Models
export type ServiceType = 'nursing' | 'physiotherapy' | 'caregiver' | 'medical_equipment' | 'wound_care' | 'iv_therapy' | 'post_surgery_care';
export type CareLevel = 'basic' | 'intermediate' | 'advanced' | 'critical';
export type RequestStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type VisitStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type PlanStatus = 'active' | 'completed' | 'paused' | 'cancelled';
export type EquipmentStatus = 'requested' | 'approved' | 'out_for_delivery' | 'delivered' | 'in_use' | 'return_scheduled' | 'picked_up' | 'cancelled';
export type EquipmentType = 'wheelchair' | 'hospital_bed' | 'oxygen_concentrator' | 'cpap_machine' | 'walker' | 'crutches' | 'commode' | 'patient_lift' | 'nebulizer' | 'traction_kit' | 'other';
export type VitalType = 'blood_pressure_systolic' | 'blood_pressure_diastolic' | 'heart_rate' | 'temperature' | 'respiratory_rate' | 'oxygen_saturation' | 'blood_glucose' | 'weight' | 'height';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface CareRequest {
  requestId: string;
  patientId: string;
  serviceType: ServiceType;
  startDate: Date;
  endDate: Date;
  frequency: { days: DayOfWeek[]; timesPerDay: number; preferredTime: string; };
  address: { street: string; city: string; state: string; zipCode: string; landmark?: string; coordinates?: { latitude: number; longitude: number; }; };
  careLevel: CareLevel;
  status: RequestStatus;
  assignedCaregiverId?: string;
  diagnosis?: string;
  specialRequirements?: string;
  emergencyContact?: { name: string; phone: string; relationship: string; };
  createdAt: Date;
  updatedAt: Date;
}

export interface Caregiver {
  caregiverId: string;
  name: string;
  services: ServiceType[];
  certifications: string[];
  experience: number;
  rating: number;
  totalReviews: number;
  availability: Record<DayOfWeek, { start: string; end: string } | null>;
  hourlyRate: number;
  languages: string[];
  bio: string;
  photoUrl?: string;
  location?: { city: string; state: string; zipCode: string; };
  isActive: boolean;
  createdAt: Date;
}

export interface CareVisit {
  visitId: string;
  requestId: string;
  caregiverId: string;
  patientId: string;
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  notes: string;
  vitals: VitalReading[];
  tasks: VisitTask[];
  patientFeedback?: { rating: number; comment?: string; };
  status: VisitStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface VisitTask {
  taskId: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}

export interface CarePlan {
  planId: string;
  patientId: string;
  services: ServiceType[];
  goals: CareGoal[];
  duration: { startDate: Date; endDate: Date; };
  caregiverId?: string;
  status: PlanStatus;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CareGoal {
  goalId: string;
  description: string;
  targetDate: Date;
  status: 'pending' | 'in_progress' | 'achieved' | 'modified';
  progress: number;
  milestones: Milestone[];
}

export interface Milestone {
  milestoneId: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
}

export interface EquipmentRequest {
  requestId: string;
  patientId: string;
  equipmentType: EquipmentType;
  deliveryDate?: Date;
  pickupDate?: Date;
  status: EquipmentStatus;
  notes?: string;
  address: { street: string; city: string; state: string; zipCode: string; };
  quantity: number;
  duration?: { startDate: Date; endDate: Date; };
  insuranceCovered?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VitalReading {
  readingId: string;
  patientId: string;
  caregiverId?: string;
  visitId?: string;
  type: VitalType;
  value: number;
  unit: string;
  recordedAt: Date;
  notes?: string;
}

export interface Review {
  reviewId: string;
  caregiverId: string;
  patientId: string;
  visitId?: string;
  rating: number;
  comment?: string;
  categories: { punctuality: number; professionalism: number; careQuality: number; communication: number; };
  createdAt: Date;
}

export interface AppointmentReminder {
  reminderId: string;
  visitId: string;
  scheduledFor: Date;
  sentAt?: Date;
  type: 'email' | 'sms' | 'push';
  status: 'pending' | 'sent' | 'failed';
}

export interface CareRequestResponse { request: CareRequest; caregiver?: Caregiver; }
export interface CareVisitResponse { visit: CareVisit; caregiver: Caregiver; patient: { patientId: string; name: string; phone: string; }; }
export interface CarePlanProgress {
  plan: CarePlan;
  completedVisits: number;
  totalVisits: number;
  nextVisit?: CareVisit;
  goalProgress: { goalId: string; description: string; status: string; progress: number; }[];
}
export interface VitalTrend {
  type: VitalType;
  values: { value: number; recordedAt: Date; }[];
  average: number;
  min: number;
  max: number;
  unit: string;
}
