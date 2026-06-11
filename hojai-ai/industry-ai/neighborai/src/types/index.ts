/**
 * NEIGHBORAI - Type Definitions
 * TypeScript type definitions for society management
 */

// ============================================
// ENUMS
// ============================================

export enum ResidentStatus {
  OWNER = 'owner',
  TENANT = 'tenant'
}

export enum VisitorStatus {
  PENDING = 'pending',
  CHECKED_IN = 'checked-in',
  CHECKED_OUT = 'checked-out',
  DENIED = 'denied'
}

export enum ComplaintStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum ComplaintPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum MaintenanceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PARTIAL = 'partial'
}

export enum UserRole {
  ADMIN = 'admin',
  RESIDENT = 'resident',
  SECURITY = 'security'
}

// ============================================
// RESIDENT TYPES
// ============================================

export interface IResidentBase {
  name: string;
  phone: string;
  email: string;
  flatNumber: string;
  wing: string;
  familyMembers?: string[];
  vehicleNumbers?: string[];
  status?: ResidentStatus;
  moveInDate?: Date;
  emergencyContact?: string;
}

export interface IResident extends IResidentBase {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResidentCreate extends IResidentBase {}

export interface IResidentUpdate {
  name?: string;
  phone?: string;
  email?: string;
  familyMembers?: string[];
  vehicleNumbers?: string[];
  status?: ResidentStatus;
  emergencyContact?: string;
}

// ============================================
// VISITOR TYPES
// ============================================

export interface IVisitorBase {
  name: string;
  phone: string;
  purpose: string;
  hostFlat: string;
  checkIn?: Date;
  checkOut?: Date;
  status?: VisitorStatus;
  entryCode?: string;
  approvedBy?: string;
}

export interface IVisitor extends IVisitorBase {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVisitorCheckIn {
  name: string;
  phone: string;
  purpose: string;
  hostFlat: string;
}

export interface IVisitorPreApprove {
  flatNumber: string;
  visitorName: string;
  phone: string;
  purpose: string;
}

// ============================================
// COMPLAINT TYPES
// ============================================

export interface IComplaintBase {
  residentId: string;
  flatNumber: string;
  wing?: string;
  category: string;
  description: string;
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: Date;
}

export interface IComplaint extends IComplaintBase {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IComplaintCreate extends IComplaintBase {}

export interface IComplaintUpdate {
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  assignedTo?: string;
  resolution?: string;
}

export interface IComplaintTracking {
  complaintId: string;
  status: string;
  daysOpen: number;
  resolutionStatus: 'on-track' | 'delayed' | 'escalated' | 'resolved' | 'closed';
  isOverdue: boolean;
  timeline: IComplaintTimelineEntry[];
}

export interface IComplaintTimelineEntry {
  status: string;
  timestamp: Date;
  message: string;
}

// ============================================
// MAINTENANCE TYPES
// ============================================

export interface IMaintenanceBase {
  residentId: string;
  flatNumber: string;
  wing?: string;
  category: string;
  description?: string;
  amount: number;
  dueDate: Date;
  status?: MaintenanceStatus;
  paidAt?: Date;
  paidAmount?: number;
  month?: string;
}

export interface IMaintenance extends IMaintenanceBase {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMaintenanceRequest {
  residentId: string;
  flatNumber: string;
  wing?: string;
  category: string;
  description?: string;
  amount?: number;
  dueDate: Date;
}

export interface IMaintenanceBill {
  flatNumber: string;
  wing?: string;
  amount: number;
  dueDate: Date;
  category?: string;
}

export interface IMaintenancePayment {
  paidAmount: number;
}

// ============================================
// EVENT TYPES
// ============================================

export interface IEventBase {
  title: string;
  date: Date;
  time?: string;
  venue?: string;
  description: string;
  attendees?: string[];
  organizer?: string;
}

export interface IEvent extends IEventBase {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventCreate extends IEventBase {}

export interface IEventUpdate {
  title?: string;
  date?: Date;
  time?: string;
  venue?: string;
  description?: string;
  organizer?: string;
}

export interface IEventRSVP {
  flatNumber: string;
  rsvp: 'yes' | 'no';
}

// ============================================
// USER TYPES
// ============================================

export interface IUserBase {
  email: string;
  password: string;
  role?: UserRole;
  flatNumber?: string;
  name: string;
}

export interface IUser extends IUserBase {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILogin {
  email: string;
  password: string;
}

export interface IRegister extends IUserBase {}

export interface IAuthResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    flatNumber?: string;
  };
  token: string;
  message: string;
}

// ============================================
// AI EMPLOYEE TYPES
// ============================================

export interface IAIMployee {
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  capabilities: string[];
  description: string;
}

export interface IAIStatus {
  active: boolean;
  version: string;
  service: string;
  timestamp: string;
  aiEmployees: {
    societyManager: IAIMployee;
    visitorAgent: IAIMployee;
    complaintAgent: IAIMployee;
    communityAgent: IAIMployee;
  };
  totalAiEmployees: number;
  uptime: number;
}

export interface ISocietyQuery {
  flatNumber?: string;
  query: string;
}

export interface IVisitorPreApproveResult {
  success: boolean;
  visitor: IVisitor;
  host: { name: string; phone: string } | null;
  message: string;
  instructions: string[];
}

export interface IComplaintStats {
  summary: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  resolutionRate: string;
}

export interface IEventAnalytics {
  summary: {
    upcomingEvents: number;
    pastEventsLast30Days: number;
    totalRsvpsLast30Days: number;
    averageAttendance: number;
  };
  message: string;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface IDashboardAnalytics {
  overview: {
    totalResidents: number;
    owners: number;
    tenants: number;
    totalFlats: number;
  };
  visitors: {
    todayCount: number;
    currentlyInside: number;
    pendingApproval: number;
  };
  complaints: {
    open: number;
    inProgress: number;
    resolved: number;
    total: number;
    resolutionRate: string;
  };
  maintenance: {
    pending: number;
    overdue: number;
    pendingRevenue: number;
    collectedRevenue: number;
  };
  events: {
    upcoming: number;
  };
  revenue: {
    collected: number;
    pending: number;
    growth: string;
  };
  breakdown: {
    complaintsByCategory: Array<{ category: string; count: number }>;
    overdueByCategory: Array<{ category: string; total: number; count: number }>;
    residentsByWing: Array<{ wing: string; count: number }>;
  };
  recentActivity: {
    complaints: IComplaint[];
    visitors: IVisitor[];
  };
  aiStatus: {
    societyManager: { status: string; queriesToday: number };
    visitorAgent: { status: string; visitorsProcessed: number };
    complaintAgent: { status: string; openComplaints: number };
    communityAgent: { status: string; upcomingEvents: number };
  };
  timestamp: string;
}

export interface IResidentAnalytics {
  total: number;
  owners: number;
  tenants: number;
  residentsWithVehicles: number;
  ownershipRatio: string;
  byWing: Array<{ wing: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
}

export interface IVisitorAnalytics {
  today: number;
  last7Days: number;
  last30Days: number;
  averagePerDay: string;
  byStatus: Array<{ status: string; count: number }>;
  byPurpose: Array<{ purpose: string; count: number }>;
  peakHours: Array<{ hour: string; visits: number }>;
  topVisitedFlats: Array<{ flat: string; visits: number }>;
}

export interface IComplaintAnalytics {
  summary: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  resolutionRate: string;
  avgResolutionDays: string;
  byPriority: Array<{ priority: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  slaCompliance: {
    urgentOverdue: number;
    highOverdue: number;
  };
}

export interface IMaintenanceAnalytics {
  summary: {
    pending: number;
    overdue: number;
    paid: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growth: string;
  };
  byStatus: Array<{ status: string; total: number; count: number }>;
  pendingAmount: number;
  overdueAmount: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  timestamp?: string;
}

export interface IPaginatedResponse<T = any> extends IApiResponse<T> {
  total: number;
  page: number;
  pages: number;
}

export interface IHealthResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
  port: number;
  environment: string;
  uptime: number;
  mongo: 'connected' | 'disconnected';
  aiEmployees: Array<{ name: string; status: string }>;
  stats: {
    totalResidents: number;
    visitorsToday: number;
    openComplaints: number;
    pendingMaintenance: number;
  };
  timestamp: string;
}

// ============================================
// WEBHOOK TYPES
// ============================================

export interface IWebhookPayload {
  event: string;
  payload: any;
  source: string;
  timestamp?: string;
}

export interface IHOJAISyncPayload {
  entityType: string;
  action: string;
  source: string;
  data: any;
  timestamp: string;
}

// ============================================
// CONFIG TYPES
// ============================================

export interface IConfig {
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  nodeEnv: string;
  corsOrigin: string;
  logLevel: string;
  internalServiceToken: string;
  webhookServiceUrl: string;
  hojaiUrl: string;
  notificationServiceUrl: string;
}

// ============================================
// EXPORTS
// ============================================

export type {
  IResidentBase,
  IResident,
  IResidentCreate,
  IResidentUpdate,
  IVisitorBase,
  IVisitor,
  IVisitorCheckIn,
  IVisitorPreApprove,
  IComplaintBase,
  IComplaint,
  IComplaintCreate,
  IComplaintUpdate,
  IComplaintTracking,
  IComplaintTimelineEntry,
  IMaintenanceBase,
  IMaintenance,
  IMaintenanceRequest,
  IMaintenanceBill,
  IMaintenancePayment,
  IEventBase,
  IEvent,
  IEventCreate,
  IEventUpdate,
  IEventRSVP,
  IUserBase,
  IUser,
  ILogin,
  IRegister,
  IAuthResponse,
  IAIMployee,
  IAIStatus,
  ISocietyQuery,
  IVisitorPreApproveResult,
  IComplaintStats,
  IEventAnalytics,
  IDashboardAnalytics,
  IResidentAnalytics,
  IVisitorAnalytics,
  IComplaintAnalytics,
  IMaintenanceAnalytics,
  IApiResponse,
  IPaginatedResponse,
  IHealthResponse,
  IWebhookPayload,
  IHOJAISyncPayload,
  IConfig
};
