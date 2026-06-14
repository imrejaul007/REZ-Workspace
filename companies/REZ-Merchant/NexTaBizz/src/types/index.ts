// Industry Types
export enum IndustryType {
  RESTAURANT = 'restaurant',
  HOTEL = 'hotel',
  SALON = 'salon',
  RETAIL = 'retail',
  GYM = 'gym',
  SPA = 'spa',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  REAL_ESTATE = 'real_estate',
  AUTOMOTIVE = 'automotive',
  GROCERY = 'grocery',
  PHARMACY = 'pharmacy',
  FASHION = 'fashion',
  FITNESS = 'fitness',
  OTHER = 'other'
}

// Module Types
export enum ModuleType {
  POS = 'pos',
  INVENTORY = 'inventory',
  STAFF = 'staff',
  LOYALTY = 'loyalty',
  ORDERS = 'orders',
  ANALYTICS = 'analytics',
  REPORTING = 'reporting',
  SETTINGS = 'settings',
  MENU = 'menu',
  KDS = 'kds',
  TABLE_MANAGEMENT = 'table_management',
  DELIVERY = 'delivery',
  RESERVATIONS = 'reservations',
  ROOMS = 'rooms',
  BOOKING = 'booking',
  HOUSEKEEPING = 'housekeeping',
  GATEWAY = 'gateway',
  SPA_BOOKING = 'spa_booking',
  APPOINTMENTS = 'appointments',
  CLIENTS = 'clients',
  TREATMENTS = 'treatments',
  SUPPLIERS = 'suppliers',
  BARCODE = 'barcode',
  DISCOUNTS = 'discounts',
  MEMBERSHIP = 'membership',
  ATTENDANCE = 'attendance',
  CLASSES = 'classes',
  TRAINERS = 'trainers',
  PATIENTS = 'patients',
  APPOINTMENTS_MEDICAL = 'appointments_medical',
  PRESCRIPTIONS = 'prescriptions',
  BILLING_MEDICAL = 'billing_medical',
  PROPERTIES = 'properties',
  LEADS = 'leads',
  VIEWINGS = 'viewings',
  CONTRACTS = 'contracts',
  VEHICLES = 'vehicles',
  SERVICE_HISTORY = 'service_history',
  PARTS = 'parts',
  STUDENTS = 'students',
  COURSES = 'courses',
  ATTENDANCE_EDUCATION = 'attendance_education',
  GRADES = 'grades'
}

// Industry Info
export interface IndustryInfo {
  type: IndustryType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// Module Info
export interface ModuleInfo {
  id: ModuleType;
  name: string;
  description: string;
  icon: string;
  category: 'core' | 'operations' | 'customer' | 'management';
}

// Industry with Modules
export interface IndustryWithModules extends IndustryInfo {
  modules: ModuleInfo[];
  features: IndustryFeatures;
}

export interface IndustryFeatures {
  hasReservations: boolean;
  hasInventory: boolean;
  hasStaff: boolean;
  hasLoyalty: boolean;
  hasBookings: boolean;
  hasMembership: boolean;
  hasDelivery: boolean;
  hasTableManagement: boolean;
}

// Business Model
export interface Location {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Contact {
  phone?: string;
  email?: string;
  website?: string;
}

export interface BusinessStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalStaff: number;
}

export interface Business {
  businessId: string;
  name: string;
  industry: IndustryType;
  modules: ModuleType[];
  settings: Record<string, any>;
  ownerId: string;
  location: Location;
  contact: Contact;
  timezone: string;
  currency: string;
  locale: string;
  isActive: boolean;
  isVerified: boolean;
  stats: BusinessStats;
  createdAt: string;
  updatedAt: string;
}

// Create/Update Business
export interface CreateBusinessData {
  name: string;
  industry: IndustryType;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  timezone?: string;
  currency?: string;
  locale?: string;
  settings?: Record<string, any>;
}

export interface UpdateBusinessData extends Partial<CreateBusinessData> {
  isActive?: boolean;
}

// Pagination
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
}

// Module Response
export interface ModulesResponse {
  enabled: ModuleType[];
  available: ModuleType[];
}

// Analytics
export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export interface RevenueByModule {
  module: string;
  revenue: number;
}

export interface BusinessAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
  topProducts: TopProduct[];
  salesByDay: SalesData[];
  revenueByModule: RevenueByModule[];
}

export interface PlatformAnalytics {
  totalBusinesses: number;
  totalRevenue: number;
  businessesByIndustry: Array<{
    industry: string;
    count: number;
    revenue: number;
  }>;
  topBusinesses: Array<{
    businessId: string;
    name: string;
    revenue: number;
  }>;
  recentGrowth: number;
}

// Query Params
export interface BusinessQueryParams {
  page?: number;
  limit?: number;
  industry?: IndustryType;
  isActive?: boolean;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// Form Data
export interface BusinessFormData {
  name: string;
  industry: IndustryType;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  timezone: string;
  currency: string;
}
