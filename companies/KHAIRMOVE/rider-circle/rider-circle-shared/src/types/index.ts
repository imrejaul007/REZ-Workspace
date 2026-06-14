// RiderCircle Shared Types
// These types are used across all RiderCircle services

// ============================================
// Common Types
// ============================================

export interface GeoPoint {
  coordinates: [number, number]; // [lng, lat]
  altitude?: number;
}

export interface Address {
  name?: string;
  address: string;
  landmark?: string;
  coordinates: [number, number];
}

// ============================================
// Rider Types
// ============================================

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  earnedAt: Date;
  description: string;
}

export type RidingStyle = 'commuter' | 'tourer' | 'adventure' | 'sport';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'expert';

export interface RiderProfile {
  _id: string;
  userId: string;
  displayName: string;
  phone: string;
  email?: string;
  avatar?: string;
  bio?: string;

  // SafeQR Data
  safeQRCode: string;
  bloodGroup?: string;
  allergies?: string[];
  medicalNotes?: string;
  emergencyContacts: EmergencyContact[];

  // Riding Profile
  bikes: string[];
  ridingStyle: RidingStyle;
  experience: ExperienceLevel;
  totalRides: number;
  totalDistance: number;

  // Trust & Reputation
  trustScore: number;
  verifiedRides: number;
  badges: Badge[];

  // Location
  homeLocation?: {
    city: string;
    state: string;
    country: string;
    coordinates?: GeoPoint;
  };

  // Stats
  followersCount: number;
  followingCount: number;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Bike Types
// ============================================

export interface ServiceRecord {
  date: Date;
  type: 'regular' | 'repair' | 'upgrade' | 'accident';
  description: string;
  odometer: number;
  cost?: number;
  serviceCenter?: string;
  notes?: string;
}

export interface DocumentMeta {
  number: string;
  issueDate?: Date;
  expiryDate?: Date;
  url?: string;
  verified: boolean;
}

export interface BikePredictions {
  tireReplacementDue?: Date;
  nextServiceDate?: Date;
  insuranceRenewal?: Date;
  pucExpiry?: Date;
  batteryHealthDecline?: Date;
}

export type FuelType = 'petrol' | 'electric' | 'hybrid';

export interface BikeDigitalTwin {
  _id: string;
  riderId: string;
  nickname: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  registrationNumber: string;
  color?: string;

  // Specs
  engineCC: number;
  horsepower?: number;
  torque?: number;
  fuelCapacity: number;
  weight?: number;

  // Profile
  odometer: number;
  fuelType: FuelType;
  avatar?: string;

  // Health
  overallHealth: number;
  tireHealth: { front: number; rear: number; lastReplaced?: Date };
  chainCondition: number;
  brakeHealth: { front: number; rear: number };
  oilCondition: number;
  batteryHealth: number;

  // Documents
  documents: {
    registration: DocumentMeta;
    insurance: DocumentMeta;
    pollution?: DocumentMeta;
  };

  // Predictions
  predictions: BikePredictions;

  // Stats
  totalRides: number;
  totalDistance: number;
  fuelEfficiency: number;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Ride Types
// ============================================

export interface GPSPoint {
  coordinates: [number, number];
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
  accuracy?: number;
}

export interface Waypoint {
  name?: string;
  coordinates: [number, number];
  altitude?: number;
  timestamp?: Date;
  type: 'start' | 'stop' | 'fuel' | 'food' | 'viewpoint' | 'checkpoint' | 'end';
  notes?: string;
  photos?: string[];
}

export interface RideStats {
  distance: number;
  avgSpeed: number;
  maxSpeed: number;
  avgAltitude: number;
  maxAltitude: number;
  minAltitude: number;
  totalAscent: number;
  totalDescent: number;
  movingTime: number;
  stoppedTime: number;
}

export interface RideExpenses {
  fuel: number;
  tolls: number;
  food: number;
  accommodation?: number;
  other: number;
  total: number;
}

export interface RideMemory {
  title?: string;
  story?: string;
  highlights?: string[];
  hashtags?: string[];
  coverImage?: string;
  photos?: string[];
  generatedAt?: Date;
}

export type RideType = 'solo' | 'group' | 'event';
export type RideStatus = 'planned' | 'active' | 'paused' | 'completed' | 'cancelled' | 'aborted';
export type Difficulty = 'easy' | 'moderate' | 'hard' | 'extreme';

export interface Ride {
  _id: string;
  riderId: string;
  bikeId: string;
  title: string;
  description?: string;
  type: RideType;
  groupId?: string;
  eventId?: string;

  // Route
  route: {
    name?: string;
    track: GPSPoint[];
    waypoints: Waypoint[];
    distance: number;
    elevation: { gain: number; loss: number };
    difficulty: Difficulty;
    roadTypes?: string[];
    startLocation: { name?: string; coordinates: [number, number]; address?: string };
    endLocation?: { name?: string; coordinates: [number, number]; address?: string };
  };

  // Timing
  startTime: Date;
  endTime?: Date;
  duration?: number;

  // Stats
  stats: RideStats;

  // Safety
  liveTracking: boolean;
  sosEnabled: boolean;

  // Expenses
  expenses: RideExpenses;

  // Memory
  memory?: RideMemory;

  status: RideStatus;
  isPrivate: boolean;
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Group Types
// ============================================

export interface GroupMember {
  riderId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  status: 'active' | 'pending' | 'blocked';
}

export type GroupType = 'club' | 'chapter' | 'crew' | 'community' | 'brand';

export interface Group {
  _id: string;
  name: string;
  slug: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  type: GroupType;
  focus: string[];
  brand?: string;

  city: string;
  state: string;
  country: string;
  location?: GeoPoint;
  meetingPoint?: {
    name: string;
    address: string;
    coordinates: [number, number];
  };

  ownerId: string;
  members: GroupMember[];
  memberCount: number;

  isPrivate: boolean;
  requiresApproval: boolean;
  minTrustScore: number;

  followersCount: number;
  isVerified: boolean;
  isFeatured: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Event Types
// ============================================

export interface RSVP {
  riderId: string;
  status: 'going' | 'maybe' | 'not_going';
  respondedAt: Date;
  note?: string;
}

export interface CheckIn {
  riderId: string;
  type: 'start' | 'checkpoint' | 'end';
  location?: { coordinates: [number, number]; address?: string };
  timestamp: Date;
  photo?: string;
}

export type EventType = 'ride' | 'meet' | 'rally' | 'track_day' | 'workshop' | 'rally_event';

export interface Event {
  _id: string;
  groupId?: string;
  organizerId: string;
  coOrganizers: string[];
  title: string;
  slug: string;
  description: string;
  type: EventType;
  banner?: string;
  coverImage?: string;

  startTime: Date;
  endTime: Date;
  duration?: number;

  startLocation: Address;
  endLocation?: Address;

  maxParticipants: number;
  currentParticipants: number;
  rsvps: RSVP[];

  minTrustScore: number;
  requiredGear: string[];
  difficulty: string;
  experienceLevel: ExperienceLevel | 'all_levels';

  checkInEnabled: boolean;
  checkIns: CheckIn[];

  fees: {
    amount: number;
    currency: string;
    includes: string[];
  };

  rewards?: {
    points: number;
    badges: string[];
    certificate?: boolean;
  };

  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';

  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SOS Types
// ============================================

export interface Responder {
  riderId: string;
  status: 'pending' | 'acknowledged' | 'responding' | 'arrived' | 'declined';
  respondedAt?: Date;
  arrivedAt?: Date;
  eta?: number;
  message?: string;
}

export type SOSType = 'accident' | 'medical' | 'breakdown' | 'assistance' | 'safety_concern' | 'lost';
export type SOSSeverity = 'low' | 'medium' | 'high' | 'critical';
export type SOSStatus = 'triggered' | 'acknowledged' | 'responding' | 'resolved' | 'cancelled' | 'expired';

export interface SOSEvent {
  _id: string;
  riderId: string;
  rideId?: string;
  bikeId?: string;

  type: SOSType;
  severity: SOSSeverity;
  description?: string;

  location: {
    coordinates: [number, number];
    address?: string;
    altitude?: number;
    accuracy?: number;
  };

  photos?: string[];
  voiceNote?: string;

  responders: Responder[];
  status: SOSStatus;

  notifiedContacts: boolean;
  emergencyServicesNotified: boolean;

  triggeredAt: Date;
  acknowledgedAt?: Date;
  firstResponderAt?: Date;
  resolvedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// API Response Types
// ============================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================
// Configuration Types
// ============================================

export interface SDKConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface RideCircleClient {
  riders: RiderClient;
  bikes: BikeClient;
  rides: RideClient;
  groups: GroupClient;
  events: EventClient;
  sos: SOSClient;
}
