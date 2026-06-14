import { z } from 'zod';

// ============== INDUSTRY TYPES ==============

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

export enum ModuleType {
  // Common modules
  POS = 'pos',
  INVENTORY = 'inventory',
  STAFF = 'staff',
  LOYALTY = 'loyalty',
  ORDERS = 'orders',
  ANALYTICS = 'analytics',
  REPORTING = 'reporting',
  SETTINGS = 'settings',

  // Restaurant specific
  MENU = 'menu',
  KDS = 'kds',
  TABLE_MANAGEMENT = 'table_management',
  DELIVERY = 'delivery',
  RESERVATIONS = 'reservations',

  // Hotel specific
  ROOMS = 'rooms',
  BOOKING = 'booking',
  HOUSEKEEPING = 'housekeeping',
  GATEWAY = 'gateway',
  SPA_BOOKING = 'spa_booking',

  // Salon specific
  APPOINTMENTS = 'appointments',
  BOOKING = 'booking',
  CLIENTS = 'clients',
  TREATMENTS = 'treatments',

  // Retail specific
  SUPPLIERS = 'suppliers',
  BARCODE = 'barcode',
  DISCOUNTS = 'discounts',

  // Gym/Fitness specific
  MEMBERSHIP = 'membership',
  ATTENDANCE = 'attendance',
  CLASSES = 'classes',
  TRAINERS = 'trainers',

  // Healthcare specific
  PATIENTS = 'patients',
  APPOINTMENTS_MEDICAL = 'appointments_medical',
  PRESCRIPTIONS = 'prescriptions',
  BILLING_MEDICAL = 'billing_medical',

  // Real Estate specific
  PROPERTIES = 'properties',
  LEADS = 'leads',
  VIEWINGS = 'viewings',
  CONTRACTS = 'contracts',

  // Automotive specific
  VEHICLES = 'vehicles',
  SERVICE_HISTORY = 'service_history',
  PARTS = 'parts',

  // Education specific
  STUDENTS = 'students',
  COURSES = 'courses',
  ATTENDANCE_EDUCATION = 'attendance_education',
  GRADES = 'grades'
}

// ============== INDUSTRY MODULE CONFIG ==============

export const INDUSTRY_MODULES: Record<IndustryType, ModuleType[]> = {
  [IndustryType.RESTAURANT]: [
    ModuleType.MENU,
    ModuleType.POS,
    ModuleType.KDS,
    ModuleType.INVENTORY,
    ModuleType.STAFF,
    ModuleType.LOYALTY,
    ModuleType.ORDERS,
    ModuleType.TABLE_MANAGEMENT,
    ModuleType.DELIVERY,
    ModuleType.RESERVATIONS,
    ModuleType.ANALYTICS,
    ModuleType.REPORTING,
    ModuleType.SETTINGS
  ],
  [IndustryType.HOTEL]: [
    ModuleType.ROOMS,
    ModuleType.BOOKING,
    ModuleType.HOUSEKEEPING,
    ModuleType.POS,
    ModuleType.RESTAFF,
    ModuleType.LOYALTY,
    ModuleType.INVENTORY,
    ModuleType.GATEWAY,
    ModuleType.SPA_BOOKING,
    ModuleType.ANALYTICS,
    ModuleType.REPORTING,
    ModuleType.SETTINGS
  ],
  [IndustryType.SALON]: [
    ModuleType.APPOINTMENTS,
    ModuleType.POS,
    ModuleType.INVENTORY,
    ModuleType.STAFF,
    ModuleType.LOYALTY,
    ModuleType.BOOKING,
    ModuleType.CLIENTS,
    ModuleType.TREATMENTS,
    ModuleType.ANALYTICS,
    ModuleType.REPORTING,
    ModuleType.SETTINGS
  ],
  [IndustryType.RETAIL]: [
    ModuleType.POS,
    ModuleType.INVENTORY,
    ModuleType.STAFF,
    ModuleType.LOYALTY,
    ModuleType.ORDERS,
    ModuleType.SUPPLIERS,
    ModuleType.BARCODE,
    ModuleType.DISCOUNTS,
    ModuleType.ANALYTICS,
    ModuleType.REPORTING,
    ModuleType.SETTINGS
  ],
  [IndustryType.GYM]: [
    ModuleType.MEMBERSHIP,
    ModuleType.ATTENDANCE,
    ModuleType.CLASSES,
    ModuleType.STAFF,
    ModuleType.INVENTORY,
    ModuleType.POS,
    ModuleType.LOYALTY,
    ModuleType.TRAINERS,
    ModuleType.ANALYTICS,
    ModuleType.REPORTING,
    ModuleType.SETTINGS
  ],
  [IndustryType.SPA]: [
    ModuleType.APPOINTMENTS,
    ModuleType.POS,
    ModuleType.INVENTORY,
    ModuleType.STAFF,
    ModuleType.LOYALTY,
    ModuleType.BOOKING,
    ModuleType.CLIENTS,
    ModuleType.TREATMENTS,
    ModuleType.ANALYTICS,
    ModuleType.REPORTING,
    ModuleType.SETTINGS
  ],
  [IndustryType.HEALTHCARE]: [
    ModuleType.PATIENTS,
    ModuleType.APPOINTMENTS_MEDICAL,
    ModuleType.PRESCRIPTIONS,
    ModuleType.BILLING_MEDICAL,
    ModuleType.STAFF,
    ModuleType.INVENTORY,
    ModuleType.POS,
    ModuleType.LOYALTY,
    ModuleType.ANALYTICS,
    ModuleType.REPORTING,
    ModuleType.SETTINGS
  ],
  [IndustryType.EDUCATION]: [
    ModuleType.STUDENTS,
    ModuleType.COURSES,
    ModuleType.ATTENDANCE_EDUCATION,
    ModuleType.GRADES,
    ModuleType.STAFF,
    ModuleType.POS,
    ModuleType.LOYALTY,
    ModuleType.ANALYTICS,
    ModuleType.REPORTING,
    ModuleType.SETTINGS
  ],
  [IndustryType.REAL_ESTATE]: [
    ModuleType.PROPERTIES,
    ModuleType.LEADS,
    ModuleType.VIEWINGS,
    ModuleType.CONTRACTS,
    ModuleType.STAFF,
    ModuleType.POS,
    ModuleType.LOYALTY,
    ModuleType.ANALYTICS,
    ModuleType.REPORTING,
    ModuleType.SETTINGS
  ],
  [IndustryType.AUTOMOTIVE]: [
    ModuleType.VEHICLES,
    ModuleType.SERVICE_HISTORY,
    ModuleType.PARTS,
    ModuleType.STAFF,
    ModuleType.POS,
    ModuleType.INVENTORY,
    ModuleType.LOYALTY,
    ModuleType.ANALYTICS,
    ModuleType.REPORTING,
    ModuleType.SETTINGS
  ],
  [IndustryType.GROCERY]: [
    ModuleType.POS,
    ModuleType.INVENTORY,
    ModuleType.STAFF,
    ModuleType.LOYALTY,
    ModuleType.ORDERS,
    ModuleType.SUPPLIERS,
    ModuleType.BARCODE,
    ModuleType.DISCOUNTS,
    ModuleType.ANALYTICS,
    ModuleType.REPORTING,
    ModuleType.SETTINGS
  ],
  [IndustryType.PHARMACY]: [
    ModuleType.POS,
    ModuleType.INVENTORY,
    ModuleType.STAFF,
    ModuleType.LOYALTY,
    ModuleType.PRESCRIPTIONS,
    ModuleType.SUPPLIERS,
    ModuleType.ANALYTICS,
    ModuleType.REPORTING,
    ModuleType.SETTINGS
  ],
  [IndustryType.FASHION]: [
    ModuleType.POS,
    ModuleType.INVENTORY,
    ModuleType.STAFF,
    ModuleType.LOYALTY,
    ModuleType.ORDERS,
    ModuleType.SUPPLIERS,
    ModuleType.BARCODE,
    ModuleType.DISCOUNTS,
    ModuleType.CLIENTS,
    ModuleType.ANALYTICS,
    ModuleType.REPORTING,
    ModuleType.SETTINGS
  ],
  [IndustryType.FITNESS]: [
    ModuleType.MEMBERSHIP,
    ModuleType.ATTENDANCE,
    ModuleType.CLASSES,
    ModuleType.STAFF,
    ModuleType.INVENTORY,
    ModuleType.POS,
    ModuleType.LOYALTY,
    ModuleType.TRAINERS,
    ModuleType.CLIENTS,
    ModuleType.ANALYTICS,
    ModuleType.REPORTING,
    ModuleType.SETTINGS
  ],
  [IndustryType.OTHER]: [
    ModuleType.POS,
    ModuleType.INVENTORY,
    ModuleType.STAFF,
    ModuleType.LOYALTY,
    ModuleType.ORDERS,
    ModuleType.ANALYTICS,
    ModuleType.REPORTING,
    ModuleType.SETTINGS
  ]
};

// Fix the typo in hotel modules
INDUSTRY_MODULES[IndustryType.HOTEL] = [
  ModuleType.ROOMS,
  ModuleType.BOOKING,
  ModuleType.HOUSEKEEPING,
  ModuleType.POS,
  ModuleType.STAFF,
  ModuleType.LOYALTY,
  ModuleType.INVENTORY,
  ModuleType.GATEWAY,
  ModuleType.SPA_BOOKING,
  ModuleType.ANALYTICS,
  ModuleType.REPORTING,
  ModuleType.SETTINGS
];

// ============== MODULE INFO ==============

export interface ModuleInfo {
  id: ModuleType;
  name: string;
  description: string;
  icon: string;
  category: 'core' | 'operations' | 'customer' | 'management';
}

export const MODULE_INFO: Record<ModuleType, ModuleInfo> = {
  [ModuleType.POS]: {
    id: ModuleType.POS,
    name: 'Point of Sale',
    description: 'Process sales, manage transactions, and handle payments',
    icon: '💳',
    category: 'core'
  },
  [ModuleType.INVENTORY]: {
    id: ModuleType.INVENTORY,
    name: 'Inventory Management',
    description: 'Track stock levels, manage suppliers, and automate reordering',
    icon: '📦',
    category: 'operations'
  },
  [ModuleType.STAFF]: {
    id: ModuleType.STAFF,
    name: 'Staff Management',
    description: 'Manage employees, schedules, time tracking, and payroll',
    icon: '👥',
    category: 'management'
  },
  [ModuleType.LOYALTY]: {
    id: ModuleType.LOYALTY,
    name: 'Loyalty Program',
    description: 'Create and manage customer loyalty programs and rewards',
    icon: '🎁',
    category: 'customer'
  },
  [ModuleType.ORDERS]: {
    id: ModuleType.ORDERS,
    name: 'Order Management',
    description: 'Track and manage orders from creation to fulfillment',
    icon: '📋',
    category: 'operations'
  },
  [ModuleType.ANALYTICS]: {
    id: ModuleType.ANALYTICS,
    name: 'Analytics Dashboard',
    description: 'View business insights, reports, and performance metrics',
    icon: '📊',
    category: 'management'
  },
  [ModuleType.REPORTING]: {
    id: ModuleType.REPORTING,
    name: 'Reporting',
    description: 'Generate detailed reports on sales, inventory, and more',
    icon: '📈',
    category: 'management'
  },
  [ModuleType.SETTINGS]: {
    id: ModuleType.SETTINGS,
    name: 'Settings',
    description: 'Configure business settings and preferences',
    icon: '⚙️',
    category: 'management'
  },
  [ModuleType.MENU]: {
    id: ModuleType.MENU,
    name: 'Menu Management',
    description: 'Create and manage restaurant menus and items',
    icon: '🍽️',
    category: 'core'
  },
  [ModuleType.KDS]: {
    id: ModuleType.KDS,
    name: 'Kitchen Display System',
    description: 'Manage kitchen orders and preparation workflow',
    icon: '👨‍🍳',
    category: 'operations'
  },
  [ModuleType.TABLE_MANAGEMENT]: {
    id: ModuleType.TABLE_MANAGEMENT,
    name: 'Table Management',
    description: 'Manage restaurant tables, reservations, and seating',
    icon: '🪑',
    category: 'operations'
  },
  [ModuleType.DELIVERY]: {
    id: ModuleType.DELIVERY,
    name: 'Delivery Management',
    description: 'Handle delivery orders and driver assignments',
    icon: '🚚',
    category: 'operations'
  },
  [ModuleType.RESERVATIONS]: {
    id: ModuleType.RESERVATIONS,
    name: 'Reservations',
    description: 'Manage customer reservations and bookings',
    icon: '📅',
    category: 'customer'
  },
  [ModuleType.ROOMS]: {
    id: ModuleType.ROOMS,
    name: 'Room Management',
    description: 'Manage hotel rooms, availability, and pricing',
    icon: '🛏️',
    category: 'core'
  },
  [ModuleType.BOOKING]: {
    id: ModuleType.BOOKING,
    name: 'Booking System',
    description: 'Handle bookings and reservations for rooms or services',
    icon: '📖',
    category: 'core'
  },
  [ModuleType.HOUSEKEEPING]: {
    id: ModuleType.HOUSEKEEPING,
    name: 'Housekeeping',
    description: 'Manage room cleaning schedules and maintenance',
    icon: '🧹',
    category: 'operations'
  },
  [ModuleType.GATEWAY]: {
    id: ModuleType.GATEWAY,
    name: 'Payment Gateway',
    description: 'Process hotel payments and invoices',
    icon: '🏦',
    category: 'core'
  },
  [ModuleType.SPA_BOOKING]: {
    id: ModuleType.SPA_BOOKING,
    name: 'Spa Booking',
    description: 'Manage spa appointments and treatments',
    icon: '💆',
    category: 'customer'
  },
  [ModuleType.APPOINTMENTS]: {
    id: ModuleType.APPOINTMENTS,
    name: 'Appointments',
    description: 'Schedule and manage client appointments',
    icon: '⏰',
    category: 'core'
  },
  [ModuleType.CLIENTS]: {
    id: ModuleType.CLIENTS,
    name: 'Client Management',
    description: 'Manage client profiles and history',
    icon: '👤',
    category: 'customer'
  },
  [ModuleType.TREATMENTS]: {
    id: ModuleType.TREATMENTS,
    name: 'Treatments',
    description: 'Manage services and treatment offerings',
    icon: '✨',
    category: 'operations'
  },
  [ModuleType.SUPPLIERS]: {
    id: ModuleType.SUPPLIERS,
    name: 'Supplier Management',
    description: 'Manage suppliers and purchase orders',
    icon: '🚚',
    category: 'operations'
  },
  [ModuleType.BARCODE]: {
    id: ModuleType.BARCODE,
    name: 'Barcode Scanning',
    description: 'Scan barcodes for inventory and sales',
    icon: '📷',
    category: 'operations'
  },
  [ModuleType.DISCOUNTS]: {
    id: ModuleType.DISCOUNTS,
    name: 'Discounts & Promotions',
    description: 'Create and manage discounts and promotional offers',
    icon: '🏷️',
    category: 'customer'
  },
  [ModuleType.MEMBERSHIP]: {
    id: ModuleType.MEMBERSHIP,
    name: 'Membership Management',
    description: 'Manage gym memberships and plans',
    icon: '🎫',
    category: 'core'
  },
  [ModuleType.ATTENDANCE]: {
    id: ModuleType.ATTENDANCE,
    name: 'Attendance Tracking',
    description: 'Track member check-ins and attendance',
    icon: '✅',
    category: 'operations'
  },
  [ModuleType.CLASSES]: {
    id: ModuleType.CLASSES,
    name: 'Class Scheduling',
    description: 'Schedule and manage fitness classes',
    icon: '🏋️',
    category: 'operations'
  },
  [ModuleType.TRAINERS]: {
    id: ModuleType.TRAINERS,
    name: 'Trainer Management',
    description: 'Manage trainer schedules and assignments',
    icon: '💪',
    category: 'management'
  },
  [ModuleType.PATIENTS]: {
    id: ModuleType.PATIENTS,
    name: 'Patient Management',
    description: 'Manage patient records and information',
    icon: '🩺',
    category: 'core'
  },
  [ModuleType.APPOINTMENTS_MEDICAL]: {
    id: ModuleType.APPOINTMENTS_MEDICAL,
    name: 'Medical Appointments',
    description: 'Schedule and manage medical appointments',
    icon: '📅',
    category: 'core'
  },
  [ModuleType.PRESCRIPTIONS]: {
    id: ModuleType.PRESCRIPTIONS,
    name: 'Prescriptions',
    description: 'Manage prescriptions and medications',
    icon: '💊',
    category: 'operations'
  },
  [ModuleType.BILLING_MEDICAL]: {
    id: ModuleType.BILLING_MEDICAL,
    name: 'Medical Billing',
    description: 'Handle medical billing and insurance claims',
    icon: '💰',
    category: 'core'
  },
  [ModuleType.PROPERTIES]: {
    id: ModuleType.PROPERTIES,
    name: 'Property Management',
    description: 'Manage property listings and details',
    icon: '🏠',
    category: 'core'
  },
  [ModuleType.LEADS]: {
    id: ModuleType.LEADS,
    name: 'Lead Management',
    description: 'Track and manage potential clients',
    icon: '🎯',
    category: 'customer'
  },
  [ModuleType.VIEWINGS]: {
    id: ModuleType.VIEWINGS,
    name: 'Property Viewings',
    description: 'Schedule and manage property viewings',
    icon: '👁️',
    category: 'operations'
  },
  [ModuleType.CONTRACTS]: {
    id: ModuleType.CONTRACTS,
    name: 'Contract Management',
    description: 'Manage contracts and agreements',
    icon: '📄',
    category: 'management'
  },
  [ModuleType.VEHICLES]: {
    id: ModuleType.VEHICLES,
    name: 'Vehicle Inventory',
    description: 'Manage vehicle inventory and details',
    icon: '🚗',
    category: 'core'
  },
  [ModuleType.SERVICE_HISTORY]: {
    id: ModuleType.SERVICE_HISTORY,
    name: 'Service History',
    description: 'Track vehicle service and maintenance history',
    icon: '🔧',
    category: 'operations'
  },
  [ModuleType.PARTS]: {
    id: ModuleType.PARTS,
    name: 'Parts Inventory',
    description: 'Manage auto parts inventory',
    icon: '⚙️',
    category: 'operations'
  },
  [ModuleType.STUDENTS]: {
    id: ModuleType.STUDENTS,
    name: 'Student Management',
    description: 'Manage student records and enrollment',
    icon: '🎓',
    category: 'core'
  },
  [ModuleType.COURSES]: {
    id: ModuleType.COURSES,
    name: 'Course Management',
    description: 'Create and manage courses and curriculum',
    icon: '📚',
    category: 'core'
  },
  [ModuleType.ATTENDANCE_EDUCATION]: {
    id: ModuleType.ATTENDANCE_EDUCATION,
    name: 'Attendance',
    description: 'Track student attendance',
    icon: '📝',
    category: 'operations'
  },
  [ModuleType.GRADES]: {
    id: ModuleType.GRADES,
    name: 'Grade Management',
    description: 'Manage grades and academic records',
    icon: '🏆',
    category: 'management'
  }
};

// ============== INDUSTRY INFO ==============

export interface IndustryInfo {
  type: IndustryType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const INDUSTRY_INFO: Record<IndustryType, IndustryInfo> = {
  [IndustryType.RESTAURANT]: {
    type: IndustryType.RESTAURANT,
    name: 'Restaurant',
    description: 'Restaurants, cafes, bars, food trucks, and QSR',
    icon: '🍽️',
    color: '#FF6B6B'
  },
  [IndustryType.HOTEL]: {
    type: IndustryType.HOTEL,
    name: 'Hotel',
    description: 'Hotels, resorts, motels, and guesthouses',
    icon: '🏨',
    color: '#4ECDC4'
  },
  [IndustryType.SALON]: {
    type: IndustryType.SALON,
    name: 'Salon',
    description: 'Hair salons, beauty parlors, and grooming centers',
    icon: '💇',
    color: '#FFE66D'
  },
  [IndustryType.RETAIL]: {
    type: IndustryType.RETAIL,
    name: 'Retail',
    description: 'Shops, stores, boutiques, and malls',
    icon: '🛍️',
    color: '#95E1D3'
  },
  [IndustryType.GYM]: {
    type: IndustryType.GYM,
    name: 'Gym & Fitness',
    description: 'Gyms, fitness centers, and health clubs',
    icon: '🏋️',
    color: '#F38181'
  },
  [IndustryType.SPA]: {
    type: IndustryType.SPA,
    name: 'Spa & Wellness',
    description: 'Spas, wellness centers, and massage studios',
    icon: '🧘',
    color: '#AA96DA'
  },
  [IndustryType.HEALTHCARE]: {
    type: IndustryType.HEALTHCARE,
    name: 'Healthcare',
    description: 'Clinics, hospitals, and medical practices',
    icon: '🏥',
    color: '#7C83FD'
  },
  [IndustryType.EDUCATION]: {
    type: IndustryType.EDUCATION,
    name: 'Education',
    description: 'Schools, colleges, tuition centers, and training institutes',
    icon: '🎓',
    color: '#FCE38A'
  },
  [IndustryType.REAL_ESTATE]: {
    type: IndustryType.REAL_ESTATE,
    name: 'Real Estate',
    description: 'Real estate agencies, property management',
    icon: '🏠',
    color: '#52B788'
  },
  [IndustryType.AUTOMOTIVE]: {
    type: IndustryType.AUTOMOTIVE,
    name: 'Automotive',
    description: 'Car dealers, auto repair, and service centers',
    icon: '🚗',
    color: '#495057'
  },
  [IndustryType.GROCERY]: {
    type: IndustryType.GROCERY,
    name: 'Grocery',
    description: 'Grocery stores, supermarkets, and convenience stores',
    icon: '🛒',
    color: '#51CF66'
  },
  [IndustryType.PHARMACY]: {
    type: IndustryType.PHARMACY,
    name: 'Pharmacy',
    description: 'Pharmacies, drugstores, and medical shops',
    icon: '💊',
    color: '#339AF0'
  },
  [IndustryType.FASHION]: {
    type: IndustryType.FASHION,
    name: 'Fashion',
    description: 'Clothing stores, fashion boutiques, and apparel shops',
    icon: '👗',
    color: '#E599F7'
  },
  [IndustryType.FITNESS]: {
    type: IndustryType.FITNESS,
    name: 'Fitness',
    description: 'Yoga studios, dance classes, and sports centers',
    icon: '🧘',
    color: '#FF8787'
  },
  [IndustryType.OTHER]: {
    type: IndustryType.OTHER,
    name: 'Other',
    description: 'Other businesses and industries',
    icon: '📦',
    color: '#ADB5BD'
  }
};

// ============== ZOD SCHEMAS ==============

export const CreateBusinessSchema = z.object({
  name: z.string().min(2).max(100),
  industry: z.nativeEnum(IndustryType),
  ownerId: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  locale: z.string().optional(),
  settings: z.record(z.any()).optional()
});

export const UpdateBusinessSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  locale: z.string().optional(),
  settings: z.record(z.any()).optional(),
  isActive: z.boolean().optional()
});

export const EnableModuleSchema = z.object({
  moduleId: z.nativeEnum(ModuleType)
});

export const QueryBusinessSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  industry: z.nativeEnum(IndustryType).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// ============== RESPONSE TYPES ==============

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

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

// ============== ANALYTICS TYPES ==============

export interface BusinessAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  salesByDay: Array<{ date: string; revenue: number; orders: number }>;
  revenueByModule: Array<{ module: string; revenue: number }>;
}

// ============== REQUEST TYPES ==============

export interface AuthenticatedRequest {
  userId?: string;
  businessId?: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      businessId?: string;
    }
  }
}
